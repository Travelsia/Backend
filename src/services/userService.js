import bcrypt from "bcryptjs";
import { pool } from "../db.js";

export const userService = {
    async findByEmail(email) {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        return result.rows[0];
    },

    async create({ name, email, password, role }) {
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
            [name, email, passwordHash, role || "user"]
        );
        return result.rows[0];
    },

    async verifyPassword(user, password) {
        return bcrypt.compare(password, user.password_hash);
    },

    async addRefreshToken(userId, token) {
        await pool.query("INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)", [userId, token]);
    },

    async hasRefreshToken(userId, token) {
        const res = await pool.query("SELECT * FROM refresh_tokens WHERE user_id = $1 AND token = $2", [userId, token]);
        return res.rowCount > 0;
    },

    async revokeRefreshToken(userId, token) {
        await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2", [userId, token]);
    },

    async rotateRefreshToken(userId, oldToken, newToken) {
        await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2", [userId, oldToken]);
        await pool.query("INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)", [userId, newToken]);
    }
};
