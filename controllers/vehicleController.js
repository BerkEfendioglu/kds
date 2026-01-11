const Vehicle = require('../models/Vehicle');

const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll();
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Araç bulunamadı' });
        }
        res.json(vehicle);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const createVehicle = async (req, res) => {
    try {
        const { plaka, kapasite_kg, aktif_mi } = req.body;
        if (!plaka) {
            return res.status(400).json({ error: 'Plaka gereklidir' });
        }
        await Vehicle.create({ plaka, kapasite_kg, aktif_mi });
        res.status(201).json({ message: 'Araç başarıyla oluşturuldu' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { plaka, kapasite_kg, aktif_mi } = req.body;
        const result = await Vehicle.update(id, { plaka, kapasite_kg, aktif_mi });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Araç bulunamadı' });
        }
        res.json({ message: 'Araç başarıyla güncellendi' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};

const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Vehicle.delete(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Araç bulunamadı' });
        }
        res.json({ message: 'Araç başarıyla silindi' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
};


module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};