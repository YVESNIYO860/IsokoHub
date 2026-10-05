(function () {
  const DEFAULT_POLICY = {
    market: {
      enabled: true,
      allowedRoles: ['customer', 'seller', 'admin'],
      requiredCapabilities: []
    },
    properties: {
      enabled: false,
      allowedRoles: ['seller', 'business_owner', 'admin'],
      requiredCapabilities: ['seller']
    },
    services: {
      enabled: false,
      allowedRoles: ['service_provider', 'professional', 'admin'],
      requiredCapabilities: ['service_provider']
    },
    businesses: {
      enabled: false,
      allowedRoles: ['business_owner', 'seller', 'admin'],
      requiredCapabilities: ['business_owner']
    },
    jobs: {
      enabled: false,
      allowedRoles: ['employer', 'job_seeker', 'admin'],
      requiredCapabilities: ['employer', 'job_seeker']
    },
    learning: {
      enabled: false,
      allowedRoles: ['instructor', 'customer', 'admin'],
      requiredCapabilities: []
    },
    events: {
      enabled: false,
      allowedRoles: ['organizer', 'customer', 'admin'],
      requiredCapabilities: ['organizer']
    },
    digital: {
      enabled: false,
      allowedRoles: ['seller', 'admin'],
      requiredCapabilities: ['seller']
    }
  };

  function normalizeText(value) {
    if (value == null) return '';
    return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  function resolveCapabilities(user = null) {
    const raw = user || {};
    const values = [
      raw.role,
      raw.account_role,
      raw.primary_role,
      ...(Array.isArray(raw.roles) ? raw.roles : []),
      ...(Array.isArray(raw.capabilities) ? raw.capabilities : [])
    ];

    const normalized = Array.from(new Set(values
      .map(normalizeText)
      .filter(Boolean)));

    return normalized;
  }

  function getModuleAccessState(moduleKey, user = null) {
    const key = normalizeText(moduleKey);
    const policy = DEFAULT_POLICY[key] || {
      enabled: false,
      allowedRoles: ['admin'],
      requiredCapabilities: []
    };

    const capabilities = resolveCapabilities(user);
    const role = normalizeText(user?.role || user?.account_role || user?.primary_role || 'customer');
    const hasAllowedRole = !policy.allowedRoles?.length || policy.allowedRoles.some((entry) => normalizeText(entry) === role || normalizeText(entry) === 'admin');

    const requiredCapabilities = Array.isArray(policy.requiredCapabilities) ? policy.requiredCapabilities : [];
    const hasRequiredCapabilities = requiredCapabilities.length === 0 || requiredCapabilities.some((capability) => capabilities.includes(normalizeText(capability)));

    const allowed = Boolean(policy.enabled) && hasAllowedRole && hasRequiredCapabilities;

    return {
      key,
      enabled: Boolean(policy.enabled),
      allowed,
      role,
      capabilities,
      requiredCapabilities: requiredCapabilities.map(normalizeText),
      reason: allowed ? 'granted' : 'not_allowed'
    };
  }

  function applyModulePolicy(moduleKey, user = null) {
    return getModuleAccessState(moduleKey, user);
  }

  const ModuleAccessPolicy = {
    DEFAULT_POLICY,
    resolveCapabilities,
    getModuleAccessState,
    applyModulePolicy
  };

  window.ModuleAccessPolicy = ModuleAccessPolicy;
  window.moduleAccessPolicy = ModuleAccessPolicy;
})();
