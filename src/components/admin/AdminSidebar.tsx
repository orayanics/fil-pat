"use client";

import { Box, List, ListItem, ListItemButton, ListItemDecorator, ListItemContent, Typography, Divider, IconButton, Sheet } from "@mui/joy";
import { 
  Dashboard, 
  People, 
  PersonAdd, 
  AccessibleForward, 
  Assessment, 
  Settings, 
  ExitToApp,
  Menu as MenuIcon,
  Close as CloseIcon,
  BarChart,
  History
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useSocketContext } from "@/context/SocketProvider";

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useSocketContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { icon: <Dashboard />, label: "Overview", path: "/admin-dashboard" },
    { icon: <People />, label: "Clinicians", path: "/admin-dashboard/clinicians" },
    { icon: <AccessibleForward />, label: "Patients", path: "/admin-dashboard/patients" },
    { icon: <Assessment />, label: "Sessions", path: "/admin-dashboard/sessions" },
    { icon: <BarChart />, label: "Reports", path: "/admin-dashboard/reports" },
    { icon: <History />, label: "Activity Logs", path: "/admin-dashboard/activity-logs" },
    { icon: <Settings />, label: "Settings", path: "/admin-dashboard/settings" },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  const sidebarContent = (
    <Sheet
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography level="h4" fontWeight="bold" sx={{ color: "primary.500" }}>
            FilPat Admin
          </Typography>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Management Portal
          </Typography>
        </Box>
        <IconButton
          variant="plain"
          sx={{ display: { xs: "flex", md: "none" } }}
          onClick={() => setMobileOpen(false)}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Navigation */}
      <List
        sx={{
          flex: 1,
          px: 2,
          py: 1,
          overflow: "auto",
          "--ListItem-radius": "8px",
          "--ListItem-gap": "8px",
        }}
      >
        {menuItems.map((item) => (
          <ListItem key={item.path}>
            <ListItemButton
              selected={pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                py: 1.5,
                "&.Joy-selected": {
                  bgcolor: "primary.softBg",
                  borderLeft: "3px solid",
                  borderColor: "primary.500",
                },
              }}
            >
              <ListItemDecorator>{item.icon}</ListItemDecorator>
              <ListItemContent>
                <Typography level="title-sm">{item.label}</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Logout */}
      <List sx={{ px: 2, py: 2 }}>
        <ListItem>
          <ListItemButton onClick={handleLogout} color="danger">
            <ListItemDecorator>
              <ExitToApp />
            </ListItemDecorator>
            <ListItemContent>
              <Typography level="title-sm">Logout</Typography>
            </ListItemContent>
          </ListItemButton>
        </ListItem>
      </List>
    </Sheet>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <IconButton
        variant="outlined"
        size="sm"
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 1100,
          display: { xs: "flex", md: "none" },
        }}
        onClick={() => setMobileOpen(true)}
      >
        <MenuIcon />
      </IconButton>

      {/* Desktop Sidebar */}
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          display: { xs: "none", md: "block" },
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        {sidebarContent}
      </Box>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            display: { xs: "block", md: "none" },
          }}
        >
          {/* Backdrop */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0, 0, 0, 0.5)",
            }}
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 280,
              bgcolor: "background.surface",
            }}
          >
            {sidebarContent}
          </Box>
        </Box>
      )}
    </>
  );
}
