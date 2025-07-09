const WebSocket = require('ws');
const PORT = process.env.PORT || 3001;

const wss = new WebSocket.Server({ port: PORT });
const clients = new Map();

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

    if (data.type === 'join') {
      userId = data.userId;
      clients.set(userId, ws);
      // Optionally notify others
    }

    // Signaling: relay SDP/ICE between peers
    if (data.type === 'signal' && data.targetId) {
      const target = clients.get(data.targetId);
      if (target) {
        target.send(JSON.stringify({
          type: 'signal',
          from: userId,
          signal: data.signal,
        }));
      }
    }
  });

  ws.on('close', () => {
    if (userId) clients.delete(userId);
    // Optionally broadcast 'user-left'
  });
});

console.log(`WebSocket signaling server running on port ${PORT}`);