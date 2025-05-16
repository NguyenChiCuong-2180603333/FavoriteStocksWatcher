import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('./services/api', () => {
  const { jest: actualJest } = require('@jest/globals');
  return {
    __esModule: true,
    default: {
      get: actualJest.fn(() => Promise.resolve({ data: {} })),
      post: actualJest.fn(() => Promise.resolve({ data: {} })),
      put: actualJest.fn(() => Promise.resolve({ data: {} })),
      delete: actualJest.fn(() => Promise.resolve({ data: {} })),
      defaults: { headers: { common: {} } },
      interceptors: {
        request: { use: actualJest.fn(), eject: actualJest.fn() },
        response: { use: actualJest.fn(), eject: actualJest.fn() },
      },
    },
  };
});