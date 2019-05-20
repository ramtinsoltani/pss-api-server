import { Router, RouteMethod, ServerError, ServerConfig, OnInjection, OnConfig, header, custom, query } from '../core';
import { ProtectedRequest } from '../models/router.model';
import { Response } from 'express';
import { FsService } from '../services/fs.service';

@Router({
  name: 'storage',
  priority: 99,
  routes: [
    { path: '/space', handler: 'space', method: RouteMethod.GET },
    { path: '/fs/*', handler: 'getPath', method: RouteMethod.GET },
    { path: '/fs/*', handler: 'deletePath', method: RouteMethod.DELETE },
    { path: '/fs/*', handler: 'createPath', method: RouteMethod.POST, validate: [
      header({ 'Content-Type': 'application/octet-stream' }),
      custom((req => req.headers.hasOwnProperty('content-length')))
    ]},
    { path: '/search', handler: 'search', method: RouteMethod.GET, validate: [
      query(['query'])
    ]}
  ]
})
export class StorageRouter implements OnInjection, OnConfig {

  private fs: FsService;
  private uploadSizeLimit: number;

  onInjection(services: any) {

    this.fs = services.fs;

  }

  onConfig(config: ServerConfig) {

    this.uploadSizeLimit = config.uploadSizeLimit * 1024 * 1024 * 1024;

  }

  space(req: ProtectedRequest, res: Response) {

    this.fs.getDiskInfo()
    .then(info => {

      res.status(200).json({ total: info.total, free: info.available })

    })
    .catch(error => res.status(500).json(new ServerError(error.message, 'DISK_ERROR')))

  }

  getPath(req: ProtectedRequest, res: Response) {

    const filename = req.path.substr(3);

    if ( ! this.fs.exists(filename) ) return res.status(400).json(new ServerError('Path not found!', 'FS_ERROR'));

    this.fs.isDirectory(filename)
    .then(dir => {

      if ( dir ) {

        this.fs.getDirInfo(filename)
        .then(info => res.status(200).json(info))
        .catch(error => res.status(400).json(error));

      }
      else {

        this.fs.getFile(filename)
        .pipe(res)
        .on('error', console.log);

      }

    })
    .catch(error => res.status(400).json(error));

  }

  deletePath(req: ProtectedRequest, res: Response) {

    const filename = req.path.substr(3);

    if ( filename.trim() === '/' ) return res.status(400).json(new ServerError('Cannot delete root!', 'FS_ERROR'));

    if ( ! this.fs.exists(filename) ) return res.status(400).json(new ServerError('Path not found!', 'FS_ERROR'));

    this.fs.deletePath(filename)
    .then(() => res.status(200).json({ message: 'Path was successfully deleted.' }))
    .catch(error => res.status(400).json(error));

  }

  createPath(req: ProtectedRequest, res: Response) {

    const filename = req.path.substr(3);
    const dir: boolean = !! req.query.dir;

    if ( dir ) {

      this.fs.createDirectory(filename)
      .then(() => res.status(200).json({ message: 'Directory created.' }))
      .catch(error => res.status(400).json(error));

    }
    else {

      if ( parseInt(req.get('content-length')) > this.uploadSizeLimit ) return res.status(400).json(new ServerError('File size exceeds the maximum allowed limit!', 'FS_ERROR'));

      this.fs.getDiskInfo()
      .then(info => {

        if ( parseInt(req.get('content-length')) > info.available ) throw new ServerError('File size exceeds the available disk space!', 'FS_ERROR');

        return this.fs.writeFile(filename, req);

      })
      .then(() => res.status(200).json({ message: 'File was successfully uploaded.' }))
      .catch(error => res.status(400).json(error));

    }

  }

  search(req: ProtectedRequest, res: Response) {

    this.fs.search(req.query.query)
    .then(infos => res.status(200).json(infos))
    .catch(error => res.status(500).json(new ServerError(error.message, 'FS_ERROR')));

  }

}
