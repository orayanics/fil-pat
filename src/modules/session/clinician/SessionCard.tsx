"use client";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardActions,
  AspectRatio,
  Button,
  Typography,
} from "@mui/joy";
import {
  KeyboardArrowLeftRounded,
  KeyboardArrowRightRounded,
} from "@mui/icons-material";
import useData from "../useData";
import { useSocketContext } from "@/context/SocketProvider";

export default function SessionCard() {
  const { socket, sessionId, currentItem } = useSocketContext();
  const { item, changeItem } = useData({ socket, sessionId, currentItem });

  return (
    <Card sx={{ width: "100%", padding: 2 }}>
      <AspectRatio
        variant="outlined"
        ratio="16/9"
        sx={{ width: "100%", borderRadius: "8px" }}
      >
        <Image
          src={item.image || "https://placehold.co/600x400?text=Filipino+PAT"}
          alt={item.question}
          width={800}
          height={450}
          style={{ objectFit: "cover" }}
        />
      </AspectRatio>
      <CardContent>
        <Typography level="h2" fontSize="lg" sx={{ mb: 0.5 }}>
          Item No. {item.item}
        </Typography>
        <Typography level="body-lg" sx={{ mb: 1 }}>
          {item.question}
        </Typography>

        <Typography level="body-md" sx={{ mb: 1 }}>
          {item.sound}
        </Typography>

        <CardActions buttonFlex="1" sx={{ justifyContent: "space-between" }}>
          <Button
            startDecorator={<KeyboardArrowLeftRounded />}
            variant="solid"
            color="primary"
            onClick={() => changeItem(-1)}
          >
            Back
          </Button>
          <Button
            endDecorator={<KeyboardArrowRightRounded />}
            variant="solid"
            color="danger"
            onClick={() => changeItem(+1)}
          >
            Next
          </Button>
        </CardActions>
      </CardContent>
    </Card>
  );
}
