export default {
  pages: ["pages/index/index","pages/room/index", "pages/profile/index"],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "WeChat",
    navigationBarTextStyle: "black",
  },
  tabBar: {
    list: [
      {
        pagePath: "pages/room/index",
        text: "记账",
        iconPath: "./styles/icon/room-active.png",
        selectedIconPath: "./styles/icon/room-active.png",
      },
      {
        pagePath: "pages/profile/index",
        text: "我的",
        iconPath: "./styles/icon/profile-active.png",
        selectedIconPath: "./styles/icon/profile-active.png",
      },
    ],
  }
};
