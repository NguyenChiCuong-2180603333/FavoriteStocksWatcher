import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle, TextField,
  Paper,
  Container
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import { useAuth } from '../contexts/AuthContext'; 
import AddStockForm from '../components/AddStockForm'; 
import FavoriteStockList from '../components/FavoriteStockList'; 
import StockService from '../services/stockService'; 
import ShareService from '../services/shareService'; 
import { useTheme } from '@mui/material/styles';

const DashboardPage = () => {
  const theme = useTheme();
  const { user, loading: authLoading, token } = useAuth();
  const [favoriteStocksDetails, setFavoriteStocksDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); 
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');

    const fetchFavorites = useCallback(async (isRefreshFromList = false) => {
    if (!user || !user.favoriteStocks || user.favoriteStocks.length === 0) {
      setFavoriteStocksDetails([]);
      if (!isRefreshFromList && !authLoading) setIsLoading(false); 
      return;
    }

    if (!isRefreshFromList) {
        setIsLoading(true); 
    }
    setError(''); 

    try {
      const data = await StockService.getFavoriteStocksWithDetails(user.favoriteStocks, token);
      setFavoriteStocksDetails(data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách cổ phiếu yêu thích:', err);
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách cổ phiếu yêu thích.');
      setFavoriteStocksDetails([]); 
    } finally {
      if (!isRefreshFromList) {
        setIsLoading(false);
      }
    }
  }, [user, token, authLoading]);

 useEffect(() => {
    if (!authLoading && user && token) {
      fetchFavorites();
    } else if (!authLoading && !user) {
      setFavoriteStocksDetails([]); 
      setIsLoading(false); 
    }
  }, [authLoading, user, token, fetchFavorites]);

  const handleStockAdded = () => fetchFavorites();

  const handleStockRemoved = async (symbolToRemove) => {
    try {
      await StockService.removeFavoriteStock(symbolToRemove);
      fetchFavorites();
    } catch (err) {
      console.error(`Lỗi khi xóa mã ${symbolToRemove}:`, err);
      setError(err.message || `Không thể xóa mã ${symbolToRemove}.`);
    }
  };

  const handleRefreshPrices = useCallback(() => fetchFavorites(true), [fetchFavorites]);

  const handleOpenShareDialog = () => {
    if (!user || !user.favoriteStocks || user.favoriteStocks.length === 0) {
        setError('Bạn không có cổ phiếu yêu thích nào để chia sẻ.');
        return;
    }
    setOpenShareDialog(true);
    setRecipientEmail('');
    setShareError('');
    setShareSuccess('');
  };

  const handleCloseShareDialog = () => {
    setOpenShareDialog(false);
  };

  const handleShareSubmit = async () => {
    if (!recipientEmail.trim()) {
      setShareError('Vui lòng nhập email người nhận.');
      return;
    }
    setShareLoading(true);
    setShareError('');
    setShareSuccess('');
    try {
      const response = await ShareService.shareMyFavorites(recipientEmail);
      setShareSuccess(response.message || 'Đã chia sẻ danh sách thành công!');
      setTimeout(() => {
        handleCloseShareDialog();
      }, 2500);
    } catch (err) {
      console.error('Lỗi khi chia sẻ:', err);
      setShareError(err.message || 'Không thể chia sẻ danh sách. Vui lòng thử lại.');
    } finally {
      setShareLoading(false);
    }
  };
  if (authLoading) {
    return (
      <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 3 }, textAlign: 'center' }}>
        <Typography variant="h6">Vui lòng đăng nhập để xem Bảng điều khiển.</Typography>
      </Container>
    );
  }
    const currentFavoriteStocks = user.favoriteStocks || [];


  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: theme.spacing(2),
          mb: theme.spacing(4)
        }}
      >
        <Typography variant="h4" component="h1" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          Bảng điều khiển
        </Typography>
        {favoriteStocksDetails && favoriteStocksDetails.length > 0 && !error && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ShareIcon />}
            onClick={handleOpenShareDialog}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Chia sẻ Danh sách
          </Button>
        )}
      </Box>

      <Dialog open={openShareDialog} onClose={handleCloseShareDialog} fullWidth maxWidth="xs">
        <DialogTitle>Chia sẻ Danh sách Yêu thích</DialogTitle>
        <DialogContent>
          {shareError && <Alert severity="error" sx={{ mb: theme.spacing(2) }}>{shareError}</Alert>}
          {shareSuccess && <Alert severity="success" sx={{ mb: theme.spacing(2) }}>{shareSuccess}</Alert>}
          <TextField
            autoFocus
            margin="normal"
            id="recipientEmail"
            label="Email người nhận"
            type="email"
            fullWidth
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            disabled={shareLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShareDialog} disabled={shareLoading} color="inherit">Hủy</Button>
          <Button onClick={handleShareSubmit} variant="contained" disabled={shareLoading}>
            {shareLoading ? <CircularProgress size={24} color="inherit"/> : 'Chia sẻ'}
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={{ xs: 2, sm: 3, md: 3.5 }}>
        <Grid item xs={12} md={4} lg={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <AddStockForm onStockAdded={handleStockAdded} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8} lg={8}>
          {error && !isLoading && favoriteStocksDetails.length === 0 && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
              <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
            </Paper>
          )}

          {error && !isLoading && favoriteStocksDetails.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          {isLoading && favoriteStocksDetails.length === 0 && !error && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }} color="text.secondary">Đang tải dữ liệu...</Typography>
            </Paper>
          )}

          {!isLoading && favoriteStocksDetails.length === 0 && !error && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Danh sách trống!
              </Typography>
              <Typography color="text.secondary">
                Bạn chưa theo dõi mã cổ phiếu nào. Hãy thêm từ form.
              </Typography>
            </Paper>
          )}

          {favoriteStocksDetails.length > 0 &&
            <FavoriteStockList
              stocks={favoriteStocksDetails}
              isLoadingExternally={isLoading && favoriteStocksDetails.length > 0}
              onRemoveStock={handleStockRemoved}
              onRefreshPrices={handleRefreshPrices}
            />
          }
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;