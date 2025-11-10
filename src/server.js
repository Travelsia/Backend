import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import planningRoutes from "./routes/planning.routes.js";
import itineraryRoutes from "./routes/itinerary.routes.js";
import { integrationRoutes } from "./routes/integration.routes.js";
import { sharingRoutes } from "./routes/sharing.routes.js";
import { googleSheetsRoutes } from "./routes/sheets.routes.js";
import { authenticate, requireRole } from "./middlewares/auth.js";
import usersRoutes from "./routes/users.routes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/planning", planningRoutes);
app.use("/itineraries", itineraryRoutes);
app.use("/integrations", integrationRoutes);
app.use("/sharing", sharingRoutes);
app.use("/sheets", googleSheetsRoutes);

// Ejemplo de ruta protegida
app.get("/admin", authenticate, requireRole("admin"), (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/users", usersRoutes);

app.listen(process.env.PORT, () => console.log(`🚀 Server running on http://localhost:${process.env.PORT}`));
