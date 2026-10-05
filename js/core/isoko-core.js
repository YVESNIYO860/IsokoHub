(function () {
  const SHARED_MODULES = {
    market: { enabled: true, label: 'Market', route: '/products', entityTypes: ['product'] },
    properties: { enabled: false, label: 'Properties', route: '/properties', entityTypes: ['property'] },
    services: { enabled: false, label: 'Services', route: '/services', entityTypes: ['service'] },
    businesses: { enabled: false, label: 'Businesses', route: '/businesses', entityTypes: ['business'] },
    jobs: { enabled: false, label: 'Jobs', route: '/jobs', entityTypes: ['job'] },
    food: { enabled: false, label: 'Food', route: '/food', entityTypes: ['food'] },
    transport: { enabled: false, label: 'Transport', route: '/transport', entityTypes: ['transport'] },
    learning: { enabled: false, label: 'Learning', route: '/learning', entityTypes: ['learning'] },
    events: { enabled: false, label: 'Events', route: '/events', entityTypes: ['event'] },
    digital: { enabled: false, label: 'Digital', route: '/digital', entityTypes: ['digital_product'] }
  };

  const CAPABILITY_ALIASES = {
    customer: ['customer'],
    seller: ['seller'],
    service_provider: ['service_provider', 'service-provider', 'provider', 'service provider'],
    professional: ['professional'],
    business_owner: ['business_owner', 'business-owner', 'business owner'],
    employer: ['employer'],
    job_seeker: ['job_seeker', 'job-seeker', 'job seeker'],
    instructor: ['instructor'],
    organizer: ['organizer'],
    delivery_provider: ['delivery_provider', 'delivery-provider', 'delivery provider']
  };

  function normalizeCapabilityName(value) {
    if (value == null) return '';
    const text = String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    return text.replace(/^_+|_+$/g, '');
  }

  function normalizeEntityType(value) {
    const text = String(value ?? '').trim().toLowerCase();
    if (!text) return 'unknown';
    const cleaned = text.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return cleaned || 'unknown';
  }

  function getCurrentIsokoUser() {
    if (typeof getCurrentUser === 'function') {
      return getCurrentUser();
    }
    try {
      const userString = localStorage.getItem('isokoHubCurrentUser');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      return null;
    }
  }

  function normalizeUserCapabilities(rawUser = null) {
    const user = rawUser || getCurrentIsokoUser();
    if (!user) return [];

    const candidates = [];
    const roleValue = user.role || user.account_role || user.primary_role || '';
    const roles = Array.isArray(user.roles) ? user.roles : [];
    const capabilities = Array.isArray(user.capabilities) ? user.capabilities : [];

    if (roleValue) candidates.push(roleValue);
    roles.forEach((item) => candidates.push(item));
    capabilities.forEach((item) => candidates.push(item));

    const normalized = candidates
      .map((entry) => normalizeCapabilityName(entry))
      .filter(Boolean)
      .filter((entry, index, list) => list.indexOf(entry) === index);

    const expanded = [];
    normalized.forEach((entry) => {
      expanded.push(entry);
      const aliasSet = CAPABILITY_ALIASES[entry] || [];
      aliasSet.forEach((alias) => expanded.push(normalizeCapabilityName(alias)));
    });

    const finalSet = expanded
      .map((entry) => normalizeCapabilityName(entry))
      .filter(Boolean)
      .filter((entry, index, list) => list.indexOf(entry) === index);

    return finalSet;
  }

  function canPerformCapability(user, capability) {
    const target = normalizeCapabilityName(capability);
    if (!target) return false;
    const capabilities = normalizeUserCapabilities(user);
    return capabilities.includes(target) || capabilities.includes('seller') && target === 'customer';
  }

  function createIsokoLink({ sourceType, sourceId, targetType, targetId, relationship, metadata = {} }) {
    const source = normalizeEntityType(sourceType);
    const target = normalizeEntityType(targetType);
    if (!source || !target || !relationship) {
      return null;
    }

    return {
      sourceType: source,
      sourceId: String(sourceId || ''),
      targetType: target,
      targetId: String(targetId || ''),
      relationship: String(relationship).trim(),
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    };
  }

  function getAvailableModules() {
    return Object.entries(SHARED_MODULES)
      .filter(([, config]) => config && config.enabled)
      .map(([key, config]) => ({ key, ...config }));
  }

  function isModuleEnabled(moduleKey) {
    return Boolean(SHARED_MODULES[moduleKey]?.enabled);
  }

  function getModuleMetadata(moduleKey) {
    return SHARED_MODULES[moduleKey] || null;
  }

  function registerModule(moduleKey, config = {}) {
    const key = String(moduleKey || '').trim();
    if (!key) return null;
    SHARED_MODULES[key] = {
      ...(SHARED_MODULES[key] || {}),
      ...(config || {})
    };
    return SHARED_MODULES[key];
  }

  function resolveCapabilitiesForUser(rawUser = null) {
    const user = rawUser || getCurrentIsokoUser();
    const capabilities = normalizeUserCapabilities(user);
    if (capabilities.length) return capabilities;

    const email = (user?.email || '').toLowerCase();
    if (email === 'yvesniyonkuru2022@gmail.com') {
      return ['admin', 'seller', 'customer'];
    }

    if (user?.role === 'admin') {
      return ['admin', 'seller', 'customer'];
    }

    return ['customer'];
  }

  function getEntityKind(value) {
    return normalizeEntityType(value);
  }

  const isokoCore = {
    modules: SHARED_MODULES,
    getCurrentUser: getCurrentIsokoUser,
    normalizeUserCapabilities,
    resolveCapabilitiesForUser,
    canPerformCapability,
    createIsokoLink,
    getAvailableModules,
    isModuleEnabled,
    getModuleMetadata,
    registerModule,
    getEntityKind,
    capabilities: Object.keys(CAPABILITY_ALIASES)
  };

  window.IsokoCore = isokoCore;
  window.isokoCore = isokoCore;
})();
