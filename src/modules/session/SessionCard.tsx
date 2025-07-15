"use client";
import { Card, Button } from "@mui/joy";
import useData from "./useData";
import { useSocketContext } from "@/context/SocketProvider";

export default function SessionCard() {
  const { socket, isConnected, sessionId, currentItem } = useSocketContext();
  const { item, changeItem } = useData({ socket, sessionId, currentItem });

  return (
    <Card>
      <p>Is {isConnected ? "Active" : "Inactive"}</p>
      <h2>Session Item {item.item}</h2>
      <h2>{item.question}</h2>
      <p>{item.sound}</p>
      <Button variant="solid" color="primary" onClick={() => changeItem(-1)}>
        Back
      </Button>
      <Button variant="solid" color="danger" onClick={() => changeItem(+1)}>
        Next
      </Button>
    </Card>
  );
}
