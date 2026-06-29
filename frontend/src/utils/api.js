function resolveApiBaseUrl() {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_BACKEND_URL || '';
  }
  if (import.meta.env.VITE_LOCAL_MODE === 'YES') {
    return '';
  }
  if (import.meta.env.VITE_LOCAL_MODE === 'NO') {
    return import.meta.env.VITE_BACKEND_URL || 'https://lgothstore-api.onrender.com';
  }
  return import.meta.env.VITE_API_URL || 'https://lgothstore-api.onrender.com';
}

const API_URL = resolveApiBaseUrl();

let csrfToken = null;

async function fetchCSRFToken() {
  try {
    const res = await fetch(`${API_URL}/csrf-token`, { credentials: 'include' });
    const data = await res.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (e) {
    console.error('Error fetching CSRF token:', e);
    return null;
  }
}

function getCSRFToken() {
  return csrfToken || '';
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  return headers;
}

function getInitialState() {
  const data = document.getElementById('initial-data');
  if (data) {
    try {
      return JSON.parse(data.textContent);
    } catch {
      return null;
    }
  }
  return null;
}

async function apiFetch(url, options = {}) {
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  if (!csrfToken && !url.includes('/csrf-token')) {
    await fetchCSRFToken();
    config.headers['X-CSRF-Token'] = csrfToken || '';
  }

  let res = await fetch(url, config);

  if (res.status === 401) {
    try {
      const body = await res.clone().json();
      if (body.expired) {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          config.headers = { ...config.headers, ...getAuthHeaders() };
          res = await fetch(url, config);
        }
      }
    } catch (e) {
      // Not JSON or other error, continue
    }
  }

  return res;
}

async function refreshAuthToken() {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      return true;
    }
    logout();
    return false;
  } catch (e) {
    logout();
    return false;
  }
}

async function login(username, password, mfaToken = null, tempToken = null) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });

  const data = await res.json();

  if (data.mfaRequired) {
    return { mfaRequired: true, tempToken: data.tempToken };
  }

  if (data.token) {
    localStorage.setItem('token', data.token);
    await fetchCSRFToken();
  }
  return data;
}

async function verifyAuth() {
  const res = await apiFetch(`${API_URL}/auth/verify`);
  if (!res.ok) {
    return { success: false };
  }
  return res.json();
}

async function verifyMFA(token, tempToken) {
  const res = await fetch(`${API_URL}/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, tempToken }),
    credentials: 'include',
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    await fetchCSRFToken();
  }
  return data;
}

async function setupMFA() {
  const res = await apiFetch(`${API_URL}/auth/mfa/setup`);
  return res.json();
}

async function disableMFA() {
  const res = await apiFetch(`${API_URL}/auth/mfa/disable`, { method: 'POST' });
  return res.json();
}

async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (e) {
    // Continue even if logout fails
  }
  localStorage.removeItem('token');
  localStorage.removeItem('products');
  csrfToken = null;
}

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

async function fetchProducts() {
  const res = await fetch(`${API_URL}/products`);
  return res.json();
}

async function addProduct(formData) {
  const res = await apiFetch(`${API_URL}/add`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

async function deleteProduct(index) {
  const res = await apiFetch(`${API_URL}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index }),
  });
  return res.json();
}

async function updateStock(index, stock) {
  const res = await apiFetch(`${API_URL}/update-stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index, stock }),
  });
  return res.json();
}

async function updatePrice(index, current_price, previous_price) {
  const res = await apiFetch(`${API_URL}/update-price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index, current_price, previous_price }),
  });
  return res.json();
}

async function updateImage(index, formData) {
  const res = await apiFetch(`${API_URL}/update-image`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

async function createOrder(order) {
  const res = await fetch(`${API_URL}/create-order`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });

  if (!res.ok) {
    const error = new Error(`Request failed with status ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return res.json();
}

async function apiCall(url, options = {}) {
  const res = await apiFetch(url, options);
  if (!res.ok) {
    const error = new Error(`Request failed with status ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export {
  API_URL, getAuthHeaders, getInitialState, login, logout,
  isAuthenticated, fetchProducts, addProduct, deleteProduct,
  updateStock, updatePrice, updateImage,
  verifyMFA, setupMFA, disableMFA, fetchCSRFToken, getCSRFToken,
  refreshAuthToken, apiCall, verifyAuth, createOrder,
};
