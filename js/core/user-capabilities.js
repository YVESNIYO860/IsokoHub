(function () {
  const STORAGE_KEY = 'isokoHubUserCapabilities';
  const LEGACY_PROFILE_KEY = 'isokoHubCurrentUser';

  function normalizeCapabilityName(value) {
    if (value == null) return '';
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function readStoredCapabilities() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeCapabilityName).filter(Boolean) : [];
    } catch (error) {
      return [];
    }
  }

  function saveStoredCapabilities(capabilities = []) {
    const normalized = Array.from(new Set((Array.isArray(capabilities) ? capabilities : []).map(normalizeCapabilityName).filter(Boolean)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function getCurrentProfile() {
    try {
      const raw = localStorage.getItem(LEGACY_PROFILE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function inferCapabilitiesFromProfile(profile = null) {
    const user = profile || getCurrentProfile();
    if (!user) return ['customer'];

    const candidates = [];
    if (user.role) candidates.push(user.role);
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (Array.isArray(user.capabilities)) candidates.push(...user.capabilities);
    if (user.email && /^yvesniyonkuru2022@gmail.com$/i.test(user.email)) candidates.push('admin');
    if (user.role === 'admin') candidates.push('admin');

    const normalized = candidates
      .map(normalizeCapabilityName)
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);

    return normalized.length ? normalized : ['customer'];
  }

  function syncCapabilities(profile = null) {
    const user = profile || getCurrentProfile();
    const capabilities = inferCapabilitiesFromProfile(user);
    return saveStoredCapabilities(capabilities);
  }

  function hasCapability(capability, profile = null) {
    const target = normalizeCapabilityName(capability);
    if (!target) return false;
    const existing = inferCapabilitiesFromProfile(profile || getCurrentProfile());
    return existing.includes(target) || (existing.includes('seller') && target === 'customer');
  }

  function getUserCapabilities(profile = null) {
    const current = inferCapabilitiesFromProfile(profile || getCurrentProfile());
    const stored = readStoredCapabilities();
    const merged = [...current, ...stored];
    const final = Array.from(new Set(merged.map(normalizeCapabilityName).filter(Boolean)));
    saveStoredCapabilities(final);
    return final;
  }

  const userCapabilities = {
    STORAGE_KEY,
    readStoredCapabilities,
    saveStoredCapabilities,
    inferCapabilitiesFromProfile,
    syncCapabilities,
    hasCapability,
    getUserCapabilities,
    getCurrentProfile
  };

  window.UserCapabilities = userCapabilities;
  window.userCapabilities = userCapabilities;
})();
