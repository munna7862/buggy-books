import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChaosDashboard from './ChaosDashboard';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    getChaosConfig: vi.fn(),
    updateChaosConfig: vi.fn(),
    resetChaosConfig: vi.fn()
  }
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('ChaosDashboard Component Tests', () => {
  const mockConfig = {
    checkoutFailureRate: 0.15,
    inventoryDelayMs: 500,
    jwtExpirySeconds: 900,
    websocketDropRate: 0.05,
    uploadFailureRate: 0.10,
    injectA11yViolations: false,
    visualChaos: false,
    inventoryLockingRate: 0.20
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getChaosConfig).mockResolvedValue(mockConfig);
    vi.mocked(api.updateChaosConfig).mockResolvedValue({
      success: true,
      config: mockConfig
    });
    vi.mocked(api.resetChaosConfig).mockResolvedValue({
      success: true,
      message: 'Reset successful'
    });
  });

  it('renders Chaos Control Center with initial config values', async () => {
    render(<ChaosDashboard />);

    expect(screen.getByText(/Chaos Control Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Engine Active|Connecting/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/Checkout Failure Rate/i)).toHaveValue('0.15');
      expect(screen.getByLabelText(/Stock Lock Contention Rate/i)).toHaveValue('0.2');
      expect(screen.getByLabelText(/Inventory Report Latency/i)).toHaveValue('500');
    });
  });

  it('updates slider value when user moves the slider', async () => {
    render(<ChaosDashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Checkout Failure Rate/i)).toBeInTheDocument();
    });

    const slider = screen.getByLabelText(/Checkout Failure Rate/i);
    fireEvent.change(slider, { target: { value: '0.5' } });

    expect(slider).toHaveValue('0.5');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('toggles fault injection switches', async () => {
    render(<ChaosDashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Inject A11y Violations/i)).toBeInTheDocument();
    });

    const a11yToggle = screen.getByLabelText(/Inject A11y Violations/i);
    expect(a11yToggle).not.toBeChecked();

    fireEvent.click(a11yToggle);
    expect(a11yToggle).toBeChecked();
  });

  it('applies preset when a preset card is clicked', async () => {
    render(<ChaosDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Flaky Gateway/i })).toBeInTheDocument();
    });

    const presetBtn = screen.getByRole('button', { name: /Flaky Gateway/i });
    fireEvent.click(presetBtn);

    const checkoutSlider = screen.getByLabelText(/Checkout Failure Rate/i);
    expect(checkoutSlider).toHaveValue('0.4');
  });

  it('calls updateChaosConfig when Apply Chaos Config button is clicked', async () => {
    render(<ChaosDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Chaos Config/i })).toBeInTheDocument();
    });

    const applyBtn = screen.getByRole('button', { name: /Apply Chaos Config/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(api.updateChaosConfig).toHaveBeenCalledWith(expect.objectContaining({
        checkoutFailureRate: 0.15,
        inventoryLockingRate: 0.20
      }));
    });
  });

  it('calls resetChaosConfig when Reset Factory Defaults button is clicked', async () => {
    render(<ChaosDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reset Factory Defaults/i })).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole('button', { name: /Reset Factory Defaults/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(api.resetChaosConfig).toHaveBeenCalledTimes(1);
    });
  });
});
