import { Router, RouteMethod } from '../core';
import { Request, Response } from 'express';

@Router({
  name: 'storage',
  routes: [
    { path: '/health', method: RouteMethod.GET, handler: 'health' }
  ]
})
export class StorageRouter {

  health(req: Request, res: Response) {

    res.status(200).send('SERVER RUNNING');

  }

}
