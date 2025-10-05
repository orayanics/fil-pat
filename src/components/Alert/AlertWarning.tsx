import {redirect, RedirectType} from "next/navigation";

import {Box, Button, Modal, ModalDialog, Typography} from "@mui/joy";
import {HelpRounded} from "@mui/icons-material";

interface ModalProps {
  description: string;
  open: boolean;
  onClose: () => void;
}

export default function AlertWarning({description, open, onClose}: ModalProps) {
  return (
    <Modal
      open={open}
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
        <Box sx={{margin: "0 auto"}}>
          <HelpRounded
            sx={{
              width: 60,
              height: 60,
            }}
            color="warning"
          />
        </Box>
        <Typography level="body-md" textAlign="center">
          {description}
        </Typography>

        <Box sx={{display: "flex", justifyContent: "center", gap: 1}}>
          <Button variant="outlined" color="warning" onClick={onClose}>
            Cancel Action
          </Button>

          <Button
            variant="solid"
            onClick={() => redirect("/dashboard", RedirectType.push)}
            color="warning"
          >
            Yes, continue
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
