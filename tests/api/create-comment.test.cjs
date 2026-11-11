const {
  apiRequest,
} = require('./helpers/api-client.cjs');

const {
  getTeacherToken,
  getStudentToken,
} = require('./helpers/auth-helper.cjs');

const {
  createTestPost,
  cleanupTestPosts,
} = require('./helpers/post-fixture.cjs');

const {
  getPostCommentsPath,
  makeCommentInput,
  createTestComment,
  cleanupTestComments,
} = require('./helpers/comment-fixture.cjs');

describe('POST /api/v1/posts/:postId/comments', () => {
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

  it('deve criar comentário como professor', async () => {
    const { comment, input } = await createTestComment(postId);

    expect(comment.id).toBeDefined();
    expect(Number(comment.postId)).toBe(Number(postId));
    expect(comment.content).toBe(input.content);
  });

  it('deve permitir comentário de estudante', async () => {
    const token = await getStudentToken();

    const { comment, input } = await createTestComment(
      postId,
      token,
    );

    expect(comment.id).toBeDefined();
    expect(comment.content).toBe(input.content);
  });

  it('deve persistir comentário criado', async () => {
    const { comment } = await createTestComment(postId);

    const response = await apiRequest(
      'GET',
      `/api/v1/comments/${comment.id}`,
    );

    expect(response.status).toBe(200);
    expect(Number(response.data.data.comment.id))
      .toBe(Number(comment.id));
  });

  it('deve rejeitar criação sem autenticação', async () => {
    const response = await apiRequest(
      'POST',
      getPostCommentsPath(postId),
      {
        body: makeCommentInput(),
      },
    );

    expect(response.status).toBe(401);
  });

  it('deve rejeitar conteúdo vazio', async () => {
    const token = await getTeacherToken();

    const response = await apiRequest(
      'POST',
      getPostCommentsPath(postId),
      {
        token,
        body: { content: '' },
      },
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar conteúdo apenas com espaços', async () => {
    const token = await getTeacherToken();

    const response = await apiRequest(
      'POST',
      getPostCommentsPath(postId),
      {
        token,
        body: { content: '   ' },
      },
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar post inexistente', async () => {
    const token = await getTeacherToken();

    const response = await apiRequest(
      'POST',
      getPostCommentsPath(4294967295),
      {
        token,
        body: makeCommentInput(),
      },
    );

    expect(response.status).toBe(404);
  });

  it('deve rejeitar ID de post inválido', async () => {
    const token = await getTeacherToken();

    const response = await apiRequest(
      'POST',
      getPostCommentsPath('abc'),
      {
        token,
        body: makeCommentInput(),
      },
    );

    expect(response.status).toBe(400);
  });
});