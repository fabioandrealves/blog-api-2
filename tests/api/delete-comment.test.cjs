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
  createTestComment,
  deleteTestComment,
  cleanupTestComments,
} = require('./helpers/comment-fixture.cjs');

describe('DELETE /api/v1/comments/:id', () => {
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

  it('deve impedir exclusão sem autenticação', async () => {
    const response = await apiRequest(
      'DELETE',
      `${COMMENTS_PATH}/${commentId}`,
    );

    expect(response.status).toBe(401);
  });

  it('deve impedir exclusão por outro professor', async () => {
    const token = await getOtherTeacherToken();

    const response = await apiRequest(
      'DELETE',
      `${COMMENTS_PATH}/${commentId}`,
      { token },
    );

    expect(response.status).toBe(403);
  });

  it('deve impedir exclusão por estudante não autor', async () => {
    const token = await getStudentToken();

    const response = await apiRequest(
      'DELETE',
      `${COMMENTS_PATH}/${commentId}`,
      { token },
    );

    expect(response.status).toBe(403);
  });

  it('deve manter comentário após exclusões proibidas', async () => {
    const response = await apiRequest(
      'GET',
      `${COMMENTS_PATH}/${commentId}`,
    );

    expect(response.status).toBe(200);
  });

  it('deve permitir exclusão pelo autor', async () => {
    const token = await getTeacherToken();

    const response = await deleteTestComment(
      commentId,
      token,
    );

    expect(response.status).toBe(200);
  });

  it('deve retornar 404 após exclusão', async () => {
    const response = await apiRequest(
      'GET',
      `${COMMENTS_PATH}/${commentId}`,
    );

    expect(response.status).toBe(404);
  });

  it('deve permitir estudante excluir seu próprio comentário', async () => {
    const token = await getStudentToken();

    const { comment } = await createTestComment(
      postId,
      token,
    );

    const response = await deleteTestComment(
      comment.id,
      token,
    );

    expect(response.status).toBe(200);

    const check = await apiRequest(
      'GET',
      `${COMMENTS_PATH}/${comment.id}`,
    );

    expect(check.status).toBe(404);
  });

  it('deve retornar 404 ao excluir comentário inexistente', async () => {
    const token = await getTeacherToken();

    const response = await apiRequest(
      'DELETE',
      `${COMMENTS_PATH}/4294967295`,
      { token },
    );

    expect(response.status).toBe(404);
  });
});