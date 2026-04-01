# Phase 2 API Contract (Social Features)

Last updated: 2026-04-01

## 1. Comments

### POST /api/comments
- Auth: required (`Bearer`)
- Body:
```json
{
  "artworkId": "<ObjectId>",
  "content": "comment text"
}
```
- Success: `201` with created comment populated user fields.

### GET /api/comments?artworkId=<id>&page=1&limit=20
- Auth: optional
- Success: `200`
```json
{
  "comments": [],
  "total": 0,
  "page": 1,
  "pages": 0
}
```

### DELETE /api/comments/:id
- Auth: required (owner or admin)
- Success: `200` with message.

## 2. Bookmarks

### POST /api/bookmarks
- Auth: required
- Body:
```json
{
  "artworkId": "<ObjectId>",
  "folder": "default"
}
```
- Success: `201` with populated bookmark.
- Error: duplicate bookmark => `400`.

### GET /api/bookmarks?page=1&limit=20
- Auth: required
- Success: `200` paginated bookmarks.

### DELETE /api/bookmarks/:id
- Auth: required (owner or admin)
- Success: `200` with message.

## 3. Feed and Rankings

### GET /api/feed?page=1&limit=20
- Auth: required
- Success: `200`
```json
{
  "artworks": [],
  "total": 0,
  "page": 1,
  "pages": 0
}
```

### GET /api/feed/rankings?period=daily|weekly|monthly&limit=20
- Auth: optional
- Success: `200`
```json
{
  "period": "daily",
  "artworks": []
}
```

## 4. DB considerations
- `comments` indexes:
  - `{ artwork: 1, createdAt: -1 }`
  - `{ user: 1, createdAt: -1 }`
- `bookmarks` indexes:
  - unique `{ user: 1, artwork: 1 }`
  - `{ user: 1, createdAt: -1 }`
- `artworks` denormalized counters used:
  - `bookmarkCount`, `commentCount`, `likeCount`, `viewCount`
