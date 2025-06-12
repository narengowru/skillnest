# 🌟 SkillNest

SkillNest is a web platform that connects **freelancers** with **clients**. Whether you're looking for skilled professionals to work on your projects or you’re a freelancer searching for exciting gigs — SkillNest makes it easy to find the perfect match.

---

## 🔗 Live Demo
[🔗 skillnest-orpin.vercel.app](https://skillnest-orpin.vercel.app/)

---

## 📌 Features

- 🔍 **Browse Freelancers** — Search and filter freelancers based on skills  
- 📄 **Post Projects** — Clients can post new projects with details, budgets, and timelines  
- 💼 **Apply for Projects** — Freelancers can view and apply for listed projects  
- 🧾 **User Profiles** — Customizable profiles for both freelancers and clients  

---

## 🛠️ Tech Stack

**Frontend:**
- React.js  
- HTML / CSS / JavaScript  

**Backend:**
- Node.js  
- Express.js  

**Database:**
- MongoDB  

---

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- npm (Node Package Manager)
- MongoDB running locally or via cloud (like MongoDB Atlas)

---

### 🔐 Environment Variables

Make sure to **create a `.env` file** in both the `backend` and `frontend` directories before starting the application.

#### 📁 Backend (`/backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/skillnest?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.2
JWT_SECRET=your_jwt_secret_key_here
```
🔒 Replace MONGODB_URI with your actual MongoDB connection string if using Atlas.
🔒 Replace JWT_SECRET with a strong secret key.

#### 📁 Frontend (`/frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000
```

### 🔧 Installation

```bash
# 1. Clone the repository
git clone https://github.com/narengowru/skillnest.git
cd skillnest

# 2. Setup Backend
cd backend
npm install
node server.js

# 3. In a new terminal, setup Frontend
cd ../frontend
npm install
npm start
