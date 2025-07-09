
import React, { useState } from 'react';

interface NameInputModalProps {
  onSubmit: (name: string) => void;
}

const NameInputModal: React.FC<NameInputModalProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-purple-500/30 w-full max-w-sm text-white">
        <h2 className="text-2xl font-bold mb-4 text-center">Welcome!</h2>
        <p className="text-gray-400 mb-6 text-center">Please enter your name to join the desktop.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            placeholder="Your Name"
            maxLength={15}
            autoFocus
          />
          <button
            type="submit"
            className="w-full mt-6 bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={!name.trim()}
          >
            Start
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameInputModal;
