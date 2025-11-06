import React from 'react';
import { ConnectionState } from '@/types'; 

interface StatusIndicatorProps {
  state: ConnectionState;
}

const stateConfig = {
  [ConnectionState.IDLE]: { text: 'Idle', color: 'bg-gray-500' },
  [ConnectionState.CONNECTING]: { text: 'Connecting...', color: 'bg-yellow-500 animate-pulse' },
  [ConnectionState.CONNECTED]: { text: 'Connected', color: 'bg-green-500' },
  [ConnectionState.DISCONNECTED]: { text: 'Disconnected', color: 'bg-gray-500' },
  [ConnectionState.ERROR]: { text: 'Error', color: 'bg-red-500' },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state }) => {
  const { text, color } = stateConfig[state] || stateConfig[ConnectionState.IDLE];

  return (
    <div className="flex items-center space-x-2">
      <span className={`h-3 w-3 rounded-full ${color}`}></span>
      <span className="text-sm font-medium text-gray-300">{text}</span>
    </div>
  );
};
