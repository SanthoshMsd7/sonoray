import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

dotenv.config();

import authRouter from './routes/auth';
import employeeRouter from './routes/employee';
import trackingRouter from './routes/tracking';
import chatRouter from './routes/chat';
import stockRouter from './routes/stock';
import attendanceRouter from './routes/attendance';
import departmentRouter from './routes/department';
import leaveRouter from './routes/leave';
import dashboardRouter from './routes/dashboard';
import machineRouter from './routes/machine';
import hospitalRouter from './routes/hospital';
import serviceRouter from './routes/service';
import socialRouter from './routes/social';
import ticketRouter from './routes/ticket';
import uploadRouter from './routes/upload';
import path from 'path';

const app = express();
const port = process.env.PORT || 5000;
const prisma = new PrismaClient();

app.set('trust proxy', 1); // Trust Cloudflare Tunnel proxy
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || 
        allowedOrigins.some(o => origin.startsWith(o)) ||
        origin.includes('trycloudflare.com') || 
        origin.includes('localhost') || 
        origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/chat', chatRouter);
app.use('/api/stock', stockRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/departments', departmentRouter);
app.use('/api/leaves', leaveRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/machines', machineRouter);
app.use('/api/hospitals', hospitalRouter);
app.use('/api/service', serviceRouter);
app.use('/api/social', socialRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/upload', uploadRouter);

app.get('/', (req, res) => {
  res.send('Sonoray ERP Backend is running! Use /health for status.');
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Register socket to a private room
  socket.on('register', (data) => {
    if (data.employeeId) {
      socket.join(`user_${data.employeeId}`);
      console.log(`Socket ${socket.id} joined room user_${data.employeeId}`);
    }
  });

  socket.on('updateLocation', (data) => {
    socket.broadcast.emit('employeeLocationUpdate', data);
  });

  socket.on('requestLocationRefresh', (data) => {
    const { employeeId } = data;
    if (employeeId) {
      console.log(`Admin requested location refresh for employee: ${employeeId}`);
      io.to(`user_${employeeId}`).emit('forceLocationUpdate');
    }
  });

  socket.on('privateMessage', async (data) => {
    const { senderId, receiverId, content } = data;
    try {
      // Save to database
      const msg = await prisma.message.create({
        data: {
          senderId,
          receiverId,
          content
        }
      });
      // Emit to receiver
      console.log(`Sending message from ${senderId} to user_${receiverId}`);
      io.to(`user_${receiverId}`).emit('newMessage', msg);
      // Emit back to sender so they know it sent successfully
      socket.emit('messageSent', msg);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
