const { ApiError } = require('./http');

const PRODUCT_CATEGORIES = [
  'Electronics', 'Fashion', 'Shoes', 'Phones', 'Cars', 'Houses & Rents',
  'Services', 'Businesses', 'Jobs', 'Food', 'Transport', 'Learning',
  'Events', 'Digital', 'Others'
];
const OPTIONAL_SELECT = [
  'id', 'name', 'category', 'price', 'price_min', 'price_max', 'currency',
  'image', 'description', 'condition', 'color', 'specifications', 'district',
  'status', 'created_at'
].join(',');
const CORE_SELECT = [
  'id', 'name', 'category', 'price', 'currency', 'image', 'description',
  'condition', 'district', 'status', 'created_at'
].join(',');

function cleanText(value, maximumLength = 100) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, maximumLength);
}

function cleanFilterValue(value) {
  return value.replace(/[,*()%_\\]/g, '').trim();
}

function validateSearchArguments(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError('Invalid product search filters.', 400);
  }
  const allowedFields = new Set([
    'query', 'category', 'district', 'condition', 'brand', 'sortBy',
    'limit', 'offset', 'minPrice', 'maxPrice', 'specifications'
  ]);
  if (Object.keys(input).some(key => !allowedFields.has(key))) {
    throw new ApiError('Product search filters contain unsupported fields.', 400);
  }
  for (const key of ['query', 'category', 'district', 'condition', 'brand']) {
    if (input[key] != null && typeof input[key] !== 'string') {
      throw new ApiError('Product search filters are invalid.', 400);
    }
  }
  const query = cleanText(input.query, 180);
  const category = cleanText(input.category, 40);
  const district = cleanText(input.district, 60);
  const condition = cleanText(input.condition, 20);
  const brand = cleanText(input.brand, 50);
  const sortBy = input.sortBy || 'relevance';
  const limit = input.limit == null ? 8 : Number(input.limit);
  const offset = input.offset == null ? 0 : Number(input.offset);
  const minimum = input.minPrice == null ? null : Number(input.minPrice);
  const maximum = input.maxPrice == null ? null : Number(input.maxPrice);

  if (query && !query.split(/\s+/).some(term => cleanFilterValue(term))) {
    throw new ApiError('Product search text is invalid.', 400);
  }
  if (district && !cleanFilterValue(district)) throw new ApiError('District filter is invalid.', 400);
  if (brand && !cleanFilterValue(brand)) throw new ApiError('Brand filter is invalid.', 400);
  if (category && !PRODUCT_CATEGORIES.includes(category)) throw new ApiError('Choose a valid product category.', 400);
  if (condition && !['New', 'Used'].includes(condition)) throw new ApiError('Condition must be New or Used.', 400);
  if (!['relevance', 'price_asc', 'price_desc', 'newest'].includes(sortBy)) {
    throw new ApiError('Choose a supported product sort order.', 400);
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 8) throw new ApiError('Product result limit must be between 1 and 8.', 400);
  if (!Number.isInteger(offset) || offset < 0 || offset > 80) throw new ApiError('Product result offset is invalid.', 400);
  if (minimum !== null && (!Number.isFinite(minimum) || minimum < 0 || minimum > 1000000000)) {
    throw new ApiError('Minimum price is invalid.', 400);
  }
  if (maximum !== null && (!Number.isFinite(maximum) || maximum < 0 || maximum > 1000000000)) {
    throw new ApiError('Maximum price is invalid.', 400);
  }
  if (minimum !== null && maximum !== null && minimum > maximum) {
    throw new ApiError('Minimum price cannot be greater than maximum price.', 400);
  }

  const specifications = {};
  if (input.specifications != null) {
    if (!input.specifications || typeof input.specifications !== 'object' || Array.isArray(input.specifications)
      || Object.keys(input.specifications).length > 8) {
      throw new ApiError('Product specification filters are invalid.', 400);
    }
    Object.entries(input.specifications).forEach(([key, value]) => {
      const normalizedKey = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
      if (typeof value !== 'string') throw new ApiError('Product specification filters are invalid.', 400);
      const normalizedValue = cleanText(value, 60);
      if (!/^[a-z][a-z0-9_]{0,39}$/.test(normalizedKey) || !normalizedValue || !cleanFilterValue(normalizedValue)) {
        throw new ApiError('Product specification filters are invalid.', 400);
      }
      specifications[normalizedKey] = normalizedValue;
    });
  }

  return {
    query,
    category,
    district,
    condition,
    brand,
    minPrice: minimum,
    maxPrice: maximum,
    specifications,
    sortBy,
    limit,
    offset
  };
}

