import { createTheme } from '@mui/material/styles';

// ── KUKAT Brand Palette ────────────────────────────────────────
// Primary:  deep teal-navy   (#0B2B40) — authority, trust
// Accent:   vivid amber      (#F59E0B) — energy, travel warmth
// Success:  emerald          (#10B981)
// Danger:   coral-red        (#EF4444)
// Surface:  off-white        (#F8FAFC)
// ──────────────────────────────────────────────────────────────

const KUKAT = {
  navy:        '#0B2B40',
  navyLight:   '#143D5C',
  navyDark:    '#071E2E',
  amber:       '#F59E0B',
  amberLight:  '#FCD34D',
  amberDark:   '#D97706',
  teal:        '#0D9488',
  tealLight:   '#2DD4BF',
  surface:     '#F8FAFC',
  surfaceAlt:  '#EFF6FF',
  border:      '#E2E8F0',
  textPrimary: '#0F172A',
  textMuted:   '#64748B',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main:        KUKAT.navy,
      light:       KUKAT.navyLight,
      dark:        KUKAT.navyDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main:        KUKAT.amber,
      light:       KUKAT.amberLight,
      dark:        KUKAT.amberDark,
      contrastText: KUKAT.navy,
    },
    success: {
      main: '#10B981',
      light: '#D1FAE5',
      dark:  '#059669',
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
      dark:  '#DC2626',
    },
    warning: {
      main: KUKAT.amber,
      light: '#FEF3C7',
      dark:  KUKAT.amberDark,
    },
    info: {
      main: KUKAT.teal,
      light: '#CCFBF1',
      dark:  '#0F766E',
    },
    background: {
      default: KUKAT.surface,
      paper:   '#FFFFFF',
    },
    text: {
      primary:   KUKAT.textPrimary,
      secondary: KUKAT.textMuted,
    },
    divider: KUKAT.border,
  },

  // ── Typography ─────────────────────────────────────────────
  typography: {
    fontFamily: '"DM Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 700, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.5rem' },
    h4: { fontWeight: 600, fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.1rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    subtitle1: { fontWeight: 500, fontSize: '0.95rem', color: KUKAT.textMuted },
    subtitle2: { fontWeight: 500, fontSize: '0.85rem', color: KUKAT.textMuted },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    caption: { fontSize: '0.75rem', color: KUKAT.textMuted },
  },
  // ── Shape ──────────────────────────────────────────────────
  shape: { borderRadius: 10 },

  // ── Shadows ────────────────────────────────────────────────
  shadows: [
    'none',
    '0 1px 3px rgba(11,43,64,0.06), 0 1px 2px rgba(11,43,64,0.04)',
    '0 4px 6px rgba(11,43,64,0.06), 0 2px 4px rgba(11,43,64,0.04)',
    '0 10px 15px rgba(11,43,64,0.07), 0 4px 6px rgba(11,43,64,0.04)',
    '0 20px 25px rgba(11,43,64,0.08), 0 10px 10px rgba(11,43,64,0.03)',
    '0 25px 50px rgba(11,43,64,0.12)',
    ...Array(19).fill('none'),
  ],

  // ── Component Overrides ────────────────────────────────────
  components: {

    MuiCssBaseline: {
      styleOverrides: `
        *, *::before, *::after { box-sizing: border-box; }
        body {
          font-family: 'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: ${KUKAT.surface};
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${KUKAT.surface}; }
        ::-webkit-scrollbar-thumb { background: ${KUKAT.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${KUKAT.textMuted}; }
      `,
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '9px 22px',
          fontSize: '0.9rem',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${KUKAT.navyLight} 0%, ${KUKAT.navy} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${KUKAT.navy} 0%, ${KUKAT.navyDark} 100%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${KUKAT.amberLight} 0%, ${KUKAT.amber} 100%)`,
          color: KUKAT.navy,
          '&:hover': {
            background: `linear-gradient(135deg, ${KUKAT.amber} 0%, ${KUKAT.amberDark} 100%)`,
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: '#F59E0B',
          },
        },
        // Override specific color variants to avoid purple
        outlinedPrimary: {
          '&:hover': {
            backgroundColor: `${KUKAT.amber}`,
            borderColor: KUKAT.amber,
            borderWidth: '1.5px',
          },
        },
        outlinedSuccess: {
          '&:hover': {
            backgroundColor: '#DCFCE7',
          },
        },
        outlinedError: {
          '&:hover': {
            backgroundColor: '#FEE2E2',
          },
        },
        outlinedInfo: {
          '&:hover': {
            backgroundColor: '#DBEAFE',
          },
        },
      },
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'medium' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '& fieldset': { borderColor: KUKAT.border, borderWidth: '1.5px' },
            '&:hover fieldset': { borderColor: KUKAT.navyLight },
            '&.Mui-focused fieldset': { borderColor: KUKAT.navy, borderWidth: '2px' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: KUKAT.navy },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: `1px solid ${KUKAT.border}`,
          boxShadow: '0 2px 8px rgba(11,43,64,0.06)',
          transition: 'box-shadow 0.2s ease',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500, fontSize: '0.78rem' },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: KUKAT.surface,
            color: KUKAT.textMuted,
            fontWeight: 600,
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: `2px solid ${KUKAT.border}`,
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: `${KUKAT.surfaceAlt}` },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${KUKAT.border}`,
          padding: '12px 16px',
          fontSize: '0.875rem',
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 500 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: KUKAT.navy,
          fontSize: '0.78rem',
          borderRadius: 6,
          padding: '6px 10px',
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: KUKAT.border },
        bar: { borderRadius: 4 },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: KUKAT.border },
      },
    },

    MuiGrid: {
      styleOverrides: {
        item: {
          '& > *': {
            width: '100%',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 14 },
      },
    },
  },
});

export default theme;
export { KUKAT };
