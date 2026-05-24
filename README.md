# GitShare - Lightweight Repository Sharing Platform

GitShare is a centralized file and folder sharing platform inspired by GitHub's layout and styling. Users can log in, create repositories, upload deep file/folder structures (using path mapping), preview text and code files, download files individually, download whole repositories as compressed ZIP files, and perform server-level moderation (admin panel).

---

## 📂 Project Structure

```text
gitshare/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # MongoDB database connector (with auto-memory fallback)
│   │   ├── middleware/
│   │   │   ├── auth.js          # Authentication (JWT token & Admin role checker)
│   │   │   └── upload.js        # Multer upload validation and local disk storage
│   │   ├── models/
│   │   │   ├── User.js          # User database schema & bcrypt comparisons
│   │   │   └── Repository.js    # Repository model with nested files array
│   │   ├── routes/
│   │   │   ├── adminRoutes.js   # Admin analytics & user statistics routes
│   │   │   ├── authRoutes.js    # Register, login, logout, and token check routes
│   │   │   └── repoRoutes.js    # Repo creation, files upload/delete/download & ZIP routing
│   │   ├── index.js             # Express application server configurations & seeder
│   │   └── test.js              # Integration test suite for backend components
│   ├── package.json             # Backend configurations and scripts
│   └── .env.example             # Configuration variables template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header navigation layout with admin flags
│   │   │   └── Sidebar.jsx      # Owner repository sidebar list & creation dialog
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Context API wrapper & global axios interceptor
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx # Panel showing usage statistics & delete moderation
│   │   │   ├── Dashboard.jsx    # Global explore feed with recent files & search
│   │   │   ├── Login.jsx        # Login panel containing demo credentials alerts
│   │   │   ├── Register.jsx     # Registration panel with character validations
│   │   │   └── RepoDetail.jsx   # Explorer navigator, code/image previewer & upload logs
│   │   ├── App.jsx              # Routing configurations and auth guards
│   │   ├── index.css            # Tailwind CSS v4 directives & global scrollbar customizer
│   │   └── main.jsx             # React entry point mounts
│   ├── vite.config.js           # Vite dev servers and API proxy redirects
│   ├── index.html               # Main index.html containing Google Font link & SEO tags
│   └── package.json             # React dependencies and build controls
└── README.md                    # Setup documentation
```

---

## 🛠️ Setup Instructions (Local Development)

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- *(Optional)* MongoDB (If omitted, the backend will automatically spin up an in-memory database fallback (`mongodb-memory-server`) to let the app run with zero setup!)

### 1. Set Up Backend
Navigate to the `backend/` directory:
```bash
npm install
```

Configure environment:
Copy `.env.example` to `.env` (a pre-configured development copy is created automatically in the project):
```bash
cp .env.example .env
```

To run the automated API testing suite:
```bash
node src/test.js
```

Start the backend server in development mode (runs on port `5001` by default):
```bash
npm run dev
```

### 2. Set Up Frontend
Open a new terminal session and navigate to the `frontend/` directory:
```bash
npm install
```

Start the Vite development server (runs on port `5173` by default):
```bash
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🔑 Demo Access Credentials
On startup, if the database is empty, the server automatically seeds a test account:
*   **Regular User:** Username: `gitshare_user` | Password: `user123`
*   *(Note: An admin moderator account is also seeded for system administration, but its credentials should be configured privately in production).*

---

## 🔒 Security Implementations
- **File Validation & Protection:** Upload files are restricted (suspicious active files like `.exe` or `.bat` are blocked). Storage utilizes UUID-like filenames on disk to eliminate path traversal vulnerabilities.
- **Access Protection:** Repositories are publicly readable by any authenticated user, but mutations (adding files, deleting files, deleting repositories) are restricted to the owner of the repository or administrators.
- **Admin Protect Roles:** Routes in `/api/admin` require a custom `verifyAdmin` middleware check on the user's Mongoose token profile.
- **Limiting Request Rates:** Implements API request rate limiting using `express-rate-limit` to prevent brute force and resource exhaust attacks.
- **Password Encryption:** Salt-hashed password credentials using `bcryptjs`.

---

## ☁️ Deployment Guide

### Frontend Deployment (e.g., Vercel / Netlify)
1. Set the build command to `npm run build` and output directory to `dist` (Vite default).
2. Configure a rewrites rule in `vercel.json` (or a `_redirects` file in Netlify) to support SPA routing:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
3. Update the production API endpoint mapping in frontend code (or set up a rewrite rule mapping `/api/*` to the deployed backend URL).

### Backend Deployment (e.g., Render / Railway)
1. Set the start script to `npm start` (runs `node src/index.js`).
2. Add your environment variables:
   - `PORT`: Set to the port required (provided dynamically by host platforms like Render).
   - `MONGODB_URI`: Connect to a live production database cluster (such as MongoDB Atlas).
   - `JWT_SECRET`: A long secure random string.
   - `FRONTEND_URL`: URL of the deployed frontend (for CORS).
   - `NODE_ENV`: Set to `production`.
3. Set disk mount permissions if storing uploads locally, or configure a cloud storage adapter (e.g. AWS S3/Cloudinary) in `upload.js` for persistent storage across container restarts.

### Database (MongoDB Atlas)
1. Register a free shared cluster on MongoDB Atlas.
2. Under Database Access, create a user and whitelist connections (`0.0.0.0/0` or cloud platform IPs).
3. Copy the connection string (e.g. `mongodb+srv://...`) and paste it as the `MONGODB_URI` in the backend host settings.
