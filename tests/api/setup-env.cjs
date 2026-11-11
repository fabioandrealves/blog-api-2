const path = require('node:path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../.env.test');

const result = dotenv.config({
  path: envPath,
  quiet: true,
});

if (result.error) {
  throw new Error(
    `Erro ao carregar .env.test: ${result.error.message}`,
  );
}

if (!process.env.API_TEST_URL) {
  throw new Error('API_TEST_URL não configurada.');
}

if (!process.env.API_TEST_LOGIN_PATH) {
  throw new Error('API_TEST_LOGIN_PATH não configurada.');
}