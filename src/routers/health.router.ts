import { Router, RouteMethod } from '../core';
import { Request, Response } from 'express';

@Router({
  name: 'health',
  routes: [
    { path: '/health', method: RouteMethod.GET, handler: 'health' }
  ],
  priority: 101
})
export class StorageRouter {

  health(req: Request, res: Response) {

    res.status(200).json({ running: true });

  }

}
