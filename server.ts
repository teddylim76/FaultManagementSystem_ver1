import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("failure_management.db");
db.pragma('journal_mode = WAL'); // Enable WAL mode for better concurrency
db.pragma('busy_timeout = 5000'); // Wait up to 5 seconds if DB is locked
db.pragma('synchronous = NORMAL'); // Better performance with WAL

const JWT_SECRET = "failure-management-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' -- 'admin' or 'user'
  );

  CREATE TABLE IF NOT EXISTS failure_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    affiliation TEXT NOT NULL,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    symptom TEXT NOT NULL,
    status TEXT NOT NULL, -- '접수', '처리중', '완료'
    remarks TEXT,
    received_photo TEXT, -- Base64
    completed_photo TEXT, -- Base64
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS network_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    ip TEXT NOT NULL,
    gateway TEXT NOT NULL,
    subnet TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", hashedPassword, "admin");
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Socket.io connection
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Helper to notify all clients
  const notifyClients = () => {
    io.emit("records_updated");
  };

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/auth/signup", (req, res) => {
    const { username, password, role } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, hashedPassword, role || 'user');
      res.status(201).json({ message: "User created" });
    } catch (error) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // User Management Routes
  app.get("/api/users", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const users = db.prepare("SELECT id, username, role FROM users").all();
    res.json(users);
  });

  app.put("/api/users/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    
    // Only admin can change roles or edit other users
    if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: "Permission denied" });
    }

    try {
      if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        if (req.user.role === 'admin') {
          db.prepare("UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?")
            .run(username, hashedPassword, role, id);
        } else {
          // User can only update their own password
          db.prepare("UPDATE users SET password = ? WHERE id = ?")
            .run(hashedPassword, id);
        }
      } else {
        if (req.user.role === 'admin') {
          db.prepare("UPDATE users SET username = ?, role = ? WHERE id = ?")
            .run(username, role, id);
        }
      }
      res.json({ message: "User updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    
    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Network Management Routes
  app.get("/api/network", authenticateToken, (req, res) => {
    const configs = db.prepare("SELECT * FROM network_configs ORDER BY created_at DESC").all();
    res.json(configs);
  });

  app.post("/api/network/auto", authenticateToken, (req: any, res) => {
    const username = req.user.username;
    // Get IP from headers or socket
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const gateway = "자동 감지됨";
    const subnet = "자동 감지됨";
    const description = `${username}의 자동 등록 정보`;

    try {
      // Check if user already has a config, update it or insert new
      const existing = db.prepare("SELECT id FROM network_configs WHERE username = ?").get(username);
      if (existing) {
        db.prepare("UPDATE network_configs SET ip = ?, gateway = ?, subnet = ?, description = ?, created_at = CURRENT_TIMESTAMP WHERE username = ?")
          .run(ip, gateway, subnet, description, username);
      } else {
        db.prepare("INSERT INTO network_configs (username, ip, gateway, subnet, description) VALUES (?, ?, ?, ?, ?)")
          .run(username, ip, gateway, subnet, description);
      }
      res.status(201).json({ message: "Network config registered automatically" });
    } catch (error) {
      res.status(500).json({ error: "Failed to register network config" });
    }
  });

  app.post("/api/network", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Admin only" });
    const { ip, gateway, subnet, description, username } = req.body;
    try {
      db.prepare("INSERT INTO network_configs (username, ip, gateway, subnet, description) VALUES (?, ?, ?, ?, ?)")
        .run(username || req.user.username, ip, gateway, subnet, description);
      res.status(201).json({ message: "Network config added" });
    } catch (error) {
      res.status(500).json({ error: "Failed to add network config" });
    }
  });

  app.delete("/api/network/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Admin only" });
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM network_configs WHERE id = ?").run(id);
      res.json({ message: "Network config deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete network config" });
    }
  });

  // Records Routes
  app.get("/api/records", authenticateToken, (req, res) => {
    const records = db.prepare("SELECT * FROM failure_records ORDER BY date DESC, id DESC").all();
    res.json(records);
  });

  app.post("/api/records", authenticateToken, (req, res) => {
    const { date, location, affiliation, name, contact, symptom, status, remarks, received_photo, completed_photo } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO failure_records (date, location, affiliation, name, contact, symptom, status, remarks, received_photo, completed_photo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(date, location, affiliation, name, contact, symptom, status, remarks, received_photo, completed_photo);
      
      notifyClients();
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to create record" });
    }
  });

  app.put("/api/records/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { date, location, affiliation, name, contact, symptom, status, remarks, received_photo, completed_photo } = req.body;
    try {
      db.prepare(`
        UPDATE failure_records 
        SET date = ?, location = ?, affiliation = ?, name = ?, contact = ?, symptom = ?, status = ?, remarks = ?, received_photo = ?, completed_photo = ?
        WHERE id = ?
      `).run(date, location, affiliation, name, contact, symptom, status, remarks, received_photo, completed_photo, id);
      
      notifyClients();
      res.json({ message: "Record updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update record" });
    }
  });

  app.delete("/api/records/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM failure_records WHERE id = ?").run(id);
      
      notifyClients();
      res.json({ message: "Record deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete record" });
    }
  });

  // Dashboard Stats
  app.get("/api/stats", authenticateToken, (req, res) => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = '접수' THEN 1 ELSE 0 END) as received,
        SUM(CASE WHEN status = '처리중' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = '완료' THEN 1 ELSE 0 END) as completed
      FROM failure_records
    `).get();
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
