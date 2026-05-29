# NeuroSound API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
Protected routes require a JWT token in the Authorization header:
`Authorization: Bearer <your_access_token>`

---

## Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Register a new user |
| POST | /auth/login | No | Login and get tokens |
| POST | /auth/refresh | No | Get new access token |
| POST | /auth/logout | No | Logout and clear cookie |
| GET | /auth/me | Yes | Get current user profile |

---

## Songs Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /songs | No | Get all songs (paginated) |
| GET | /songs/:id | No | Get one song |
| POST | /songs | Yes | Upload a song (form-data) |
| PUT | /songs/:id | Yes | Update a song |
| DELETE | /songs/:id | Yes | Delete a song |

### Query Params for GET /songs
- `page` — page number (default: 1)
- `limit` — songs per page (default: 10)

Example: `/api/songs?page=2&limit=5`

---

## Artists Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /artists | No | Get all artists |
| GET | /artists/:id | No | Get artist + their songs + albums |
| POST | /artists | Yes | Create artist (form-data) |
| PUT | /artists/:id | Yes | Update artist |
| DELETE | /artists/:id | Yes | Delete artist |

---

## Albums Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /albums | No | Get all albums |
| GET | /albums/:id | No | Get album + its songs |
| POST | /albums | Yes | Create album (form-data) |
| PUT | /albums/:id | Yes | Update album |
| DELETE | /albums/:id | Yes | Delete album |

---

## Playlists Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /playlists | Yes | Get user's playlists |
| GET | /playlists/:id | Yes | Get playlist + its songs |
| POST | /playlists | Yes | Create playlist |
| PUT | /playlists/:id | Yes | Update playlist |
| DELETE | /playlists/:id | Yes | Delete playlist |
| POST | /playlists/:id/songs | Yes | Add song to playlist |
| DELETE | /playlists/:id/songs/:songId | Yes | Remove song from playlist |

---

## Liked Songs Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /liked-songs | Yes | Get all liked songs |
| POST | /liked-songs/:songId | Yes | Like a song |
| DELETE | /liked-songs/:songId | Yes | Unlike a song |
| GET | /liked-songs/:songId/check | Yes | Check if song is liked |
| POST | /liked-songs/:songId/toggle | Yes | Toggle like/unlike |

---

## Search Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /search?q=term | No | Search songs + artists + albums |
| GET | /search/songs?q=term | No | Search songs only |
| GET | /search/artists?q=term | No | Search artists only |

---

## HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (invalid input) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (logged in but not allowed) |
| 404 | Not found |
| 500 | Server error |