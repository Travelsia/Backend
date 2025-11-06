// src/routes/users.routes.js
import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { userService } from "../services/userService.js";
import { pool } from "../db.js";
import bcrypt from "bcryptjs";

const router = Router();

// 🔒 Todas las rutas aquí requieren estar autenticado
router.use(authenticate);

// ========================
// PERFIL DEL USUARIO LOGUEADO
// ========================

// Ver mi perfil
router.get("/me", async (req, res) => {
    try {
        const user = await userService.findById(req.user.sub);
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at
        });
    } catch (e) {
        res.status(500).json({ error: "Error al obtener perfil" });
    }
});

// Actualizar mi perfil (nombre o email)
router.put("/me", async (req, res) => {
    const { name, email } = req.body || {};
    try {
        const result = await pool.query(
            `UPDATE users
         SET name = COALESCE($1, name),
             email = COALESCE($2, email)
       WHERE id = $3
       RETURNING id, name, email, role`,
            [name ?? null, email ?? null, req.user.sub]
        );
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: "Error al actualizar perfil" });
    }
});

// Cambiar mi contraseña
router.put("/me/password", async (req, res) => {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword)
        return res.status(400).json({ error: "Faltan campos" });

    try {
        const user = await userService.findById(req.user.sub);
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

        const valid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!valid) return res.status(400).json({ error: "Contraseña actual incorrecta" });

        const newHash = await bcrypt.hash(newPassword, 12);
        await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
            newHash,
            req.user.sub
        ]);

        res.json({ ok: true, message: "Contraseña actualizada correctamente" });
    } catch (e) {
        res.status(500).json({ error: "Error al cambiar contraseña" });
    }
});

// ========================
// CRUD SOLO PARA ADMIN
// ========================

// Listar todos los usuarios
router.get("/", requireRole("admin"), async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: "Error al listar usuarios" });
    }
});

// Actualizar rol de un usuario
router.put("/:id/role", requireRole("admin"), async (req, res) => {
    const { role } = req.body || {};
    if (!role) return res.status(400).json({ error: "Rol requerido" });

    try {
        await pool.query("UPDATE users SET role = $1 WHERE id = $2", [
            role,
            req.params.id
        ]);
        res.json({ ok: true, message: "Rol actualizado correctamente" });
    } catch (e) {
        res.status(500).json({ error: "Error al actualizar rol" });
    }
});

// Eliminar usuario
router.delete("/:id", requireRole("admin"), async (req, res) => {
    try {
        await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
        res.json({ ok: true, message: "Usuario eliminado correctamente" });
    } catch (e) {
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

export default router;
