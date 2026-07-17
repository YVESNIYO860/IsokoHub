/**
 * sell.js — handles the "List Product" / "Edit Product" form.
 * selectedImages is kept on window._sellImages to avoid any closure/async-scope issues.
 */

// ── Global image store (avoids any async-closure ambiguity) ──
window._sellImages = [];

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
    const n = window._sellImages.length;
    if (n === 0) {
      countBadge.style.display = 'none';
    } else {
      countBadge.style.display = 'inline-flex';
      countBadge.textContent   = n + ' / 6 selected';
    }
  }

  /* ── Render thumbnail grid ── */
  function renderImagePreviews() {
    imagePreviewGrid.innerHTML = '';

    window._sellImages.forEach(function(file, index) {
      var objectUrl = URL.createObjectURL(file);

      var item       = document.createElement('div');
      item.className = 'image-preview-item';
      item.title     = file.name;

      // Thumbnail
      var img   = document.createElement('img');
      img.src   = objectUrl;
      img.alt   = 'Photo ' + (index + 1);
      img.addEventListener('click', (function(src, name) {
        return function() { openLightbox(src, name); };
      })(objectUrl, file.name));

      // Number badge
      var numBadge       = document.createElement('span');
      numBadge.className = 'preview-num-badge';
      numBadge.textContent = index + 1;

      // Remove button
      var removeBtn         = document.createElement('button');
      removeBtn.type        = 'button';
      removeBtn.className   = 'preview-remove-btn';
      removeBtn.textContent = '✕';
      removeBtn.title       = 'Remove this photo';
      removeBtn.addEventListener('click', (function(i) {
        return function(e) {
          e.stopPropagation();
          window._sellImages.splice(i, 1);
          renderImagePreviews();
          updateCountBadge();
        };
      })(index));

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
    window._sellImages.forEach(function(f) {
      seen[f.name + '-' + f.size + '-' + f.lastModified] = true;
    });

    newFiles.forEach(function(file) {
      if (window._sellImages.length >= 6) return;
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
    // Don't reset the value — keep the FileList intact so files aren't GC'd
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

  /* ── Edit-mode pre-fill ── */
  const urlParams    = new URLSearchParams(window.location.search);
  const editId       = urlParams.get('editId');
  let isEditing      = false;
  let existingImages = [];

  if (editId) {
    const product = await fetchProductById(editId);
    if (product && product.sellerId === user.id) {
      isEditing      = true;
      existingImages = Array.isArray(product.image) ? product.image : [product.image];

      document.querySelector('.sell-container h2').textContent = 'Edit Product';
      submitBtn.textContent                                    = 'Update Product';
      document.getElementById('prod-name').value              = product.name;
      document.getElementById('prod-category').value          = product.category;
      document.getElementById('prod-price').value             = product.price;
      document.getElementById('prod-description').value       = product.description;
      document.getElementById('prod-phone').value             = product.sellerPhone || '';
      document.getElementById('prod-district').value          = product.district    || '';
      if (product.condition) {
        document.getElementById('prod-condition').value = product.condition;
      }
    } else {
      window.location.href = 'dashboard.html';
    }
  }

  /* ── District dropdown ── */
  const districtSelect = document.getElementById('prod-district');
  districtSelect.innerHTML =
    '<option value="">Select your district</option>' +
    RWANDA_DISTRICTS.map(d => `<option value="${d}">${d}</option>`).join('');

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
      // If the global preview store is empty but the input has files,
      // preserve the selected files from the actual file input.
      const selectedInputFiles = Array.from(imageInput.files || []);
      const files = window._sellImages.length > 0
        ? window._sellImages.slice()
        : selectedInputFiles.slice();

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

      // Upload images (or reuse existing ones in edit mode)
      const imageUrls = files.length > 0
        ? await uploadProductImages(files)
        : existingImages;

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

      // Housing-specific
      const category     = categorySelect.value;
      const isHousing    = category === 'Houses & Rents';
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

      console.log('Product data to save:', productData);

      let uploadedVideoUrl = '';
      if (isHousing && videoFile) {
        progressLabel.textContent = 'Uploading video…';
        if (overlayText) overlayText.textContent = 'Uploading video…';
        if (overlaySubtext) overlaySubtext.textContent = 'Please wait';
        uploadedVideoUrl = await uploadHousingVideo(videoFile, user.id);
        progressLabel.textContent = 'Video uploaded ✓';
      }

      if (isEditing) {
        await updateProductData(editId, {
          ...productData,
          ...(isHousing ? { videoUrl: uploadedVideoUrl || productData.videoUrl } : {})
        });
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
