import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function signAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.ACCESS_TOKEN_TTL });
}

export function signRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_TTL });
}

export function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Token requerido" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        // Mapear 'sub' (JWT standard) a 'id' para facilitar el uso en la aplicación
        req.user = {
            id: decoded.sub,
            role: decoded.role,
            sub: decoded.sub // Mantener por compatibilidad
        };
        next();
    } catch {
        res.status(401).json({ error: "Token inválido o expirado" });
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Acceso denegado" });
        next();
    };
}
