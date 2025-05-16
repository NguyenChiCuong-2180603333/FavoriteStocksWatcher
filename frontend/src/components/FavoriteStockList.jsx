import React, { useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Box,
  Chip,
  CircularProgress,
  Tooltip,
  Skeleton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { useTheme } from '@mui/material/styles';

const getPriceChangeIndicator = (currentPrice, openPrice, previousClosePrice) => {
  let referencePrice = openPrice !== null && openPrice !== 0 ? openPrice : previousClosePrice;
  if (currentPrice === null || referencePrice === null || referencePrice === 0) {
    return { color: 'text.secondary', icon: <TrendingFlatIcon data-testid="TrendingFlatIcon" fontSize="small" />, changePercent: null };
  }
  const change = currentPrice - referencePrice;
  const changePercent = (change / referencePrice) * 100;

  if (change > 0) {
    return { color: 'success.main', icon: <TrendingUpIcon data-testid="TrendingUpIcon" fontSize="small" sx={{ color: 'success.main' }} />, changePercent };
  } else if (change < 0) {
    return { color: 'error.main', icon: <TrendingDownIcon data-testid="TrendingDownIcon" fontSize="small" sx={{ color: 'error.main' }} />, changePercent };
  } else {
    return { color: 'text.secondary', icon: <TrendingFlatIcon data-testid="TrendingFlatIcon" fontSize="small" />, changePercent };
  }
};

const FavoriteStockList = ({ stocks, isLoadingExternally, onRemoveStock, onRefreshPrices }) => {
  const theme = useTheme();

  useEffect(() => {
    if (typeof onRefreshPrices !== 'function') return;
    const intervalId = setInterval(() => {
      onRefreshPrices();
    }, 60000); // 1 phút
    return () => clearInterval(intervalId);
  }, [onRefreshPrices]);

  const renderSkeletonItem = (index) => ( 
    <ListItem
      key={`skeleton-${index}`} 
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        py: 1.5
      }}
    >
      <Box sx={{ flexGrow: 1, minWidth: {xs: '100%', sm: '150px'}, mb: {xs: 1, sm: 0} }}>
        <Skeleton variant="text" width={80} height={28} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: {xs: '100%', sm: '180px'}, mb: {xs: 1, sm: 0}, justifyContent: { xs: 'flex-start', sm: 'flex-end'} }}>
        <Skeleton variant="text" width={100} height={24} />
      </Box>
      <Box sx={{minWidth: {xs: '100%', sm: '150px'}, textAlign: {xs: 'left', sm: 'right'}, mb: {xs: 1, sm: 0}, ml: {sm: 2} }}>
        <Skeleton variant="text" width={120} height={18} />
        <Skeleton variant="text" width={120} height={18} />
      </Box>
      <ListItemSecondaryAction sx={{ position: {xs: 'relative', sm: 'static'}, transform: {xs: 'translateY(0)', sm: 'none'}, right: {xs: 0, sm: 'auto'}, top: {xs:0, sm:'auto'}, mt: {xs: 1, sm: 0}, pl: { sm: 2 } }}>
        <Skeleton variant="circular" width={30} height={30} />
      </ListItemSecondaryAction>
    </ListItem>
  );

  if (!isLoadingExternally && (!stocks || stocks.length === 0)) {
    return null; 
  }

  return (
    <Paper elevation={0} sx={{p: theme.spacing(2), mt: 2, border: `1px solid ${theme.palette.divider}`}}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={theme.spacing(1.5)}>
        <Typography variant="h6" component="div">
          Cổ phiếu của bạn
        </Typography>
        {typeof onRefreshPrices === 'function' && (
          <Tooltip title="Làm mới giá ngay">
            <span>
              <IconButton
                onClick={onRefreshPrices}
                size="small"
                disabled={isLoadingExternally && stocks && stocks.length > 0} 
                aria-label="Làm mới giá ngay" 
              >
                {(isLoadingExternally && stocks && stocks.length > 0) ? <CircularProgress size={20} color="inherit"/> : <RefreshIcon data-testid="RefreshIcon" />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
      <List sx={{padding: 0}}>
        {isLoadingExternally && stocks && stocks.length > 0 ? (
          stocks.map((stock, index) => renderSkeletonItem(index)) 
        ) : (
          stocks.map((stock) => {
            if (!stock || !stock.symbol) {
              console.warn("Dữ liệu cổ phiếu không hợp lệ, bỏ qua render:", stock);
              return null;
            }
            const { color, icon, changePercent } = getPriceChangeIndicator(stock.currentPrice, stock.openPrice, stock.previousClosePrice);

            return (
              <ListItem
                key={stock.symbol}
                divider
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  py: 1.5,
                  '&:hover': { backgroundColor: theme.palette.action.hover }
                }}
              >
                <Box sx={{ flexGrow: 1, minWidth: {xs: '100%', sm: '150px'}, mb: {xs: 1, sm: 0}, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                    {stock.symbol}
                  </Typography>
                  {stock.error && (
                    <Chip label={stock.error} color="warning" size="small" sx={{ ml: 1 }} />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: {xs: '100%', sm: '180px'}, mb: {xs: 1, sm: 0}, justifyContent: { xs: 'flex-start', sm: 'flex-end'} }}>
                  {stock.currentPrice !== null && !stock.error ? (
                    <>
                      <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'medium', mr: 0.5, color: color  }} data-testid={`current-price-${stock.symbol}`}>
                        ${stock.currentPrice.toFixed(2)}
                      </Typography>
                      {icon}
                      {changePercent !== null && (
                         <Typography variant="body2" sx={{ ml: 0.5, color:color }}>
                            ({changePercent.toFixed(2)}%)
                         </Typography>
                      )}
                    </>
                  ) : (
                    <Typography
                      variant="subtitle1"
                      component="span"
                      sx={{ color: 'text.secondary' }}
                      data-testid={`price-display-${stock.symbol}`} 
                    >
                      N/A
                    </Typography>
                  )}
                </Box>

                <Box sx={{minWidth: {xs: '100%', sm: '150px'}, textAlign: {xs: 'left', sm: 'right'}, mb: {xs: 1, sm: 0}, ml: {sm: 2} }}>
                   <Typography variant="caption" display="block" color="textSecondary">
                      Mở cửa: {stock.openPrice !== null ? `$${stock.openPrice.toFixed(2)}` : 'N/A'}
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Đóng hôm qua: {stock.previousClosePrice !== null ? `$${stock.previousClosePrice.toFixed(2)}` : 'N/A'}
                    </Typography>
                </Box>

                <ListItemSecondaryAction sx={{ position: {xs: 'relative', sm: 'static'}, transform: {xs: 'translateY(0)', sm: 'none'}, right: {xs: 0, sm: 'auto'}, top: {xs:0, sm:'auto'}, mt: {xs: 1, sm: 0}, pl: { sm: 2 } }}>
                  <Tooltip title="Xóa khỏi danh sách">
                    <IconButton edge="end" aria-label="delete" onClick={() => onRemoveStock(stock.symbol)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })
        )}
      </List>
    </Paper>
  );
};

export default FavoriteStockList;