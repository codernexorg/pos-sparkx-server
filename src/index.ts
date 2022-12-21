import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import config from './config';
import errorMiddleware from './middleware/err';
import { commonAuth, isAuth } from './middleware/isAuth';
import authRoute from './routes/auth';
import barcodeRoutes from './routes/barcode';
import productRoutes from './routes/product';
import showroomRoutes from './routes/showroom';
import supplierRoutes from './routes/supplier';
import userRouter from './routes/user';
import warehouseRoutes from './routes/warehouse';
import dataSource from './typeorm.config';
const server = async (app: Application) => {
  app.use(
    cors({
      credentials: true,
      origin: 'http://localhost:3000'
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  await dataSource.initialize();

  app.get('/', async (req: Request, res: Response) => {
    const serverInfo = {
      protocol: req.protocol,
      host: req.hostname
    };

    const userInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    res.status(200).json({ serverInfo, userInfo });
  });

  app.use('/api/v1/user', userRouter);
  app.use('/api/v1/auth', authRoute);
  // app.use('/api/v1/customer')
  app.use('/api/v1/product', isAuth, commonAuth, productRoutes);
  // app.use('/api/v1/purchase')

  app.use('/api/v1/supplier', isAuth, commonAuth, supplierRoutes);

  app.use('/api/v1/warehouse', isAuth, commonAuth, warehouseRoutes);
  app.use('/api/v1/showroom', isAuth, commonAuth, showroomRoutes);

  app.use('/api/v1/barcode', isAuth, commonAuth, barcodeRoutes);

  app.use(errorMiddleware);
  app.listen(config.PORT, () => {
    console.log(`Development Server Started on PORT: ${config.PORT}`);
  });
};

server(express());
