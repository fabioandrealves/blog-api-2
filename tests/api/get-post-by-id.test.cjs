const {
  apiRequest,
  POSTS_PATH,
  extractPost,
} = require('./helpers/api-client.cjs');

const {
  createTestPost,
  cleanupTestPosts,
} = require('./helpers/post-fixture.cjs');

describe('GET /api/v1/posts/:id', () => {
  afterAll(cleanupTestPosts);

  it('deve retornar um post existente sem token', async () => {
    const { post } = await createTestPost();

    const response = await apiRequest(
      'GET',
      `${POSTS_PATH}/${post.id}`,
    );

    expect(response.status).toBe(200);

    const result = extractPost(response.data);

    expect(result.id).toBe(post.id);
    expect(result.title).toBe(post.title);
  });

  it('deve retornar 404 para post inexistente', async () => {
    const response = await apiRequest(
      'GET',
      `${POSTS_PATH}/2147483647`,
    );

    expect(response.status).toBe(404);
  });
});