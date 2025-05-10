import React, { useState } from 'react';
import StockService from '../services/stockService';
import { TextField, Button, Box, CircularProgress, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { useTheme } from '@mui/material/styles'; 

const AddStockForm = ({ onStockAdded, showTitle = true }) => { 
  const theme = useTheme();
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) {
      toast.error('Vui lòng nhập mã cổ phiếu.');
      return;
    }
    setLoading(true);

    try {
      const normalizedSymbol = symbol.trim().toUpperCase();
      await StockService.addFavoriteStock(normalizedSymbol);
      
      toast.success(`Đã thêm mã ${normalizedSymbol} vào danh sách!`);
      setSymbol(''); 

      if (onStockAdded) {
        onStockAdded(); 
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || `Không thể thêm mã ${symbol.trim().toUpperCase()}.`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{pt: showTitle ? 0 : 1}}> 
      {showTitle && ( 
        <Typography variant="h6" gutterBottom sx={{ mb: theme.spacing(2) }}>
          Thêm Cổ Phiếu Yêu Thích
        </Typography>
      )}
      <TextField
        label="Mã Cổ Phiếu (Symbol)"
        variant="outlined"
        fullWidth
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        disabled={loading}
        sx={{ mb: 2 }}
      />
      <Button type="submit" variant="contained" disabled={loading} fullWidth>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Thêm vào Danh sách'}
      </Button>
    </Box>
  );
};

export default AddStockForm;
