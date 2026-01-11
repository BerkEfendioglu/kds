const Product = require('../models/Product');

const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }
        res.json(product);
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
        await Product.create({ id, name, category, min_temp, max_temp, shelf_life_days });
        res.status(201).json({ message: 'Ürün başarıyla oluşturuldu' });
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, min_temp, max_temp, shelf_life_days } = req.body;
        const result = await Product.update(id, { name, category, min_temp, max_temp, shelf_life_days });
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
        const result = await Product.delete(id);
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