import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import actualTheme from '../theme'; 

jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockOnStockAddedFromHeader = jest.fn();

const mockTheme = {
  ...actualTheme,
  spacing: actualTheme.spacing || ((val) => `${val * 8}px`),
  palette: {
    ...(actualTheme.palette || {}),
    primary: {
      main: actualTheme.palette?.primary?.main || '#1976d2',
      contrastText: actualTheme.palette?.primary?.contrastText || '#fff',
      ...(actualTheme.palette?.primary || {}),
    },
    secondary: {
      main: actualTheme.palette?.secondary?.main || '#dc004e', 
      contrastText: actualTheme.palette?.secondary?.contrastText || '#fff',
      ...(actualTheme.palette?.secondary || {}),
    },
    action: {
      active: actualTheme.palette?.action?.active || 'rgba(0, 0, 0, 0.54)',
      hover: actualTheme.palette?.action?.hover || 'rgba(0, 0, 0, 0.04)',
      selected: actualTheme.palette?.action?.selected || 'rgba(0, 0, 0, 0.08)',
      disabled: actualTheme.palette?.action?.disabled || 'rgba(0, 0, 0, 0.26)',
      disabledBackground: actualTheme.palette?.action?.disabledBackground || 'rgba(0, 0, 0, 0.12)',
      focus: actualTheme.palette?.action?.focus || 'rgba(0, 0, 0, 0.12)',
      ...(actualTheme.palette?.action || {}),
    },
    text: {
      primary: actualTheme.palette?.text?.primary || 'rgba(0, 0, 0, 0.87)', 
      secondary: actualTheme.palette?.text?.secondary || 'rgba(0, 0, 0, 0.6)', 
      disabled: actualTheme.palette?.text?.disabled || 'rgba(0, 0, 0, 0.38)',
      ...(actualTheme.palette?.text || {}),
    },
    error: { 
      main: actualTheme.palette?.error?.main || '#dc3545',
      contrastText: actualTheme.palette?.error?.contrastText || '#fff',
      ...(actualTheme.palette?.error || {}),
    },
    divider: actualTheme.palette?.divider || 'rgba(0, 0, 0, 0.12)', 
    background: {
      paper: actualTheme.palette?.background?.paper || '#fff', 
      default: actualTheme.palette?.background?.default || '#fafafa',
      ...(actualTheme.palette?.background || {}),
    },
    common: {
        black: actualTheme.palette?.common?.black || '#000',
        white: actualTheme.palette?.common?.white || '#fff',
        ...(actualTheme.palette?.common || {}),
    },
    grey: {
        50: actualTheme.palette?.grey?.[50] || '#fafafa',
        100: actualTheme.palette?.grey?.[100] || '#f5f5f5',
        200: actualTheme.palette?.grey?.[200] || '#eeeeee',
        300: actualTheme.palette?.grey?.[300] || '#e0e0e0',
        400: actualTheme.palette?.grey?.[400] || '#bdbdbd',
        500: actualTheme.palette?.grey?.[500] || '#9e9e9e',
        600: actualTheme.palette?.grey?.[600] || '#757575',
        700: actualTheme.palette?.grey?.[700] || '#616161',
        800: actualTheme.palette?.grey?.[800] || '#424242',
        900: actualTheme.palette?.grey?.[900] || '#212121',
        A100: actualTheme.palette?.grey?.A100 || '#f5f5f5',
        A200: actualTheme.palette?.grey?.A200 || '#eeeeee',
        A400: actualTheme.palette?.grey?.A400 || '#bdbdbd',
        A700: actualTheme.palette?.grey?.A700 || '#616161',
        ...(actualTheme.palette?.grey || {}),
    },
  },
  shape: {
    borderRadius: actualTheme.shape?.borderRadius ?? 4,
    ...(actualTheme.shape || {}),
  },
  typography: {
    ...(actualTheme.typography || { fontFamily: 'Roboto, Arial, sans-serif' }),
     button: {
      textTransform: actualTheme.typography?.button?.textTransform || 'uppercase',
      fontSize: actualTheme.typography?.button?.fontSize || '0.875rem',
      fontWeight: actualTheme.typography?.button?.fontWeight || 500,
      ...(actualTheme.typography?.button || {}),
    },
    h6: actualTheme.typography?.h6 || { fontSize: '1.25rem', fontWeight: 500 },
    h5: actualTheme.typography?.h5 || { fontSize: '1.5rem', fontWeight: 400 },
    subtitle1: actualTheme.typography?.subtitle1 || { fontSize: '1rem', fontWeight: 400 },
    subtitle2: actualTheme.typography?.subtitle2 || { fontSize: '0.875rem', fontWeight: 500 },
    caption: actualTheme.typography?.caption || { fontSize: '0.75rem', fontWeight: 400 },
    body1: actualTheme.typography?.body1 || { fontSize: '1rem', fontWeight: 400 },
  },
  components: { 
    ...(actualTheme.components || {}),
     MuiButton: {
        defaultProps: actualTheme.components?.MuiButton?.defaultProps || {},
        styleOverrides: { root: actualTheme.components?.MuiButton?.styleOverrides?.root || {},},
     },
     MuiIconButton: {
        defaultProps: actualTheme.components?.MuiIconButton?.defaultProps || {},
        styleOverrides: { root: actualTheme.components?.MuiIconButton?.styleOverrides?.root || {},},
     },
     MuiAppBar: {
        defaultProps: actualTheme.components?.MuiAppBar?.defaultProps || { color: 'inherit' },
        styleOverrides: { root: actualTheme.components?.MuiAppBar?.styleOverrides?.root || {}, }
     },
     MuiMenu: {
        defaultProps: actualTheme.components?.MuiMenu?.defaultProps || {},
        styleOverrides: { paper: actualTheme.components?.MuiMenu?.styleOverrides?.paper || {}, }
     },
     MuiAvatar: {
        defaultProps: actualTheme.components?.MuiAvatar?.defaultProps || {},
        styleOverrides: { root: actualTheme.components?.MuiAvatar?.styleOverrides?.root || {}, }
     },
     MuiDialog: {
        defaultProps: actualTheme.components?.MuiDialog?.defaultProps || {},
        styleOverrides: { paper: actualTheme.components?.MuiDialog?.styleOverrides?.paper || {}, }
     },
  },
  zIndex: { 
    appBar: actualTheme.zIndex?.appBar || 1100,
    drawer: actualTheme.zIndex?.drawer || 1200,
    modal: actualTheme.zIndex?.modal || 1300,
    ...(actualTheme.zIndex || {})
  },
  transitions: {
    ...(actualTheme.transitions || {}), 
    create: actualTheme.transitions?.create || jest.fn((props, options) => {
      const property = Array.isArray(props) ? props.join(',') : props;
      const duration = options?.duration || '0ms';
      const easing = options?.easing || 'ease';
      const delay = options?.delay || '0ms';
      return `${property} ${duration} ${easing} ${delay}`;
    }),
    duration: {
      shortest: actualTheme.transitions?.duration?.shortest || 150,
      standard: actualTheme.transitions?.duration?.standard || 300,
      ...(actualTheme.transitions?.duration || {}),
    },
    easing: {
      easeInOut: actualTheme.transitions?.easing?.easeInOut || 'cubic-bezier(0.4, 0, 0.2, 1)',
      ...(actualTheme.transitions?.easing || {}),
    },
  },
  direction: actualTheme.direction || 'ltr',
  mixins: { 
    toolbar: actualTheme.mixins?.toolbar || { 
      minHeight: 56,
      '@media (min-width:0px) and (orientation: landscape)': { minHeight: 48 },
      '@media (min-width:600px)': { minHeight: 64 },
     },
    ...(actualTheme.mixins || {})
  },
};

