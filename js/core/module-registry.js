(function () {
  const MODULE_REGISTRY = {
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

  function getModuleRegistry() {
    return { ...MODULE_REGISTRY };
  }

  function getEnabledModules() {
    return Object.values(MODULE_REGISTRY).filter((module) => Boolean(module?.enabled));
  }

  function isModuleEnabled(moduleKey) {
    const key = String(moduleKey || '').trim();
    return Boolean(MODULE_REGISTRY[key]?.enabled);
  }

  function registerModule(moduleKey, config = {}) {
    const key = String(moduleKey || '').trim();
    if (!key) return null;

    MODULE_REGISTRY[key] = {
      ...(MODULE_REGISTRY[key] || {}),
      key,
      ...(config || {})
    };

    return MODULE_REGISTRY[key];
  }

  const moduleRegistry = {
    MODULE_REGISTRY,
    getModuleRegistry,
    getEnabledModules,
    isModuleEnabled,
    registerModule
  };

  window.ModuleRegistry = moduleRegistry;
  window.moduleRegistry = moduleRegistry;
})();
