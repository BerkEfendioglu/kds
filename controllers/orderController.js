const db = require('../config/db');

const getOrders = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM siparisler ORDER BY siparis_tarihi DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM siparisler WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const createOrder = async (req, res) => {
    try {
        const { urun_id, arac_id, miktar_kg } = req.body;

        // Business Rule: Check for stock
        const [stock] = await db.query('SELECT SUM(miktar_kg) as total_stock FROM stok WHERE urun_id = ?', [urun_id]);
        if (stock[0].total_stock < miktar_kg) {
            return res.status(400).json({ error: 'Stok yetersiz' });
        }

        const [result] = await db.query('INSERT INTO siparisler (urun_id, arac_id, miktar_kg, siparis_tarihi) VALUES (?, ?, ?, ?)', [urun_id, arac_id, miktar_kg, new Date()]);
        
        // Decrease stock
        // This is a simple implementation. A more robust solution would involve transactions.
        await db.query('UPDATE stok SET miktar_kg = miktar_kg - ? WHERE urun_id = ? AND depo_id = (SELECT depo_id FROM (SELECT * FROM stok) as s WHERE urun_id = ? AND miktar_kg >= ? LIMIT 1)', [miktar_kg, urun_id, urun_id, miktar_kg]);

        res.status(201).json({ message: 'Sipariş başarıyla oluşturuldu' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { urun_id, arac_id, miktar_kg } = req.body;
        const [result] = await db.query('UPDATE siparisler SET urun_id = ?, arac_id = ?, miktar_kg = ? WHERE id = ?', [urun_id, arac_id, miktar_kg, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }
        res.json({ message: 'Sipariş başarıyla güncellendi' });
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM siparisler WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }
        res.json({ message: 'Sipariş başarıyla silindi' });
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};