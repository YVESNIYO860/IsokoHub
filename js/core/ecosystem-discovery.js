(function () {
  const DEFAULT_DISCOVERY_CATALOG = {
    market: {
      key: 'market',
      label: 'Market',
      route: '/products',
      enabled: true,
      entityTypes: ['product'],
      description: 'Marketplace products and seller listings.'
    },
    properties: {
      key: 'properties',
      label: 'Properties',
      route: '/properties',
      enabled: false,
      entityTypes: ['property'],
      description: 'Homes, rentals, and property listings.'
    },
    services: {
      key: 'services',
      label: 'Services',
      route: '/services',
      enabled: false,
      entityTypes: ['service'],
      description: 'Service discovery and booking.'
    },
    businesses: {
      key: 'businesses',
      label: 'Businesses',
      route: '/businesses',
      enabled: false,
      entityTypes: ['business'],
      description: 'Business profiles and storefronts.'
    },
    jobs: {
      key: 'jobs',
      label: 'Jobs',
      route: '/jobs',
      enabled: false,
      entityTypes: ['job'],
      description: 'Job postings and gig opportunities.'
    },
    food: {
      key: 'food',
      label: 'Food',
      route: '/food',
      enabled: false,
      entityTypes: ['food'],
      description: 'Food and dining discovery.'
    },
    transport: {
      key: 'transport',
      label: 'Transport',
      route: '/transport',
      enabled: false,
      entityTypes: ['transport'],
      description: 'Delivery and mobility services.'
    },
    learning: {
      key: 'learning',
      label: 'Learning',
      route: '/learning',
      enabled: false,
      entityTypes: ['learning'],
      description: 'Courses, classes, and educational offerings.'
    },
    events: {
      key: 'events',
      label: 'Events',
      route: '/events',
      enabled: false,
      entityTypes: ['event'],
      description: 'Community events and activities.'
    },
    digital: {
      key: 'digital',
      label: 'Digital',
      route: '/digital',
      enabled: false,
      entityTypes: ['digital_product'],
      description: 'Digital products and downloadable offers.'
    }
  };

  function normalizeEntityType(value) {
    const text = String(value ?? '').trim().toLowerCase();
    if (!text) return 'unknown';
    const cleaned = text.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return cleaned || 'unknown';
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildModuleRecord(key, config = {}) {
    const moduleKey = String(key || '').trim();
    const info = config || {};
    const label = String(info.label || moduleKey || 'Module').trim() || 'Module';

    return {
      key: moduleKey || label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      label,
      route: info.route || `/${moduleKey || 'module'}`,
      enabled: Boolean(info.enabled),
      entityTypes: Array.isArray(info.entityTypes) ? info.entityTypes.map(normalizeEntityType) : [],
      description: info.description || `${label} discovery module.`
    };
  }

  function readRegistryEntries() {
    const registry = window.moduleRegistry && typeof window.moduleRegistry.getModuleRegistry === 'function'
      ? window.moduleRegistry.getModuleRegistry()
      : {};
    const core = window.isokoCore && window.isokoCore.modules ? window.isokoCore.modules : {};
    const merged = { ...DEFAULT_DISCOVERY_CATALOG, ...core, ...registry };

    return Object.entries(merged).reduce((result, [moduleKey, config]) => {
      if (!config) return result;
      result[moduleKey] = buildModuleRecord(moduleKey, config);
      return result;
    }, {});
  }

  function getDiscoveryCatalog() {
    return Object.values(readRegistryEntries()).sort((left, right) => {
      if (left.enabled !== right.enabled) return Number(right.enabled) - Number(left.enabled);
      return left.label.localeCompare(right.label);
    });
  }

  function resolveModuleForEntity(entityType, fallback = null) {
    const targetType = normalizeEntityType(entityType);
    const catalog = getDiscoveryCatalog();

    const match = catalog.find((module) => {
      if (!Array.isArray(module.entityTypes) || !module.entityTypes.length) return false;
      return module.entityTypes.some((item) => normalizeEntityType(item) === targetType);
    });

    if (match) return match;
    if (fallback) return fallback;
    return catalog.find((module) => module.enabled && module.key === 'market') || catalog[0] || null;
  }

  function getEcosystemSummary() {
    const catalog = getDiscoveryCatalog();
    return {
      total: catalog.length,
      enabled: catalog.filter((module) => module.enabled).length,
      disabled: catalog.filter((module) => !module.enabled).length,
      modules: catalog
    };
  }

  function registerDiscoveryModule(moduleKey, config = {}) {
    const key = String(moduleKey || '').trim();
    if (!key) return null;

    const record = buildModuleRecord(key, config);

    if (window.isokoCore && typeof window.isokoCore.registerModule === 'function') {
      window.isokoCore.registerModule(key, record);
    }

    if (window.moduleRegistry && typeof window.moduleRegistry.registerModule === 'function') {
      window.moduleRegistry.registerModule(key, record);
    }

    return record;
  }

  function renderDiscoveryShell(container = null) {
    const root = container || (typeof document !== 'undefined' ? document.querySelector('[data-isoko-discovery-shell]') : null);
    const catalog = getDiscoveryCatalog().filter((module) => module.enabled);

    if (!root && typeof document !== 'undefined' && document.body) {
      const shell = document.createElement('div');
      shell.setAttribute('data-isoko-discovery-shell', 'true');
      shell.style.display = 'none';
      shell.style.position = 'absolute';
      shell.style.width = '1px';
      shell.style.height = '1px';
      shell.style.overflow = 'hidden';
      shell.style.opacity = '0';
      document.body.appendChild(shell);
      shell.innerHTML = `
        <section class="isoko-ecosystem-shell" aria-label="IsokoHub ecosystem preview">
          ${catalog.map((module) => `
            <article class="isoko-ecosystem-item" data-module-key="${escapeHtml(module.key)}">
              <strong>${escapeHtml(module.label)}</strong>
              <span>${escapeHtml(module.route || '/')}</span>
            </article>
          `).join('') || '<span>No enabled modules</span>'}
        </section>
      `;
      return shell;
    }

    if (!root) return null;

    root.innerHTML = `
      <section class="isoko-ecosystem-shell" aria-label="IsokoHub ecosystem preview">
        ${catalog.map((module) => `
          <article class="isoko-ecosystem-item" data-module-key="${escapeHtml(module.key)}">
            <strong>${escapeHtml(module.label)}</strong>
            <span>${escapeHtml(module.route || '/')}</span>
          </article>
        `).join('') || '<span>No enabled modules</span>'}
      </section>
    `;

    return root;
  }

  const discovery = {
    DEFAULT_DISCOVERY_CATALOG,
    buildModuleRecord,
    getDiscoveryCatalog,
    getEcosystemSummary,
    resolveModuleForEntity,
    registerDiscoveryModule,
    renderDiscoveryShell,
    normalizeEntityType
  };

  const core = window.IsokoCore || window.isokoCore || {};
  Object.assign(core, discovery);
  window.IsokoCore = core;
  window.isokoCore = core;
  window.EcosystemDiscovery = discovery;
  window.ecosystemDiscovery = discovery;
})();
