import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SnakeGameProps {
  onClose: () => void;
}

const GRID_SIZE = 20;
const TILE_SIZE = 20;
const INITIAL_SPEED = 200; // ms

const SnakeGame: React.FC<SnakeGameProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    setFood(newFood);
  }, [snake]);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    generateFood();
    setDirection({ x: 1, y: 0 });
    setSpeed(INITIAL_SPEED);
    setScore(0);
    setIsGameOver(false);
  }, [generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        case ' ': if (isGameOver) resetGame(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGameOver, resetGame]);

  useEffect(() => {
    if (isGameOver) return;
    
    const gameInterval = setInterval(() => {
      setSnake(prevSnake => {
        const newHead = { x: prevSnake[0].x + direction.x, y: prevSnake[0].y + direction.y };
        
        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setIsGameOver(true);
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setIsGameOver(true);
          return prevSnake;
        }

        let newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setSpeed(s => Math.max(50, s * 0.95));
          generateFood();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(gameInterval);
  }, [snake, direction, food, speed, isGameOver, generateFood]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#2d3748'; // Dark gray
    ctx.fillRect(0, 0, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);
    
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#48bb78' : '#68d391'; // Green shades
      ctx.fillRect(segment.x * TILE_SIZE, segment.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });

    ctx.fillStyle = '#f56565'; // Red
    ctx.fillRect(food.x * TILE_SIZE, food.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

  }, [snake, food]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center font-mono">
      <div className="bg-gray-800 p-4 rounded-lg shadow-2xl border-2 border-purple-500/50">
        <div className="flex justify-between items-center text-white mb-4">
          <h2 className="text-2xl font-bold text-green-400">SNAKE</h2>
          <div className="text-lg">SCORE: <span className="font-bold text-yellow-400">{score}</span></div>
        </div>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * TILE_SIZE}
            height={GRID_SIZE * TILE_SIZE}
            className="bg-gray-900 rounded-md"
          />
          {isGameOver && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
              <h3 className="text-4xl font-bold text-red-500">GAME OVER</h3>
              <p className="mt-2 text-lg">Press SPACE to play again</p>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Exit to Desktop
        </button>
      </div>
    </div>
  );
};

export default SnakeGame;