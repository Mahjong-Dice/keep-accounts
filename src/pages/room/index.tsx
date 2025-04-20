import {
  View,
  Text,
  ScrollView,
  Image,
  Button,
  Canvas,
} from "@tarojs/components";
import Taro, { useShareAppMessage } from "@tarojs/taro";
import { useEffect, useRef, useCallback } from "react";
import "@/styles/css/room.css";
import { useState, useMemo } from "react";
import { getRoom, getUserInfoFromDB, kickMember } from "@/apis";
import TransferModal from "@/components/TransferModal";
import { Member } from "../../../types/global";
import SwipeCell from "@/components/SwipeCell";
import HistoryOfTransfer from "@/components/HistoryOfTransfer";
import { useQuery } from "@/hooks/useQuery";

interface RoomInfo {
  id: number;
  name: string;
  members: Member[];
  createdAt: string;
  qrCodeUrl: string;
  inviteToken: string;
  status: string;
  ownerId: string;
}

const Index = () => {
  const roomId = Taro.getStorageSync("roomId");
  const [showShare, setShowShare] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  // 使用 useQuery 代替定时器
  const fetchRoom = useCallback(async () => {
    const openid = Taro.getStorageSync("openid");
    const res = await getRoom(openid);

    if (!res.room) {
      Taro.reLaunch({
        url: "/pages/index/index",
      });
      throw new Error("找不到房间信息");
    }

    return res.room;
  }, []);

  const onSuccess = useCallback((room) => {
    setQrDataUrl(`${process.env.TARO_APP_URL}${room.qrCodeUrl}`);
    Taro.setStorageSync("roomId", room.id);
    Taro.setNavigationBarTitle({
      title: room.name,
    });
  }, []);

  const onError = useCallback((error) => {
    console.error("获取房间信息失败:", error);
    Taro.showToast({
      title: error?.message || "获取房间信息失败",
      icon: "none"
    });
  }, []);

  const onMaxErrorsReached = useCallback(() => {
    Taro.reLaunch({
      url: "/pages/index/index",
    });
  }, []);

  const {
    data: roomInfo,
    isLoading,
  } = useQuery({
    queryFn: fetchRoom,
    interval: 2000,
    onSuccess,
    onError,
    onMaxErrorsReached
  });

  // 添加页面分享配置
  useShareAppMessage(() => {
    return {
      title: "加入我的房间",
      path: `/pages/room/index?roomId=${roomId}`,
      imageUrl: qrDataUrl || "",
    };
  });

  return (
    <View className="room">
      {isLoading && !roomInfo ? (
        <View className="loading-container">
          <Text className="loading-text">加载中...</Text>
        </View>
      ) : (
        <>
          <View className="room-header">
            <Text className="room-title">{roomInfo?.name}</Text>
            <View className="room-info">
              <Text className="room-desc">房间码：{roomInfo?.inviteToken || roomInfo?.id}</Text>
              <Text className="room-desc">房间人数：{roomInfo?.members?.length}</Text>
            </View>
          </View>
          <View className="room-body">
            <MemberList members={roomInfo?.members || []} roomOwner={roomInfo?.ownerId || ""} />
            <HistoryOfTransfer />
          </View>
          <Button className="share-room-button" onClick={() => setShowShare(true)}>分享房间</Button>
          {showShare && (
            <View className="share-modal">
              <View className="share-content">
                <Text className="share-title">微信扫描二维码加入</Text>
                <Text className="share-room-id">房号：{roomId}</Text>
                <View className="qrcode-container">
                  {qrDataUrl && (
                    <Image
                      src={qrDataUrl}
                      style={{ width: "300rpx", height: "300rpx" }}
                    />
                  )}
                </View>
                <View className="share-buttons">
                  <Button openType="share" className="share-button">
                    转发给好友
                  </Button>
                  <Button
                    onClick={() => setShowShare(false)}
                    className="close-button"
                  >
                    关闭
                  </Button>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const MemberList = ({ members, roomOwner }: { members: Member[], roomOwner: string }) => {
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const currentOpenid = Taro.getStorageSync("openid");
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    getUserInfoFromDB(currentOpenid).then((res) => {
      setUserInfo(res);
    });
  }, []);

  const handleMemberClick = (member: Member) => {
    // 检查点击的是否为自己 
    if (member.userId === userInfo.id) {
      Taro.showToast({
        title: "不能给自己转账",
        icon: "none",
      });
      return;
    }

    // 设置选中的成员并打开转账窗口
    setSelectedMember(member);
    setShowTransfer(true);
  };

  const handleDelete = async (member: Member) => {
    try {
      const res = await Taro.showModal({
        title: '提示',
        content: '确定要删除吗？',

      });
      if (res.confirm) {
        const roomId = Taro.getStorageSync("roomId");
        await kickMember(roomId, member.user.wxOpenId, roomOwner);
        Taro.showToast({ title: '删除成功', icon: 'success' });
      }
    } catch (error) {
      Taro.showToast({ title: '删除失败', icon: 'none' });
    }
  };

  return (
    <View className="member-list">
      {members.map((member) => (
        // <View className="member-item" key={member.id}>
        <SwipeCell
          disabled={roomOwner !== currentOpenid}
          key={member.id}
          rightWidth={180}
          // leftWidth={120}
          rightAction={
            roomOwner !== member.user.wxOpenId && (
              <Button type="warn" onClick={() => handleDelete(member)}>踢出</Button>
            )

          }
        // onOpen={(position) => console.log(`打开 ${position} 侧`)}
        // onClose={() => console.log('关闭')}
        >
          <View
            key={member.id}
            className="member-item"
            onClick={() => handleMemberClick(member)}
          >
            <Image className="member-avator" src={member.avatarUrl}></Image>
            <Text className="member-name">{member.nickname}</Text>
            <Text className="member-tag" style={{ display: roomOwner === member.user.wxOpenId ? "block" : "none" }}>（房主）</Text>
            <Text
              className="member-banlance"
              style={{ color: member.balance >= 0 ? 'green' : 'red' }}
            >
              ¥ {member.balance}
            </Text>
          </View>
        </SwipeCell>
        // </View>

      ))
      }



      {
        showTransfer && selectedMember && (
          <TransferModal
            isOpen={showTransfer}
            onClose={() => setShowTransfer(false)}
            receiver={selectedMember}
          />
        )
      }
    </View >
  );
};

export default Index;
