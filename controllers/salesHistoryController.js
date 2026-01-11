// const db = require('../config/db');

const getSalesHistory = async (req, res) => {
  try {
    // const [rows] = await db.query('SELECT * FROM satis_gecmisi ORDER BY date DESC LIMIT 50');
    const mockSalesHistory = [
        { id: 1, date: new Date(), store_id: 1, item_id: 1, sales: 10 },
        { id: 2, date: new Date(), store_id: 1, item_id: 2, sales: 15 },
        { id: 3, date: new Date(), store_id: 2, item_id: 1, sales: 5 },
    ];
    res.json(mockSalesHistory);
  } catch (err) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

module.exports = {
  getSalesHistory,
};
