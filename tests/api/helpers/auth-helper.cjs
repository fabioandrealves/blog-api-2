
const { apiRequest } = require('./api-client.cjs');

const LOGIN_PATH = process.env.API_TEST_LOGIN_PATH;

const users = {
  teacher: {
    email: process.env.API_TEST_TEACHER_EMAIL,
    password: process.env.API_TEST_TEACHER_PASSWORD,
  },
  otherTeacher: {
    email: process.env.API_TEST_OTHER_TEACHER_EMAIL,
    password: process.env.API_TEST_OTHER_TEACHER_PASSWORD,
  },
  student: {
    email: process.env.API_TEST_STUDENT_EMAIL,
    password: process.env.API_TEST_STUDENT_PASSWORD,
  },
};

const tokenCache = new Map();

function extractToken(data) {
  return (
    data?.token ??
    data?.accessToken ??
    data?.access_token ??
    data?.data?.token ??
    data?.data?.accessToken ??
    data?.data?.access_token
  );
}

async function loginAs(userType) {
  const user = users[userType];

  if (!user) {
    throw new Error(`Tipo de usuário desconhecido: ${userType}`);
  }

  if (!LOGIN_PATH?.startsWith('/')) {
    throw new Error(
      'Configure API_TEST_LOGIN_PATH com a rota real de login.',
    );
  }

  if (!user.email || !user.password) {
    throw new Error(
      `Credenciais não configuradas para ${userType}.`,
    );
  }

  if (tokenCache.has(userType)) {
    return tokenCache.get(userType);
  }

  const response = await apiRequest('POST', LOGIN_PATH, {
    body: {
      email: user.email,
      password: user.password,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Login de ${userType} falhou: HTTP ${response.status}. ` +
      JSON.stringify(response.data),
    );
  }

  const token = extractToken(response.data);

  if (typeof token !== 'string' || token.split('.').length !== 3) {
    throw new Error(
      `A resposta de login de ${userType} não contém um JWT reconhecido. ` +
      'Confira o contrato da resposta da API.',
    );
  }

  tokenCache.set(userType, token);

  return token;
}

function clearAuthCache() {
  tokenCache.clear();
}

async function getTeacherToken() {
  return loginAs('teacher');
}

async function getOtherTeacherToken() {
  return loginAs('otherTeacher');
}

async function getStudentToken() {
  return loginAs('student');
}

module.exports = {
  loginAs,
  clearAuthCache,
  getTeacherToken,
  getOtherTeacherToken,
  getStudentToken,
};
