import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { KUKAT } from '../../styles/theme';

export default function AppLayout({ children, title, subtitle }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: KUKAT.surface }}>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar title={title} subtitle={subtitle} />
        <Box sx={{
          flex: 1,
          p: { xs: 2, sm: 3 },
          overflowY: 'auto',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
