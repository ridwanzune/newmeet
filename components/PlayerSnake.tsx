
import React from 'react';
import { PlayerState } from '../types';

interface PlayerSnakeProps {
  playerState: PlayerState;
  color: string;
  name: string;
}

const PlayerSnake: React.FC<PlayerSnakeProps> = ({ playerState, color, name }) => {
  const { position, trail } = playerState;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* Trail */}
      {trail.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: '12px',
            height: '12px',
            backgroundColor: color,
            opacity: 0.1 + (i / trail.length) * 0.4,
            transform: 'translate(-50%, -50%)',
            transition: `left ${DESKTOP_GAME_TICK_RATE}ms linear, top ${DESKTOP_GAME_TICK_RATE}ms linear`
          }}
        />
      ))}

      {/* Head */}
      <div
        className="absolute"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          transition: `left ${DESKTOP_GAME_TICK_RATE}ms linear, top ${DESKTOP_GAME_TICK_RATE}ms linear`
        }}
      >
        <div
          className="w-5 h-5 rounded-full"
          style={{ 
            backgroundColor: color, 
            border: '2px solid white',
            boxShadow: `0 0 12px ${color}` 
          }}
        />
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs text-white rounded-md shadow-lg whitespace-nowrap"
          style={{ backgroundColor: color }}
        >
          {name}
        </div>
      </div>
    </div>
  );
};

const DESKTOP_GAME_TICK_RATE = 50; // Duplicated from constants to avoid import/prop-drilling for a single value in styling

export default React.memo(PlayerSnake);
