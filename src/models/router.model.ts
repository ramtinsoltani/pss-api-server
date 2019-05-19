import { Request } from 'express';

export interface ProtectedRequest extends Request {

  auth: Auth;

}

export interface Auth {

  username: string;
  admin: boolean;

}
