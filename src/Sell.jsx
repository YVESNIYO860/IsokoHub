import { useEffect } from 'react';

const sellStyles = `
  .sell-container { max-width: 920px; margin: 2rem auto; background: white; padding: clamp(1rem, 3vw, 2rem); border-radius: 20px; box-shadow: 0 18px 48px rgba(16, 33, 63, 0.08); border: 1px solid var(--border-color); }
  .sell-page-heading { margin-bottom: 1.4rem; }
  .sell-page-heading > span { display: inline-flex; align-items: center; gap: .45rem; color: #1d4ed8; font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .sell-page-heading h2 { margin: .4rem 0; color: #14243b; font-size: clamp(1.55rem, 3vw, 2.1rem); }
  .sell-page-heading p { max-width: 680px; margin: 0; color: #64748b; line-height: 1.6; }
  .listing-update-notice { margin: 1rem 0; padding: .9rem 1rem; border: 1px solid #bfdbfe; border-radius: 12px; background: #eff6ff; color: #1e3a8a; line-height: 1.5; }
  .listing-update-notice[hidden] { display: none; }
  .sell-form-section { margin: 1rem 0; padding: clamp(.9rem, 2vw, 1.3rem); border: 1px solid #e3eaf3; border-radius: 16px; background: linear-gradient(145deg, #fff, #fbfdff); }
  .sell-form-section-heading { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: 1rem; }
  .sell-form-section-icon { display: grid; flex: 0 0 2.4rem; width: 2.4rem; height: 2.4rem; place-items: center; border-radius: 11px; background: #eff6ff; color: #2563eb; }
  .sell-form-section-heading h3 { margin: 0; color: #17263d; font-size: 1rem; }
  .sell-form-section-heading p { margin: .2rem 0 0; color: #64748b; font-size: .82rem; line-height: 1.45; }
  .seller-ai-panel { margin-top: 1rem; padding: 1rem; border: 1px solid #cbdaf2; border-radius: 14px; background: linear-gradient(135deg, #f8fbff, #f0f6ff); }
  .seller-ai-heading { display: flex; align-items: flex-start; gap: .65rem; margin-bottom: .75rem; }
  .seller-ai-heading-icon { display: grid; flex: 0 0 2.2rem; width: 2.2rem; height: 2.2rem; place-items: center; border-radius: 10px; background: #e0ecff; color: #1d4ed8; }
  .seller-ai-heading strong { display: block; color: #19345c; font-size: .9rem; }
  .seller-ai-heading p { margin: .2rem 0 0; color: #64748b; font-size: .78rem; line-height: 1.45; }
  .seller-ai-controls { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
  .seller-ai-controls select { min-height: 2.5rem; padding: .5rem .65rem; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #334155; font: inherit; font-size: .78rem; }
  .seller-ai-action { min-height: 2.5rem; padding: .5rem .7rem; border: 1px solid #bfdbfe; border-radius: 8px; background: #fff; color: #1d4ed8; cursor: pointer; font: inherit; font-size: .76rem; font-weight: 750; }
  .seller-ai-action:hover { background: #eff6ff; }
  .seller-ai-action:disabled, .seller-ai-controls select:disabled { opacity: .6; cursor: wait; }
  .seller-ai-status { min-height: 1.2rem; margin: .55rem 0 0; color: #52657e; font-size: .76rem; line-height: 1.4; }
  .seller-ai-output { margin-top: .75rem; }
  .seller-ai-output[hidden] { display: none; }
  .seller-ai-preview { min-height: 7rem; max-height: 22rem; overflow: auto; padding: .8rem; border: 1px solid #d5deea; border-radius: 9px; background: #fff; color: #24354d; font-size: .84rem; line-height: 1.6; }
  .seller-ai-preview > :first-child { margin-top: 0; }
  .seller-ai-preview > :last-child { margin-bottom: 0; }
  .seller-ai-preview h3, .seller-ai-preview h4 { margin: .85rem 0 .4rem; color: #1b3558; font-size: .95rem; }
  .seller-ai-preview p { margin: .45rem 0; }
  .seller-ai-preview ul, .seller-ai-preview ol { margin: .45rem 0; padding-left: 1.35rem; }
  .seller-ai-preview li { margin: .2rem 0; }
  .seller-ai-preview strong { color: #173c70; font-weight: 800; }
  .seller-ai-output-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .5rem; }
  .seller-ai-output-actions button { min-height: 2.3rem; padding: .45rem .7rem; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #334155; cursor: pointer; font: inherit; font-size: .75rem; font-weight: 700; }
  .seller-ai-output-actions #seller-ai-use-description { border-color: #1d4ed8; background: #1d4ed8; color: #fff; }
  .seller-ai-output-actions #seller-ai-use-description[hidden] { display: none; }
  .sell-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem 1rem; }
  .sell-form-grid .form-group { min-width: 0; margin-bottom: .15rem; }
  .sell-form-grid .form-group-full { grid-column: 1 / -1; }
  .sell-form-section .form-group > label, .sell-form-section .form-group > span { display: block; margin-bottom: .35rem; color: #334155; font-size: .82rem; font-weight: 750; }
  .sell-spec-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; }
  .sell-spec-grid .form-group { min-width: 0; margin: 0; }
  .sell-spec-grid .form-control { min-height: 44px; }
  .custom-specifications { display: grid; gap: .55rem; margin: .75rem 0; }
  .custom-spec-row { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr) auto; align-items: center; gap: .55rem; }
  .custom-spec-row input { min-width: 0; }
  .custom-spec-remove { display: grid; width: 2.5rem; height: 2.5rem; place-items: center; border: 1px solid #fecaca; border-radius: 9px; background: #fff7f7; color: #b91c1c; cursor: pointer; }
  .custom-spec-add { display: inline-flex; align-items: center; gap: .45rem; min-height: 2.55rem; padding: .55rem .85rem; border: 1px solid #bfdbfe; border-radius: 9px; background: #eff6ff; color: #1d4ed8; font: inherit; font-size: .82rem; font-weight: 750; cursor: pointer; }
  .listing-submit { min-height: 3.2rem; margin-top: .5rem; border-radius: 12px; font-size: 1rem; font-weight: 800; box-shadow: 0 8px 18px rgba(37, 99, 235, .18); }
  .image-upload-zone { border: 2px dashed #c7d2fe; border-radius: 14px; background: linear-gradient(135deg, #f0f4ff 0%, #f8faff 100%); padding: 1.4rem 1rem; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s, transform 0.15s; position: relative; }
  .image-upload-zone:hover, .image-upload-zone.drag-over { border-color: #6366f1; background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); transform: scale(1.01); }
  .image-upload-zone input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; z-index: 2; }
  .upload-zone-icon { font-size: 2rem; line-height: 1; margin-bottom: 0.4rem; display: block; }
  .upload-zone-title { font-weight: 600; color: #4338ca; font-size: 0.95rem; margin: 0 0 0.2rem; }
  .upload-zone-sub { color: #6b7280; font-size: 0.78rem; margin: 0; }
  .image-count-badge { display: inline-flex; align-items: center; gap: 4px; background: #6366f1; color: white; border-radius: 20px; padding: 0.2rem 0.7rem; font-size: 0.75rem; font-weight: 600; margin-top: 0.5rem; }
  .image-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 0.7rem; margin-top: 0.9rem; }
  .image-preview-item { position: relative; border-radius: 12px; overflow: hidden; border: 2px solid #e0e7ff; background: white; aspect-ratio: 1; box-shadow: 0 2px 8px rgba(99,102,241,0.10); transition: border-color 0.2s, transform 0.15s; }
  .image-preview-item:hover { border-color: #6366f1; transform: scale(1.03); }
  .image-preview-item img { width: 100%; height: 100%; object-fit: cover; cursor: zoom-in; }
  .preview-remove-btn { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(239,68,68,0.92); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; line-height: 1; z-index: 3; transition: background 0.15s, transform 0.1s; }
  .preview-background-btn { position: absolute; right: 4px; bottom: 4px; left: 4px; z-index: 3; padding: 0.3rem 0.2rem; border: 0; border-radius: 6px; color: #ffffff; background: rgba(29, 78, 216, 0.92); font-size: 0.62rem; font-weight: 700; line-height: 1.2; cursor: pointer; }
  .preview-background-btn:hover { background: #1e3a8a; }
  .preview-background-btn:disabled { cursor: wait; opacity: 0.7; }
  .preview-edit-btn { position: absolute; top: 4px; left: 4px; z-index: 3; padding: 0.25rem 0.45rem; border: 0; border-radius: 6px; color: #ffffff; background: rgba(37, 99, 235, 0.92); font-size: 0.62rem; font-weight: 700; cursor: pointer; }
  .preview-edit-btn:hover { background: #1d4ed8; }
  .image-editor-modal { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: 1rem; background: rgba(15, 23, 42, 0.72); }
  .image-editor-panel { width: min(100%, 620px); max-height: min(92vh, 760px); overflow: auto; padding: 1rem; border: 1px solid #dbe4ef; border-radius: 14px; background: #ffffff; box-shadow: 0 24px 70px rgba(2, 6, 23, 0.32); }
  .image-editor-header, .image-editor-actions, .image-editor-controls { display: flex; align-items: center; gap: 0.65rem; }
  .image-editor-header { justify-content: space-between; margin-bottom: 0.8rem; }
  .image-editor-close { border: 0; background: transparent; color: #64748b; font-size: 1.5rem; cursor: pointer; }
  .image-editor-stage { display: grid; min-height: 240px; place-items: center; padding: 0.7rem; border-radius: 10px; background: #e2e8f0; }
  .image-editor-canvas { display: block; max-width: 100%; max-height: 52vh; object-fit: contain; background: repeating-conic-gradient(#f8fafc 0 25%, #e2e8f0 0 50%) 50% / 20px 20px; }
  .image-editor-controls { align-items: flex-end; flex-wrap: wrap; margin-top: 0.85rem; }
  .image-editor-controls label { display: grid; gap: 0.3rem; flex: 1; min-width: 150px; color: #475569; font-size: 0.76rem; font-weight: 700; }
  .image-editor-controls select { padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 7px; background: #ffffff; color: #0f172a; }
  .image-editor-controls input { width: 100%; accent-color: #2563eb; }
  .image-editor-tools { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.85rem; }
  .image-editor-tools button { padding: 0.5rem 0.65rem; border: 1px solid #cbd5e1; border-radius: 7px; color: #334155; background: #f8fafc; font: inherit; font-size: 0.76rem; font-weight: 750; cursor: pointer; }
  .image-editor-tools button:hover { border-color: #2563eb; color: #1d4ed8; background: #eff6ff; }
  .image-editor-actions { justify-content: flex-end; flex-wrap: wrap; margin-top: 1rem; }
  .image-editor-actions button { padding: 0.6rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 7px; background: #ffffff; color: #0f172a; font: inherit; font-size: 0.78rem; font-weight: 750; cursor: pointer; }
  .image-editor-actions .image-editor-remove-bg { margin-right: auto; color: #1d4ed8; border-color: #bfdbfe; background: #eff6ff; }
  .image-editor-actions .image-editor-apply { border-color: #1d4ed8; color: #ffffff; background: #1d4ed8; }
  .preview-remove-btn:hover { background: #dc2626; transform: scale(1.15); }
  .preview-num-badge { position: absolute; bottom: 4px; left: 4px; background: rgba(15,23,42,0.65); color: white; font-size: 0.6rem; font-weight: 700; border-radius: 6px; padding: 1px 5px; }
  .upload-progress-wrap { display: none; margin-top: 1rem; background: #f0f4ff; border-radius: 10px; padding: 0.75rem 1rem; border: 1px solid #c7d2fe; }
  .upload-progress-wrap.visible { display: block; }
  .upload-progress-label { font-size: 0.82rem; font-weight: 600; color: #4338ca; margin-bottom: 0.4rem; }
  .upload-progress-bar-outer { background: #e0e7ff; border-radius: 99px; height: 10px; overflow: hidden; }
  .upload-progress-bar-inner { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #6366f1, #a78bfa); transition: width 0.3s ease; width: 0%; }
  .upload-progress-status { font-size: 0.75rem; color: #6b7280; margin-top: 0.3rem; }
  .upload-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); display: flex; align-items: center; justify-content: center; z-index: 9999; opacity: 0; pointer-events: none; transition: opacity 0.25s ease; }
  .upload-overlay.visible { opacity: 1; pointer-events: auto; }
  .upload-overlay-card { background: white; border-radius: 20px; padding: 1.5rem 1.75rem; min-width: 280px; max-width: 90%; text-align: center; box-shadow: 0 25px 80px rgba(15, 23, 42, 0.18); }
  .upload-overlay-spinner { width: 48px; height: 48px; margin: 0 auto 1rem; border: 4px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
  .upload-overlay-text { font-size: 1rem; font-weight: 700; color: #111827; margin-bottom: 0.4rem; }
  .upload-overlay-subtext { font-size: 0.85rem; color: #6b7280; margin-bottom: 0.75rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 720px) { .sell-spec-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 600px) { .sell-container { padding: 1rem; } .image-preview-grid { grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); } .sell-form-grid, .sell-spec-grid { grid-template-columns: 1fr; } .custom-spec-row { grid-template-columns: 1fr 1fr auto; } }
`;

