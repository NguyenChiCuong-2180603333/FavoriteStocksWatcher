import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Container,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ShareIcon from '@mui/icons-material/Share';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddStockForm from './AddStockForm';

const Header = ({ onStockAddedFromHeader }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [openAddStockDialog, setOpenAddStockDialog] = useState(false);

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = () => { logout(); handleCloseUserMenu(); navigate('/login'); };
  const handleProfile = () => { alert('Chức năng Thông tin cá nhân sẽ được phát triển sau!'); handleCloseUserMenu(); };
  const handleNavigateToSharing = () => { navigate('/sharing'); handleCloseUserMenu(); };

  const handleOpenAddStockDialog = () => setOpenAddStockDialog(true);
  const handleCloseAddStockDialog = () => setOpenAddStockDialog(false);
  const handleStockAddedInDialog = () => {
    handleCloseAddStockDialog();
    if (onStockAddedFromHeader) {
      onStockAddedFromHeader();
    }
  };

  const appName = "Stocks Watcher";

  return (
    <>
      <AppBar position="sticky">
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 56, sm: 64 },
              px: { xs: 1, sm: 2 },
              display: 'flex',
              alignItems: 'center', 
            }}
          >
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                mr: 2 
              }}
            >
              <MonetizationOnIcon sx={{ mr: 0.8, color: 'primary.main', fontSize: { xs: '1.7rem', sm: '1.75rem' } }} />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: {xs: '.05rem', sm: '.1rem'}, 
                  fontSize: { xs: '1rem', sm: '1.25rem' }, 
                }}
              >
                {appName}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {user ? (
              <Stack direction="row" spacing={{xs: 0.5, sm: 1.5}} alignItems="center">
                 <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', textAlign:'right' }}>
                    <Stack direction="column" alignItems="flex-end">
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium', color: 'text.primary', lineHeight: 1.2 }}>
                        {user.name || user.username}
                        </Typography>
                      <Tooltip title={user.email || ''} placement="bottom-end">
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              lineHeight: 1.2,
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '200px', 
                            }}
                          >
                            {user.email}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2, fontStyle:'italic', display: 'block' }}>
                        (Username: {user.username})
                        </Typography>
                    </Stack>
                </Box>

                <Tooltip title="Thêm Cổ Phiếu">
                  <IconButton color="inherit" onClick={handleOpenAddStockDialog} sx={{ p: {xs: 0.75, sm: 1} }}>
                    <AddCircleOutlineIcon sx={{ fontSize: {xs: '1.6rem', sm: '1.75rem'} }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Tài khoản">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: { xs: 34, sm: 38 }, height: { xs: 34, sm: 38 } }}>
                      {(user.name || user.username) ? (user.name || user.username).charAt(0).toUpperCase() : <AccountCircle />}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorElUser}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                      mt: 1.5, minWidth: 240,
                      '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 },
                      '&:before': { content: '""', display: 'block', position: 'absolute',top: 0, right: 14, width: 10, height: 10, bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0 },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    {/* Thông tin user trong menu cho màn hình nhỏ hơn md */}
                    <Box sx={{pt: 1, pb:0.5, px: 2, display: {xs: 'block', md: 'none'} }}>
                      <Typography variant="subtitle1" sx={{fontWeight: 'bold', lineHeight: 1.3}}>
                        {user.name || user.username}
                      </Typography>
                        <Tooltip title={user.email || ''} placement="bottom-start">
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                          sx={{
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '180px', 
                          }}
                        >
                          {user.email}
                        </Typography>
                      </Tooltip>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{lineHeight: 1.3, fontStyle:'italic'}}>(Username: {user.username})</Typography>
                    </Box>
                    <Divider sx={{my: {xs:1, md:0}, display: {xs: 'block', md: 'none'}}}/>

                    <MenuItem onClick={handleProfile} sx={{py: 1.25}}>
                      <ListItemIcon><PersonOutlineIcon fontSize="small" sx={{color: 'text.secondary'}}/></ListItemIcon>
                      <ListItemText>Thông tin cá nhân</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleNavigateToSharing} sx={{py: 1.25}}>
                      <ListItemIcon><ShareIcon fontSize="small" sx={{color: 'text.secondary'}}/></ListItemIcon>
                      <ListItemText>Quản lý Chia sẻ</ListItemText>
                    </MenuItem>
                    <Divider sx={{my: 1}}/>
                    <MenuItem onClick={handleLogout} sx={{py: 1.25, color: 'error.main'}}>
                       <ListItemIcon><ExitToAppIcon fontSize="small" sx={{color: 'error.main'}}/></ListItemIcon>
                      <ListItemText>Đăng xuất</ListItemText>
                    </MenuItem>
                </Menu>
              </Stack>
            ) : (
              <Stack direction="row" spacing={{xs: 0.5, sm: 1}} alignItems="center">
                <Button
                  color="inherit"
                  variant="text" 
                  component={RouterLink}
                  to="/login"
                  sx={{
                    p: { xs: '6px 8px', sm: '6px 12px' },
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    lineHeight: {xs: 1.2, sm: 1.5}, 
                  }}
                  startIcon={<VpnKeyIcon />} 
                >
                  Đăng Nhập 
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  component={RouterLink}
                  to="/register"
                  sx={{
                    p: { xs: '6px 8px', sm: '6px 12px' },
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    lineHeight: {xs: 1.2, sm: 1.5},
                  }}
                  startIcon={<PersonAddIcon />} 
                >
                  Đăng Ký 
                </Button>
              </Stack>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Dialog open={openAddStockDialog} onClose={handleCloseAddStockDialog} fullWidth maxWidth="xs">
        <DialogTitle>Thêm Mã Cổ Phiếu Mới</DialogTitle>
        <DialogContent>
          <AddStockForm onStockAdded={handleStockAddedInDialog} showTitle={false} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;