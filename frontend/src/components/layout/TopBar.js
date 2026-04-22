import React, { useState } from 'react';
import {
  Box, Typography, IconButton, Avatar, Badge,
  Tooltip, Divider, Popover, List, ListItem,
  ListItemText, ListItemIcon, CircularProgress,
} from '@mui/material';
import {
  Notifications as NotifIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  AccountBalance, Receipt, BookOnline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useNotifications } from '../../hooks/useModules';
import { KUKAT } from '../../styles/theme';

const NOTIF_ICONS = {
  commission_pending:  <AccountBalance sx={{ fontSize: 18, color: '#7C3AED' }} />,
  commission_approved: <AccountBalance sx={{ fontSize: 18, color: '#15803D' }} />,
  invoice_overdue:     <Receipt       sx={{ fontSize: 18, color: '#DC2626' }} />,
  booking_pending:     <BookOnline    sx={{ fontSize: 18, color: KUKAT.amber }} />,
};

export default function TopBar({ title, subtitle, onMenuClick, isMobile }) {
  const { user }                              = useAuth();
  const navigate                              = useNavigate();
  const { notifications, total, loading }     = useNotifications();
  const [anchor, setAnchor]                   = useState(null);

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      px: { xs: 2, sm: 3 },
      py: 1.5,
      borderBottom: `1px solid ${KUKAT.border}`,
      background: '#fff',
      gap: 1.5,
    }}>
          {/* Hamburger — mobile only */}
      {isMobile && (
        <IconButton
          onClick={onMenuClick}
          size="small"
          sx={{ color: KUKAT.navy, mr: 0.5 }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Page title */}
      <Box sx={{ flex: 1 }}>
        {title && (
          <Typography variant="h6" sx={{ color: KUKAT.navy, fontWeight: 700, lineHeight: 1 }}>
            {title}
          </Typography>
        )}
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

        {/* Notifications bell */}
        <Tooltip title="Notifications">
          <IconButton size="small" sx={{ color: KUKAT.textMuted }}
            onClick={(e) => setAnchor(e.currentTarget)}>
            <Badge badgeContent={total} color="error"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
              <NotifIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Notifications popover */}
        <Popover
          open={Boolean(anchor)}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              width: 340, mt: 1, borderRadius: '12px',
              border: `1px solid ${KUKAT.border}`,
              boxShadow: '0 8px 24px rgba(11,43,64,0.12)',
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${KUKAT.border}` }}>
            <Typography variant="h6" sx={{ color: KUKAT.navy, fontSize: '0.95rem' }}>
              Notifications
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
                All caught up — no pending actions.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((n, i) => (
                <ListItem key={i} button divider
                  onClick={() => { navigate(n.link); setAnchor(null); }}
                  sx={{ py: 1.5, '&:hover': { background: KUKAT.surfaceAlt } }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {NOTIF_ICONS[n.type] ?? <NotifIcon sx={{ fontSize: 18 }} />}
                  </ListItemIcon>
                  <ListItemText
                    primary={n.message}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: KUKAT.navy }}
                  />
                  <Box sx={{
                    ml: 1, px: 1, py: 0.3, borderRadius: '10px',
                    background: `${KUKAT.navy}10`,
                    minWidth: 24, textAlign: 'center',
                  }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: KUKAT.navy }}>
                      {n.count}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Popover>

        <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 28, alignSelf: 'center' }} />

        {/* User avatar */}
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
            color: KUKAT.navy, cursor: 'pointer',
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
        </Box>
      </Box>
    </Box>
  );
}