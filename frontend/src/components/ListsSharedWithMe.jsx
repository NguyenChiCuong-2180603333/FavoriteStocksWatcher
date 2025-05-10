import React, { useState, useEffect, useCallback } from 'react';
import ShareService from '../services/shareService';
import StockService from '../services/stockService';
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button, // Mặc dù Button không dùng trực tiếp ở đây, nhưng có thể cần cho các component con hoặc tương lai
  Skeleton,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CommentsDisabledIcon from '@mui/icons-material/CommentsDisabled';
import { useTheme } from '@mui/material/styles';

const SharedListItem = ({ share }) => {
  const [stockDetails, setStockDetails] = useState([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();

  const fetchPricesForSharedList = useCallback(async () => {
    if (!share.favoriteStocks || share.favoriteStocks.length === 0) {
      setStockDetails([]);
      return;
    }
    setIsLoadingPrices(true);
    setPriceError('');
    try {
      const symbolsString = share.favoriteStocks.join(',');
      if (symbolsString) {
        const pricesData = await StockService.getPublicStockPrices(symbolsString);
        setStockDetails(pricesData || []);
      } else {
        setStockDetails([]);
      }
    } catch (err) {
      console.error('Lỗi khi lấy giá cho danh sách được chia sẻ:', err);
      setPriceError(err.message || 'Không thể tải giá cho danh sách này.');
    } finally {
      setIsLoadingPrices(false);
    }
  }, [share.favoriteStocks]);

  const handleAccordionChange = (event, newExpanded) => {
    setIsExpanded(newExpanded);
    if (newExpanded && stockDetails.length === 0 && share.favoriteStocks.length > 0) {
      fetchPricesForSharedList();
    }
  };

  if (!share || !share.sharerInfo) {
    return <ListItem><ListItemText primary="Dữ liệu chia sẻ không hợp lệ." /></ListItem>;
  }

  return (
    <Paper elevation={0} sx={{ mb: theme.spacing(2), border: `1px solid ${theme.palette.divider}` }}>
      <Accordion expanded={isExpanded} onChange={handleAccordionChange} sx={{ '&.MuiAccordion-root': { borderRadius: theme.shape.borderRadius } }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-${share.shareId}-content`}
          id={`panel-${share.shareId}-header`}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <PersonIcon sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography sx={{ fontWeight: 'medium', flexGrow: 1 }}>
              Chia sẻ bởi: {share.sharerInfo.name || share.sharerInfo.username}
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                ({share.sharerInfo.email})
              </Typography>
            </Typography>
            <Chip label={`${share.favoriteStocks.length} mã`} size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            <AccessTimeIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Chia sẻ lúc: {new Date(share.sharedAt).toLocaleString()}
          </Typography>

          {isLoadingPrices && <CircularProgress size={24} sx={{ my: 1, display: 'block', mx: 'auto' }} />}
          {priceError && <Alert severity="error" sx={{ my: 1 }}>{priceError}</Alert>}

          {!isLoadingPrices && !priceError && stockDetails.length > 0 && (
            <List dense disablePadding>
              {stockDetails.map(stock => (
                <ListItem key={stock.symbol} sx={{ pl: 0, '&:not(:last-child)': { borderBottom: `1px dashed ${theme.palette.divider}` } }}>
                  <ListItemText
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                    primary={stock.symbol}
                    secondary={
                      stock.currentPrice !== null
                        ? `Giá: $${stock.currentPrice.toFixed(2)}`
                        : (stock.error || 'N/A')
                    }
                    secondaryTypographyProps={{ color: stock.error ? 'error.main' : 'text.primary' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
          {!isLoadingPrices && !priceError && share.favoriteStocks.length > 0 && stockDetails.length === 0 && (
            <Typography variant="caption" color="text.secondary">Không có dữ liệu giá cho các mã này hoặc danh sách rỗng.</Typography>
          )}
          {!isLoadingPrices && share.favoriteStocks.length === 0 && (
            <Typography variant="caption" color="text.secondary">Người này chưa có cổ phiếu nào trong danh sách yêu thích.</Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};


const ListsSharedWithMe = () => {
  const [sharedLists, setSharedLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();

  const fetchSharedLists = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ShareService.getListsSharedWithMe();
      setSharedLists(data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách được chia sẻ:', err);
      setError(err.message || 'Không thể tải các danh sách được chia sẻ.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSharedLists();
  }, [fetchSharedLists]);


  if (isLoading) {
    return (
      <Box>
        {[1, 2].map(i => (
          <Paper key={i} elevation={0} sx={{ mb: theme.spacing(2), p: theme.spacing(2), border: `1px solid ${theme.palette.divider}` }}>
            <Skeleton variant="text" height={40} sx={{ mb: 1, width: '60%' }} />
            <Skeleton variant="rectangular" height={60} />
          </Paper>
        ))}
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: theme.spacing(2) }}>{error}</Alert>;
  }

  if (sharedLists.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: theme.spacing(4), textAlign: 'center', borderStyle: 'dashed', borderColor: theme.palette.divider, mt: theme.spacing(2) }}>
        <Stack spacing={2} alignItems="center">
          <CommentsDisabledIcon sx={{ fontSize: 60, color: theme.palette.text.disabled }} />
          <Typography variant="h6" color="text.secondary">
            Không có gì ở đây cả!
          </Typography>
          <Typography color="text.secondary">
            Hiện tại không có ai chia sẻ danh sách cổ phiếu với bạn.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box>
      {sharedLists.map((share) => (
        <SharedListItem key={share.shareId} share={share} />
      ))}
    </Box>
  );
};

export default ListsSharedWithMe;
