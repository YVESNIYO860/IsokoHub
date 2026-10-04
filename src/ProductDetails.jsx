import { useEffect } from 'react';

export default function ProductDetails() {
  useEffect(() => {
    document.title = 'Product - IsokoHub';
  }, []);

  return (
    <main>
      <div className="container" id="product-wrapper">
        <div style={{ textAlign: 'center', padding: '5rem' }} id="loading-state">
          <h2 className="text-muted">Loading product...</h2>
        </div>
      </div>
    </main>
  );
}
