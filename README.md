# StudyOS — AI-Powered Adaptive DSA Learning Platform

> Duolingo + LeetCode + ChatGPT, purpose-built for DSA mastery.

StudyOS is a production-ready, full-stack adaptive learning platform that combines **RAG-powered AI tutoring**, **adaptive quizzing**, **personalized study plans**, and **mastery tracking** for Data Structures and Algorithms.

## 🧬 Features

- **RAG AI Tutor** — Upload PDFs/notes, and query with context-aware answers streamed via SSE
- **Adaptive Quiz Engine** — MCQ generation with gpt-4o, auto-grading, personalized feedback for wrong answers
- **Smart Study Planner** — Day-by-day DSA curriculum weighted on your weak topics, with revision & mock test days
- **Progress Intelligence** — Topic mastery heatmap, streak tracking, weak area detection, estimated mastery date
- **Knowledge Base** — Upload PDFs/TXT files, auto-chunked and embedded into ChromaDB for RAG retrieval

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js (ES Modules) |
| Database | MongoDB + Mongoose |
| Vector DB | ChromaDB (Docker, port 8000) |
| AI | OpenAI API — gpt-4o, text-embedding-3-small |
| Auth | JWT + bcryptjs |
| File Upload | Multer + pdf-parse |

## 🚀 Setup

### Prerequisites

- Node.js 18+
- Docker Desktop (for MongoDB + ChromaDB)
- OpenAI API Key

### 1. Clone and install

```bash
git clone <repo-url>
cd studyos

# Server
cd server
cp .env.example .env   # fill in your OPENAI_API_KEY
npm install

# Client
cd ../client
npm install
```

### 2. Start Docker services

```bash
cd studyos
docker compose up -d
```

### 3. Seed the database

```bash
cd server
npm run seed
```

### 4. Run the application

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open http://localhost:5173

### Demo credentials
- Email: `demo@studyos.com`
- Password: `demo123`

## 🔑 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/studyos` |
| `OPENAI_API_KEY` | OpenAI API key | *required* |
| `JWT_SECRET` | JWT signing secret | *required* |
| `CHROMA_URL` | ChromaDB URL | `http://localhost:8000` |
| `NODE_ENV` | Environment | `development` |

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Chat (SSE)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | RAG query with streaming response |

### Upload
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload PDF/TXT → chunk → embed → index |

### Quiz
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/quiz/generate` | Generate adaptive MCQ question |
| POST | `/api/quiz/grade` | Grade answer, update difficulty |

### Plan
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/plan/generate` | Generate study plan |
| GET | `/api/plan/today/:userId` | Get today's tasks |
| GET | `/api/plan/:userId` | Get full plan |
| PUT | `/api/plan/task/:taskId/complete` | Mark task complete |

### Progress
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/progress/:userId` | Full progress analytics |

## 📁 Project Structure

```
studyos/
├── server/
│   ├── index.js, config.js
│   ├── routes/    (auth, chat, upload, quiz, plan, progress)
│   ├── services/  (rag, chroma, adaptive, grader, planner)
│   ├── models/    (User, Attempt, Concept, StudyPlan)
│   ├── middleware/ (authMiddleware, uploadMiddleware)
│   └── seed.js
├── client/
│   └── src/
│       ├── pages/      (Chat, Quiz, Dashboard, Plan, Login, Register)
│       ├── components/ (Navbar, ChatMessage, TopicHeatmap, ProgressCard, ProblemCard, StreamingText)
│       ├── api/        (axios, chatApi, quizApi, progressApi)
│       └── context/    (AuthContext)
├── docker-compose.yml
└── README.md
```

## 📝 License

MIT
