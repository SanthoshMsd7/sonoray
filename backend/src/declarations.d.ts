declare module 'express';
declare module 'cors';
declare module 'helmet';
declare module 'dotenv';
declare module 'socket.io';
declare module '@prisma/client';
declare module 'bcryptjs';
declare module 'path';

declare var __dirname: string;

declare namespace NodeJS {
  interface Process {
    env: ProcessEnv;
  }
  interface ProcessEnv {
    PORT?: string;
    ALLOWED_ORIGINS?: string;
    JWT_SECRET?: string;
    DATABASE_URL?: string;
    [key: string]: string | undefined;
  }
}
declare var process: NodeJS.Process;
