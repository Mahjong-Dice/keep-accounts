import React, { useEffect, useState } from "react";
import { View } from "@tarojs/components";
import { Home } from "./home";

import "./index.css";
import Taro from "@tarojs/taro";
import { getRoom } from "@/apis";

const Index = () => {
  const [isInRoom, setIsInRoom] = useState(false);

  Taro.useLoad(() => {
    // 判断是否已经登录
    const openid = Taro.getStorageSync("openid");
    if (openid) {
      // 获取房间信息
      getRoom(openid).then((room) => {
        if (room?.isInRoom) {
          Taro.nextTick(() => {
            setIsInRoom(true);
            Taro.switchTab({
              url: "/pages/room/index",
            });
          })
        }
      }).catch((err) => {
        console.log(err);
        setIsInRoom(false);
      });
    }
  });

  return <View className="wrapper">
    {!isInRoom && <Home />}
  </View>;

};

export default Index;
