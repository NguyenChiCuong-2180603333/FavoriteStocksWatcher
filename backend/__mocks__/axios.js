import { jest } from '@jest/globals';

const mockGet = jest.fn((url, config) => {
  return Promise.resolve({ data: { message: 'Default mock response from __mocks__/axios.js' } });
});

const axiosMock = {
  get: mockGet,
};

export default axiosMock;