import { useEffect } from 'react';

export default function Checkout() {
  useEffect(() => {
    document.title = 'Checkout - IsokoHub';
  }, []);

  return (
    <main className="checkout-page">
      <h1 className="checkout-page-title">Checkout</h1>
      <div id="checkout-container">
        <div id="checkout-cart"></div>
        <div id="checkout-summary" style={{ marginTop: '1.25rem' }}></div>
      </div>
    </main>
  );
}
