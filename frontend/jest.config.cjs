module.exports = {
  testEnvironment: 'jsdom',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  rootDir: '.', 
  roots: ['<rootDir>/src'], 
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  // Chỉ tìm kiếm các tệp test trong thư mục src/__tests__
  testMatch: [
    '<rootDir>/src/__tests__/**/*.{spec,test}.{js,jsx}',
  ],
 moduleNameMapper: {
    '\\.module\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    '^src/services/api$': '<rootDir>/__mocks__/apiMock.js', 
    '^services/api$': '<rootDir>/__mocks__/apiMock.js',     
    '^./api$': '<rootDir>/__mocks__/apiMock.js',                                                                                       
    '^../services/api$': '<rootDir>/__mocks__/apiMock.js',   
    '^@/(.*)$': '<rootDir>/src/$1',
    '^components/(.*)$': '<rootDir>/src/components/$1',
    '^contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^pages/(.*)$': '<rootDir>/src/pages/$1',
    '^services/(?!api)(.*)$': '<rootDir>/src/services/$1', // Loại trừ api để không bị map 2 lần
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/main.jsx',
    '<rootDir>/src/vite-env.d.ts',
    '<rootDir>/src/setupTests.js',
    '<rootDir>/src/theme.js',
    '<rootDir>/src/App.jsx', 
  ],

  globals: {
    'import.meta': {
      env: {
        VITE_API: 'http://localhost:3000/api/test', 
      },
    },
  },

  testTimeout: 15000,
  verbose: true,
};