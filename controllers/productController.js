const db = require('../config/db');

const getProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM urunler');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM urunler WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { id, name, category, min_temp, max_temp, shelf_life_days } = req.body;
        // Basic validation
        if (!id || !name || !category) {
            return res.status(400).json({ error: 'id, name, and category are required' });
        }
        await db.query('INSERT INTO urunler (id, name, category, min_temp, max_temp, shelf_life_days) VALUES (?, ?, ?, ?, ?, ?)', [id, name, category, min_temp, max_temp, shelf_life_days]);
        res.status(201).json({ message: 'Ürün başarıyla oluşturuldu' });
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, min_temp, max_temp, shelf_life_days } = req.body;
        const [result] = await db.query('UPDATE urunler SET name = ?, category = ?, min_temp = ?, max_temp = ?, shelf_life_days = ? WHERE id = ?', [name, category, min_temp, max_temp, shelf_life_days, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }
        res.json({ message: 'Ürün başarıyla güncellendi' });
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM urunler WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }
        res.json({ message: 'Ürün başarıyla silindi' });
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};