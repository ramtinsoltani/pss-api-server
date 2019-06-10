import { Request } from 'express';

export function basicAuthValidator(req: Request): boolean {

  return /^Basic (.+)$/.test(req.get('Authorization'));

}

export function getBasic(req: Request): BasicAuthCredentials {

  const encoded = req.get('Authorization').match(/^Basic (.+)$/)[1];
  const decoded = Buffer.from(encoded, 'base64').toString();

  return {
    username: decoded.substr(0, decoded.indexOf(':')),
    password: decoded.substr(decoded.indexOf(':') + 1)
  };

}

export interface BasicAuthCredentials {

  username: string;
  password: string;

}

export function passwordHash(value: string): boolean {

  if ( typeof value !== 'string' ) return false;

  const password = Buffer.from(value, 'base64').toString();

  return password.length > 8 && password.length < 64 && /[a-z]+/i.test(password) && /[0-9]+/.test(password);

}
