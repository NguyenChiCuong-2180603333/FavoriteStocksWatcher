import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext'; 
import AuthService from '../services/authService'; 
import RegisterPage from '../pages/RegisterPage'; 

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

describe('RegisterPage Component', () => {
  let mockAuthContextRegister; 

  beforeEach(() => {
    mockAuthContextRegister = jest.fn();
    useAuth.mockReturnValue({
      register: mockAuthContextRegister, 
      user: null, 
      isLoading: false, 
    });

    // Clear mocks trước mỗi test
    AuthService.register.mockClear();
    mockNavigate.mockClear();
    mockAuthContextRegister.mockClear();
  });

  const renderRegisterPage = () => {
    render(
      <Router>
        {}
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </Router>
    );
  };

  test('renders registration form elements', () => {
    renderRegisterPage();
    expect(screen.getByLabelText(/Tên đầy đủ/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên người dùng \(username\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Địa chỉ Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đăng Ký/i })).toBeInTheDocument();
    expect(screen.getByText(/Đã có tài khoản\? Đăng nhập/i)).toBeInTheDocument();
  });

  test('allows typing into form fields', async () => {
    renderRegisterPage();
    await userEvent.type(screen.getByLabelText(/Tên đầy đủ/i), 'Test User Full');
    await userEvent.type(screen.getByLabelText(/Tên người dùng \(username\)/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/Địa chỉ Email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Mật khẩu/i), 'password123');

    expect(screen.getByLabelText(/Tên đầy đủ/i)).toHaveValue('Test User Full');
    expect(screen.getByLabelText(/Tên người dùng \(username\)/i)).toHaveValue('testuser');
    expect(screen.getByLabelText(/Địa chỉ Email/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/Mật khẩu/i)).toHaveValue('password123');
  });

  test('shows error if password is less than 6 characters', async () => {
    renderRegisterPage();
    await userEvent.type(screen.getByLabelText(/Tên đầy đủ/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/Tên người dùng \(username\)/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/Địa chỉ Email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Mật khẩu/i), '123'); // Mật khẩu ngắn

    fireEvent.click(screen.getByRole('button', { name: /Đăng Ký/i }));

    expect(await screen.findByText('Mật khẩu phải có ít nhất 6 ký tự.')).toBeInTheDocument();
    expect(AuthService.register).not.toHaveBeenCalled();
    expect(mockAuthContextRegister).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('calls AuthService.register, authContext.register, and navigates on successful registration', async () => {
    const mockUserData = { _id: 'user123', name: 'Test User Full', username: 'testuser', email: 'test@example.com', token: 'fake-jwt-token' };
    AuthService.register.mockResolvedValueOnce(mockUserData);

    renderRegisterPage();

    await userEvent.type(screen.getByLabelText(/Tên đầy đủ/i), 'Test User Full');
    await userEvent.type(screen.getByLabelText(/Tên người dùng \(username\)/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/Địa chỉ Email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Mật khẩu/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /Đăng Ký/i });
    fireEvent.click(submitButton);

    // Chờ nút chuyển sang trạng thái loading 
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();


    await waitFor(() => {
      expect(AuthService.register).toHaveBeenCalledWith({
        name: 'Test User Full',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockAuthContextRegister).toHaveBeenCalledWith(mockUserData);
    expect(mockNavigate).toHaveBeenCalledWith('/');

    await waitFor(() => expect(submitButton).not.toBeDisabled());
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('shows error message on AuthService.register failure', async () => {
    const errorMessage = 'Email đã được sử dụng.';
    AuthService.register.mockRejectedValueOnce({ message: errorMessage });

    renderRegisterPage();

    await userEvent.type(screen.getByLabelText(/Tên đầy đủ/i), 'Test User Full');
    await userEvent.type(screen.getByLabelText(/Tên người dùng \(username\)/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/Địa chỉ Email/i), 'taken@example.com');
    await userEvent.type(screen.getByLabelText(/Mật khẩu/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /Đăng Ký/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(mockAuthContextRegister).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();

    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  test('displays loading indicator when submitting', async () => {
    // Mock AuthService.register để giữ trạng thái pending
    AuthService.register.mockImplementation(() => new Promise(() => {}));
    renderRegisterPage();

    await userEvent.type(screen.getByLabelText(/Tên đầy đủ/i), 'Test User Full');
    await userEvent.type(screen.getByLabelText(/Tên người dùng \(username\)/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/Địa chỉ Email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Mật khẩu/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /Đăng Ký/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); 
  });
});