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

  document.title = `${product.name} - IsokoHub`;

  const images = Array.isArray(product.image) ? product.image.filter(Boolean) : [product.image].filter(Boolean);
  const mainImage = images[0] || 'https://via.placeholder.com/600x600?text=No+Image';
  const reviewKey = `isoko-product-reviews-${productId}`;
  const reviews = getStoredReviews(reviewKey);
  const averageRating = reviews.length ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';

  const sellerPhone = product.seller_phone ? String(product.seller_phone).trim() : '';
  const sellerEmail = product.seller_email ? String(product.seller_email).trim() : (product.sellerEmail ? String(product.sellerEmail).trim() : '');

  wrapper.innerHTML = `
    <div class="product-detail-shell">
      <div class="product-gallery-card">
        <div class="gallery-main">
          ${images.length > 1 ? `<button class="gallery-nav gallery-prev" type="button" id="gallery-prev" aria-label="Previous image"><i class="fa-solid fa-chevron-left"></i></button>` : ''}
          <img src="${mainImage}" id="main-product-image" alt="${product.name}" class="product-main-img" onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
          ${images.length > 1 ? `<button class="gallery-nav gallery-next" type="button" id="gallery-next" aria-label="Next image"><i class="fa-solid fa-chevron-right"></i></button>` : ''}
          <button class="gallery-zoom-btn" type="button" id="gallery-zoom-btn"><i class="fa-solid fa-maximize"></i> Zoom</button>
        </div>

        ${images.length > 1 ? `
          <div class="gallery-thumbs">
            ${images.map((img, idx) => `
              <button type="button" class="gallery-thumb ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="View image ${idx + 1}">
                <img src="${img}" alt="${product.name} ${idx + 1}" onerror="this.style.display='none'">
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="product-info-card" id="product-description-panel">
        <div class="pd-header">
          <div class="pd-category">${product.category}</div>
          <span class="pd-badge ${product.condition === 'New' ? 'badge-new' : 'badge-used'}">${product.condition || 'Used'}</span>
          <h1 class="pd-title">${product.name}</h1>
          <div class="review-summary" id="review-summary">
            <div class="review-summary-stars">${buildStarsMarkup(Number(averageRating))}</div>
            <div class="review-summary-score">${averageRating} / 5</div>
            <div class="review-summary-count">${reviews.length} review${reviews.length === 1 ? '' : 's'}</div>
          </div>
        </div>

        <div class="pd-price-row">
          <div class="pd-price-label">Price:</div>
          <div class="pd-price">${formatPrice(product.price)}</div>
        </div>

        <div class="pd-description" style="margin-top: 0.5rem;">
          <strong>Location:</strong><br>
          <i class="fa-solid fa-location-dot"></i> ${product.district || 'District not set'}
        </div>

        <div class="pd-description">
          <strong>Contact Seller:</strong><br>
          ${sellerPhone ? `<div><i class="fa-solid fa-phone"></i> ${sellerPhone}</div>` : ''}
          ${sellerEmail ? `<div><i class="fa-solid fa-envelope"></i> ${sellerEmail}</div>` : '<div class="text-muted">Seller contact details will be added soon.</div>'}
        </div>

        <div class="pd-description">
          <strong>About this item:</strong><br>
          ${escapeHtml(product.description || '').replace(/\n/g, '<br>')}
        </div>

        <div class="product-actions" style="display:flex; flex-direction:column; gap:0.75rem;">
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
            <a href="${sellerPhone ? `https://wa.me/${sellerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, I am interested in your listing: ${product.name}`)}` : '#'}" target="_blank" rel="noopener" class="btn btn-block" style="flex:1; min-width: 120px; border-radius: 999px; background: #16a34a; color: white; border: 1px solid #16a34a; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.25rem; padding:0.8rem 0.6rem; ${sellerPhone ? '' : 'opacity:0.6; pointer-events:none;'}">
              <i class="fa-brands fa-whatsapp" style="font-size: 1.1rem;"></i>
              <span style="font-size:0.82rem; font-weight:700;">WhatsApp</span>
            </a>
            <a href="${sellerEmail ? `mailto:${sellerEmail}?subject=${encodeURIComponent(`Question about ${product.name}`)}` : '#'}" class="btn btn-block" style="flex:1; min-width: 120px; border-radius: 999px; background: #2563eb; color: white; border: 1px solid #2563eb; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.25rem; padding:0.8rem 0.6rem; ${sellerEmail ? '' : 'opacity:0.6; pointer-events:none;'}">
              <i class="fa-solid fa-envelope" style="font-size: 1.1rem;"></i>
              <span style="font-size:0.82rem; font-weight:700;">Email</span>
            </a>
          </div>
          <button id="add-to-cart-btn" class="btn btn-primary btn-block add-cart-btn" style="border-radius: 999px;">
            <i class="fa-solid fa-cart-plus"></i> Add to Cart
          </button>
        </div>

        <div class="review-card">
          <div class="review-card-header">
            <h3>Ratings & Reviews</h3>
            <p>Share your experience after adding your email.</p>
          </div>

          <form id="review-form" class="review-form">
            <label class="form-label" for="review-email">Your email</label>
            <input id="review-email" type="email" class="form-control" placeholder="name@example.com" required>

            <label class="form-label">Your rating</label>
            <div class="rating-picker" id="rating-picker">
              ${[1, 2, 3, 4, 5].map((value) => `<button type="button" class="rating-star" data-value="${value}" aria-label="Rate ${value} star${value > 1 ? 's' : ''}"><i class="fa-solid fa-star"></i></button>`).join('')}
            </div>

            <label class="form-label" for="review-comment">Your comment</label>
            <textarea id="review-comment" class="form-control review-textarea" rows="4" placeholder="Tell others what you liked or disliked..." required></textarea>

            <button type="submit" class="btn btn-primary btn-block">Submit review</button>
          </form>

          <div class="review-list" id="review-list">
            ${renderReviewList(reviews)}
          </div>
        </div>
      </div>
    </div>

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
      <h3 class="pd-section-title">Verification Summary</h3>
      <div id="product-summary" class="pd-summary-card">Generating summary for verification...</div>
    </div>

    <!-- AI assistant temporarily disabled -->

    <div class="pd-details-section">
      <h3 class="pd-section-title">Key Features</h3>
      <ul class="feature-list">
        <li>Premium quality materials ensuring durability and long-term use.</li>
        <li>Rigorous quality check performed by our expert team.</li>
        <li>Exceptional value for money compared to standard market rates.</li>
        <li>Fast delivery options available across the region.</li>
      </ul>
    </div>

    <div class="gallery-modal" id="gallery-modal" aria-hidden="true">
      <div class="gallery-modal-backdrop" data-close="true"></div>
      <div class="gallery-modal-body">
        <button class="gallery-modal-close" type="button" id="gallery-modal-close" aria-label="Close zoom view"><i class="fa-solid fa-xmark"></i></button>
        ${images.length > 1 ? `<button class="gallery-modal-nav gallery-modal-prev" type="button" id="gallery-modal-prev" aria-label="Previous image"><i class="fa-solid fa-chevron-left"></i></button>` : ''}
        <img src="${mainImage}" id="gallery-modal-image" alt="${product.name}" class="gallery-modal-image" onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
        ${images.length > 1 ? `<button class="gallery-modal-nav gallery-modal-next" type="button" id="gallery-modal-next" aria-label="Next image"><i class="fa-solid fa-chevron-right"></i></button>` : ''}
        <div class="gallery-controls">
          <button type="button" id="gallery-zoom-out" aria-label="Zoom out"><i class="fa-solid fa-minus"></i></button>
          <button type="button" id="gallery-zoom-reset" aria-label="Reset zoom"><i class="fa-solid fa-rotate-left"></i></button>
          <button type="button" id="gallery-zoom-in" aria-label="Zoom in"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
    </div>
  `;

  let activeImageIndex = 0;
  let selectedRating = 0;
  let zoomLevel = 1;
  const mainImageEl = document.getElementById('main-product-image');
  const modal = document.getElementById('gallery-modal');
  const modalImage = document.getElementById('gallery-modal-image');
  const reviewForm = document.getElementById('review-form');
  const reviewList = document.getElementById('review-list');
  const ratingPicker = document.getElementById('rating-picker');
  const productSummaryEl = document.getElementById('product-summary');

  const aiQuestionInput = document.getElementById('ai-question-input');
  const aiQuestionBtn = document.getElementById('ai-question-btn');
  const aiResponseEl = document.getElementById('ai-response');

  if (productSummaryEl) {
    fetchProductSummary(product)
      .then((summary) => {
        productSummaryEl.textContent = summary;
      })
      .catch((err) => {
        console.error('Summary generation error:', err);
        productSummaryEl.textContent = 'Summary unavailable. Start the local Claude proxy with "npm run claude-proxy" and ensure it is reachable on port 3001.';
      });
  }

  // AI assistant functionality removed/disabled for now.

  function updateActiveImage(index) {
    activeImageIndex = index;
    const safeIndex = (index + images.length) % images.length;
    if (mainImageEl) mainImageEl.src = images[safeIndex];
    if (modalImage) modalImage.src = images[safeIndex];

    document.querySelectorAll('.gallery-thumb').forEach((thumb, thumbIndex) => {
      thumb.classList.toggle('active', thumbIndex === safeIndex);
    });
  }

  function openGalleryModal(index = activeImageIndex) {
    updateActiveImage(index);
    if (modal) {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'false');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      updateZoom(1);
    }
  }

  function closeGalleryModal() {
    if (modal) {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
      document.body.style.overflow = '';
      updateZoom(1);
      const descriptionPanel = document.getElementById('product-description-panel');
      if (descriptionPanel) {
        descriptionPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  function updateZoom(level) {
    zoomLevel = Math.max(1, Math.min(3, level));
    if (modalImage) {
      modalImage.style.setProperty('--zoom-level', zoomLevel.toFixed(1));
    }
  }

  function setSelectedRating(value) {
    selectedRating = value;
    ratingPicker?.querySelectorAll('.rating-star').forEach((star) => {
      star.classList.toggle('active', Number(star.dataset.value) <= value);
    });
  }

  function renderReviews(reviewsToRender) {
    const average = reviewsToRender.length ? (reviewsToRender.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviewsToRender.length).toFixed(1) : '0.0';
    const reviewSummary = document.getElementById('review-summary');
    if (reviewSummary) {
      reviewSummary.innerHTML = `
        <div class="review-summary-stars">${buildStarsMarkup(Number(average))}</div>
        <div class="review-summary-score">${average} / 5</div>
        <div class="review-summary-count">${reviewsToRender.length} review${reviewsToRender.length === 1 ? '' : 's'}</div>
      `;
    }

    if (reviewList) {
      reviewList.innerHTML = renderReviewList(reviewsToRender);
    }
  }

  document.querySelectorAll('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      openGalleryModal(Number(thumb.dataset.index));
    });
  });

  document.getElementById('gallery-prev')?.addEventListener('click', () => {
    updateActiveImage(activeImageIndex - 1);
  });

  document.getElementById('gallery-next')?.addEventListener('click', () => {
    updateActiveImage(activeImageIndex + 1);
  });

  document.getElementById('gallery-zoom-btn')?.addEventListener('click', () => openGalleryModal(activeImageIndex));
  mainImageEl?.addEventListener('click', () => openGalleryModal(activeImageIndex));
  document.getElementById('gallery-modal-prev')?.addEventListener('click', () => updateActiveImage(activeImageIndex - 1));
  document.getElementById('gallery-modal-next')?.addEventListener('click', () => updateActiveImage(activeImageIndex + 1));
  document.getElementById('gallery-zoom-in')?.addEventListener('click', () => updateZoom(zoomLevel + 0.25));
  document.getElementById('gallery-zoom-out')?.addEventListener('click', () => updateZoom(zoomLevel - 0.25));
  document.getElementById('gallery-zoom-reset')?.addEventListener('click', () => updateZoom(1));
  document.getElementById('gallery-modal-close')?.addEventListener('click', (event) => {
    event.stopPropagation();
    closeGalleryModal();
  });
  modal?.addEventListener('click', (event) => {
    if (event.target === modal || event.target.dataset.close === 'true') {
      closeGalleryModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (modal && modal.hidden === false && event.key === 'Escape') {
      closeGalleryModal();
    }
  });

  ratingPicker?.querySelectorAll('.rating-star').forEach((star) => {
    star.addEventListener('click', () => {
      setSelectedRating(Number(star.dataset.value));
    });
  });

  reviewForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const emailInput = reviewForm.querySelector('#review-email');
    const commentInput = reviewForm.querySelector('#review-comment');
    const email = emailInput?.value.trim() || '';
    const comment = commentInput?.value.trim() || '';

    if (!email || !comment || selectedRating === 0) {
      alert('Please add your email, choose a rating, and leave a comment.');
      return;
    }

    const review = {
      id: Date.now(),
      email,
      rating: selectedRating,
      comment,
      createdAt: new Date().toISOString()
    };

    const updatedReviews = [...getStoredReviews(reviewKey), review];
    localStorage.setItem(reviewKey, JSON.stringify(updatedReviews));
    reviewForm.reset();
    setSelectedRating(0);
    renderReviews(updatedReviews);
  });

  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    addToCart(product);
  });
});

function getStoredReviews(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Unable to read reviews from storage:', error);
    return [];
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildStarsMarkup(rating) {
  const rounded = Math.round(rating);
  return Array.from({ length: 5 }, (_, idx) => {
    const active = idx < rounded;
    return `<i class="fa-solid fa-star ${active ? 'review-star-active' : 'review-star-inactive'}"></i>`;
  }).join('');
}

function renderReviewList(reviews) {
  if (!reviews.length) {
    return `<div class="review-empty">No reviews yet. Be the first to share your experience.</div>`;
  }

  return reviews.slice().reverse().map((review) => `
    <div class="review-item">
      <div class="review-item-top">
        <div class="review-author">${escapeHtml(review.email || 'Anonymous')}</div>
        <div class="review-rating">${buildStarsMarkup(Number(review.rating || 0))}</div>
      </div>
      <p class="review-comment">${escapeHtml(review.comment || '')}</p>
    </div>
  `).join('');
}
