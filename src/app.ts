import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';
import uploadRouter from './routes/upload.router';
import { socketAuthMiddleware } from './middlewares/socketAuth';
import { setupSocketIO } from './socket/chat.socket';
import path from 'path';

dotenv.config();

const app = express();
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(express.json());

// Socket Middleware
io.use(socketAuthMiddleware);
setupSocketIO(io);


app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



app.use('/api/chat', uploadRouter);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.io server listening on port ${PORT}`);
});