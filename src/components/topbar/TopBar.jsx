import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  AppBar,
  Toolbar,
  IconButton,
  InputBase,
  Badge,
  Avatar,
  Box,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  MenuOpen as MenuOpenIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";

// ── Sample data ────────────────────────────────────────────
const NOTIFICATIONS = [
  { id: 1, title: "New employee added", time: "2 min ago", read: false },
  { id: 2, title: "Leave request approved", time: "1 hr ago", read: false },
  { id: 3, title: "Payroll processed", time: "3 hrs ago", read: true },
  { id: 4, title: "System backup complete", time: "Yesterday", read: true },
];

// ── Constants ──────────────────────────────────────────────
const SIDEBAR_COLLAPSED_WIDTH = 86; // px — match your CSS

// ── Styles ─────────────────────────────────────────────────
const sx = {
  appBar: (isCollapsed) => ({
    backgroundColor: "#ffffff",
    backgroundImage: "none",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)",
    width: {
      xs: "100%",
      lg: isCollapsed ? `calc(100% - ${SIDEBAR_COLLAPSED_WIDTH}px)` : `calc(100% - 15rem)`,
    },
    ml: {
      xs: 0,
      lg: isCollapsed ? `${SIDEBAR_COLLAPSED_WIDTH}px` : `15rem`,
    },
    transition:
      "width 0.18s cubic-bezier(0.4,0,0.2,1), margin-left 0.18s cubic-bezier(0.4,0,0.2,1)",
    zIndex: 1040,
  }),

  toolbar: {
    minHeight: "4.5rem !important",
    px: { xs: 2, sm: 3 },
    gap: 1,
  },

  // Breadcrumb / page title
  breadcrumb: {
    display: { xs: "none", sm: "flex" },
    flexDirection: "column",
    mr: "auto",
  },

  pageTitle: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "#1e293b",
    lineHeight: 1.3,
  },

  breadcrumbSub: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    lineHeight: 1.3,
  },

  // Search
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: "8px",
    px: 1.5,
    py: 0.5,
    gap: 1,
    border: "1px solid #e2e8f0",
    width: { xs: 140, sm: 220 },
    transition: "border-color 0.18s ease",
    "&:focus-within": {
      borderColor: "#6366f1",
    },
    ml: "auto",
    flexShrink: 0,
  },

  searchIcon: {
    color: "#94a3b8",
    fontSize: "1.1rem",
    flexShrink: 0,
  },

  searchInput: {
    fontSize: "0.8125rem",
    color: "#334155",
    "& input::placeholder": {
      color: "#94a3b8",
      opacity: 1,
    },
  },

  // Icon buttons
  iconBtn: {
    color: "#64748b",
    borderRadius: "8px",
    "&:hover": {
      backgroundColor: "#f1f5f9",
      color: "#1e293b",
    },
  },

  badge: {
    "& .MuiBadge-badge": {
      backgroundColor: "#6366f1",
      color: "#fff",
      fontSize: "0.65rem",
      minWidth: 16,
      height: 16,
    },
  },

  avatar: {
    width: 34,
    height: 34,
    bgcolor: "#6366f1",
    fontSize: "0.8125rem",
    fontWeight: 700,
    cursor: "pointer",
    border: "2px solid #e2e8f0",
    "&:hover": { borderColor: "#6366f1" },
    transition: "border-color 0.18s ease",
  },

  // Notification popover
  notifPopover: {
    "& .MuiPopover-paper": {
      backgroundColor: "#151a2d",
      border: "1px solid #ffffff12",
      borderRadius: "12px",
      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
      width: 320,
      mt: 1,
    },
  },

  notifHeader: {
    px: 2,
    py: 1.5,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #ffffff0f",
  },

  notifItem: (read) => ({
    px: 2,
    py: 1,
    alignItems: "flex-start",
    backgroundColor: read ? "transparent" : "#1e2a4240",
    "&:hover": { backgroundColor: "#ffffff08", cursor: "pointer" },
  }),

  // Profile menu
  profileMenu: {
    "& .MuiMenu-paper": {
      backgroundColor: "#151a2d",
      border: "1px solid #ffffff12",
      borderRadius: "12px",
      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
      minWidth: 180,
      mt: 1,
    },
  },

  profileMenuItem: {
    fontSize: "0.8125rem",
    color: "#c8d3e8",
    px: 2,
    py: 1,
    gap: 1.5,
    "&:hover": { backgroundColor: "#ffffff0f", color: "#fff" },
  },
};

