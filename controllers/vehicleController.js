const db = require('../config/db');

const getVehicles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM araclar');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM araclar WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Araç bulunamadı' });
        }
        res.json(rows[0]);
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
        await db.query('INSERT INTO araclar (plaka, kapasite_kg, aktif_mi) VALUES (?, ?, ?)', [plaka, kapasite_kg, aktif_mi]);
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
        const [result] = await db.query('UPDATE araclar SET plaka = ?, kapasite_kg = ?, aktif_mi = ? WHERE id = ?', [plaka, kapasite_kg, aktif_mi, id]);
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
        const [result] = await db.query('DELETE FROM araclar WHERE id = ?', [id]);
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