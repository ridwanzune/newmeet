
import React from 'react';
import { User, Point } from '../types';

interface UserCursorProps {
  user: User;
  position: Point;
}

const UserCursor: React.FC<UserCursorProps> = ({ user, position }) => {
  return (
    <div
      className="absolute top-0 left-0 pointer-events-none transition-transform duration-75 ease-out"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <svg
        className="w-6 h-6 -ml-1 -mt-1"
        viewBox="0 0 24 24"
        fill={user.color}
        style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.5))` }}
      >
        <path d="M4.221 4.221a1.5 1.5 0 012.122 0l11.313 11.314a1.5 1.5 0 01-2.121 2.121L4.221 6.342a1.5 1.5 0 010-2.121z" />
        <path d="M5.283 3.16a1.5 1.5 0 012.121 0l1.414 1.415a1.5 1.5 0 01-2.121 2.121L5.283 5.282a1.5 1.5 0 010-2.121z" />
      </svg>
      <div
        className="px-2 py-1 text-xs text-white rounded-md shadow-lg"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>
    </div>
  );
};

export default UserCursor;