// ── Component ──────────────────────────────────────────────
const TopBar = ({
  isCollapsed = false,
  onToggle,
  onMobileToggle,
  onProfileClick,
  pageTitle = "Dashboard",
  breadcrumb = "Home / Dashboard",
}) => {
  const { user, logout } = useAuth();
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  const getInitials = (name) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  const handleMenuClick = () => {
    if (window.matchMedia("(max-width: 1199px)").matches) {
      onMobileToggle && onMobileToggle();
      return;
    }
    onToggle && onToggle();
  };

  return (
    <AppBar position="fixed" sx={sx.appBar(isCollapsed)}>
      <Toolbar sx={sx.toolbar}>
        {/* ── Sidebar collapse toggle ── */}
        <Tooltip title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <IconButton
            sx={sx.iconBtn}
            onClick={handleMenuClick}
          >
            {isCollapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* ── Page title / breadcrumb ── */}
        <Box sx={sx.breadcrumb}>
          <Typography sx={sx.pageTitle}>{pageTitle}</Typography>
          <Typography sx={sx.breadcrumbSub}>{breadcrumb}</Typography>
        </Box>

        {/* ── Search ── */}
        <Box sx={sx.searchWrapper}>
          <SearchIcon sx={sx.searchIcon} />
          <InputBase
            placeholder="Search…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            sx={sx.searchInput}
            fullWidth
          />
        </Box>

        {/* ── Notifications ── */}
        <Tooltip title="Notifications">
          <IconButton
            sx={sx.iconBtn}
            onClick={(e) => setNotifAnchor(e.currentTarget)}
          >
            <Badge badgeContent={unreadCount} sx={sx.badge}>
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Popover
          open={Boolean(notifAnchor)}
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          sx={sx.notifPopover}
        >
          {/* Header */}
          <Box sx={sx.notifHeader}>
            <Typography
              sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#e2e8f0" }}
            >
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "#818cf8",
                  cursor: "pointer",
                }}
              >
                Mark all read
              </Typography>
            )}
          </Box>

          {/* List */}
          <List disablePadding>
            {NOTIFICATIONS.map((notif, i) => (
              <Box key={notif.id}>
                <ListItem sx={sx.notifItem(notif.read)}>
                  <ListItemAvatar sx={{ minWidth: 36, mt: 0.5 }}>
                    <CircleIcon
                      sx={{
                        fontSize: 8,
                        color: notif.read ? "transparent" : "#818cf8",
                        mt: 0.5,
                      }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          fontSize: "0.8125rem",
                          color: "#c8d3e8",
                          fontWeight: notif.read ? 400 : 600,
                        }}
                      >
                        {notif.title}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        sx={{ fontSize: "0.72rem", color: "#6b7fa3" }}
                      >
                        {notif.time}
                      </Typography>
                    }
                  />
                </ListItem>
                {i < NOTIFICATIONS.length - 1 && (
                  <Divider sx={{ borderColor: "#ffffff08" }} />
                )}
              </Box>
            ))}
          </List>

          {/* Footer */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderTop: "1px solid #ffffff0f",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{ fontSize: "0.8rem", color: "#818cf8", cursor: "pointer" }}
            >
              View all notifications
            </Typography>
          </Box>
        </Popover>

        {/* ── Avatar / Profile ── */}
        <Tooltip title="Account">
          <Avatar
            sx={sx.avatar}
            onClick={(e) => setProfileAnchor(e.currentTarget)}
          >
            {getInitials(user?.fullName)}
          </Avatar>
        </Tooltip>

        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          sx={sx.profileMenu}
        >
          {/* User info */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #ffffff0f" }}>
            <Typography
              sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#e2e8f0" }}
            >
              {user?.fullName || user?.username || "Super Admin"}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#6b7fa3" }}>
              {user?.email || "admin@skerp.com"}
            </Typography>
          </Box>

          <MenuItem
            sx={sx.profileMenuItem}
            onClick={() => {
              setProfileAnchor(null);
              onProfileClick?.();
            }}
          >
            <iconify-icon icon="ri:user-3-line" />
            My Profile
          </MenuItem>
          <MenuItem
            sx={sx.profileMenuItem}
            onClick={() => setProfileAnchor(null)}
          >
            <iconify-icon icon="ri:settings-3-line" />
            Settings
          </MenuItem>
          <Divider sx={{ borderColor: "#ffffff0f", my: 0.5 }} />
          <MenuItem
            sx={{ ...sx.profileMenuItem, color: "#f87171" }}
            onClick={() => {
              setProfileAnchor(null);
              logout();
            }}
          >
            <iconify-icon icon="ri:shut-down-line" />
            Log Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
