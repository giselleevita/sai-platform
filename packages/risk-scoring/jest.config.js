module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@sai/shared-types$': '<rootDir>/../shared-types/src/index.ts',
  },
};
