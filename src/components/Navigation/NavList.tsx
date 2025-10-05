import Link from "next/link";
import {
  ListItem,
  ListItemButton,
  ListItemContent,
  Typography,
} from "@mui/joy";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";

import { PrivateList } from "@/utils/navlist";
import { usePathname } from "next/navigation";

export default function NavList() {
  const currentPath = usePathname().split("/").pop() || "Home";
  const isActive = (href: string) => currentPath === href.split("/").pop();
  let isAdmin = false;
  let sidebarHome = "/clinician-dashboard";
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("clinician");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        isAdmin = !!parsed.is_admin;
      } catch {}
    }
    const home = localStorage.getItem("sidebarHome");
    if (home) sidebarHome = home;
  }

  // Home link always first
  const navItems = [
    {
      title: "Home",
      href: sidebarHome,
      icon: <ListAltOutlinedIcon sx={{ mr: 1 }} />,
    },
    ...PrivateList.filter((item) => item.title !== "Home"),
  ];

  return (
    <>
      {navItems.map((item) => (
        <Link key={item.title} href={item.href}>
          <ListItem>
            <ListItemButton selected={isActive(item.href)}>
              {item.icon}
              <ListItemContent>
                <Typography level="title-sm">{item.title}</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>
        </Link>
      ))}
      {/* Admin-only links */}
      {isAdmin && (
        <>
          <ListItem>
            <ListItemButton
              component={Link}
              href="/admin-dashboard/reports"
              selected={isActive("reports")}
            >
              <DescriptionOutlinedIcon sx={{ mr: 1 }} />
              <ListItemContent>
                <Typography level="title-sm">Reports</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton
              component={Link}
              href="/admin-dashboard/activity-logs"
              selected={isActive("activity-logs")}
            >
              <ListAltOutlinedIcon sx={{ mr: 1 }} />
              <ListItemContent>
                <Typography level="title-sm">Activity Logs</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>
        </>
      )}
    </>
  );
}
