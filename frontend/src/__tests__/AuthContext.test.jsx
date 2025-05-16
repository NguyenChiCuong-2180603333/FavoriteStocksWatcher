import React from 'react';
import { render, act, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import api from '../services/api';

jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  defaults: { headers: { common: {} } },
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

const TestConsumerComponent = ({ loginPayloadForButton }) => {
  const auth = useAuth();


  return (
    <div>
      <div data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'No User'}</div>
      <div data-testid="token">{auth.token || 'No Token'}</div>
      <button
        data-testid="login-button-consumer" 
        onClick={() => {
          if (loginPayloadForButton && auth.login) {
            auth.login(loginPayloadForButton);
          }
        }}
      >
        Login
      </button>
      <button data-testid="logout-button" onClick={auth.logout}>Logout</button>
      <button data-testid="update-user-button" onClick={() => auth.updateUser({ name: 'Updated User', email: 'updated@test.com' })}>
        Update User
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    api.get.mockReset();
    api.post.mockReset();
    delete api.defaults.headers.common['Authorization'];
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('initial state when no token in localStorage', async () => {
    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('No User'));
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
    expect(api.get).not.toHaveBeenCalled();
  });

  test('loads user from token in localStorage and sets api header', async () => {
    const mockUserFromProfile = { _id: '123', name: 'Stored User', email: 'stored@test.com', username: 'storeduser', favoriteStocks: [] };
    const fakeToken = 'fake-auth-token';

    localStorageMock.getItem.mockReturnValue(fakeToken);
    api.get.mockResolvedValueOnce({ data: mockUserFromProfile });

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUserFromProfile)));

    expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
    expect(api.get).toHaveBeenCalledWith('/users/profile');
    expect(screen.getByTestId('token')).toHaveTextContent(fakeToken);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', fakeToken);
    expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${fakeToken}`);
  });

  test('handles error when loading user from token and clears token/user', async () => {
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
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });

  test('login function sets user, token, localStorage, and api header', async () => {
    localStorageMock.getItem.mockReturnValue(null); 

    const expectedUserAfterLogin = { _id: '1', name: 'Test User', username: 'test', email: 'test@test.com', favoriteStocks: [] };
    const loginToken = 'new-login-token';
    const loginPayload = { ...expectedUserAfterLogin, token: loginToken };

    api.get.mockResolvedValueOnce({ data: expectedUserAfterLogin });

    const LoginTriggerComponent = () => {
      const auth = useAuth();
      return (
        <div>
          <div data-testid="user-trigger">{auth.user ? JSON.stringify(auth.user) : 'No User'}</div>
          <div data-testid="token-trigger">{auth.token || 'No Token'}</div>
          <button data-testid="login-trigger-button" onClick={() => auth.login(loginPayload)}>
            Trigger Login
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <LoginTriggerComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-trigger')).toHaveTextContent('No User'));
    expect(screen.getByTestId('token-trigger')).toHaveTextContent('No Token');

    const loginTriggerButton = screen.getByTestId('login-trigger-button');
    await act(async () => {
      fireEvent.click(loginTriggerButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-trigger')).toHaveTextContent(JSON.stringify(expectedUserAfterLogin));
    }, { timeout: 3000 });

    expect(screen.getByTestId('token-trigger')).toHaveTextContent(loginToken);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', loginToken);
    expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${loginToken}`);
    expect(api.get).toHaveBeenCalledWith('/users/profile');
  });

  test('logout function clears user, token, localStorage, and api header', async () => {
    const loggedInUser = { _id: '1', name: 'Initial User', username: 'inituser', email: 'initial@test.com', favoriteStocks: [] };
    const initialToken = 'initial-token';

    localStorageMock.getItem.mockReturnValue(initialToken);
    api.get.mockResolvedValueOnce({ data: loggedInUser }); 

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(loggedInUser)));
    expect(api.get).toHaveBeenCalledTimes(1); 

    const logoutButton = screen.getByTestId('logout-button'); 
    await act(async () => {
      fireEvent.click(logoutButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  test('updateUser function updates user state', async () => {
    const initialUser = { _id: '1', name: 'Initial User', email: 'initial@test.com', username: 'inituser', favoriteStocks: [] };
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
    const updates = { name: 'Updated User', email: 'updated@test.com' };

    await act(async () => {
      fireEvent.click(updateUserButton); 
    });

    const expectedUser = { ...initialUser, ...updates };
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(expectedUser)));

    expect(screen.getByTestId('token')).toHaveTextContent(initialToken); 
    expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', initialToken);
    expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${initialToken}`);
  });
});