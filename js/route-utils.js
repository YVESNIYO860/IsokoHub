(function (globalScope) {
  function normalizeLocalPath(inputPath = '') {
    const rawPath = typeof inputPath === 'string' ? inputPath : String(inputPath || '');
    if (!rawPath || rawPath === '/') return '/';

    const hashIndex = rawPath.indexOf('#');
    const hash = hashIndex >= 0 ? rawPath.slice(hashIndex) : '';
    const pathWithoutHash = hashIndex >= 0 ? rawPath.slice(0, hashIndex) : rawPath;

    const queryIndex = pathWithoutHash.indexOf('?');
    const query = queryIndex >= 0 ? pathWithoutHash.slice(queryIndex) : '';
    let pathname = queryIndex >= 0 ? pathWithoutHash.slice(0, queryIndex) : pathWithoutHash;

    pathname = pathname.replace(/\/+$|\\+$/g, '');
    if (!pathname || pathname === '.') pathname = '/';

    if (pathname.endsWith('.html')) {
      pathname = pathname.slice(0, -5);
    }

    if (pathname === '/index' || pathname === 'index') {
      pathname = '/';
    } else if (pathname !== '/' && pathname.endsWith('/index')) {
      pathname = pathname.slice(0, -'/index'.length) || '/';
    }

    if (!pathname.startsWith('/')) {
      pathname = '/' + pathname;
    }

    return pathname + query + hash;
  }

  function normalizeAbsoluteUrl(inputUrl, baseUrl = globalScope.location?.href || 'http://localhost') {
    try {
      const targetUrl = String(inputUrl || '');
      if (!targetUrl || targetUrl.startsWith('#')) return targetUrl;
      if (targetUrl.startsWith('mailto:') || targetUrl.startsWith('tel:')) return targetUrl;

      const parsed = new URL(targetUrl, baseUrl);
      const normalizedPath = normalizeLocalPath(parsed.pathname);
      if (normalizedPath !== parsed.pathname) {
        parsed.pathname = normalizedPath;
      }

      return parsed.toString();
    } catch (error) {
      return String(inputUrl || '');
    }
  }

  const exported = { normalizeLocalPath, normalizeAbsoluteUrl };
  globalScope.normalizeLocalPath = exported.normalizeLocalPath;
  globalScope.normalizeAbsoluteUrl = exported.normalizeAbsoluteUrl;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
})(typeof window !== 'undefined' ? window : globalThis);
