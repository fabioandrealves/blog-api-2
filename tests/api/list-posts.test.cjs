const {
  apiRequest,
  POSTS_PATH,
  extractPosts,
} = require('./helpers/api-client.cjs');

describe('GET /api/v1/posts', () => {
  it('deve permitir listagem sem autenticação', async () => {
    const response = await apiRequest('GET', POSTS_PATH);

    expect(response.status).toBe(200);
    expect(extractPosts(response.data)).toEqual(
      expect.any(Array),
    );
  });
});