function makeSearchParams(filters, select, includeOptionalColumns = true) {
  const params = new URLSearchParams({
    select,
    status: 'eq.approved',
    order: filters.sortBy === 'price_asc' ? 'price.asc'
      : filters.sortBy === 'price_desc' ? 'price.desc'
      : 'created_at.desc',
    limit: '100',
    offset: '0'
  });
  if (filters.category) params.set('category', `eq.${filters.category}`);
  if (filters.condition) params.set('condition', `eq.${filters.condition}`);
  if (filters.district) params.set('district', `ilike.*${cleanFilterValue(filters.district)}*`);

  const terms = [...new Set([...filters.query.split(/\s+/).filter(Boolean), ...(filters.brand ? [filters.brand] : [])])].slice(0, 4);
  if (terms.length) {
    const clauses = terms.flatMap(term => {
      const safeTerm = cleanFilterValue(term);
      if (!safeTerm) return [];
      const fields = [
        `name.ilike.*${safeTerm}*`,
        `description.ilike.*${safeTerm}*`,
        `category.ilike.*${safeTerm}*`
      ];
      if (includeOptionalColumns) fields.push(`specifications->>brand.ilike.*${safeTerm}*`);
      return fields;
    });
    if (clauses.length) params.set('or', `(${clauses.join(',')})`);
  }
  if (includeOptionalColumns) {
    Object.entries(filters.specifications).forEach(([key, value]) => {
      const safeValue = cleanFilterValue(value);
      if (safeValue) params.set(`specifications->>${key}`, `ilike.*${safeValue}*`);
    });
  }
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    if (includeOptionalColumns) {
      const rangeConditions = [];
      const fixedConditions = ['price_min.is.null'];
      if (filters.maxPrice !== null) {
        rangeConditions.push(`price_min.lte.${filters.maxPrice}`);
        fixedConditions.push(`price.lte.${filters.maxPrice}`);
      }
      if (filters.minPrice !== null) {
        rangeConditions.push(`price_max.gte.${filters.minPrice}`);
        fixedConditions.push(`price.gte.${filters.minPrice}`);
      }
      params.set('and', `(or(and(${rangeConditions.join(',')}),and(${fixedConditions.join(',')})))`);
    } else {
      const priceConditions = [];
      if (filters.minPrice !== null) priceConditions.push(`price.gte.${filters.minPrice}`);
      if (filters.maxPrice !== null) priceConditions.push(`price.lte.${filters.maxPrice}`);
      params.set('and', `(${priceConditions.join(',')})`);
    }
  }
  return params;
}

async function readProductRows(response) {
  const rows = await response.json().catch(() => null);
  if (!Array.isArray(rows)) throw new ApiError('Product search returned an invalid response.', 503);
  return rows;
}

