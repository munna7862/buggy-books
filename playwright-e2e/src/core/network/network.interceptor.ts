import { BrowserContext, Request, Response } from '@playwright/test';

export type NetworkCaptureMode = 'all' | 'api-only';

export interface NetworkEntry {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  url: string;
  method: string;
  resourceType: string;
  navigationRequest: boolean;
  headers: Record<string, string>;
  postData?: string | null;
  response?: {
    status: number;
    statusText: string;
    ok: boolean;
    headers: Record<string, string>;
    body?: string | null;
  };
  failure?: {
    errorText: string;
  };
}

export class NetworkInterceptor {
  private static readonly RESPONSE_BODY_TIMEOUT_MS = 2000;
  private static readonly STOP_TIMEOUT_MS = 5000;
  private static readonly API_RESOURCE_TYPES = new Set(['xhr', 'fetch']);
  private readonly entries: NetworkEntry[] = [];
  private readonly requestMap = new WeakMap<Request, NetworkEntry>();
  private readonly pendingTasks = new Set<Promise<void>>();

  constructor(
    private readonly context: BrowserContext,
    private readonly captureMode: NetworkCaptureMode = 'all'
  ) {}

  start() {
    this.context.on('request', this.onRequest);
    this.context.on('response', this.onResponse);
    this.context.on('requestfailed', this.onRequestFailed);
  }

  async stop() {
    this.context.off('request', this.onRequest);
    this.context.off('response', this.onResponse);
    this.context.off('requestfailed', this.onRequestFailed);
    await Promise.race([
      Promise.allSettled([...this.pendingTasks]),
      this.delay(NetworkInterceptor.STOP_TIMEOUT_MS)
    ]);
  }

  getEntries() {
    return this.entries;
  }

  private readonly onRequest = (request: Request) => {
    if (!this.shouldCapture(request)) {
      return;
    }

    const entry: NetworkEntry = {
      id: `${Date.now()}-${this.entries.length + 1}`,
      startedAt: new Date().toISOString(),
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      navigationRequest: request.isNavigationRequest(),
      headers: request.headers(),
      postData: request.postData()
    };

    this.entries.push(entry);
    this.requestMap.set(request, entry);
  };

  private readonly onResponse = (response: Response) => {
    const task = this.captureResponse(response)
      .catch(() => {
        // Best-effort logging: failed response-body reads should not fail the test.
      })
      .finally(() => {
        this.pendingTasks.delete(task);
      });

    this.pendingTasks.add(task);
  };

  private readonly onRequestFailed = (request: Request) => {
    const entry = this.requestMap.get(request);
    if (!entry) {
      return;
    }

    entry.endedAt = new Date().toISOString();
    entry.durationMs = this.getDuration(entry.startedAt, entry.endedAt);
    entry.failure = {
      errorText: request.failure()?.errorText || 'Unknown network failure'
    };
  };

  private async captureResponse(response: Response) {
    const request = response.request();
    const entry = this.requestMap.get(request);
    if (!entry) {
      return;
    }

    let responseBody: string | null = null;

    try {
      if (entry.resourceType === 'xhr' || entry.resourceType === 'fetch') {
        responseBody = await this.withTimeout(
          response.text(),
          NetworkInterceptor.RESPONSE_BODY_TIMEOUT_MS
        );
      }
    } catch {
      responseBody = '[Response body capture unavailable or timed out]';
    }

    entry.endedAt = new Date().toISOString();
    entry.durationMs = this.getDuration(entry.startedAt, entry.endedAt);
    entry.response = {
      status: response.status(),
      statusText: response.statusText(),
      ok: response.ok(),
      headers: await response.allHeaders(),
      body: responseBody
    };
  }

  private getDuration(startedAt: string, endedAt: string) {
    return new Date(endedAt).getTime() - new Date(startedAt).getTime();
  }

  private shouldCapture(request: Request) {
    if (this.captureMode === 'all') {
      return true;
    }

    return NetworkInterceptor.API_RESOURCE_TYPES.has(request.resourceType());
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      this.delay(timeoutMs).then(() => {
        throw new Error('Timed out');
      })
    ]);
  }

  private delay(timeoutMs: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  }
}
