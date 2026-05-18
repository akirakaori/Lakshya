const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const USER_ROOM_PREFIX = 'user:';
const RECRUITER_ROOM_PREFIX = 'recruiter:';
const JOB_ROOM_PREFIX = 'job:';
const APPLICATION_ROOM_PREFIX = 'application:';
let ioInstance = null;

const parseAllowedOrigins = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const getUserRoom = (userId) => `${USER_ROOM_PREFIX}${String(userId)}`;
const getRecruiterRoom = (recruiterId) => `${RECRUITER_ROOM_PREFIX}${String(recruiterId)}`;
const getJobRoom = (jobId) => `${JOB_ROOM_PREFIX}${String(jobId)}`;
const getApplicationRoom = (applicationId) => `${APPLICATION_ROOM_PREFIX}${String(applicationId)}`;

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
    if (socket.user?.role === 'recruiter') {
      socket.join(getRecruiterRoom(userId));
    }

    socket.on('room:join', (payload = {}) => {
      const { type, id } = payload;
      if (!id || typeof id !== 'string') return;

      if (type === 'job') {
        socket.join(getJobRoom(id));
      } else if (type === 'application') {
        socket.join(getApplicationRoom(id));
      }
    });

    socket.on('room:leave', (payload = {}) => {
      const { type, id } = payload;
      if (!id || typeof id !== 'string') return;

      if (type === 'job') {
        socket.leave(getJobRoom(id));
      } else if (type === 'application') {
        socket.leave(getApplicationRoom(id));
      }
    });

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

const emitToRoom = (roomName, eventName, payload) => {
  if (!ioInstance || !roomName) return false;
  ioInstance.to(roomName).emit(eventName, payload);
  return true;
};

const emitToAll = (eventName, payload) => {
  if (!ioInstance) return false;
  ioInstance.emit(eventName, payload);
  return true;
};

module.exports = {
  emitToUser,
  emitToRoom,
  emitToAll,
  getIO,
  getUserRoom,
  getRecruiterRoom,
  getJobRoom,
  getApplicationRoom,
  initializeSocket,
  parseAllowedOrigins,
};
