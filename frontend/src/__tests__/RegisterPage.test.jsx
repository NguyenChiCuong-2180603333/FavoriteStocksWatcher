import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import RegisterPage from '../pages/RegisterPage';

jest.mock('../services/authService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RegisterPage Component', () => {
  beforeEach(() => {
    AuthService.register.mockReset();
    mockNavigate.mockClear();
    jest.useRealTimers();
  });

  const renderRegisterPage = () => {
    return render(
      <Router>
        <RegisterPage />
      </Router>
    );
  };

  test('renders registration form elements', () => {
    renderRegisterPage();
    expect(screen.getByLabelText(/Tên đầy đủ/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên người dùng \(username\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Địa chỉ Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu \*$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Xác nhận Mật khẩu \*$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tôi đồng ý với/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đăng Ký/i })).toBeInTheDocument();
    expect(screen.getByText(/Đã có tài khoản\? Đăng nhập/i)).toBeInTheDocument();
  });

  test('allows typing into form fields and toggling terms agreement', async () => {
    const user = userEvent.setup();
    renderRegisterPage();
    const nameInput = screen.getByLabelText(/Tên đầy đủ/i);
    const usernameInput = screen.getByLabelText(/Tên người dùng \(username\)/i);
    const emailInput = screen.getByLabelText(/Địa chỉ Email/i);
    const passwordInput = screen.getByLabelText(/^Mật khẩu \*$/i);
    const confirmPasswordInput = screen.getByLabelText(/^Xác nhận Mật khẩu \*$/i);
    const agreedToTermsCheckbox = screen.getByLabelText(/Tôi đồng ý với/i);

    await user.type(nameInput, 'John Doe');
    await user.type(usernameInput, 'johndoe');
    await user.type(emailInput, 'john.doe@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(agreedToTermsCheckbox);

    expect(nameInput).toHaveValue('John Doe');
    expect(usernameInput).toHaveValue('johndoe');
    expect(emailInput).toHaveValue('john.doe@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
    expect(agreedToTermsCheckbox).toBeChecked();
  });

  const validationTestCases = [
    { field: /Tên đầy đủ/i, value: '', errorMessage: 'Vui lòng nhập tên đầy đủ.' },
    { field: /Tên người dùng \(username\)/i, value: '', errorMessage: 'Vui lòng nhập tên người dùng (username).', prefill: { name: 'Test User'} },
    { field: /Địa chỉ Email/i, value: '', errorMessage: 'Vui lòng nhập địa chỉ email.', prefill: { name: 'Test User', username: 'testuser'} },
    { field: /Địa chỉ Email/i, value: 'invalid-email', errorMessage: 'Địa chỉ email không hợp lệ.', prefill: { name: 'Test User', username: 'testuser'} },
    { field: /^Mật khẩu \*$/i, value: '', errorMessage: 'Vui lòng nhập mật khẩu.', prefill: { name: 'Test User', username: 'testuser', email: 'test@example.com'} },
    { field: /^Mật khẩu \*$/i, value: 'short', errorMessage: 'Mật khẩu phải có ít nhất 6 ký tự.', prefill: { name: 'Test User', username: 'testuser', email: 'test@example.com'} },
    {
      field: /^Xác nhận Mật khẩu \*$/i,
      value: 'mismatch',
      errorMessage: 'Mật khẩu và mật khẩu xác nhận không khớp.',
      prefill: { name: 'Test User', username: 'testuser', email: 'test@example.com', password: 'password123' }
    },
  ];

  validationTestCases.forEach(({ field, value, errorMessage, prefill }) => {
    test(`shows error Alert if ${field.source.replace(/[\\^$*+?.()|[\]{}]/g, '')} is invalid: "${value}"`, async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      if (prefill?.name) await user.type(screen.getByLabelText(/Tên đầy đủ/i), prefill.name);
      if (prefill?.username) await user.type(screen.getByLabelText(/Tên người dùng \(username\)/i), prefill.username);
      if (prefill?.email) await user.type(screen.getByLabelText(/Địa chỉ Email/i), prefill.email);
      if (prefill?.password) await user.type(screen.getByLabelText(/^Mật khẩu \*$/i), prefill.password);
      
      if (value) await user.type(screen.getByLabelText(field), value);
      
      const submitButton = screen.getByRole('button', { name: /Đăng Ký/i });
      await user.click(submitButton);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(errorMessage);
      expect(AuthService.register).not.toHaveBeenCalled();
    });
  });

  test('shows error Alert if terms are not agreed', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/Tên đầy đủ/i), 'Test User');
    await user.type(screen.getByLabelText(/Tên người dùng \(username\)/i), 'testuser');
    await user.type(screen.getByLabelText(/Địa chỉ Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^Mật khẩu \*$/i), 'password123');
    await user.type(screen.getByLabelText(/^Xác nhận Mật khẩu \*$/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /Đăng Ký/i });
    await user.click(submitButton);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Bạn phải đồng ý với các điều khoản dịch vụ để đăng ký.');
    expect(AuthService.register).not.toHaveBeenCalled();
  });

  test('calls AuthService.register, shows success, and navigates on successful registration', async () => {
    const user = userEvent.setup();
    const mockSuccessResponse = { message: 'Đăng ký thành công! Vui lòng đăng nhập.' };
    AuthService.register.mockImplementation(() => Promise.resolve(mockSuccessResponse));

    renderRegisterPage();

    const nameInput = screen.getByLabelText(/Tên đầy đủ/i);
    const usernameInput = screen.getByLabelText(/Tên người dùng \(username\)/i);
    const emailInput = screen.getByLabelText(/Địa chỉ Email/i);
    const passwordInput = screen.getByLabelText(/^Mật khẩu \*$/i);
    const confirmPasswordInput = screen.getByLabelText(/^Xác nhận Mật khẩu \*$/i);
    const agreedToTermsCheckbox = screen.getByLabelText(/Tôi đồng ý với/i);
    const submitButton = screen.getByRole('button', { name: /Đăng Ký/i });

    await user.type(nameInput, 'Jane Doe');
    await user.type(usernameInput, 'janedoe');
    await user.type(emailInput, 'jane.doe@example.com');
    await user.type(passwordInput, 'securePa$$word');
    await user.type(confirmPasswordInput, 'securePa$$word');
    await user.click(agreedToTermsCheckbox);
    
    await act(async () => {
        await user.click(submitButton);
    });

    await waitFor(() => {
      expect(AuthService.register).toHaveBeenCalledWith({
        name: 'Jane Doe',
        username: 'janedoe',
        email: 'jane.doe@example.com',
        password: 'securePa$$word',
        confirmPassword: 'securePa$$word',
        agreedToTerms: true,
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 4000 });

  }, 20000);

  test('shows error Alert on AuthService.register failure with a message', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Tên người dùng đã tồn tại.';
    AuthService.register.mockImplementation(() => Promise.reject(new Error(errorMessage)));

    renderRegisterPage();

    await user.type(screen.getByLabelText(/Tên đầy đủ/i), 'Test User');
    await user.type(screen.getByLabelText(/Tên người dùng \(username\)/i), 'testuser');
    await user.type(screen.getByLabelText(/Địa chỉ Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^Mật khẩu \*$/i), 'password123');
    await user.type(screen.getByLabelText(/^Xác nhận Mật khẩu \*$/i), 'password123');
    await user.click(screen.getByLabelText(/Tôi đồng ý với/i));
    
    const submitButton = screen.getByRole('button', { name: /Đăng Ký/i });
    await act(async () => {
        await user.click(submitButton);
    });

    await waitFor(() => {
      expect(AuthService.register).toHaveBeenCalledTimes(1);
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(errorMessage);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('shows default error Alert if AuthService.register fails without a message', async () => {
    const user = userEvent.setup();
    AuthService.register.mockImplementation(() => Promise.reject({})); 

    renderRegisterPage();
    
    await user.type(screen.getByLabelText(/Tên đầy đủ/i), 'Test User');
    await user.type(screen.getByLabelText(/Tên người dùng \(username\)/i), 'testuser');
    await user.type(screen.getByLabelText(/Địa chỉ Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^Mật khẩu \*$/i), 'password123');
    await user.type(screen.getByLabelText(/^Xác nhận Mật khẩu \*$/i), 'password123');
    await user.click(screen.getByLabelText(/Tôi đồng ý với/i));

    const submitButton = screen.getByRole('button', { name: /Đăng Ký/i });
    await act(async () => {
        await user.click(submitButton);
    });

    await waitFor(() => {
      expect(AuthService.register).toHaveBeenCalledTimes(1);
    });

    const alert = await screen.findByRole('alert');
    const expectedText = 'Đăng ký không thành công. Vui lòng thử lại.'; 
    
    expect(alert.textContent.trim()).toBe(expectedText.trim());
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});