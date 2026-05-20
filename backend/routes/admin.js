const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(isAdmin);

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // 1. Total Students (users who are not admins)
    const studentsRes = await pool.query("SELECT COUNT(*) FROM users WHERE role != 'admin'");
    const totalStudents = parseInt(studentsRes.rows[0].count, 10);

    // 2. Active Listings (products + skills + services)
    const productsRes = await pool.query("SELECT COUNT(*) FROM products");
    const skillsRes = await pool.query("SELECT COUNT(*) FROM skills");
    const servicesRes = await pool.query("SELECT COUNT(*) FROM services");
    const activeListings = parseInt(productsRes.rows[0].count, 10) + 
                           parseInt(skillsRes.rows[0].count, 10) + 
                           parseInt(servicesRes.rows[0].count, 10);

    // 3. Ongoing Requests (Pending/Accepted orders)
    const requestsRes = await pool.query("SELECT COUNT(*) FROM orders WHERE status IN ('Pending', 'Accepted')");
    const ongoingRequests = parseInt(requestsRes.rows[0].count, 10);

    // 4. Pending Reports (Reports where status = 'Pending')
    // Fallback if the reports table or status column is missing
    let pendingReports = 0;
    try {
      const reportsRes = await pool.query("SELECT COUNT(*) FROM reports WHERE status = 'Pending'");
      pendingReports = parseInt(reportsRes.rows[0].count, 10);
    } catch (err) {
      console.error('Reports table query error:', err.message);
    }

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        activeListings,
        ongoingRequests,
        pendingReports
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/students - Fetch all students
router.get('/students', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, first_name, last_name, email, department, graduation_year, profile_image, account_status 
      FROM users 
      WHERE role != 'admin'
      ORDER BY first_name ASC
    `);
    res.status(200).json({ success: true, students: result.rows });
  } catch (error) {
    console.error('Error fetching admin students:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/admin/students/:id/status - Update student account status
router.put('/students/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.query(
      'UPDATE users SET account_status = $1 WHERE id = $2',
      [status, id]
    );
    
    res.status(200).json({ success: true, message: `Account status updated to ${status}` });
  } catch (error) {
    console.error('Error updating student status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/students/:id - Fetch detailed student profile
router.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch basic user info
    const userRes = await pool.query(`
      SELECT id, first_name, last_name, email, department, graduation_year, profile_image, account_status, role
      FROM users WHERE id = $1
    `, [id]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const student = userRes.rows[0];

    // 2. Fetch activity stats
    const productsRes = await pool.query("SELECT COUNT(*) FROM products WHERE user_id = $1", [id]);
    const skillsRes = await pool.query("SELECT COUNT(*) FROM skills WHERE user_id = $1", [id]);
    const servicesRes = await pool.query("SELECT COUNT(*) FROM services WHERE user_id = $1", [id]);
    const ordersRes = await pool.query("SELECT COUNT(*) FROM orders WHERE buyer_id = $1 OR seller_id = $1", [id]);

    const stats = {
      marketplace: parseInt(productsRes.rows[0].count, 10),
      skills: parseInt(skillsRes.rows[0].count, 10),
      services: parseInt(servicesRes.rows[0].count, 10),
      orders: parseInt(ordersRes.rows[0].count, 10)
    };

    // 3. Fetch reports against this user
    const reportsRes = await pool.query(`
      SELECT r.*, u.first_name as reporter_name 
      FROM reports r 
      JOIN users u ON r.reporter_id = u.id 
      WHERE r.reported_id = $1 
      ORDER BY r.created_at DESC
    `, [id]);

    res.status(200).json({
      success: true,
      student,
      stats,
      reports: reportsRes.rows
    });

  } catch (error) {
    console.error('Error fetching admin student detail:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/marketplace - Fetch all physical product listings
router.get('/marketplace', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.first_name, u.last_name 
      FROM products p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.status(200).json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Error fetching admin marketplace:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/admin/marketplace/:id/status - Moderate product status
router.put('/marketplace/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE products SET status = $1 WHERE id = $2', [status, id]);
    res.status(200).json({ success: true, message: `Product marked as ${status}` });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// DELETE /api/admin/marketplace/:id - Remove product listing
router.delete('/marketplace/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'Product listing removed' });
  } catch (error) {
    console.error('Error removing product listing:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/marketplace/:id - Fetch detailed product info
router.get('/marketplace/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT p.*, u.first_name, u.last_name, u.profile_image as seller_avatar, u.department as seller_dept
      FROM products p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Error fetching admin product detail:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/skills - Fetch all skills for moderation
router.get('/skills', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.first_name, u.last_name 
      FROM skills s 
      JOIN users u ON s.user_id = u.id 
      ORDER BY s.created_at DESC
    `);
    res.status(200).json({ success: true, skills: result.rows });
  } catch (error) {
    console.error('Error fetching admin skills:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/admin/skills/:id/status - Update skill status
router.put('/skills/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE skills SET status = $1 WHERE id = $2', [status, id]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating skill status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/services - Fetch all services for moderation
router.get('/services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.first_name, u.last_name 
      FROM services s 
      JOIN users u ON s.user_id = u.id 
      ORDER BY s.created_at DESC
    `);
    res.status(200).json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Error fetching admin services:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/admin/services/:id/status - Update service status
router.put('/services/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE services SET status = $1 WHERE id = $2', [status, id]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/skills/:id - Fetch detailed skill info for admin
router.get('/skills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*, u.first_name, u.last_name, u.email as provider_email, u.profile_image as provider_avatar
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    
    res.status(200).json({ success: true, skill: result.rows[0] });
  } catch (error) {
    console.error('Error fetching admin skill detail:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/services/:id - Fetch detailed service info for admin
router.get('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*, u.first_name, u.last_name, u.email as provider_email, u.profile_image as provider_avatar
      FROM services s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.status(200).json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Error fetching admin service detail:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/orders - Fetch all orders with details (Optimized JOIN)
router.get('/orders', async (req, res) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT o.*, 
             b.first_name as buyer_first_name, b.last_name as buyer_last_name,
             sl.first_name as seller_first_name, sl.last_name as seller_last_name,
             COALESCE(p.title, sk.title, sv.title, 'Unknown Item') as "itemTitle"
      FROM orders o
      JOIN users b ON o.buyer_id = b.id
      JOIN users sl ON o.seller_id = sl.id
      LEFT JOIN products p ON o.item_type = 'product' AND o.item_id = p.id
      LEFT JOIN skills sk ON o.item_type = 'skill' AND o.item_id = sk.id
      LEFT JOIN services sv ON o.item_type = 'service' AND o.item_id = sv.id
    `;
    
    let queryParams = [];
    if (type) {
      query += ` WHERE o.item_type = $1`;
      queryParams.push(type);
    }
    
    query += ` ORDER BY o.created_at DESC`;
    
    const result = await pool.query(query, queryParams);
    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/orders/:id - Fetch single order detail
router.get('/orders/:id', async (req, res) => {
  console.log(`Admin GET /orders/${req.params.id} hit`);
  try {
    const { id } = req.params;
    const query = `
      SELECT o.*, 
             b.first_name as buyer_first_name, b.last_name as buyer_last_name,
             sl.first_name as seller_first_name, sl.last_name as seller_last_name,
             COALESCE(p.title, sk.title, sv.title, 'Unknown Item') as "itemTitle"
      FROM orders o
      JOIN users b ON o.buyer_id = b.id
      JOIN users sl ON o.seller_id = sl.id
      LEFT JOIN products p ON o.item_type = 'product' AND o.item_id = p.id
      LEFT JOIN skills sk ON o.item_type = 'skill' AND o.item_id = sk.id
      LEFT JOIN services sv ON o.item_type = 'service' AND o.item_id = sv.id
      WHERE o.id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error fetching admin order detail:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/reports - Fetch all reports with details
router.get('/reports', async (req, res) => {
  try {
    const query = `
      SELECT r.*, 
             u1.first_name as reporter_first_name, u1.last_name as reporter_last_name,
             u2.first_name as reported_first_name, u2.last_name as reported_last_name,
             COALESCE(p.title, sk.title, sv.title, 'Unknown Item') as "itemTitle"
      FROM reports r
      JOIN users u1 ON r.reporter_id = u1.id
      JOIN users u2 ON r.reported_id = u2.id
      LEFT JOIN products p ON r.item_type = 'product' AND r.item_id = p.id
      LEFT JOIN skills sk ON r.item_type = 'skill' AND r.item_id = sk.id
      LEFT JOIN services sv ON r.item_type = 'service' AND r.item_id = sv.id
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query);
    res.json({ success: true, reports: result.rows });
  } catch (error) {
    console.error('Error fetching admin reports:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/admin/reports/:id/messages - Fetch messages related to a report
router.get('/reports/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    // 1. Get report details
    const reportRes = await pool.query(`
      SELECT r.*, 
             u1.first_name as reporter_first_name, u1.last_name as reporter_last_name,
             u2.first_name as reported_first_name, u2.last_name as reported_last_name,
             COALESCE(p.title, sk.title, sv.title, 'Unknown Item') as "itemTitle"
      FROM reports r
      JOIN users u1 ON r.reporter_id = u1.id
      JOIN users u2 ON r.reported_id = u2.id
      LEFT JOIN products p ON r.item_type = 'product' AND r.item_id = p.id
      LEFT JOIN skills sk ON r.item_type = 'skill' AND r.item_id = sk.id
      LEFT JOIN services sv ON r.item_type = 'service' AND r.item_id = sv.id
      WHERE r.id = $1
    `, [id]);

    if (reportRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Report not found' });
    const report = reportRes.rows[0];

    // 2. Find messages between these two users
    const messagesRes = await pool.query(`
      SELECT m.*, u.first_name as sender_name
      FROM messages m
      JOIN chats c ON m.chat_id = c.chat_id
      JOIN users u ON m.sender_id = u.id
      WHERE (c.buyer_id = $1 AND c.seller_id = $2) OR (c.buyer_id = $2 AND c.seller_id = $1)
      ORDER BY m.created_at ASC
    `, [report.reporter_id, report.reported_id]);

    res.json({ 
      success: true, 
      report: report,
      messages: messagesRes.rows 
    });
  } catch (error) {
    console.error('Error fetching admin chat review:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
