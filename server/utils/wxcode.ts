// server/utils/wxcode.ts
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// 首先需要创建一个存储图片的目录
const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 获取微信接口调用凭证
export async function getAccessToken() {
  const WECHAT_APPID = process.env.WECHAT_APPID;
  const WECHAT_SECRET = process.env.WECHAT_SECRET;

  if (!WECHAT_APPID || !WECHAT_SECRET) {
    throw new Error('微信应用凭证未设置');
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}`;
  const response = await axios.get(url);
  console.log("response", response.data);
  if (response.data.access_token) {
    return response.data.access_token;
  } else {
    throw new Error('获取access_token失败');
  }
}

// 生成小程序码
interface IGenerateMiniProgramCodeProps {
  scene?: string;
  page?: string;
  env_version?: string;
  width?: number;
  check_path?: boolean
}
export async function generateMiniProgramCode(options: IGenerateMiniProgramCodeProps): Promise<{url: string, scene: string}> {
  try {
    // 生成固定的文件名，只使用scene作为标识
    const fileName = `qrcode_${options.scene || 'default'}.png`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    // 构建URL路径
    const fileUrl = `/uploads/${fileName}`;
    
    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      // 文件已存在，直接返回
      return {
        url: fileUrl,
        scene: options.scene || ''
      };
    }
    
    // 文件不存在，获取access_token并生成
    const accessToken = await getAccessToken();

    // 调用微信接口生成不限制数量的小程序码
    const res = await axios.post(
      `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
      {
       ...options,
        width: 430  // 二维码宽度
      },
      { responseType: 'arraybuffer' } // 注意接收二进制数据
    );
    
    // 将二进制数据写入文件
    fs.writeFileSync(filePath, res.data);
    
    return {
      url: fileUrl,
      scene: options.scene || ''
    };
  } catch (error) {
    console.error('生成小程序码出错:', error);
    throw error;
  }
}

