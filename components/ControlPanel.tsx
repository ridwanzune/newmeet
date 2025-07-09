
import React from 'react';
import { User } from '../types';

interface ControlPanelProps {
  currentUser: User;
  users: User[];
  isMuted: boolean;
  onMuteToggle: () => void;
  audioLevels: Record<string, number>;
}

const AudioLevelMeter: React.FC<{ level: number }> = ({ level }) => {
  return (
    <div className="w-16 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
      <div
        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-75"
        style={{ width: `${level * 100}%` }}
      />
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({ currentUser, users, isMuted, onMuteToggle, audioLevels }) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto max-w-4xl bg-gray-900/70 backdrop-blur-sm text-white p-3 rounded-xl shadow-lg flex items-center gap-6 border border-white/10 z-10">
      <button
        onClick={onMuteToggle}
        className="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1l22 22" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        )}
      </button>

      <div className="flex items-center gap-4 flex-wrap justify-center">
        {users.map(user => (
          <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-800/60 rounded-lg">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color, boxShadow: `0 0 8px ${user.color}` }}></div>
            <span className="text-sm font-medium">{user.name}</span>
            <AudioLevelMeter level={audioLevels[user.id] || 0} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ControlPanel);
