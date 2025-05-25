import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();
let app: any;

async function createNestServer(expressInstance: express.Express) {
  app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
    { logger: ['error', 'warn'] }
  );

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://estoque-gestor-v2-frontend.vercel.app',
      /^https:\/\/.*\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async (req: any, res: any) => {
  if (!app) {
    await createNestServer(server);
  }
  server(req, res);
};