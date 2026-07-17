import http from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import app from '../app';
import { chaosStore } from '../data/chaosStore';

describe('WebSocket Integration and Chaos Testing', () => {
  let io: Server;
  let server: http.Server;
  let clientSocket: ClientSocket;
  let port: number;

  beforeAll((done) => {
    server = http.createServer(app);
    io = new Server(server);
    
    server.listen(() => {
      const address = server.address();
      port = typeof address === 'string' ? 0 : address?.port || 0;
      
      io.on('connection', (socket) => {
        // Apply connection drop logic for testing
        const dropRate = chaosStore.getConfig().websocketDropRate;
        if (dropRate > 0) {
          socket.disconnect(true);
        }
      });
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  beforeEach(async () => {
    await requestReset();
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.close();
    }
  });

  async function requestReset() {
    chaosStore.resetConfig();
  }

  it('should establish connection successfully', (done) => {
    clientSocket = Client(`http://localhost:${port}`);
    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  it('should receive broadcasted bookstore-events successfully', (done) => {
    clientSocket = Client(`http://localhost:${port}`);
    
    clientSocket.on('connect', () => {
      const mockEvent = {
        id: 'test-evt-1',
        message: 'A user purchased a book!',
        type: 'purchase',
        timestamp: new Date().toISOString()
      };
      
      io.emit('bookstore-event', mockEvent);
    });

    clientSocket.on('bookstore-event', (evt: any) => {
      expect(evt.id).toBe('test-evt-1');
      expect(evt.message).toBe('A user purchased a book!');
      expect(evt.type).toBe('purchase');
      done();
    });
  });

  it('should disconnect immediately if websocketDropRate is 1.0 (chaos drop check)', (done) => {
    chaosStore.updateConfig({ websocketDropRate: 1.0 });
    
    clientSocket = Client(`http://localhost:${port}`, {
      reconnection: false
    });

    clientSocket.on('disconnect', (reason) => {
      expect(reason).toBe('io server disconnect');
      done();
    });
  });
});
