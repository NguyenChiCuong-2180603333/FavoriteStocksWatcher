import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer, toast } from 'react-toastify'; 
import AddStockForm from '../components/AddStockForm';
import StockService from '../services/stockService';


jest.mock('../services/stockService', () => ({
  addFavoriteStock: jest.fn(),
}));


jest.mock('react-toastify', () => ({
  ...jest.requireActual('react-toastify'),
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));


describe('AddStockForm Component', () => {
  const mockOnStockAdded = jest.fn();

  beforeEach(() => {
    StockService.addFavoriteStock.mockReset();
    mockOnStockAdded.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  test('renders form elements', () => {
    render(<AddStockForm onStockAdded={mockOnStockAdded} />);
    expect(screen.getByLabelText(/Mã Cổ Phiếu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm vào Danh sách/i })).toBeInTheDocument();
  });

 test('allows typing in the symbol input', async () => {
    render(<AddStockForm onStockAdded={mockOnStockAdded} />);
    const input = screen.getByLabelText(/Mã Cổ Phiếu/i);
    await userEvent.type(input, 'AAPL');
    await waitFor(() => {
      expect(input).toHaveValue('AAPL');
    });
  });

  test('calls StockService.addFavoriteStock and onStockAdded on successful submission', async () => {
    StockService.addFavoriteStock.mockResolvedValueOnce({ message: 'Success' });
    render(
      <>
        <AddStockForm onStockAdded={mockOnStockAdded} />
        <ToastContainer />
      </>
    );

    const input = screen.getByLabelText(/Mã Cổ Phiếu/i);
    const button = screen.getByRole('button', { name: /Thêm vào Danh sách/i });

    await userEvent.clear(input);
    await userEvent.type(input, 'MSFT'); 
    expect(input).toHaveValue('MSFT');

    fireEvent.click(button);

    await waitFor(() => {
      expect(StockService.addFavoriteStock).toHaveBeenCalledWith('MSFT');
    });
    expect(mockOnStockAdded).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Đã thêm mã MSFT vào danh sách!');
    expect(input).toHaveValue(''); 
  });

  test('shows error toast if symbol is empty', async () => {
     render(
      <>
        <AddStockForm onStockAdded={mockOnStockAdded} />
        <ToastContainer />
      </>
    );
    const button = screen.getByRole('button', { name: /Thêm vào Danh sách/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Vui lòng nhập mã cổ phiếu.');
    });
    expect(StockService.addFavoriteStock).not.toHaveBeenCalled();
    expect(mockOnStockAdded).not.toHaveBeenCalled();
  });

  test('shows error toast on StockService failure', async () => {
    const errorMessage = 'Không thể thêm mã';
    StockService.addFavoriteStock.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });
     render(
      <>
        <AddStockForm onStockAdded={mockOnStockAdded} />
        <ToastContainer />
      </>
    );

    const input = screen.getByLabelText(/Mã Cổ Phiếu/i);
    const button = screen.getByRole('button', { name: /Thêm vào Danh sách/i });

    await userEvent.type(input, 'FAIL');
    fireEvent.click(button);

    await waitFor(() => {
      expect(StockService.addFavoriteStock).toHaveBeenCalledWith('FAIL');
    });
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
    expect(mockOnStockAdded).not.toHaveBeenCalled();
  });
});