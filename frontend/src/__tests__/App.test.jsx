import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; 
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import App from '../App'; 

jest.mock('../pages/DashboardPage', () => () => <div data-testid="dashboard-page">Dashboard Page</div>);
jest.mock('../pages/LoginPage', () => () => <div data-testid="login-page">Login Page</div>);
jest.mock('../pages/RegisterPage', () => () => <div data-testid="register-page">Register Page</div>);
jest.mock('../pages/SharedListsPage', () => () => <div data-testid="sharing-page">Sharing Page</div>);
jest.mock('../pages/NotFoundPage', () => () => <div data-testid="not-found-page">Not Found Page</div>);

jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

jest.mock('../components/Header', () => () => <header data-testid="mock-header">Mock Header</header>);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), 
  BrowserRouter: ({ children }) => <>{children}</>, 
}));


describe('App Routing', () => {
  const renderAppWithRouter = (initialEntries = ['/'], authState) => {
    useAuth.mockReturnValue(authState);
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  describe('Protected Routes', () => {
    test('redirects to /login if user is not authenticated and tries to access /', async () => {
      renderAppWithRouter(['/'], { user: null, isLoading: false });
      await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
    });

    test('renders DashboardPage for / when user is authenticated', async () => {
      renderAppWithRouter(['/'], { user: { name: 'Test' }, isLoading: false });
      await waitFor(() => expect(screen.getByTestId('dashboard-page')).toBeInTheDocument());
    });

    test('renders SharedListsPage for /sharing when user is authenticated', async () => {
      renderAppWithRouter(['/sharing'], { user: { name: 'Test' }, isLoading: false });
      await waitFor(() => expect(screen.getByTestId('sharing-page')).toBeInTheDocument());
    });

    test('redirects to /login if user is not authenticated and tries to access /sharing', async () => {
      renderAppWithRouter(['/sharing'], { user: null, isLoading: false });
      await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
    });
  });

  describe('Public Routes', () => {
    test('renders LoginPage for /login when user is not authenticated', async () => {
      renderAppWithRouter(['/login'], { user: null, isLoading: false });
      await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
    });

    test('redirects to / from /login if user is authenticated', async () => {
      renderAppWithRouter(['/login'], { user: { name: 'Test' }, isLoading: false });
      await waitFor(() => expect(screen.getByTestId('dashboard-page')).toBeInTheDocument());
    });

    test('renders RegisterPage for /register when user is not authenticated', async () => {
      renderAppWithRouter(['/register'], { user: null, isLoading: false });
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());
    });

    test('redirects to / from /register if user is authenticated', async () => {
      renderAppWithRouter(['/register'], { user: { name: 'Test' }, isLoading: false });
      await waitFor(() => expect(screen.getByTestId('dashboard-page')).toBeInTheDocument());
    });
  });

  describe('NotFound Route', () => {
    test('renders NotFoundPage for unknown routes', async () => {
      renderAppWithRouter(['/some/random/route'], { user: null, isLoading: false });
      await waitFor(() => expect(screen.getByTestId('not-found-page')).toBeInTheDocument());
    });
  });

  describe('Loading State', () => {
    test('shows loading indicator when auth is loading', async () => {
      renderAppWithRouter(['/'], { user: null, isLoading: true });
      await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());
    });
  });
});