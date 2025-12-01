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
import {useSocketState, useSocketDispatch} from "@/context/SocketProvider";
import { useSocketStore } from '@/context/socketStore';

interface SessionCardProps {
  isKidsMode?: boolean;
}

export default function SessionCard({ isKidsMode = false }: SessionCardProps) {
  const {socket, sessionId, currentItem} = useSocketState();
  const {updateCurrentItem} = useSocketDispatch();

  const {length, item, changeItem} = useData({
    socket,
    sessionId,
    currentItem,
    updateCurrentItem,
  });
  // actions will be handled by the global modal
  const setShowEndModal = useSocketStore((s) => s.setShowEndModal);

  if (!item) {
    return null;
  }

  return (
    <Card sx={{width: "100%", padding: 2}}>
      <AspectRatio
        variant="outlined"
        ratio="16/9"
        sx={{width: "100%", borderRadius: "8px"}}
      >
        {(() => {
          const imageData = (item.image as string) || (item.image_url as string) || "https://placehold.co/600x400/png?text=Filipino+PAT";
          const imageSource = imageData.startsWith('data:') 
            ? imageData 
            : imageData.startsWith('http') 
              ? imageData 
              : `data:image/png;base64,${imageData}`;
          const isDataUri = imageSource.startsWith('data:');
          
          return isDataUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSource}
              alt={(item.question as string) ?? `Item ${item.item}`}
              style={{objectFit: "cover", width: "100%", height: "100%"}}
            />
          ) : (
            <Image
              src={imageSource}
              alt={(item.question as string) ?? `Item ${item.item}`}
              width={800}
              height={450}
              style={{objectFit: "cover"}}
            />
          );
        })()}
      </AspectRatio>
      <CardContent>
        <Typography level="h2" fontSize="lg" sx={{ mb: 0.5 }}>
          {isKidsMode ? `Sound ${item.item}` : `Item No. ${item.item}`}
        </Typography>
        <Typography level="body-lg" sx={{ mb: 1 }}>
          {item.question}
        </Typography>

        <Typography level="body-md" sx={{mb: 1}}>
          {item.sound}
        </Typography>

        <CardActions buttonFlex="1" sx={{justifyContent: "space-between"}}>
          <Button
            startDecorator={<KeyboardArrowLeftRounded />}
            variant="outlined"
            color="neutral"
            onClick={() => {
              console.log('[SessionCard] Back button clicked:', { 
                currentItem: item.item, 
                disabled: item.item === 1 
              });
              changeItem(-1);
            }}
            disabled={item.item === 1}
          >
            Back
          </Button>

          <Button
            endDecorator={<KeyboardArrowRightRounded />}
            variant="solid"
            color="primary"
            onClick={async () => {
              // If this is the last item, prompt to end session instead of simply advancing
              if (item.item === length) {
                // Open the global End Session modal which will handle saving and ending
                setShowEndModal(true);
                return;
              }

              changeItem(+1);
            }}
          >
            {item.item === length ? 'End Session' : 'Next'}
          </Button>
        </CardActions>
      </CardContent>
    </Card>
  );
}
