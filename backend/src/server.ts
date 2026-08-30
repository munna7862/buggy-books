import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { chaosStore } from './data/chaosStore';
import { sessionStorageContext } from './data/storage';
import { logger } from './utils/logger';
import { config } from './config';

const PORT = config.port;

// Wrap express app in http server
const server = http.createServer(app);

// Attach Socket.io
const io = new Server(server, {
  cors: {
    origin: [...config.cors.allowedOrigins],
    credentials: true
  }
});

io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`, { socketId: socket.id });

  const sessionId = (socket.handshake.headers['x-test-session-id'] as string) || (socket.handshake.query?.sessionId as string) || undefined;
  const dropRate = sessionStorageContext.run({ sessionId }, () => chaosStore.getConfig().websocketDropRate);

  // Flaky socket connection drop simulation
  if (dropRate >= 1.0) {
    logger.warn(`Chaos: Force-disconnecting WebSocket client ${socket.id} immediately (rate: ${dropRate})`);
    socket.disconnect(true);
  } else if (dropRate > 0 && Math.random() < dropRate) {
    const delay = Math.floor(Math.random() * 3000) + 1000; // 1 to 4 seconds
    setTimeout(() => {
      logger.warn(`Chaos: Force-disconnecting WebSocket client ${socket.id} (rate: ${dropRate})`);
      socket.disconnect(true);
    }, delay);
  }

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`, { socketId: socket.id });
  });
});

// Emit real-time simulation events
const EVENT_TEMPLATES = [
  { template: 'A user from {city} just purchased {book}!', type: 'purchase' },
  { template: 'Flash sale! {book} is now 15% off!', type: 'sale' },
  { template: '{count} developers are currently debugging {book}.', type: 'views' },
  { template: 'Low Stock Alert: Only 2 copies left of {book}!', type: 'stock' }
];

const CITIES = ['San Francisco', 'London', 'Tokyo', 'Berlin', 'Sydney', 'Mumbai', 'Paris', 'Seattle'];
const BOOKS = [
  'The Great Buggy Gatsby',
  'To Kill a Mockingbird Exception',
  '1984 Syntax Errors',
  'The Catcher in the Try-Catch',
  'Pride and Null Pointer Exception',
  'The Lord of the Rings: The Fellowship of the Segfault',
  'Harry Potter and the Infinite Recursion',
  'Brave New Backend'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

setInterval(() => {
  const templateObj = getRandomElement(EVENT_TEMPLATES);
  const city = getRandomElement(CITIES);
  const book = getRandomElement(BOOKS);
  const count = Math.floor(Math.random() * 40) + 5;

  const message = templateObj.template
    .replace('{city}', city)
    .replace('{book}', book)
    .replace('{count}', count.toString());

  const eventPayload = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: templateObj.type,
    message,
    timestamp: new Date().toISOString()
  };

  io.emit('bookstore-event', eventPayload);
}, 8000);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`BuggyBooks Backend API Server running on port ${PORT}`, {
      port: PORT,
      nodeEnv: config.nodeEnv
    });
  });
}

export { server, io };
