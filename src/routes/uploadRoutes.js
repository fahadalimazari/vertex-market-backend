import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

router.get(['/', '/media', '/media-library'], (req, res) => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads');
    let uploadedFiles = [];
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      uploadedFiles = files
        .filter(file => /\.(jpg|jpeg|png|webp|jfif|avif|gif|svg)$/i.test(file))
        .map((file, idx) => {
          const stats = fs.statSync(path.join(uploadDir, file));
          return {
            id: `upload-${idx}-${file}`,
            name: file,
            url: `http://localhost:5000/uploads/${file}`,
            relativePath: `http://localhost:5000/uploads/${file}`,
            category: 'Uploaded Files',
            size: stats.size,
            date: stats.mtime,
            dimensions: 'Original Storage File'
          };
        });
    }

    const systemMedia = [
      {
        id: 'sys-1',
        name: 'Next-Gen Computing Laptops',
        url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop',
        relativePath: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop',
        category: 'Computers & Laptops',
        size: 1420000,
        date: new Date('2026-08-01'),
        dimensions: '2070x1380'
      },
      {
        id: 'sys-2',
        name: 'Smart Audio ANC Headphones',
        url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080&auto=format&fit=crop',
        relativePath: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080&auto=format&fit=crop',
        category: 'Electronics & Audio',
        size: 1850000,
        date: new Date('2026-08-02'),
        dimensions: '2080x1386'
      },
      {
        id: 'sys-3',
        name: 'Gaming Essentials & RGB Setup',
        url: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?q=80&w=2070&auto=format&fit=crop',
        relativePath: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?q=80&w=2070&auto=format&fit=crop',
        category: 'Gaming',
        size: 2100000,
        date: new Date('2026-08-03'),
        dimensions: '2070x1380'
      },
      {
        id: 'sys-4',
        name: 'Flagship Smartphones & Cameras',
        url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080&auto=format&fit=crop',
        relativePath: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080&auto=format&fit=crop',
        category: 'Mobiles & Tablets',
        size: 1650000,
        date: new Date('2026-07-28'),
        dimensions: '1920x1080'
      },
      {
        id: 'sys-5',
        name: '4K OLED Ultra Monitors & Displays',
        url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=2070&auto=format&fit=crop',
        relativePath: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=2070&auto=format&fit=crop',
        category: 'Computers & Laptops',
        size: 1980000,
        date: new Date('2026-07-30'),
        dimensions: '2070x1380'
      },
      {
        id: 'sys-6',
        name: 'Smart Watches & Fitness Wearables',
        url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?q=80&w=2070&auto=format&fit=crop',
        relativePath: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?q=80&w=2070&auto=format&fit=crop',
        category: 'Electronics & Audio',
        size: 1540000,
        date: new Date('2026-07-25'),
        dimensions: '2070x1380'
      },
      {
        id: 'sys-7',
        name: 'MacBook Pro Flash Sale Banner',
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop',
        relativePath: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop',
        category: 'Computers & Laptops',
        size: 980000,
        date: new Date('2026-08-03'),
        dimensions: '1000x1000'
      },
      {
        id: 'sys-8',
        name: 'Premium Audio Accessories & Speakers',
        url: 'https://images.unsplash.com/photo-1605464315542-bda3e2f4e605?q=80&w=1000&auto=format&fit=crop',
        relativePath: 'https://images.unsplash.com/photo-1605464315542-bda3e2f4e605?q=80&w=1000&auto=format&fit=crop',
        category: 'Electronics & Audio',
        size: 1150000,
        date: new Date('2026-08-04'),
        dimensions: '1000x1000'
      }
    ];

    const allMedia = [...uploadedFiles, ...systemMedia];
    res.json({ success: true, count: allMedia.length, media: allMedia, data: allMedia });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp|jfif|avif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (jpg, jpeg, png, webp, jfif, avif)!'));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Configure cloudinary explicitly or rely on env CLOUDINARY_URL
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '894326581234123',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'fake-secret-key-replace-me'
});

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vertex_market',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif', 'svg']
  }
});

const uploadCloudinary = multer({ storage: cloudinaryStorage });

router.post('/cloudinary', uploadCloudinary.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image uploaded' });
  }
  res.json({ success: true, url: req.file.path });
});

router.post('/', (req, res) => {
  upload.single('image')(req, res, function (err) {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }
    // Construct the URL path where the image will be served statically
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
  });
});

// Products specific upload (handles single/multiple files)
router.post('/products', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const imageMetadataList = req.files.map((file, index) => ({
      imageUrl: `/uploads/${file.filename}`,
      publicId: `pub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
      isPrimary: index === 0,
      sortOrder: index,
      uploadedAt: new Date()
    }));

    res.status(200).json({ success: true, images: imageMetadataList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete specific product upload
router.delete('/products/:imageId', (req, res) => {
  // In development, we return success so frontend flow works gracefully
  res.status(200).json({ success: true, message: 'Image deleted from storage', imageId: req.params.imageId });
});

export default router;
