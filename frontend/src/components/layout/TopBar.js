import React from 'react';
import {
  Box, Typography, IconButton, Avatar, Badge,
  Tooltip, Divider,
} from '@mui/material';
import {
  Notifications as NotifIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

export default function TopBar({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      px: 3, py: 2,
      background: '#fff',
      borderBottom: `1px solid ${KUKAT.border}`,
      minHeight: 64,
      position: 'sticky', top: 0, zIndex: 50,
    }}>

      {/* Page title */}
      <Box>
        <Typography variant="h5" sx={{ color: KUKAT.navy, lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="Search">
          <IconButton size="small" sx={{ color: KUKAT.textMuted }}>
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton size="small" sx={{ color: KUKAT.textMuted }}>
            <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
              <NotifIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 28, alignSelf: 'center' }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: KUKAT.navy, lineHeight: 1.2 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: KUKAT.textMuted, textTransform: 'capitalize' }}>
              {user?.role}
            </Typography>
          </Box>
          <Avatar sx={{
            width: 34, height: 34, fontSize: '0.82rem', fontWeight: 600,
            background: `linear-gradient(135deg, ${KUKAT.amber} 0%, ${KUKAT.amberDark} 100%)`,
            color: KUKAT.navy,
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
        </Box>
      </Box>
    </Box>
  );
}
