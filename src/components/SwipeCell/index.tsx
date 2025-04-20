import { View, Text } from "@tarojs/components";
import { CSSProperties, FC, ReactNode, useEffect, useRef, useState } from "react";
import Taro from "@tarojs/taro";
import "./index.css";

interface SwipeCellProps {
  rightWidth?: number; // 右侧按钮区域宽度，单位为rpx
  leftWidth?: number; // 左侧按钮区域宽度，单位为rpx
  disabled?: boolean; // 是否禁用滑动
  children?: ReactNode; // 内容区域
  rightAction?: ReactNode; // 右侧操作区域
  leftAction?: ReactNode; // 左侧操作区域
  threshold?: number; // 滑动阈值，大于阈值时自动完成剩余滑动
  onOpen?: (position: 'left' | 'right') => void; // 打开时的回调
  onClose?: () => void; // 关闭时的回调
  className?: string; // 类名
}

const SwipeCell: FC<SwipeCellProps> = ({
  rightWidth = 160,
  leftWidth = 0,
  disabled = false,
  children,
  rightAction,
  leftAction,
  threshold = 0.3,
  onOpen,
  onClose,
  className
}) => {
  const [offset, setOffset] = useState(0); // 滑动偏移量
  const touchStartX = useRef(0);
  const startOffset = useRef(0);
  const swipeRef = useRef<any>(null);
  const moving = useRef(false);

  // 关闭滑动单元格
  const close = () => {
    setOffset(0);
    onClose?.();
  };

  // 打开左侧
  const openLeft = () => {
    if (leftWidth > 0) {
      setOffset(leftWidth);
      onOpen?.('left');
    }
  };

  // 打开右侧
  const openRight = () => {
    if (rightWidth > 0) {
      setOffset(-rightWidth);
      onOpen?.('right');
    }
  };

  // 处理触摸开始事件
  const handleTouchStart = (e) => {
    if (disabled) return;
    
    touchStartX.current = e.touches[0].clientX;
    startOffset.current = offset;
    moving.current = true;
  };

  // 处理触摸移动事件
  const handleTouchMove = (e) => {
    if (disabled || !moving.current) return;
    
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStartX.current;
    let newOffset = startOffset.current + deltaX;

    // 限制偏移范围
    if (newOffset > leftWidth) {
      newOffset = leftWidth;
    } else if (newOffset < -rightWidth) {
      newOffset = -rightWidth;
    }

    setOffset(newOffset);
  };

  // 处理触摸结束事件
  const handleTouchEnd = () => {
    if (disabled || !moving.current) return;
    moving.current = false;

    // 根据偏移量和阈值来决定是展开还是收起
    if (offset > 0) {
      // 左侧展开逻辑
      if (offset > leftWidth * threshold) {
        openLeft();
      } else {
        close();
      }
    } else if (offset < 0) {
      // 右侧展开逻辑
      if (Math.abs(offset) > rightWidth * threshold) {
        openRight();
      } else {
        close();
      }
    }
  };

  // 点击内容区域关闭
  const handleContentClick = () => {
    if (offset !== 0) {
      close();
    }
  };

  // 设置内容样式
  const contentStyle: CSSProperties = {
    transform: `translateX(${offset}rpx)`,
    transition: moving.current ? 'none' : 'transform 0.3s'
  };

  // 点击蒙层关闭
  useEffect(() => {
    const handleOverlayClick = () => {
      if (offset !== 0) {
        close();
      }
    };

    // 添加事件监听
    Taro.eventCenter.on('overlay-click', handleOverlayClick);

    return () => {
      // 移除事件监听
      Taro.eventCenter.off('overlay-click', handleOverlayClick);
    };
  }, [offset]);

  return (
    <View className={`${className} swipe-cell `}>
      {/* 左侧操作区域 */}
      {leftAction && (
        <View 
          className="swipe-cell__left" 
          style={{ width: `${leftWidth}rpx` }}
        >
          {leftAction}
        </View>
      )}

      {/* 内容区域 */}
      <View
        className="swipe-cell__content"
        style={contentStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleContentClick}
      >
        {children}
      </View>

      {/* 右侧操作区域 */}
      {rightAction && (
        <View 
          className="swipe-cell__right" 
          style={{ width: `${rightWidth}rpx` }}
        >
          {rightAction}
        </View>
      )}
    </View>
  );
};

export default SwipeCell;