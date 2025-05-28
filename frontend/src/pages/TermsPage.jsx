import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const TermsPage = () => {
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Điều khoản Dịch vụ
        </Typography>
        <Typography variant="body1" paragraph>
          Chào mừng bạn đến với ứng dụng Theo dõi Cổ phiếu Yêu thích!
        </Typography>
        <Typography variant="h6" component="h2" sx={{ mt: 3 }}>
          1. Chấp nhận Điều khoản
        </Typography>
        <Typography variant="body1" paragraph>
          Bằng việc đăng ký hoặc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện này.
          Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ.
        </Typography>
        <Typography variant="h6" component="h2" sx={{ mt: 3 }}>
          2. Mô tả Dịch vụ
        </Typography>
        <Typography variant="body1" paragraph>
          Ứng dụng của chúng tôi cho phép bạn theo dõi danh sách các mã cổ phiếu yêu thích, chia sẻ danh sách này (nếu có chức năng đó),
          và nhận các thông tin liên quan. Dịch vụ được cung cấp "nguyên trạng" và chúng tôi không đảm bảo tính chính xác
          hoàn toàn của dữ liệu thị trường.
        </Typography>
      </Paper>
    </Container>
  );
};

export default TermsPage;