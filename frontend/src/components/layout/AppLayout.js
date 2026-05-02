import { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout({ children, title, subtitle }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
    }}>

      {/* ── Mobile overlay backdrop ───────────────────── */}
      {isMobile && sidebarOpen && (
        <Box
          onClick={() => setSidebarOpen(false)}
          sx={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1200,
          }}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────── */}
      <Box sx={{
        position: { xs: 'fixed', md: 'relative' },
        left: { xs: sidebarOpen ? 0 : '-280px', md: 0 },
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        flexShrink: 0,
        zIndex: 1300,
        transition: 'left 0.3s ease',
      }}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </Box>

      {/* ── Main content ──────────────────────────────── */}
      <Box sx={{
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}>
        <Box sx={{ flexShrink: 0 }}>
          <TopBar
            title={title}
            subtitle={subtitle}
            onMenuClick={() => setSidebarOpen(prev => !prev)}
            isMobile={isMobile}
          />
        </Box>
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: { xs: 2, sm: 3 },
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}