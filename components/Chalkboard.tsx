
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { User, Point, DrawEvent } from '../types';
import { realtimeService } from '../services/RealtimeService';

interface ChalkboardProps {
  currentUser: User;
  onClose: () => void;
}

const Chalkboard: React.FC<ChalkboardProps> = ({ currentUser, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<Point | null>(null);

  const getCanvasContext = useCallback(() => {
    return canvasRef.current?.getContext('2d');
  }, []);

  const drawLine = useCallback((event: DrawEvent) => {
    const context = getCanvasContext();
    if (!context) return;

    context.beginPath();
    context.moveTo(event.start.x, event.start.y);
    context.lineTo(event.end.x, event.end.y);
    context.strokeStyle = event.color;
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.globalAlpha = 0.9;
    context.stroke();
    context.globalAlpha = 1.0;
  }, [getCanvasContext]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const context = getCanvasContext();
      if (!context) return;
      
      const parent = canvas.parentElement!;
      const { width, height } = parent.getBoundingClientRect();

      canvas.width = width;
      canvas.height = height;
      
      context.fillStyle = '#3d4b53';
      context.fillRect(0, 0, canvas.width, canvas.height);
    };
    
    const handleDrawingData = (event: DrawEvent) => {
      if (event.userId === currentUser.id) return; // Don't redraw our own lines
      drawLine(event);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    realtimeService.on('drawing-data', handleDrawingData);

    return () => {
      window.removeEventListener('resize', handleResize);
      realtimeService.off('drawing-data', handleDrawingData);
    };
  }, [drawLine, getCanvasContext, currentUser.id]);
  
  const getMousePos = (e: React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);
    lastPointRef.current = getMousePos(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !lastPointRef.current) return;
    
    const currentPoint = getMousePos(e);
    
    const drawEvent: DrawEvent = {
      userId: currentUser.id,
      color: currentUser.color,
      start: lastPointRef.current,
      end: currentPoint,
    };

    drawLine(drawEvent);
    realtimeService.draw(drawEvent);
    
    lastPointRef.current = currentPoint;
  };
  
  const chalkCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"></circle></svg>') 12 12, crosshair`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <div 
            className="w-[95vw] h-[90vh] bg-[#8B5E3C] p-3 shadow-2xl rounded-lg relative"
            style={{ boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)' }}
        >
            <div className="w-full h-full bg-[#3d4b53] rounded-md overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onMouseMove={draw}
                style={{ cursor: chalkCursor }}
              />
            </div>
             <button
              onClick={onClose}
              className="absolute top-[-16px] right-[-16px] bg-red-600 text-white font-black w-10 h-10 rounded-full border-4 border-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center justify-center text-2xl shadow-lg"
              aria-label="Close Chalkboard"
            >
              &times;
            </button>
            <div className="absolute bottom-[-24px] left-[5%] w-[90%] h-8 bg-[#8B5E3C] rounded-b-lg border-2 border-t-0 border-[#6F4E37]"
                style={{ boxShadow: 'inset 0 3px 5px rgba(0,0,0,0.3)' }}
            />
        </div>
    </div>
  );
};

export default React.memo(Chalkboard);
