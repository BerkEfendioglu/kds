const db = require('../config/db');

class Vehicle {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM araclar');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM araclar WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { plaka, kapasite_kg, aktif_mi } = data;
    const [result] = await db.query(
      'INSERT INTO araclar (plaka, kapasite_kg, aktif_mi) VALUES (?, ?, ?)',
      [plaka, kapasite_kg, aktif_mi !== undefined ? aktif_mi : true]
    );
    return { id: result.insertId, plaka, kapasite_kg, aktif_mi };
  }

  static async update(id, data) {
    const { plaka, kapasite_kg, aktif_mi } = data;
    const [result] = await db.query(
      'UPDATE araclar SET plaka = ?, kapasite_kg = ?, aktif_mi = ? WHERE id = ?',
      [plaka, kapasite_kg, aktif_mi, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM araclar WHERE id = ?', [id]);
    return result;
  }

  static async isActive(id) {
    const vehicle = await this.findById(id);
    return vehicle && vehicle.aktif_mi === 1;
  }
}

module.exports = Vehicle;
