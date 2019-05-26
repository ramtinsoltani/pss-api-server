import { Service, ServerError } from '../core';
import fs from 'fs-extra';
import path from 'path';
import disk from 'diskusage';
import _ from 'lodash';
import { DirectoryInfo, FileInfo, SearchResult } from '../models/fs.model';
import { Request } from 'express';

@Service({
  name: 'fs'
})
export class FsService {

  private readonly root: string = path.join(process.env.HOME, '.pss-data');

  constructor() {

    fs.ensureDir(this.root)
    .then(() => console.log('Data directory ensured...'))
    .catch(console.log);

  }

  private getAllDirectoryInfos(info: DirectoryInfo): Promise<Array<DirectoryInfo>> {

    let allInfos: DirectoryInfo[] = [];

    return new Promise((resolve, reject) => {

      const promises: Promise<DirectoryInfo>[] = [];

      for ( const child of info.children ) {

        if ( ! child.hasOwnProperty('name') ) continue;

        promises.push(this.getDirInfo(child.path));

      }

      if ( ! promises.length ) return resolve([]);

      Promise.all(promises)
      .then(infos => {

        allInfos = infos;

        const promises: Promise<DirectoryInfo[]>[] = [];

        for ( const info of infos ) {

          promises.push(this.getAllDirectoryInfos(info));

        }

        return Promise.all(promises);

      })
      .then(infosArray => {

        for ( const infos of infosArray ) {

          allInfos = allInfos.concat(infos);

        }

        resolve(allInfos);

      })
      .catch(reject);

    });

  }

  public getFile(filename: string): fs.ReadStream {

    return fs.createReadStream(path.join(this.root, filename));

  }

  public getDirInfo(filename: string): Promise<DirectoryInfo> {

    return new Promise((resolve, reject) => {

      let info: DirectoryInfo = {
        name: path.dirname(filename),
        path: filename,
        children: []
      };

      let filenames = [];

      fs.readdir(path.join(this.root, filename))
      .then(files => {

        const promises: Promise<fs.Stats>[] = [];

        filenames = files;

        for ( const file of files ) {

          promises.push(fs.stat(path.join(this.root, filename, file)));

        }

        return Promise.all(promises);

      })
      .then(stats => {

        for ( let i = 0; i < stats.length; i++ ) {

          const stat = stats[i];

          if ( stat.isFile() ) {

            info.children.push({
              filename: filenames[i],
              path: path.join(filename, filenames[i]),
              size: stat.size,
              modified: stat.mtimeMs,
              created: stat.birthtimeMs
            });

          }
          else if ( stat.isDirectory() ) {

            info.children.push({
              name: filenames[i],
              path: path.join(filename, filenames[i]),
              children: []
            });

          }

        }

        resolve(info);

      })
      .catch(error => reject(new ServerError(error.message, 'FS_ERROR')));

    });

  }

  public getDiskInfo(): Promise<disk.DiskUsage> {

    return disk.check(this.root);

  }

  public isDirectory(filename: string): Promise<boolean> {

    return new Promise((resolve, reject) => {

      fs.stat(path.join(this.root, filename))
      .then(stats => {

        resolve(stats.isDirectory());

      })
      .catch(error => reject(new ServerError(error.message, 'FS_ERROR')));

    });

  }

  public exists(filename: string): boolean {

    return fs.existsSync(path.join(this.root, filename));

  }

  public deletePath(filename: string): Promise<void> {

    return new Promise((resolve, reject) => {

      if ( path.join(this.root, filename) === this.root ) return reject(new ServerError('Cannot delete root!', 'FS_ERROR'));

      fs.remove(path.join(this.root, filename))
      .then(resolve)
      .catch(error => reject(new ServerError(error.message, 'FS_ERROR')));

    });

  }

  public createDirectory(filename: string): Promise<void> {

    return new Promise((resolve, reject) => {

      fs.ensureDir(path.join(this.root, filename))
      .then(resolve)
      .catch(error => reject(new ServerError(error.message, 'FS_ERROR')));

    });

  }

  public writeFile(filename: string, req: Request): Promise<void> {

    return new Promise((resolve, reject) => {

      fs.ensureFile(path.join(this.root, filename))
      .then(() => {

        const stream = fs.createWriteStream(path.join(this.root, filename));

        if ( typeof req.body === 'object' && req.body !== null && req.body.constructor === Buffer ) {

          stream.end(req.body);

        }
        else {

          req.pipe(stream);

        }

        stream
        .on('finish', () => {

          resolve();

        })
        .on('error', error => {

          reject(new ServerError(error.message, 'FS_ERROR'));

        });

      })
      .catch(error => reject(new ServerError(error.message, 'FS_ERROR')));

    });

  }

  public search(query: string): Promise<Array<SearchResult>> {

    return new Promise((resolve, reject) => {

      let infos: DirectoryInfo[] = [];
      const results: SearchResult[] = [];

      this.getDirInfo('/')
      .then(info => {

        infos.push(info);

        return this.getAllDirectoryInfos(info);

      })
      .then(all => {

        infos = infos.concat(all);

        for ( const info of infos ) {

          for ( const child of info.children ) {

            if ( child.hasOwnProperty('name') ) {

              results.push({
                directory: true,
                name: (<DirectoryInfo>child).name,
                path: child.path
              });

            }
            else {

              results.push({
                directory: false,
                name: (<FileInfo>child).filename,
                path: child.path
              });

            }

          }

        }

        resolve(_.filter(results, item => item.name.includes(query)));

      })
      .catch(reject);

    });

  }

}
