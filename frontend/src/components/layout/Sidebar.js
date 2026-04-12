import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Tooltip, Avatar, Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  BookOnline as BookingsIcon,
  People as CustomersIcon,
  CardTravel as PackagesIcon,
  Receipt as InvoicesIcon,
  AccountBalance as CommissionsIcon,
  BarChart as ReportsIcon,
  ManageAccounts as StaffIcon,
  PeopleAlt as HRIcon,
  FlightTakeoff as FlightIcon,
  ChevronLeft, ChevronRight,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  LockOutlined as LockOutlinedIcon,
} from '@mui/icons-material';
import { useAuth, ROLES } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

export const SIDEBAR_WIDTH       = 240;
export const SIDEBAR_WIDTH_MINI  = 68;

// ── Nav items — visible per role ──────────────────────────────
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    roles: Object.values(ROLES),
  },
  {
    label: 'Bookings',
    icon: <BookingsIcon />,
    path: '/bookings',
    roles: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.AGENT],
  },
  {
    label: 'Customers',
    icon: <CustomersIcon />,
    path: '/customers',
    roles: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.AGENT, ROLES.HR],
  },
  {
    label: 'Packages',
    icon: <PackagesIcon />,
    path: '/packages',
    roles: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.AGENT],
  },
  {
    label: 'Invoices',
    icon: <InvoicesIcon />,
    path: '/invoices',
    roles: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],
  },
  {
    label: 'Commissions',
    icon: <CommissionsIcon />,
    path: '/commissions',
    roles: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.AGENT, ROLES.ACCOUNTANT],
  },
  {
    label: 'Reports',
    icon: <ReportsIcon />,
    path: '/reports',
    roles: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.HR],
  },
  {
    label: 'Staff',
    icon: <StaffIcon />,
    path: '/staff',
    roles: [ROLES.SUPERADMIN, ROLES.HR],
  },
  {
    label: 'HR',
    icon: <HRIcon />,
    path: '/hr',
    roles: [ROLES.SUPERADMIN, ROLES.HR],
  },
  {
  label: 'Change password',
  icon:  <LockOutlinedIcon />,
  path:  '/change-password',
  roles: Object.values(ROLES),
},
];

// ── Role badge config ─────────────────────────────────────────
const ROLE_CONFIG = {
  superadmin:  { label: 'Super Admin', bg: '#0B2B40', color: '#FCD34D' },
  manager:     { label: 'Manager',     bg: '#7E22CE', color: '#F3E8FF' },
  agent:       { label: 'Agent',       bg: '#15803D', color: '#DCFCE7' },
  accountant:  { label: 'Accountant',  bg: '#854D0E', color: '#FEF9C3' },
  hr:          { label: 'HR',          bg: '#9F1239', color: '#FFE4E6' },
};

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [mini, setMini] = useState(false);

  const width = mini ? SIDEBAR_WIDTH_MINI : SIDEBAR_WIDTH;

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles.includes(user?.role)
  );

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleConf = ROLE_CONFIG[user?.role] || ROLE_CONFIG.agent;

  return (
    <Box sx={{
      width,
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${KUKAT.navyDark} 0%, ${KUKAT.navy} 60%, ${KUKAT.navyLight} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>

      {/* ── Logo ─────────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        gap: 1.5, px: mini ? 1.5 : 2.5, py: 2.5,
        minHeight: 68,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        justifyContent: mini ? 'center' : 'flex-start',
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
          background: `linear-gradient(135deg, ${KUKAT.amber} 0%, ${KUKAT.amberDark} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FlightIcon sx={{ color: KUKAT.navy, fontSize: 18, transform: 'rotate(45deg)' }} />
        </Box>
        {!mini && (
          <Typography sx={{
            color: '#fff', fontFamily: '"Playfair Display", serif',
            fontWeight: 700, fontSize: '1.35rem', letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}>
            KUKAT
          </Typography>
        )}
      </Box>

      {/* ── Nav items ─────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', pt: 1 }}>
        <List dense disablePadding sx={{ px: mini ? 0.5 : 1.5 }}>
          {visibleItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Tooltip
                key={item.path}
                title={mini ? item.label : ''}
                placement="right"
                arrow
              >
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '9px', mb: 0.5,
                    px: mini ? 1.5 : 1.8, py: 1.1,
                    justifyContent: mini ? 'center' : 'flex-start',
                    minHeight: 44,
                    background: active
                      ? 'rgba(245,158,11,0.18)'
                      : 'transparent',
                    borderLeft: active
                      ? `3px solid ${KUKAT.amber}`
                      : '3px solid transparent',
                    '&:hover': {
                      background: active
                        ? 'rgba(245,158,11,0.22)'
                        : 'rgba(255,255,255,0.06)',
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: mini ? 0 : 36,
                    color: active ? KUKAT.amber : 'rgba(255,255,255,0.55)',
                    '& svg': { fontSize: 20 },
                    justifyContent: 'center',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {!mini && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.88rem',
                        fontWeight: active ? 600 : 400,
                        color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                        whiteSpace: 'nowrap',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* ── Bottom: user + collapse ───────────────────────────── */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.07)', p: mini ? 1 : 1.5 }}>

        {/* Collapse toggle */}
        <ListItemButton
          onClick={() => setMini(!mini)}
          sx={{
            borderRadius: '9px', mb: 1,
            px: 1.5, py: 0.8,
            justifyContent: mini ? 'center' : 'flex-end',
            '&:hover': { background: 'rgba(255,255,255,0.06)' },
          }}
        >
          {mini
            ? <ChevronRight sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
            : <>
                <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', mr: 0.5 }}>
                  Collapse
                </Typography>
                <ChevronLeft sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />
              </>
          }
        </ListItemButton>

        {/* User card */}
        {!mini ? (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            p: 1.5, borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Avatar sx={{
              width: 34, height: 34, fontSize: '0.85rem', fontWeight: 600,
              background: `linear-gradient(135deg, ${KUKAT.amber} 0%, ${KUKAT.amberDark} 100%)`,
              color: KUKAT.navy,
            }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography sx={{
                color: '#fff', fontSize: '0.82rem', fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Chip
                label={roleConf.label}
                size="small"
                sx={{
                  height: 16, fontSize: '0.65rem', fontWeight: 600,
                  backgroundColor: roleConf.bg,
                  color: roleConf.color,
                  border: `1px solid ${roleConf.color}30`,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Box>
            <Tooltip title="Sign out" placement="top">
              <LogoutIcon
                onClick={handleLogout}
                sx={{
                  fontSize: 16, color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                  '&:hover': { color: '#EF4444' },
                  transition: 'color 0.15s',
                }}
              />
            </Tooltip>
          </Box>
        ) : (
          <Tooltip title="Sign out" placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={{ borderRadius: '9px', justifyContent: 'center', py: 1 }}
            >
              <LogoutIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }} />
            </ListItemButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
