import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import MySharedInstances from '../components/MySharedInstances';
import ShareService from '../services/shareService';
import actualTheme from '../theme'; 

jest.mock('../services/shareService');

const mockTheme = {
  ...actualTheme,
  spacing: actualTheme.spacing || ((val) => `${val * 8}px`),
  palette: {
    ...(actualTheme.palette || {}),
    primary: {
      main: actualTheme.palette?.primary?.main || '#1976d2',
      contrastText: actualTheme.palette?.primary?.contrastText || '#fff',
      ...(actualTheme.palette?.primary || {}),
    },
    secondary: {
      main: actualTheme.palette?.secondary?.main || '#dc004e',
      contrastText: actualTheme.palette?.secondary?.contrastText || '#fff',
      ...(actualTheme.palette?.secondary || {}),
    },
    action: {
      active: actualTheme.palette?.action?.active || 'rgba(0, 0, 0, 0.54)',
      hover: actualTheme.palette?.action?.hover || 'rgba(0, 0, 0, 0.04)',
      selected: actualTheme.palette?.action?.selected || 'rgba(0, 0, 0, 0.08)',
      disabled: actualTheme.palette?.action?.disabled || 'rgba(0, 0, 0, 0.26)',
      disabledBackground: actualTheme.palette?.action?.disabledBackground || 'rgba(0, 0, 0, 0.12)',
      focus: actualTheme.palette?.action?.focus || 'rgba(0, 0, 0, 0.12)',
      ...(actualTheme.palette?.action || {}),
    },
    text: {
      primary: actualTheme.palette?.text?.primary || 'rgba(0, 0, 0, 0.87)',
      secondary: actualTheme.palette?.text?.secondary || 'rgba(0, 0, 0, 0.6)',
      disabled: actualTheme.palette?.text?.disabled || 'rgba(0, 0, 0, 0.38)',
      ...(actualTheme.palette?.text || {}),
    },
    success: {
      main: actualTheme.palette?.success?.main || '#28a745',
      contrastText: actualTheme.palette?.success?.contrastText || '#fff',
      ...(actualTheme.palette?.success || {}),
    },
    error: {
      main: actualTheme.palette?.error?.main || '#dc3545',
      contrastText: actualTheme.palette?.error?.contrastText || '#fff',
      ...(actualTheme.palette?.error || {}),
    },
    divider: actualTheme.palette?.divider || 'rgba(0, 0, 0, 0.12)',
    background: {
      paper: actualTheme.palette?.background?.paper || '#fff',
      default: actualTheme.palette?.background?.default || '#fafafa',
      ...(actualTheme.palette?.background || {}),
    },
    common: {
        black: actualTheme.palette?.common?.black || '#000',
        white: actualTheme.palette?.common?.white || '#fff',
        ...(actualTheme.palette?.common || {}),
    },
    grey: {
        50: actualTheme.palette?.grey?.[50] || '#fafafa',
        100: actualTheme.palette?.grey?.[100] || '#f5f5f5',
        200: actualTheme.palette?.grey?.[200] || '#eeeeee',
        300: actualTheme.palette?.grey?.[300] || '#e0e0e0',
        400: actualTheme.palette?.grey?.[400] || '#bdbdbd',
        500: actualTheme.palette?.grey?.[500] || '#9e9e9e',
        600: actualTheme.palette?.grey?.[600] || '#757575',
        700: actualTheme.palette?.grey?.[700] || '#616161',
        800: actualTheme.palette?.grey?.[800] || '#424242',
        900: actualTheme.palette?.grey?.[900] || '#212121',
        A100: actualTheme.palette?.grey?.A100 || '#f5f5f5',
        A200: actualTheme.palette?.grey?.A200 || '#eeeeee',
        A400: actualTheme.palette?.grey?.A400 || '#bdbdbd',
        A700: actualTheme.palette?.grey?.A700 || '#616161',
        ...(actualTheme.palette?.grey || {}),
    },
  },
  shape: {
    borderRadius: actualTheme.shape?.borderRadius ?? 4,
    ...(actualTheme.shape || {}),
  },
  typography: {
    ...(actualTheme.typography || { fontFamily: 'Roboto, Arial, sans-serif' }),
     button: {
      textTransform: actualTheme.typography?.button?.textTransform || 'uppercase',
      ...(actualTheme.typography?.button || {}),
    },
  },
  components: { 
    ...(actualTheme.components || {}),
     MuiButton: {
        styleOverrides: { root: actualTheme.components?.MuiButton?.styleOverrides?.root || {},},
        defaultProps: actualTheme.components?.MuiButton?.defaultProps || {},
     },
     MuiIconButton: {
        styleOverrides: { root: actualTheme.components?.MuiIconButton?.styleOverrides?.root || {},},
        defaultProps: actualTheme.components?.MuiIconButton?.defaultProps || {},
     },
     MuiAlert: {
        styleOverrides: { root: actualTheme.components?.MuiAlert?.styleOverrides?.root || {},},
        defaultProps: actualTheme.components?.MuiAlert?.defaultProps || {},
     }
  },
  zIndex: { 
    appBar: actualTheme.zIndex?.appBar || 1100,
    drawer: actualTheme.zIndex?.drawer || 1200,
    modal: actualTheme.zIndex?.modal || 1300,
    snackbar: actualTheme.zIndex?.snackbar || 1400,
    tooltip: actualTheme.zIndex?.tooltip || 1500,
    ...(actualTheme.zIndex || {})
  },
  transitions: {
    ...(actualTheme.transitions || {}), 
    create: actualTheme.transitions?.create || jest.fn((props, options) => {
      const property = Array.isArray(props) ? props.join(',') : props;
      const duration = options?.duration || '0ms';
      const easing = options?.easing || 'ease';
      const delay = options?.delay || '0ms';
      return `${property} ${duration} ${easing} ${delay}`;
    }),
    duration: {
      shortest: actualTheme.transitions?.duration?.shortest || 150,
      shorter: actualTheme.transitions?.duration?.shorter || 200,
      short: actualTheme.transitions?.duration?.short || 250,
      standard: actualTheme.transitions?.duration?.standard || 300,
      complex: actualTheme.transitions?.duration?.complex || 375,
      enteringScreen: actualTheme.transitions?.duration?.enteringScreen || 225,
      leavingScreen: actualTheme.transitions?.duration?.leavingScreen || 195,
      ...(actualTheme.transitions?.duration || {}),
    },
    easing: {
      easeInOut: actualTheme.transitions?.easing?.easeInOut || 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: actualTheme.transitions?.easing?.easeOut || 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: actualTheme.transitions?.easing?.easeIn || 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: actualTheme.transitions?.easing?.sharp || 'cubic-bezier(0.4, 0, 0.6, 1)',
      ...(actualTheme.transitions?.easing || {}),
    },
  },
  direction: actualTheme.direction || 'ltr',
  mixins: { 
    toolbar: actualTheme.mixins?.toolbar || { 
      minHeight: 56,
      '@media (min-width:0px) and (orientation: landscape)': { minHeight: 48 },
      '@media (min-width:600px)': { minHeight: 64 },
     },
    ...(actualTheme.mixins || {})
  },
};

