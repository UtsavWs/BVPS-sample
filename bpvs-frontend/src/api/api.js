/**
 * Centralized API helper.
 * All requests go to VITE_API_URL (set in .env).
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get stored token
 */
export const getToken = () => localStorage.getItem('bpvs_token');

/**
 * @param {string} endpoint  - e.g. '/auth/register'
 * @param {object} body     - request JSON body
 * @param {string|undefined} token - auth token (optional)
 * @returns {Promise<{success, message, data}>}
 */
export const apiPost = async (endpoint, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const storedToken = getToken();
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, ...json };
};

/**
 * @param {string} endpoint  - e.g. '/user/profile'
 * @param {string|undefined} token - auth token (optional)
 * @returns {Promise<{success, message, data}>}
 */
export const apiGet = async (endpoint, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const storedToken = getToken();
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, ...json };
};

/**
 * @param {string} endpoint  - e.g. '/user/profile'
 * @param {object} body     - request JSON body
 * @param {string|undefined} token - auth token (optional)
 * @returns {Promise<{success, message, data}>}
 */
export const apiPut = async (endpoint, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const storedToken = getToken();
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, ...json };
};

/**
 * @param {string} endpoint  - e.g. '/admin/users/:id'
 * @param {object} body     - request JSON body
 * @param {string|undefined} token - auth token (optional)
 * @returns {Promise<{success, message, data}>}
 */
export const apiPatch = async (endpoint, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  const storedToken = token || getToken();
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, ...json };
};

/**
 * @param {string} endpoint  - e.g. '/admin/users/:id'
 * @param {string|undefined} token - auth token (optional)
 * @returns {Promise<{success, message, data}>}
 */
export const apiDelete = async (endpoint, token) => {
  const headers = { 'Content-Type': 'application/json' };
  const storedToken = token || getToken();
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers,
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, ...json };
};
