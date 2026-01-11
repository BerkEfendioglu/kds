
const fs = require('fs');
const mysql = require('mysql2/promise');
const csv = require('csv-parser');
require('dotenv').config();

const product_mapping = {
    1: { name: "Maraş Dondurması", category: "Dondurulmuş", min: -25, max: -18 },
    2: { name: "Taze Süt (1L)", category: "Süt Ürünleri", min: 2, max: 4 },
    3: { name: "Dondurulmuş Pizza", category: "Dondurulmuş", min: -20, max: -18 },
    4: { name: "Kaşar Peyniri", category: "Süt Ürünleri", min: 4, max: 8 },
    5: { name: "Mevsim Salata", category: "Taze Sebze", min: 2, max: 6 },
};

function getProductInfo(itemId) {
    if (product_mapping[itemId]) {
        return product_mapping[itemId];
    } else {
        const cat_list = [
            { name: "Yoğurt", min: 2, max: 6 },
            { name: "Tereyağı", min: 2, max: 6 }
        ];
        const randomCat = cat_list[Math.floor(Math.random() * cat_list.length)];
        return { name: `Ürün ${itemId}`, category: randomCat.name, min: randomCat.min, max: randomCat.max };
    }
}

async function setupDatabase() {
    let connection;
    try {
        console.log("Veritabanı kurulumu başlıyor...");

        // .env dosyası kontrolü
        if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
            console.log("⚠️  UYARI: .env dosyası bulunamadı veya eksik bilgiler var.");
            console.log("   Lütfen env.example dosyasını .env olarak kopyalayın ve düzenleyin.");
            console.log("   Veritabanı kurulumu atlanıyor.");
            return;
        }

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
        console.log("MySQL sunucusuna bağlanıldı.");

        const dbName = process.env.DB_NAME;
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`Veritabanı '${dbName}' oluşturuldu veya zaten mevcut.`);

        await connection.changeUser({ database: dbName });
        console.log(`'${dbName}' veritabanı seçildi.`);

        // --- Tablo Oluşturma ---
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS urunler (
                id INT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                min_temp FLOAT,
                max_temp FLOAT,
                shelf_life_days INT
            );
        `);
        console.log("'urunler' tablosu oluşturuldu veya zaten mevcut.");

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS satis_gecmisi (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATETIME,
                store_id INT,
                item_id INT,
                sales INT
            );
        `);
        console.log("'satis_gecmisi' tablosu oluşturuldu veya zaten mevcut.");

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS araclar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                plaka VARCHAR(255) NOT NULL UNIQUE,
                kapasite_kg INT,
                aktif_mi BOOLEAN DEFAULT true
            );
        `);
        console.log("'araclar' tablosu oluşturuldu veya zaten mevcut.");

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS siparisler (
                id INT AUTO_INCREMENT PRIMARY KEY,
                urun_id INT,
                arac_id INT,
                miktar_kg INT,
                siparis_tarihi DATETIME,
                FOREIGN KEY (urun_id) REFERENCES urunler(id),
                FOREIGN KEY (arac_id) REFERENCES araclar(id)
            );
        `);
        console.log("'siparisler' tablosu oluşturuldu veya zaten mevcut.");

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS depolar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ad VARCHAR(255) NOT NULL,
                lokasyon VARCHAR(255)
            );
        `);
        console.log("'depolar' tablosu oluşturuldu veya zaten mevcut.");

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS stok (
                id INT AUTO_INCREMENT PRIMARY KEY,
                urun_id INT,
                depo_id INT,
                miktar_kg INT,
                FOREIGN KEY (urun_id) REFERENCES urunler(id) ON DELETE CASCADE,
                FOREIGN KEY (depo_id) REFERENCES depolar(id) ON DELETE CASCADE
            );
        `);
        console.log("'stok' tablosu oluşturuldu veya zaten mevcut.");

        // --- Veri Kontrolü ve Yükleme ---
        const [urunler_rows] = await connection.execute('SELECT COUNT(*) as count FROM urunler');
        if (urunler_rows[0].count > 0) {
            console.log("Veritabanı zaten dolu görünüyor. Kurulum atlanıyor.");
            await connection.end();
            return;
        }

        // --- Örnek Veri Ekleme (Araçlar, Depolar ve Siparişler için) ---
        console.log("Örnek araç, depo ve sipariş verileri ekleniyor...");
        const [araclarResult] = await connection.query('INSERT INTO araclar (plaka, kapasite_kg) VALUES ?', [[
            ['34 ABC 123', 1000],
            ['35 DEF 456', 1500],
            ['06 GHI 789', 1200]
        ]]);
        console.log(`${araclarResult.affectedRows} araç eklendi.`);

        const [depolarResult] = await connection.query('INSERT INTO depolar (ad, lokasyon) VALUES ?', [[
            ['Ana Depo', 'İstanbul'],
            ['İzmir Depo', 'İzmir'],
            ['Ankara Depo', 'Ankara']
        ]]);
        console.log(`${depolarResult.affectedRows} depo eklendi.`);

        // --- CSV Veri Yükleme ---
        console.log("CSV dosyasından veriler okunuyor...");
        const salesData = [];
        const products = new Map();
        let isFirstRow = true;

        fs.createReadStream('train.csv')
            .pipe(csv())
            .on('data', (row) => {
                if (isFirstRow) {
                    isFirstRow = false;
                    // Check for byte order mark (BOM) and clean column names
                    for (let key in row) {
                        const newKey = key.replace(/^\uFEFF/, '');
                        if (newKey !== key) {
                            row[newKey] = row[key];
                            delete row[key];
                        }
                    }
                }

                if (salesData.length < 50000) {
                     const itemID = parseInt(row.item);
                     if (!isNaN(itemID)) {
                        salesData.push({
                            date: new Date(row.date),
                            store_id: parseInt(row.store),
                            item_id: itemID,
                            sales: parseInt(row.sales),
                        });

                        if (!products.has(itemID)) {
                            const info = getProductInfo(itemID);
                            products.set(itemID, {
                                id: itemID,
                                name: info.name,
                                category: info.category,
                                min_temp: info.min,
                                max_temp: info.max,
                                shelf_life_days: 30,
                            });
                        }
                    }
                }
            })
            .on('end', async () => {
                console.log("CSV okuma tamamlandı. Veriler veritabanına yükleniyor...");

                if (products.size > 0) {
                    const productValues = Array.from(products.values());
                    const productQuery = 'INSERT INTO urunler (id, name, category, min_temp, max_temp, shelf_life_days) VALUES ?';
                    const productInsertData = productValues.map(p => [p.id, p.name, p.category, p.min_temp, p.max_temp, p.shelf_life_days]);
                    await connection.query(productQuery, [productInsertData]);
                    console.log(`${products.size} ürün 'urunler' tablosuna eklendi.`);
                }

                if (salesData.length > 0) {
                    const salesQuery = 'INSERT INTO satis_gecmisi (date, store_id, item_id, sales) VALUES ?';
                    const salesInsertData = salesData.map(s => [s.date, s.store_id, s.item_id, s.sales]);
                    await connection.query(salesQuery, [salesInsertData]);
                    console.log(`${salesData.length} satış kaydı 'satis_gecmisi' tablosuna eklendi.`);
                }

                // Add some dummy orders
                const [urunler] = await connection.execute('SELECT id FROM urunler LIMIT 5');
                const [araclar] = await connection.execute('SELECT id FROM araclar LIMIT 3');
                if (urunler.length > 0 && araclar.length > 0) {
                    const siparislerResult = await connection.query('INSERT INTO siparisler (urun_id, arac_id, miktar_kg, siparis_tarihi) VALUES ?', [[
                        [urunler[0].id, araclar[0].id, 50, new Date()],
                        [urunler[1].id, araclar[1].id, 120, new Date()],
                        [urunler[2].id, araclar[0].id, 75, new Date()],
                    ]]);
                     console.log(`${siparislerResult.affectedRows} sipariş eklendi.`);
                }


                // Add some dummy stock
                const [urunler_for_stock] = await connection.execute('SELECT id FROM urunler');
                const [depolar_for_stock] = await connection.execute('SELECT id FROM depolar');

                if (urunler_for_stock.length > 0 && depolar_for_stock.length > 0) {
                    const stokData = [];
                    for (const urun of urunler_for_stock) {
                        for (const depo of depolar_for_stock) {
                            stokData.push([urun.id, depo.id, Math.floor(Math.random() * 1000)]);
                        }
                    }
                    if (stokData.length > 0) {
                        await connection.query('INSERT INTO stok (urun_id, depo_id, miktar_kg) VALUES ?', [stokData]);
                        console.log('stok tablosu için örnek veriler eklendi.');
                    }
                }

                console.log("✅ Veritabanı kurulumu başarıyla tamamlandı.");
                await connection.end();
            });

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error("⚠️  UYARI: MySQL sunucusuna bağlanılamadı.");
            console.error("   Lütfen MySQL'in çalıştığından ve .env dosyasındaki bağlantı bilgilerinin doğru olduğundan emin olun.");
            console.error("   Veritabanı kurulumu atlanıyor. Daha sonra 'node setup-database.js' komutu ile tekrar deneyebilirsiniz.");
        } else {
            console.error("Veritabanı kurulumu sırasında bir hata oluştu:", error);
            if (connection) {
                await connection.end();
            }
        }
        // postinstall scriptinde hata olsa bile npm install'ın devam etmesi için exit(1) kaldırıldı
    }
}

setupDatabase();
