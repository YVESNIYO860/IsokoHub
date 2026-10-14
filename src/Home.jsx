export default function Home() {
  return (
    <main className="homepage">
      <section className="marketplace-hero" aria-labelledby="marketplace-hero-title">
        <div className="marketplace-hero-inner">
          <div className="marketplace-hero-copy">
            <span className="marketplace-hero-kicker"><i className="fa-solid fa-location-dot" aria-hidden="true"></i> Rwanda's local marketplace</span>
            <h1 id="marketplace-hero-title">Discover more.<br /><span>Shop smarter.</span></h1>
            <p>Explore products, homes, services, and opportunities from sellers across Rwanda.</p>

            <div className="marketplace-hero-actions">
              <a href="/products" className="btn btn-primary"><i className="fa-solid fa-grid-2" aria-hidden="true"></i> Browse all listings</a>
              <a href="/sell" className="marketplace-hero-sell"><i className="fa-solid fa-plus" aria-hidden="true"></i> Start selling</a>
            </div>
            <div className="marketplace-hero-proof" aria-label="Marketplace activity">
              <div><strong id="stat-active-listings">Loading</strong><span>Active listings</span></div>
              <span className="marketplace-hero-divider" aria-hidden="true"></span>
              <div><strong><i className="fa-solid fa-location-dot" aria-hidden="true"></i> Made for Rwanda</strong><span>Discover what's close to home</span></div>
            </div>
          </div>
          <a className="marketplace-hero-visual" href="/products" aria-label="Explore marketplace listings">
            <img src="/assets/hero-image.png?v=2" alt="A collage of clothing, electronics, books, home goods, and everyday products" width="1408" height="768" fetchPriority="high" decoding="async" />
            <span className="marketplace-hero-image-label"><span><strong>One marketplace.</strong><small>Products and opportunities from across Rwanda</small></span><i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span>
          </a>
        </div>
      </section>

      <section className="amazon-product-shelf" aria-labelledby="amazon-shelf-title">
        <div className="amazon-product-shelf-inner">
          <div className="amazon-shelf-heading">
            <div>
              <span className="amazon-shelf-kicker"><i className="fa-solid fa-sparkles" aria-hidden="true"></i> Recently listed</span>
              <h2 id="amazon-shelf-title">New to the marketplace</h2>
              <p>Browse the latest approved listings from local sellers.</p>
            </div>
            <a href="/products" className="amazon-shelf-link">Browse all listings <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
          </div>
          <div id="homepage-product-shelf" className="amazon-product-grid" aria-live="polite">
            <button type="button" className="amazon-shelf-arrow amazon-shelf-arrow-prev" aria-label="Previous listings" title="Previous listings"><i className="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
            <div className="amazon-product-viewport">
              <div className="amazon-product-track" aria-label="Recently listed products">
                <div className="homepage-shelf-skeleton" role="status" aria-label="Loading recent listings"><span></span><i></i><b></b></div>
                <div className="homepage-shelf-skeleton" aria-hidden="true"><span></span><i></i><b></b></div>
                <div className="homepage-shelf-skeleton" aria-hidden="true"><span></span><i></i><b></b></div>
                <div className="homepage-shelf-skeleton" aria-hidden="true"><span></span><i></i><b></b></div>
              </div>
            </div>
            <button type="button" className="amazon-shelf-arrow amazon-shelf-arrow-next" aria-label="Next listings" title="Next listings"><i className="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="homepage-filter" aria-labelledby="homepage-filter-title">
          <div>
            <span className="homepage-filter-kicker">Explore by category</span>
            <h2 className="section-title" id="homepage-filter-title">Browse the marketplace</h2>
          </div>
          <div id="categories-container" className="homepage-categories" aria-label="Marketplace categories">
            <div className="homepage-category-loading" role="status">Loading categories…</div>
          </div>
        </section>

        <div className="shops-section" hidden>
          <h2 className="section-title">Featured Shops</h2>
          <div className="shops-grid" id="shops-container">
            {/* JS will render shops here */}
          </div>
        </div>

        <section className="homepage-featured" aria-labelledby="featured-products-title">
          <div className="homepage-featured-heading">
            <div>
              <span className="homepage-filter-kicker">From local sellers</span>
              <h2 className="section-title" id="featured-products-title">Explore listings</h2>
              <p className="homepage-product-count" id="homepage-product-count" aria-live="polite">Loading listings…</p>
            </div>
            <a className="homepage-featured-link" href="/products">See all listings <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
          </div>
          <div id="featured-products" className="product-grid mb-4" aria-live="polite">
            <div className="homepage-listing-skeleton" aria-hidden="true"></div>
            <div className="homepage-listing-skeleton" aria-hidden="true"></div>
            <div className="homepage-listing-skeleton" aria-hidden="true"></div>
            <div className="homepage-listing-skeleton" aria-hidden="true"></div>
          </div>
        </section>
      </div>
    </main>
  );
}