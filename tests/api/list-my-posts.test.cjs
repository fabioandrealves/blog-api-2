
const {
  apiRequest,
  POSTS_PATH,
  extractPosts,
} = require('./helpers/api-client.cjs');

const {
  getTeacherToken,
  getStudentToken,
} = require('./helpers/auth-helper.cjs');

const {
  createTestPost,
  cleanupTestPosts,
} = require('./helpers/post-fixture.cjs');

describe('GET /api/v1/posts/me', () => {
  afterAll(async () => {
    await cleanupTestPosts();
  });

  it('deve rejeitar requisição sem token', async () => {
    const response = await apiRequest(
      'GET',
      `${POSTS_PATH}/me`,
    );

    expect(response.status).toBe(401);
  });

  it('deve listar posts do professor autenticado', async () => {
    const { post } = await createTestPost();

    const token = await getTeacherToken();

    const response = await apiRequest(
      'GET',
      `${POSTS_PATH}/me`,
      { token },
    );

    expect(response.status).toBe(200);

    const posts = extractPosts(response.data);

    expect(Array.isArray(posts)).toBe(true);

    expect(
      posts.some((item) => Number(item.id) === Number(post.id)),
    ).toBe(true);
  });

  it('deve impedir acesso de estudante', async () => {
    const token = await getStudentToken();

    const response = await apiRequest(
      'GET',
      `${POSTS_PATH}/me`,
      { token },
    );

    expect(response.status).toBe(403);
  });
});