export default function Sell() {
  useEffect(() => {
    document.title = 'Sell Product - IsokoHub';
  }, []);

  return (
    <>
      <style>{sellStyles}</style>
      <main>
        <div className="container">
          <div className="sell-container">
            <header className="sell-page-heading">
              <span><i className="fa-solid fa-store" aria-hidden="true"></i> Seller workspace</span>
              <h2>Sell a New Product</h2>
              <p>Share clear product details, photos, and pricing so buyers can compare your listing with confidence.</p>
            </header>
            <div id="listing-update-notice" className="listing-update-notice" role="status" hidden></div>
            <div id="sell-error" className="text-danger mb-2 d-none"></div>
            <form id="sell-form">
              <section className="sell-form-section">
                <div className="sell-form-section-heading"><span className="sell-form-section-icon"><i className="fa-solid fa-box-open" aria-hidden="true"></i></span><div><h3>Product details</h3><p>Start with the exact name, category, condition, and color buyers will search for.</p></div></div>
                <div className="sell-form-grid">
                  <div className="form-group form-group-full"><label htmlFor="prod-name">Product name</label><input type="text" id="prod-name" className="form-control" required maxLength="120" placeholder="e.g. Samsung Galaxy S23 Ultra" /></div>
                  <div className="form-group"><label htmlFor="prod-category">Category</label><select id="prod-category" className="form-control" required><option value="">Select a category</option><option value="Electronics">Electronics</option><option value="Fashion">Fashion</option><option value="Shoes">Shoes</option><option value="Phones">Phones</option><option value="Cars">Cars</option><option value="Others">Others</option></select></div>
                  <div className="form-group"><label htmlFor="prod-condition">Condition</label><select id="prod-condition" className="form-control" required><option value="New">New (Factory sealed)</option><option value="Used">Used (Working condition)</option></select></div>
                  <div className="form-group"><label htmlFor="prod-color">Color <span>(optional)</span></label><select id="prod-color" className="form-control"><option value="">Choose a color</option><option value="Black">Black</option><option value="White">White</option><option value="Gray">Gray</option><option value="Red">Red</option><option value="Blue">Blue</option><option value="Navy">Navy</option><option value="Green">Green</option><option value="Yellow">Yellow</option><option value="Orange">Orange</option><option value="Pink">Pink</option><option value="Purple">Purple</option><option value="Brown">Brown</option><option value="Beige">Beige</option><option value="Multicolor">Multicolor</option><option value="Other">Other</option></select></div>
                  <div className="form-group" id="prod-color-other-group" hidden><label htmlFor="prod-color-other">Specify color</label><input type="text" id="prod-color-other" className="form-control" maxLength="40" placeholder="e.g. Rose gold" /></div>
                </div>
              </section>

              <section className="sell-form-section">
                <div className="sell-form-section-heading"><span className="sell-form-section-icon"><i className="fa-solid fa-list-check" aria-hidden="true"></i></span><div><h3>Specifications</h3><p>Add the details buyers compare. Leave anything that does not apply blank; custom attributes let you describe any product type.</p></div></div>
                <div className="sell-spec-grid">
                  <div className="form-group"><label htmlFor="prod-brand">Brand</label><input id="prod-brand" className="form-control" maxLength="60" placeholder="e.g. Samsung" /></div>
                  <div className="form-group"><label htmlFor="prod-model">Model</label><input id="prod-model" className="form-control" maxLength="80" placeholder="e.g. Galaxy S23 Ultra" /></div>
                  <div className="form-group"><label htmlFor="prod-memory">Memory / RAM</label><input id="prod-memory" className="form-control" maxLength="40" placeholder="e.g. 8 GB" /></div>
                  <div className="form-group"><label htmlFor="prod-capacity">Capacity</label><input id="prod-capacity" className="form-control" maxLength="50" placeholder="e.g. 256 GB or 1.5 L" /></div>
                  <div className="form-group"><label htmlFor="prod-storage">Storage</label><input id="prod-storage" className="form-control" maxLength="50" placeholder="e.g. 256 GB SSD" /></div>
                  <div className="form-group"><label htmlFor="prod-processor">Processor</label><input id="prod-processor" className="form-control" maxLength="80" placeholder="e.g. Snapdragon 8 Gen 2" /></div>
                  <div className="form-group"><label htmlFor="prod-screen-size">Screen size</label><input id="prod-screen-size" className="form-control" maxLength="40" placeholder="e.g. 6.8 inches" /></div>
                  <div className="form-group"><label htmlFor="prod-battery">Battery</label><input id="prod-battery" className="form-control" maxLength="50" placeholder="e.g. 5000 mAh" /></div>
                  <div className="form-group"><label htmlFor="prod-size">Size / dimensions</label><input id="prod-size" className="form-control" maxLength="60" placeholder="e.g. Medium or 30 × 20 cm" /></div>
                  <div className="form-group"><label htmlFor="prod-material">Material</label><input id="prod-material" className="form-control" maxLength="60" placeholder="e.g. Genuine leather" /></div>
                  <div className="form-group"><label htmlFor="prod-warranty">Warranty</label><input id="prod-warranty" className="form-control" maxLength="60" placeholder="e.g. 6 months" /></div>
                  <div className="form-group"><label htmlFor="prod-weight">Weight</label><input id="prod-weight" className="form-control" maxLength="40" placeholder="e.g. 1.2 kg" /></div>
                </div>
                <div id="custom-specifications" className="custom-specifications" aria-live="polite"></div>
                <button type="button" className="custom-spec-add" id="add-product-spec"><i className="fa-solid fa-plus" aria-hidden="true"></i> Add another attribute</button>
              </section>

              <section className="sell-form-section">
                <div className="sell-form-section-heading"><span className="sell-form-section-icon"><i className="fa-solid fa-tag" aria-hidden="true"></i></span><div><h3>Price and availability</h3><p>Be clear about your price. Use one amount for a fixed price or a range when it is negotiable.</p></div></div>
                <div className="sell-form-grid">
                  <div className="form-group form-group-full"><span className="form-label">Price range (RWF)</span><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '.75rem' }}><label htmlFor="prod-price-min">From<input type="number" id="prod-price-min" className="form-control" required min="100" step="1" inputMode="numeric" placeholder="12000" /></label><label htmlFor="prod-price-max">To<input type="number" id="prod-price-max" className="form-control" required min="100" step="1" inputMode="numeric" placeholder="15000" /></label></div><small className="text-muted d-block mt-1">Enter both amounts in Rwandan francs. Use the same amount for a fixed price.</small></div>
                  <div className="form-group form-group-full"><label htmlFor="prod-buy-online">Sell online</label><div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><input type="checkbox" id="prod-buy-online" /><label htmlFor="prod-buy-online" style={{ margin: 0 }}>Enable checkout so customers can buy using Mobile Money</label></div><small className="text-muted d-block mt-1" id="prod-buy-online-help">Buy Online is available for fixed-price listings.</small></div>
                </div>
              </section>

              <section className="sell-form-section">
                <div className="sell-form-section-heading"><span className="sell-form-section-icon"><i className="fa-solid fa-camera" aria-hidden="true"></i></span><div><h3>Photos</h3><p>Use clear, well-lit photos from multiple angles. Upload up to six images.</p></div></div>
                <div className="form-group">
                  <label htmlFor="prod-images">Product photos <span>(min 1 · max 6)</span></label>
                  <div className="image-upload-zone" id="image-drop-zone">
                    <input type="file" id="prod-images" accept="image/*" multiple />
                    <span className="upload-zone-icon">🖼️</span><p className="upload-zone-title">Click or drag photos here</p><p className="upload-zone-sub">Supports JPG, PNG, WEBP</p>
                    <span className="image-count-badge" id="image-count-badge" style={{ display: 'none' }}>0 selected</span>
                  </div>
                  <div id="image-preview-grid" className="image-preview-grid"></div>
                  <div className="upload-progress-wrap" id="upload-progress-wrap"><div className="upload-progress-label" id="upload-progress-label">Uploading photos…</div><div className="upload-progress-bar-outer"><div className="upload-progress-bar-inner" id="upload-progress-bar"></div></div><div className="upload-progress-status" id="upload-progress-status">0 of 0 uploaded</div></div>
                  <small className="text-muted d-block mt-1">You can crop, adjust, rotate, flip, or remove photo backgrounds before posting.</small>
                </div>
                <div id="upload-overlay" className="upload-overlay"><div className="upload-overlay-card"><div className="upload-overlay-spinner"></div><div className="upload-overlay-text" id="upload-overlay-text">Starting upload…</div><div className="upload-overlay-subtext" id="upload-overlay-subtext">0%</div></div></div>
              </section>

              <section className="sell-form-section">
                <div className="sell-form-section-heading"><span className="sell-form-section-icon"><i className="fa-solid fa-location-dot" aria-hidden="true"></i></span><div><h3>Seller and location</h3><p>Give buyers a reliable way to reach you and find the item.</p></div></div>
                <div className="sell-form-grid">
                  <div className="form-group"><label htmlFor="prod-district">District</label><select id="prod-district" className="form-control" required><option value="">Select your district</option></select></div>
                  <div className="form-group"><label htmlFor="prod-email">Seller email</label><input type="email" id="prod-email" className="form-control" required placeholder="e.g. name@example.com" /><small className="text-muted d-block mt-1">Buyers can use this email to contact you.</small></div>
                  <div className="form-group"><label htmlFor="prod-phone">WhatsApp / phone</label><input type="tel" id="prod-phone" className="form-control" required placeholder="e.g. +250 788 123 456" /></div>
                  <div className="form-group"><label htmlFor="prod-location">Landmark <span>(optional)</span></label><input type="text" id="prod-location" className="form-control" placeholder="e.g. near the market" /><small className="text-muted d-block mt-1">A nearby road or landmark helps buyers locate you.</small></div>
                  <div className="form-group form-group-full"><button type="button" id="capture-seller-location" className="btn btn-secondary"><i className="fa-solid fa-location-crosshairs" aria-hidden="true"></i> Add approximate map location</button><small id="seller-location-status" className="text-muted d-block mt-1" role="status">Your browser will ask before sharing an approximate location.</small></div>
                </div>
              </section>

              <section className="sell-form-section">
                <div className="sell-form-section-heading"><span className="sell-form-section-icon"><i className="fa-solid fa-align-left" aria-hidden="true"></i></span><div><h3>Description</h3><p>Explain what makes this item useful. Be honest about condition, included accessories, and any defects.</p></div></div>
                <div className="form-group"><label htmlFor="prod-description">Full description</label><textarea id="prod-description" className="form-control" rows="7" required placeholder={"Example:\n- Excellent working condition\n- Includes charger and case\n- Minor scratches on the back"}></textarea><small className="text-muted d-block mt-1">Use the formatting controls for headings, lists, and emphasis.</small></div>
                <div className="seller-ai-panel">
                  <div className="seller-ai-heading"><span className="seller-ai-heading-icon"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></span><div><strong>AI listing assistant</strong><p>Generate an honest draft from the details you entered. Review it before using it.</p></div></div>
                  <div className="seller-ai-controls" id="seller-ai-controls">
                    <label className="visually-hidden" htmlFor="seller-ai-language">AI draft language</label>
                    <select id="seller-ai-language"><option value="auto">Auto language</option><option value="en">English</option><option value="rw">Kinyarwanda</option><option value="fr">Français</option></select>
                    <button type="button" className="seller-ai-action" data-seller-ai-action="description"><i className="fa-solid fa-align-left" aria-hidden="true"></i> Description</button>
                    <button type="button" className="seller-ai-action" data-seller-ai-action="summary"><i className="fa-solid fa-compress" aria-hidden="true"></i> Summary</button>
                    <button type="button" className="seller-ai-action" data-seller-ai-action="features"><i className="fa-solid fa-list-check" aria-hidden="true"></i> Features</button>
                    <button type="button" className="seller-ai-action" data-seller-ai-action="seo"><i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i> SEO content</button>
                  </div>
                  <div id="seller-ai-status" className="seller-ai-status" role="status" aria-live="polite"></div>
                  <div id="seller-ai-output" className="seller-ai-output" hidden>
                    <p id="seller-ai-preview-label"><strong>AI draft preview</strong> — review before publishing</p>
                    <div id="seller-ai-preview" className="seller-ai-preview" role="region" aria-labelledby="seller-ai-preview-label" tabIndex="0"></div>
                    <textarea id="seller-ai-draft" hidden aria-hidden="true" readOnly></textarea>
                    <div className="seller-ai-output-actions">
                      <button type="button" id="seller-ai-use-description" hidden>Use as full description</button>
                      <button type="button" id="seller-ai-copy">Copy draft</button>
                    </div>
                  </div>
                </div>
              </section>
              <button type="submit" className="btn btn-primary btn-block listing-submit"><i className="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i> List Product</button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