async function fetchProductRows(supabaseUrl, anonKey, params, fallbackParams) {
  let response = await fetch(`${supabaseUrl}/rest/v1/products?${params}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    signal: AbortSignal.timeout(10000)
  });
  if (response.ok) return readProductRows(response);

  const errorBody = await response.json().catch(() => ({}));
  const errorText = String(errorBody.message || errorBody.hint || '').toLowerCase();
  if (!/(column|schema cache|could not find)/.test(errorText)
    || !/(specifications|color|price_min|price_max)/.test(errorText)) {
    throw new ApiError('Product search is temporarily unavailable.', 503);
  }

  const fallback = fallbackParams ? new URLSearchParams(fallbackParams) : new URLSearchParams(params);
  fallback.set('select', CORE_SELECT);
  for (const key of Array.from(fallback.keys())) {
    if (key.startsWith('specifications->>')) fallback.delete(key);
  }
  response = await fetch(`${supabaseUrl}/rest/v1/products?${fallback}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new ApiError('Product search is temporarily unavailable.', 503);
  return readProductRows(response);
}

function normalizePublicProduct(row) {
  const numericPrice = row.price == null || row.price === '' ? NaN : Number(row.price);
  const imageValues = Array.isArray(row.image) ? row.image : [row.image];
  const specifications = {};
  if (row.specifications && typeof row.specifications === 'object' && !Array.isArray(row.specifications)) {
    Object.entries(row.specifications).slice(0, 16).forEach(([key, value]) => {
      if (key.startsWith('_') || typeof value !== 'string' && typeof value !== 'number') return;
      const normalized = cleanText(String(value), 120);
      if (normalized) specifications[key] = normalized;
    });
  }
  if (!specifications.color && row.color) specifications.color = cleanText(row.color, 80);

  return {
    id: String(row.id),
    name: cleanText(row.name, 160) || 'Untitled listing',
    category: cleanText(row.category, 60) || 'Other',
    price: Number.isFinite(numericPrice) ? numericPrice : null,
    priceMin: row.price_min != null && row.price_min !== '' && Number.isFinite(Number(row.price_min)) ? Number(row.price_min) : null,
    priceMax: row.price_max != null && row.price_max !== '' && Number.isFinite(Number(row.price_max)) ? Number(row.price_max) : null,
    currency: cleanText(row.currency, 8) || 'RWF',
    image: imageValues.filter(value => typeof value === 'string').slice(0, 4).map(value => value.slice(0, 1200)),
    description: cleanText(row.description, 1200),
    condition: cleanText(row.condition, 30) || '',
    district: cleanText(row.district, 100) || '',
    specifications
  };
}

function matchesPriceRange(row, filters) {
  const price = row.price == null || row.price === '' ? NaN : Number(row.price);
  const minimum = row.price_min ?? row.priceMin;
  const maximum = row.price_max ?? row.priceMax;
  const low = minimum == null ? price : Number(minimum);
  const high = maximum == null ? price : Number(maximum);
  if (filters.minPrice !== null && (!Number.isFinite(high) || high < filters.minPrice)) return false;
  if (filters.maxPrice !== null && (!Number.isFinite(low) || low > filters.maxPrice)) return false;
  return true;
}

function matchesQuery(row, filters) {
  const terms = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const specifications = row.specifications && typeof row.specifications === 'object'
    ? Object.entries(row.specifications).map(([key, value]) => `${key} ${value}`)
    : [];
  const searchableText = [
    row.name,
    row.description,
    row.category,
    ...specifications
  ].filter(Boolean).join(' ').toLowerCase();
  return terms.every(term => searchableText.includes(term));
}

function matchesSpecifications(row, filters) {
  const source = row.specifications && typeof row.specifications === 'object' ? row.specifications : {};
  if (filters.brand) {
    const specificationBrand = source.brand ?? row.brand;
    const searchableText = `${row.name || ''} ${row.description || ''}`;
    const brandMatches = typeof specificationBrand === 'string'
      && specificationBrand.toLowerCase().includes(filters.brand.toLowerCase());
    if (!brandMatches && !searchableText.toLowerCase().includes(filters.brand.toLowerCase())) return false;
  }
  const wanted = filters.specifications;
  return Object.entries(wanted).every(([key, value]) => {
    const actual = source[key] ?? row[key];
    return typeof actual === 'string' && actual.toLowerCase().includes(value.toLowerCase());
  });
}

async function queryPublicProducts(rawFilters = {}) {
  const filters = validateSearchArguments(rawFilters);
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new ApiError('Product search is not configured on this server.', 503);

  const params = makeSearchParams(filters, OPTIONAL_SELECT);
  const fallbackParams = makeSearchParams(filters, CORE_SELECT, false);
  const rows = await fetchProductRows(supabaseUrl, anonKey, params, fallbackParams);
  let matches = rows
    .filter(row => row.status === 'approved')
    .filter(row => matchesQuery(row, filters))
    .filter(row => matchesPriceRange(row, filters))
    .filter(row => matchesSpecifications(row, filters));

  if (filters.sortBy === 'price_asc') matches.sort((a, b) => Number(a.price) - Number(b.price));
  if (filters.sortBy === 'price_desc') matches.sort((a, b) => Number(b.price) - Number(a.price));
  if (filters.sortBy === 'newest') {
    matches.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  }

  const page = matches.slice(filters.offset, filters.offset + filters.limit).map(normalizePublicProduct);
  const hasMore = matches.length > filters.offset + filters.limit;
  return {
    products: page,
    hasMore,
    nextOffset: hasMore ? filters.offset + page.length : null,
    filters
  };
}

async function queryPublicProductsByIds(ids) {
  const safeIds = Array.isArray(ids)
    ? [...new Set(ids.filter(id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(id)))].slice(0, 4)
    : [];
  if (safeIds.length < 2) throw new ApiError('Choose at least two valid product listings to compare.', 400);

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new ApiError('Product search is not configured on this server.', 503);
  const params = new URLSearchParams({
    select: OPTIONAL_SELECT,
    status: 'eq.approved',
    id: `in.(${safeIds.join(',')})`,
    limit: '4'
  });
  const fallbackParams = new URLSearchParams(params);
  fallbackParams.set('select', CORE_SELECT);
  const rows = await fetchProductRows(supabaseUrl, anonKey, params, fallbackParams);
  return rows.filter(row => row.status === 'approved').map(normalizePublicProduct);
}

module.exports = {
  normalizePublicProduct,
  queryPublicProducts,
  queryPublicProductsByIds,
  validateSearchArguments
};
