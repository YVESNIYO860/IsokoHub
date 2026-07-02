document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const form = document.getElementById('sell-form');
  const errorEl = document.getElementById('sell-error');

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('editId');
  let isEditing = false;

  // Pre-fill form if editing
  if (editId) {
    const product = await fetchProductById(editId);
    if (product && product.sellerId === user.id) {
      isEditing = true;
      document.querySelector('.sell-container h2').textContent = 'Edit Product';
      document.querySelector('button[type="submit"]').textContent = 'Update Product';
      
      document.getElementById('prod-name').value = product.name;
      document.getElementById('prod-category').value = product.category;
      document.getElementById('prod-price').value = product.price;
      document.getElementById('prod-description').value = product.description;
      document.getElementById('prod-phone').value = product.sellerPhone || '';
      
      if (product.condition) {
        document.getElementById('prod-condition').value = product.condition;
      }

      // Fill images
      const imageInputs = document.querySelectorAll('.prod-image');
      const imagesArr = Array.isArray(product.image) ? product.image : [product.image];
      imagesArr.forEach((img, idx) => {
        if (imageInputs[idx]) imageInputs[idx].value = img;
      });
    } else {
      window.location.href = 'dashboard.html';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const imageInputs = document.querySelectorAll('.prod-image');
      const images = Array.from(imageInputs)
                          .map(input => input.value.trim())
                          .filter(val => val !== '');

      if (images.length < 3) {
        throw new Error('Please provide at least 3 product images.');
      }

      const productData = {
        name: document.getElementById('prod-name').value,
        category: document.getElementById('prod-category').value,
        price: parseFloat(document.getElementById('prod-price').value),
        image: images,
        description: document.getElementById('prod-description').value,
        condition: document.getElementById('prod-condition').value,
        sellerPhone: document.getElementById('prod-phone').value,
        sellerId: user.id
      };

      if (isEditing) {
        await updateProductData(editId, productData);
      } else {
        await createProduct(productData);
      }

      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error(err);
      errorEl.textContent = 'Error saving product. Please try again.';
      errorEl.classList.remove('d-none');
    }
  });
});
