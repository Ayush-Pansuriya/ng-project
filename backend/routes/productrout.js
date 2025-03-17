const express = require('express');
const router = express.Router();
const Product = require('../schema/product');
const { authenticate } = require('../middleware/authenticate');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the frontend assets directory (absolute path)
const uploadDir = path.join(__dirname, '../../frontend/myapp/src/assets/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer to save files to the frontend directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // e.g., 1741961077528-227134474.png
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG and PNG images are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(authenticate);

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    console.log('Fetched products:', products);
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error });
  }
});

// Add product with image upload
router.post('/add', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category, stock, pid=count+1 } = req.body;
    const imagePath = req.file ? `assets/images/${req.file.filename}` : '';
    console.log('Image saved at:', path.join(uploadDir, req.file.filename));
    console.log('Stored in DB as:', imagePath);
    const product = new Product({
      name,
      price,
      image: imagePath,
      description,
      category,
      stock,
      pid
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Error adding product', error });
  }
});

// Update product with optional image upload
router.put('/update/:pid', upload.single('image'), async (req, res) => {
  try {
    const updateData = req.body;
    if (req.file) {
      updateData.image = `assets/images/${req.file.filename}`;
      console.log('Updated image saved at:', path.join(uploadDir, req.file.filename));
      console.log('Stored in DB as:', updateData.image);
    }

    const product = await Product.findByIdAndUpdate(
      req.params.pid,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

// Delete product
router.delete('/delete/:pid', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.pid);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.image) {
      const imagePath = path.join(uploadDir, path.basename(product.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Deleted image:', imagePath);
      }
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

module.exports = router;
