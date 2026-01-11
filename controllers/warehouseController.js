const Warehouse = require('../models/Warehouse');

const getWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.findAll();
        res.json(warehouses);
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const getWarehouseById = async (req, res) => {
    try {
        const { id } = req.params;
        const warehouse = await Warehouse.findById(id);
        if (!warehouse) {
            return res.status(404).json({ error: 'Depo bulunamadı' });
        }
        res.json(warehouse);
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
        await Warehouse.create({ ad, lokasyon });
        res.status(201).json({ message: 'Depo başarıyla oluşturuldu' });
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const updateWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const { ad, lokasyon } = req.body;
        const result = await Warehouse.update(id, { ad, lokasyon });
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
        const result = await Warehouse.delete(id);
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