const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Statik dosyaları (index.html, css, js) sun
app.use(express.static(path.join(__dirname)));

// Ana sayfa rotası
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API rotaları
app.use('/api', apiRoutes);

module.exports = app;
