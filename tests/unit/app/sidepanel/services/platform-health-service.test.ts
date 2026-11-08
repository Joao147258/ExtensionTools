import { describe, expect, it, vi } from 'vitest';
import {
  createPlatformHealthService,
  platformHealthService,
} from '../../../../../src/app/sidepanel/services/platform-health-service';
import type { MessagingClient } from '../../../../../src/platform/messaging/messaging-client';

describe('B3-F10 — PlatformHealthService Unit Tests', () => {
  it('instância padrão é exportada e possui método check', () => {
    expect(platformHealthService).toBeDefined();
    expect(typeof platformHealthService.check).toBe('function');
  });

  it('invoca messaging.request com platform.ping e probe configurado', async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      ok: true,
      value: { alive: true, echo: 'custom-probe' },
    });

    const mockClient = {
      request: mockRequest,
    } as unknown as MessagingClient;

    const service = createPlatformHealthService(mockClient);

    const result = await service.check('custom-probe');

    expect(mockRequest).toHaveBeenCalledWith('platform.ping', {
      probe: 'custom-probe',
    });
    expect(result).toEqual({
      ok: true,
      value: { alive: true, echo: 'custom-probe' },
    });
  });

  it('utiliza valor padrão "sidepanel" quando probe não for fornecido', async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      ok: true,
      value: { alive: true, echo: 'sidepanel' },
    });

    const mockClient = {
      request: mockRequest,
    } as unknown as MessagingClient;

    const service = createPlatformHealthService(mockClient);

    await service.check();

    expect(mockRequest).toHaveBeenCalledWith('platform.ping', {
      probe: 'sidepanel',
    });
  });
});
