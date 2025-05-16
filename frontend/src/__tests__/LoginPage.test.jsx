import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AuthService from '../services/authService';
import LoginPage from '../pages/LoginPage';
import { ToastContainer } from 'react-toastify'; 


jest.mock('../services/authService');
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage Component', () => {
  let mockLogin;

  beforeEach(() => {
    mockLogin = jest.fn();
    useAuth.mockReturnValue({
      login: mockLogin,
      user: null, 
      isLoading: false,
    });
    AuthService.login.mockClear();
    mockNavigate.mockClear();
  });

  const renderLoginPage = () => {
    render(
      <Router>
        <AuthProvider>
            <LoginPage />
        </AuthProvider>
      </Router>
    );
  };

  test('renders login form elements', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/Email hoặc Tên người dùng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đăng Nhập/i })).toBeInTheDocument();
    expect(screen.getByText(/Chưa có tài khoản\? Đăng ký ngay/i)).toBeInTheDocument();
  });

  test('allows typing into form fields', async () => {
    renderLoginPage();
    const emailInput = screen.getByLabelText(/Email hoặc Tên người dùng/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  test('shows error if fields are empty on submit', async () => {
    renderLoginPage();
    const submitButton = screen.getByRole('button', { name: /Đăng Nhập/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Vui lòng nhập Email/Username và Mật khẩu.')).toBeInTheDocument();
    expect(AuthService.login).not.toHaveBeenCalled();
  });

  test('calls AuthService.login, authContext.login, and navigates on successful login', async () => {
    const userData = { _id: '1', name: 'Test User', token: 'test-token' };
    AuthService.login.mockResolvedValueOnce(userData);

    renderLoginPage();

    const emailInput = screen.getByLabelText(/Email hoặc Tên người dùng/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitButton = screen.getByRole('button', { name: /Đăng Nhập/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(AuthService.login).toHaveBeenCalledWith({
        emailOrUsername: 'test@example.com',
        password: 'password123',
      });
    });
    expect(mockLogin).toHaveBeenCalledWith(userData);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('shows error message on AuthService.login failure', async () => {
    const errorMessage = 'Thông tin không hợp lệ';
    AuthService.login.mockRejectedValueOnce({ message: errorMessage });
    renderLoginPage();

    const emailInput = screen.getByLabelText(/Email hoặc Tên người dùng/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitButton = screen.getByRole('button', { name: /Đăng Nhập/i });

    await userEvent.type(emailInput, 'wrong@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    fireEvent.click(submitButton);

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});