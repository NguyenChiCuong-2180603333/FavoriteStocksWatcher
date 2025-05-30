import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import DashboardPage from '../pages/DashboardPage';
import StockService from '../services/stockService';
import ShareService from '../services/shareService';
import actualTheme from '../theme';
import { toast, ToastContainer } from 'react-toastify';


jest.mock('../contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../contexts/AuthContext');
  return {
    __esModule: true,
    ...originalModule, 
    useAuth: jest.fn(), 
  };
});


jest.mock('../services/stockService', () => ({
  getFavoriteStocksWithDetails: jest.fn(),
  removeFavoriteStock: jest.fn(),
  addFavoriteStock: jest.fn(),
}));

jest.mock('../services/shareService', () => ({
  shareMyFavorites: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  ...jest.requireActual('react-toastify'),
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockTheme = {
    ...actualTheme,
    spacing: actualTheme.spacing || ((val) => `${val * 8}px`),
    palette: {
        ...(actualTheme.palette || {}),
        primary: { main: actualTheme.palette?.primary?.main || '#1976d2', contrastText: actualTheme.palette?.primary?.contrastText || '#fff', ...(actualTheme.palette?.primary || {}), },
        secondary: { main: actualTheme.palette?.secondary?.main || '#dc004e', contrastText: actualTheme.palette?.secondary?.contrastText || '#fff', ...(actualTheme.palette?.secondary || {}), },
        action: { active: actualTheme.palette?.action?.active || 'rgba(0, 0, 0, 0.54)', hover: actualTheme.palette?.action?.hover || 'rgba(0, 0, 0, 0.04)', selected: actualTheme.palette?.action?.selected || 'rgba(0, 0, 0, 0.08)', disabled: actualTheme.palette?.action?.disabled || 'rgba(0, 0, 0, 0.26)', disabledBackground: actualTheme.palette?.action?.disabledBackground || 'rgba(0, 0, 0, 0.12)', focus: actualTheme.palette?.action?.focus || 'rgba(0, 0, 0, 0.12)', ...(actualTheme.palette?.action || {}), },
        text: { primary: actualTheme.palette?.text?.primary || 'rgba(0, 0, 0, 0.87)', secondary: actualTheme.palette?.text?.secondary || 'rgba(0, 0, 0, 0.6)', disabled: actualTheme.palette?.text?.disabled || 'rgba(0, 0, 0, 0.38)', ...(actualTheme.palette?.text || {}), },
        success: { main: actualTheme.palette?.success?.main || '#28a745', contrastText: actualTheme.palette?.success?.contrastText || '#fff', ...(actualTheme.palette?.success || {}), },
        error: { main: actualTheme.palette?.error?.main || '#dc3545', contrastText: actualTheme.palette?.error?.contrastText || '#fff', ...(actualTheme.palette?.error || {}), },
        divider: actualTheme.palette?.divider || 'rgba(0, 0, 0, 0.12)',
        background: { paper: actualTheme.palette?.background?.paper || '#fff', default: actualTheme.palette?.background?.default || '#fafafa', ...(actualTheme.palette?.background || {}), },
        common: { black: actualTheme.palette?.common?.black || '#000', white: actualTheme.palette?.common?.white || '#fff', ...(actualTheme.palette?.common || {}), },
        grey: {
            50: actualTheme.palette?.grey?.[50] || '#fafafa', 100: actualTheme.palette?.grey?.[100] || '#f5f5f5', 200: actualTheme.palette?.grey?.[200] || '#eeeeee', 300: actualTheme.palette?.grey?.[300] || '#e0e0e0', 400: actualTheme.palette?.grey?.[400] || '#bdbdbd', 500: actualTheme.palette?.grey?.[500] || '#9e9e9e', 600: actualTheme.palette?.grey?.[600] || '#757575', 700: actualTheme.palette?.grey?.[700] || '#616161', 800: actualTheme.palette?.grey?.[800] || '#424242', 900: actualTheme.palette?.grey?.[900] || '#212121', A100: actualTheme.palette?.grey?.A100 || '#f5f5f5', A200: actualTheme.palette?.grey?.A200 || '#eeeeee', A400: actualTheme.palette?.grey?.A400 || '#bdbdbd', A700: actualTheme.palette?.grey?.A700 || '#616161', ...(actualTheme.palette?.grey || {}),
        },
    },
    shape: { borderRadius: actualTheme.shape?.borderRadius ?? 4, ...(actualTheme.shape || {}), },
    typography: { ...(actualTheme.typography || { fontFamily: 'Roboto, Arial, sans-serif' }), button: { textTransform: actualTheme.typography?.button?.textTransform || 'uppercase', ...(actualTheme.typography?.button || {}), }, },
    components: { ...(actualTheme.components || {}), MuiButton: { styleOverrides: { root: actualTheme.components?.MuiButton?.styleOverrides?.root || {}, }, defaultProps: actualTheme.components?.MuiButton?.defaultProps || {}, }, MuiIconButton: { styleOverrides: { root: actualTheme.components?.MuiIconButton?.styleOverrides?.root || {}, }, defaultProps: actualTheme.components?.MuiIconButton?.defaultProps || {}, }, MuiAlert: { styleOverrides: { root: actualTheme.components?.MuiAlert?.styleOverrides?.root || {}, }, defaultProps: actualTheme.components?.MuiAlert?.defaultProps || {}, } },
    zIndex: { appBar: actualTheme.zIndex?.appBar || 1100, drawer: actualTheme.zIndex?.drawer || 1200, modal: actualTheme.zIndex?.modal || 1300, ...(actualTheme.zIndex || {}) },
    transitions: { easing: { easeInOut: actualTheme.transitions?.easing?.easeInOut || 'cubic-bezier(0.4, 0, 0.2, 1)', ...(actualTheme.transitions?.easing || {}) }, duration: { shortest: actualTheme.transitions?.duration?.shortest || 150, standard: actualTheme.transitions?.duration?.standard || 300, ...(actualTheme.transitions?.duration || {}) }, ...(actualTheme.transitions || {}) },
    direction: actualTheme.direction || 'ltr',
    mixins: { toolbar: actualTheme.mixins?.toolbar || { minHeight: 56, '@media (min-width:0px) and (orientation: landscape)': { minHeight: 48 }, '@media (min-width:600px)': { minHeight: 64 }, }, ...(actualTheme.mixins || {}) },
};

const baseMockUser = {
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  favoriteStocks: ['AAPL', 'GOOGL']
};

describe('DashboardPage Component', () => {
  let mockAuthValue;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthValue = {
      user: { ...baseMockUser },
      token: 'fake-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
    };
    useAuth.mockImplementation(() => mockAuthValue);

    StockService.getFavoriteStocksWithDetails.mockResolvedValue([]);
    StockService.removeFavoriteStock.mockResolvedValue({});
    StockService.addFavoriteStock.mockResolvedValue({});
    ShareService.shareMyFavorites.mockResolvedValue({ message: 'Shared successfully' });
  });

  const renderDashboardPageWithRealAuthProvider = () => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <AuthProvider>
          <DashboardPage />
          <ToastContainer />
        </AuthProvider>
      </ThemeProvider>
    );
  };

  test('renders Dashboard title when user is authenticated', async () => {
    renderDashboardPageWithRealAuthProvider();
    expect(await screen.findByText('Bảng điều khiển')).toBeInTheDocument();
  });

  test('renders AddStockForm when user is authenticated', async () => {
    renderDashboardPageWithRealAuthProvider();
    expect(await screen.findByRole('heading', { name: /Thêm Cổ Phiếu Yêu Thích/i })).toBeInTheDocument();
  });


  test('displays login prompt when user is not authenticated after auth check', () => {
    mockAuthValue.user = null;
    mockAuthValue.token = null;
    mockAuthValue.isLoading = false;
    renderDashboardPageWithRealAuthProvider();
    expect(screen.getByText('Vui lòng đăng nhập để xem Bảng điều khiển.')).toBeInTheDocument();
  });

  describe('Favorite Stocks List', () => {
    test('displays loading state initially for stock details if user has stocks', async () => {
      mockAuthValue.user = { ...baseMockUser, favoriteStocks: ['AAPL'] };
      const loadingStockData = [{ symbol: 'AAPL', currentPrice: 0, openPrice: 0, previousClosePrice: 0 }];
      StockService.getFavoriteStocksWithDetails.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(loadingStockData), 50))
      );
      renderDashboardPageWithRealAuthProvider();
      expect(await screen.findByText('Đang tải dữ liệu...', {}, { timeout: 200 })).toBeInTheDocument();
    });

    test('displays "Danh sách trống!" message when no favorite stocks after fetch', async () => {
      mockAuthValue.user = { ...baseMockUser, favoriteStocks: ['ANY_STOCK_TO_TRIGGER_FETCH'] };
      StockService.getFavoriteStocksWithDetails.mockResolvedValueOnce([]);
      renderDashboardPageWithRealAuthProvider();
      expect(await screen.findByText('Danh sách trống!')).toBeInTheDocument();
      expect(screen.getByText('Bạn chưa theo dõi mã cổ phiếu nào. Hãy thêm từ form.')).toBeInTheDocument();
    });

    test('displays favorite stocks when data is fetched', async () => {
      const mockStocksData = [
        { symbol: 'AAPL', currentPrice: 150.00, openPrice: 149.00, previousClosePrice: 148.00 },
        { symbol: 'GOOGL', currentPrice: 2500.00, openPrice: 2490.00, previousClosePrice: 2480.00 },
      ];
      mockAuthValue.user = { ...baseMockUser, favoriteStocks: ['AAPL', 'GOOGL'] };
      StockService.getFavoriteStocksWithDetails.mockResolvedValueOnce(mockStocksData);
      renderDashboardPageWithRealAuthProvider();
      expect(await screen.findByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText(/Mở cửa: \$149.00/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Chia sẻ Danh sách/i })).toBeInTheDocument();
    });

    test('handles error when fetching favorite stocks', async () => {
      mockAuthValue.user = { ...baseMockUser, favoriteStocks: ['FAIL_SYMBOL'] };
      StockService.getFavoriteStocksWithDetails.mockRejectedValueOnce(new Error('Failed to fetch'));
      renderDashboardPageWithRealAuthProvider();
      expect(await screen.findByText(/Failed to fetch|Không thể tải danh sách cổ phiếu yêu thích./i)).toBeInTheDocument();
    });

    test('calls removeFavoriteStock and refetches when a stock is removed', async () => {
      const mockStocksInitial = [{ symbol: 'AAPL', currentPrice: 150.00, openPrice: 149.00, previousClosePrice: 148.00 }];
      mockAuthValue.user = { ...baseMockUser, favoriteStocks: ['AAPL'] };

      StockService.getFavoriteStocksWithDetails
        .mockResolvedValueOnce(mockStocksInitial)
        .mockResolvedValueOnce([]);
      StockService.removeFavoriteStock.mockResolvedValueOnce({});

      renderDashboardPageWithRealAuthProvider();
      expect(await screen.findByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();

      const listItem = await screen.findByText('AAPL');
      const deleteButton = within(listItem.closest('li')).getByRole('button', { name: 'delete' });
      fireEvent.click(deleteButton);

      await waitFor(() => expect(StockService.removeFavoriteStock).toHaveBeenCalledWith('AAPL'));
      await waitFor(() => expect(StockService.getFavoriteStocksWithDetails).toHaveBeenCalledTimes(2));
      expect(await screen.findByText('Danh sách trống!')).toBeInTheDocument();
    });
  });

  describe('Share Dialog', () => {
    const mockStocksForShare = [{ symbol: 'AAPL', currentPrice: 150.00, openPrice: 149.00, previousClosePrice: 148.00 }];

    beforeEach(() => {
      mockAuthValue.user = { ...baseMockUser, favoriteStocks: ['AAPL'] };
      StockService.getFavoriteStocksWithDetails.mockReset();
      StockService.getFavoriteStocksWithDetails.mockResolvedValueOnce(mockStocksForShare);
    });

    test('opens share dialog when share button is clicked', async () => {
      renderDashboardPageWithRealAuthProvider();
      expect(await screen.findByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();

      const shareButton = screen.getByRole('button', { name: /Chia sẻ Danh sách/i });
      fireEvent.click(shareButton);

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeVisible();
      expect(within(dialog).getByText('Chia sẻ Danh sách Yêu thích')).toBeInTheDocument();
      expect(within(dialog).getByLabelText('Email người nhận')).toBeInTheDocument();
    });

    test('calls ShareService.shareMyFavorites on submit and shows success in dialog', async () => {
      ShareService.shareMyFavorites.mockResolvedValueOnce({ message: 'Chia sẻ thành công!' });
      renderDashboardPageWithRealAuthProvider();
      expect(await screen.findByText('AAPL')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Chia sẻ Danh sách/i }));
      const dialog = await screen.findByRole('dialog');
      const emailInput = within(dialog).getByLabelText('Email người nhận');
      const submitButton = within(dialog).getByRole('button', { name: 'Chia sẻ' });
      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);
      await waitFor(() => expect(ShareService.shareMyFavorites).toHaveBeenCalledWith('test@example.com'));
      expect(await within(dialog).findByText('Chia sẻ thành công!')).toBeInTheDocument();
    });

    test('shows error in dialog if recipient email is empty', async () => {
      renderDashboardPageWithRealAuthProvider();
      expect(await screen.findByText('AAPL')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Chia sẻ Danh sách/i }));
      const dialog = await screen.findByRole('dialog');
      const submitButton = within(dialog).getByRole('button', { name: 'Chia sẻ' });
      fireEvent.click(submitButton);
      expect(await within(dialog).findByText('Vui lòng nhập email người nhận.')).toBeInTheDocument();
      expect(ShareService.shareMyFavorites).not.toHaveBeenCalled();
    });

    test('shows error in dialog on ShareService failure', async () => {
      const errorMessage = 'Lỗi khi chia sẻ từ service';
      ShareService.shareMyFavorites.mockRejectedValueOnce(new Error(errorMessage));
      renderDashboardPageWithRealAuthProvider();
      expect(await screen.findByText('AAPL')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Chia sẻ Danh sách/i }));
      const dialog = await screen.findByRole('dialog');
      const emailInput = within(dialog).getByLabelText('Email người nhận');
      const submitButton = within(dialog).getByRole('button', { name: 'Chia sẻ' });
      await userEvent.type(emailInput, 'fail@example.com');
      fireEvent.click(submitButton);
      await waitFor(() => expect(ShareService.shareMyFavorites).toHaveBeenCalledWith('fail@example.com'));
      expect(await within(dialog).findByText(errorMessage)).toBeInTheDocument();
    });
  });
});