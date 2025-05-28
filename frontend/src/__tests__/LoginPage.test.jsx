import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';

const mockAuthContextLogin = jest.fn();

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
  beforeEach(() => {
    mockAuthContextLogin.mockClear();
    mockNavigate.mockClear();

    useAuth.mockReturnValue({
      login: mockAuthContextLogin,
    });
  });


  const renderLoginPage = () => {
    return render(
      <Router>
        <AuthProvider> {}
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

  test('allows typing into form fields and toggling rememberMe', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    const emailInput = screen.getByLabelText(/Email hoặc Tên người dùng/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const rememberMeCheckbox = screen.getByLabelText(/Ghi nhớ tôi/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(rememberMeCheckbox);

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(rememberMeCheckbox).toBeChecked();
  });

  test('shows error Alert if fields are empty on submit', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    const submitButton = screen.getByRole('button', { name: /Đăng Nhập/i });
    await user.click(submitButton);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Vui lòng nhập Email/Username và Mật khẩu.');
    expect(mockAuthContextLogin).not.toHaveBeenCalled();
  });

  test('calls context login and navigates on successful login', async () => {
    const user = userEvent.setup();
    mockAuthContextLogin.mockResolvedValueOnce(undefined); 

    renderLoginPage();

    const emailInput = screen.getByLabelText(/Email hoặc Tên người dùng/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const rememberMeCheckbox = screen.getByLabelText(/Ghi nhớ tôi/i);
    const submitButton = screen.getByRole('button', { name: /Đăng Nhập/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(rememberMeCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAuthContextLogin).toHaveBeenCalledWith({
        emailOrUsername: 'test@example.com',
        password: 'password123',
        rememberMe: true, 
      });
    });


    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

  });

  test('shows error Alert on context login failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Thông tin không hợp lệ từ context';
    mockAuthContextLogin.mockRejectedValueOnce(new Error(errorMessage));

    renderLoginPage();

    const emailInput = screen.getByLabelText(/Email hoặc Tên người dùng/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitButton = screen.getByRole('button', { name: /Đăng Nhập/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockAuthContextLogin).toHaveBeenCalledWith({
        emailOrUsername: 'wrong@example.com',
        password: 'wrongpassword',
        rememberMe: false, 
      });
    });

    const alert = await screen.findByRole('alert'); 
    expect(alert).toHaveTextContent(errorMessage);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

   test('shows default error message in Alert if context login fails without a message', async () => {
    const user = userEvent.setup();
    mockAuthContextLogin.mockRejectedValueOnce({}); 

    renderLoginPage();

    const emailInput = screen.getByLabelText(/Email hoặc Tên người dùng/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitButton = screen.getByRole('button', { name: /Đăng Nhập/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAuthContextLogin).toHaveBeenCalledWith({
        emailOrUsername: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Đăng nhập không thành công. Vui lòng kiểm tra thông tin và thử lại.');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});