import React, { useState, useCallback } from 'react'; // Thêm useState, useCallback
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Import Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SharedListsPage from './pages/SharedListsPage';
import NotFoundPage from './pages/NotFoundPage';
import Header from './components/Header';
import TermsPage from './pages/TermsPage';
import { CircularProgress, Box, Container } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
        <CircularProgress />
      </Box>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
        <CircularProgress />
      </Box>
    );
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const [refreshDashboardKey, setRefreshDashboardKey] = useState(0);

  const handleStockAddedFromHeader = useCallback(() => {
    setRefreshDashboardKey(prevKey => prevKey + 1); // Thay đổi key để trigger useEffect trong DashboardPage
  }, []);

  return (
    <Router>
      <Header onStockAddedFromHeader={handleStockAddedFromHeader} /> 
      <Container maxWidth="lg" sx={{ 
        pt: { xs: 2, sm: 3, md: 4 }, 
        pb: 4,
      }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage key={refreshDashboardKey} /> 
              </ProtectedRoute>
            }
          />
          <Route
            path="/sharing"
            element={
              <ProtectedRoute>
                <SharedListsPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </Container>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
}

export default App;
