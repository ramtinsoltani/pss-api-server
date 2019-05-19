import { Router, RouteMethod } from '../core';
import { ProtectedRequest } from '../models/router.model';
import { Response } from 'express';

@Router({
  name: 'storage',
  priority: 99,
  routes: [
    { path: '/test', handler: 'test', method: RouteMethod.GET }
  ]
})
export class StorageRouter {

  test(req: ProtectedRequest, res: Response) {

    res.status(200).json({ message: `${req.auth.admin ? 'Admin' : 'User'} ${req.auth.username} have accessed this route.` });

  }

}
