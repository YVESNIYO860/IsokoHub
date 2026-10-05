(function () {
  const MODULE_KEY = 'properties';

  function normalizeText(value, fallback = '') {
    if (value == null) return fallback;
    const cleaned = String(value).trim();
    return cleaned || fallback;
  }

  function normalizePropertyRecord(record = {}) {
    const title = normalizeText(record.title, 'Property');
    const location = normalizeText(record.location, 'Rwanda');
    const propertyType = normalizeText(record.propertyType, 'Home');
    const description = normalizeText(record.description, 'Property listing preview.');
    const price = Number.isFinite(Number(record.price)) ? Number(record.price) : null;

    return {
      id: normalizeText(record.id, `property-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
      title,
      propertyType,
      location,
      description,
      price,
      seller: normalizeText(record.seller, 'Independent seller'),
      status: normalizeText(record.status, 'draft'),
      metadata: record.metadata || {},
      createdAt: normalizeText(record.createdAt, new Date().toISOString())
    };
  }

  function createPropertyPreview(record = {}) {
    const normalized = normalizePropertyRecord(record);
    return {
      key: MODULE_KEY,
      id: normalized.id,
      title: normalized.title,
      propertyType: normalized.propertyType,
      location: normalized.location,
      description: normalized.description,
      price: normalized.price,
      seller: normalized.seller,
      status: normalized.status,
      metadata: normalized.metadata,
      createdAt: normalized.createdAt,
      route: '/properties',
      enabled: false
    };
  }

  function listPropertyPreviews(records = []) {
    const items = Array.isArray(records) ? records : [];
    return items.map((record) => createPropertyPreview(record));
  }

  function registerPropertyModule() {
    const payload = {
      key: MODULE_KEY,
      label: 'Properties',
      route: '/properties',
      enabled: false,
      entityTypes: ['property'],
      description: 'Property discovery and listing preview.'
    };

    if (window.isokoCore && typeof window.isokoCore.registerModule === 'function') {
      window.isokoCore.registerModule(MODULE_KEY, payload);
    }

    if (window.moduleRegistry && typeof window.moduleRegistry.registerModule === 'function') {
      window.moduleRegistry.registerModule(MODULE_KEY, payload);
    }

    return payload;
  }

  const PropertyModule = {
    MODULE_KEY,
    normalizePropertyRecord,
    createPropertyPreview,
    listPropertyPreviews,
    registerPropertyModule
  };

  window.PropertyModule = PropertyModule;
  window.propertyModule = PropertyModule;
})();
