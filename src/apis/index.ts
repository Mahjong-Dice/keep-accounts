import Taro from "@tarojs/taro";
import request from "./request";


export const createUser = async (code: string, userInfo: any) => {
  const data = await request<{ openid: string; room: any, token: string }>({
    url: `${process.env.TARO_APP_URL}/api/wechat/auth`,
    method: "POST",
    data: {
      code,
      userInfo
    }
  });

  console.log("createUser", data);

  return data;
}

// 使用 Taro.login 获取 code
export const login = async () => {
  return new Promise((resolve, reject) => {
    Taro.login({
      success: async function (res) {
        try {

          if (res.code) {
            const userInfo = Taro.getStorageSync("userInfo");

            const data = await request<{ openid: string; room: any, token: string }>({
              url: `${process.env.TARO_APP_URL}/api/wechat/auth-with-room`,
              method: "POST",
              data: {
                code: res.code,
                userInfo: userInfo
              }
            });

            if (data.token) {
              Taro.setStorageSync("token", data.token);
            }

            if (data.openid) {
              Taro.setStorageSync("openid", data.openid);
              resolve(data.openid);
            } else {
              reject(false);
            }
          } else {
            console.log("登录失败！" + res.errMsg);
            reject(false);
          }
        } catch (error) {
          console.log(error);
          reject(false);
        }
      },
    });
  });
};

/** 获取当前所在room
 * 
 * @param openid 
 * @returns 
 */
export const getRoom = async (openid: string) => {
  try {
    const room = await request({
      url: `${process.env.TARO_APP_URL}/api/rooms?openid=${openid}`,
      method: "GET",
    });
    // console.log("getRoom", room);
    return room;
  } catch (error) {
    throw error;
  }
};

/** 删除房间
 * 
 * @param roomId 
 * @returns 
 */
export const deleteRoom = async (roomId: string, openid: string) => {
  try {
    console.log("deleteRoom", roomId);
    const room = await request({
      url: `${process.env.TARO_APP_URL}/api/rooms/${roomId}`,
      method: "DELETE",
      data: {
        openid,
        roomId
      }
    });

    return room;
  } catch (error) {
    throw error;
  }
}

/** 加入房间
 * 
 * @param roomId 
 * @param openid 
 * @returns 
 */
export const joinRoom = async (roomId: number, openid: string) => {
  try {
    const room = await request({
      url: `${process.env.TARO_APP_URL}/api/join-room`,
      method: "POST",
      data: {
        roomId,
        openid
      }
    });

    return room;
  } catch (error) {
    throw error;
  }
}

/** 获取用户信息
 * 
 * @returns 
 */
export const getUserInfo = () => {
  return new Promise((resolve, reject) => {
    Taro.getUserProfile({
      desc: '用于完善用户资料', // 必须填写，会显示在授权弹窗中
      success: (res) => {
        // 获取成功，返回用户信息
        resolve(res.userInfo);
      },
      fail: (err) => {
        // 获取失败，返回错误信息
        reject(err);
      }
    });
  });
};

/** 创建转账交易
 * 
 * @param senderOpenid 发送方的OpenID
 * @param receiverOpenid 接收方的OpenID
 * @param amount 转账金额（必须为正数）
 * @param description 可选的描述
 * @returns 
 */
export const createTransaction = async (
  senderOpenid: string, 
  receiverOpenid: string, 
  amount: number,
  description?: string
) => {
  try {
    const result = await request({
      url: `${process.env.TARO_APP_URL}/api/transactions`,
      method: "POST",
      data: {
        senderOpenid,
        receiverOpenid,
        amount,
        description
      }
    });
    
    return result;
  } catch (error) {
    throw error;
  }
};

/** 获取用户信息(数据库)
 * 
 * @param openid 
 * @returns 
 */
export const getUserInfoFromDB = async (openid: string) => {
  return await request({
    url: `${process.env.TARO_APP_URL}/api/users/${openid}`, 
    method: "GET",
  });
} 

/** 房主踢出成员
 * 
 * @param roomId 房间ID
 * @param kickedOpenid 被踢用户的openid
 * @param ownerOpenid 房主的openid
 * @returns 
 */
export const kickMember = async (roomId: number, kickedOpenid: string, ownerOpenid: string) => {
  try {
    // console.log("kickMember", roomId, kickedOpenid, ownerOpenid);
    const result = await request({
      url: `${process.env.TARO_APP_URL}/api/rooms/${roomId}/kick-member`,
      method: "POST",
      data: {
        kickedOpenid,
        ownerOpenid
      }
    });
    
    return result;
  } catch (error) {
    throw error;
  }
};

/** 获取房间交易历史记录
 * 
 * @param roomId 房间ID
 * @returns 交易历史列表
 */
export const getRoomTransactions = async (roomId: number) => {
  try {
    const result = await request({
      url: `${process.env.TARO_APP_URL}/api/rooms/${roomId}/transactions`,
      method: "GET"
    });
    
    return result;
  } catch (error) {
    console.error("获取交易记录失败:", error);
    throw error;
  }
};
