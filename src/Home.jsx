export default function Home() {
  return (
    <main className="homepage">
      <section className="marketplace-hero" aria-labelledby="marketplace-hero-product-name">
        <div className="marketplace-hero-inner">
          <article className="marketplace-hero-pick">
            <a id="marketplace-hero-image-link" className="marketplace-hero-pick-photo" href="/products" aria-label="View marketplace listings">
              <img id="marketplace-hero-product-image" src="/assets/hero-image.png?v=2" alt="A collage of products from the IsokoHub marketplace" width="1408" height="768" fetchPriority="high" decoding="async" />
            </a>
            <button id="marketplace-hero-share" className="marketplace-hero-share" type="button" aria-label="Share this listing" hidden><i className="fa-solid fa-share-nodes" aria-hidden="true"></i><span id="marketplace-hero-share-label">Share</span></button>
            <div className="marketplace-hero-pick-shade" aria-hidden="true"></div>
            <div className="marketplace-hero-pick-content">
              <span id="marketplace-hero-pick-badge" className="marketplace-hero-pick-badge"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> SMARTER LOCAL FINDS</span>
              <span id="marketplace-hero-product-category" className="marketplace-hero-product-category">Approved products across Rwanda</span>
              <h1 id="marketplace-hero-product-name">Find your next great find.</h1>
              <p id="marketplace-hero-product-caption">Ask AI to find a real listing that fits your needs.</p>
              <strong id="marketplace-hero-product-price" className="marketplace-hero-product-price" hidden></strong>
              <div className="marketplace-hero-pick-actions">
                <a id="marketplace-hero-view-product" className="marketplace-hero-view-product" href="/products" hidden>View this pick <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
                <a className="marketplace-hero-ask-ai" href="/shopping-assistant">Ask AI for your match <i className="fa-solid fa-sparkles" aria-hidden="true"></i></a>
              </div>
              <span id="marketplace-hero-share-status" className="visually-hidden" aria-live="polite"></span>
              <div id="marketplace-hero-slide-controls" className="marketplace-hero-slide-controls" role="group" aria-label="Featured listings slideshow" hidden>
                <button id="marketplace-hero-previous" className="marketplace-hero-slide-button" type="button" aria-label="Previous listing"><i className="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                <div id="marketplace-hero-slide-indicators" className="marketplace-hero-slide-indicators"></div>
                <button id="marketplace-hero-next" className="marketplace-hero-slide-button" type="button" aria-label="Next listing"><i className="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
                <button id="marketplace-hero-toggle" className="marketplace-hero-slide-button marketplace-hero-slide-toggle" type="button" aria-label="Pause slideshow" title="Pause slideshow" aria-pressed="false"><i className="fa-solid fa-pause" aria-hidden="true"></i></button>
                <span id="marketplace-hero-slide-status" className="visually-hidden" aria-live="off"></span>
              </div>
            </div>
          </article>
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