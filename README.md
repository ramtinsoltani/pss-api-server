# Personal Shared Storage API Server

This server exposes an API to use the hosting Linux system as a cloud storage.

# Installation

  1. Install Node JS and NPM
  2. Install MongoDB and have it running on the default port (27017)
  3. Run `sudo npm install`
  4. Add the first admin manually by running `sudo node add-admin username:password`
  5. Start the server `sudo npm start`

# Endpoints

| Endpoint | Protected | Query | Body Properties | Response | Description |
|:---------|:----------|:-----:|:----:|:--------:|:------------|
| GET /health | No | | | [Health Response](#health-response) | Responds if the server is running. |
| POST /auth/login | No | | | [Token Response](#token-response) | Logs in the user through basic auth and returns the token. |
| POST /auth/register | Yes | `token` | `username:string` `password:base64` `admin:boolean` | [Message Response](#message-response) | Registers a new user if the current logged in user is an admin. The password must be encoded in base64. |
| POST /auth/logout | Yes | `token` | | [Message Response](#message-response) | Logs the current user out. |
| POST /auth/renew | Yes | `token` | | [Token Response](#token-response) | Renews the token for another 24 hours and returns the renewed token. |
| DELETE /auth/user | Yes | `token` | `username:string` | [Message Response](#message-response) | Deletes the given username if the current logged in user is an admin. |
| PUT /auth/user | Yes | `token` | `username:string` `password:base64` | [Message Response](#message-response) | Updates the password of the given username if the current logged in user is an admin. The password must be encoded in base64. |
| GET /auth/users | Yes | `token` | | [Users List Response](#users-list-response) | Lists all users if the current logged in user is an admin. |
| GET /space | Yes |`token` | | [Disk Info Response](#disk-info-response) | Returns the disk space information. |
| GET /fs/* | Yes |`token` | | [Directory Info Response](#directory-info-response) or binary | Returns the directory info or the file content. |
| DELETE /fs/* | Yes |`token` | | [Message Response](#message-response) | Deletes the given path (directory deletion happens recursively). Keep in mind that the root directory cannot be deleted. |
| POST /fs/* | Yes |`token` `dir` | | [Message Response](#message-response) | If the `dir` query parameter is present then a directory will be created at the given path, otherwise, the body of the request will be saved as the file content at the given path (the headers `Content-Type: application/octet-stream` and `File-Length` must be present for file upload.) |
| GET /search | Yes |`token` `query` | | [Search Result Response](#search-result-response) | Searches for the given query in the file system and returns the matching filenames or directory names. |

# Response Models

## Message Response

```json
{
  "message": "string"
}
```

## Error Response

```json
{
  "error": true,
  "message": "string",
  "code": "string"
}
```

## Health Response

```json
{
  "running": true
}
```

## Token Response

```json
{
  "token": "string"
}
```

## Users List Response

```json
[
  {
    "username": "string",
    "admin": false,
    "uid": "string"
  }
]
```

## Disk Info Response

```json
{
  "total": 0,
  "free": 0
}
```

## Directory Info Response

```json
{
  "name": "string",
  "path": "string",
  "children": []
}
```

Children can be directory info and/or [file info](#file-info-response).

## File Info Response

```json
{
  "filename": "string",
  "path": "string",
  "size": "string",
  "created": "string",
  "modified": "string"
}
```

## Search Result Response
```json
[
  {
    "directory": false,
    "name": "string",
    "path": "string"
  }
]
```
