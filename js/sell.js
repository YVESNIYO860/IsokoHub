/**
 * sell.js — handles the "List Product" / "Edit Product" form.
 * selectedImages is kept on window._sellImages to avoid any closure/async-scope issues.
 */

// ── Global image stores (avoids any async-closure ambiguity) ──
window._sellImages = [];
let existingImages = [];

/* ══════════════════════════════════════════
   Image-picker helpers (run immediately so
   the file input works as soon as DOM is ready)
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const imageInput      = document.getElementById('prod-images');
  const imagePreviewGrid = document.getElementById('image-preview-grid');
  const dropZone        = document.getElementById('image-drop-zone');
  const countBadge      = document.getElementById('image-count-badge');

  if (!imageInput || !imagePreviewGrid || !dropZone) return;

  /* ── Update the "X / 6 selected" badge ── */
  function updateCountBadge() {
    const total = existingImages.length + window._sellImages.length;
    if (total === 0) {
      countBadge.style.display = 'none';
    } else {
      countBadge.style.display = 'inline-flex';
      countBadge.textContent   = total + ' / 6 selected';
    }
  }

  /* ── Render thumbnail grid ── */
  function renderImagePreviews() {
    imagePreviewGrid.innerHTML = '';

    const previewItems = [];
    existingImages.forEach(function(src, index) {
      previewItems.push({ type: 'existing', src: src, label: 'Existing image ' + (index + 1) });
    });
    window._sellImages.forEach(function(file, index) {
      previewItems.push({ type: 'new', file: file, label: file.name });
    });

    previewItems.forEach(function(itemData, index) {
      var item       = document.createElement('div');
      item.className = 'image-preview-item';
      item.title     = itemData.label;

      var img = document.createElement('img');
      if (itemData.type === 'existing') {
        img.src = itemData.src;
        img.alt = itemData.label;
        img.addEventListener('click', function() {
          openLightbox(itemData.src, itemData.label);
        });
      } else {
        var objectUrl = URL.createObjectURL(itemData.file);
        img.src = objectUrl;
        img.alt = itemData.label;
        img.addEventListener('click', function() {
          openLightbox(objectUrl, itemData.file.name);
        });
      }

      var numBadge       = document.createElement('span');
      numBadge.className = 'preview-num-badge';
      numBadge.textContent = index + 1;

      var removeBtn         = document.createElement('button');
      removeBtn.type        = 'button';
      removeBtn.className   = 'preview-remove-btn';
      removeBtn.textContent = '✕';
      removeBtn.title       = 'Remove this photo';
      removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (itemData.type === 'existing') {
          existingImages.splice(index, 1);
        } else {
          const newIndex = index - existingImages.length;
          window._sellImages.splice(newIndex, 1);
        }
        renderImagePreviews();
        updateCountBadge();
      });

      item.appendChild(img);
      item.appendChild(numBadge);
      item.appendChild(removeBtn);
      imagePreviewGrid.appendChild(item);
    });

    updateCountBadge();
  }

  /* ── Zoom-in lightbox ── */
  function openLightbox(src, name) {
    var win = window.open('', '_blank', 'width=700,height=700');
    if (win) {
      win.document.write(
        '<title>' + name + '</title>' +
        '<body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;">' +
        '<img src="' + src + '" style="max-width:98%;max-height:98vh;object-fit:contain;border-radius:8px;" /></body>'
      );
    }
  }

  /* ── Merge new File objects into the global store ── */
  function mergeFiles(newFiles) {
    var seen = {};
    existingImages.forEach(function(src, i) {
      seen['existing-' + i] = true;
    });
    window._sellImages.forEach(function(f) {
      seen[f.name + '-' + f.size + '-' + f.lastModified] = true;
    });

    newFiles.forEach(function(file) {
      if (existingImages.length + window._sellImages.length >= 6) return;
      if (!file.type.startsWith('image/')) return;
      var key = file.name + '-' + file.size + '-' + file.lastModified;
      if (!seen[key]) {
        window._sellImages.push(file);
        seen[key] = true;
      }
    });

    renderImagePreviews();
  }

  /* ── File input change ── */
  imageInput.addEventListener('change', function(e) {
    var files = Array.from(e.target.files || []);
    mergeFiles(files);
    imageInput.value = '';
  });

  /* ── Drag-and-drop ── */
  dropZone.addEventListener('dragenter', function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragover',  function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', function()  { dropZone.classList.remove('drag-over'); });
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    var files = Array.from(e.dataTransfer.files || []);
    mergeFiles(files);
  });

  window.renderImagePreviews = renderImagePreviews;
  window.mergeFiles = mergeFiles;
});

