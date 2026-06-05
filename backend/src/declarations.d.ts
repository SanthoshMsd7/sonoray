declare module 'express' {
  export interface Request {
    body: any;
    params: any;
    query: any;
    user?: any;
    app: any;
    [key: string]: any;
  }
  
  export interface Response {
    status(code: number): this;
    send(body: any): this;
    json(body: any): this;
    sendStatus(code: number): this;
    [key: string]: any;
  }
  
  export interface NextFunction {
    (err?: any): void;
  }
  
  export interface Router {
    get(path: string, ...handlers: any[]): this;
    post(path: string, ...handlers: any[]): this;
    put(path: string, ...handlers: any[]): this;
    patch(path: string, ...handlers: any[]): this;
    delete(path: string, ...handlers: any[]): this;
    use(...handlers: any[]): this;
  }
  
  export function Router(): Router;
  
  interface Express {
    use(...handlers: any[]): this;
    listen(port: number | string, callback?: () => void): any;
    [key: string]: any;
  }
  
  function express(): Express;
  export default express;
}
declare module 'cors';
declare module 'helmet';
declare module 'dotenv';
declare module 'socket.io';
declare module '@prisma/client';
declare module 'bcryptjs';
declare module 'path';
declare module 'http';
declare module 'https';

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
