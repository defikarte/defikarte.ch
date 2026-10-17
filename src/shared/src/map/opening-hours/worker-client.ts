import {
  type WorkerRequest,
  type WorkerResponseMessage,
  type WorkerResults,
} from './worker-protocol';

interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

export type OpeningHoursWorker = Pick<OpeningHoursWorkerClient, 'request' | 'terminate'>;

/** Promise based access to the opening hours web worker. */
export class OpeningHoursWorkerClient {
  private readonly worker: Worker;
  private readonly pending = new Map<number, PendingRequest>();
  private nextId = 0;

  public static isSupported() {
    return typeof Worker !== 'undefined';
  }

  constructor() {
    this.worker = new Worker(new URL('./opening-hours.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.addEventListener('message', (event: MessageEvent<WorkerResponseMessage>) => {
      const message = event.data;
      const request = this.pending.get(message.id);
      if (!request) {
        return;
      }

      this.pending.delete(message.id);
      if ('error' in message) {
        request.reject(new Error(message.error));
      } else {
        request.resolve(message.result);
      }
    });

    this.worker.addEventListener('error', event => {
      this.rejectAll(new Error(`Opening hours worker failed: ${event.message}`));
    });
  }

  public request<T extends WorkerRequest['type']>(
    request: Extract<WorkerRequest, { type: T }>
  ): Promise<WorkerResults[T]> {
    const id = this.nextId++;

    return new Promise<WorkerResults[T]>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (result: unknown) => void, reject });
      this.worker.postMessage({ ...request, id });
    });
  }

  public terminate() {
    this.worker.terminate();
    this.rejectAll(new Error('Opening hours worker terminated'));
  }

  private rejectAll(error: Error) {
    this.pending.forEach(request => request.reject(error));
    this.pending.clear();
  }
}
