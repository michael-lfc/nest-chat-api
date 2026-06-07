# Chat API

A Real-Time Chat API built with NestJS, WebSockets, Redis, Bull Queue, and PostgreSQL. Features JWT authentication, real-time messaging, room management, Redis caching, background email notifications via Bull Queue, and Prisma ORM.

---

## Tech Stack

- **Framework** — NestJS
- **Language** — TypeScript
- **Database** — PostgreSQL
- **ORM** — Prisma v6
- **Real-Time** — WebSockets (Socket.io)
- **Caching** — Redis (ioredis)
- **Queue** — Bull Queue
- **Authentication** — JWT (JSON Web Tokens)
- **Password Hashing** — bcrypt
- **Validation** — class-validator, class-transformer
- **Email** — Nodemailer + @nestjs-modules/mailer

---

## Features

- User registration and login with JWT authentication
- Create and join chat rooms
- Real-time messaging with WebSockets (Socket.io)
- Redis caching for rooms and messages
- Background email notifications via Bull Queue when a user receives a message
- Cache invalidation on new messages and room joins
- Consistent error handling across all endpoints

---

## Project Structure

```
chat-api/
├── src/
│   ├── auth/
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   └── login.dto.ts
│   │   ├── guards/
│   │   │   └── jwt.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── decorators/
│   │   │   └── get-user.decorator.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── rooms/
│   │   ├── dto/
│   │   │   └── create-room.dto.ts
│   │   ├── rooms.controller.ts
│   │   ├── rooms.module.ts
│   │   └── rooms.service.ts
│   ├── chat/
│   │   ├── dto/
│   │   │   └── create-message.dto.ts
│   │   ├── chat.gateway.ts
│   │   ├── chat.module.ts
│   │   └── chat.service.ts
│   ├── mail/
│   │   ├── mail.module.ts
│   │   ├── mail.service.ts
│   │   └── mail.processor.ts
│   ├── redis/
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── .env.example
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL
- Redis
- npm
- A Gmail account with App Password enabled

### Installation

1. Clone the repository

```bash
git clone https://github.com/michael-lfc/nest-chat-api.git
cd nest-chat-api
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
```

Update `.env` with your values:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/chat_db"
JWT_SECRET="yourjwtsecret"
REDIS_HOST="localhost"
REDIS_PORT=6379
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="youremail@gmail.com"
MAIL_PASS="yourgoogleapppassword"
MAIL_FROM="youremail@gmail.com"
```

4. Run database migrations

```bash
npx prisma migrate dev
```

5. Start Redis server

```bash
redis-server
```

6. Start the development server

```bash
npm run start:dev
```

The API will be running at `http://localhost:3000`

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `REDIS_HOST` | Redis server host (localhost for local) |
| `REDIS_PORT` | Redis server port (default: 6379) |
| `MAIL_HOST` | SMTP host (smtp.gmail.com for Gmail) |
| `MAIL_PORT` | SMTP port (587 for Gmail) |
| `MAIL_USER` | Gmail address used to send emails |
| `MAIL_PASS` | Google App Password |
| `MAIL_FROM` | From address shown on emails |

### Generating a Google App Password

1. Go to myaccount.google.com
2. Click Security
3. Enable 2-Step Verification
4. Search App Passwords
5. Create one for Mail
6. Copy the 16 character password into MAIL_PASS

---

## API Endpoints

### Auth

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |

### Rooms

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/rooms` | Create a new room | Yes |
| GET | `/api/rooms` | Get all rooms (cached) | Yes |
| GET | `/api/rooms/:id` | Get a single room | Yes |
| POST | `/api/rooms/:id/join` | Join a room | Yes |
| GET | `/api/rooms/:id/messages` | Get room messages (cached) | Yes |

---

## WebSocket Events

Connect to the WebSocket server at:

```
ws://localhost:3000
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `joinRoom` | `{ roomId: number, token: string }` | Join a chat room |
| `sendMessage` | `{ body: string, roomId: number, token: string }` | Send a message |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `joinedRoom` | `{ message: string, roomId: number }` | Confirms room join |
| `receiveMessage` | `{ message: string, data: Message }` | New message in room |
| `error` | `{ message: string }` | Error response |

