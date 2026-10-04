import { useEffect } from 'react';

const sellStyles = `
  .sell-container { max-width: 600px; margin: 2rem auto; background: white; padding: 2rem; border-radius: var(--border-radius); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); }
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
  @media (max-width: 600px) { .sell-container { padding: 1rem; } .image-preview-grid { grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); } }
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
            <h2 className="mb-3">Sell a New Product</h2>
            <div id="sell-error" className="text-danger mb-2 d-none"></div>
            <form id="sell-form">
              <div className="form-group"><label className="form-label" htmlFor="prod-name">Product Name</label><input type="text" id="prod-name" className="form-control" required placeholder="e.g. iPhone 13 Pro" /></div>
              <div className="form-group"><label className="form-label" htmlFor="prod-category">Category</label><select id="prod-category" className="form-control" required><option value="">Select a category</option><option value="Electronics">Electronics</option><option value="Fashion">Fashion</option><option value="Shoes">Shoes</option><option value="Phones">Phones</option><option value="Cars">Cars</option><option value="Others">Others</option></select></div>
              <div className="form-group"><label className="form-label" htmlFor="prod-condition">Condition</label><select id="prod-condition" className="form-control" required><option value="New">New (Factory Sealed)</option><option value="Used">Used (Still Works Excellent)</option></select></div>
              <div className="form-group"><label className="form-label" htmlFor="prod-price">Price (RWF)</label><input type="number" id="prod-price" className="form-control" required min="100" step="1" inputMode="numeric" placeholder="10000" /><small className="text-muted d-block mt-1">Enter the amount in Rwandan francs. The product will be saved with RWF pricing.</small></div>
              <div className="form-group">
                <label className="form-label" htmlFor="prod-images">Product Photos <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.82em' }}>(Min 1 · Max 6)</span></label>
                <div className="image-upload-zone" id="image-drop-zone">
                  <input type="file" id="prod-images" accept="image/*" multiple />
                  <span className="upload-zone-icon">🖼️</span>
                  <p className="upload-zone-title">Click or drag photos here</p>
                  <p className="upload-zone-sub">Supports JPG, PNG, WEBP — up to 6 photos</p>
                  <span className="image-count-badge" id="image-count-badge" style={{ display: 'none' }}>0 selected</span>
                </div>
                <div id="image-preview-grid" className="image-preview-grid"></div>
                <div className="upload-progress-wrap" id="upload-progress-wrap">
                  <div className="upload-progress-label" id="upload-progress-label">Uploading photos…</div>
                  <div className="upload-progress-bar-outer"><div className="upload-progress-bar-inner" id="upload-progress-bar"></div></div>
                  <div className="upload-progress-status" id="upload-progress-status">0 of 0 uploaded</div>
                </div>
                <small className="text-muted d-block mt-1">Each new selection adds to the list. Use Edit to crop, zoom, adjust light and color, rotate, flip, or remove the background before posting.</small>
              </div>
              <div id="upload-overlay" className="upload-overlay">
                <div className="upload-overlay-card"><div className="upload-overlay-spinner"></div><div className="upload-overlay-text" id="upload-overlay-text">Starting upload…</div><div className="upload-overlay-subtext" id="upload-overlay-subtext">0%</div></div>
              </div>
              <div className="form-group"><label className="form-label" htmlFor="prod-district">District</label><select id="prod-district" className="form-control" required><option value="">Select your district</option></select></div>
              <div className="form-group"><label className="form-label" htmlFor="prod-email">Seller Email</label><input type="email" id="prod-email" className="form-control" required placeholder="e.g. name@example.com" /><small className="text-muted d-block mt-1">Buyers will use this email to contact the seller directly.</small></div>
              <div className="form-group"><label className="form-label" htmlFor="prod-phone">Seller WhatsApp / Phone Number</label><input type="tel" id="prod-phone" className="form-control" required placeholder="e.g. +250 788 123 456" /></div>
              <div className="form-group"><label className="form-label" htmlFor="prod-location">Location details <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.82em' }}>(Optional)</span></label><input type="text" id="prod-location" className="form-control" placeholder="e.g. Tumba, behind road or near the market" /><small className="text-muted d-block mt-1">Add a landmark, road, or nearby place to help buyers find the location easily.</small></div>
              <div className="form-group"><label className="form-label" htmlFor="prod-description">Full Description</label><textarea id="prod-description" className="form-control" rows="5" required placeholder="Tell us more about the product features, history, and current condition..."></textarea></div>
              <div className="form-group">
                <label className="form-label" htmlFor="prod-buy-online">Sell Online</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><input type="checkbox" id="prod-buy-online" /><label htmlFor="prod-buy-online" style={{ margin: 0 }}>Enable "Buy Online" so customers can purchase using Mobile Money</label></div>
                <small className="text-muted d-block mt-1">When enabled, buyers will see a Buy Online button and can checkout immediately.</small>
              </div>
              <button type="submit" className="btn btn-primary btn-block">List Product</button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
