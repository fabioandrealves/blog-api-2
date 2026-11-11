const {
  apiRequest,
  POSTS_PATH,
} = require('./api-client.cjs');

const {
  getTeacherToken,
} = require('./auth-helper.cjs');

const createdComments = new Map();

const COMMENTS_PATH = '/api/v1/comments';

function getPostCommentsPath(postId) {
  return `${POSTS_PATH}/${postId}/comments`;
}

function extractComment(data) {
  return data?.comment ?? data?.data?.comment ?? data?.data ?? data;
}

function extractComments(data) {
  return Array.isArray(data)
    ? data
    : data?.comments ?? data?.data?.comments ?? data?.data;
}

function makeCommentInput() {
  const uniqueId =
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    content: `Comentário de teste ${uniqueId}`,
  };
}

async function createTestComment(postId, token) {
  const authToken = token ?? await getTeacherToken();
  const input = makeCommentInput();

  const response = await apiRequest(
    'POST',
    getPostCommentsPath(postId),
    {
      token: authToken,
      body: input,
    },
  );

  if (response.status !== 201) {
    throw new Error(
      `Erro ao criar comentário: HTTP ${response.status}. ` +
      JSON.stringify(response.data),
    );
  }

  const comment = extractComment(response.data);
  const id = Number(comment?.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('A API não retornou um ID de comentário válido.');
  }

  createdComments.set(id, authToken);

  return {
    comment,
    input,
    token: authToken,
  };
}

async function deleteTestComment(id, token) {
  const authToken =
    token ?? createdComments.get(Number(id));

  if (!authToken) {
    throw new Error(
      `Token de autoria não encontrado para comentário ${id}.`,
    );
  }

  const response = await apiRequest(
    'DELETE',
    `${COMMENTS_PATH}/${id}`,
    { token: authToken },
  );

  if ([200, 204, 404].includes(response.status)) {
    createdComments.delete(Number(id));
  }

  return response;
}

async function cleanupTestComments() {
  const errors = [];

  for (const [id, token] of [...createdComments]) {
    try {
      const response = await deleteTestComment(id, token);

      if (![200, 204, 404].includes(response.status)) {
        errors.push(`Comentário ${id}: HTTP ${response.status}`);
      }
    } catch (error) {
      errors.push(`Comentário ${id}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Falha na limpeza dos comentários: ${errors.join('; ')}`,
    );
  }
}

module.exports = {
  COMMENTS_PATH,
  getPostCommentsPath,
  extractComment,
  extractComments,
  makeCommentInput,
  createTestComment,
  deleteTestComment,
  cleanupTestComments,
};
