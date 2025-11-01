import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import planningRoutes from "./routes/planning.routes.js";
import { authenticate, requireRole } from "./middlewares/auth.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/planning", planningRoutes);

// Ejemplo de ruta protegida
app.get("/me", authenticate, (req, res) => res.json({ user: req.user }));
app.get("/admin", authenticate, requireRole("admin"), (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.listen(process.env.PORT, () => console.log(`🚀 Server running on http://localhost:${process.env.PORT}`));
