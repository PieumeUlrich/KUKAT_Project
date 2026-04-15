import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { KUKAT } from '../../styles/theme';

export default function AppLayout({ children, title, subtitle }) {
  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',        // ← full viewport height, not min-height
      overflow: 'hidden',     // ← prevent the outer box from scrolling
    }}>

      {/* Sidebar — fixed height, only scrolls internally */}
      <Box sx={{
        height: '100vh',
        overflowY: 'auto',    // ← sidebar can scroll independently
        overflowX: 'hidden',
        flexShrink: 0,
      }}>
        <Sidebar />
      </Box>

      {/* Main content — fixed height, scrolls independently */}
      <Box sx={{
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}>

        {/* TopBar — always visible, never scrolls away */}
        <Box sx={{ flexShrink: 0 }}>
          <TopBar title={title} subtitle={subtitle} />
        </Box>

        {/* Page content — only this area scrolls */}
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