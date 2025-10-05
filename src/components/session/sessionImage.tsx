"use client";
import { useSocketContext } from "@/context/SocketProvider";
import Image from "next/image";
import KidsCard from "@/components/kids/KidsCard";

export default function SessionImage() {
  const { isConnected, currentItem, isKidsMode, sessionInfo } = useSocketContext();

  const ConnectionStatus = () => (
    <div className={`flex items-center gap-2 mb-4 ${isKidsMode ? 'justify-center' : 'justify-start'}`}>
      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isKidsMode ? 'animate-pulse' : ''}`} />
      <span className={`${isKidsMode ? 'text-lg font-bold text-gray-800' : 'text-sm text-gray-600'}`}>
        {isConnected ? (isKidsMode ? 'Nakakonekta! 🎉' : 'Connected') : (isKidsMode ? 'Hindi nakakonekta 😔' : 'Disconnected')}
      </span>
    </div>
  );

  if (!currentItem) {
    return (
      <KidsCard colorScheme="purple" className="text-center">
        <ConnectionStatus />
        <div className={`${isKidsMode ? 'text-2xl' : 'text-lg'} text-gray-600`}>
          {isKidsMode ? 'Naghihintay ng susunod na larawan... 🤔' : 'Waiting for the next item...'}
        </div>
        {isKidsMode && (
          <div className="mt-4">
            <div className="animate-bounce text-6xl">🎮</div>
          </div>
        )}
      </KidsCard>
    );
  }

  return (
    <div className={`${isKidsMode ? 'space-y-6' : 'space-y-4'}`}>
      <ConnectionStatus />
      
      <KidsCard 
        title={isKidsMode ? `Tanong #${currentItem.item_number}` : `Question #${currentItem.item_number}`}
        colorScheme="blue"
      >
        {/* Question */}
        <div className={`${isKidsMode ? 'text-2xl font-bold text-center mb-8' : 'text-lg mb-4'} text-gray-800`}>
          {currentItem.question}
          {isKidsMode && ' 🤔'}
        </div>

        {/* Image */}
        {currentItem.image_url && (
          <div className="flex justify-center mb-6">
            <div className={`relative ${isKidsMode ? 'rounded-3xl overflow-hidden shadow-2xl border-8 border-white' : 'rounded-lg overflow-hidden shadow-lg'}`}>
              <Image
                src={currentItem.image_url}
                alt={currentItem.image_alt_text || "Session Image"}
                width={isKidsMode ? 600 : 500}
                height={isKidsMode ? 600 : 500}
                className="object-cover"
                style={{
                  backgroundColor: currentItem.background_color || (isKidsMode ? '#f0f9ff' : 'transparent')
                }}
              />
              {isKidsMode && (
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 pointer-events-none" />
              )}
            </div>
          </div>
        )}

        {/* Additional information for clinician view */}
        {!isKidsMode && (
          <div className="text-sm text-gray-500 space-y-1">
            {currentItem.sound && <p><strong>Sound:</strong> {currentItem.sound}</p>}
            {currentItem.ipa_key && <p><strong>IPA:</strong> {currentItem.ipa_key}</p>}
            {currentItem.expected_response && <p><strong>Expected:</strong> {currentItem.expected_response}</p>}
            <p><strong>Difficulty:</strong> {currentItem.difficulty_level}</p>
          </div>
        )}

        {/* Kids mode encouragement */}
        {isKidsMode && (
          <div className="text-center">
            <p className="text-xl font-semibold text-purple-600 animate-pulse">
              Magaling ka! Sagot na! 🌟
            </p>
          </div>
        )}
      </KidsCard>

      {/* Progress indicator for kids mode */}
      {isKidsMode && sessionInfo && (
        <KidsCard colorScheme="green" className="text-center">
          <div className="text-lg font-bold text-gray-800 mb-2">
            Pagsulong 🏁
          </div>
          <div className="flex justify-center items-center gap-2">
            {Array.from({ length: Math.min(10, sessionInfo.total_items) }, (_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full ${
                  i < sessionInfo.completed_items
                    ? 'bg-green-500 animate-bounce'
                    : 'bg-gray-300'
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {sessionInfo.completed_items} / {sessionInfo.total_items}
          </div>
        </KidsCard>
      )}
    </div>
  );
}