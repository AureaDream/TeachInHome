/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    cloudEnvId: string,
    userInfo?: WechatMiniprogram.UserInfo,
    isLoggedIn: boolean
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}