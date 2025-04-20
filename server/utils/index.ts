// 辅助函数
export function generateRoomId(): string {
  return "A" + Math.random().toString(36).substr(2, 5).toUpperCase();
}

export function generateMemberId(): string {
  return "M" + Math.random().toString(36).substr(2, 8);
}

