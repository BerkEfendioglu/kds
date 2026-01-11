const db = require('../config/db');

class Stock {
  static async findByProductId(productId) {
    const [rows] = await db.query('SELECT * FROM stok WHERE urun_id = ?', [productId]);
    return rows;
  }

  static async decreaseStock(productId, amount) {
    // Basit bir stok azaltma implementasyonu
    // Daha gelişmiş bir çözüm transaction kullanabilir
    await db.query(
      'UPDATE stok SET miktar_kg = miktar_kg - ? WHERE urun_id = ? AND miktar_kg >= ? LIMIT 1',
      [amount, productId, amount]
    );
  }
}

module.exports = Stock;
