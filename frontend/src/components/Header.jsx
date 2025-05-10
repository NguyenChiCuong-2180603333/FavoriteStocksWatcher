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
  useTheme
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
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [openAddStockDialog, setOpenAddStockDialog] = useState(false);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
    navigate('/login');
  };

  const handleProfile = () => {
    handleCloseUserMenu();
    alert('Chức năng Thông tin cá nhân sẽ được phát triển sau!');
  };

  const handleNavigateToSharing = () => {
    handleCloseUserMenu();
    navigate('/sharing');
  };

  const handleOpenAddStockDialog = () => {
    setOpenAddStockDialog(true);
  };

  const handleCloseAddStockDialog = () => {
    setOpenAddStockDialog(false);
  };

  const handleStockAddedInDialog = () => {
    handleCloseAddStockDialog();
    if (onStockAddedFromHeader) {
      onStockAddedFromHeader();
    }
  };

  const appName = "Stocks Watcher";

  return (
    <>
      <AppBar
        position="sticky"
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <MonetizationOnIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, color: 'primary.main' }} />
            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.1rem',
                color: 'text.primary',
                textDecoration: 'none',
              }}
            >
              {appName}
            </Typography>

            {user && (
              <Button
                color="primary"
                variant="text"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleOpenAddStockDialog}
                sx={{ ml: { xs: 0, md: 2 }, display: { xs: 'none', sm: 'flex' } }}
              >
                Thêm Mã CK
              </Button>
            )}
             {user && (
                <Tooltip title="Thêm Cổ Phiếu">
                    <IconButton
                        color="primary"
                        onClick={handleOpenAddStockDialog}
                        sx={{ display: { xs: 'flex', sm: 'none' }, ml: 1 }}
                    >
                        <AddCircleOutlineIcon />
                    </IconButton>
                </Tooltip>
            )}

           
            <MonetizationOnIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1, color: 'primary.main' }} />
            <Typography
              variant="h5"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.1rem',
                color: 'text.primary',
                textDecoration: 'none',
              }}
            >
              {appName}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {user ? (
                <>
                  <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'medium', color: 'text.primary', mr: 0.5 }}>
                      {user.name || user.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mr: 0.5 }}>
                      ({user.username})
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      - {user.email}
                    </Typography>
                  </Box>

                  <Tooltip title="Tài khoản">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      <Avatar
                          sx={{ bgcolor: 'secondary.main', width: 36, height: 36, fontSize: '1rem' }}
                          alt={user.name || user.username}
                      >
                          {(user.name || user.username) ? (user.name || user.username).charAt(0).toUpperCase() : <AccountCircle />}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    MenuListProps={{ 'aria-labelledby': 'user-menu-button' }}
                    anchorEl={anchorElUser}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                        mt: 1.5,
                        minWidth: 240,
                        '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 },
                        '&:before': { content: '""', display: 'block', position: 'absolute', top: 0, right: 14, width: 10, height: 10, bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0 },
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <Box sx={{pt: 1, pb:0.5, px: 2, display: {xs: 'block', md: 'none'} }}>
                      <Typography variant="subtitle1" sx={{fontWeight: 'bold', lineHeight: 1.2}}>
                          {user.name || user.username}
                      </Typography>
                       <Typography variant="caption" display="block" color="text.secondary" sx={{lineHeight: 1.2}}>{user.email}</Typography>
                       <Typography variant="caption" display="block" color="text.secondary" sx={{lineHeight: 1.2}}>(Username: {user.username})</Typography>
                    </Box>
                    <Divider sx={{my: {xs:1, md:0}, display: {xs: 'block', md: 'none'}}}/>

                    <MenuItem onClick={handleProfile} sx={{py: 1.25}}>
                      <PersonOutlineIcon sx={{ mr: 1.5, color: 'text.secondary' }} fontSize="small"/>
                      Thông tin cá nhân
                    </MenuItem>
                    <MenuItem onClick={handleNavigateToSharing} sx={{py: 1.25}}>
                      <ShareIcon sx={{ mr: 1.5, color: 'text.secondary' }} fontSize="small"/>
                      Quản lý Chia sẻ
                    </MenuItem>
                    <Divider sx={{my: 1}}/>
                    <MenuItem onClick={handleLogout} sx={{py: 1.25, color: 'error.main'}}>
                      <ExitToAppIcon sx={{ mr: 1.5 }} fontSize="small"/>
                      Đăng xuất
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    color="primary"
                    variant="outlined"
                    startIcon={<VpnKeyIcon />}
                    component={RouterLink} to="/login" sx={{ mr: 1.5 }}>
                    Đăng nhập
                  </Button>
                  <Button
                    color="primary"
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    component={RouterLink} to="/register">
                    Đăng ký
                  </Button>
                </>
              )}
            </Box>
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
