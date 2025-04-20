import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import {
  deleteRoom,
  getUserInfo,
  getUserRoom,
  joinRoom,
  kickMember,
} from "./services/room.service";
import { authenticateAndCreateRoom, createUser, getOpenid } from "./services/auth.service";
import { createTransaction, getRoomTransactions } from "./services/transaction.service";
import { generateMiniProgramCode } from "./utils/wxcode";
import path from 'path';
import { sendResponse } from "./utils/response";
import { authenticate } from "./middleware/auth.middleware";

dotenv.config(); // 加载.env文件
const app = express();
app.use(cors());
app.use(bodyParser.json());

// 配置静态文件服务
app.use('/uploads', authenticate, express.static(path.join(__dirname, 'uploads')));

// 微信认证接口
app.post("/api/wechat/auth", async (req, res) => {
  try {
    const { code, userInfo } = req.body;
    if (!code) {
      sendResponse(res, 400, false, "参数错误", null, "code is required");
      return;
    }

    const openid = await getOpenid(code as string);
    const authResult = await createUser(openid, code as string, userInfo);
    sendResponse(res, 200, true, "认证成功，创建用户", authResult);
  } catch (error: Error | any) {
    console.error("认证失败:", error);
    sendResponse(res, 500, false, "认证失败", null, error.message);
  }
});

// 微信认证并创建房间（合并操作）
app.post("/api/wechat/auth-with-room", async (req, res) => {
  try {
    const { code, userInfo, createRoom } = req.body;
    if (!code) {
      sendResponse(res, 400, false, "参数错误", null, "code is required");
      return;
    }

    const result = await authenticateAndCreateRoom(code as string, userInfo);
    sendResponse(res, 200, true, "认证并创建房间成功", result);
  } catch (error: Error | any) {
    console.error("认证并创建房间失败:", error);
    sendResponse(res, 500, false, "操作失败", null, error.message);
  }
});

// 获取该用户是否存在于房间
app.get("/api/rooms", authenticate, async (req, res) => {
  try {
    // console.log("Request received for openid:", req.query);
    const { openid } = req.query;
    if (!openid) {
      sendResponse(res, 400, false, "参数错误", null, "openid is required");
      return;
    }

    try {
      const roomsInfo = await getUserRoom(openid as string);
      sendResponse(res, 200, true, "获取房间信息成功", roomsInfo);
    } catch (error: Error | any) {
      if (error.message === "User not found") {
        sendResponse(res, 404, false, "用户未找到", null, "User not found");
        return;
      } else {
        throw error;
      }
    }
  } catch (error: Error | any) {
    console.error("Failed to check room membership:", error);
    sendResponse(res, 500, false, "获取房间信息失败", null, error.message);
  }
});

// 删除房间
app.delete("/api/rooms/:id", authenticate, async (req, res) => {
  try {
    const { openid, roomId } = req.body;

    if (isNaN(roomId)) {
      sendResponse(res, 400, false, "参数错误", null, "无效的房间ID格式");
      return;
    }

    try {
      const data = await deleteRoom(+roomId, openid);
      sendResponse(res, 200, true, data.message);
    } catch (error: Error | any) {
      if (error.message === "房间不存在") {
        sendResponse(res, 404, false, "房间不存在", null, "房间不存在");
      } else {
        throw error;
      }
    }
  } catch (error: Error | any) {
    console.error("删除房间失败:", error);
    sendResponse(res, 500, false, "删除房间失败", null, error.message);
  }
});

// 生成小程序码
app.get("/api/wechat/generate-mini-program-code", authenticate, async (req, res) => {
  try {
    const { roomId, page, env_version } = req.query as { roomId: string, page: string, env_version: string };

    const data = await generateMiniProgramCode(
      {
        scene: roomId,
        page,
        env_version,
        check_path: true,
        width: 430
      }
    );

    sendResponse(res, 200, true, "生成小程序码成功", data);
  } catch (error: Error | any) {
    console.error("生成小程序码失败:", error);
    sendResponse(res, 500, false, "生成小程序码失败", null, error.message);
  }
});

