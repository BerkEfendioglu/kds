const db = require('../config/db');

const getWarehouses = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM depolar');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const getWarehouseById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM depolar WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Depo bulunamadı' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const createWarehouse = async (req, res) => {
    try {
        const { ad, lokasyon } = req.body;
        if (!ad) {
            return res.status(400).json({ error: 'Depo adı gereklidir' });
        }
        await db.query('INSERT INTO depolar (ad, lokasyon) VALUES (?, ?)', [ad, lokasyon]);
        res.status(201).json({ message: 'Depo başarıyla oluşturuldu' });
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const updateWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const { ad, lokasyon } = req.body;
        const [result] = await db.query('UPDATE depolar SET ad = ?, lokasyon = ? WHERE id = ?', [ad, lokasyon, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Depo bulunamadı' });
        }
        res.json({ message: 'Depo başarıyla güncellendi' });
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM depolar WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Depo bulunamadı' });
        }
        res.json({ message: 'Depo başarıyla silindi' });
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

module.exports = {
    getWarehouses,
    getWarehouseById,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
};