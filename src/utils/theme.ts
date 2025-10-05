import { extendTheme } from "@mui/joy/styles";

const tokens = {
  primary: {
    solidBg: "#45A4F7",
  },
  // info: {
  //   solidBg: "#3F476C",
  // },
  success: {
    solidDisabledBg: "#C4DDB3",
    outlinedBorder: "#B5D4A0",
    outlinedDisabledColor: "#C4DDB3",
    plainDisabledColor: "#C4DDB3",
  },
};

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          solidBg: tokens.primary.solidBg,
        },
        success: {
          solidDisabledBg: tokens.success.solidDisabledBg,
          outlinedBorder: tokens.success.outlinedBorder,
          outlinedDisabledColor: tokens.success.outlinedDisabledColor,
          plainDisabledColor: tokens.success.plainDisabledColor,
        },
      },
    },
  },
});

export default theme;
