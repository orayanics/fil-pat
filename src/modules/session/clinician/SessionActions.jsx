"use client";
import {useParams} from "next/navigation";
import {SaveRounded} from "@mui/icons-material";
import {Card, Tooltip, Button} from "@mui/joy";

import {useSocketDispatch} from "@/context/SocketProvider";

export default function SessionActions() {
  const {saveSessionManually} = useSocketDispatch();
  const params = useParams();
  const sessionId = params.id;

  return (
    <Card>
      <Tooltip
        describeChild
        title="The system also saves the session every 5 minutes."
      >
        <Button
          startDecorator={<SaveRounded />}
          variant="outlined"
          color="success"
          onClick={saveSessionManually}
          sx={{mx: 1}}
        >
          Save Session
        </Button>
      </Tooltip>

      <Tooltip describeChild title="This will open the PDF in a new tab.">
        <Button
          startDecorator={<SaveRounded />}
          variant="outlined"
          color="success"
          sx={{mx: 1}}
          onClick={() => {
            saveSessionManually();
            window.open(`/pdf/${sessionId}`, "_blank", "noopener,noreferrer");
          }}
        >
          View as PDF
        </Button>
      </Tooltip>
    </Card>
  );
}
