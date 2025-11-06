import React, { useRef, useEffect } from 'react';
import { ConversationTurn } from '@/types'; 
interface TranscriptionDisplayProps {
  history: ConversationTurn[];
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ history }) => {
    const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [history]);
    
  return (
    <div className="grow bg-gray-800/70 rounded-lg p-4 overflow-y-auto space-y-4">
      {history.length === 0 ? (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Press "Start Conversation" to begin.</p>
        </div>
      ) : (
        history.map((turn, index) => (
          <div
            key={index}
            className={`flex flex-col ${
              turn.speaker === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-2xl rounded-lg px-4 py-2 ${
                turn.speaker === 'user'
                  ? 'bg-teal-700 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              <p className="text-sm font-bold capitalize mb-1">{turn.speaker}</p>
              <p>{turn.text}</p>
            </div>
          </div>
        ))
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};
