require('dotenv').config({ quiet: true });

const jwt = require('jsonwebtoken');

const users = [
  {
    env: 'API_TEST_TEACHER_TOKEN',
    id: 1,
  },
  {
    env: 'API_TEST_OTHER_TEACHER_TOKEN',
    id: 2,
  },
  {
    env: 'API_TEST_STUDENT_TOKEN',
    id: 3,
  },
];

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET não configurado no .env.');
}

for (const user of users) {
  const token = jwt.sign(
    {},
    jwtSecret,
    {
      subject: String(user.id),
      expiresIn: '1h',
    },
  );

  console.log(`${user.env}=${token}`);
}