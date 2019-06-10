import { Service, ServerError, OnConfig, ServerConfig } from '../core';
import mongoose from 'mongoose';
import { UserModel } from '../models/user.dbmodel';
import { User } from '../models/user.model';

@Service({
  name: 'mongodb'
})
export class MongodbService implements OnConfig {

  private accessCodeExpiration: number = 300000; // Default

  constructor() {

    mongoose.connect('mongodb://localhost:27017/pss', { useNewUrlParser: true })
    .then(() => {

      console.log('Connected to MongoDB...');

    })
    .catch(console.log);

  }

  public onConfig(config: ServerConfig): void {

    this.accessCodeExpiration = config.accessCodeExpiration;

  }

  private generateAccessCode(): string {

    const charset: string = 'qwertyuiopasdfghjklzxcvbnm1234567890';
    let code: string = '';

    for ( let i = 0; i < 6; i++ ) {

      code += charset[Math.floor(Math.random() * charset.length)];

    }

    return code;

  }

  public registerUser(username: string, passwordHash: string, admin: boolean, iat?: number): Promise<User> {

    return new Promise((resolve, reject) => {

      const user = new UserModel({
        username: username,
        password: passwordHash,
        admin: admin,
        iat: iat || 0
      });

      user.save()
      .then(doc => {

        resolve({
          username: username,
          admin: admin
        });

      })
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public getPasswordHash(username: string): Promise<string> {

    return new Promise((resolve, reject) => {

      UserModel.findOne({ username: username })
      .then(doc => {

        if ( doc === null ) throw new ServerError('User not found!', 'AUTH_ERROR');

        resolve(doc.get('password'));

      })
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public isUsernameFree(username: string): Promise<boolean> {

    return new Promise((resolve, reject) => {

      UserModel.findOne({ username: username })
      .then(doc => {

        resolve(doc === null);

      })
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public getIat(username: string): Promise<number> {

    return new Promise((resolve, reject) => {

      UserModel.findOne({ username: username })
      .then(doc => {

        if ( doc === null ) throw new ServerError('User not found!', 'AUTH_ERROR');

        resolve(doc.get('iat'));

      })
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public setIat(username: string, iat: number): Promise<void> {

    return new Promise((resolve, reject) => {

      UserModel.findOne({ username: username })
      .then(doc => {

        if ( doc === null ) throw new ServerError('User not found!', 'AUTH_ERROR');

        return doc.updateOne({ iat: iat });

      })
      .then(resolve)
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public deleteUser(username: string, force: boolean): Promise<void> {

    return new Promise((resolve, reject) => {

      UserModel.findOne({ username: username })
      .then(doc => {

        if ( doc === null ) throw new ServerError('User not found!', 'AUTH_ERROR');
        if ( doc.get('admin') && ! force ) throw new ServerError('Admins cannot be deleted!', 'PERMISSION_ERROR');

        return doc.remove();

      })
      .then(() => resolve())
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public createTempAccessCode(username: string): Promise<string> {

    return new Promise((resolve, reject) => {

      const code = this.generateAccessCode();

      UserModel.findOne({ username: username })
      .then(doc => {

        if ( doc === null ) throw new ServerError('User not found!', 'AUTH_ERROR');

        return doc.updateOne({ accessCode: code, accessCodeIat: Date.now() });

      })
      .then(() => resolve(code))
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public updatePassword(username: string, passwordHash: string, code: string): Promise<void> {

    return new Promise((resolve, reject) => {

      UserModel.findOne({ username: username })
      .then(doc => {

        if ( doc === null ) throw new ServerError('User not found!', 'AUTH_ERROR');
        if ( doc.get('accessCode') !== code.toLowerCase() ) throw new ServerError('Invalid access code!', 'AUTH_ERROR');
        if ( Date.now() - doc.get('accessCodeIat') > this.accessCodeExpiration ) throw new ServerError('Access code is expired!', 'AUTH_ERROR');

        return doc.updateOne({ password: passwordHash });

      })
      .then(resolve)
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public getUid(username: string): Promise<string> {

    return new Promise((resolve, reject) => {

      UserModel.findOne({ username: username })
      .then(doc => {

        if ( doc === null ) throw new ServerError('User not found!', 'AUTH_ERROR');

        resolve(doc._id);

      })
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public isAdmin(username: string): Promise<boolean> {

    return new Promise((resolve, reject) => {

      UserModel.findOne({ username: username })
      .then(doc => {

        if ( doc === null ) throw new ServerError('User not found!', 'AUTH_ERROR');

        resolve(doc.get('admin'));

      })
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public listUsers(): Promise<User[]> {

    return new Promise((resolve, reject) => {

      UserModel.find({})
      .then(docs => {

        const users: User[] = [];

        for ( const doc of docs ) {

          users.push({
            username: doc.get('username'),
            admin: doc.get('admin')
          });

        }

        resolve(users);

      })
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public promoteUser(username: string): Promise<void> {

    return new Promise((resolve, reject) => {

      UserModel.findOne({ username: username })
      .then(doc => {

        if ( doc === null ) throw new ServerError('User not found!', 'AUTH_ERROR');
        if ( doc.get('admin') ) throw new ServerError('User is already an admin!', 'PERMISSION_ERROR');

        return doc.updateOne({ admin: true });

      })
      .then(resolve)
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

}
