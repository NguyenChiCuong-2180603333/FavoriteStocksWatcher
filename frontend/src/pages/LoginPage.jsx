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

const LoginPage = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.emailOrUsername || !formData.password) {
        setError('Vui lòng nhập Email/Username và Mật khẩu.');
        setLoading(false);
        return;
    }

    try {
      await login({
        emailOrUsername: formData.emailOrUsername,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });
      navigate('/'); 
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      const message = err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra thông tin và thử lại.';
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
            Đăng Nhập
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
              id="emailOrUsername"
              label="Email hoặc Tên người dùng"
              name="emailOrUsername"
              autoComplete="email" 
              autoFocus
              value={formData.emailOrUsername}
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
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            <FormControlLabel
              control={
                <Checkbox
                  value="remember"
                  color="primary"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                />
              }
              label="Ghi nhớ tôi"
              sx={{ mt: 1, mb: 0 }} 
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Đăng Nhập'}
            </Button>
            <Box textAlign="center">
              <Link component={RouterLink} to="/register" variant="body2">
                {"Chưa có tài khoản? Đăng ký ngay"}
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default LoginPage;