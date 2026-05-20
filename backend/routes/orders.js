const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/orders
router.post('/', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { buyerId, sellerId, itemType, itemId, quantity, selectedPlanType, selectedPrice } = req.body;
    
    if (!buyerId || !sellerId || !itemType || !itemId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const requestedQuantity = quantity ? parseInt(quantity, 10) : 1;

    await client.query('BEGIN');

    // 1. Only check inventory for products (don't deduct yet)
    if (itemType === 'product') {
      const inventoryRes = await client.query(
        'SELECT available_quantity FROM inventory WHERE item_type = $1 AND item_id = $2 FOR UPDATE',
        [itemType, itemId]
      );

      if (inventoryRes.rows.length === 0) {
        throw new Error('Item not found in inventory');
      }

      const availableQuantity = inventoryRes.rows[0].available_quantity;

      if (availableQuantity < requestedQuantity) {
        throw new Error('Not enough stock available');
      }
      
      // Stock deduction is now moved to the Acceptance phase
    }

    // 3. Create order record
    const result = await client.query(
      'INSERT INTO orders (buyer_id, seller_id, item_type, item_id, status, quantity, selected_plan_type, selected_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [buyerId, sellerId, itemType, itemId, 'Pending', requestedQuantity, selectedPlanType || null, selectedPrice || null]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, order: result.rows[0], message: 'Order request sent successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    if (error.message === 'Not enough stock available' || error.message === 'Item not found in inventory') {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  } finally {
    client.release();
  }
});

// GET /api/orders/buyer/:id
router.get('/buyer/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT o.id, o.item_type, o.item_id, o.status, o.created_at, o.updated_at, o.quantity,
              o.selected_plan_type, o.selected_price,
              u.first_name as seller_first_name, u.last_name as seller_last_name
       FROM orders o
       JOIN users u ON o.seller_id = u.id
       WHERE o.buyer_id = $1 AND o.seller_id != $1
       ORDER BY o.updated_at DESC`,
      [id]
    );

    const orders = result.rows;
    if (orders.length === 0) return res.json({ success: true, orders: [] });

    const populatedOrders = await populateOrderDetails(orders);
    res.json({ success: true, orders: populatedOrders });
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/orders/seller/:id
router.get('/seller/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT o.id, o.item_type, o.item_id, o.status, o.created_at, o.updated_at, o.quantity,
              o.selected_plan_type, o.selected_price,
              u.first_name as buyer_first_name, u.last_name as buyer_last_name
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       WHERE o.seller_id = $1 AND o.buyer_id != $1
       ORDER BY o.updated_at DESC`,
      [id]
    );

    const orders = result.rows;
    if (orders.length === 0) return res.json({ success: true, orders: [] });

    const populatedOrders = await populateOrderDetails(orders);
    res.json({ success: true, orders: populatedOrders });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/orders/:id/status
router.put('/:id/status', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    await client.query('BEGIN');

    // Fetch order details
    const orderRes = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orderRes.rows[0];

    // Handle Inventory Deduction upon Acceptance
    if (status === 'Accepted' && order.status === 'Pending') {
      // Ensure inventory record exists
      await client.query(
        `INSERT INTO inventory (item_type, item_id, available_quantity) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (item_type, item_id) DO NOTHING`,
        [order.item_type, order.item_id, 1]
      );

      const invRes = await client.query(
        'SELECT available_quantity FROM inventory WHERE item_type = $1 AND item_id = $2 FOR UPDATE',
        [order.item_type, order.item_id]
      );

      if (invRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Inventory record not found' });
      }

      const currentQty = invRes.rows[0].available_quantity;
      const requestedQty = order.item_type === 'product' ? (order.quantity || 1) : 1;

      if (currentQty < requestedQty) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Insufficient stock/slots to accept this ${order.item_type}` });
      }

      // 1. Deduct Inventory
      const updateInvRes = await client.query(
        'UPDATE inventory SET available_quantity = available_quantity - $1 WHERE item_type = $2 AND item_id = $3 RETURNING available_quantity',
        [requestedQty, order.item_type, order.item_id]
      );

      const remainingQty = updateInvRes.rows[0].available_quantity;

      // 2. If quantity reaches zero, mark item status accordingly
      if (remainingQty === 0) {
        if (order.item_type === 'product') {
          await client.query(
            "UPDATE products SET status = 'Sold' WHERE id = $1",
            [order.item_id]
          );
        } else if (order.item_type === 'skill') {
          await client.query(
            "UPDATE skills SET status = 'Inactive' WHERE id = $1",
            [order.item_id]
          );
        } else if (order.item_type === 'service') {
          await client.query(
            "UPDATE services SET status = 'Inactive' WHERE id = $1",
            [order.item_id]
          );
        }

        // 3. Auto-cancel (or Auto-Reject) all other pending requests for this product/skill/service
        await client.query(
          "UPDATE orders SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP WHERE item_id = $1 AND item_type = $2 AND status = 'Pending' AND id != $3",
          [order.item_id, order.item_type, id]
        );
      }
    }

    const result = await client.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    await client.query('COMMIT');
    res.json({ success: true, order: result.rows[0], message: `Order status updated to ${status}` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  } finally {
    client.release();
  }
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    const orderRes = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
    
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orderRes.rows[0];

    if (order.status === 'Cancelled' || order.status === 'Completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled in its current state' });
    }

    // 1. Update order status
    await client.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['Cancelled', id]);

    // 2. Restore inventory ONLY if the order was previously Accepted (meaning it was deducted)
    if (order.status === 'Accepted') {
      // Ensure inventory record exists
      await client.query(
        `INSERT INTO inventory (item_type, item_id, available_quantity) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (item_type, item_id) DO NOTHING`,
        [order.item_type, order.item_id, 0]
      );

      const quantityToRestore = order.item_type === 'product' ? (order.quantity || 1) : 1;
      
      const invUpdateRes = await client.query(
        'UPDATE inventory SET available_quantity = available_quantity + $1 WHERE item_type = $2 AND item_id = $3 RETURNING available_quantity',
        [quantityToRestore, order.item_type, order.item_id]
      );

      if (invUpdateRes.rows.length > 0) {
        const newQty = invUpdateRes.rows[0].available_quantity;
        if (newQty > 0) {
          if (order.item_type === 'product') {
            await client.query("UPDATE products SET status = 'Available' WHERE id = $1", [order.item_id]);
          } else if (order.item_type === 'skill') {
            await client.query("UPDATE skills SET status = 'Active' WHERE id = $1", [order.item_id]);
          } else if (order.item_type === 'service') {
            await client.query("UPDATE services SET status = 'Active' WHERE id = $1", [order.item_id]);
          }
        }
      }
    }

    // 3. Update associated chat if exists
    const chatUpdateRes = await client.query(
      'UPDATE chats SET status = $1 WHERE order_id = $2 RETURNING chat_id, buyer_id, seller_id',
      ['Cancelled', id]
    );
    
    await client.query('COMMIT');

    // Broadcast the update via WebSocket if chat exists
    if (chatUpdateRes.rows.length > 0) {
      const { chat_id: chatId, buyer_id: buyerId, seller_id: sellerId } = chatUpdateRes.rows[0];
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${buyerId}`).to(`user_${sellerId}`).emit('chat_cancelled', { chatId, orderId: id });
      }
    }

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  } finally {
    client.release();
  }
});

