import React, { useState, useEffect, useCallback } from 'react';
import ShareService from '../services/shareService';
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Divider
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'; 
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const MySharedInstances = () => {
  const [myShares, setMyShares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [unshareLoading, setUnshareLoading] = useState(null); 
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [shareToUnshare, setShareToUnshare] = useState(null); 

  const fetchMyShares = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ShareService.getMySharedInstances();
      setMyShares(data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách tôi đã chia sẻ:', err);
      setError(err.message || 'Không thể tải danh sách bạn đã chia sẻ.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyShares();
  }, [fetchMyShares]);

  const handleOpenConfirmDialog = (share) => {
    setShareToUnshare(share);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setShareToUnshare(null);
    setConfirmDialogOpen(false);
  };

  const handleUnshare = async () => {
    if (!shareToUnshare) return;

    setUnshareLoading(shareToUnshare._id); 
    setError('');
    try {
      await ShareService.unshareList(shareToUnshare._id);
      fetchMyShares();
    } catch (err) {
      console.error(`Lỗi khi thu hồi chia sẻ ID ${shareToUnshare._id}:`, err);
      setError(err.message || `Không thể thu hồi chia sẻ với ${shareToUnshare.recipientEmail}.`);
    } finally {
      setUnshareLoading(null);
      handleCloseConfirmDialog();
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" sx={{ my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }

  if (myShares.length === 0) {
    return <Typography>Bạn chưa chia sẻ danh sách cổ phiếu của mình với ai.</Typography>;
  }

  return (
    <Paper elevation={0} sx={{p:0}}> {/* Bỏ elevation của Paper con nếu cha đã có */}
      <List>
        {myShares.map((share) => (
          <React.Fragment key={share._id}>
            <ListItem
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                py: 1.5
              }}
            >
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', mb: {xs: 1, sm: 0} }}>
                <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                <ListItemText
                  primary={share.recipientEmail}
                  secondary={
                    <>
                      <AccessTimeIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      Đã chia sẻ lúc: {new Date(share.createdAt).toLocaleString()}
                    </>
                  }
                />
              </Box>
              <ListItemSecondaryAction sx={{ position: {xs: 'relative', sm: 'static'}, transform: {xs: 'translateY(0)', sm: 'none'}, right: {xs: 0, sm: 'auto'}, top: {xs:0, sm:'auto'}, mt: {xs: 1, sm: 0} }}>
                <Tooltip title="Thu hồi chia sẻ">
                  <IconButton
                    edge="end"
                    aria-label="unshare"
                    onClick={() => handleOpenConfirmDialog(share)}
                    disabled={unshareLoading === share._id}
                  >
                    {unshareLoading === share._id ? <CircularProgress size={24} /> : <DeleteForeverIcon color="error" />}
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>

      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Xác nhận Thu hồi Chia sẻ
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn thu hồi lượt chia sẻ danh sách cổ phiếu với <strong>{shareToUnshare?.recipientEmail}</strong> không?
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Hủy bỏ
          </Button>
          <Button onClick={handleUnshare} color="error" autoFocus>
            Đồng ý Thu hồi
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MySharedInstances;
