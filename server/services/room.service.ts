import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Room {
  ownerId: string;
  qrCodeUrl: string;
  inviteToken: string;
  name: string;
}

/**
 * 获取用户所在房间信息及该房间的所有成员
 * @param openid 微信openid
 * @returns 包含房间信息和成员列表的对象
 */
export async function getUserRoom(openid: string) {
  // 1. 先通过wxOpenId查找用户
  const user = await prisma.user.findUnique({
    where: { wxOpenId: openid },
    select: { id: true, wxOpenId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // 2. 查询用户是否加入了房间
  const roomMembership = await prisma.roomMember.findUnique({
    where: { userId: user.id },
    include: {
      room: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  wxOpenId: true,
                }
              }
            }, // 包含房间的所有成员
          },
        }
      },
    }
  });
  // console.log("roomMembership", roomMembership);
  if (roomMembership) {
    return {
      isInRoom: true,
      room: roomMembership.room,

    };
  } else {
    return { isInRoom: false };
  }
}

/**
 * 删除或退出房间
 * @param roomId 房间ID
 * @param openid 微信openid
 * @returns 操作结果信息
 */
export async function deleteRoom(roomId: number, openid: string) {
  return await prisma.$transaction(async (tx) => {
    // 先检查房间是否存在
    const room = await tx.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      throw new Error("房间不存在");
    }

    // 获取用户信息
    const user = await tx.user.findUnique({
      where: { wxOpenId: openid },
      select: { id: true },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    // 查询用户在房间中的信息
    const roomMember = await tx.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: user.id,
          roomId: roomId
        }
      }
    });

    if (!roomMember) {
      throw new Error("用户不在房间中");
    }

    // 判断用户是否为房主
    if (room.ownerId === openid) {
      console.log("room.ownerId", roomId);
      // 如果是房主，解散整个房间
      await tx.room.delete({
        where: { id: roomId },
      });
      return { success: true, message: "房间已成功解散" };
    } else {
      // 如果不是房主，仅退出房间
      await tx.roomMember.delete({
        where: { id: roomMember.id }
      });
      return { success: true, message: "已成功退出房间" };
    }
  });
}

/**
 * 用户加入指定房间 (使用事务保证数据一致性)
 * @param roomId 房间ID
 * @param openid 微信openid
 * @returns 加入结果信息
 */
export async function joinRoom(roomId: number, openid: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. 先通过wxOpenId查找用户
    // console.log("openid", openid);
    const user = await tx.user.findUnique({
      where: { wxOpenId: openid },
      select: { id: true, name: true, avatarUrl: true },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    // 2. 查询房间是否存在
    const room = await tx.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("房间不存在");
    }

    // 3. 查询用户是否已经加入了房间
    const roomMembership = await tx.roomMember.findUnique({
      where: { userId: user.id },
    });

    if (roomMembership) {
      throw new Error("用户已在房间中");
    }

    // 4. 将用户添加到房间
    await tx.roomMember.create({
      data: {
        userId: user.id,
        roomId: roomId,
        role: "member",
        nickname: user.name || "",
        avatarUrl: user.avatarUrl || "",
        balance: 0,
      },
    });

    return { success: true, message: "加入房间成功" };
  });
}

/**
 * 获取用户信息
 * @param openid 微信openid
 * @returns 用户信息
 */
export async function getUserInfo(openid: string) {
  const user = await prisma.user.findUnique({
    where: { wxOpenId: openid },
    select: { id: true, name: true, avatarUrl: true, wxOpenId: true },
  });

  return user;
}

/**
 * 房主踢人功能
 * @param roomId 房间ID
 * @param kickedOpenid 被踢用户的openid
 * @param ownerOpenid 房主的openid
 * @returns 操作结果信息
 */
export async function kickMember(roomId: number, kickedOpenid: string, ownerOpenid: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. 检查房间是否存在
    const room = await tx.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      throw new Error("房间不存在");
    }

    // 2. 验证房主身份
    if (room.ownerId !== ownerOpenid) {
      throw new Error("只有房主可以踢人");
    }

    // 3. 获取被踢用户信息
    const kickedUser = await tx.user.findUnique({
      where: { wxOpenId: kickedOpenid },
      select: { id: true },
    });

    if (!kickedUser) {
      throw new Error("被踢用户不存在");
    }

    // 4. 检查被踢用户是否在房间中
    const kickedMember = await tx.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: kickedUser.id,
          roomId: roomId
        }
      }
    });

    if (!kickedMember) {
      throw new Error("被踢用户不在房间中");
    }

    // 5. 不能踢自己（房主）
    if (kickedOpenid === ownerOpenid) {
      throw new Error("房主不能踢自己");
    }

    // 8. 从房间中删除该成员
    await tx.roomMember.delete({
      where: { id: kickedMember.id }
    });

    // 9. 更新房间人数
    await tx.roomPopulation.update({
      where: { roomId: roomId },
      data: {
        memberCount: {
          decrement: 1
        }
      }
    });

    return { success: true, message: "成员已被成功移出房间" };
  });
}

