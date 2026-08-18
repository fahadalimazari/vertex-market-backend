import express from 'express';
import { 
  getContactSettings, updateContactSettings,
  getLanguages, updateLanguage,
  getCurrencies, updateCurrency,
  getCMSPages, getCMSPageBySlug, updateCMSPage,
  getFAQs, createFAQ, updateFAQ,
  getSupportTickets, createSupportTicket,
  trackOrderEndpoint, getShippingProviders
} from '../controllers/enterpriseController.js';
import { getAppSettings } from '../controllers/appSettingController.js';
import { registerUser } from '../controllers/authController.js';

const router = express.Router();

// 1. Contact Settings
router.route('/contact')
  .get(getContactSettings)
  .put(updateContactSettings);

// 2. Languages & Localization
router.route('/languages')
  .get(getLanguages);
router.route('/languages/:code')
  .put(updateLanguage);

// 3. Currencies & Exchange Rates
router.route('/currencies')
  .get(getCurrencies);
router.route('/currencies/:code')
  .put(updateCurrency);

// 4. CMS Legal & Informational Pages
router.route('/cms')
  .get(getCMSPages);
router.route('/cms/:slug')
  .get(getCMSPageBySlug)
  .put(updateCMSPage);

// 5. FAQ Management
router.route('/faqs')
  .get(getFAQs)
  .post(createFAQ);
router.route('/faqs/:id')
  .put(updateFAQ);

// 6. Support Center Tickets
router.route('/support')
  .get(getSupportTickets)
  .post(createSupportTicket);
router.route('/support/ticket')
  .post(createSupportTicket);

// 7. Order Tracking Engine
router.route('/order/track')
  .post(trackOrderEndpoint);
router.route('/shipping/providers')
  .get(getShippingProviders);

// 8. Enterprise Aliases Required by User
router.route('/app')
  .get(getAppSettings);
router.route('/seller/apply')
  .post(registerUser);
router.route('/settings')
  .get(async (req, res) => {
    res.json({ success: true, message: 'Vertex Enterprise Aggregated Settings Active', timestamp: Date.now() });
  });

export default router;
