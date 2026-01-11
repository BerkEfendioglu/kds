const db = require('../config/db');

class Warehouse {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM depolar');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM depolar WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { ad, lokasyon } = data;
    const [result] = await db.query(
      'INSERT INTO depolar (ad, lokasyon) VALUES (?, ?)',
      [ad, lokasyon]
    );
    return { id: result.insertId, ad, lokasyon };
  }

  static async update(id, data) {
    const { ad, lokasyon } = data;
    const [result] = await db.query(
      'UPDATE depolar SET ad = ?, lokasyon = ? WHERE id = ?',
      [ad, lokasyon, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM depolar WHERE id = ?', [id]);
    return result;
  }
}

module.exports = Warehouse;
