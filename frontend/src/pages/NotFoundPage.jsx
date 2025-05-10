import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh" 
      textAlign="center"
    >
      <Typography variant="h1" component="h2" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Oops! Trang bạn tìm kiếm không tồn tại.
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Có vẻ như bạn đã đi lạc. Đừng lo, chúng tôi sẽ giúp bạn quay lại.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained" color="primary">
        Về Trang Chủ
      </Button>
    </Box>
  );
};

export default NotFoundPage;