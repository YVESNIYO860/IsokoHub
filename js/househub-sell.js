document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html?redirect=househub-sell.html';
    return;
  }

  const form = document.getElementById('househub-form');
  const imageInput = document.getElementById('house-images');
  const videoInput = document.getElementById('house-video');
  const imageStatus = document.getElementById('house-image-status');
  const videoUrlInput = document.getElementById('house-video-url');
  const localVideoField = document.getElementById('house-local-video-field');
  const urlVideoField = document.getElementById('house-url-video-field');
  const status = document.getElementById('house-form-status');
  const submitButton = form.querySelector('button[type="submit"]');
  const maxImages = 6;
  const maxVideoBytes = 20 * 1024 * 1024;

  function selectedVideoSource() {
    return form.querySelector('input[name="videoSource"]:checked')?.value || 'local';
  }

  form.querySelectorAll('input[name="videoSource"]').forEach((input) => {
    input.addEventListener('change', () => {
      const useUrl = selectedVideoSource() === 'url';
      localVideoField.hidden = useUrl;
      urlVideoField.hidden = !useUrl;
      if (useUrl) videoInput.value = '';
      else videoUrlInput.value = '';
    });
  });

  function selectedImages() {
    return Array.from(imageInput.files || []).filter((file) => file.type.startsWith('image/')).slice(0, maxImages);
  }

  imageInput.addEventListener('change', () => {
    const count = selectedImages().length;
    imageStatus.textContent = count ? `${count} photo${count === 1 ? '' : 's'} ready.` : 'Choose at least one image.';
    if ((imageInput.files || []).length > maxImages) {
      imageStatus.textContent = 'Only the first 6 photos will be used.';
    }
  });

  async function uploadImages(files, sellerId) {
    const urls = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${sellerId}/househub-${Date.now()}-${index}-${safeName}`;
      const { error } = await supabase.storage.from(SUPABASE_IMAGE_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw new Error(`Photo upload failed: ${error.message}`);
      const { publicURL, error: urlError } = supabase.storage.from(SUPABASE_IMAGE_BUCKET).getPublicUrl(path);
      if (urlError || !publicURL) throw new Error('Could not create a public photo URL.');
      urls.push(publicURL);
    }
    return urls;
  }

  async function uploadVideo(file, sellerId) {
    if (!file) return '';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${sellerId}/househub-${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from(SUPABASE_VIDEO_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw new Error(`Video upload failed: ${error.message}`);
    const { publicURL, error: urlError } = supabase.storage.from(SUPABASE_VIDEO_BUCKET).getPublicUrl(path);
    if (urlError || !publicURL) throw new Error('Could not create a public video URL.');
    return publicURL;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const files = selectedImages();
    const video = videoInput.files?.[0] || null;
    const videoSource = selectedVideoSource();
    const externalVideoUrl = videoUrlInput.value.trim();
    if (files.length < 1) { status.textContent = 'Please add at least one property photo.'; return; }
    if (videoSource === 'url' && !externalVideoUrl) { status.textContent = 'Please provide a property video URL.'; return; }
    if (videoSource === 'url' && !/^https?:\/\//i.test(externalVideoUrl)) { status.textContent = 'Video URL must start with http:// or https://.'; return; }
    if (videoSource === 'local' && video && !video.type.startsWith('video/')) { status.textContent = 'Please choose a valid video file.'; return; }
    if (video && video.size > maxVideoBytes) { status.textContent = 'The property video must be 20 MB or smaller.'; return; }

    submitButton.disabled = true;
    status.textContent = 'Uploading property media...';
    try {
      const session = supabase.auth.session();
      if (!session?.user) throw new Error('Please sign in again before posting a property.');
      const imageUrls = await uploadImages(files, session.user.id);
      const videoUrl = videoSource === 'url' ? externalVideoUrl : await uploadVideo(video, session.user.id);
      const description = [
        values.description.trim(),
        `Bedrooms: ${values.bedrooms || 'Not specified'}`,
        `Bathrooms: ${values.bathrooms || 'Not specified'}`,
        `Furnished: ${values.furnished}`,
        `Amenities: ${values.amenities || 'Not specified'}`,
        `Payment period: ${values.period}`
      ].join('\n');

      const product = await createProduct({
        name: values.name.trim(),
        category: 'Houses & Rents',
        propertyType: values.propertyType,
        listingType: values.listingType,
        price: Number(values.price),
        image: imageUrls,
        videoUrl,
        description,
        sellerEmail: values.sellerEmail.trim(),
        sellerPhone: values.sellerPhone.trim(),
        district: `${values.district.trim()} • ${values.location.trim()}`,
        isHousehub: true,
        buyOnline: false
      });
      const { error: househubError } = await supabase.from('househub_listings').upsert([{
        product_id: product.id,
        seller_id: session.user.id,
        title: values.name.trim(),
        property_type: values.propertyType,
        listing_type: values.listingType,
        price: Number(values.price),
        currency: 'RWF',
        payment_period: values.period,
        bedrooms: values.bedrooms ? Number(values.bedrooms) : null,
        bathrooms: values.bathrooms ? Number(values.bathrooms) : null,
        furnished: values.furnished,
        amenities: values.amenities.trim(),
        district: values.district.trim(),
        location: values.location.trim(),
        description: values.description.trim(),
        image: imageUrls,
        video_url: videoUrl || null,
        status: 'pending'
      }], { onConflict: 'product_id' });
      if (househubError) throw househubError;
      status.textContent = 'HouseHub listing submitted for review.';
      form.reset();
      imageStatus.textContent = '';
    } catch (error) {
      console.error('HouseHub listing error:', error);
      status.textContent = error?.message || 'Unable to submit the property listing.';
    } finally {
      submitButton.disabled = false;
    }
  });
});
