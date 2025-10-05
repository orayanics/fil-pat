"use client";
import { useState } from "react";
import { Card, Button, LinearProgress, Box } from "@mui/joy";
import KidsButton from "@/components/kids/KidsButton";
import KidsCard from "@/components/kids/KidsCard";
import useData from "@/modules/session/useData";
import { useSocketContext } from "@/context/SocketProvider";

export default function SessionCard() {
  const { 
    socket, 
    isConnected, 
    sessionId, 
    currentItem, 
    sessionInfo,
    isKidsMode,
    sessionStarted,
    sessionPaused,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    toggleKidsMode
  } = useSocketContext();
  
  const { item, changeItem } = useData({ socket, sessionId, currentItem });
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  const handleEndSession = () => {
    endSession('Session completed successfully', sessionNotes);
    setShowEndDialog(false);
  };

  if (isKidsMode) {
    return (
      <div className="space-y-6">
        {/* Session Controls for Kids */}
        <KidsCard title="Mga Kontrol 🎮" colorScheme="purple">
          <div className="flex flex-wrap justify-center gap-4">
            {!sessionStarted ? (
              <KidsButton 
                variant="success" 
                size="xl"
                onClick={startSession}
                disabled={!isConnected}
                icon="🚀"
              >
                Simulan ang Session!
              </KidsButton>
            ) : sessionPaused ? (
              <KidsButton 
                variant="success" 
                size="xl"
                onClick={resumeSession}
                disabled={!isConnected}
                icon="▶️"
              >
                Ituloy
              </KidsButton>
            ) : (
              <KidsButton 
                variant="warning" 
                size="lg"
                onClick={pauseSession}
                disabled={!isConnected}
                icon="⏸️"
              >
                Pahinga
              </KidsButton>
            )}
            
            <KidsButton 
              variant="danger" 
              size="lg"
              onClick={() => setShowEndDialog(true)}
              disabled={!isConnected || !sessionStarted}
              icon="🏁"
            >
              Tapos na
            </KidsButton>
          </div>
        </KidsCard>

        {/* Current Item for Kids */}
        <KidsCard title={`Tanong ${item.item_number} 🎯`} colorScheme="blue">
          <div className="text-center space-y-6">
            <div className="text-3xl font-bold text-purple-600 animate-pulse">
              {item.question}
            </div>
            
            {item.sound && (
              <div className="text-xl text-blue-600 font-semibold">
                Tunog: {item.sound} 🔊
              </div>
            )}

            <div className="flex justify-center gap-6 mt-8">
              <KidsButton 
                variant="secondary" 
                size="xl"
                onClick={() => changeItem(-1)}
                disabled={!isConnected}
                icon="⬅️"
              >
                Bumalik
              </KidsButton>
              
              <KidsButton 
                variant="primary" 
                size="xl"
                onClick={() => changeItem(+1)}
                disabled={!isConnected}
                icon="➡️"
              >
                Susunod
              </KidsButton>
            </div>
          </div>
        </KidsCard>

        {/* Progress for Kids */}
        {sessionInfo && (
          <KidsCard title="Gaano ka na kalapit sa finish line? 🏃‍♂️" colorScheme="green">
            <div className="text-center">
              <div className="text-4xl mb-4">
                {sessionInfo.completed_items} / {sessionInfo.total_items}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-6 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${sessionInfo.total_items > 0 ? (sessionInfo.completed_items / sessionInfo.total_items) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="text-lg font-bold text-gray-700">
                {sessionInfo.total_items > 0 
                  ? `${Math.round((sessionInfo.completed_items / sessionInfo.total_items) * 100)}% Tapos na!`
                  : 'Magsisimula pa lang...'
                }
              </div>
            </div>
          </KidsCard>
        )}
      </div>
    );
  }

  // Standard mode UI
  return (
    <div className="space-y-4">
      <Card variant="outlined">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Session Controls</h2>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isConnected ? 'Active' : 'Inactive'}
            </span>
            <Button 
              size="sm" 
              variant="outlined"
              onClick={toggleKidsMode}
            >
              {isKidsMode ? 'Standard Mode' : 'Kids Mode'}
            </Button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          {!sessionStarted ? (
            <Button 
              variant="solid" 
              color="success"
              onClick={startSession}
              disabled={!isConnected}
            >
              Start Session
            </Button>
          ) : sessionPaused ? (
            <Button 
              variant="solid" 
              color="success"
              onClick={resumeSession}
              disabled={!isConnected}
            >
              Resume
            </Button>
          ) : (
            <Button 
              variant="solid" 
              color="warning"
              onClick={pauseSession}
              disabled={!isConnected}
            >
              Pause
            </Button>
          )}
          
          <Button 
            variant="solid" 
            color="danger"
            onClick={() => setShowEndDialog(true)}
            disabled={!isConnected || !sessionStarted}
          >
            End Session
          </Button>
        </div>

        {sessionInfo && (
          <Box sx={{ mb: 2 }}>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{sessionInfo.completed_items}/{sessionInfo.total_items}</span>
            </div>
            <LinearProgress 
              determinate 
              value={sessionInfo.total_items > 0 ? (sessionInfo.completed_items / sessionInfo.total_items) * 100 : 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </Card>

      <Card variant="outlined">
        <h2 className="text-lg font-semibold mb-3">Session Item {item.item_number}</h2>
        <h3 className="text-xl mb-4">{item.question}</h3>
        
        {item.sound && (
          <p className="text-gray-600 mb-2">
            <strong>Sound:</strong> {item.sound}
          </p>
        )}
        
        {item.ipa_key && (
          <p className="text-gray-600 mb-2">
            <strong>IPA:</strong> {item.ipa_key}
          </p>
        )}

        {item.expected_response && (
          <p className="text-gray-600 mb-4">
            <strong>Expected Response:</strong> {item.expected_response}
          </p>
        )}
        
        <div className="flex gap-4">
          <Button 
            variant="solid" 
            color="primary" 
            onClick={() => changeItem(-1)}
            disabled={!isConnected}
          >
            Back
          </Button>
          <Button 
            variant="solid" 
            color="danger" 
            onClick={() => changeItem(+1)}
            disabled={!isConnected}
          >
            Next
          </Button>
        </div>
      </Card>

      {/* End Session Dialog */}
      {showEndDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">End Session</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to end this session? Please add any final notes:
            </p>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md mb-4"
              rows={3}
              placeholder="Session notes (optional)..."
            />
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outlined" 
                onClick={() => setShowEndDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="solid" 
                color="danger"
                onClick={handleEndSession}
              >
                End Session
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
