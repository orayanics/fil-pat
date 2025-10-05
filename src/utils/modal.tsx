import {
  CheckCircleOutlineRounded,
  WarningRounded,
  ReportRounded,
  InfoRounded,
} from "@mui/icons-material";

type ModalContentItem = {
  title: string;
  description: string;
};

type ModalContentType = {
  [key: string]: ModalContentItem;
};

const MODAL_STYLES = {
  modal_default: {
    type: "modal_default",
    variant: "solid" as const,
    color: "primary" as const,
    iconColor: "primary" as const,
    startDecorator: <CheckCircleOutlineRounded />,
  },
  modal_neutral: {
    type: "modal_neutral",
    variant: "solid" as const,
    color: "neutral" as const,
    iconColor: "secondary" as const,
    startDecorator: <InfoRounded />,
  },
  modal_success: {
    type: "modal_success",
    variant: "solid" as const,
    color: "success" as const,
    iconColor: "success" as const,
    startDecorator: <CheckCircleOutlineRounded />,
  },
  modal_error: {
    type: "modal_error",
    variant: "solid" as const,
    color: "danger" as const,
    iconColor: "danger" as const,
    startDecorator: <ReportRounded />,
  },
  modal_warning: {
    type: "modal_warning",
    variant: "soft" as const,
    color: "warning" as const,
    iconColor: "warning" as const,
    startDecorator: <WarningRounded />,
  },
};

const MODAL_CONTENT: Record<string, ModalContentType> = {
  modal_default: {
    default: {
      title: "Default Modal",
      description: "This is a default modal description.",
    },
  },
  modal_neutral: {
    neutral: {
      title: "Neutral Modal",
      description: "This is a neutral modal description.",
    },
  },
  modal_success: {
    generate_qr: {
      title: "Created QR Code",
      description: "The QR code has been successfully created.",
    },
  },
  modal_error: {
    generate_qr: {
      title: "Error Creating QR Code",
      description: "The QR code could not be created.",
    },
  },
  modal_warning: {
    redirect: {
      title: "Warning",
      description:
        "You are about to be redirected to a different page. Any unsaved or unsubmitted changes will be lost. Do you want to continue?",
    },
    websocket: {
      title: "Disconnected",
      description: "You have been disconnected from the server.",
    },
  },
};

export { MODAL_STYLES, MODAL_CONTENT };

export type { ModalContentItem, ModalContentType };