---

## Request & Response Examples

### Register

**Request**
```json
POST /api/auth/register
{
  "email": "michael@gmail.com",
  "password": "password123",
  "name": "Michael"
}
```

**Response**
```json
{
  "message": "Registration successful",
  "data": {
    "id": 1,
    "email": "michael@gmail.com",
    "name": "Michael"
  }
}
```

---

### Create a Room

**Request**
```json
POST /api/rooms
Authorization: Bearer <token>
{
  "name": "general"
}
```

**Response**
```json
{
  "message": "Room created successfully",
  "data": {
    "id": 1,
    "name": "general",
    "createdAt": "2026-06-05T09:00:00.000Z",
    "updatedAt": "2026-06-05T09:00:00.000Z"
  }
}
```

---

### Get All Rooms (Cached)

**Response**
```json
{
  "message": "Rooms retrieved successfully (cached)",
  "data": [
    {
      "id": 1,
      "name": "general",
      "_count": {
        "users": 3,
        "messages": 10
      }
    }
  ]
}
```

---

### Get Room Messages (Cached)

**Response**
```json
{
  "message": "Messages retrieved successfully (cached)",
  "data": [
    {
      "id": 1,
      "body": "Hello everyone!",
      "roomId": 1,
      "senderId": 1,
      "sender": {
        "id": 1,
        "name": "Michael",
        "email": "michael@gmail.com"
      },
      "createdAt": "2026-06-05T09:00:00.000Z"
    }
  ]
}
```

---

## Redis Caching Strategy

| Cache Key | TTL | Invalidated When |
|-----------|-----|-----------------|
| `rooms:all` | 60 seconds | User joins a room |
| `messages:room:{id}` | 30 seconds | New message sent in room |

---

## Bull Queue Flow

```
User sends message
      ↓
Message saved to database
      ↓
Email job added to Bull Queue (instant)
      ↓
Response returned to user immediately
      ↓ (background)
MailProcessor picks up job
      ↓
Email notification sent to all room members
```

---

## Authentication

This API uses JWT Bearer token authentication for HTTP routes. After logging in, include the token in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

For WebSocket events, include the token in the event payload:

```json
{
  "roomId": 1,
  "token": "your_jwt_token"
}
```

Tokens expire after **7 days**.

---

## Error Responses

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — missing or invalid token |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — room already exists or already a member |
| 500 | Internal Server Error |

---

## Database Schema

```prisma
model User {
  id        Int        @id @default(autoincrement())
  email     String     @unique
  password  String
  name      String
  messages  Message[]
  rooms     RoomUser[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Room {
  id        Int        @id @default(autoincrement())
  name      String     @unique
  messages  Message[]
  users     RoomUser[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model RoomUser {
  id        Int      @id @default(autoincrement())
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  room      Room     @relation(fields: [roomId], references: [id])
  roomId    Int
  createdAt DateTime @default(now())

  @@unique([userId, roomId])
}

model Message {
  id        Int      @id @default(autoincrement())
  body      String
  sender    User     @relation(fields: [senderId], references: [id])
  senderId  Int
  room      Room     @relation(fields: [roomId], references: [id])
  roomId    Int
  createdAt DateTime @default(now())
}
```

---

## Author

**Michael** — Backend Developer

- GitHub: [github.com/michael-lfc](https://github.com/michael-lfc)
- LinkedIn: [linkedin.com/in/michaelagwogie](https://linkedin.com/in/michaelagwogie)
- Portfolio: [portfolio-eight-tan-97.vercel.app](https://portfolio-eight-tan-97.vercel.app)
