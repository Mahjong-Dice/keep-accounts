import { Button, View } from "@tarojs/components";
import { FC } from "react";
import Taro from "@tarojs/taro";
import { deleteRoom } from "@/apis";
interface IProfileProps { }

const Profile: FC<IProfileProps> = () => {

  const handleDeleteRoom = async () => {
    try {
      const roomId = Taro.getStorageSync("roomId");
      const openid = Taro.getStorageSync("openid");
      await deleteRoom(roomId, openid)
      // 删除房间后，返回首页
      Taro.reLaunch({
        url: "/pages/index/index",
      });
      clearStorage();
      Taro.hideToast();
      Taro.showToast({
        title: "退出房间成功",
        icon: "success",
      });
    } catch (error) {
      console.log(error);
      Taro.showToast({
        title: "退出房间失败",
        icon: "none",
      });
    }
  }

  const clearStorage = () => {
    Taro.clearStorageSync();
  }

  return <View>
    <Button style={{width: "98%"}} onClick={handleDeleteRoom} type="warn">
      退出房间
    </Button>
  </View>;
};

export default Profile;