describe('Header Component', () => {
  const renderHeaderWithAuth = (authValue) => {
    useAuth.mockReturnValue(authValue);
    return render(
      <Router>
        <ThemeProvider theme={mockTheme}> {/* SỬ DỤNG mockTheme đầy đủ */}
          <AuthProvider> 
            <Header onStockAddedFromHeader={mockOnStockAddedFromHeader} />
          </AuthProvider>
        </ThemeProvider>
      </Router>
    );
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    mockOnStockAddedFromHeader.mockClear();
    useAuth.mockReturnValue({ user: null, logout: jest.fn(), login: jest.fn(), register: jest.fn(), isLoading: false, updateUser: jest.fn() });
  });

  test('renders app name', () => {
    renderHeaderWithAuth({ user: null, logout: jest.fn() });
    const appNameElements = screen.getAllByText("Stocks Watcher");
    expect(appNameElements.length).toBeGreaterThanOrEqual(1);
    appNameElements.forEach(el => expect(el).toBeInTheDocument());
  });

  test('renders Login and Register buttons when logged out', () => {
    renderHeaderWithAuth({ user: null, logout: jest.fn() });
    expect(screen.getByRole('link', { name: /Đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Đăng ký/i })).toBeInTheDocument();
  });

  describe('when user is logged in', () => {
    const mockUser = { name: 'Cường Nguyễn', username: 'cuong', email: 'cuong@test.com' };
    const mockLogout = jest.fn();

    beforeEach(() => {
      renderHeaderWithAuth({ user: mockUser, logout: mockLogout, login: jest.fn(), register: jest.fn(), isLoading: false, updateUser: jest.fn() });
    });

    test('renders user name, username and email on desktop', () => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getByText(`(${mockUser.username})`)).toBeInTheDocument();
      expect(screen.getByText(`- ${mockUser.email}`)).toBeInTheDocument();
    });

    test('opens user menu when avatar is clicked, and menu items are present', async () => {
      const accountButton = screen.getByRole('button', { name: 'Tài khoản' });
      fireEvent.click(accountButton);

      expect(await screen.findByText('Thông tin cá nhân')).toBeVisible();
      expect(screen.getByText('Quản lý Chia sẻ')).toBeVisible();
      expect(screen.getByText('Đăng xuất')).toBeVisible();
    });
    
    test('renders "Thêm Mã CK" button and icon button', () => {
      expect(screen.getByRole('button', { name: 'Thêm Mã CK' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Thêm Cổ Phiếu' })).toBeInTheDocument();
    });

    test('opens AddStockForm dialog when "Thêm Mã CK" text button is clicked', async () => {
      const addStockButton = screen.getByRole('button', { name: 'Thêm Mã CK' });
      fireEvent.click(addStockButton);
      
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeVisible();
      expect(within(dialog).getByText('Thêm Mã Cổ Phiếu Mới')).toBeInTheDocument();
    });
    
    test('calls logout and navigates to /login when logout is clicked from menu', async () => {
      const accountButton = screen.getByRole('button', { name: 'Tài khoản' });
      fireEvent.click(accountButton); 
      
      const logoutMenuItem = await screen.findByText('Đăng xuất');
      fireEvent.click(logoutMenuItem);
      
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('navigates to /sharing when "Quản lý Chia sẻ" is clicked from menu', async () => {
      const accountButton = screen.getByRole('button', { name: 'Tài khoản' });
      fireEvent.click(accountButton); 

      const sharingMenuItem = await screen.findByText('Quản lý Chia sẻ');
      fireEvent.click(sharingMenuItem);
      expect(mockNavigate).toHaveBeenCalledWith('/sharing');
    });
  });
});