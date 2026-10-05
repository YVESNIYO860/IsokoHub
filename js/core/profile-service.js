(function () {
  const PROFILE_STORAGE_KEY = 'isokoHubCurrentUser';
  const PROFILE_CACHE_KEY = 'isokoHubProfileServiceCache';

  function safeJsonParse(value, fallback = null) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function normalizeName(value) {
    if (!value) return 'User';
    const trimmed = String(value).trim();
    return trimmed || 'User';
  }

  function getCurrentProfile() {
    const storedProfile = safeJsonParse(localStorage.getItem(PROFILE_STORAGE_KEY), null);
    if (storedProfile) {
      return {
        id: storedProfile.id || null,
        email: storedProfile.email || '',
        name: normalizeName(storedProfile.name || storedProfile.full_name || storedProfile.email || 'User'),
        full_name: normalizeName(storedProfile.full_name || storedProfile.name || storedProfile.email || 'User'),
        phone: storedProfile.phone || '',
        avatarUrl: storedProfile.avatarUrl || storedProfile.avatar_url || '',
        role: storedProfile.role || 'customer',
        roles: Array.isArray(storedProfile.roles) ? storedProfile.roles : [],
        capabilities: Array.isArray(storedProfile.capabilities) ? storedProfile.capabilities : [],
        created_at: storedProfile.created_at || new Date().toISOString()
      };
    }

    return {
      id: null,
      email: '',
      name: 'User',
      full_name: 'User',
      phone: '',
      avatarUrl: '',
      role: 'customer',
      roles: [],
      capabilities: [],
      created_at: new Date().toISOString()
    };
  }

  function setCurrentProfile(profile = null) {
    if (!profile) {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    const normalizedProfile = {
      id: profile.id || null,
      email: profile.email || '',
      name: normalizeName(profile.name || profile.full_name || profile.email || 'User'),
      full_name: normalizeName(profile.full_name || profile.name || profile.email || 'User'),
      phone: profile.phone || '',
      avatarUrl: profile.avatarUrl || profile.avatar_url || '',
      role: profile.role || 'customer',
      roles: Array.isArray(profile.roles) ? profile.roles : [],
      capabilities: Array.isArray(profile.capabilities) ? profile.capabilities : [],
      created_at: profile.created_at || new Date().toISOString()
    };

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalizedProfile));
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(normalizedProfile));
    return normalizedProfile;
  }

  function getProfileCapabilities(profile = null) {
    const currentProfile = profile || getCurrentProfile();
    const directValues = [
      currentProfile.role,
      ...(Array.isArray(currentProfile.roles) ? currentProfile.roles : []),
      ...(Array.isArray(currentProfile.capabilities) ? currentProfile.capabilities : [])
    ];

    const normalized = directValues
      .map((value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''))
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);

    if (!normalized.length) {
      return ['customer'];
    }

    return normalized;
  }

  function hasProfileCapability(capability, profile = null) {
    const target = String(capability || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!target) return false;

    const capabilities = getProfileCapabilities(profile || getCurrentProfile());
    return capabilities.includes(target) || (capabilities.includes('seller') && target === 'customer');
  }

  const profileService = {
    PROFILE_STORAGE_KEY,
    PROFILE_CACHE_KEY,
    getCurrentProfile,
    setCurrentProfile,
    getProfileCapabilities,
    hasProfileCapability,
    normalizeName
  };

  window.ProfileService = profileService;
  window.profileService = profileService;
})();
