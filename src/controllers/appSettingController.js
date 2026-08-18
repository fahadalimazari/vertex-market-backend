import AppSetting from '../models/AppSetting.js';
import { sendResponse } from '../utils/responseFormatter.js';

/**
 * @desc    Get mobile app download settings and features
 * @route   GET /api/v1/app-settings
 * @access  Public
 */
export const getAppSettings = async (req, res, next) => {
  try {
    let settings = await AppSetting.findOne({});
    
    // Automatically pre-seed default settings if collection is empty
    if (!settings) {
      settings = await AppSetting.create({
        androidLink: 'https://play.google.com/store/apps/details?id=com.vertex.market',
        iosLink: 'https://apps.apple.com/app/vertex-market',
        appGalleryLink: 'https://appgallery.huawei.com/app/C10000000',
        qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://vertex-market.com/app-download',
        version: '2.4.0',
        status: 'Active',
        features: [
          'Faster Checkout',
          'Exclusive Discounts',
          'AI Shopping Assistant',
          'Order Tracking',
          'Flash Sales',
        ],
      });
    }

    sendResponse(res, 200, 'App settings fetched successfully', settings);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update mobile app settings (Links, version, features, status)
 * @route   PUT /api/v1/app-settings
 * @access  Private/Super Admin, Admin
 */
export const updateAppSettings = async (req, res, next) => {
  try {
    const { androidLink, iosLink, appGalleryLink, qrCode, version, status, features } = req.body;

    let settings = await AppSetting.findOne({});
    
    if (!settings) {
      settings = new AppSetting();
    }

    if (androidLink !== undefined) settings.androidLink = androidLink;
    if (iosLink !== undefined) settings.iosLink = iosLink;
    if (appGalleryLink !== undefined) settings.appGalleryLink = appGalleryLink;
    if (qrCode !== undefined) settings.qrCode = qrCode;
    if (version !== undefined) settings.version = version;
    if (status !== undefined) settings.status = status;
    if (features !== undefined && Array.isArray(features)) settings.features = features;

    await settings.save();

    sendResponse(res, 200, 'App settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};
