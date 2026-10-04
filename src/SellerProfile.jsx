import { useEffect } from 'react';

export default function SellerProfile() {
  useEffect(() => {
    document.title = 'Seller profile - IsokoHub';
  }, []);

  return (
    <main className="seller-profile-page">
      <div id="seller-profile-content" className="seller-profile-loading">Loading seller profile...</div>
    </main>
  );
}
