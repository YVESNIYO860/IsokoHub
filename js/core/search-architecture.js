(function () {
  const SEARCH_INDEX = {
    products: [],
    properties: [],
    services: [],
    businesses: [],
    jobs: [],
    events: []
  };

  function normalizeSearchText(value) {
    if (value == null) return '';
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function buildSearchRecord({ entityType, entityId, title, description, category, location, tags = [] }) {
    const type = String(entityType || 'unknown').trim().toLowerCase();
    if (!type || !entityId) return null;

    return {
      entityType: type,
      entityId: String(entityId),
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      category: String(category || '').trim(),
      location: String(location || '').trim(),
      tags: Array.isArray(tags) ? tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [],
      searchText: normalizeSearchText(`${title || ''} ${description || ''} ${category || ''} ${location || ''} ${tags.join(' ') || ''}`)
    };
  }

  function addSearchRecord(record) {
    const normalized = record && buildSearchRecord(record);
    if (!normalized) return null;

    const bucket = SEARCH_INDEX[normalized.entityType] || SEARCH_INDEX.products;
    const existingIndex = bucket.findIndex((item) => item.entityId === normalized.entityId && item.entityType === normalized.entityType);
    if (existingIndex >= 0) {
      bucket[existingIndex] = normalized;
      return normalized;
    }

    bucket.push(normalized);
    return normalized;
  }

  function searchAcrossEntities(query, entityTypes = Object.keys(SEARCH_INDEX)) {
    const term = normalizeSearchText(query);
    if (!term) {
      return Object.fromEntries(
        Object.entries(SEARCH_INDEX).map(([key, values]) => [key, values.slice(0, 10)])
      );
    }

    const allowed = Array.isArray(entityTypes) ? entityTypes.map((item) => String(item).trim().toLowerCase()) : Object.keys(SEARCH_INDEX);
    const results = {};

    for (const [key, values] of Object.entries(SEARCH_INDEX)) {
      if (allowed.length && !allowed.includes(key)) continue;
      results[key] = values.filter((item) => item.searchText.includes(term));
    }

    return results;
  }

  function clearSearchIndex() {
    Object.keys(SEARCH_INDEX).forEach((key) => {
      SEARCH_INDEX[key] = [];
    });
  }

  const searchArchitecture = {
    SEARCH_INDEX,
    buildSearchRecord,
    addSearchRecord,
    searchAcrossEntities,
    clearSearchIndex,
    normalizeSearchText
  };

  window.SearchArchitecture = searchArchitecture;
  window.searchArchitecture = searchArchitecture;
})();
