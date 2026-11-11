const {
  apiRequest,
} = require('./helpers/api-client.cjs');

const {
  createTestPost,
  cleanupTestPosts,
} = require('./helpers/post-fixture.cjs');

const {
  COMMENTS_PATH,
  extractComment,
  createTestComment,
  cleanupTestComments,
} = require('./helpers/comment-fixture.cjs');

describe('GET /api/v1/comments/:id', () => {
  let postId;
  let commentId;

  beforeAll(async () => {
    const { post } = await createTestPost();
    postId = post.id;

    const { comment } = await createTestComment(postId);
    commentId = comment.id;
  });

  afterAll(async () => {
    try {
      await cleanupTestComments();
    } finally {
      await cleanupTestPosts();
    }
  });

  it('deve buscar comentário existente', async () => {
    const response = await apiRequest(
      'GET',
      `${COMMENTS_PATH}/${commentId}`,
    );

    expect(response.status).toBe(200);

    const comment = extractComment(response.data);

    expect(Number(comment.id)).toBe(Number(commentId));
    expect(Number(comment.postId)).toBe(Number(postId));
    expect(comment.content).toBeDefined();
    expect(comment.authorName).toBeDefined();
  });

  it('deve retornar 404 para comentário inexistente', async () => {
    const response = await apiRequest(
      'GET',
      `${COMMENTS_PATH}/4294967295`,
    );

    expect(response.status).toBe(404);
  });

  it('deve retornar 400 para ID inválido', async () => {
    const response = await apiRequest(
      'GET',
      `${COMMENTS_PATH}/abc`,
    );

    expect(response.status).toBe(400);
  });
});