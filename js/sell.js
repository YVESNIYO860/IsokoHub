document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  /* ── DOM refs ── */
  const form            = document.getElementById('sell-form');
  const errorEl         = document.getElementById('sell-error');
  const housingFields   = document.getElementById('housing-fields');
  const categorySelect  = document.getElementById('prod-category');
  const conditionSelect = document.getElementById('prod-condition');
  const imageInput      = document.getElementById('prod-images');
  const imagePreviewGrid= document.getElementById('image-preview-grid');
  const dropZone        = document.getElementById('image-drop-zone');
  const countBadge      = document.getElementById('image-count-badge');
  const progressWrap    = document.getElementById('upload-progress-wrap');
  const progressBar     = document.getElementById('upload-progress-bar');
  const progressStatus  = document.getElementById('upload-progress-status');
  const progressLabel   = document.getElementById('upload-progress-label');
  const submitBtn       = form.querySelector('button[type="submit"]');

  /* ── Edit-mode setup ── */
  const urlParams = new URLSearchParams(window.location.search);
  const editId    = urlParams.get('editId');
  let isEditing   = false;
  let existingImages = [];

  if (editId) {
    const product = await fetchProductById(editId);
    if (product && product.sellerId === user.id) {
      isEditing      = true;
      existingImages = Array.isArray(product.image) ? product.image : [product.image];

      document.querySelector('.sell-container h2').textContent          = 'Edit Product';
      submitBtn.textContent                                             = 'Update Product';
      document.getElementById('prod-name').value                       = product.name;
      document.getElementById('prod-category').value                   = product.category;
      document.getElementById('prod-price').value                      = product.price;
      document.getElementById('prod-description').value                = product.description;
      document.getElementById('prod-phone').value                      = product.sellerPhone || '';
      document.getElementById('prod-district').value                   = product.district    || '';
      if (product.condition) document.getElementById('prod-condition').value = product.condition;
    } else {
      window.location.href = 'dashboard.html';
    }
  }

  /* ── District dropdown ── */
  const districtSelect = document.getElementById('prod-district');
  districtSelect.innerHTML =
    '<option value="">Select your district</option>' +
    RWANDA_DISTRICTS.map(d => `<option value="${d}">${d}</option>`).join('');

  /* ────────────────────────────────────────────
     Image accumulation state
  ──────────────────────────────────────────── */
  let selectedImages = []; // Array<File>

  /** Update the count badge in the drop-zone */
  const updateCountBadge = () => {
    const n = selectedImages.length;
    if (n === 0) {
      countBadge.style.display = 'none';
    } else {
      countBadge.style.display = 'inline-flex';
      countBadge.textContent   = `${n} / 6 selected`;
    }
  };

  /** Render thumbnail previews with a remove (✕) button on each */
  const renderImagePreviews = () => {
    if (!imagePreviewGrid) return;
    imagePreviewGrid.innerHTML = '';

    selectedImages.forEach((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      const item = document.createElement('div');
      item.className      = 'image-preview-item';
      item.dataset.index  = index;
      item.title          = file.name;

      // Thumbnail
      const img   = document.createElement('img');
      img.src     = objectUrl;
      img.alt     = `Photo ${index + 1}`;
      img.addEventListener('click', () => openImageLightbox(objectUrl, file.name));

      // Number badge
      const numBadge       = document.createElement('span');
      numBadge.className   = 'preview-num-badge';
      numBadge.textContent = index + 1;

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.type        = 'button';
      removeBtn.className   = 'preview-remove-btn';
      removeBtn.textContent = '✕';
      removeBtn.title       = 'Remove this photo';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedImages.splice(index, 1);
        renderImagePreviews();
        updateCountBadge();
      });

      item.append(img, numBadge, removeBtn);
      imagePreviewGrid.appendChild(item);
    });

    updateCountBadge();
  };

  /** Open a simple lightbox for zoom-in preview */
  const openImageLightbox = (src, name) => {
    const win = window.open('', '_blank', 'width=700,height=700');
    if (win) {
      win.document.write(
        `<title>${name}</title>` +
        `<body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;">` +
        `<img src="${src}" style="max-width:98%;max-height:98vh;object-fit:contain;border-radius:8px;" /></body>`
      );
    }
  };

  /* ── Merge new files into selectedImages (dedup by name+size+lastModified) ── */
  const mergeFiles = (newFiles) => {
    const seen = new Set(selectedImages.map(f => `${f.name}-${f.size}-${f.lastModified}`));
    newFiles.forEach(file => {
      if (selectedImages.length >= 6) return;
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!seen.has(key)) {
        selectedImages.push(file);
        seen.add(key);
      }
    });
    renderImagePreviews();
  };

  /* ── File input change ── */
  imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []).filter(f => f && f.type.startsWith('image/'));
    mergeFiles(files);
    // Reset the input so the same file can be re-selected if removed
    e.target.value = '';
  });

  /* ── Drag-and-drop on the drop zone ── */
  dropZone.addEventListener('dragenter', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', e => { dropZone.classList.remove('drag-over'); });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f => f && f.type.startsWith('image/'));
    mergeFiles(files);
  });

  /* ── Housing fields toggle ── */
  const toggleHousingFields = () => {
    const showHousing = categorySelect.value === 'Houses & Rents';
    housingFields.style.display = showHousing ? 'block' : 'none';
  };
  categorySelect.addEventListener('change', toggleHousingFields);
  toggleHousingFields();

  /* ────────────────────────────────────────────
     Upload helpers
  ──────────────────────────────────────────── */

  /** Upload all images one-by-one, updating the progress bar after each */
  async function uploadProductImages(files) {
    if (!storage) throw new Error('Image upload is not available at this time.');

    progressWrap.classList.add('visible');
    progressLabel.textContent  = 'Uploading photos…';
    progressBar.style.width    = '0%';
    progressStatus.textContent = `0 of ${files.length} uploaded`;

    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const file     = files[i];
      const fileName = `${user.id}_${Date.now()}_${i}_${file.name.replace(/\s+/g, '_')}`;
      const ref      = storage.ref().child(`product-images/${user.id}/${fileName}`);
      const snapshot = await ref.put(file);
      const url      = await snapshot.ref.getDownloadURL();
      urls.push(url);

      const pct = Math.round(((i + 1) / files.length) * 100);
      progressBar.style.width    = pct + '%';
      progressStatus.textContent = `${i + 1} of ${files.length} uploaded`;
    }

    progressLabel.textContent  = 'All photos uploaded ✓';
    return urls;
  }

  async function uploadHousingVideo(file, sellerId) {
    if (!storage) throw new Error('Video upload is not available at this time.');
    const fileName = `${sellerId}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const ref      = storage.ref().child(`house-videos/${sellerId}/${fileName}`);
    const snapshot = await ref.put(file);
    return snapshot.ref.getDownloadURL();
  }

  /* ────────────────────────────────────────────
     Form submit
  ──────────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('d-none');
    errorEl.textContent = '';

    try {
      /* ── Validate images ── */
      const files = selectedImages;

      if (!isEditing && files.length < 3) {
        throw new Error('Please upload at least 3 product photos.');
      }
      if (files.length > 6) {
        throw new Error('You can upload a maximum of 6 product photos.');
      }

      /* ── Disable submit button during upload ── */
      submitBtn.disabled    = true;
      submitBtn.textContent = isEditing ? 'Updating…' : 'Uploading…';

      /* ── Upload images or reuse existing ── */
      const imageUrls = files.length > 0
        ? await uploadProductImages(files)
        : existingImages;

      if (imageUrls.length < 3) {
        throw new Error('Please provide at least 3 product photos.');
      }

      /* ── Validate price ── */
      const priceValue = Number(document.getElementById('prod-price').value);
      if (!Number.isFinite(priceValue) || priceValue < 100) {
        throw new Error('Please enter a valid price in RWF (minimum 100).');
      }

      /* ── Validate district ── */
      const district = districtSelect.value.trim();
      if (!district) throw new Error('Please select your district.');

      /* ── Housing-specific validation ── */
      const category    = categorySelect.value;
      const isHousing   = category === 'Houses & Rents';
      const propertyType = document.getElementById('prod-property-type').value.trim();
      const listingType  = document.getElementById('prod-listing-type').value.trim();
      const videoFile    = document.getElementById('prod-video').files[0];

      if (isHousing) {
        if (!propertyType) throw new Error('Please select a property type for the house listing.');
        if (!listingType)  throw new Error('Please choose a rental period for the listing.');
        if (!videoFile)    throw new Error('Please upload a house video.');
        if (videoFile.size > 20 * 1024 * 1024) throw new Error('Video must be 20 MB or smaller.');
      }

      const condition = isHousing ? 'New' : conditionSelect.value;

      /* ── Build product payload ── */
      const productData = {
        name:        document.getElementById('prod-name').value,
        category,
        price:       Math.round(priceValue),
        currency:    'RWF',
        image:       imageUrls,
        description: document.getElementById('prod-description').value,
        condition,
        sellerPhone: document.getElementById('prod-phone').value,
        district,
        ...(isHousing ? { propertyType, listingType, videoUrl: '' } : {})
      };

      /* ── Upload video if housing ── */
      let uploadedVideoUrl = '';
      if (isHousing && videoFile) {
        progressLabel.textContent = 'Uploading video…';
        uploadedVideoUrl = await uploadHousingVideo(videoFile, user.id);
        progressLabel.textContent = 'Video uploaded ✓';
      }

      /* ── Save to Firestore ── */
      if (isEditing) {
        await updateProductData(editId, {
          ...productData,
          ...(isHousing ? { videoUrl: uploadedVideoUrl || productData.videoUrl } : {})
        });
        window.location.href = 'dashboard.html?message=Your listing was updated successfully.';
      } else {
        await createProduct({
          ...productData,
          ...(isHousing ? { videoUrl: uploadedVideoUrl } : {})
        });
        window.location.href = 'dashboard.html?message=Your listing was added and sent to admin for review.';
      }

    } catch (err) {
      console.error('Sell page error:', err);
      const message = err.message || 'Error saving product. Please try again.';
      errorEl.textContent = message;
      errorEl.classList.remove('d-none');

      // Reset button
      submitBtn.disabled    = false;
      submitBtn.textContent = isEditing ? 'Update Product' : 'List Product';
      progressWrap.classList.remove('visible');
    }
  });
});