/* ══════════════════════════════════════════
   Main sell-page logic (runs after DOMContentLoaded
   so Firebase is ready)
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const form           = document.getElementById('sell-form');
  const errorEl        = document.getElementById('sell-error');
  const housingFields  = document.getElementById('housing-fields');
  const categorySelect = document.getElementById('prod-category');
  const conditionSelect= document.getElementById('prod-condition');
  const progressWrap   = document.getElementById('upload-progress-wrap');
  const progressBar    = document.getElementById('upload-progress-bar');
  const progressStatus = document.getElementById('upload-progress-status');
  const progressLabel  = document.getElementById('upload-progress-label');
  const submitBtn      = form.querySelector('button[type="submit"]');
  const imageInput     = document.getElementById('prod-images');
  const uploadOverlay  = document.getElementById('upload-overlay');
  const overlayText    = document.getElementById('upload-overlay-text');
  const overlaySubtext = document.getElementById('upload-overlay-subtext');
  const districtSelect = document.getElementById('prod-district');
  const videoFileInput  = document.getElementById('prod-video');
  const videoUrlInput   = document.getElementById('prod-video-url');
  const videoPreviewEl  = document.getElementById('prod-video-preview');
  const videoSourceLocal = document.getElementById('prod-video-source-local');
  const videoSourceUrl   = document.getElementById('prod-video-source-url');
  const isHousehubCheckbox = document.getElementById('prod-is-househub');
  // create capture location button and status (insert after district select)
  const captureBtn = document.createElement('button');
  captureBtn.type = 'button';
  captureBtn.id = 'capture-location-btn';
  captureBtn.className = 'btn btn-secondary';
  captureBtn.style.marginLeft = '8px';
  captureBtn.textContent = 'Use my location';
  const captureStatus = document.createElement('div');
  captureStatus.id = 'capture-location-status';
  captureStatus.style.fontSize = '0.9rem';
  captureStatus.style.color = '#64748b';
  captureStatus.style.marginTop = '6px';
  if (districtSelect && districtSelect.parentNode) {
    districtSelect.parentNode.appendChild(captureBtn);
    districtSelect.parentNode.appendChild(captureStatus);
  }

  // store captured coordinates here
  window._capturedSellerLocation = window._capturedSellerLocation || null;

  captureBtn.addEventListener('click', function() {
    if (!navigator.geolocation) {
      captureStatus.textContent = 'Geolocation not supported in this browser.';
      return;
    }
    captureStatus.textContent = 'Requesting location…';
    captureBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(function(pos) {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      window._capturedSellerLocation = { lat, lng };
      captureStatus.textContent = `Location captured (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
      // Optionally set prod-location field with readable lat/lng for user
      const locField = document.getElementById('prod-location');
      if (locField && !locField.value) locField.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      captureBtn.disabled = false;
    }, function(err) {
      console.error('Geolocation error', err);
      captureStatus.textContent = 'Unable to get location. Please enable location or try again.';
      captureBtn.disabled = false;
    }, { enableHighAccuracy: true, timeout: 15000 });
  });

  districtSelect.innerHTML =
    '<option value="">Select your district</option>' +
    RWANDA_DISTRICTS.map(d => `<option value="${d}">${d}</option>`).join('');

  /* ── Edit-mode pre-fill ── */
  const urlParams    = new URLSearchParams(window.location.search);
  const editId       = urlParams.get('editId');
  let isEditing      = false;
  existingImages = [];

  if (editId) {
    const product = await fetchProductById(editId);
    const productSellerId = product?.sellerId || product?.seller_id;
    if (product && productSellerId === user.id) {
      isEditing      = true;
      existingImages = Array.isArray(product.image) ? product.image : [product.image];

      // keep original price so we can store previous_price when updating
      window._editingOriginalPrice = Number(product.price || 0);

      document.querySelector('.sell-container h2').textContent = 'Edit Product';
      submitBtn.textContent                                    = 'Update Product';
      document.getElementById('prod-name').value              = product.name;
      document.getElementById('prod-category').value          = product.category;
      document.getElementById('prod-price').value             = product.price;
      document.getElementById('prod-description').value       = product.description;
      document.getElementById('prod-email').value             = product.sellerEmail || product.seller_email || user.email || '';
      document.getElementById('prod-phone').value             = product.sellerPhone || product.seller_phone || '';
      const districtParts = String(product.district || '').split(' • ');
      document.getElementById('prod-district').value          = districtParts[0] || '';
      document.getElementById('prod-location').value          = districtParts.slice(1).join(' • ').trim();
      document.getElementById('prod-property-type').value      = product.property_type || '';
      document.getElementById('prod-listing-type').value       = product.listing_type || '';
      if (product.condition) {
        document.getElementById('prod-condition').value = product.condition;
      }
      // Prefill video URL if present
      try {
        const existingVideo = product.videoUrl || product.video_url || product.video || '';
        if (existingVideo && videoUrlInput) {
          videoUrlInput.value = existingVideo;
          // render preview if preview element exists
          if (videoPreviewEl) {
            // use the helper once defined later; if not defined yet, setTimeout fallback
            setTimeout(() => { if (typeof renderVideoPreview === 'function') renderVideoPreview(existingVideo); else if (videoPreviewEl) videoPreviewEl.innerHTML = ''; }, 120);
          }
        }
      } catch (e) {
        console.warn('Unable to prefill video URL', e);
      }
      if (existingImages.length > 0) {
        renderImagePreviews();
      }
    } else {
      window.location.href = 'dashboard.html';
    }
  }

  const currentUser = getCurrentUser();
  if (currentUser?.email && document.getElementById('prod-email').value.trim() === '') {
    document.getElementById('prod-email').value = currentUser.email;
  }
  if (currentUser?.phone && document.getElementById('prod-phone').value.trim() === '') {
    document.getElementById('prod-phone').value = currentUser.phone;
  }

  /* ── Housing fields toggle ── */
  function toggleHousingFields() {
    const showHousing = categorySelect.value === 'Houses & Rents';
    housingFields.style.display = showHousing ? 'block' : 'none';
  }
  categorySelect.addEventListener('change', toggleHousingFields);
  toggleHousingFields();

  /* ────────────────────────────────────────
     Upload helpers
  ──────────────────────────────────────── */

  function clearVideoPreview() {
    if (!videoPreviewEl) return;
    videoPreviewEl.innerHTML = '';
  }

  function renderVideoPreview(url) {
    if (!videoPreviewEl || !url) return;
    clearVideoPreview();
    try {
      const lower = String(url).toLowerCase();
      if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
        // extract id
        let id = '';
        const m = url.match(/(?:v=|embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
        if (m && m[1]) id = m[1];
        if (!id) {
          const parts = url.split('/'); id = parts[parts.length - 1];
        }
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '320';
        iframe.src = 'https://www.youtube.com/embed/' + encodeURIComponent(id);
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.frameBorder = '0';
        iframe.loading = 'lazy';
        videoPreviewEl.appendChild(iframe);
        return;
      }
      // fallback: HTML5 video player
      const video = document.createElement('video');
      video.controls = true;
      video.style.maxWidth = '100%';
      video.style.maxHeight = '320px';
      video.src = url;
      videoPreviewEl.appendChild(video);
    } catch (err) {
      console.warn('Video preview error', err);
    }
  }

  if (videoUrlInput) {
    videoUrlInput.addEventListener('input', () => {
      const v = (videoUrlInput.value || '').trim();
      if (!v) return clearVideoPreview();
      renderVideoPreview(v);
    });
  }

  if (videoFileInput) {
    videoFileInput.addEventListener('change', () => {
      const f = videoFileInput.files && videoFileInput.files[0];
      if (!f) return;
      const blobUrl = URL.createObjectURL(f);
      renderVideoPreview(blobUrl);
    });
  }

  // Toggle video input visibility based on selected source
  function updateVideoSourceVisibility() {
    const useLocal = videoSourceLocal && videoSourceLocal.checked;
    if (videoFileInput) videoFileInput.disabled = !useLocal;
    if (videoUrlInput) videoUrlInput.disabled = useLocal;
    // Clear preview when switching
    clearVideoPreview();
    if (!useLocal && videoUrlInput && videoUrlInput.value) renderVideoPreview(videoUrlInput.value.trim());
    if (useLocal && videoFileInput && videoFileInput.files && videoFileInput.files[0]) renderVideoPreview(URL.createObjectURL(videoFileInput.files[0]));
  }
  try {
    if (videoSourceLocal) videoSourceLocal.addEventListener('change', updateVideoSourceVisibility);
    if (videoSourceUrl) videoSourceUrl.addEventListener('change', updateVideoSourceVisibility);
    updateVideoSourceVisibility();
  } catch (e) { /* ignore */ }

  async function uploadProductImages(files) {
    if (!supabase) throw new Error('Supabase storage is not available at this time.');

    // Check if user is authenticated with Supabase
    const session = supabase.auth.session();
    if (!session || !session.user) {
      throw new Error('You must be logged in with Supabase to upload images. Please sign in first.');
    }

    progressWrap.classList.add('visible');
    if (uploadOverlay) uploadOverlay.classList.add('visible');
    progressLabel.textContent  = 'Uploading photos…';
    progressBar.style.width    = '0%';
    progressStatus.textContent = '0 of ' + files.length + ' uploaded';
    if (overlayText) overlayText.textContent = 'Uploading photos… 0%';
    if (overlaySubtext) overlaySubtext.textContent = '0%';

    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const file     = files[i];
      const fileName = user.id + '_' + Date.now() + '_' + i + '_' + file.name.replace(/\s+/g, '_');
      const { data, error } = await supabase.storage
        .from(SUPABASE_IMAGE_BUCKET)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) {
        throw new Error(`Image upload failed for bucket "${SUPABASE_IMAGE_BUCKET}": ${error.message}`);
      }

      const { publicURL, error: urlError } = supabase.storage
        .from(SUPABASE_IMAGE_BUCKET)
        .getPublicUrl(fileName);

      if (urlError || !publicURL) {
        throw new Error('Unable to get image URL after upload.');
      }

      urls.push(publicURL);

      const pct = Math.round(((i + 1) / files.length) * 100);
      progressBar.style.width    = pct + '%';
      progressStatus.textContent = (i + 1) + ' of ' + files.length + ' uploaded';
      if (overlayText) overlayText.textContent = 'Uploading photos… ' + pct + '%';
      if (overlaySubtext) overlaySubtext.textContent = pct + '%';
    }

    progressBar.style.width = '100%';
    if (overlayText) overlayText.textContent = 'Sending to database…';
    if (overlaySubtext) overlaySubtext.textContent = 'Saving listing...';
    progressLabel.textContent = 'All photos uploaded ✓';
    return urls;
  }

  async function uploadHousingVideo(file, sellerId) {
    if (!supabase) throw new Error('Supabase storage is not available at this time.');
    
    // Check if user is authenticated with Supabase
    const session = supabase.auth.session();
    if (!session || !session.user) {
      throw new Error('You must be logged in with Supabase to upload videos. Please sign in first.');
    }
    
    const fileName = sellerId + '_' + Date.now() + '_' + file.name.replace(/\s+/g, '_');
    const { data, error } = await supabase.storage
      .from(SUPABASE_VIDEO_BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      throw new Error(`Video upload failed for bucket "${SUPABASE_VIDEO_BUCKET}": ${error.message}`);
    }

    const { publicURL, error: urlError } = supabase.storage
      .from(SUPABASE_VIDEO_BUCKET)
      .getPublicUrl(fileName);

    if (urlError || !publicURL) {
      throw new Error('Unable to get video URL after upload.');
    }

    return publicURL;
  }

  /* ────────────────────────────────────────
     Form submit
  ──────────────────────────────────────── */
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    errorEl.classList.add('d-none');
    errorEl.textContent = '';

    try {
      const files = window._sellImages.slice();
      console.log('[sell] submitting, images count:', files.length, files.map(f => f.name));

      if (!isEditing && files.length < 3) {
        throw new Error('Please upload at least 3 product photos.');
      }
      if (files.length > 6) {
        throw new Error('You can upload a maximum of 6 product photos.');
      }

      // Lock UI during upload
      submitBtn.disabled    = true;
      submitBtn.textContent = isEditing ? 'Updating…' : 'Uploading…';

      // Upload images or reuse existing ones in edit mode
      let imageUrls = existingImages.slice();
      if (window._sellImages.length > 0) {
        const uploadedUrls = await uploadProductImages(window._sellImages.slice());
        imageUrls = imageUrls.concat(uploadedUrls);
      }

      if (imageUrls.length < 3) {
        throw new Error('Please provide at least 3 product photos.');
      }

      // Validate price
      const priceValue = Number(document.getElementById('prod-price').value);
      if (!Number.isFinite(priceValue) || priceValue < 100) {
        throw new Error('Please enter a valid price in RWF (minimum 100).');
      }

      // Validate district
      const district = districtSelect.value.trim();
      if (!district) throw new Error('Please select your district.');
      const locationDetail = document.getElementById('prod-location').value.trim();
      const fullLocation = locationDetail ? `${district} • ${locationDetail}` : district;

      const sellerEmailValue = document.getElementById('prod-email').value.trim();
      if (!sellerEmailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmailValue)) {
        throw new Error('Please enter a valid seller email address.');
      }

      // Housing-specific
      const category     = categorySelect.value;
      const isHousing    = category === 'Houses & Rents';
      const propertyType = document.getElementById('prod-property-type').value.trim();
      const listingType  = document.getElementById('prod-listing-type').value.trim();
      const videoFile    = videoFileInput && videoFileInput.files ? videoFileInput.files[0] : null;
      const videoUrlVal  = videoUrlInput ? String(videoUrlInput.value || '').trim() : '';
      const useLocalVideo = videoSourceLocal ? videoSourceLocal.checked : !!videoFile;
      const isHousehub    = isHousehubCheckbox ? Boolean(isHousehubCheckbox.checked) : false;

      if (isHousing) {
        if (!propertyType) throw new Error('Please select a property type for the house listing.');
        if (!listingType)  throw new Error('Please choose a rental period for the listing.');
        if (useLocalVideo && !videoFile) throw new Error('Please upload a local house video or switch to Video URL.');
        if (!useLocalVideo && !videoUrlVal) throw new Error('Please provide a video URL or switch to Local upload.');
        if (videoFile && videoFile.size > 20 * 1024 * 1024) throw new Error('Video must be 20 MB or smaller.');
      }

      const condition = isHousing ? 'New' : conditionSelect.value;

      const productData = {
        name:        document.getElementById('prod-name').value,
        category,
        price:       Math.round(priceValue),
        currency:    'RWF',
        image:       imageUrls,
        description: document.getElementById('prod-description').value,
        condition,
        sellerEmail: sellerEmailValue,
        sellerPhone: document.getElementById('prod-phone').value,
        district: fullLocation,
        // attach captured seller coordinates when available
        ...(window._capturedSellerLocation ? { sellerLat: window._capturedSellerLocation.lat, sellerLng: window._capturedSellerLocation.lng } : {}),
        buyOnline: document.getElementById('prod-buy-online') ? Boolean(document.getElementById('prod-buy-online').checked) : false,
        isAd:        false,
        adRequested: false,
        sold: false,
        ...(isHousing ? { propertyType, listingType, videoUrl: '' } : {}),
        isHousehub: isHousehub
      };

      console.log('Product data to save:', productData);

      let uploadedVideoUrl = '';
      if (isHousing) {
        if (videoFile) {
          progressLabel.textContent = 'Uploading video…';
          if (overlayText) overlayText.textContent = 'Uploading video…';
          if (overlaySubtext) overlaySubtext.textContent = 'Please wait';
          uploadedVideoUrl = await uploadHousingVideo(videoFile, user.id);
          progressLabel.textContent = 'Video uploaded ✓';
        } else if (videoUrlVal) {
          // use provided external URL
          uploadedVideoUrl = videoUrlVal;
        }
      }

      if (isEditing) {
        const changes = {
          ...productData,
          ...(isHousing ? { videoUrl: uploadedVideoUrl || productData.videoUrl } : {})
        };
        // If price changed, keep previous_price to show strike-through in listings
        const originalPrice = Number(window._editingOriginalPrice || 0);
        if (Number(productData.price) !== originalPrice && originalPrice > 0) {
          changes.previousPrice = originalPrice;
        }
        await updateProductData(editId, changes);
        window._sellImages = []; // clear after success
        window.location.href = 'dashboard.html?message=Your listing was updated successfully.';
      } else {
        await createProduct({
          ...productData,
          ...(isHousing ? { videoUrl: uploadedVideoUrl } : {})
        });
        window._sellImages = []; // clear after success
        if (uploadOverlay) uploadOverlay.classList.remove('visible');
        window.location.href = 'dashboard.html?message=Your listing was added and sent to admin for review.';
      }

    } catch (err) {
      console.error('[sell] error:', err);
      const message = err.message || 'Error saving product. Please try again.';
      errorEl.textContent = message;
      errorEl.classList.remove('d-none');

      // Scroll to error
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Re-enable submit
      submitBtn.disabled    = false;
      submitBtn.textContent = isEditing ? 'Update Product' : 'List Product';
      progressWrap.classList.remove('visible');
      if (uploadOverlay) uploadOverlay.classList.remove('visible');
    }
  });
});
