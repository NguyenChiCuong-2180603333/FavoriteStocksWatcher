import React from 'react';
import { render, act, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext'; 
import api from '../services/api'; 
import AuthService from '../services/authService'; 

jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(), 
  defaults: { headers: { common: {} } },
}));

jest.mock('../services/authService', () => ({
  login: jest.fn(),
}));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

const TestConsumerComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'No User'}</div>
      <div data-testid="token">{auth.token || 'No Token'}</div>
      <div data-testid="isLoading">{auth.isLoading ? 'Loading' : 'Not Loading'}</div>
      <button data-testid="logout-button" onClick={auth.logout}>Logout</button>
      <button data-testid="update-user-button" onClick={() => auth.updateUser({ name: 'Updated User' })}>
        Update User
      </button>
    </div>
  );
};

const LoginTriggerComponent = ({ credentials }) => {
    const auth = useAuth();
    const handleLogin = async () => {
        try {
            await auth.login(credentials);
        } catch (error) {
        }
    };
    return (
        <div>
            <div data-testid="user-trigger">{auth.user ? JSON.stringify(auth.user) : 'No User'}</div>
            <div data-testid="token-trigger">{auth.token || 'No Token'}</div>
            <button data-testid="login-trigger-button" onClick={handleLogin}>
                Trigger Login
            </button>
        </div>
    );
};


describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    jest.clearAllMocks(); 

    delete api.defaults.headers.common['Authorization'];

    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  test('initial state when no token in localStorage or sessionStorage', async () => {
    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('isLoading')).toHaveTextContent('Not Loading'));
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
    expect(sessionStorageMock.getItem).toHaveBeenCalledWith('authToken');
    expect(api.get).not.toHaveBeenCalled();
  });

  test('loads user from token in localStorage and sets api header', async () => {
    const mockUser = { id: '1', name: 'Stored User' };
    const fakeToken = 'fake-local-token';

    localStorageMock.getItem.mockReturnValue(fakeToken);
    sessionStorageMock.getItem.mockReturnValue(null); 
    api.get.mockResolvedValueOnce({ data: mockUser });

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser)));
    expect(screen.getByTestId('token')).toHaveTextContent(fakeToken);
    expect(api.get).toHaveBeenCalledWith('/users/profile');
    expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${fakeToken}`);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
    expect(sessionStorageMock.getItem).not.toHaveBeenCalled(); 
  });

  test('loads user from token in sessionStorage if not in localStorage and sets api header', async () => {
    const mockUser = { id: '2', name: 'Session User' };
    const fakeToken = 'fake-session-token';

    localStorageMock.getItem.mockReturnValue(null); 
    sessionStorageMock.getItem.mockReturnValue(fakeToken); 
    api.get.mockResolvedValueOnce({ data: mockUser });

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser)));
    expect(screen.getByTestId('token')).toHaveTextContent(fakeToken);
    expect(api.get).toHaveBeenCalledWith('/users/profile');
    expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${fakeToken}`);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
    expect(sessionStorageMock.getItem).toHaveBeenCalledWith('authToken');
  });


  test('handles error when loading user from token and clears token/user from both storages', async () => {
    const fakeToken = 'invalid-token';
    localStorageMock.getItem.mockReturnValue(fakeToken); 
    api.get.mockRejectedValueOnce(new Error('Failed to load profile'));

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('token')).toHaveTextContent('No Token');
    });

    expect(api.get).toHaveBeenCalledWith('/users/profile');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });

  describe('login function', () => {
    const mockCredentials = { email: 'test@example.com', password: 'password' };
    const mockUserData = { id: '3', name: 'Test User', email: 'test@example.com' };
    const loginToken = 'new-login-token';

    test('sets user, token, localStorage (rememberMe=true), and api header on successful login', async () => {
      const credentialsWithRememberMe = { ...mockCredentials, rememberMe: true };
      AuthService.login.mockResolvedValueOnce({ token: loginToken, ...mockUserData });
      api.get.mockResolvedValueOnce({ data: mockUserData });


      render(
        <AuthProvider>
          <LoginTriggerComponent credentials={credentialsWithRememberMe} />
        </AuthProvider>
      );
      
      await waitFor(() => expect(screen.getByTestId('user-trigger')).toHaveTextContent('No User'));
      expect(screen.getByTestId('token-trigger')).toHaveTextContent('No Token');

      fireEvent.click(screen.getByTestId('login-trigger-button'));

      await waitFor(() => {
          expect(AuthService.login).toHaveBeenCalledWith(credentialsWithRememberMe);
          expect(screen.getByTestId('user-trigger')).toHaveTextContent(JSON.stringify(mockUserData));
      });
      
      expect(screen.getByTestId('token-trigger')).toHaveTextContent(loginToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', loginToken);
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${loginToken}`);
      expect(api.get).toHaveBeenCalledWith('/users/profile');
    });

    test('sets user, token, sessionStorage (rememberMe=false), and api header on successful login', async () => {
      const credentialsWithoutRememberMe = { ...mockCredentials, rememberMe: false };
      AuthService.login.mockResolvedValueOnce({ token: loginToken, ...mockUserData });
      api.get.mockResolvedValueOnce({ data: mockUserData }); 
      render(
        <AuthProvider>
          <LoginTriggerComponent credentials={credentialsWithoutRememberMe} />
        </AuthProvider>
      );
      fireEvent.click(screen.getByTestId('login-trigger-button'));

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledWith(credentialsWithoutRememberMe);
        expect(screen.getByTestId('user-trigger')).toHaveTextContent(JSON.stringify(mockUserData));
      });
      expect(screen.getByTestId('token-trigger')).toHaveTextContent(loginToken);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('authToken', loginToken);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${loginToken}`);
      expect(api.get).toHaveBeenCalledWith('/users/profile');
    });

    test('handles login failure, clears user/token from both storages, and re-throws error', async () => {
      const loginError = { response: { data: { message: 'Invalid credentials' } } };
      AuthService.login.mockRejectedValueOnce(loginError);

      render(
        <AuthProvider>
          <LoginTriggerComponent credentials={mockCredentials} />
        </AuthProvider>
      );
      
      fireEvent.click(screen.getByTestId('login-trigger-button'));

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledWith(mockCredentials);
      });

      await waitFor(() => {
          expect(screen.getByTestId('user-trigger')).toHaveTextContent('No User');
          expect(screen.getByTestId('token-trigger')).toHaveTextContent('No Token');
      });
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
      
    });
  });


  test('logout function clears user, token, both storages, and api header', async () => {
    const initialUser = { id: '1', name: 'Initial User' };
    const initialToken = 'initial-token';
    localStorageMock.getItem.mockReturnValue(initialToken); 
    api.get.mockResolvedValueOnce({ data: initialUser }); 

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(initialUser)));
    expect(screen.getByTestId('token')).toHaveTextContent(initialToken);
    expect(api.get).toHaveBeenCalledTimes(1); 

    const logoutButton = screen.getByTestId('logout-button');
    await act(async () => {
      fireEvent.click(logoutButton);
    });

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('No User'));
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    expect(api.get).toHaveBeenCalledTimes(1); 
  });

  test('updateUser function updates user state correctly', async () => {
    const initialUser = { _id: '1', name: 'Initial User', email: 'initial@test.com' };
    const initialToken = 'update-test-token';

    localStorageMock.getItem.mockReturnValue(initialToken);
    api.get.mockResolvedValueOnce({ data: initialUser }); 

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(initialUser)));

    const updateUserButton = screen.getByTestId('update-user-button');
    const updates = { name: 'Updated User' }; 

    await act(async () => {
      fireEvent.click(updateUserButton);
    });

    const expectedUser = { ...initialUser, ...updates };
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(expectedUser)));

    expect(screen.getByTestId('token')).toHaveTextContent(initialToken);
    expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${initialToken}`);
  });
});