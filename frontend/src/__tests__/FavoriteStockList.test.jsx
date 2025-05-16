import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import FavoriteStockList from '../components/FavoriteStockList';
import actualTheme from '../theme';

const mockTheme = {
  ...actualTheme,
  spacing: (val) => val * 8,
  palette: {
    ...(actualTheme.palette || {}),
    primary: { main: actualTheme.palette?.primary?.main || '#1976d2', contrastText: '#fff' },
    secondary: { main: actualTheme.palette?.secondary?.main || '#dc004e', contrastText: '#fff' },
    action: { active: actualTheme.palette?.action?.active || 'rgba(0, 0, 0, 0.54)', hover: actualTheme.palette?.action?.hover 
    || 'rgba(0, 0, 0, 0.04)', selected: actualTheme.palette?.action?.selected || 'rgba(0, 0, 0, 0.08)', disabled: actualTheme.palette?.action?.disabled 
    || 'rgba(0, 0, 0, 0.26)', disabledBackground: actualTheme.palette?.action?.disabledBackground || 'rgba(0, 0, 0, 0.12)', focus: actualTheme.palette?.action?.focus || 'rgba(0, 0, 0, 0.12)' },
    text: { primary: actualTheme.palette?.text?.primary || 'rgba(0, 0, 0, 0.87)', secondary: actualTheme.palette?.text?.secondary || 'rgba(0, 0, 0, 0.6)', 
    disabled: actualTheme.palette?.text?.disabled || 'rgba(0, 0, 0, 0.38)' },
    success: { main: actualTheme.palette?.success?.main || '#28a745', contrastText: '#fff' },
    error: { main: actualTheme.palette?.error?.main || '#dc3545', contrastText: '#fff' },
    divider: actualTheme.palette?.divider || 'rgba(0, 0, 0, 0.12)',
    background: { paper: actualTheme.palette?.background?.paper || '#fff', default: actualTheme.palette?.background?.default || '#fafafa' },
  },
  shape: { borderRadius: actualTheme.shape?.borderRadius ?? 4, ...(actualTheme.shape || {}) },
  typography: { ...(actualTheme.typography || { fontFamily: 'Roboto, Arial, sans-serif' }) },
  components: { ...(actualTheme.components || {}) },
  zIndex: { ...(actualTheme.zIndex || {}) },
  transitions: { ...(actualTheme.transitions || {}) }
};

