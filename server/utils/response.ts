import { Response } from "express";

export interface ApiResponse<T = any> {
    success: boolean;
    code: number;
    message: string;
    data?: T;
    error?: string;
}

// 添加统一的响应处理函数
export const sendResponse = <T>(res: Response, status: number, success: boolean, message: string, data?: T, error?: string) => {
    const response: ApiResponse<T> = {
        success,
        code: status,
        message,
        data,
        error
    };

    return res.status(status).json(response);
};