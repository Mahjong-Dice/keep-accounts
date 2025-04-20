/// <reference types="@tarojs/taro" />
/// <reference types="@taro-hooks/plugin-react" />
import '@taro-hooks/plugin-react';

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.styl';

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'quickapp' | 'qq' | 'jd'
  }
}

// 用户成员类型定义
export interface Member {
  userId: number | string;   // 用户ID
  nickname: string;          // 用户昵称
  avatarUrl: string;         // 用户头像URL
  user: {
    wxOpenId: string;          // 用户微信openid
  }
  id: number;
  balance: number;
  role: string;
  roomId: number;
  createdAt: string;
  // 可以根据需要添加其他字段
}


