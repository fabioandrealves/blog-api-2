module.exports = {
  testEnvironment: 'node',

  testMatch: [
    '**/tests/api/**/*.test.cjs',
  ],

  setupFiles: [
    '<rootDir>/tests/api/setup-env.cjs',
  ],

  clearMocks: true,

  maxWorkers: 1,

  testTimeout: 15000,

  verbose: true,
};