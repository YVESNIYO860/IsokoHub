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

  function removeImageBackground(file) {
    return new Promise(function(resolve, reject) {
      var objectUrl = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function() {
        URL.revokeObjectURL(objectUrl);
        var scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        var context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        var pixels = imageData.data;
        var width = canvas.width;
        var height = canvas.height;
        var visited = new Uint8Array(width * height);
        var queue = [];
        var background = [0, 0, 0];
        var samples = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
        samples.forEach(function(point) {
          var sampleIndex = (point[1] * width + point[0]) * 4;
          background[0] += pixels[sampleIndex];
          background[1] += pixels[sampleIndex + 1];
          background[2] += pixels[sampleIndex + 2];
        });
        background = background.map(function(value) { return value / samples.length; });

        function addPixel(x, y) {
          if (x < 0 || y < 0 || x >= width || y >= height) return;
          var position = y * width + x;
          if (visited[position]) return;
          var pixelIndex = position * 4;
          var distance = Math.sqrt(
            Math.pow(pixels[pixelIndex] - background[0], 2)
            + Math.pow(pixels[pixelIndex + 1] - background[1], 2)
            + Math.pow(pixels[pixelIndex + 2] - background[2], 2)
          );
          if (distance > 58 || pixels[pixelIndex + 3] === 0) return;
          visited[position] = 1;
          queue.push(position);
        }

        for (var x = 0; x < width; x += 1) {
          addPixel(x, 0);
          addPixel(x, height - 1);
        }
        for (var y = 1; y < height - 1; y += 1) {
          addPixel(0, y);
          addPixel(width - 1, y);
        }

        for (var cursor = 0; cursor < queue.length; cursor += 1) {
          var position = queue[cursor];
          var pixelIndex = position * 4;
          pixels[pixelIndex + 3] = 0;
          var currentX = position % width;
          var currentY = Math.floor(position / width);
          addPixel(currentX - 1, currentY);
          addPixel(currentX + 1, currentY);
          addPixel(currentX, currentY - 1);
          addPixel(currentX, currentY + 1);
        }

        context.putImageData(imageData, 0, 0);
        canvas.toBlob(function(blob) {
          if (!blob) {
            reject(new Error('Unable to create a transparent image.'));
            return;
          }
          var baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], baseName + '-no-background.png', { type: 'image/png', lastModified: Date.now() }));
        }, 'image/png');
      };
      image.onerror = function() {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Unable to read this image.'));
      };
      image.src = objectUrl;
    });
  }

  var editorState = null;

  function createImageEditor() {
    var modal = document.createElement('div');
    modal.className = 'image-editor-modal';
    modal.innerHTML = `
      <div class="image-editor-panel" role="dialog" aria-modal="true" aria-labelledby="image-editor-title">
        <div class="image-editor-header">
          <strong id="image-editor-title">Edit image</strong>
          <button type="button" class="image-editor-close" aria-label="Close image editor">&times;</button>
        </div>
        <div class="image-editor-stage"><canvas class="image-editor-canvas"></canvas></div>
        <div class="image-editor-controls">
          <label>Crop
            <select class="image-editor-ratio">
              <option value="original">Original</option>
              <option value="1">Square</option>
              <option value="0.8">Portrait</option>
              <option value="1.7778">Landscape</option>
            </select>
          </label>
          <label>Contrast <output class="image-editor-contrast-value">100%</output>
            <input class="image-editor-contrast" type="range" min="70" max="140" value="100">
          </label>
          <label>Brightness <output class="image-editor-brightness-value">100%</output>
            <input class="image-editor-brightness" type="range" min="70" max="130" value="100">
          </label>
          <label>Saturation <output class="image-editor-saturation-value">100%</output>
            <input class="image-editor-saturation" type="range" min="0" max="160" value="100">
          </label>
          <label>Zoom <output class="image-editor-zoom-value">100%</output>
            <input class="image-editor-zoom" type="range" min="100" max="180" value="100">
          </label>
        </div>
        <div class="image-editor-tools">
          <button type="button" class="image-editor-rotate"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> Rotate</button>
          <button type="button" class="image-editor-flip"><i class="fa-solid fa-arrows-left-right" aria-hidden="true"></i> Flip</button>
          <button type="button" class="image-editor-reset">Reset edits</button>
        </div>
        <div class="image-editor-actions">
          <button type="button" class="image-editor-remove-bg">Remove background</button>
          <button type="button" class="image-editor-cancel">Cancel</button>
          <button type="button" class="image-editor-apply">Apply changes</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    var canvas = modal.querySelector('.image-editor-canvas');
    var image = new Image();
    var ratioSelect = modal.querySelector('.image-editor-ratio');
    var contrastInput = modal.querySelector('.image-editor-contrast');
    var contrastValue = modal.querySelector('.image-editor-contrast-value');
    var brightnessInput = modal.querySelector('.image-editor-brightness');
    var brightnessValue = modal.querySelector('.image-editor-brightness-value');
    var saturationInput = modal.querySelector('.image-editor-saturation');
    var saturationValue = modal.querySelector('.image-editor-saturation-value');
    var zoomInput = modal.querySelector('.image-editor-zoom');
    var zoomValue = modal.querySelector('.image-editor-zoom-value');
    var rotation = 0;
    var flipped = false;

    function draw() {
      if (!image.naturalWidth) return;
      var sourceWidth = image.naturalWidth;
      var sourceHeight = image.naturalHeight;
      var ratio = ratioSelect.value === 'original' ? sourceWidth / sourceHeight : Number(ratioSelect.value);
      var cropWidth = sourceWidth;
      var cropHeight = sourceHeight;
      if (sourceWidth / sourceHeight > ratio) cropWidth = sourceHeight * ratio;
      else cropHeight = sourceWidth / ratio;
      var zoom = Number(zoomInput.value) / 100;
      cropWidth /= zoom;
      cropHeight /= zoom;
      var outputWidth = Math.min(1000, Math.round(cropWidth));
      var outputHeight = Math.max(1, Math.round(outputWidth / ratio));
      var quarterTurn = Math.abs(rotation % 180) === 90;
      canvas.width = quarterTurn ? outputHeight : outputWidth;
      canvas.height = quarterTurn ? outputWidth : outputHeight;
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.filter = `brightness(${brightnessInput.value}%) contrast(${contrastInput.value}%) saturate(${saturationInput.value}%)`;
      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(rotation * Math.PI / 180);
      context.scale(flipped ? -1 : 1, 1);
      context.drawImage(image, (sourceWidth - cropWidth) / 2, (sourceHeight - cropHeight) / 2, cropWidth, cropHeight, -outputWidth / 2, -outputHeight / 2, outputWidth, outputHeight);
      context.restore();
      context.filter = 'none';
      contrastValue.textContent = `${contrastInput.value}%`;
      brightnessValue.textContent = `${brightnessInput.value}%`;
      saturationValue.textContent = `${saturationInput.value}%`;
      zoomValue.textContent = `${zoomInput.value}%`;
    }

    function close() {
      modal.remove();
      editorState = null;
    }

    modal.querySelector('.image-editor-close').addEventListener('click', close);
    modal.querySelector('.image-editor-cancel').addEventListener('click', close);
    modal.addEventListener('click', function(event) { if (event.target === modal) close(); });
    ratioSelect.addEventListener('change', draw);
    contrastInput.addEventListener('input', draw);
    brightnessInput.addEventListener('input', draw);
    saturationInput.addEventListener('input', draw);
    zoomInput.addEventListener('input', draw);
    modal.querySelector('.image-editor-rotate').addEventListener('click', function() {
      rotation = (rotation + 90) % 360;
      draw();
    });
    modal.querySelector('.image-editor-flip').addEventListener('click', function() {
      flipped = !flipped;
      draw();
    });
    modal.querySelector('.image-editor-reset').addEventListener('click', function() {
      ratioSelect.value = 'original';
      contrastInput.value = '100';
      brightnessInput.value = '100';
      saturationInput.value = '100';
      zoomInput.value = '100';
      rotation = 0;
      flipped = false;
      draw();
    });

    modal.querySelector('.image-editor-remove-bg').addEventListener('click', async function(event) {
      var button = event.currentTarget;
      button.disabled = true;
      button.textContent = 'Processing…';
      try {
        editorState.file = await removeImageBackground(editorState.file);
        image.onload = draw;
        image.src = URL.createObjectURL(editorState.file);
      } catch (error) {
        button.textContent = 'Try again';
        button.disabled = false;
        return;
      }
      button.textContent = 'Background removed';
      button.disabled = false;
    });

    modal.querySelector('.image-editor-apply').addEventListener('click', function() {
      canvas.toBlob(function(blob) {
        if (!blob || !editorState) return;
        var baseName = editorState.file.name.replace(/\.[^.]+$/, '');
        window._sellImages[editorState.index] = new File([blob], baseName + '-edited.png', { type: 'image/png', lastModified: Date.now() });
        renderImagePreviews();
        close();
      }, 'image/png');
    });

    return { modal: modal, image: image, draw: draw };
  }

  function openImageEditor(index) {
    if (!window._sellImages[index]) return;
    editorState = { index: index, file: window._sellImages[index] };
    var editor = createImageEditor();
    editor.image.onload = editor.draw;
    editor.image.src = URL.createObjectURL(editorState.file);
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

      if (itemData.type === 'new') {
        var editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'preview-edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.title = 'Crop, adjust contrast, or remove background';
        editBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          openImageEditor(index - existingImages.length);
        });
        item.appendChild(editBtn);

        var backgroundBtn = document.createElement('button');
        backgroundBtn.type = 'button';
        backgroundBtn.className = 'preview-background-btn';
        backgroundBtn.textContent = 'Remove background';
        backgroundBtn.title = 'Remove the connected background from this image';
        backgroundBtn.addEventListener('click', async function(e) {
          e.stopPropagation();
          var newIndex = index - existingImages.length;
          backgroundBtn.disabled = true;
          backgroundBtn.textContent = 'Processing…';
          try {
            window._sellImages[newIndex] = await removeImageBackground(window._sellImages[newIndex]);
            renderImagePreviews();
          } catch (error) {
            backgroundBtn.disabled = false;
            backgroundBtn.textContent = 'Try again';
            console.warn('Unable to remove image background:', error);
          }
        });
        item.appendChild(backgroundBtn);
      }

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
      if (product.condition) {
        document.getElementById('prod-condition').value = product.condition;
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

  /* ────────────────────────────────────────
     Form submit
  ──────────────────────────────────────── */
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    errorEl.classList.add('d-none');
    errorEl.textContent = '';

    try {
      const files = window._sellImages.slice();
      const category = categorySelect.value;
      console.log('[sell] submitting, images count:', files.length, files.map(f => f.name));

      if (!isEditing && files.length < 1) {
        throw new Error('Please upload at least 1 product photo.');
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

      if (imageUrls.length < 1) {
        throw new Error('Please provide at least 1 product photo.');
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

      const productData = {
        name:        document.getElementById('prod-name').value,
        category,
        price:       Math.round(priceValue),
        currency:    'RWF',
        image:       imageUrls,
        description: document.getElementById('prod-description').value,
        condition: conditionSelect.value,
        sellerEmail: sellerEmailValue,
        sellerPhone: document.getElementById('prod-phone').value,
        district: fullLocation,
        // attach captured seller coordinates when available
        buyOnline: document.getElementById('prod-buy-online') ? Boolean(document.getElementById('prod-buy-online').checked) : false,
        isAd:        false,
        adRequested: false,
        sold: false,
      };

      console.log('Product data to save:', productData);

      if (isEditing) {
        const changes = { ...productData };
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
          ...productData
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