const mockMySharesData = [
  { _id: 'shareInst1', recipientEmail: 'recipient1@example.com', createdAt: new Date().toISOString() },
  { _id: 'shareInst2', recipientEmail: 'recipient2@example.com', createdAt: new Date().toISOString() },
];

describe('MySharedInstances Component', () => {
  beforeEach(() => {
    ShareService.getMySharedInstances.mockReset();
    ShareService.unshareList.mockReset();
    ShareService.getMySharedInstances.mockResolvedValue([]); 
  });

  const renderComponent = () => render(
    <ThemeProvider theme={mockTheme}>
      <MySharedInstances />
    </ThemeProvider>
  );

  test('displays loading indicator initially', async () => {
    ShareService.getMySharedInstances.mockImplementation(() => new Promise(() => {})); 
    renderComponent();
    expect(await screen.findByRole('progressbar', {}, {timeout: 1000})).toBeInTheDocument();
  });

  test('displays "Bạn chưa chia sẻ..." message when no instances found', async () => {
    ShareService.getMySharedInstances.mockResolvedValueOnce([]);
    renderComponent();
    expect(await screen.findByText('Bạn chưa chia sẻ danh sách cổ phiếu của mình với ai.')).toBeInTheDocument();
  });

  test('displays error message if fetching instances fails', async () => {
    const errorMessageFromMock = 'API Error';
    ShareService.getMySharedInstances.mockRejectedValueOnce(new Error(errorMessageFromMock));
    renderComponent();
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(errorMessageFromMock)).toBeInTheDocument();
  });

  test('renders list of shared instances', async () => {
    ShareService.getMySharedInstances.mockResolvedValueOnce(mockMySharesData);
    renderComponent();
    expect(await screen.findByText('recipient1@example.com')).toBeInTheDocument();
    const unshareButtons = screen.getAllByRole('button', { name: 'unshare' }); 
    expect(unshareButtons).toHaveLength(2);
  });

  test('opens confirmation dialog when unshare button is clicked', async () => {
    ShareService.getMySharedInstances.mockResolvedValueOnce(mockMySharesData);
    renderComponent();
    const unshareButtons = await screen.findAllByRole('button', { name: 'unshare' });
    fireEvent.click(unshareButtons[0]);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeVisible();
    expect(within(dialog).getByText('Xác nhận Thu hồi Chia sẻ')).toBeInTheDocument();

    const dialogContentText = within(dialog).getByText((content, element) => 
        element.tagName.toLowerCase() === 'p' && element.id === 'alert-dialog-description'
    );
    
    expect(dialogContentText).toHaveTextContent(
      /Bạn có chắc chắn muốn thu hồi lượt chia sẻ danh sách cổ phiếu với recipient1@example.com không\? Hành động này không thể hoàn tác\./
    );
    expect(dialogContentText).toContainHTML('<strong>recipient1@example.com</strong>');
    expect(dialogContentText.textContent).toContain('Bạn có chắc chắn muốn thu hồi lượt chia sẻ danh sách cổ phiếu với');
    expect(dialogContentText.textContent).toContain('không? Hành động này không thể hoàn tác.');

  });

  test('calls unshareList and refetches on confirm dialog, then closes dialog', async () => {
    ShareService.getMySharedInstances
      .mockResolvedValueOnce(mockMySharesData) 
      .mockResolvedValueOnce([mockMySharesData[1]]); 

    ShareService.unshareList.mockResolvedValueOnce({}); 

    renderComponent();
    const unshareButtons = await screen.findAllByRole('button', { name: 'unshare' });
    fireEvent.click(unshareButtons[0]); 

    const dialog = await screen.findByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: /Đồng ý Thu hồi/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(ShareService.unshareList).toHaveBeenCalledWith('shareInst1');
    });
    await waitFor(() => {
      expect(ShareService.getMySharedInstances).toHaveBeenCalledTimes(2); 
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('recipient1@example.com')).not.toBeInTheDocument(); 
    expect(screen.getByText('recipient2@example.com')).toBeInTheDocument(); 
  });

  test('closes dialog on cancel', async () => {
    ShareService.getMySharedInstances.mockResolvedValueOnce(mockMySharesData);
    renderComponent();
    const unshareButtons = await screen.findAllByRole('button', { name: 'unshare' });
    fireEvent.click(unshareButtons[0]);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeVisible();
    const cancelButton = within(dialog).getByRole('button', { name: /Hủy bỏ/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(ShareService.unshareList).not.toHaveBeenCalled();
  });

  test('displays error if unshareList fails', async () => {
    ShareService.getMySharedInstances.mockResolvedValueOnce(mockMySharesData);
    const unshareErrorMessage = 'Lỗi khi thu hồi';
    ShareService.unshareList.mockRejectedValueOnce({message: unshareErrorMessage});
    renderComponent();
    const unshareButtons = await screen.findAllByRole('button', { name: 'unshare' });
    fireEvent.click(unshareButtons[0]);

    const dialog = await screen.findByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: /Đồng ý Thu hồi/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(ShareService.unshareList).toHaveBeenCalledWith('shareInst1');
    });
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(unshareErrorMessage)).toBeInTheDocument();
    
    await waitFor(() => { 
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});