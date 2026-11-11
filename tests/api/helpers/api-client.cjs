
const BASE_URL = process.env.API_TEST_URL?.trim().replace(/\/+$/, '');

if (!BASE_URL) {
  throw new Error('API_TEST_URL não configurada no .env.test.');
}

async function apiRequest(method, path, options = {}) {
  const { token, body } = options;

  const headers = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
    signal: AbortSignal.timeout(10000),
  });

  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
    headers: response.headers,
  };
}

const POSTS_PATH = '/api/v1/posts';

function extractPost(data) {
  return data?.post ?? data?.data?.post ?? data?.data ?? data;
}

function extractPosts(data) {
  return Array.isArray(data)
    ? data
    : data?.posts ?? data?.data?.posts ?? data?.data;
}

module.exports = {
  apiRequest,
  POSTS_PATH,
  extractPost,
  extractPosts,
};
