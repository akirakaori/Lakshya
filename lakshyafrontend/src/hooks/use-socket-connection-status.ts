import { useEffect, useState } from 'react';
import { socketService, type SocketConnectionStatus } from '../services/socket-service';

export const useSocketConnectionStatus = (): SocketConnectionStatus => {
  const [status, setStatus] = useState<SocketConnectionStatus>(socketService.getConnectionStatus());

  useEffect(() => {
    return socketService.subscribeToConnectionStatus(setStatus);
  }, []);

  return status;
};