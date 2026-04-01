import { io, type Socket } from 'socket.io-client';

const DEFAULT_SOCKET_URL = 'http://localhost:3000';
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) || DEFAULT_SOCKET_URL;

export type SocketConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private connectionStatus: SocketConnectionStatus = 'disconnected';
  private statusSubscribers = new Set<(status: SocketConnectionStatus) => void>();

  private setConnectionStatus(status: SocketConnectionStatus): void {
    if (this.connectionStatus === status) return;

    this.connectionStatus = status;
    this.statusSubscribers.forEach((subscriber) => subscriber(status));
  }

  private attachSocketListeners(socket: Socket): void {
    socket.on('connect', () => {
      this.setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      this.setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      this.setConnectionStatus('reconnecting');
    });

    socket.io.on('reconnect_attempt', () => {
      this.setConnectionStatus('reconnecting');
    });

    socket.io.on('reconnect', () => {
      this.setConnectionStatus('connected');
    });

    socket.io.on('reconnect_failed', () => {
      this.setConnectionStatus('disconnected');
    });
  }

  connect(token: string, userId: string): Socket {
    if (
      this.socket &&
      this.currentUserId === userId &&
      (this.socket.connected || this.socket.active)
    ) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentUserId = userId;
    this.setConnectionStatus('reconnecting');
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    this.attachSocketListeners(this.socket);

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getConnectionStatus(): SocketConnectionStatus {
    return this.connectionStatus;
  }

  subscribeToConnectionStatus(subscriber: (status: SocketConnectionStatus) => void): () => void {
    this.statusSubscribers.add(subscriber);
    subscriber(this.connectionStatus);

    return () => {
      this.statusSubscribers.delete(subscriber);
    };
  }

  disconnect(): void {
    if (!this.socket) return;

    this.socket.disconnect();
    this.socket = null;
    this.currentUserId = null;
    this.setConnectionStatus('disconnected');
  }
}

export const socketService = new SocketService();