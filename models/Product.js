const db = require('../config/db');

class Product {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM urunler');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM urunler WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { id, name, category, min_temp, max_temp, shelf_life_days } = data;
    await db.query(
      'INSERT INTO urunler (id, name, category, min_temp, max_temp, shelf_life_days) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, category, min_temp, max_temp, shelf_life_days]
    );
    return { id, name, category, min_temp, max_temp, shelf_life_days };
  }

  static async update(id, data) {
    const { name, category, min_temp, max_temp, shelf_life_days } = data;
    const [result] = await db.query(
      'UPDATE urunler SET name = ?, category = ?, min_temp = ?, max_temp = ?, shelf_life_days = ? WHERE id = ?',
      [name, category, min_temp, max_temp, shelf_life_days, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM urunler WHERE id = ?', [id]);
    return result;
  }
}

module.exports = Product;
