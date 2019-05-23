import { Router, RouteMethod, custom, query, header, body, type, len, and, OnInjection, ServerError, OnConfig } from '../core';
import { ServerConfig } from '../config.model';
import { ProtectedRequest } from '../models/router.model';
import { Request, Response, NextFunction } from 'express';
import { basicAuthValidator, getBasic, passwordHash } from '../validators/auth.validator';
import { MongodbService } from '../services/mongodb.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

@Router({
  name: 'auth',
  routes: [
    { path: '/auth/login', handler: 'login', method: RouteMethod.POST, validate: [
      custom(basicAuthValidator)
    ]},
    { path: '*', handler: 'verifyToken', validate: [
      query(['token'])
    ]},
    { path: '/auth/register', handler: 'register', method: RouteMethod.POST, validate: [
      header({ 'Content-Type': 'application/json' }),
      body({
        username: and(type.string, len.range(6, 32)),
        password: passwordHash,
        admin: type.boolean
      })
    ]},
    { path: '/auth/logout', handler: 'logout', method: RouteMethod.POST },
    { path: '/auth/renew', handler: 'renew', method: RouteMethod.POST },
    { path: '/auth/user', handler: 'delete', method: RouteMethod.DELETE, validate: [
      header({ 'Content-Type': 'application/json' }),
      body({
        username: type.string
      })
    ]},
    { path: '/auth/user', handler: 'updatePassword', method: RouteMethod.PUT, validate: [
      header({ 'Content-Type': 'application/json' }),
      body({
        username: type.string,
        password: passwordHash
      })
    ]},
    { path: '/auth/users', handler: 'listUsers', method: RouteMethod.GET },
    { path: '/auth/user', handler: 'getUser', method: RouteMethod.GET }
  ],
  priority: 100
})
export class AuthRouter implements OnInjection, OnConfig {

  private db: MongodbService;
  private tokenSecret: string;
  private tokenExpiration: string;

  onInjection(services: any) {

    this.db = services.mongodb;

  }

  onConfig(config: ServerConfig) {

    this.tokenExpiration = config.tokenExpiration;
    this.tokenSecret = config.tokenSecret;

  }

  private issueToken(username: string): Promise<string> {

    return new Promise((resolve, reject) => {

      jwt.sign({ username: username }, this.tokenSecret, { expiresIn: this.tokenExpiration }, (error, token) => {

        if ( error ) return reject(error);

        const decoded: any = jwt.decode(token);

        this.db.setIat(username, decoded.iat)
        .then(() => resolve(token))
        .catch(reject);

      });

    });

  }

  login(req: Request, res: Response) {

    const creds = getBasic(req);

    this.db.getPasswordHash(creds.username)
    .then(hash => {

      return bcrypt.compare(creds.password, hash);

    })
    .then(match => {

      if ( ! match ) throw new ServerError('Invalid password!', 'AUTH_ERROR');

      return this.issueToken(creds.username);

    })
    .then(token => res.status(200).json({ token: token }))
    .catch(error => res.status(401).json(error));

  }

  verifyToken(req: ProtectedRequest, res: Response, next: NextFunction) {

    jwt.verify(req.query.token, this.tokenSecret, { maxAge: this.tokenExpiration }, (error, decoded: any) => {

      if ( error ) {

        if ( error instanceof jwt.TokenExpiredError ) res.status(401).json(new ServerError('Token is expired!', 'AUTH_ERROR'));
        else if ( error instanceof jwt.NotBeforeError) res.status(401).json(new ServerError('Token not active!', 'AUTH_ERROR'));
        else res.status(401).json(new ServerError('Invalid token!', 'AUTH_ERROR'));

        return;

      }

      this.db.getIat(decoded.username)
      .then(iat => {

        if ( iat !== decoded.iat ) throw new ServerError('Token is expired!', 'AUTH_ERROR');

        return this.db.isAdmin(decoded.username);

      })
      .then(admin => {

        req.auth = {
          username: decoded.username,
          admin: admin
        };

        next();

      })
      .catch(error => res.status(401).json(error));

    });

  }

  register(req: ProtectedRequest, res: Response) {

    if ( ! req.auth.admin ) return res.status(401).json(new ServerError('User lacks proper permissions to perform this operation!', 'AUTH_ERROR'));

    bcrypt.hash(Buffer.from(req.body.password, 'base64').toString(), 10)
    .then(hash => {

      return this.db.registerUser(req.body.username, hash, req.body.admin);

    })
    .then(() => {

      res.status(200).json({ message: 'User was registered successfully.' });

    })
    .catch(error => res.status(500).json(error));

  }

  logout(req: ProtectedRequest, res: Response) {

    this.db.setIat(req.auth.username, 0)
    .then(() => res.status(200).json({ message: 'User was successfully logged out.' }))
    .catch(error => res.status(500).json(error));

  }

  renew(req: ProtectedRequest, res: Response) {

    this.issueToken(req.auth.username)
    .then(token => res.status(200).json({ token: token }))
    .catch(error => res.status(401).json(error));

  }

  delete(req: ProtectedRequest, res: Response) {

    if ( ! req.auth.admin && req.auth.username !== req.body.username )
      return res.status(401).json(new ServerError('User lacks proper permissions to perform this operation!', 'AUTH_ERROR'));

    this.db.deleteUser(req.body.username)
    .then(() => res.status(200).json({ message: 'User was successfully deleted.' }))
    .catch(error => res.status(500).json(error));

  }

  updatePassword(req: ProtectedRequest, res: Response) {

    if ( ! req.auth.admin ) return res.status(401).json(new ServerError('User lacks proper permissions to perform this operation!', 'AUTH_ERROR'));

    bcrypt.hash(Buffer.from(req.body.password, 'base64').toString(), 10)
    .then(hash => {

      return this.db.updatePassword(req.body.username, hash);

    })
    .then(() => res.status(200).json({ message: 'User password was successfully updated.' }))
    .catch(error => res.status(500).json(error));

  }

  listUsers(req: ProtectedRequest, res: Response) {

    if ( ! req.auth.admin ) return res.status(401).json(new ServerError('User lacks proper permissions to perform this operation!', 'AUTH_ERROR'));

    this.db.listUsers()
    .then(users => res.status(200).json(users))
    .catch(error => res.status(500).json(error));

  }

  getUser(req: ProtectedRequest, res: Response) {

    res.status(200).json({
      username: req.auth.username,
      admin: req.auth.admin
    });

  }

}
