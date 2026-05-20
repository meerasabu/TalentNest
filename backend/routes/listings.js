const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Create Product Route
router.post('/products', verifyToken, upload.array('images', 4), async (req, res) => {
  try {
    const { userId, title, description, price, condition, category, quantity } = req.body;
    // Map multiple image files to an array of URLs
    const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Convert userId to integer safely, default to 1 if missing for demonstration
    const uid = userId ? parseInt(userId, 10) : 1;

    const qty = quantity ? parseInt(quantity, 10) : 1;

    const result = await pool.query(
      `INSERT INTO products (user_id, title, description, price, condition, category, image_urls, quantity) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [uid, title, description, price, condition, category, imageUrls, qty]
    );

    const newProduct = result.rows[0];

    // Create inventory record
    await pool.query(
      `INSERT INTO inventory (item_type, item_id, available_quantity) VALUES ($1, $2, $3)`,
      ['product', newProduct.id, qty]
    );

    res.status(201).json({ success: true, product: newProduct, type: 'product' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Server Error handling product creation' });
  }
});

// Create Skill Route
router.post('/skills', verifyToken, upload.array('images', 4), async (req, res) => {
  try {
    const { userId, title, description, category, chargeType, availableTimeSlot, hourlyRate, skillType } = req.body;
    const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const uid = userId ? parseInt(userId, 10) : 1;
    const rate = chargeType === 'Paid' ? parseFloat(hourlyRate || 0) : 0;
    const sType = skillType || 'Online';

    const result = await pool.query(
      `INSERT INTO skills (user_id, title, description, category, charge_type, available_time_slot, hourly_rate, skill_type, image_urls) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [uid, title, description, category, chargeType, availableTimeSlot, rate, sType, imageUrls]
    );
    const newSkill = result.rows[0];

    // Create inventory record
    await pool.query(
      `INSERT INTO inventory (item_type, item_id, available_quantity) VALUES ($1, $2, $3)`,
      ['skill', newSkill.id, 1]
    );

    res.status(201).json({ success: true, skill: newSkill, type: 'skill' });
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ success: false, message: 'Server Error handling skill creation' });
  }
});

// Create Service Route
router.post('/services', verifyToken, upload.array('images', 4), async (req, res) => {
  try {
    const { userId, title, description, serviceType, standardPlan, groupPlan } = req.body;
    const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const uid = userId ? parseInt(userId, 10) : 1;

    const result = await pool.query(
      `INSERT INTO services (user_id, title, description, service_type, standard_plan, group_plan, image_urls) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [uid, title, description, serviceType, standardPlan ? parseFloat(standardPlan) : null, groupPlan ? parseFloat(groupPlan) : null, imageUrls]
    );
    const newService = result.rows[0];

    // Create inventory record
    await pool.query(
      `INSERT INTO inventory (item_type, item_id, available_quantity) VALUES ($1, $2, $3)`,
      ['service', newService.id, 1]
    );

    res.status(201).json({ success: true, service: newService, type: 'service' });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Server Error handling service creation' });
  }
});

// Get All Products Route
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT products.*, COALESCE(inventory.available_quantity, 0) as available_quantity
      FROM products
      LEFT JOIN inventory ON inventory.item_id = products.id AND inventory.item_type = 'product'
      ORDER BY products.created_at DESC
    `);
    res.status(200).json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching products' });
  }
});

// Get Products by Category Route
router.get('/products/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.query(`
      SELECT products.*, COALESCE(inventory.available_quantity, 0) as available_quantity
      FROM products
      LEFT JOIN inventory ON inventory.item_id = products.id AND inventory.item_type = 'product'
      WHERE products.category = $1
      ORDER BY products.created_at DESC
    `, [category]);
    res.status(200).json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching products by category' });
  }
});

// Get Single Product Route
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT products.*, users.first_name, users.last_name, users.email,
             COALESCE(inventory.available_quantity, 0) as available_quantity
      FROM products 
      LEFT JOIN users ON products.user_id = users.id 
      LEFT JOIN inventory ON inventory.item_id = products.id AND inventory.item_type = 'product'
      WHERE products.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.status(200).json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching product' });
  }
});

// Get Products by User Route
router.get('/users/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC', [id]);
    res.status(200).json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching user products' });
  }
});

// Get All Skills Route
router.get('/skills', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT skills.*, users.first_name, users.last_name, users.profile_image,
             COALESCE(inventory.available_quantity, 0) as available_quantity
      FROM skills 
      LEFT JOIN users ON skills.user_id = users.id 
      LEFT JOIN inventory ON inventory.item_id = skills.id AND inventory.item_type = 'skill'
      ORDER BY skills.created_at DESC
    `);
    res.status(200).json({ success: true, skills: result.rows });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching skills' });
  }
});

