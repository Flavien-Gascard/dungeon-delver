import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';
import roomRoutes from './routes/rooms';
import uploadRoutes from './routes/upload';
import { registerSocketHandlers } from './socket/index';

const PORT = process.env.PORT ?? 3001;

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*', // tighten in production
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/rooms', roomRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/', (_req, res) => res.json({ status: 'ok', service: 'dungeon-vtt-server' }));

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`dungeon-vtt server running on http://localhost:${PORT}`);
});
