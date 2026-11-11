
const {
  apiRequest,
  POSTS_PATH,
} = require('./helpers/api-client.cjs');

const {
  getTeacherToken,
  getOtherTeacherToken,
  getStudentToken,
} = require('./helpers/auth-helper.cjs');

const {
  createTestPost,
  deleteTestPost,
  cleanupTestPosts,
} = require('./helpers/post-fixture.cjs');

describe('DELETE /api/v1/posts/:id', () => {
  afterAll(async () => {
    await cleanupTestPosts();
  });

  it('deve excluir um post do próprio professor', async () => {
    const { post } = await createTestPost();

    const token = await getTeacherToken();

    const response = await deleteTestPost(post.id, token);

    expect([200, 204]).toContain(response.status);

    const getResponse = await apiRequest(
      'GET',
      `${POSTS_PATH}/${post.id}`,
    );

    expect(getResponse.status).toBe(404);
  });

  it('deve rejeitar exclusão sem autenticação', async () => {
    const { post } = await createTestPost();

    const response = await apiRequest(
      'DELETE',
      `${POSTS_PATH}/${post.id}`,
    );

    expect(response.status).toBe(401);
  });

  it('deve impedir exclusão por estudante', async () => {
    const { post } = await createTestPost();

    const token = await getStudentToken();

    const response = await apiRequest(
      'DELETE',
      `${POSTS_PATH}/${post.id}`,
      { token },
    );

    expect(response.status).toBe(403);
  });

  it('deve impedir outro professor de excluir o post', async () => {
    const { post } = await createTestPost();

    const otherToken = await getOtherTeacherToken();

    const response = await apiRequest(
      'DELETE',
      `${POSTS_PATH}/${post.id}`,
      { token: otherToken },
    );

    expect([403, 404]).toContain(response.status);

    const getResponse = await apiRequest(
      'GET',
      `${POSTS_PATH}/${post.id}`,
    );

    expect(getResponse.status).toBe(200);
  });
});
