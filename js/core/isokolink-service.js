(function () {
  const STORAGE_KEY = 'isokoHubLinks';

  function normalizeEntityType(value) {
    const text = String(value ?? '').trim().toLowerCase();
    if (!text) return 'unknown';
    const cleaned = text.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return cleaned || 'unknown';
  }

  function normalizeId(value) {
    return String(value ?? '').trim();
  }

  function readLinks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeLinks(links) {
    const cleaned = Array.isArray(links) ? links : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    return cleaned;
  }

  function buildLink({ sourceType, sourceId, targetType, targetId, relationship, metadata = {} }) {
    const source = normalizeEntityType(sourceType);
    const target = normalizeEntityType(targetType);
    const linkRelationship = String(relationship || '').trim();

    if (!source || !target || !linkRelationship) {
      return null;
    }

    return {
      sourceType: source,
      sourceId: normalizeId(sourceId),
      targetType: target,
      targetId: normalizeId(targetId),
      relationship: linkRelationship,
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    };
  }

  function saveLink(link) {
    const normalizedLink = buildLink(link || {});
    if (!normalizedLink) return null;

    const links = readLinks();
    const nextLinks = [...links, normalizedLink];
    writeLinks(nextLinks);
    return normalizedLink;
  }

  function resolveLinksForEntity(entityType, entityId) {
    const type = normalizeEntityType(entityType);
    const id = normalizeId(entityId);
    if (!type || !id) return [];

    return readLinks().filter((link) => {
      const isSourceMatch = normalizeEntityType(link.sourceType) === type && normalizeId(link.sourceId) === id;
      const isTargetMatch = normalizeEntityType(link.targetType) === type && normalizeId(link.targetId) === id;
      return isSourceMatch || isTargetMatch;
    });
  }

  function resolveLinkedEntities(entityType, entityId) {
    return resolveLinksForEntity(entityType, entityId).map((link) => {
      const sourceType = normalizeEntityType(link.sourceType);
      const sourceId = normalizeId(link.sourceId);
      const targetType = normalizeEntityType(link.targetType);
      const targetId = normalizeId(link.targetId);

      return {
        relationship: String(link.relationship || '').trim(),
        sourceType,
        sourceId,
        targetType,
        targetId,
        metadata: link.metadata || {},
        createdAt: link.createdAt || new Date().toISOString()
      };
    });
  }

  function listLinks() {
    return readLinks();
  }

  const IsokoLinkService = {
    STORAGE_KEY,
    normalizeEntityType,
    buildLink,
    saveLink,
    resolveLinksForEntity,
    resolveLinkedEntities,
    listLinks
  };

  window.IsokoLinkService = IsokoLinkService;
  window.isokoLinkService = IsokoLinkService;

  if (window.isokoCore && typeof window.isokoCore === 'object') {
    window.isokoCore.createIsokoLink = window.isokoCore.createIsokoLink || function (payload) {
      return IsokoLinkService.buildLink(payload);
    };
  }
})();
