
const {
  apiRequest,
  POSTS_PATH,
  extractPost,
} = require('./helpers/api-client.cjs');

const {
  getTeacherToken,
  getStudentToken,
} = require('./helpers/auth-helper.cjs');

const {
  makePostInput,
  createTestPost,
  cleanupTestPosts,
} = require('./helpers/post-fixture.cjs');

describe('POST /api/v1/posts', () => {
  afterAll(async () => {
    await cleanupTestPosts();
  });

  it('deve criar um post como professor', async () => {
    const { post, input } = await createTestPost();

    expect(post.id).toBeDefined();
    expect(post.title).toBe(input.title);
    expect(post.content).toBe(input.content);
  });

  it('deve persistir o post criado', async () => {
    const { post } = await createTestPost();

    const response = await apiRequest(
      'GET',
      `${POSTS_PATH}/${post.id}`,
    );

    expect(response.status).toBe(200);

    const persistedPost = extractPost(response.data);

    expect(Number(persistedPost.id)).toBe(Number(post.id));
  });

  it('deve rejeitar criação sem autenticação', async () => {
    const response = await apiRequest('POST', POSTS_PATH, {
      body: makePostInput(),
    });

    expect(response.status).toBe(401);
  });

  it('deve impedir criação por estudante', async () => {
    const token = await getStudentToken();

    const response = await apiRequest('POST', POSTS_PATH, {
      token,
      body: makePostInput(),
    });

    expect(response.status).toBe(403);
  });

  it('deve rejeitar título vazio', async () => {
    const token = await getTeacherToken();

    const response = await apiRequest('POST', POSTS_PATH, {
      token,
      body: {
        title: '',
        content: 'Conteúdo válido',
      },
    });

    expect(response.status).toBe(400);
  });

  it('deve rejeitar conteúdo vazio', async () => {
    const token = await getTeacherToken();

    const response = await apiRequest('POST', POSTS_PATH, {
      token,
      body: {
        title: 'Título válido',
        content: '',
      },
    });

    expect(response.status).toBe(400);
  });
});
