import { BaseServerConfig } from './models';

export interface ServerConfig extends BaseServerConfig {

  tokenSecret: string;
  tokenExpiration: string;

}
