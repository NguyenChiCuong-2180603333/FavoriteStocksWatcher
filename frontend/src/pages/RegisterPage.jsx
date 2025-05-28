import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthService from '../services/authService';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  Alert,
  CssBaseline,
  Avatar,
  FormControlLabel, 
  Checkbox,  
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const defaultTheme = createTheme();

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '', 
    agreedToTerms: false,
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    console.log('handleSubmit called by:', e.target);
    e.preventDefault();
    setError(''); 
    setLoading(true);

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên đầy đủ.');
      setLoading(false);
      return;
    }
    if (!formData.username.trim()) {
      setError('Vui lòng nhập tên người dùng (username).');
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      setError('Vui lòng nhập địa chỉ email.');
      setLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError('Địa chỉ email không hợp lệ.');
        setLoading(false);
        return;
    }
    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu.');
      setLoading(false);
      return;
    }


    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu và mật khẩu xác nhận không khớp.');
      setLoading(false);
      return;
    }
    if (!formData.agreedToTerms) {
      setError('Bạn phải đồng ý với các điều khoản dịch vụ để đăng ký.');
      setLoading(false);
      return;
    }


     try {
      const response = await AuthService.register(formData);

      setSuccessMessage(response.message || 'Đăng ký thành công! Vui lòng đăng nhập.');
      setFormData({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreedToTerms: false,
      });
      setTimeout(() => {
        navigate('/login');
      }, 3000); 

    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      const message = err.message || 'Đăng ký không thành công. Vui lòng thử lại.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Đăng Ký
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Tên đầy đủ"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Tên người dùng (username)"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Địa chỉ Email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Xác nhận Mật khẩu"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
            <FormControlLabel
              control={
                <Checkbox
                  value="agree"
                  color="primary"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleChange}
                  disabled={loading}
                />
             }
              label={
                <Typography variant="body2">
                  Tôi đồng ý với{' '}
                  <Link
                    component={RouterLink}
                    to="/terms"
                    variant="body2"
                    onClick={(e) => e.stopPropagation()} 
                  >
                    Điều khoản dịch vụ
                </Link>
                </Typography>
              }
              sx={{ mt: 1, mb: 1 }}
            />
            
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !!successMessage}
            >
              {loading ? <CircularProgress size={24} /> : 'Đăng Ký'}
            </Button>
            <Box textAlign="center">
              <Link component={RouterLink} to="/login" variant="body2">
                {"Đã có tài khoản? Đăng nhập"}
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default RegisterPage;