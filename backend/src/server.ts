import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { chaosStore } from './data/chaosStore';
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

  // Flaky socket connection drop simulation
  const dropRate = chaosStore.getConfig().websocketDropRate;
  if (dropRate > 0 && Math.random() < dropRate) {
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
  '1984 Bugs',
  'Pride and Prejudice and Performance Issues',
  'The Null and the Furious',
  'Harry Potter and the Goblet of Fire Events',
  'The Hitchhiker\'s Guide to the API',
  'Moby Stack Overflow'
];

setInterval(() => {
  if (io.sockets.sockets.size > 0) {
    const templateObj = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const book = BOOKS[Math.floor(Math.random() * BOOKS.length)];
    const count = Math.floor(Math.random() * 12) + 2;

    const message = templateObj.template
      .replace('{city}', city)
      .replace('{book}', `"${book}"`)
      .replace('{count}', String(count));

    const eventPayload = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type: templateObj.type,
      timestamp: new Date().toISOString()
    };

    io.emit('bookstore-event', eventPayload);
  }
}, 8000);

server.listen(PORT, () => {
  logger.info(`Backend server running on http://localhost:${PORT}`);
});
