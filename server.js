const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { query } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 静态文件
app.use(express.static(__dirname));

// 管理后台
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Socket.IO
io.on('connection', (socket) => {
  console.log(`[连接] ${socket.id}`);

  // 客户提交订单
  socket.on('submit-order', async (data) => {
    try {
      const table = data.table || 'A05';
      const total = data.total;
      const itemCount = data.itemCount;

      // 插入订单
      const result = await query(
        'INSERT INTO orders (table_num, total, item_count, status) VALUES (?, ?, ?, ?)',
        [table, total, itemCount, 'new']
      );
      const orderId = result.insertId;

      // 插入订单项
      for (const item of data.items) {
        await query(
          'INSERT INTO order_items (order_id, name, emoji, price, qty) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.name, item.emoji, item.price, item.qty]
        );
      }

      // 查询完整订单
      const [order] = await query('SELECT * FROM orders WHERE id = ?', [orderId]);
      const items = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

      const fullOrder = {
        id: order.id,
        table: order.table_num,
        items: items.map(i => ({
          name: i.name,
          emoji: i.emoji,
          price: i.price,
          qty: i.qty,
        })),
        total: order.total,
        itemCount: order.item_count,
        status: order.status,
        createdAt: new Date(order.created_at).toLocaleString('zh-CN'),
        createdAtISO: order.created_at,
      };

      console.log(`[新订单] #${orderId} 桌号:${table} 菜品:${itemCount}道 金额:¥${total}`);

      // 广播给所有管理端
      io.emit('new-order', fullOrder);

      // 回复客户确认
      socket.emit('order-confirmed', { orderId });
    } catch (err) {
      console.error('[下单失败]', err.message);
      socket.emit('order-error', { message: '下单失败，请重试' });
    }
  });

  // 管理端请求所有订单
  socket.on('get-orders', async () => {
    try {
      const orders = await query(
        'SELECT * FROM orders ORDER BY created_at DESC'
      );

      const fullOrders = await Promise.all(orders.map(async (o) => {
        const items = await query(
          'SELECT name, emoji, price, qty FROM order_items WHERE order_id = ?',
          [o.id]
        );
        return {
          id: o.id,
          table: o.table_num,
          items: items.map(i => ({
            name: i.name,
            emoji: i.emoji,
            price: i.price,
            qty: i.qty,
          })),
          total: o.total,
          itemCount: o.item_count,
          status: o.status,
          createdAt: new Date(o.created_at).toLocaleString('zh-CN'),
          createdAtISO: o.created_at,
        };
      }));

      socket.emit('all-orders', fullOrders);
    } catch (err) {
      console.error('[查询订单失败]', err.message);
      socket.emit('all-orders', []);
    }
  });

  // 管理端更新订单状态
  socket.on('update-status', async ({ orderId, status }) => {
    try {
      await query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
      io.emit('status-updated', { orderId, status });
      console.log(`[状态更新] #${orderId} -> ${status}`);
    } catch (err) {
      console.error('[状态更新失败]', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[断开] ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  🥢 寻味 · 点菜系统');
  console.log('  ─────────────────');
  console.log(`  前端:    http://localhost:${PORT}`);
  console.log(`  后台:    http://localhost:${PORT}/admin`);
  console.log(`  数据库:  MySQL (ordering_system)`);
  console.log('');
  console.log('  局域网设备请使用你的 IP 地址访问');
  console.log('');
});
