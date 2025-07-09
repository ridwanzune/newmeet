const WebSocket = require('ws');
const PORT = process.env.PORT || 3001;

const wss = new WebSocket.Server({ port: PORT });

let players = {}; // { userId: { id, name, color, position, direction, length, trail } }
let food = [{ x: 200, y: 200 }]; // Example, expand as needed

function broadcast(type, data, except) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== except) {
      client.send(JSON.stringify({ type, ...data }));
    }
  });
}

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    // --- GAME STATE HANDLING ---
    if (data.type === 'join') {
      userId = data.userId;
      players[userId] = {
        id: userId,
        name: data.name || userId,
        color: data.color || '#'+Math.floor(Math.random()*16777215).toString(16),
        position: data.position || { x: 100, y: 100 },
        direction: { x: 1, y: 0 },
        length: 10,
        trail: [],
      };
      ws.send(JSON.stringify({ type: 'initial-state', players, food }));
      broadcast('user-joined', { player: players[userId] }, ws);
    }

    if (data.type === 'player-move' && players[userId]) {
      players[userId] = { ...players[userId], ...data.state };
      broadcast('player-move', { userId, state: players[userId] }, ws);
    }

    if (data.type === 'food-eaten') {
      food.splice(data.foodIndex, 1);
      broadcast('food-update', { food }, null);
    }

    if (data.type === 'leave' && userId) {
      delete players[userId];
      broadcast('user-left', { userId }, ws);
    }

    // --- SIGNALING HANDLING (WebRTC) ---
    if (data.type === 'signal' && data.targetId) {
      // forward to target
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN && client !== ws && players[data.targetId]) {
          client.send(JSON.stringify({
            type: 'signal',
            from: userId,
            signal: data.signal,
          }));
        }
      }
    }
  });

  ws.on('close', () => {
    if (userId) {
      delete players[userId];
      broadcast('user-left', { userId }, ws);
    }
  });
});

console.log(`Game+Signaling server running on ws://localhost:${PORT}`);