// 加入房间
app.post("/api/join-room", async (req, res) => {
  try {
    const { roomId, openid } = req.body;
    const result = await joinRoom(roomId, openid);
    sendResponse(res, 200, true, "加入房间成功", result);

  } catch (error: Error | any) {
    console.error("加入房间失败:", error);
    sendResponse(res, 500, false, "加入房间失败", null, error.message);
  }
});

// 交易接口
app.post("/api/transactions", authenticate, async (req, res) => {
  try {
    const { senderOpenid, receiverOpenid, amount, description } = req.body;

    // 验证参数
    if (!senderOpenid || !receiverOpenid || !amount) {
      sendResponse(res, 400, false, "参数错误", null, "发送方ID、接收方ID和金额不能为空");
      return;
    }
    // 验证金额是否为正数
    else if (amount <= 0) {
      sendResponse(res, 400, false, "参数错误", null, "交易金额必须为正数");
      return;
    }
    else {
      // 验证双方是否在同一房间
      const senderRoomInfo = await getUserRoom(senderOpenid);
      const receiverRoomInfo = await getUserRoom(receiverOpenid);

      if (!senderRoomInfo || !receiverRoomInfo || senderRoomInfo?.room?.id !== receiverRoomInfo?.room?.id) {
        sendResponse(res, 403, false, "交易失败", null, "发送方和接收方必须在同一房间内");
      }
      else {
        // TODO: 这里需要添加交易服务，从发送方扣除金额，给接收方增加金额
        // 假设有一个transaction.service.ts中的createTransaction函数
        const result = await createTransaction(senderOpenid, receiverOpenid, amount, description);

        // 临时返回成功信息，实际项目中应该返回交易结果
        sendResponse(res, 200, true, "交易成功", result);
      }
    }
  } catch (error: Error | any) {
    console.error("交易失败:", error);
    sendResponse(res, 500, false, "交易失败", null, error.message);
  }
});

// 获取用户信息
app.get("/api/users/:openid", authenticate, async (req, res) => {
  try {
    const { openid } = req.params as { openid: string };
    const userInfo = await getUserInfo(openid);
    sendResponse(res, 200, true, "获取用户信息成功", userInfo);
  } catch (error: Error | any) {
    console.error("获取用户信息失败:", error);
    sendResponse(res, 500, false, "获取用户信息失败", null, error.message);
  }
});

// 房主踢人
app.post("/api/rooms/:roomId/kick-member", authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { kickedOpenid, ownerOpenid } = req.body;

    // 参数验证
    if (!kickedOpenid || !ownerOpenid) {
      sendResponse(res, 400, false, "参数错误", null, "被踢用户ID和房主ID不能为空");
      return;
    }

    if (isNaN(Number(roomId))) {
      sendResponse(res, 400, false, "参数错误", null, "无效的房间ID格式");
      return;
    }

    // 调用踢人服务
    const result = await kickMember(Number(roomId), kickedOpenid, ownerOpenid);
    sendResponse(res, 200, true, "踢人成功", result);
  } catch (error: Error | any) {
    console.error("踢人失败:", error);

    // 根据错误类型返回不同的状态码
    if (error.message === "房间不存在") {
      sendResponse(res, 404, false, "踢人失败", null, "房间不存在");
      return;
    } else if (
      error.message === "只有房主可以踢人" ||
      error.message === "房主不能踢自己"
    ) {
      sendResponse(res, 403, false, "踢人失败", null, error.message);
      return;
    } else if (
      error.message === "被踢用户不存在" ||
      error.message === "被踢用户不在房间中"
    ) {
      sendResponse(res, 400, false, "踢人失败", null, error.message);
      return;
    } else {
      sendResponse(res, 500, false, "踢人失败", null, error.message);
      return;
    }
  }
});

// 房间交易历史
app.get("/api/rooms/:roomId/transactions", authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const transactions = await getRoomTransactions(roomId);
    sendResponse(res, 200, true, "获取交易历史成功", transactions);
  } catch (error: Error | any) {
    console.error("获取交易历史失败:", error);
    sendResponse(res, 500, false, "获取交易历史失败", null, error.message);
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
