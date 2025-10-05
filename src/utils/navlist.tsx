import { HomeRounded, GroupRounded } from "@mui/icons-material";

export const PrivateList = [
  {
    title: "Home",
    icon: <HomeRounded />,
    href:
      typeof window !== "undefined" && localStorage.getItem("clinician")
        ? (JSON.parse(localStorage.getItem("clinician") || "{}").is_admin ? "/admin-dashboard" : "/clinician-dashboard")
        : "/clinician-dashboard",
  },
  {
    title: "Users",
    icon: <GroupRounded />,
    href: "/users",
  },
];
