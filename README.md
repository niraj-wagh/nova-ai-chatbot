# ✦ Nova AI Chatbot

A fully functional, production-grade AI-powered chatbot inspired by Claude and ChatGPT — built with **Next.js**, **Node.js**, **Express.js**, **MongoDB**, **Socket.io**, and **Tailwind CSS**.

---

## 🌟 Features

| Feature | Details |
|---|---|
| 🔐 Authentication | JWT-based signup/login with secure session handling |
| 💬 Real-time Chat | Socket.io WebSocket streaming (token-by-token like ChatGPT) |
| 🧠 AI Responses | Anthropic Claude API or OpenAI GPT — switchable via `.env` |
| 📜 Chat History | Full MongoDB-persisted conversation history |
| 🔍 Search | Full-text search across all conversations |
| 🎨 Personalization | Dark/light theme, custom bot name, font size, AI model picker |
| ⭐ Message Rating | 5-star rating system with feedback on AI messages |
| ⚙️ Admin Panel | User management, stats dashboard, role control |
| 📱 Responsive | Mobile-first design, collapsible sidebar |
| 🔒 Security | Helmet, CORS, rate limiting, input validation |

---

## 🛠 Tech Stack

### Frontend
- **Next.js 14** — SSR/SSG React framework
- **Tailwind CSS** — Utility-first styling
- **Socket.io Client** — Real-time WebSocket connection
- **React Markdown** — Markdown rendering with syntax highlighting
- **Zustand** — Lightweight state management
- **Framer Motion** — Animations
- **Axios** — HTTP requests

### Backend
- **Node.js + Express.js** — REST API
- **Socket.io** — WebSocket server with auth middleware
- **MongoDB + Mongoose** — Database & ODM
- **JWT** — Authentication tokens
- **Helmet + CORS** — Security headers
- **Express Rate Limit** — Abuse prevention

### AI
- **Anthropic Claude API** (default: `claude-sonnet-4-20250514`)
- **OpenAI GPT API** (optional: `gpt-4o`)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Anthropic API key **or** OpenAI API key

---

### 1. Clone / Extract the project

```bash
unzip chatbot-app.zip
cd chatbot-app
```

---

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.mongodb.net/chatbot
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Choose your AI provider:
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-20250514
ANTHROPIC_API_KEY=sk-ant-...

# OR for OpenAI:
# AI_PROVIDER=openai
# AI_MODEL=gpt-4o
# OPENAI_API_KEY=sk-...

FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev      # development (nodemon)
npm start        # production
```

Backend runs on: **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Nova AI
```

Start the frontend:

```bash
npm run dev      # development
npm run build && npm start   # production
```

Frontend runs on: **http://localhost:3000**

---

## 📁 Project Structure

```
chatbot-app/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Register, login, preferences
│   │   ├── chatController.js     # Conversations, messages
│   │   └── adminController.js    # Admin stats, user management
│   ├── middleware/
│   │   └── auth.js               # JWT auth + admin guard
│   ├── models/
│   │   ├── User.js               # User schema
│   │   └── Conversation.js       # Conversation + messages schema
│   ├── routes/
│   │   ├── auth.js
│   │   ├── chat.js
│   │   └── admin.js
│   ├── services/
│   │   └── aiService.js          # Anthropic + OpenAI (streaming)
│   ├── server.js                 # Main server + Socket.io
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── components/
│   │   ├── ChatWindow.js         # Main chat interface
│   │   ├── MessageBubble.js      # Message rendering + markdown
│   │   └── Sidebar.js            # Conversation history sidebar
│   ├── pages/
│   │   ├── _app.js               # App wrapper + theme
│   │   ├── _document.js          # HTML document
│   │   ├── index.js              # Redirect entry point
│   │   ├── login.js              # Login + register
│   │   ├── chat.js               # Main chat page
│   │   ├── settings.js           # User settings
│   │   └── admin.js              # Admin dashboard
│   ├── services/
│   │   └── socket.js             # Socket.io client
│   ├── styles/
│   │   └── globals.css           # Design system + CSS vars
│   ├── utils/
│   │   ├── api.js                # Axios API client
│   │   └── authStore.js          # Zustand auth state
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/preferences` | Update preferences |
| PATCH | `/api/auth/password` | Change password |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chat/conversations` | List conversations |
| POST | `/api/chat/conversations` | Create conversation |
| GET | `/api/chat/conversations/:id` | Get with messages |
| PATCH | `/api/chat/conversations/:id` | Update title/category |
| DELETE | `/api/chat/conversations/:id` | Delete |
| POST | `/api/chat/conversations/:id/messages` | Send message (HTTP) |
| PATCH | `/api/chat/conversations/:cId/messages/:mId/rate` | Rate message |
| GET | `/api/chat/search?q=query` | Search conversations |

### Admin (admin role required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | All users |
| PATCH | `/api/admin/users/:id/toggle` | Enable/disable |
| PATCH | `/api/admin/users/:id/role` | Change role |

---

## ⚡ Socket.io Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `send_message` | `{ conversationId, content }` | Send a chat message |
| `typing_start` | `{ conversationId }` | User started typing |
| `typing_stop` | `{ conversationId }` | User stopped typing |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `conversation_created` | `{ conversationId }` | New conversation ID |
| `message_received` | `{ message, conversationId }` | User msg confirmed |
| `ai_thinking` | `{ conversationId }` | AI processing |
| `ai_stream_chunk` | `{ chunk, conversationId }` | Streaming token |
| `ai_stream_done` | `{ message, title }` | Stream complete |
| `error` | `{ message }` | Error occurred |

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
# Set env vars in Vercel dashboard
```

### Backend → Render / Railway
1. Push backend to GitHub repo
2. Connect to Render/Railway
3. Set all `.env` variables in dashboard
4. Deploy

### Database → MongoDB Atlas
1. Create free cluster at https://cloud.mongodb.com
2. Whitelist `0.0.0.0/0` for production
3. Get connection string → set as `MONGODB_URI`

---

## 🔮 Future Enhancements (from PDF)

- [ ] **Multilingual support** — translate inputs & responses
- [ ] **Voice interaction** — speech-to-text / text-to-speech
- [ ] **Google Calendar integration** — schedule via chat
- [ ] **Custom AI fine-tuning** — domain-specific models
- [ ] **File upload** — analyze PDFs, images in chat
- [ ] **Shared conversations** — shareable chat links
- [ ] **Export chats** — download as PDF/markdown

---

## 🐛 Troubleshooting

**MongoDB connection failed:**
- Check `MONGODB_URI` format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
- Whitelist your IP in MongoDB Atlas Network Access

**AI API errors:**
- Verify your API key is correct in `.env`
- Check `AI_PROVIDER` matches the key you provided
- Claude keys start with `sk-ant-`; OpenAI keys start with `sk-`

**Socket not connecting:**
- Ensure backend is running on the port in `NEXT_PUBLIC_SOCKET_URL`
- Check CORS `FRONTEND_URL` matches your frontend address

**JWT errors:**
- Make sure `JWT_SECRET` is the same string across restarts
- Clear `localStorage` in browser if you see 401 errors

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

Built with ❤️ using Next.js, Node.js, MongoDB, Socket.io & Claude API