describe('FavoriteStockList Component', () => {
  const mockOnRemoveStock = jest.fn();
  const mockOnRefreshPrices = jest.fn();

  const sampleStocks = [
    { symbol: 'AAPL', currentPrice: 150.50, openPrice: 149.00, previousClosePrice: 148.75, error: null },
    { symbol: 'GOOGL', currentPrice: 2700.00, openPrice: 2710.00, previousClosePrice: 2690.00, error: null },
    { symbol: 'MSFT', currentPrice: null, openPrice: null, previousClosePrice: null, error: 'Lỗi API' },
    { symbol: 'TSLA', currentPrice: 650.20, openPrice: 0, previousClosePrice: 640.00, error: null },
  ];

  beforeEach(() => {
    mockOnRemoveStock.mockClear();
    mockOnRefreshPrices.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const renderComponent = (props) => render(
    <ThemeProvider theme={mockTheme}>
      <FavoriteStockList
        stocks={sampleStocks}
        isLoadingExternally={false}
        onRemoveStock={mockOnRemoveStock}
        onRefreshPrices={mockOnRefreshPrices}
        {...props}
      />
    </ThemeProvider>
  );

  test('renders list title and refresh button', () => {
    renderComponent();
    expect(screen.getByText('Cổ phiếu của bạn')).toBeInTheDocument();
    const refreshButton = screen.getByRole('button', { name: /Làm mới giá ngay/i });
    expect(refreshButton).toBeInTheDocument();
    expect(within(refreshButton).getByTestId('RefreshIcon')).toBeInTheDocument();
  });

  test('renders correct number of stock items', () => {
    renderComponent();
    expect(screen.getAllByRole('listitem')).toHaveLength(sampleStocks.length);
  });

  test('displays stock symbol and price details correctly', () => {
    renderComponent();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByTestId('current-price-AAPL')).toHaveTextContent('$150.50');
    expect(screen.getByText(/Mở cửa: \$149.00/i)).toBeInTheDocument();
    expect(screen.getByText(/Đóng hôm qua: \$148.75/i)).toBeInTheDocument();

    expect(screen.getByText('GOOGL')).toBeInTheDocument();
    expect(screen.getByTestId('current-price-GOOGL')).toHaveTextContent('$2700.00');
  });

  test('displays N/A for missing prices and error chip', () => {
    renderComponent();
    const msftItem = screen.getByText('MSFT').closest('li');
    expect(msftItem).toBeInTheDocument();
    expect(within(msftItem).getByText('Lỗi API')).toBeInTheDocument();
    expect(within(msftItem).getByTestId('price-display-MSFT')).toHaveTextContent('N/A');
    expect(within(msftItem).queryByTestId('current-price-MSFT')).toBeNull();
    expect(within(msftItem).getByText(/Mở cửa: N\/A/i)).toBeInTheDocument();
    expect(within(msftItem).getByText(/Đóng hôm qua: N\/A/i)).toBeInTheDocument();
  });

  test('calls onRemoveStock when delete button is clicked', () => {
    renderComponent();
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
    } else {
      throw new Error('Không tìm thấy nút delete nào.');
    }
    expect(mockOnRemoveStock).toHaveBeenCalledWith('AAPL');
    expect(mockOnRemoveStock).toHaveBeenCalledTimes(1);
  });

  test('calls onRefreshPrices when refresh button is clicked', () => {
    renderComponent();
    const refreshButton = screen.getByRole('button', { name: /Làm mới giá ngay/i });
    fireEvent.click(refreshButton);
    expect(mockOnRefreshPrices).toHaveBeenCalledTimes(1);
  });

  test('calls onRefreshPrices periodically via interval', () => {
    renderComponent();
    expect(mockOnRefreshPrices).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(mockOnRefreshPrices).toHaveBeenCalledTimes(1);
    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(mockOnRefreshPrices).toHaveBeenCalledTimes(2);
  });

  test('renders skeleton items when isLoadingExternally is true and stocks exist', () => {
    renderComponent({ isLoadingExternally: true, stocks: sampleStocks });
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
    const skeletonListItems = screen.getAllByRole('listitem');
    expect(skeletonListItems.length).toBe(sampleStocks.length);

    skeletonListItems.forEach(item => {
      const skeletonElementsInItem = within(item).queryAllByText('', {
        selector: 'span.MuiSkeleton-root', 
      });
      
      expect(skeletonElementsInItem.length).toBe(5);
    });
  });

  test('does not render if not loading and no stocks', () => {
    const { container } = renderComponent({ stocks: [] });
    expect(container.querySelector('.MuiList-root')).toBeNull();
  });

  test('displays correct price change indicator (trending up)', () => {
    renderComponent();
    const aaplItem = screen.getByText('AAPL').closest('li');
    expect(within(aaplItem).getByTestId('TrendingUpIcon')).toBeInTheDocument();
  });

  test('displays correct price change indicator (trending down)', () => {
    renderComponent();
    const googlItem = screen.getByText('GOOGL').closest('li');
    expect(within(googlItem).getByTestId('TrendingDownIcon')).toBeInTheDocument();
  });

  test('displays correct price change indicator (trending flat using previousClosePrice)', () => {
    renderComponent();
    const tslaItem = screen.getByText('TSLA').closest('li');
    expect(within(tslaItem).getByTestId('TrendingUpIcon')).toBeInTheDocument();
  });
});