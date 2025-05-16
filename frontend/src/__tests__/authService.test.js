import AuthService from '../services/authService';
import api from '../services/api';

jest.mock('../services/api'); 

describe('AuthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('should register a user successfully', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const mockResponse = { data: { id: '123', ...userData, token: 'fake-token' } };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.register(userData);

      expect(api.post).toHaveBeenCalledWith('/users/register', userData);
      expect(result).toEqual(mockResponse.data);
    });

    test('should throw error if registration API call fails', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const errorMessage = 'Registration failed';
      api.post.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

      await expect(AuthService.register(userData)).rejects.toEqual({ message: errorMessage });
      expect(api.post).toHaveBeenCalledWith('/users/register', userData);
    });
  });

  describe('login', () => {
    test('should login a user successfully', async () => {
      const credentials = { emailOrUsername: 'test@example.com', password: 'password123' };
      const mockResponse = { data: { id: '123', name: 'Test User', token: 'fake-token' } };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/users/login', credentials);
      expect(result).toEqual(mockResponse.data);
    });

    test('should throw error if login API call fails', async () => {
      const credentials = { emailOrUsername: 'test@example.com', password: 'password123' };
      const errorMessage = 'Invalid credentials';
      api.post.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

      await expect(AuthService.login(credentials)).rejects.toEqual({ message: errorMessage });
      expect(api.post).toHaveBeenCalledWith('/users/login', credentials);
    });
  });
});