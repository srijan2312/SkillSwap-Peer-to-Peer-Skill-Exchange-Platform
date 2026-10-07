import axios from 'axios';

// Backend base URL: set VITE_API_URL in a `.env` file (see .env.example),
// otherwise the local dev server is used.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the stored JWT to every request so protected endpoints work.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillswap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// The API origin (no trailing /api) — used to build absolute URLs for
// uploaded avatars, which the API serves at /uploads/avatars/…
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// PUT with a FormData body (avatar upload). Native fetch is used instead of
// axios on purpose: axios force-defaults the Content-Type of PUT/POST
// requests to 'application/x-www-form-urlencoded' when none is set, which
// stops the browser from generating the multipart boundary that multer
// needs — the file would silently never arrive (the request still returns
// 200, so it looks like it worked). fetch sets the correct
// 'multipart/form-data; boundary=…' automatically.
// The thrown error is shaped like an axios error so apiErrorMessage() works.
export async function putFormData(url, formData) {
  const token = localStorage.getItem('skillswap_token');
  const res = await fetch(`${API_URL}${url}`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* non-JSON response */
  }
  if (!res.ok) {
    const err = new Error('Upload failed');
    err.response = { data, status: res.status };
    throw err;
  }
  return data;
}

export default api;

// Pull a friendly message out of an axios error.
// The API contract says errors look like { message: '...' }.
export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || fallback;
}
