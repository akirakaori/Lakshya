const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const USER_ROOM_PREFIX = 'user:';
let ioInstance = null;

const parseAllowedOrigins = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const getUserRoom = (userId) => `${USER_ROOM_PREFIX}${String(userId)}`;

const extractToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken && typeof authToken === 'string') {
    return authToken;
  }

  const header = socket.handshake.headers?.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }

  return null;
};

const initializeSocket = (httpServer, allowedOrigins = []) => {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    const token = extractToken(socket);
    if (!token) {
      return next(new Error('Unauthorized: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      };
      return next();
    } catch (error) {
      return next(new Error('Unauthorized: Invalid token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = socket.user?.id;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(getUserRoom(userId));

    socket.on('disconnect', () => {
      // No-op hook kept for future debugging/metrics.
    });
  });

  return ioInstance;
};

const getIO = () => ioInstance;

const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId) return false;
  ioInstance.to(getUserRoom(userId)).emit(eventName, payload);
  return true;
};

module.exports = {
  emitToUser,
  getIO,
  getUserRoom,
  initializeSocket,
  parseAllowedOrigins,
};