export interface DirectoryInfo {

  name: string;
  path: string;
  children: Array<DirectoryInfo|FileInfo>;

}

export interface FileInfo {

  filename: string;
  path: string;
  size: number;
  created: number;
  modified: number;

}
