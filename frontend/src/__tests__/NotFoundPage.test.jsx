import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import NotFoundPage from '../pages/NotFoundPage';

describe('NotFoundPage Component', () => {
  test('renders 404 message and a link to homepage', () => {
    render(
      <Router>
        <NotFoundPage />
      </Router>
    );
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/Oops! Trang bạn tìm kiếm không tồn tại./i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Về Trang Chủ/i })).toHaveAttribute('href', '/');
  });
});