// Helper function to populate item details for orders
async function populateOrderDetails(orders) {
  const productIds = orders.filter(o => o.item_type === 'product').map(o => o.item_id);
  const skillIds = orders.filter(o => o.item_type === 'skill').map(o => o.item_id);
  const serviceIds = orders.filter(o => o.item_type === 'service').map(o => o.item_id);

  let products = [];
  if (productIds.length > 0) {
    const pRes = await pool.query('SELECT * FROM products WHERE id = ANY($1::int[])', [productIds]);
    products = pRes.rows;
  }

  let skills = [];
  if (skillIds.length > 0) {
    const sRes = await pool.query('SELECT * FROM skills WHERE id = ANY($1::int[])', [skillIds]);
    skills = sRes.rows;
  }

  let services = [];
  if (serviceIds.length > 0) {
    const srvRes = await pool.query('SELECT * FROM services WHERE id = ANY($1::int[])', [serviceIds]);
    services = srvRes.rows;
  }

  return orders.map(order => {
    let itemDetails = {};
    if (order.item_type === 'product') {
      itemDetails = products.find(p => p.id === order.item_id);
    } else if (order.item_type === 'skill') {
      itemDetails = skills.find(s => s.id === order.item_id);
    } else if (order.item_type === 'service') {
      itemDetails = services.find(s => s.id === order.item_id);
    }

    return {
      ...order,
      itemTitle: itemDetails?.title || 'Unknown Item',
      itemPrice: order.selected_price || itemDetails?.price || itemDetails?.hourly_rate || itemDetails?.standard_plan || 'N/A',
      itemImage: itemDetails?.image_urls && itemDetails.image_urls.length > 0 ? itemDetails.image_urls[0] : null,
      category: itemDetails?.category || itemDetails?.service_type || 'General'
    };
  });
}

module.exports = router;
