import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

interface BookstoreEvent {
  id: string;
  message: string;
  type: string;
  timestamp: string;
}

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
// Resolve root domain origin for Socket.io mapping
const SOCKET_URL = BASE_API_URL.replace('/api', '');

export default function NotificationCenter() {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [events, setEvents] = useState<BookstoreEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    socket.on('connect', () => {
      setConnected(true);
      setReconnecting(false);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('reconnect_attempt', () => {
      setReconnecting(true);
    });

    socket.on('bookstore-event', (evt: BookstoreEvent) => {
      setEvents((prev) => [evt, ...prev.slice(0, 4)]);
      
      // Dispatch toast for interesting purchase/sale events
      if (evt.type === 'purchase') {
        toast(evt.message, { icon: '🛒' });
      } else if (evt.type === 'sale') {
        toast(evt.message, { icon: '🔥' });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getStatusColor = () => {
    if (connected) return 'var(--status-connected, #10b981)';
    if (reconnecting) return 'var(--status-reconnecting, #f59e0b)';
    return 'var(--status-disconnected, #ef4444)';
  };

  const getStatusLabel = () => {
    if (connected) return 'Connected';
    if (reconnecting) return 'Reconnecting';
    return 'Disconnected';
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        id="ws-notification-btn"
        className="ws-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
      >
        🔔
        <span
          id="ws-status-dot"
          className={`ws-status-dot ${
            connected ? 'status-connected' : reconnecting ? 'status-reconnecting' : 'status-disconnected'
          }`}
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            border: '2px solid var(--nav-bg)',
            boxShadow: connected ? '0 0 8px #10b981' : 'none'
          }}
          title={`Live Feed: ${getStatusLabel()}`}
        />
      </button>

      {isOpen && (
        <div className="ws-notification-dropdown" id="ws-notification-dropdown">
          <div className="ws-dropdown-header">
            <h4>Live Updates</h4>
            <span style={{ fontSize: '0.75rem', color: getStatusColor(), fontWeight: 600 }}>
              ● {getStatusLabel()}
            </span>
          </div>

          <div className="ws-dropdown-body">
            {events.length === 0 ? (
              <p className="ws-no-events">Waiting for bookstore activity...</p>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className={`ws-event-item evt-${evt.type}`}>
                  <p>{evt.message}</p>
                  <span className="ws-event-time">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
