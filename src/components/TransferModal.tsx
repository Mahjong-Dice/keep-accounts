import { View, Text, Input, Button, Image } from "@tarojs/components";
import { useState } from "react";
import Taro from "@tarojs/taro";
import { Member } from "../../types/global";
import { createTransaction } from "@/apis";
import "@/styles/css/transfer.css";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiver: Member;
}

const TransferModal = ({ isOpen, onClose, receiver }: TransferModalProps) => {
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Taro.showToast({ title: "请输入正确的金额", icon: "none" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const senderOpenid = Taro.getStorageSync("openid");
      
      // 调用转账API
      await createTransaction(
        senderOpenid,
        receiver.user.wxOpenId,
        parseFloat(amount)
      );
      
      Taro.showToast({ title: "转账成功", icon: "success" });
      onClose();
    } catch (error) {
      console.error("转账失败:", error);
      Taro.showToast({ title: "转账失败，请重试", icon: "none" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <View className="transfer-modal">
      <View className="transfer-content">
        <View className="transfer-header">
          <Text className="transfer-title">转账</Text>
          <Text className="transfer-close" onClick={onClose}>×</Text>
        </View>
        
        <View className="transfer-body">
          <View className="receiver-info">
            <Image className="receiver-avatar" src={receiver.avatarUrl} />
            <Text className="receiver-name">{receiver.nickname}</Text>
          </View>
          
          <View className="amount-section">
            <Text className="amount-label">金额</Text>
            <View className="amount-input-container">
              <Text className="currency-symbol">¥</Text>
              <Input
                className="amount-input"
                type="digit"
                value={amount}
                onInput={(e) => setAmount(e.detail.value)}
                placeholder="请输入金额（必须为正数）"
              />
            </View>
          </View>
        </View>
        
        <View className="transfer-footer">
          <Button 
            className="cancel-button" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button 
            className="confirm-button"
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
          >
            确认
          </Button>
        </View>
      </View>
    </View>
  );
};

export default TransferModal; 