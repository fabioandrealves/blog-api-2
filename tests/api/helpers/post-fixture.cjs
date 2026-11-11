
const {
  apiRequest,
  POSTS_PATH,
  extractPost,
} = require('./api-client.cjs');

const {
  getTeacherToken,
} = require('./auth-helper.cjs');

const createdPostIds = new Set();

function makePostInput() {
  const uniqueId =
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    title: `Teste automatizado ${uniqueId}`,
    content: `Conteúdo do teste ${uniqueId}`,
  };
}

async function createTestPost(token) {
  const authToken = token ?? await getTeacherToken();
  const input = makePostInput();

  const response = await apiRequest('POST', POSTS_PATH, {
    token: authToken,
    body: input,
  });

  if (response.status !== 201) {
    throw new Error(
      `Erro ao criar post de teste: HTTP ${response.status}. ` +
      JSON.stringify(response.data),
    );
  }

  const post = extractPost(response.data);
  const id = Number(post?.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('A API não retornou um ID válido.');
  }

  createdPostIds.add(id);

  return {
    post,
    input,
    token: authToken,
  };
}

async function deleteTestPost(id, token) {
  const authToken = token ?? await getTeacherToken();

  const response = await apiRequest(
    'DELETE',
    `${POSTS_PATH}/${id}`,
    { token: authToken },
  );

  if ([200, 204, 404].includes(response.status)) {
    createdPostIds.delete(id);
  }

  return response;
}

async function cleanupTestPosts() {
  if (createdPostIds.size === 0) {
    return;
  }

  const token = await getTeacherToken();
  const errors = [];

  for (const id of [...createdPostIds]) {
    try {
      const response = await deleteTestPost(id, token);

      if (![200, 204, 404].includes(response.status)) {
        errors.push(`Post ${id}: HTTP ${response.status}`);
      }
    } catch (error) {
      errors.push(`Post ${id}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Falha na limpeza: ${errors.join('; ')}`,
    );
  }
}

module.exports = {
  makePostInput,
  createTestPost,
  deleteTestPost,
  cleanupTestPosts,
};
