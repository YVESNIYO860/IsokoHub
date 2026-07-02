document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const wrapper = document.getElementById('product-wrapper');

  if (!productId) {
    wrapper.innerHTML = `
      <div style="text-align: center; padding: 5rem;">
        <h2 class="text-danger">Product Not Found</h2>
        <a href="products.html" class="btn btn-primary mt-2">Back to Products</a>
      </div>
    `;
    return;
  }

  wrapper.innerHTML = `
    <div style="text-align: center; padding: 5rem;">
      <i class="fa-solid fa-spinner fa-spin fa-3x"></i>
      <p class="mt-2">Loading product details...</p>
    </div>
  `;

  const product = await fetchProductById(productId);

  // Security: If product doesn't exist or is not approved, don't show it to public
  if (!product || (product.status !== 'approved' && getCurrentUser()?.email !== 'yvesniyonkuru2022@gmail.com')) {
    wrapper.innerHTML = `
      <div style="text-align: center; padding: 5rem;">
        <h2 class="text-danger">Product Not Found</h2>
        <p class="text-muted mt-1">This product may have been removed, not yet approved, or does not exist.</p>
        <a href="products.html" class="btn btn-primary mt-2">Back to Products</a>
      </div>
    `;
    return;
  }

  // Update Page Title
  document.title = `${product.name} - EasyMarket`;

  const images = Array.isArray(product.image) ? product.image : [product.image];
  const mainImage = images[0];

  const contactButtonMsg = encodeURIComponent(`Hi, I'm interested in your product: ${product.name} listed on EasyMarket.`);
  const waMessage = encodeURIComponent(`Hi, I saw your product "${product.name}" on EasyMarket and I'm interested!`);

  wrapper.innerHTML = `
    <div class="product-detail-container">
      <div class="product-image-box">
        <div style="width:100%; text-align:center;">
          <img src="${mainImage}" id="main-product-image" alt="${product.name}" class="product-main-img" onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
          
          ${images.length > 1 ? `
            <div class="gallery-thumbnails">
              ${images.map((img, idx) => `
                <img src="${img}" class="thumbnail-item ${idx === 0 ? 'active' : ''}" 
                     onclick="document.getElementById('main-product-image').src='${img}'; 
                              document.querySelectorAll('.thumbnail-item').forEach(t=>t.classList.remove('active'));
                              this.classList.add('active');" 
                     onerror="this.style.display='none'">
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
      <div class="product-info-box">
        <div class="pd-header">
          <div class="pd-category">${product.category}</div>
          <span class="pd-badge ${product.condition === 'New' ? 'badge-new' : 'badge-used'}">${product.condition || 'Used'}</span>
          <h1 class="pd-title">${product.name}</h1>
          <div class="pd-rating">
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star-half-stroke"></i>
            <span style="color:#007185; margin-left:5px;">(4.5 / 5)</span>
          </div>
        </div>

        <div class="pd-price-row">
           <div class="pd-price-label">Price:</div>
           <div class="pd-price">${formatPrice(product.price)}</div>
        </div>

        <div class="pd-description">
          <strong>About this item:</strong><br>
          ${product.description.replace(/\n/g, '<br>')}
        </div>

        <div style="margin-top: 2rem;">
          <button id="add-to-cart-btn" class="btn btn-primary btn-block" style="background:#febd69; color:#131921; border:none; padding:1rem; font-size:1.1rem;">
            <i class="fa-solid fa-cart-plus"></i> Add to Cart
          </button>
        </div>
        
        <div class="contact-seller-card">
          <h4 style="margin-bottom:1rem;">Contact Seller</h4>
          <div class="pd-actions" style="display:flex; flex-direction:column; gap:0.8rem;">
            <a href="mailto:seller_${product.sellerId}@easymarket.com?subject=Enquiry about ${product.name}&body=${contactButtonMsg}" class="btn btn-primary btn-block">
              <i class="fa-solid fa-envelope"></i> Send Email
            </a>
            
            ${product.sellerPhone ? `
              <a href="https://wa.me/${product.sellerPhone.replace(/\D/g,'')}?text=${waMessage}" target="_blank" class="btn btn-secondary btn-block" style="background:#25d366; color:white; border:none;">
                <i class="fa-brands fa-whatsapp"></i> Chat on WhatsApp
              </a>
              <a href="tel:${product.sellerPhone}" class="btn btn-secondary btn-block">
                <i class="fa-solid fa-phone"></i> Call ${product.sellerPhone}
              </a>
            ` : `
               <p class="text-muted" style="font-size:0.8rem;">No phone number provided by seller.</p>
            `}
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Description Sections -->
    <div class="pd-details-section">
      <h3 class="pd-section-title">Product Specifications</h3>
      <div class="pd-specs-grid">
        <div class="spec-label">Brand</div><div class="spec-value">Authentic ${product.category} Brand</div>
        <div class="spec-label">Model Name</div><div class="spec-value">${product.name}</div>
        <div class="spec-label">Condition</div><div class="spec-value">${product.condition || 'Standard Working'}</div>
        <div class="spec-label">Availability</div><div class="spec-value">In Stock</div>
      </div>
    </div>

    <div class="pd-details-section">
      <h3 class="pd-section-title">Key Features</h3>
      <ul class="feature-list">
        <li>Premium quality materials ensuring durability and long-term use.</li>
        <li>Rigorous quality check performed by our expert team.</li>
        <li>Exceptional value for money compared to standard market rates.</li>
        <li>Fast delivery options available across the region.</li>
      </ul>
    </div>
  `;

  // Attach Add to Cart listener
  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    addToCart(product);
  });
});
