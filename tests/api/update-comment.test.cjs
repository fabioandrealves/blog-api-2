const {
  apiRequest,
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

const {
  COMMENTS_PATH,
  extractComment,
  createTestComment,
  cleanupTestComments,
} = require('./helpers/comment-fixture.cjs');

describe('PUT /api/v1/comments/:id', () => {
  let commentId;

  beforeAll(async () => {
    const { post } = await createTestPost();
    const { comment } = await createTestComment(post.id);

    commentId = comment.id;
  });

  afterAll(async () => {
    try {
      await cleanupTestComments();
    } finally {
      await cleanupTestPosts();
    }
  });

  it('deve atualizar comentário do próprio autor', async () => {
    const token = await getTeacherToken();
    const content = 'Comentário atualizado pelo professor.';

    const response = await apiRequest(
      'PUT',
      `${COMMENTS_PATH}/${commentId}`,
      {
        token,
        body: { content },
      },
    );

    expect(response.status).toBe(200);

    const comment = extractComment(response.data);

    expect(comment.content).toBe(content);
  });

  it('deve persistir a atualização', async () => {
    const response = await apiRequest(
      'GET',
      `${COMMENTS_PATH}/${commentId}`,
    );

    expect(response.status).toBe(200);

    const comment = extractComment(response.data);

    expect(comment.content)
      .toBe('Comentário atualizado pelo professor.');
  });

  it('deve impedir edição por outro professor', async () => {
    const token = await getOtherTeacherToken();

    const response = await apiRequest(
      'PUT',
      `${COMMENTS_PATH}/${commentId}`,
      {
        token,
        body: {
          content: 'Edição não autorizada.',
        },
      },
    );

    expect(response.status).toBe(403);
  });

  it('deve impedir edição por estudante não autor', async () => {
    const token = await getStudentToken();

    const response = await apiRequest(
      'PUT',
      `${COMMENTS_PATH}/${commentId}`,
      {
        token,
        body: {
          content: 'Edição indevida.',
        },
      },
    );

    expect(response.status).toBe(403);
  });

  it('não deve modificar conteúdo após tentativas proibidas', async () => {
    const response = await apiRequest(
      'GET',
      `${COMMENTS_PATH}/${commentId}`,
    );

    expect(response.status).toBe(200);

    const comment = extractComment(response.data);

    expect(comment.content)
      .toBe('Comentário atualizado pelo professor.');
  });

  it('deve rejeitar atualização sem autenticação', async () => {
    const response = await apiRequest(
      'PUT',
      `${COMMENTS_PATH}/${commentId}`,
      {
        body: { content: 'Sem autenticação.' },
      },
    );

    expect(response.status).toBe(401);
  });

  it('deve rejeitar conteúdo vazio', async () => {
    const token = await getTeacherToken();

    const response = await apiRequest(
      'PUT',
      `${COMMENTS_PATH}/${commentId}`,
      {
        token,
        body: { content: '' },
      },
    );

    expect(response.status).toBe(400);
  });

  it('deve retornar 404 para comentário inexistente', async () => {
    const token = await getTeacherToken();

    const response = await apiRequest(
      'PUT',
      `${COMMENTS_PATH}/4294967295`,
      {
        token,
        body: { content: 'Conteúdo válido.' },
      },
    );

    expect(response.status).toBe(404);
  });
});