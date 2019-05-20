import { Service, ServerError } from '../core';
import mongoose from 'mongoose';
import { UserModel } from '../models/user.dbmodel';
import { User } from '../models/user.model';

@Service({
  name: 'mongodb'
})
export class MongodbService {

  constructor() {

    mongoose.connect('mongodb://localhost:27017/pss', { useNewUrlParser: true })
    .then(() => {

      console.log('Connected to MongoDB...');

    })
    .catch(console.log);

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
          admin: admin,
          uid: doc._id
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

        resolve(doc !== null);

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

  public deleteUser(username: string): Promise<void> {

    return new Promise((resolve, reject) => {

      UserModel.findOne({ username: username })
      .then(doc => {

        if ( doc === null ) throw new ServerError('User not found!', 'AUTH_ERROR');

        return doc.remove();

      })
      .then(() => resolve())
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

  public updatePassword(username: string, passwordHash: string): Promise<void> {

    return new Promise((resolve, reject) => {

      UserModel.findOne({ username: username })
      .then(doc => {

        if ( doc === null ) throw new ServerError('User not found!', 'AUTH_ERROR');

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
            admin: doc.get('admin'),
            uid: doc._id
          });

        }

        resolve(users);

      })
      .catch(error => reject(new ServerError(error.message, 'DB_ERROR')));

    });

  }

}
