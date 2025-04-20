// src/utils/request.ts
import Taro from "@tarojs/taro";

const request = <T = any>(options: Taro.request.Option) => {
  return new Promise<T>((resolve, reject) => {
    const token = Taro.getStorageSync("token");
    if (token) {
      options.header = {
        ...options.header,
        Authorization: `Bearer ${token}`,
      };
    }
    Taro.request({
      ...options,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data.data);
        } else {
          reject(res.data.data);
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
};

export default request;
