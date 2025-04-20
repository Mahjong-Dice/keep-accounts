import { View, Text, Image } from "@tarojs/components";
import { memo, useCallback } from "react";
import Taro from "@tarojs/taro";
import { getRoomTransactions } from "@/apis";
import "@/styles/css/historyTransfer.css";
import { useQuery } from "@/hooks/useQuery";

interface Transaction {
    id: number;
    amount: number;
    createdAt: string;
    from: {
        name: string;
        avatarUrl: string;
    };
    to: {
        name: string;
        avatarUrl: string;
    };
}

const HistoryOfTransfer = () => {
    const fetchTransactions = useCallback(async () => {
        const roomId = Taro.getStorageSync("roomId");
        if (!roomId) {
            Taro.showToast({ title: "找不到房间信息", icon: "none" });
            throw new Error("找不到房间信息");
        }

        const result = await getRoomTransactions(roomId);
        if (!result) {
            throw new Error("获取交易记录失败");
        }
        
        return result;
    }, []);

    const onError = useCallback((error: any) => {
        console.error("获取交易记录失败:", error);
        // Taro.showToast({ title: error?.message || "获取交易记录失败", icon: "none" });
    }, []);

    const { 
        data: transactions = [], 
        isLoading, 
        isError 
    } = useQuery<Transaction[]>({
        queryFn: fetchTransactions,
        interval: 2000,
        onError
    });

    // 格式化日期时间
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <View className="history-container">
            {isLoading ? (
                <View className="loading-text">加载中...</View>
            ) : transactions.length === 0 ? (
                <View className="empty-text">暂无交易记录</View>
            ) : (
                <View className="transaction-list">
                    {transactions.map(transaction => (
                        <View key={transaction.id} className="transaction-item">
                            <View className="transaction-main">
                                <View className="transaction-info">
                                    <Text className="transaction-names">
                                        {transaction.from.name} → {transaction.to.name}
                                    </Text>
                                    <Text className="transaction-amount">¥{transaction.amount}</Text>
                                </View>
                            </View>
                            <Text className="transaction-time">{formatDate(transaction.createdAt)}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

export default memo(HistoryOfTransfer);
