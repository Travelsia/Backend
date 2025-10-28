import { Router } from "express";
import jwt from "jsonwebtoken";
import { userService } from "../services/userService.js";
import { signAccessToken, signRefreshToken } from "../middlewares/auth.js";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

// Registro
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email y contraseña requeridos" });

        const exists = await userService.findByEmail(email);
        if (exists) return res.status(409).json({ error: "El usuario ya existe" });

        const user = await userService.create({ name, email, password, role });
        const access = signAccessToken({ sub: user.id, role: user.role });
        const refresh = signRefreshToken({ sub: user.id, role: user.role });
        await userService.addRefreshToken(user.id, refresh);

        res.status(201).json({ user, accessToken: access, refreshToken: refresh });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error en registro" });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userService.findByEmail(email);
        if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

        const valid = await userService.verifyPassword(user, password);
        if (!valid) return res.status(401).json({ error: "Credenciales inválidas" });

        const access = signAccessToken({ sub: user.id, role: user.role });
        const refresh = signRefreshToken({ sub: user.id, role: user.role });
        await userService.addRefreshToken(user.id, refresh);

        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken: access, refreshToken: refresh });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error en login" });
    }
});

// Refresh
router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "No refresh token" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const valid = await userService.hasRefreshToken(decoded.sub, refreshToken);
        if (!valid) return res.status(401).json({ error: "Refresh inválido" });

        const newRefresh = signRefreshToken({ sub: decoded.sub, role: decoded.role });
        await userService.rotateRefreshToken(decoded.sub, refreshToken, newRefresh);
        const access = signAccessToken({ sub: decoded.sub, role: decoded.role });

        res.json({ accessToken: access, refreshToken: newRefresh });
    } catch (e) {
        res.status(401).json({ error: "Refresh expirado o inválido" });
    }
});

// Logout
router.post("/logout", async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            await userService.revokeRefreshToken(decoded.sub, refreshToken);
        } catch {}
    }
    res.json({ ok: true });
});

export default router;
