import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import ListsSharedWithMe from '../components/ListsSharedWithMe';
import ShareService from '../services/shareService';
import StockService from '../services/stockService';
import theme from '../theme';

jest.mock('../services/shareService');
jest.mock('../services/stockService');

const mockTheme = {
    ...theme,
  spacing: (val) => val * 8,
  palette: {
    ...theme.palette,
    divider: '#dee2e6',
    primary: { main: '#007bff', light: '#6c757d', ...theme.palette.primary },
    text: { secondary: '#6c757d', disabled: '#adb5bd', ...theme.palette.text  },
    error: {main: '#dc3545', ...theme.palette.error}
  },
  shape: { borderRadius: 4, ...theme.shape },
   typography: { ...theme.typography }
};

const mockSharer1 = { _id: 'sharer1', name: 'Người Chia Sẻ 1', username: 'sharerone', email: 'sharer1@test.com' };
const mockSharer2 = { _id: 'sharer2', name: 'Người Chia Sẻ 2', username: 'sharertwo', email: 'sharer2@test.com' };

const mockSharedListsData = [
  {
    shareId: 'share1',
    sharerInfo: mockSharer1,
    favoriteStocks: ['AAPL', 'GOOGL'],
    sharedAt: new Date().toISOString(),
  },
  {
    shareId: 'share2',
    sharerInfo: mockSharer2,
    favoriteStocks: ['MSFT'],
    sharedAt: new Date().toISOString(),
  },
  {
    shareId: 'share3',
    sharerInfo: { name: 'Người dùng ẩn', username: 'unknown', email: 'unknown@test.com' },
    favoriteStocks: [], 
    sharedAt: new Date().toISOString(),
  }
];

const mockStockPrices = {
  'AAPL': { symbol: 'AAPL', currentPrice: 150.00 },
  'GOOGL': { symbol: 'GOOGL', currentPrice: 2700.50 },
  'MSFT': { symbol: 'MSFT', currentPrice: 300.25 },
};


describe('ListsSharedWithMe Component', () => {
  beforeEach(() => {
    ShareService.getListsSharedWithMe.mockResolvedValue([]);
    StockService.getPublicStockPrices.mockImplementation(async (symbolsString) => {
        if (!symbolsString) return [];
        const symbols = symbolsString.split(',');
        return symbols.map(s => mockStockPrices[s] || { symbol: s, error: 'Không có dữ liệu' });
    });
  });

  const renderComponent = () => render(
    <ThemeProvider theme={mockTheme}>
      <ListsSharedWithMe />
    </ThemeProvider>
  );

  test('renders loading skeletons initially', async () => {
  ShareService.getListsSharedWithMe.mockImplementation(() => new Promise(() => {})); 
  const { container } = renderComponent(); 
  await waitFor(() => {
     expect(container.querySelectorAll('.MuiSkeleton-text').length).toBeGreaterThanOrEqual(1);
     expect(container.querySelectorAll('.MuiSkeleton-rectangular').length).toBeGreaterThanOrEqual(1);
  });
  const skeletons = container.querySelectorAll('.MuiSkeleton-root');
  expect(skeletons.length).toBe(4); 
});

  test('displays "Không có gì ở đây cả!" message when no lists are shared', async () => {
    ShareService.getListsSharedWithMe.mockResolvedValueOnce([]);
    renderComponent();
    expect(await screen.findByText('Không có gì ở đây cả!')).toBeInTheDocument();
    expect(screen.getByText('Hiện tại không có ai chia sẻ danh sách cổ phiếu với bạn.')).toBeInTheDocument();
  });

  test('displays error message if fetching shared lists fails', async () => {
  ShareService.getListsSharedWithMe.mockRejectedValueOnce(new Error('API Error'));
  renderComponent();
  expect(await screen.findByText('API Error')).toBeInTheDocument(); 
});

  test('renders shared lists and fetches stock prices on expand', async () => {
    ShareService.getListsSharedWithMe.mockResolvedValueOnce(mockSharedListsData);
    renderComponent();

    expect(await screen.findByText(/Chia sẻ bởi: Người Chia Sẻ 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Chia sẻ bởi: Người Chia Sẻ 2/i)).toBeInTheDocument();

    const firstAccordionSummary = screen.getByText(/Chia sẻ bởi: Người Chia Sẻ 1/i);
    fireEvent.click(firstAccordionSummary);

    await waitFor(() => {
      expect(StockService.getPublicStockPrices).toHaveBeenCalledWith('AAPL,GOOGL');
    });
    expect(await screen.findByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Giá: $150.00')).toBeInTheDocument();
    expect(screen.getByText('GOOGL')).toBeInTheDocument();
    expect(screen.getByText('Giá: $2700.50')).toBeInTheDocument();

    const secondAccordionSummary = screen.getByText(/Chia sẻ bởi: Người Chia Sẻ 2/i);
    fireEvent.click(secondAccordionSummary);
    await waitFor(() => {
      expect(StockService.getPublicStockPrices).toHaveBeenCalledWith('MSFT');
    });
    expect(await screen.findByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('Giá: $300.25')).toBeInTheDocument();
  });

  test('displays "Không có cổ phiếu" message for empty favoriteStocks list', async () => {
    ShareService.getListsSharedWithMe.mockResolvedValueOnce([mockSharedListsData[2]]); 
    renderComponent();

    const emptyListAccordion = await screen.findByText(/Chia sẻ bởi: Người dùng ẩn/i);
    fireEvent.click(emptyListAccordion);

    expect(await screen.findByText('Người này chưa có cổ phiếu nào trong danh sách yêu thích.')).toBeInTheDocument();
    expect(StockService.getPublicStockPrices).not.toHaveBeenCalled(); 
  });

   test('handles error when fetching stock prices for a list', async () => {
  ShareService.getListsSharedWithMe.mockResolvedValueOnce([mockSharedListsData[0]]);
  StockService.getPublicStockPrices.mockRejectedValueOnce(new Error('Price API Error'));
  renderComponent();

  const accordionSummary = await screen.findByText(/Chia sẻ bởi: Người Chia Sẻ 1/i);
  fireEvent.click(accordionSummary);

  expect(await screen.findByText('Price API Error')).toBeInTheDocument(); 
});
});