import { HomeRounded, GroupRounded } from "@mui/icons-material";

export const PrivateList = [
  {
    title: "Home",
    icon: <HomeRounded />,
    href:
      typeof window !== "undefined" && localStorage.getItem("clinician")
        ? (JSON.parse(localStorage.getItem("clinician") || "{}" ).is_admin ? "/admin-dashboard" : "/clinician-dashboard")
        : "/clinician-dashboard",
  },
  // If admin, show Users, else show Patients
  ...(typeof window !== "undefined" && localStorage.getItem("clinician") && JSON.parse(localStorage.getItem("clinician") || "{}" ).is_admin
    ? [{
        title: "Users",
        icon: <GroupRounded />,
        href: "/users",
      }]
    : [{
        title: "Patients",
        icon: <GroupRounded />,
        href: "/clinician-dashboard/patients",
      }]),
];
