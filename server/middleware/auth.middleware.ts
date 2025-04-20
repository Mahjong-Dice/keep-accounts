// server/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token';
import { sendResponse } from '../utils/response';

// 扩展Request类型以包含用户信息
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendResponse(res, 401, false, "未授权", null, "缺少授权令牌");
        return
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        sendResponse(res, 401, false, "未授权", null, "无效或过期的令牌");
    }

    // 将用户信息附加到请求对象
    req.user = decoded;
    next();
}