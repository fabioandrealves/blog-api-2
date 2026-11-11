const {
  apiRequest,
} = require('./helpers/api-client.cjs');

const {
  createTestPost,
  cleanupTestPosts,
} = require('./helpers/post-fixture.cjs');

const {
  getPostCommentsPath,
  extractComments,
  createTestComment,
  cleanupTestComments,
} = require('./helpers/comment-fixture.cjs');

describe('GET /api/v1/posts/:postId/comments', () => {
  let postId;

  beforeAll(async () => {
    const { post } = await createTestPost();
    postId = post.id;
  });

  afterAll(async () => {
    try {
      await cleanupTestComments();
    } finally {
      await cleanupTestPosts();
    }
  });

  it('deve retornar lista vazia para post sem comentários', async () => {
    const response = await apiRequest(
      'GET',
      getPostCommentsPath(postId),
    );

    expect(response.status).toBe(200);
    expect(extractComments(response.data)).toEqual([]);
  });

  it('deve listar comentários existentes', async () => {
    const first = await createTestComment(postId);
    const second = await createTestComment(postId);

    const response = await apiRequest(
      'GET',
      getPostCommentsPath(postId),
    );

    expect(response.status).toBe(200);

    const comments = extractComments(response.data);

    expect(Array.isArray(comments)).toBe(true);

    const ids = comments.map((comment) => Number(comment.id));

    expect(ids).toContain(Number(first.comment.id));
    expect(ids).toContain(Number(second.comment.id));
  });

  it('deve retornar 404 para post inexistente', async () => {
    const response = await apiRequest(
      'GET',
      getPostCommentsPath(4294967295),
    );

    expect(response.status).toBe(404);
  });

  it('deve retornar 400 para ID inválido', async () => {
    const response = await apiRequest(
      'GET',
      getPostCommentsPath('abc'),
    );

    expect(response.status).toBe(400);
  });
});