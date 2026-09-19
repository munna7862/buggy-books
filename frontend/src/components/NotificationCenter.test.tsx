import { render, screen, fireEvent, act } from '@testing-library/react';
import NotificationCenter from './NotificationCenter';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import toast from 'react-hot-toast';

// Create a mock socket
const mockSocketOn = vi.fn();
const mockSocketDisconnect = vi.fn();
const mockHandlers: Record<string, (...args: unknown[]) => void> = {};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: (event: string, handler: (...args: unknown[]) => void) => {
      mockHandlers[event] = handler;
      mockSocketOn(event, handler);
    },
    disconnect: mockSocketDisconnect,
  })),
}));

vi.mock('react-hot-toast', () => ({
  default: vi.fn(),
}));

describe('NotificationCenter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key in mockHandlers) {
      delete mockHandlers[key];
    }
  });

  it('renders notification toggle button with default disconnected status', () => {
    render(<NotificationCenter />);

    const button = screen.getByRole('button', { name: /toggle notifications/i });
    expect(button).toBeInTheDocument();

    const dot = document.getElementById('ws-status-dot');
    expect(dot).toHaveClass('status-disconnected');
    expect(dot).toHaveAttribute('title', 'Live Feed: Disconnected');
  });

  it('updates status to connected when socket connects', () => {
    render(<NotificationCenter />);

    act(() => {
      if (mockHandlers['connect']) {
        mockHandlers['connect']();
      }
    });

    const dot = document.getElementById('ws-status-dot');
    expect(dot).toHaveClass('status-connected');
    expect(dot).toHaveAttribute('title', 'Live Feed: Connected');
  });

  it('updates status to reconnecting when socket attempts reconnection', () => {
    render(<NotificationCenter />);

    act(() => {
      if (mockHandlers['reconnect_attempt']) {
        mockHandlers['reconnect_attempt']();
      }
    });

    const dot = document.getElementById('ws-status-dot');
    expect(dot).toHaveClass('status-reconnecting');
    expect(dot).toHaveAttribute('title', 'Live Feed: Reconnecting');
  });

  it('updates status to disconnected on socket disconnect', () => {
    render(<NotificationCenter />);

    act(() => {
      if (mockHandlers['connect']) mockHandlers['connect']();
    });
    expect(document.getElementById('ws-status-dot')).toHaveClass('status-connected');

    act(() => {
      if (mockHandlers['disconnect']) mockHandlers['disconnect']();
    });
    expect(document.getElementById('ws-status-dot')).toHaveClass('status-disconnected');
  });

  it('toggles dropdown and shows empty state message', () => {
    render(<NotificationCenter />);

    const button = screen.getByRole('button', { name: /toggle notifications/i });
    expect(screen.queryByText(/live updates/i)).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText(/live updates/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting for bookstore activity\.\.\./i)).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText(/live updates/i)).not.toBeInTheDocument();
  });

  it('receives bookstore-events, renders them in dropdown, and triggers toasts', () => {
    render(<NotificationCenter />);

    const purchaseEvent = {
      id: 'evt-1',
      type: 'purchase',
      message: 'User purchased The Pragmatic Programmer',
      timestamp: Date.now(),
    };

    const saleEvent = {
      id: 'evt-2',
      type: 'sale',
      message: 'Flash Sale started for JavaScript books!',
      timestamp: Date.now(),
    };

    const infoEvent = {
      id: 'evt-3',
      type: 'inventory',
      message: 'Stock replenished for Clean Code',
      timestamp: Date.now(),
    };

    act(() => {
      if (mockHandlers['bookstore-event']) {
        mockHandlers['bookstore-event'](purchaseEvent);
        mockHandlers['bookstore-event'](saleEvent);
        mockHandlers['bookstore-event'](infoEvent);
      }
    });

    expect(toast).toHaveBeenCalledWith('User purchased The Pragmatic Programmer', { icon: '🛒' });
    expect(toast).toHaveBeenCalledWith('Flash Sale started for JavaScript books!', { icon: '🔥' });

    // Open dropdown to verify list rendering
    const button = screen.getByRole('button', { name: /toggle notifications/i });
    fireEvent.click(button);

    expect(screen.getByText('User purchased The Pragmatic Programmer')).toBeInTheDocument();
    expect(screen.getByText('Flash Sale started for JavaScript books!')).toBeInTheDocument();
    expect(screen.getByText('Stock replenished for Clean Code')).toBeInTheDocument();
  });

  it('disconnects socket cleanly on unmount', () => {
    const { unmount } = render(<NotificationCenter />);
    unmount();
    expect(mockSocketDisconnect).toHaveBeenCalled();
  });
});
