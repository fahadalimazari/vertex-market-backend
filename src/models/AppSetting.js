import mongoose from 'mongoose';

const appSettingSchema = new mongoose.Schema(
  {
    androidLink: {
      type: String,
      default: 'https://play.google.com/store/apps/details?id=com.vertex.market',
    },
    iosLink: {
      type: String,
      default: 'https://apps.apple.com/app/vertex-market',
    },
    appGalleryLink: {
      type: String,
      default: 'https://appgallery.huawei.com/app/C10000000',
    },
    qrCode: {
      type: String,
      default: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://vertex-market.com/app-download',
    },
    version: {
      type: String,
      default: '2.4.0',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    features: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const AppSetting = mongoose.model('AppSetting', appSettingSchema);

export default AppSetting;
