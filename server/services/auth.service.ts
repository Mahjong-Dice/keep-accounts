import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';
import { generateRoomId } from '../utils';
import { generateMiniProgramCode } from '../utils/wxcode';
import { generateToken } from '../utils/token';

dotenv.config();

const prisma = new PrismaClient();

// 微信小程序的appid和secret，应该从环境变量中获取
const WECHAT_APPID = process.env.WECHAT_APPID;
const WECHAT_SECRET = process.env.WECHAT_SECRET;

// 如果没有配置微信应用信息，抛出警告
if (!WECHAT_APPID || !WECHAT_SECRET) {
  console.warn('请在环境变量中设置WECHAT_APPID和WECHAT_SECRET');
}

// 获取openid
export async function getOpenid(code: string) {
  try {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`;
    const response = await axios.get(url);

    if (response.data.errcode) {
      console.error('微信API错误:', response.data.errcode, response.data.errmsg);
      return null;
    }

    const { openid } = response.data;
    return openid;
  } catch (error) {
    console.error('获取openid异常:', error);
    return null;
  }
}

/**
 * 创建用户
 * @param code 
 * @param userInfo 
 * @returns 
 */
export async function createUser(openid: string, code: string, userInfo: any) {
  return await prisma.$transaction(async (tx: any) => {
    if (!openid) {
      throw new Error("获取openid失败");
    }

    // 查找或创建用户
    let user = await tx.user.findUnique({
      where: { wxOpenId: openid },
    });

    if (!user) {
      user = await tx.user.create({
        data: { wxOpenId: openid, name: userInfo.nickName, avatarUrl: userInfo.avatarUrl },
      });
    }

    // 生成token
    const token = generateToken({ id: user.id, openid: user.wxOpenId });

    return { user, token };
  });
}

// 新增函数：认证并创建房间
export async function authenticateAndCreateRoom(code: string, userInfo: any) {
  return await prisma.$transaction(async (tx: any) => {
    const openid = await getOpenid(code);
    const { user } = await createUser(openid, code, userInfo);

    // 查找用户是否已有房间
    const existingRooms = await tx.room.findMany({
      where: { ownerId: openid }
    });

    let room = null;
    if (existingRooms.length === 0) {
      const nickname = generateRoomId();
      // 创建房间
      room = await tx.room.create({
        data: {
          name: nickname + "的房间", // 提供必填字段
          ownerId: openid,
          qrCodeUrl: null,
          inviteToken: null,
        },
      });

      // 创建房间成员
      await tx.roomMember.create({
        data: {
          userId: user.id,
          roomId: room.id,
          role: "admin",
          nickname: userInfo.nickName,
          balance: 0,
          avatarUrl: userInfo.avatarUrl,
        },
      });

      await tx.roomPopulation.create({
        data: {
          roomId: room.id,
          memberCount: 1,
        },
      });

      // 生成小程序码
      try {
        const qrCodeUrl = await generateMiniProgramCode({
          scene: room.id.toString()
        });
        // 更新房间的小程序码URL
        room = await tx.room.update({
          where: { id: room.id },
          data: { qrCodeUrl: qrCodeUrl.url }
        });
      } catch (error) {
        console.error('生成小程序码失败:', error);
        // 继续执行，不中断流程
      }
    } else {
      room = existingRooms[0];
    }

    // 生成token
    const token = generateToken({
      id: user.id,
      openid: user.wxOpenId,
      roomId: room ? room.id : null
    });

    return {
      isAuthenticated: true,
      userId: user.id,
      openid: user.wxOpenId,
      token: token,
      room: room ? {
        id: room.id,
        name: room.name,
        qrCodeUrl: room.qrCodeUrl // 返回小程序码URL
      } : null
    };

  });
}