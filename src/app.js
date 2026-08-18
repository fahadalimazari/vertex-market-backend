import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import productRoutes from './routes/productRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import subCategoryRoutes from './routes/subCategoryRoutes.js';
import attributeRoutes from './routes/attributeRoutes.js';
import attributeValueRoutes from './routes/attributeValueRoutes.js';
import productAttributeRoutes from './routes/productAttributeRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import adminSellerRoutes from './routes/adminSellerRoutes.js';
import appSettingRoutes from './routes/appSettingRoutes.js';
import enterpriseRoutes from './routes/enterpriseRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import heroBannerRoutes from './routes/heroBannerRoutes.js';
import heroFlashSaleRoutes from './routes/heroFlashSaleRoutes.js';
import { getHomeFlashSale } from './controllers/heroFlashSaleController.js';
import featuredCategoryRoutes from './routes/featuredCategoryRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import bundleRoutes from './routes/bundleRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import couponRoutes from './routes/couponRoutes.js';

const app = express();

// Security Middlewares - configured to allow cross-origin images/media from uploads
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Body parser
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection

// Rate limiting
const limiter = rateLimit({
  max: 10000, // Increased limit for local development and testing
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Serve uploads statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/superadmin', superAdminRoutes);
app.use('/api/v1/seller', sellerRoutes); // Added seller routes
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/collections', collectionRoutes);
app.use('/api/v1/subcategories', subCategoryRoutes);
app.use('/api/v1/attributes', attributeRoutes);
app.use('/api/v1/attribute-values', attributeValueRoutes);
app.use('/api/v1/product-attributes', productAttributeRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Compatibility Mounts (without v1)
app.use('/api/categories', categoryRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/subcategories', subCategoryRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/attribute-values', attributeValueRoutes);
app.use('/api/product-attributes', productAttributeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/admin/crm', crmRoutes);
app.use('/api/v1/admin/sellers', adminSellerRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/app-settings', appSettingRoutes);
app.use('/api/app-settings', appSettingRoutes);
app.use('/api/v1/deals', dealRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/v1/flash-sales', heroFlashSaleRoutes);
app.use('/api/flash-sales', heroFlashSaleRoutes);
app.get('/api/v1/home/flash-sale', getHomeFlashSale);
app.get('/api/home/flash-sale', getHomeFlashSale);
app.use('/api/v1/search', searchRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/v1/hero-banners', heroBannerRoutes);
app.use('/api/hero-banners', heroBannerRoutes);
app.use('/api/v1/home/featured-categories', featuredCategoryRoutes);
app.use('/api/home/featured-categories', featuredCategoryRoutes);
app.use('/api/v1', enterpriseRoutes);
app.use('/api', enterpriseRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/bundles', bundleRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/coupons', couponRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vertex-market-backend' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
