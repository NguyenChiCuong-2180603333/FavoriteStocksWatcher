import { createTheme } from '@mui/material/styles';
import { red, blueGrey, grey, teal, orange } from '@mui/material/colors';

const themeObject = { 
  palette: {
    mode: 'light',
    primary: {
      main: teal[600], 
      light: teal[400],
      dark: teal[800],
      contrastText: '#ffffff',
    },
    secondary: {
      main: orange[700], 
      light: orange[500],
      dark: orange[900],
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    error: {
      main: red[600], 
    },
    warning: {
      main: orange[500],
    },
    info: {
      main: blueGrey[500],
    },
    success: {
      main: teal[500], 
    },
    background: {
      default: grey[100], 
      paper: '#ffffff',    
    },
    text: {
      primary: blueGrey[800], 
      secondary: blueGrey[600], 
      disabled: grey[500],
    },
    divider: grey[300], 
  },
  typography: {
    fontFamily: [
      'Inter', 
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontSize: '2.6rem', fontWeight: 700, letterSpacing: '-0.015em', marginBottom: '0.5em' },
    h2: { fontSize: '2.1rem', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '0.4em' },
    h3: { fontSize: '1.7rem', fontWeight: 600, letterSpacing: '-0.005em', marginBottom: '0.4em' },
    h4: { fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.35em' },
    h5: { fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.35em' },
    h6: { fontSize: '1rem', fontWeight: 600, marginBottom: '0.3em' },     
    subtitle1: { fontSize: '1rem', fontWeight: 500, color: blueGrey[700] },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, color: blueGrey[400] },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.65, color: blueGrey[700] },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5, color: blueGrey[500] },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.025em' },
    caption: { fontSize: '0.75rem', fontWeight: 400, color: grey[600] },
    overline: { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em' }
  },
  shape: {
    borderRadius: 10, 
  },
  spacing: 8, 
};

const theme = createTheme({
  ...themeObject, // Spread các định nghĩa gốc
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      `,
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0, 
      },
      styleOverrides: {
        root: ({theme: currentTheme}) => ({ 
           backgroundColor: currentTheme.palette.background.paper, 
           color: currentTheme.palette.text.primary, 
           borderBottom: `1px solid ${currentTheme.palette.divider}`, 
        }),
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: ({ ownerState, theme: currentTheme }) => ({
          borderRadius: currentTheme.shape.borderRadius - 2, 
          padding: currentTheme.spacing(0.75, 2), 
        }),
        containedPrimary: ({theme: currentTheme}) => ({
          color: currentTheme.palette.primary.contrastText,
        }),
        outlinedPrimary: ({theme: currentTheme}) => ({
            borderColor: currentTheme.palette.primary.light, 
        }),
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0, 
      },
      styleOverrides: {
        root: ({theme: currentTheme}) => ({
          border: `1px solid ${currentTheme.palette.divider}`, 
        }),
      },
    },
    MuiCard: { 
        defaultProps: {
            elevation: 0,
        },
        styleOverrides: {
            root: ({theme: currentTheme}) => ({
                border: `1px solid ${currentTheme.palette.divider}`,
            }),
        }
    },
    MuiTextField: {
        defaultProps: {
            variant: 'outlined',
            size: 'small', 
        }
    },
    MuiDialogTitle: {
        styleOverrides: {
            root: ({theme: currentTheme}) => ({
                ...currentTheme.typography.h6, 
                paddingBottom: currentTheme.spacing(1.5),
                fontWeight: 600, 
            })
        }
    },
    MuiDialogActions: {
        styleOverrides: {
            root: ({theme: currentTheme}) => ({
                padding: currentTheme.spacing(2, 3), 
            })
        }
    },
    MuiTabs: {
        styleOverrides: {
            indicator: ({theme: currentTheme}) => ({
                height: '3px',
            })
        }
    },
    MuiTab: {
        styleOverrides: {
            root: ({theme: currentTheme}) => ({
                fontWeight: 600,
            })
        }
    },
    MuiAccordion: {
        defaultProps: {
            disableGutters: true, 
            elevation: 0,
        },
        styleOverrides: {
            root: ({theme: currentTheme}) => ({
                border: `1px solid ${currentTheme.palette.divider}`,
                '&:not(:last-child)': {
                    borderBottom: 0,
                },
                '&:before': { 
                    display: 'none',
                },
            }),
        }
    },
    MuiAccordionSummary: {
        styleOverrides: {
            root: ({theme: currentTheme}) => ({
                 // style
            }),
        }
    },
    MuiAccordionDetails: {
        styleOverrides: {
            root: ({theme: currentTheme}) => ({
                padding: currentTheme.spacing(2),
            })
        }
    },
    MuiListItem: {
        styleOverrides: {
            root: ({theme: currentTheme}) => ({
            }),
            secondaryAction: ({theme: currentTheme}) => ({ 
                right: currentTheme.spacing(1.5) 
            })
        }
    },
    MuiChip: {
        styleOverrides: {
            root: ({theme: currentTheme}) => ({
                borderRadius: currentTheme.shape.borderRadius / 2, 
                fontWeight: 500,
            })
        }
    }
  }
});

export default theme;
