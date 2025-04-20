import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 创建交易记录，在发送方和接收方之间转账
 * 
 * @param senderOpenid 发送方的微信OpenID
 * @param receiverOpenid 接收方的微信OpenID
 * @param amount 交易金额
 * @param description 交易描述
 * @returns 交易结果信息
 */
export async function createTransaction(senderOpenid: string, receiverOpenid: string, amount: number, description?: string) {
  return await prisma.$transaction(async (tx: any) => {
    // 1. 找到发送方用户
    const sender = await tx.user.findUnique({
      where: { wxOpenId: senderOpenid },
      include: { member: true }
    });

    if (!sender || !sender.member) {
      throw new Error('发送方用户不存在或未加入房间');
    }

    // 2. 找到接收方用户
    const receiver = await tx.user.findUnique({
      where: { wxOpenId: receiverOpenid },
      include: { member: true }
    });

    if (!receiver || !receiver.member) {
      throw new Error('接收方用户不存在或未加入房间');
    }

    // 3. 检查是否在同一房间
    if (sender.member.roomId !== receiver.member.roomId) {
      throw new Error('发送方和接收方必须在同一房间内');
    }

    // 4. 从发送方扣除金额
    await tx.roomMember.update({
      where: { id: sender.member.id },
      data: { balance: { decrement: amount } }
    });

    // 5. 给接收方增加金额
    await tx.roomMember.update({
      where: { id: receiver.member.id },
      data: { balance: { increment: amount } }
    });

    // 6. 创建交易记录
    const transfer = await tx.transfer.create({
      data: {
        fromMemberId: sender.member.id,
        toMemberId: receiver.member.id,
        amount,
        status: 'completed',
        roomId: sender.member.roomId,
      }
    });

    // 7. 返回交易结果
    return {
      transactionId: transfer.id,
      sender: {
        openid: senderOpenid,
        newBalance: sender.member.balance.minus(amount)
      },
      receiver: {
        openid: receiverOpenid,
        newBalance: receiver.member.balance.plus(amount)
      },
      amount,
      description,
      status: 'completed',
      timestamp: transfer.createdAt
    };
  });
}

/**
 * 获取指定房间的交易历史记录
 * 
 * @param roomId 房间ID
 * @returns 交易历史列表
 */
export async function getRoomTransactions(roomId: string) {
  try {
    // 转换房间ID为数字
    const roomIdNum = parseInt(roomId, 10);
    
    if (isNaN(roomIdNum)) {
      throw new Error('无效的房间ID');
    }

    // 查询该房间的所有交易记录
    const transactions = await prisma.transfer.findMany({
      where: {
        roomId: roomIdNum
      },
      include: {
        fromMember: {
          include: {
            user: {
              select: {
                wxOpenId: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        toMember: {
          include: {
            user: {
              select: {
                wxOpenId: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 格式化交易记录
    return transactions.map((transaction: any) => ({
      id: transaction.id,
      amount: transaction.amount,
      status: transaction.status,
      createdAt: transaction.createdAt,
      from: {
        memberId: transaction.fromMemberId,
        openid: transaction.fromMember.user.wxOpenId,
        name: transaction.fromMember.user.name || transaction.fromMember.nickname,
        avatarUrl: transaction.fromMember.user.avatarUrl || transaction.fromMember.avatarUrl
      },
      to: {
        memberId: transaction.toMemberId,
        openid: transaction.toMember.user.wxOpenId,
        name: transaction.toMember.user.name || transaction.toMember.nickname,
        avatarUrl: transaction.toMember.user.avatarUrl || transaction.toMember.avatarUrl
      }
    }));
  } catch (error) {
    // console.error('获取房间交易历史失败:', error);
    throw error;
  }
} 