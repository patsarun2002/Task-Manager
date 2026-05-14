// __mocks__/prisma.js — stub เปล่า, test ใช้ jest.unstable_mockModule แทน
const noop = () => {};
const prisma = {
  user:         { findUnique: noop, create: noop },
  refreshToken: { findUnique: noop, create: noop, delete: noop, deleteMany: noop },
  task:         { findMany: noop, findFirst: noop, findUnique: noop, create: noop,
                  update: noop, delete: noop, count: noop, aggregate: noop },
  subtask:      { create: noop, findFirst: noop, update: noop, delete: noop, deleteMany: noop },
  $transaction: (ops) => Promise.all(ops),
};
export default prisma;