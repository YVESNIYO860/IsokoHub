document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const form = document.getElementById('sell-form');
  const errorEl = document.getElementById('sell-error');
  const housingFields = document.getElementById('housing-fields');
  const categorySelect = document.getElementById('prod-category');
  const conditionSelect = document.getElementById('prod-condition');
  const imageInput = document.getElementById('prod-images');
  const imagePreviewGrid = document.getElementById('image-preview-grid');

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('editId');
  let isEditing = false;
  let existingImages = [];

  // Pre-fill form if editing
  if (editId) {
    const product = await fetchProductById(editId);
    if (product && product.sellerId === user.id) {
      isEditing = true;
      existingImages = Array.isArray(product.image) ? product.image : [product.image];

      document.querySelector('.sell-container h2').textContent = 'Edit Product';
      document.querySelector('button[type="submit"]').textContent = 'Update Product';
      
      document.getElementById('prod-name').value = product.name;
      document.getElementById('prod-category').value = product.category;
      document.getElementById('prod-price').value = product.price;
      document.getElementById('prod-description').value = product.description;
      document.getElementById('prod-phone').value = product.sellerPhone || '';
      document.getElementById('prod-district').value = product.district || '';
      
      if (product.condition) {
        document.getElementById('prod-condition').value = product.condition;
      }
    } else {
      window.location.href = 'dashboard.html';
    }
  }

  const districtSelect = document.getElementById('prod-district');
  districtSelect.innerHTML = '<option value="">Select your district</option>' + RWANDA_DISTRICTS.map(d => `<option value="${d}">${d}</option>`).join('');

  let selectedImages = [];

  const renderImagePreviews = () => {
    if (!imagePreviewGrid) return;
    imagePreviewGrid.innerHTML = selectedImages.map((file, index) => `
      <div class="image-preview-item" data-index="${index}" title="${file.name}">
        <img src="${URL.createObjectURL(file)}" alt="Preview ${index + 1}">
        <div class="preview-label">${index + 1}</div>
      </div>
    `).join('');

    imagePreviewGrid.querySelectorAll('.image-preview-item').forEach((item) => {
      item.addEventListener('click', () => {
        const index = Number(item.dataset.index);
        const file = selectedImages[index];
        if (!file) return;
        const img = new Image();
        img.src = URL.createObjectURL(file);
        const previewWindow = window.open('', '_blank', 'width=600,height=600');
        if (previewWindow) {
          previewWindow.document.write(`<title>${file.name}</title><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;"><img src="${img.src}" style="max-width:100%;max-height:100%;object-fit:contain;" /></body>`);
        }
      });
    });
  };

  imageInput.addEventListener('change', (event) => {
    const newFiles = Array.from(event.target.files || []).filter(file => file && file.type.startsWith('image/'));
    const seen = new Set(selectedImages.map(file => `${file.name}-${file.size}-${file.lastModified}`));
    const mergedFiles = [...selectedImages];

    newFiles.forEach((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!seen.has(key)) {
        mergedFiles.push(file);
        seen.add(key);
      }
    });

    selectedImages = mergedFiles.slice(0, 6);
    renderImagePreviews();
    event.target.value = '';
  });

  const toggleHousingFields = () => {
    const showHousing = categorySelect.value === 'Houses & Rents';
    housingFields.style.display = showHousing ? 'block' : 'none';
  };

  categorySelect.addEventListener('change', toggleHousingFields);
  toggleHousingFields();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const fileInput = document.getElementById('prod-images');
      const files = Array.from(fileInput.files || []).filter(file => file && file.type.startsWith('image/'));

      if (!isEditing && files.length < 3) {
        throw new Error('Please upload at least 3 product photos.');
      }
      if (files.length > 6) {
        throw new Error('Please upload no more than 6 product photos.');
      }

      const imageUrls = files.length > 0
        ? await uploadProductImages(files)
        : existingImages;

      if (imageUrls.length < 3) {
        throw new Error('Please provide at least 3 product photos.');
      }

      const priceValue = Number(document.getElementById('prod-price').value);
      if (!Number.isFinite(priceValue) || priceValue < 100) {
        throw new Error('Please enter a valid price in RWF (minimum 100).');
      }

      const district = districtSelect.value.trim();
      if (!district) {
        throw new Error('Please select your district.');
      }

      const category = categorySelect.value;
      const isHousing = category === 'Houses & Rents';
      const propertyType = document.getElementById('prod-property-type').value.trim();
      const listingType = document.getElementById('prod-listing-type').value.trim();
      const videoFile = document.getElementById('prod-video').files[0];

      if (isHousing) {
        if (!propertyType) throw new Error('Please select a property type for the house listing.');
        if (!listingType) throw new Error('Please choose a rental period for the listing.');
        if (!videoFile) throw new Error('Please upload a house video.');
        if (videoFile.size > 20 * 1024 * 1024) throw new Error('Video must be 20MB or smaller.');
      }

      const condition = isHousing ? 'New' : conditionSelect.value;

      const productData = {
        name: document.getElementById('prod-name').value,
        category,
        price: Math.round(priceValue),
        currency: 'RWF',
        image: imageUrls,
        description: document.getElementById('prod-description').value,
        condition,
        sellerPhone: document.getElementById('prod-phone').value,
        district,
        ...(isHousing ? {
          propertyType,
          listingType,
          videoUrl: ''
        } : {})
      };

      let uploadedVideoUrl = '';
      if (isHousing && videoFile) {
        uploadedVideoUrl = await uploadHousingVideo(videoFile, user.id);
      }

      if (isEditing) {
        await updateProductData(editId, { ...productData, ...(isHousing ? { videoUrl: uploadedVideoUrl || productData.videoUrl } : {}) });
        window.location.href = 'dashboard.html?message=Your listing was updated successfully.';
      } else {
        await createProduct({ ...productData, ...(isHousing ? { videoUrl: uploadedVideoUrl } : {}) });
        window.location.href = 'dashboard.html?message=Your listing was added and sent to admin for review.';
      }
    } catch (err) {
      console.error('Sell page error:', err);
      const message = err.message || 'Error saving product. Please try again.';
      errorEl.textContent = message;
      errorEl.classList.remove('d-none');
    }
  });

  async function uploadProductImages(files) {
    if (!storage) {
      throw new Error('Image upload is not available at this time.');
    }

    const uploadPromises = files.map(async (file, index) => {
      const fileName = `${user.id}_${Date.now()}_${index}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = storage.ref().child(`product-images/${user.id}/${fileName}`);
      const snapshot = await storageRef.put(file);
      return snapshot.ref.getDownloadURL();
    });

    return Promise.all(uploadPromises);
  }

  async function uploadHousingVideo(file, sellerId) {
    if (!storage) {
      throw new Error('Video upload is not available at this time.');
    }

    const fileName = `${sellerId}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storageRef = storage.ref().child(`house-videos/${sellerId}/${fileName}`);
    const snapshot = await storageRef.put(file);
    return snapshot.ref.getDownloadURL();
  }
});
