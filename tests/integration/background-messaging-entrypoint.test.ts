import { beforeEach, describe, expect, it, vi } from 'vitest';
import backgroundEntrypoint from '../../src/entrypoints/background/index';
import { MESSAGE_PROTOCOL, MESSAGE_VERSION } from '../../src/platform/messaging/contracts';
import { browser } from 'wxt/browser';

const mocks = vi.hoisted(() => ({
  addListener: vi.fn(),
  removeListener: vi.fn(),
  setPanelBehavior: vi.fn().mockReturnValue(Promise.resolve()),
}));

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      id: 'mock-extension-id',
      onMessage: {
        addListener: mocks.addListener,
        removeListener: mocks.removeListener,
      },
    },
    sidePanel: {
      setPanelBehavior: mocks.setPanelBehavior,
    },
  },
}));

describe('B3-F09 — Background Entrypoint Integration Unit/Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa e registra o roteador de mensageria com o listener de background', async () => {
    backgroundEntrypoint.main();

    expect(mocks.addListener).toHaveBeenCalledTimes(1);
    expect(mocks.setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });

    const registeredListener = mocks.addListener.mock.calls[0][0];
    expect(typeof registeredListener).toBe('function');

    const sendResponse = vi.fn();
    const pingMessage = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-entrypoint-ping',
      type: 'platform.ping',
      payload: { probe: 'entrypoint-health' },
    };

    const handled = registeredListener(pingMessage, { id: 'mock-extension-id' }, sendResponse);

    expect(handled).toBe(true);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-entrypoint-ping',
        ok: true,
        payload: {
          alive: true,
          echo: 'entrypoint-health',
        },
      });
    });
  });
});
