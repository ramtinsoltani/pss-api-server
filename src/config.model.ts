import { BaseServerConfig } from './models';

export interface ServerConfig extends BaseServerConfig {

  tokenSecret: string;
  tokenExpiration: string;
  uploadSizeLimit: number; // In GB
  accessCodeExpiration: number; // In milliseconds

}
