
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService } from './services/RealtimeService';
import { webRTCService } from './services/WebRTCService';
import { User, Point, PlayerState, InitialStateEvent } from './types';
import Chalkboard from './components/Chalkboard';
import ChalkboardIcon from './components/ChalkboardIcon';
import RoomFullMessage from './components/RoomFullMessage';
import ControlPanel from './components/ControlPanel';
import PlayerSnake from './components/PlayerSnake';
import NameInputModal from './components/NameInputModal';
import { DESKTOP_SNAKE_SPEED, DESKTOP_SNAKE_LENGTH, DESKTOP_GAME_TICK_RATE } from './constants';

type ActiveApp = 'desktop' | 'chalkboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [playerStates, setPlayerStates] = useState<Record<string, PlayerState>>({});
  const [activeApp, setActiveApp] = useState<ActiveApp>('desktop');
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [needsToSetName, setNeedsToSetName] = useState(false);
  const [audioLevels, setAudioLevels] = useState<Record<string, number>>({});
  const [foodDots, setFoodDots] = useState<Point[]>([]);

  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const chalkboardIconRef = useRef<HTMLDivElement>(null);
  const iconBoundsRef = useRef<DOMRect | undefined>(undefined);

  const checkCollision = (playerPos: Point, iconRect?: DOMRect): boolean => {
    if (!iconRect) return false;
    return (
      playerPos.x > iconRect.left &&
      playerPos.x < iconRect.right &&
      playerPos.y > iconRect.top &&
      playerPos.y < iconRect.bottom
    );
  };

  const updateGame = useCallback((time: number) => {
    // Pause game if app is not desktop, user isn't set, or name modal is open
    if (activeApp !== 'desktop' || !currentUser || needsToSetName) {
      gameLoopRef.current = requestAnimationFrame(updateGame);
      return;
    }

    if (time - lastUpdateTimeRef.current < DESKTOP_GAME_TICK_RATE) {
      gameLoopRef.current = requestAnimationFrame(updateGame);
      return;
    }
    lastUpdateTimeRef.current = time;

    setPlayerStates(prevStates => {
      const myState = prevStates[currentUser.id];
      if (!myState) return prevStates;

      const newPosition = {
        x: myState.position.x + myState.direction.x * DESKTOP_SNAKE_SPEED,
        y: myState.position.y + myState.direction.y * DESKTOP_SNAKE_SPEED,
      };

      // Screen wrapping
      if (newPosition.x < 0) newPosition.x = window.innerWidth;
      if (newPosition.x > window.innerWidth) newPosition.x = 0;
      if (newPosition.y < 0) newPosition.y = window.innerHeight;
      if (newPosition.y > window.innerHeight) newPosition.y = 0;

      const resetPlayer = () => {
        const resetState: PlayerState = {
            ...myState,
            position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            trail: [],
            length: DESKTOP_SNAKE_LENGTH,
        };
        realtimeService.updatePlayerPosition(currentUser.id, resetState);
        return { ...prevStates, [currentUser.id]: resetState };
      }

      // --- Self Collision ---
      for (const trailPoint of myState.trail.slice(1)) { // slice(1) to not check head against neck
        const distance = Math.hypot(newPosition.x - trailPoint.x, newPosition.y - trailPoint.y);
        if (distance < 10) { // Collision threshold
            return resetPlayer();
        }
      }

      // --- Food Collision ---
      let lengthIncrease = 0;
      let foodEatenIndex = -1;
      foodDots.forEach((dot, index) => {
        const distance = Math.hypot(newPosition.x - dot.x, newPosition.y - dot.y);
        if (distance < 12) { // collision threshold
            foodEatenIndex = index;
            lengthIncrease += 5;
        }
      });

      if (foodEatenIndex > -1) {
          realtimeService.eatFood({userId: currentUser.id, foodIndex: foodEatenIndex});
      }


      // --- Player Collision ---
      for (const userId in prevStates) {
        if (userId === currentUser.id) continue;
        const otherPlayerState = prevStates[userId];
        // Don't collide with the very head of the other snake, only its body
        for (const trailPoint of otherPlayerState.trail.slice(1)) {
            const distance = Math.hypot(newPosition.x - trailPoint.x, newPosition.y - trailPoint.y);
            if (distance < 10) { // Collision threshold
                return resetPlayer();
            }
        }
      }

      // --- Normal Update ---
      const newLength = myState.length + lengthIncrease;
      const newTrail = [myState.position, ...myState.trail.slice(0, newLength - 1)];

      const newState: PlayerState = {
        ...myState,
        position: newPosition,
        trail: newTrail,
        length: newLength,
      };

      realtimeService.updatePlayerPosition(currentUser.id, newState);
      return { ...prevStates, [currentUser.id]: newState };
    });
    
    gameLoopRef.current = requestAnimationFrame(updateGame);
  }, [activeApp, currentUser, foodDots, needsToSetName]);
  
  // Game loop and keyboard controls
  useEffect(() => {
    if (activeApp === 'desktop' && currentUser && !needsToSetName) {
      lastUpdateTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(updateGame);

      const handleKeyDown = (e: KeyboardEvent) => {
        setPlayerStates(prev => {
          const myState = prev[currentUser.id];
          if (!myState) return prev;
          let newDirection = myState.direction;
          switch (e.key) {
            case 'ArrowUp': if (myState.direction.y === 0) newDirection = { x: 0, y: -1 }; break;
            case 'ArrowDown': if (myState.direction.y === 0) newDirection = { x: 0, y: 1 }; break;
            case 'ArrowLeft': if (myState.direction.x === 0) newDirection = { x: -1, y: 0 }; break;
            case 'ArrowRight': if (myState.direction.x === 0) newDirection = { x: 1, y: 0 }; break;
          }
          if (newDirection !== myState.direction) {
             const newState = { ...myState, direction: newDirection };
             realtimeService.updatePlayerPosition(currentUser.id, newState);
             return { ...prev, [currentUser.id]: newState };
          }
          return prev;
        });
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [activeApp, currentUser, updateGame, needsToSetName]);
  
  // Check for app collisions
  useEffect(() => {
    if (activeApp !== 'desktop' || !currentUser) return;
    const myState = playerStates[currentUser.id];
    if (!myState) return;

    if (checkCollision(myState.position, iconBoundsRef.current)) {
      setActiveApp('chalkboard');
    }
  }, [playerStates, activeApp, currentUser]);

  // Initial setup and real-time event listeners
  useEffect(() => {
    const user = realtimeService.join();
    if (user) {
      setCurrentUser(user);
      setNeedsToSetName(true);
    } else {
      setIsRoomFull(true);
      return;
    }

    webRTCService.start(user.id).catch(err => console.error("Mic access error:", err));
    
    const onInitialState = (data: InitialStateEvent) => {
        setUsers(data.users);
        setFoodDots(data.food);
        if (data.users.some(u => u.id === user.id) && !playerStates[user.id]) {
            const initialState: PlayerState = {
                position: { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight },
                trail: [],
                direction: { x: 1, y: 0 },
                length: DESKTOP_SNAKE_LENGTH,
            };
            setPlayerStates(prev => ({ ...prev, [user.id]: initialState }));
            realtimeService.updatePlayerPosition(user.id, initialState);
        }
    };
    const onUserJoined = (newUser: User) => setUsers(prev => [...prev, newUser]);
    const onUserLeft = (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setPlayerStates(prev => {
        const newStates = { ...prev };
        delete newStates[userId];
        return newStates;
      });
      webRTCService.disconnectFrom(userId);
    };
    const onUserUpdated = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };
    const onPlayerMoved = (data: { userId: string; playerState: PlayerState }) => {
       setPlayerStates(prev => ({ ...prev, [data.userId]: data.playerState }));
    };
    const onFoodStateUpdated = (newFoodState: Point[]) => {
        setFoodDots(newFoodState);
    }

    realtimeService.on('initial-state', onInitialState);
    realtimeService.on('user-joined', onUserJoined);
    realtimeService.on('user-left', onUserLeft);
    realtimeService.on('user-updated', onUserUpdated);
    realtimeService.on('player-moved', onPlayerMoved);
    realtimeService.on('food-state-updated', onFoodStateUpdated);

    return () => {
      realtimeService.leave(user.id);
      realtimeService.off('initial-state', onInitialState);
      realtimeService.off('user-joined', onUserJoined);
      realtimeService.off('user-left', onUserLeft);
      realtimeService.off('user-updated', onUserUpdated);
      realtimeService.off('player-moved', onPlayerMoved);
      realtimeService.off('food-state-updated', onFoodStateUpdated);
      webRTCService.stop();
    };
  }, []);

  // Audio level management
  useEffect(() => {
    webRTCService.onAudioLevelChange(level => {
      if (currentUser) {
        setAudioLevels(prev => ({ ...prev, [currentUser.id]: level }));
      }
    });
    // Mock audio levels for other users for visual feedback
    const interval = setInterval(() => {
      setAudioLevels(prevLevels => {
        const newLevels = { ...prevLevels };
        users.forEach(u => {
          if (u.id !== currentUser?.id) {
            newLevels[u.id] = (newLevels[u.id] > 0.1) ? Math.random() * 0.1 : Math.random() * 0.6;
          }
        });
        return newLevels;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [currentUser, users]);
  
  // Measure icon position
  useEffect(() => {
    iconBoundsRef.current = chalkboardIconRef.current?.getBoundingClientRect();
  }, []);

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    webRTCService.toggleMute(newMutedState);
  };
  
  const handleNameSubmit = (name: string) => {
      if(currentUser && name.trim()) {
          realtimeService.updateUserName(currentUser.id, name.trim());
          setNeedsToSetName(false);
      }
  };

  const handleCloseApp = () => {
    if (currentUser) {
      setPlayerStates(prev => {
        const myState = prev[currentUser.id];
        if (!myState) return prev;
        // Eject the snake away slightly so it doesn't immediately re-trigger the app
        const newPosition = {
          x: myState.position.x + myState.direction.x * 25,
          y: myState.position.y + myState.direction.y * 25,
        };
        const newState = { ...myState, position: newPosition };
        realtimeService.updatePlayerPosition(currentUser.id, newState);
        return { ...prev, [currentUser.id]: newState };
      });
    }
    setActiveApp('desktop');
  };

  if (isRoomFull) {
    return <RoomFullMessage />;
  }

  const appIsOpen = activeApp !== 'desktop';
  const showCursor = appIsOpen || needsToSetName;

  return (
    <main className={`h-screen w-screen bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden relative font-sans select-none ${!showCursor ? 'cursor-none' : ''}`}>
      <ChalkboardIcon ref={chalkboardIconRef} />
      
      {!appIsOpen && foodDots.map((dot, index) => (
        <div
            key={index}
            className="absolute rounded-full bg-yellow-300 w-2 h-2"
            style={{ 
                left: `${dot.x}px`, 
                top: `${dot.y}px`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 6px 1px rgba(253, 230, 138, 0.7)',
             }}
        />
      ))}

      {!appIsOpen && Object.entries(playerStates).map(([userId, state]) => {
          const user = users.find(u => u.id === userId);
          return user ? <PlayerSnake key={userId} playerState={state} color={user.color} name={user.name} /> : null;
      })}
      
      {activeApp === 'chalkboard' && currentUser && (
        <Chalkboard currentUser={currentUser} onClose={handleCloseApp} />
      )}
      
      {needsToSetName && <NameInputModal onSubmit={handleNameSubmit} />}

      {currentUser && (
        <ControlPanel
          currentUser={currentUser}
          users={users}
          isMuted={isMuted}
          onMuteToggle={handleMuteToggle}
          audioLevels={audioLevels}
        />
      )}
    </main>
  );
};

export default App;