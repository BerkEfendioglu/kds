const Order = require('../models/Order');
const Vehicle = require('../models/Vehicle');
const Stock = require('../models/Stock');

const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const createOrder = async (req, res) => {
    try {
        const { urun_id, arac_id, miktar_kg } = req.body;

        // İş Kuralı 1: Stok kontrolü - Stok yetersizse sipariş verilemez
        const totalStock = await Order.getTotalStock(urun_id);
        if (totalStock < miktar_kg) {
            return res.status(400).json({ error: 'Stok yetersiz. Mevcut stok: ' + totalStock + ' kg' });
        }

        // İş Kuralı 2: Aktif olmayan araçlara sipariş atanamaz
        const isVehicleActive = await Vehicle.isActive(arac_id);
        if (!isVehicleActive) {
            return res.status(400).json({ error: 'Aktif olmayan araçlara sipariş atanamaz' });
        }

        await Order.create({ urun_id, arac_id, miktar_kg });
        
        // Stok azaltma
        await Stock.decreaseStock(urun_id, miktar_kg);

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

        // İş Kuralı 2: Aktif olmayan araçlara sipariş atanamaz
        if (arac_id) {
            const isVehicleActive = await Vehicle.isActive(arac_id);
            if (!isVehicleActive) {
                return res.status(400).json({ error: 'Aktif olmayan araçlara sipariş atanamaz' });
            }
        }

        const result = await Order.update(id, { urun_id, arac_id, miktar_kg });
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
        const result = await Order.delete(id);
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