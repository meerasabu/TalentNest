const pool = require('./db');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Authentication middleware for WebSocket handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected to WebSocket: ${socket.id} (User ID: ${socket.user?.id})`);

    // Securely join a room representing this specific user
    socket.on('join_user', (userId) => {
      const parsedUserId = parseInt(userId, 10);
      if (socket.user && socket.user.id === parsedUserId) {
        socket.join(`user_${parsedUserId}`);
        console.log(`Socket ${socket.id} securely joined room user_${parsedUserId}`);
      } else {
        console.warn(`Socket ${socket.id} unauthorized join attempt for user_${userId}`);
        socket.emit('error', { message: 'Unauthorized room join' });
      }
    });

    // Handle incoming messages sent via WebSockets
    socket.on('send_message', async (data) => {
      try {
        const { chatId, senderId, text } = data;
        const parsedSenderId = parseInt(senderId, 10);

        if (!chatId || !senderId || !text) {
          socket.emit('error', { message: 'Missing required message parameters' });
          return;
        }

        // Verify sender authorization
        if (!socket.user || socket.user.id !== parsedSenderId) {
          socket.emit('error', { message: 'Unauthorized message sender' });
          return;
        }

        // Retrieve chat details to get buyer_id and seller_id for room broadcasting
        const chatRes = await pool.query('SELECT * FROM chats WHERE chat_id = $1', [chatId]);
        if (chatRes.rows.length === 0) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }
        const chat = chatRes.rows[0];

        // Ensure the sender is a participant in this chat
        if (chat.buyer_id !== parsedSenderId && chat.seller_id !== parsedSenderId) {
          socket.emit('error', { message: 'Not authorized for this chat' });
          return;
        }

        // Check if chat is still active
        if (chat.status === 'Completed' || chat.status === 'Cancelled') {
          socket.emit('error', { message: 'Cannot send messages in a completed or cancelled chat' });
          return;
        }

        // Save message to database
        const result = await pool.query(
          'INSERT INTO messages (chat_id, sender_id, message_text) VALUES ($1, $2, $3) RETURNING *',
          [chatId, parsedSenderId, text]
        );

        // Fetch sender info for the response
        const userRes = await pool.query('SELECT first_name, last_name, profile_image FROM users WHERE id = $1', [parsedSenderId]);
        
        const newMessage = {
          ...result.rows[0],
          first_name: userRes.rows[0]?.first_name,
          last_name: userRes.rows[0]?.last_name,
          profile_image: userRes.rows[0]?.profile_image
        };

        // Broadcast to both participants
        io.to(`user_${chat.buyer_id}`).to(`user_${chat.seller_id}`).emit('new_message', newMessage);

      } catch (error) {
        console.error('Error handling send_message socket event:', error);
        socket.emit('error', { message: 'Internal server error occurred' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
