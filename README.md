# Personal Shared Storage API Server

This server exposes an API to use the hosting Linux system as a cloud storage.

# Installation

  1. Install Node JS and NPM
  2. Install MongoDB and have it running on the default port (27017)
  3. Run `sudo npm install`
  4. Add the first admin manually by running `sudo node add-admin username:password`
  5. Start the server `sudo npm start`

# Endpoints

| Endpoint | Protected | Query | Body | Description |
|:---------|:----------|:-----:|:----:|:------------|
| GET /health | No | `token` | | Responds if the server is running. |
| POST /auth/login | No | `token` | | Logs in the user through basic auth and returns the token. |
| POST /auth/register | Yes | `token` | `username` `password` `admin` | Registers a new user if the current logged in user is an admin. The password must be encoded in base64. |
| POST /auth/logout | Yes | `token` | | Logs the current user out. |
| POST /auth/renew | Yes | `token` | | Renews the token for another 24 hours and returns the renewed token. |
| DELETE /auth/user | Yes | `token` | `username` | Deletes the given username if the current logged in user is an admin. |
| PUT /auth/user | Yes | `token` | `username` `password` | Updates the password of the given username if the current logged in user is an admin. The password must be encoded in base64. |
