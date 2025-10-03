// Simple Socket.IO signaling server for WebRTC
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-call', ({ callId, userId }) => {
    socket.join(callId);
    socket.to(callId).emit('user-joined', { userId });
  });

  socket.on('signal', ({ callId, from, to, data }) => {
    socket.to(callId).emit('signal', { from, to, data });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
