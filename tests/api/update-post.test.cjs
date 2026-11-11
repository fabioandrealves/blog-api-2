
const {
  apiRequest,
  POSTS_PATH,
  extractPost,
} = require('./helpers/api-client.cjs');

const {
  getTeacherToken,
  getOtherTeacherToken,
  getStudentToken,
} = require('./helpers/auth-helper.cjs');

const {
  createTestPost,
  cleanupTestPosts,
} = require('./helpers/post-fixture.cjs');

describe('PUT /api/v1/posts/:id', () => {
  afterAll(async () => {
    await cleanupTestPosts();
  });

  it('deve atualizar um post do próprio professor', async () => {
    const { post } = await createTestPost();

    const token = await getTeacherToken();

    const input = {
      title: 'Título atualizado',
      content: 'Conteúdo atualizado',
    };

    const response = await apiRequest(
      'PUT',
      `${POSTS_PATH}/${post.id}`,
      { token, body: input },
    );

    expect(response.status).toBe(200);

    const getResponse = await apiRequest(
      'GET',
      `${POSTS_PATH}/${post.id}`,
    );

    expect(getResponse.status).toBe(200);

    const updatedPost = extractPost(getResponse.data);

    expect(updatedPost.title).toBe(input.title);
    expect(updatedPost.content).toBe(input.content);
  });

  it('deve rejeitar atualização sem autenticação', async () => {
    const { post } = await createTestPost();

    const response = await apiRequest(
      'PUT',
      `${POSTS_PATH}/${post.id}`,
      {
        body: {
          title: 'Alteração não autorizada',
          content: 'Conteúdo alterado',
        },
      },
    );

    expect(response.status).toBe(401);
  });

  it('deve impedir atualização por estudante', async () => {
    const { post } = await createTestPost();

    const token = await getStudentToken();

    const response = await apiRequest(
      'PUT',
      `${POSTS_PATH}/${post.id}`,
      {
        token,
        body: {
          title: 'Alteração do estudante',
          content: 'Conteúdo alterado',
        },
      },
    );

    expect(response.status).toBe(403);
  });

  it('deve impedir outro professor de editar o post', async () => {
    const { post, input } = await createTestPost();

    const otherToken = await getOtherTeacherToken();

    const response = await apiRequest(
      'PUT',
      `${POSTS_PATH}/${post.id}`,
      {
        token: otherToken,
        body: {
          title: 'Alteração indevida',
          content: 'Conteúdo indevido',
        },
      },
    );

    expect([403, 404]).toContain(response.status);

    const getResponse = await apiRequest(
      'GET',
      `${POSTS_PATH}/${post.id}`,
    );

    expect(getResponse.status).toBe(200);

    const unchangedPost = extractPost(getResponse.data);

    expect(unchangedPost.title).toBe(input.title);
    expect(unchangedPost.content).toBe(input.content);
  });
});
