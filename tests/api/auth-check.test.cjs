
const {
  apiRequest,
  POSTS_PATH,
} = require('./helpers/api-client.cjs');

const {
  loginAs,
} = require('./helpers/auth-helper.cjs');

describe('Verificação da autenticação JWT', () => {
  const credentials = [
    {
      name: 'Professor A',
      userType: 'teacher',
      expectedStatus: 200,
    },
    {
      name: 'Professor B',
      userType: 'otherTeacher',
      expectedStatus: 200,
    },
    {
      name: 'Estudante',
      userType: 'student',
      expectedStatus: 403,
    },
  ];

  it.each(credentials)(
    'deve autenticar $name e validar suas permissões',
    async ({ userType, expectedStatus }) => {
      // Primeiro realiza o login real
      const token = await loginAs(userType);

      expect(token).toBeTruthy();

      // Depois utiliza o JWT retornado pela API
      const response = await apiRequest(
        'GET',
        `${POSTS_PATH}/me`,
        { token },
      );

      expect(response.status).toBe(expectedStatus);
    },
  );

  it('deve rejeitar requisição sem autenticação', async () => {
    const response = await apiRequest(
      'GET',
      `${POSTS_PATH}/me`,
    );

    expect(response.status).toBe(401);
  });
});
