import * as React from "react";
import GlobalStyles from "@mui/joy/GlobalStyles";
import IconButton from "@mui/joy/IconButton";
import MenuIcon from "@mui/icons-material/Menu";

import {toggleSidebar} from "../../utils/sidebar";
import {Container} from "@mui/joy";

export default function PrivateHeader() {
  return (
    <Container
      sx={{
        display: {xs: "flex", md: "none"},
        alignItems: "center",
        justifyContent: "space-between",
        top: 0,
        width: "100vw",
        height: "var(--Header-height)",
        p: 2,
        mb: 2,
        gap: 1,
        borderBottom: "1px solid",
        borderColor: "background.level1",
        boxShadow: "sm",
      }}
    >
      <GlobalStyles
        styles={(theme) => ({
          ":root": {
            "--Header-height": "52px",
            [theme.breakpoints.up("md")]: {
              "--Header-height": "0px",
            },
          },
        })}
      />

      <IconButton onClick={() => toggleSidebar()} color="neutral" size="sm">
        <MenuIcon />
      </IconButton>
    </Container>
  );
}
