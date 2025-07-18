import { useState } from "react";
import { Box, Button, Modal, ModalDialog, Typography } from "@mui/joy";
import { HelpRounded } from "@mui/icons-material";

import { MODAL_STYLES, MODAL_CONTENT } from "@/utils/modal";

type ModalType =
  | "modal_default"
  | "modal_neutral"
  | "modal_success"
  | "modal_error"
  | "modal_warning";

type ActionType = "default" | "neutral" | "success" | "error" | "redirect";

interface ModalTriggerProps {
  type: ModalType;
  action: ActionType;
  onConfirm: (confirmed: boolean) => void;
}

export default function ModalTrigger(props: ModalTriggerProps) {
  const { type, action, onConfirm } = props;
  const [isOpen, setIsOpen] = useState(false);

  const handleTrigger = (isCancel: boolean) => {
    onConfirm(!isCancel);
    setIsOpen((prev) => !prev);
  };

  const ModalComponent = () => (
    <Modal
      open={isOpen}
      onClose={(
        _event: React.MouseEvent<HTMLButtonElement>,
        reason: string
      ) => {
        if (reason === "backdropClick") {
          return;
        }
      }}
    >
      <ModalDialog
        size="sm"
        variant="outlined"
        role="alertdialog"
        maxWidth={"sm"}
      >
        <Box sx={{ margin: "0 auto" }}>
          <HelpRounded
            sx={{
              width: 60,
              height: 60,
            }}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            color={MODAL_STYLES[type].iconColor}
          />
        </Box>
        <Typography level="body-md" textAlign="center">
          {MODAL_CONTENT[type][action]?.description}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              handleTrigger(true);
            }}
            color={MODAL_STYLES[type].color}
          >
            Cancel
          </Button>

          <Button
            variant="solid"
            onClick={() => {
              handleTrigger(false);
            }}
            color={MODAL_STYLES[type].color}
          >
            Yes, continue
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  );

  return { ModalComponent, setIsOpen, isOpen };
}
