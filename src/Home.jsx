export default function Home() {
  return (
    <main>
      <section className="marketplace-hero" aria-labelledby="marketplace-hero-title">
        <div className="marketplace-hero-inner">
          <div className="marketplace-hero-copy">
            <span className="marketplace-hero-kicker"><i className="fa-solid fa-location-dot" aria-hidden="true"></i> Rwanda's local marketplace</span>
            <h1 id="marketplace-hero-title">Good finds.<br /><span>Closer to home.</span></h1>
            <p>Discover products from local sellers, find a place to call home, or share what you have with your community.</p>
            <div className="marketplace-hero-actions">
              <a href="/products" className="btn btn-primary">Browse listings <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
              <a href="/sell" className="marketplace-hero-sell"><i className="fa-solid fa-plus" aria-hidden="true"></i> Sell on IsokoHub</a>
            </div>
            <div className="marketplace-hero-proof" aria-label="Marketplace activity">
              <div><strong id="stat-active-listings">0+</strong><span>Local listings</span></div>
              <span className="marketplace-hero-divider" aria-hidden="true"></span>
              <div><strong><i className="fa-solid fa-shield-halved" aria-hidden="true"></i> Made for Rwanda</strong><span>Local discovery, made simple</span></div>
            </div>
          </div>
          <div className="marketplace-hero-visual">
            <a className="marketplace-hero-image-link marketplace-hero-image-link--electronics" href="/products?category=Electronics" aria-label="Browse electronics listings">
              <img src="/assets/hero-image.png" alt="A collection of electronics and household products" width="534" height="374" fetchPriority="high" decoding="async" />
              <span className="marketplace-hero-image-label">Electronics <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span>
            </a>
            <a className="marketplace-hero-image-link marketplace-hero-image-link--bikes" href="/products?q=bicycle" aria-label="Browse bicycle listings">
              <img src="/assets/hero2.jpg" alt="Bicycles on display at a local shop" width="547" height="365" loading="lazy" decoding="async" />
              <span className="marketplace-hero-image-label">Bicycles <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span>
            </a>
            <a className="marketplace-hero-image-link marketplace-hero-image-link--fashion" href="/products?category=Fashion" aria-label="Browse fashion listings">
              <img src="/assets/hero1.jpg" alt="Clothing displayed at a local fashion shop" width="225" height="225" loading="lazy" decoding="async" />
              <span className="marketplace-hero-image-label">Fashion <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span>
            </a>
          </div>
        </div>
      </section>

      <section className="amazon-product-shelf" aria-labelledby="amazon-shelf-title">
        <div className="amazon-product-shelf-inner">
          <div className="amazon-shelf-heading">
            <div>
              <span className="amazon-shelf-kicker"><i className="fa-solid fa-bolt"></i> Fresh from the marketplace</span>
              <h2 id="amazon-shelf-title">Top picks for you</h2>
              <p>Explore new listings from local sellers and shops.</p>
            </div>
            <a href="products.html" className="amazon-shelf-link">See all products <i className="fa-solid fa-arrow-right"></i></a>
          </div>
          <div id="homepage-product-shelf" className="amazon-product-grid" aria-live="polite">
            <button type="button" className="amazon-shelf-arrow amazon-shelf-arrow-prev" aria-label="Previous products" title="Previous products"><span aria-hidden="true">&lt;</span></button>
            <div className="amazon-product-viewport">
              <div className="amazon-product-track">
                <div className="amazon-shelf-loading">Loading products...</div>
              </div>
            </div>
            <button type="button" className="amazon-shelf-arrow amazon-shelf-arrow-next" aria-label="Next products" title="Next products"><span aria-hidden="true">&gt;</span></button>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="homepage-filter" aria-labelledby="homepage-filter-title">
          <div>
            <span className="homepage-filter-kicker">Find your next thing</span>
            <h2 className="section-title" id="homepage-filter-title">Filter listings</h2>
            <p className="homepage-product-count" id="homepage-product-count" aria-live="polite">Loading listed products...</p>
          </div>
          <div id="categories-container">
            {/* JS will render the category filter here */}
          </div>
        </section>

        <div className="shops-section" hidden>
          <h2 className="section-title">Featured Shops</h2>
          <div className="shops-grid" id="shops-container">
            {/* JS will render shops here */}
          </div>
        </div>

        <h2 className="section-title">Featured Products</h2>
        <div className="product-grid mb-4" id="featured-products">
          {/* JS will render featured products here */}
        </div>
      </div>
    </main>
  );
}