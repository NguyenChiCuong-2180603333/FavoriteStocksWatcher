import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import SharedListsPage from '../pages/SharedListsPage';
import theme from '../theme';

jest.mock('../components/ListsSharedWithMe', () => () => <div data-testid="lists-shared-with-me">ListsSharedWithMe Component</div>);
jest.mock('../components/MySharedInstances', () => () => <div data-testid="my-shared-instances">MySharedInstances Component</div>);

const mockTheme = {
  ...theme,
  spacing: (val) => val * 8,
   palette: {
    ...theme.palette,
    divider: '#dee2e6',
    primary: { main: '#007bff', ...theme.palette.primary }, 
    text: { primary: '#000', ...theme.palette.text }
  },
  typography: { 
    ...theme.typography,
    button: { textTransform: 'none', fontWeight: 600, ...theme.typography.button}
  }
};

describe('SharedListsPage Component', () => {
  const renderSharedListsPage = () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <SharedListsPage />
      </ThemeProvider>
    );
  };

  test('renders page title', () => {
    renderSharedListsPage();
    expect(screen.getByRole('heading', { name: /Quản lý Chia sẻ/i })).toBeInTheDocument();
  });

  test('renders tabs correctly and defaults to "Được chia sẻ với tôi"', () => {
    renderSharedListsPage();
    expect(screen.getByTestId('lists-shared-with-me')).toBeVisible();
    expect(screen.queryByTestId('my-shared-instances')).toBeNull(); 
});


  test('switches to "Tôi đã chia sẻ" tab and shows correct content', () => {
    renderSharedListsPage();
    const mySharesTab = screen.getByRole('tab', { name: /Tôi đã chia sẻ/i });
    fireEvent.click(mySharesTab);
    expect(screen.getByTestId('my-shared-instances')).toBeVisible();
    expect(screen.queryByTestId('lists-shared-with-me')).toBeNull(); 
});

  test('switches back to "Được chia sẻ với tôi" tab', () => {
    renderSharedListsPage();
    const mySharesTab = screen.getByRole('tab', { name: /Tôi đã chia sẻ/i });
    const sharedWithMeTab = screen.getByRole('tab', { name: /Được chia sẻ với tôi/i });

    fireEvent.click(mySharesTab);
    expect(screen.getByTestId('my-shared-instances')).toBeVisible();

    fireEvent.click(sharedWithMeTab);
    expect(screen.getByTestId('lists-shared-with-me')).toBeVisible();
    expect(screen.queryByTestId('my-shared-instances')).toBeNull(); 
  });
});