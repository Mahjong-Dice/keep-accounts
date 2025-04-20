import { View, Text, Button } from "@tarojs/components";
import { FC, useEffect, useState } from "react";
import Taro from "@tarojs/taro"; // 新增：引入Taro
import { getRoom, getUserInfo, joinRoom, login, createUser } from "@/apis";

import "../../styles/css/home.css";

interface IHomeProps { }

export const Home: FC<IHomeProps> = () => {

  const handleJoinClick = async () => {
    try {
      Taro.showLoading({
        title: '加入房间中...'
      });
      const openid = Taro.getStorageSync("openid");
      const res: any = await Taro.showModal({
        title: '加入房间',
        content: '',
        // @ts-ignore
        placeholderText: '请输入房间ID',
        editable: true,
      });
      if (res.confirm) {
        const roomId = res.content.trim();

        const userInfo = await getUserInfo();
        Taro.setStorageSync("userInfo", userInfo);

        const loginRes = await Taro.login();
        const { token } = await createUser(loginRes.code, userInfo);
        console.log("token", token);
        if (token) {
          Taro.setStorageSync("token", token);
        }
        // 加入房间
        await joinRoom(+roomId, openid);

        Taro.setStorageSync("token", token);

        Taro.nextTick(async () => {
          await Taro.switchTab({
            url: "/pages/room/index",
          });
          Taro.showToast({
            title: '加入房间成功',
            icon: 'success'
          });

        })
      }
    } catch (error) {
      console.log("加入房间失败", error);
      Taro.showToast({
        title: '加入房间失败',
        icon: 'none'
      });
    } finally {
      setTimeout(() => {
        Taro.hideLoading();
      }, 500);
    }
  };

  const handleCreateClick = async () => {
    try {
      Taro.showLoading({
        title: '创建房间中...'
      });
      const userInfo = await getUserInfo();
      Taro.setStorageSync("userInfo", userInfo);
      await login();
      Taro.switchTab({
        url: "/pages/room/index",
      });
    } catch (error) {
      console.log("用户拒绝授权", error);
      Taro.showToast({
        title: '用户拒绝授权',
        icon: 'none'
      });
    } finally {
      Taro.hideLoading();
    }
  };

  return (
    <View className="home">
      <View className="logo">记</View>
      <View className="title">骰子记账</View>
      <Text className="desc">简单、便捷的多人记账工具</Text>
      <View className="button-group">
        <Button className="button" onClick={handleCreateClick}>
          创建房间
        </Button>
        <Button className="button button-join" onClick={handleJoinClick}>
          加入房间
        </Button>
      </View>
      {/* <RoomOfHistory /> */}
    </View>
  );
};

function RoomOfHistory() {
  return (
    <View className="his">
      <Text className="his-title">最近的房间</Text>
      <View className="his-item">
        <View className="his-item-avator">聚</View>
        <View className="his-item-content">
          <Text className="his-item-title">聚餐AA</Text>
          <Text className="his-item-desc">4人</Text>
        </View>
        <View className="arrow-right"></View>
      </View>
    </View>
  );
}
