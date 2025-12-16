import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class LoggerService implements OnApplicationShutdown {
  private _connections = new Set<string>();
  private _emitter = new EventEmitter();
  private _awaitingShutdown = false;

  onApplicationShutdown = async () => {
    this._awaitingShutdown = true;
    if (this._connections.size > 0) {
      await new Promise((resolve) => this._emitter.on('shutdown', resolve));
    }
  };

  addRequest = (): string => {
    const uuid = crypto.randomUUID();
    this._connections.add(uuid);
    return uuid;
  };

  removeRequest = (uuid: string) => {
    this._connections.delete(uuid);

    if (this._connections.size === 0 && this._awaitingShutdown) {
      this._emitter.emit('shutdown');
    }
  };
}
