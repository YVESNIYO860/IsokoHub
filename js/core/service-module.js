(function () {
  const MODULE_KEY = 'services';

  function normalizeText(value, fallback = '') {
    if (value == null) return fallback;
    const cleaned = String(value).trim();
    return cleaned || fallback;
  }

  function normalizeServiceRecord(record = {}) {
    const title = normalizeText(record.title, 'Service');
    const category = normalizeText(record.category, 'General');
    const description = normalizeText(record.description, 'Service listing preview.');
    const location = normalizeText(record.location, 'Rwanda');
    const price = Number.isFinite(Number(record.price)) ? Number(record.price) : null;

    return {
      id: normalizeText(record.id, `service-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
      title,
      category,
      description,
      location,
      price,
      provider: normalizeText(record.provider, 'Independent provider'),
      status: normalizeText(record.status, 'draft'),
      metadata: record.metadata || {},
      createdAt: normalizeText(record.createdAt, new Date().toISOString())
    };
  }

  function createServicePreview(record = {}) {
    const normalized = normalizeServiceRecord(record);
    return {
      key: MODULE_KEY,
      id: normalized.id,
      title: normalized.title,
      category: normalized.category,
      description: normalized.description,
      location: normalized.location,
      price: normalized.price,
      provider: normalized.provider,
      status: normalized.status,
      metadata: normalized.metadata,
      createdAt: normalized.createdAt,
      route: '/services',
      enabled: false
    };
  }

  function listServicePreviews(records = []) {
    const items = Array.isArray(records) ? records : [];
    return items.map((record) => createServicePreview(record));
  }

  function registerServiceModule() {
    const payload = {
      key: MODULE_KEY,
      label: 'Services',
      route: '/services',
      enabled: false,
      entityTypes: ['service'],
      description: 'Service discovery and booking preview.'
    };

    if (window.isokoCore && typeof window.isokoCore.registerModule === 'function') {
      window.isokoCore.registerModule(MODULE_KEY, payload);
    }

    if (window.moduleRegistry && typeof window.moduleRegistry.registerModule === 'function') {
      window.moduleRegistry.registerModule(MODULE_KEY, payload);
    }

    return payload;
  }

  const ServiceModule = {
    MODULE_KEY,
    normalizeServiceRecord,
    createServicePreview,
    listServicePreviews,
    registerServiceModule
  };

  window.ServiceModule = ServiceModule;
  window.serviceModule = ServiceModule;
})();
