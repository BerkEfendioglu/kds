const db = require('../config/db');

class Order {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM siparisler ORDER BY siparis_tarihi DESC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM siparisler WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { urun_id, arac_id, miktar_kg } = data;
    const [result] = await db.query(
      'INSERT INTO siparisler (urun_id, arac_id, miktar_kg, siparis_tarihi) VALUES (?, ?, ?, ?)',
      [urun_id, arac_id, miktar_kg, new Date()]
    );
    return { id: result.insertId, urun_id, arac_id, miktar_kg };
  }

  static async update(id, data) {
    const { urun_id, arac_id, miktar_kg } = data;
    const [result] = await db.query(
      'UPDATE siparisler SET urun_id = ?, arac_id = ?, miktar_kg = ? WHERE id = ?',
      [urun_id, arac_id, miktar_kg, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM siparisler WHERE id = ?', [id]);
    return result;
  }

  static async getTotalStock(productId) {
    const [rows] = await db.query(
      'SELECT SUM(miktar_kg) as total_stock FROM stok WHERE urun_id = ?',
      [productId]
    );
    return rows[0].total_stock || 0;
  }
}

module.exports = Order;
