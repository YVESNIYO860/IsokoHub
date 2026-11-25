const helpTopics = {
  buy: 'Buyers can browse approved listings, open a listing to review the details, then use its available seller contact options. Listings that show Buy Online can be purchased through the site checkout.',
  sell: 'To sell, sign in, complete the seller account approval requirements, then open Sell Product. New listings are submitted for review before they appear publicly.',
  edit: 'Sellers manage their own listings from the Dashboard. Choose Edit on a listing to update its details, photos, price, or description and save the changes.',
  contact: 'Open a product listing and use the contact methods shown there. Chat is available through IsokoHub; phone, WhatsApp, or email appear only when provided by the seller.',
  search: 'The Products page supports product search and category, condition, and district filters. Near me uses browser location permission to sort listings with shared coordinates.',
  report: 'A dedicated report-listing workflow is not currently available. Contact IsokoHub support and include the listing link and reason so the team can review it.',
  support: 'For help that needs a person, use the Support page at /support. It lists the IsokoHub WhatsApp, email, and phone contact options.'
};

function getPlatformHelp(topic) {
  return helpTopics[topic] || helpTopics.support;
}

module.exports = { getPlatformHelp };
