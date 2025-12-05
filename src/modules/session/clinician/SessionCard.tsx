"use client";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardActions,
  AspectRatio,
  Button,
  Typography,
  Select,
  Option,
  Stack,
  Chip,
} from "@mui/joy";
import {
  KeyboardArrowLeftRounded,
  KeyboardArrowRightRounded,
  CheckCircle,
  RadioButtonUnchecked,
  Cancel,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import useData from "../useData";
import {useSocketState, useSocketDispatch} from "@/context/SocketProvider";
import { useSocketStore } from '@/context/socketStore';
import { useMemo, useState, useEffect } from 'react';

interface SessionCardProps {
  isKidsMode?: boolean;
}

export default function SessionCard({ isKidsMode = false }: SessionCardProps) {
  const {socket, sessionId, currentItem} = useSocketState();
  const {updateCurrentItem} = useSocketDispatch();
  const formData = useSocketStore((s) => s.formData);
  const templateItems = useSocketStore((s) => s.templateItems);
  const [showingTargetWord, setShowingTargetWord] = useState(false);

  const {length, item, changeItem} = useData({
    socket,
    sessionId,
    currentItem,
    updateCurrentItem,
  });
  // actions will be handled by the global modal
  const setShowEndModal = useSocketStore((s) => s.setShowEndModal);

  // Reset target word visibility when item changes
  useEffect(() => {
    setShowingTargetWord(false);
  }, [item?.item]);

  // Get status for each item (green = correct, red = incorrect, gray = unanswered)
  const itemStatuses = useMemo(() => {
    const statuses: Record<number, 'correct' | 'incorrect' | 'unanswered'> = {};
    
    if (Array.isArray(templateItems)) {
      templateItems.forEach((templateItem: any) => {
        const itemNum = templateItem.item_number || templateItem.item_id;
        const itemData = formData?.[itemNum] as any;
        
        if (!itemData || !itemData.childResponse) {
          statuses[itemNum] = 'unanswered';
        } else if (itemData.score === 1) {
          statuses[itemNum] = 'correct';
        } else {
          statuses[itemNum] = 'incorrect';
        }
      });
    }
    
    return statuses;
  }, [templateItems, formData]);

  const handleJumpToItem = (itemNumber: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !sessionId) {
      return;
    }
    
    // Send a message to jump directly to this item
    socket.send(JSON.stringify({
      type: 'jumpToItem',
      sessionId,
      itemNumber
    }));
  };

  const toggleTargetWord = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !sessionId) {
      return;
    }
    
    const newState = !showingTargetWord;
    setShowingTargetWord(newState);
    
    // Broadcast to patients in the room
    socket.send(JSON.stringify({
      type: 'toggleTargetWord',
      sessionId,
      show: newState,
      targetWord: item?.target_word || ''
    }));
  };

  // Helper function to get status icon and color
  const getStatusIcon = (status: 'correct' | 'incorrect' | 'unanswered') => {
    switch (status) {
      case 'correct':
        return <CheckCircle sx={{ fontSize: 16, color: 'success.500' }} />;
      case 'incorrect':
        return <Cancel sx={{ fontSize: 16, color: 'danger.500' }} />;
      default:
        return <RadioButtonUnchecked sx={{ fontSize: 16, color: 'neutral.400' }} />;
    }
  };

  const getStatusColor = (status: 'correct' | 'incorrect' | 'unanswered') => {
    switch (status) {
      case 'correct':
        return 'success';
      case 'incorrect':
        return 'danger';
      default:
        return 'neutral';
    }
  };

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
          const imageData = (item.image as string) || (item.image_url as string) || "/images/default-filpat.svg";
          const imageSource = imageData.startsWith('data:') 
            ? imageData 
            : imageData.startsWith('http') 
              ? imageData 
              : imageData.startsWith('/')
                ? imageData  // Local Next.js path - use directly
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

        {item.target_word && (
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
            <Typography level="body-md" sx={{ color: 'primary.500', fontWeight: 600 }}>
              Target Word: {item.target_word}
            </Typography>
            <Button
              size="sm"
              variant={showingTargetWord ? "solid" : "outlined"}
              color={showingTargetWord ? "success" : "neutral"}
              startDecorator={showingTargetWord ? <Visibility /> : <VisibilityOff />}
              onClick={toggleTargetWord}
              sx={{ ml: 'auto' }}
            >
              {showingTargetWord ? 'Showing to Patient' : 'Show to Patient'}
            </Button>
          </Stack>
        )}

        <Typography level="body-md" sx={{mb: 1}}>
          {item.sound}
        </Typography>

        {/* Item Navigation Dropdown */}
        <Stack sx={{ mb: 2 }}>
          <Typography level="body-sm" sx={{ mb: 1, fontWeight: 600 }}>
            Jump to Item:
          </Typography>
          <Select
            value={item.item}
            onChange={(_, value) => {
              if (value !== null) {
                handleJumpToItem(value);
              }
            }}
            sx={{ width: '100%' }}
            slotProps={{
              listbox: {
                sx: {
                  maxHeight: 300,
                },
              },
            }}
            renderValue={(option) => {
              if (!option) return null;
              const itemNum = Number(option.value);
              const templateItem = Array.isArray(templateItems) 
                ? templateItems.find((t) => (t.item_number || t.item_id) === itemNum)
                : null;
              const status = itemStatuses[itemNum] || 'unanswered';
              
              return (
                <Stack direction="row" alignItems="center" gap={1}>
                  {getStatusIcon(status)}
                  <Typography>
                    Item {itemNum}
                    {templateItem?.target_word ? ` - ${String(templateItem.target_word)}` : ''}
                  </Typography>
                </Stack>
              );
            }}
          >
            {Array.isArray(templateItems) && templateItems.map((templateItem) => {
              const itemNum = Number(templateItem.item_number || templateItem.item_id);
              const status = itemStatuses[itemNum] || 'unanswered';
              
              return (
                <Option
                  key={itemNum}
                  value={itemNum}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {getStatusIcon(status)}
                  <Typography sx={{ flex: 1 }}>
                    Item {itemNum}
                    {templateItem.target_word ? ` - ${String(templateItem.target_word)}` : ''}
                  </Typography>
                  <Chip
                    size="sm"
                    color={getStatusColor(status)}
                    variant="soft"
                  >
                    {status === 'correct' ? 'Correct' : status === 'incorrect' ? 'Incorrect' : 'Pending'}
                  </Chip>
                </Option>
              );
            })}
          </Select>
        </Stack>

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