// Get Single Skill Route
router.get('/skills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT skills.*, users.first_name, users.last_name, users.email, users.profile_image,
             COALESCE(inventory.available_quantity, 0) as available_quantity
      FROM skills 
      LEFT JOIN users ON skills.user_id = users.id 
      LEFT JOIN inventory ON inventory.item_id = skills.id AND inventory.item_type = 'skill'
      WHERE skills.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    
    res.status(200).json({ success: true, skill: result.rows[0] });
  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching skill' });
  }
});

// Get Skills by User Route
router.get('/users/:id/skills', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM skills WHERE user_id = $1 ORDER BY created_at DESC', [id]);
    res.status(200).json({ success: true, skills: result.rows });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching user skills' });
  }
});

// Get All Services Route
router.get('/services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT services.*, users.first_name, users.last_name, users.profile_image,
             COALESCE(inventory.available_quantity, 0) as available_quantity
      FROM services 
      LEFT JOIN users ON services.user_id = users.id 
      LEFT JOIN inventory ON inventory.item_id = services.id AND inventory.item_type = 'service'
      ORDER BY services.created_at DESC
    `);
    res.status(200).json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching services' });
  }
});

// Get Single Service Route
router.get('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT services.*, users.first_name, users.last_name, users.email, users.profile_image,
             COALESCE(inventory.available_quantity, 0) as available_quantity
      FROM services 
      LEFT JOIN users ON services.user_id = users.id 
      LEFT JOIN inventory ON inventory.item_id = services.id AND inventory.item_type = 'service'
      WHERE services.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.status(200).json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching service' });
  }
});

// Get Services by User Route
router.get('/users/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM services WHERE user_id = $1 ORDER BY created_at DESC', [id]);
    res.status(200).json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Error fetching user services:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching user services' });
  }
});

// Update Product Status
router.patch('/products/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE products SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ success: false, message: 'Server Error updating product status' });
  }
});

// Delete Product
router.delete('/products/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Server Error deleting product' });
  }
});

// Update Skill Status
router.patch('/skills/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE skills SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    res.status(200).json({ success: true, skill: result.rows[0] });
  } catch (error) {
    console.error('Error updating skill status:', error);
    res.status(500).json({ success: false, message: 'Server Error updating skill status' });
  }
});

// Delete Skill
router.delete('/skills/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM skills WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    res.status(200).json({ success: true, message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ success: false, message: 'Server Error deleting skill' });
  }
});

// Update Service Status
router.patch('/services/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE services SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ success: false, message: 'Server Error updating service status' });
  }
});

// Delete Service
router.delete('/services/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Server Error deleting service' });
  }
});

// Update Product
router.put('/products/:id', verifyToken, upload.array('images', 4), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, condition, category, existingImages } = req.body;
    
    let imageUrls = existingImages ? JSON.parse(existingImages) : [];
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      imageUrls = [...imageUrls, ...newImages];
    }

    const result = await pool.query(
      `UPDATE products 
       SET title = $1, description = $2, price = $3, condition = $4, category = $5, image_urls = $6
       WHERE id = $7 RETURNING *`,
      [title, description, price, condition, category, imageUrls, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Server Error updating product' });
  }
});

// Update Skill
router.put('/skills/:id', verifyToken, upload.array('images', 4), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, chargeType, availableTimeSlot, hourlyRate, skillType, existingImages } = req.body;
    const rate = chargeType === 'Paid' ? parseFloat(hourlyRate || 0) : 0;
    const sType = skillType || 'Online';
    
    let imageUrls = existingImages ? JSON.parse(existingImages) : [];
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      imageUrls = [...imageUrls, ...newImages];
    }

    const result = await pool.query(
      `UPDATE skills 
       SET title = $1, description = $2, category = $3, charge_type = $4, available_time_slot = $5, hourly_rate = $6, skill_type = $7, image_urls = $8
       WHERE id = $9 RETURNING *`,
      [title, description, category, chargeType, availableTimeSlot, rate, sType, imageUrls, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    res.status(200).json({ success: true, skill: result.rows[0] });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ success: false, message: 'Server Error updating skill' });
  }
});

// Update Service
router.put('/services/:id', verifyToken, upload.array('images', 4), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, serviceType, standardPlan, groupPlan, existingImages } = req.body;
    
    let imageUrls = existingImages ? JSON.parse(existingImages) : [];
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      imageUrls = [...imageUrls, ...newImages];
    }

    const result = await pool.query(
      `UPDATE services 
       SET title = $1, description = $2, service_type = $3, standard_plan = $4, group_plan = $5, image_urls = $6
       WHERE id = $7 RETURNING *`,
      [title, description, serviceType, standardPlan ? parseFloat(standardPlan) : null, groupPlan ? parseFloat(groupPlan) : null, imageUrls, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Server Error updating service' });
  }
});

module.exports = router;
