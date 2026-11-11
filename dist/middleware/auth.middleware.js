import jwt from 'jsonwebtoken';
import { database } from '../config/database.js';
import { getJwtSecret } from '../config/jwt.js';
export const authenticate = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
        res.status(401).json({
            message: 'Token de autenticação não informado.',
        });
        return;
    }
    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
        res.status(401).json({
            message: 'Token de autenticação inválido.',
        });
        return;
    }
    let userId;
    try {
        const payload = jwt.verify(token, getJwtSecret());
        if (typeof payload === 'string' || typeof payload.sub !== 'string') {
            res.status(401).json({
                message: 'Token de autenticação inválido.',
            });
            return;
        }
        userId = Number(payload.sub);
        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(401).json({
                message: 'Token de autenticação inválido.',
            });
            return;
        }
    }
    catch {
        res.status(401).json({
            message: 'Token inválido ou expirado.',
        });
        return;
    }
    try {
        const [rows] = await database.execute(`SELECT id, role
       FROM users
       WHERE id = ?
       LIMIT 1`, [userId]);
        const user = rows[0];
        if (!user) {
            res.status(401).json({
                message: 'Usuário não encontrado.',
            });
            return;
        }
        res.locals.authUser = {
            id: user.id,
            role: user.role,
        };
        next();
    }
    catch (error) {
        console.error('Erro ao validar usuário autenticado:', error);
        res.status(500).json({
            message: 'Erro interno ao validar autenticação.',
        });
    }
};
export function requireRole(...allowedRoles) {
    return (_req, res, next) => {
        const user = res.locals.authUser;
        if (!user) {
            res.status(401).json({
                message: 'Autenticação necessária.',
            });
            return;
        }
        if (!allowedRoles.includes(user.role)) {
            res.status(403).json({
                message: 'Você não tem permissão para realizar esta ação.',
            });
            return;
        }
        next();
    };
}
