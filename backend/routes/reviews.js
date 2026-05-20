const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/reviews - Submit a new review
router.post('/', async (req, res) => {
  try {
    const { reviewerId, reviewedId, orderId, rating, reviewText } = req.body;

    if (!reviewerId || !reviewedId || !orderId || !rating) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if review already exists for this order
    const existing = await pool.query('SELECT id FROM reviews WHERE order_id = $1', [orderId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this order.' });
    }

    const result = await pool.query(
      'INSERT INTO reviews (reviewer_id, reviewed_id, order_id, rating, review_text) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [reviewerId, reviewedId, orderId, rating, reviewText]
    );

    res.status(201).json({ success: true, review: result.rows[0] });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/reviews/user/:userId - Get all reviews for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT r.*, u.first_name, u.last_name, u.profile_image 
      FROM reviews r 
      JOIN users u ON r.reviewer_id = u.id 
      WHERE r.reviewed_id = $1 
      ORDER BY r.created_at DESC
    `, [userId]);

    res.status(200).json({ success: true, reviews: result.rows });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
