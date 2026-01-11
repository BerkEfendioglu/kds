# Soğuk Zincir Lojistiği Yönetim Sistemi

**Proje Açıklaması:** Bu proje, soğuk zincir lojistik operasyonlarını yönetmek için geliştirilmiş bir RESTful API sistemidir. Sistem, MVC (Model-View-Controller) mimarisine uygun olarak tasarlanmıştır ve Node.js, Express.js ve MySQL teknolojileri kullanılarak geliştirilmiştir.

## Senaryo Tanımı

Bu sistem, soğuk zincir lojistik şirketlerinin operasyonlarını yönetmek için tasarlanmıştır. Sistem aşağıdaki temel varlıkları yönetir:

- **Ürünler (Products):** Soğuk zincirde taşınan ürünlerin bilgileri (isim, kategori, sıcaklık aralığı, raf ömrü)
- **Araçlar (Vehicles):** Lojistik filodaki araçların bilgileri (plaka, kapasite, aktiflik durumu)
- **Depolar (Warehouses):** Stokların tutulduğu depoların bilgileri (isim, lokasyon)
- **Siparişler (Orders):** Müşteri siparişlerinin yönetimi (ürün, araç, miktar, tarih)
- **Stok (Stock):** Depolardaki ürün stokları
- **Satış Geçmişi (Sales History):** Geçmiş satış verileri

### İş Kuralları

Sistem aşağıdaki iş kurallarını uygular:

1. **Stok Kontrolü:** Stok yetersizse sipariş verilemez. Sipariş oluşturulurken mevcut stok kontrol edilir ve yetersizse hata döndürülür.

2. **Aktif Araç Kontrolü:** Aktif olmayan araçlara sipariş atanamaz. Sipariş oluşturulurken veya güncellenirken araç aktiflik durumu kontrol edilir.

## Proje Yapısı

```
kds/
├── config/          # Veritabanı yapılandırması
│   └── db.js
├── controllers/     # İş mantığı (Controller katmanı)
│   ├── orderController.js
│   ├── productController.js
│   ├── vehicleController.js
│   ├── warehouseController.js
│   └── salesHistoryController.js
├── models/          # Veri modelleri (Model katmanı)
│   ├── Order.js
│   ├── Product.js
│   ├── Vehicle.js
│   ├── Warehouse.js
│   └── Stock.js
├── routes/          # API rotaları
│   └── apiRoutes.js
├── app.js           # Express uygulama yapılandırması
├── server.js        # Sunucu başlatma dosyası
├── setup-database.js # Veritabanı kurulum scripti
└── .env.example     # Ortam değişkenleri örneği
```

## Kurulum Adımları

### 1. Gereksinimler

- Node.js (v14 veya üzeri)
- MySQL (v5.7 veya üzeri)
- npm veya yarn

### 2. Projeyi Klonlayın

```bash
git clone <repository-url>
cd kds
```

### 3. Bağımlılıkları Yükleyin

```bash
npm install
```

### 4. Ortam Değişkenlerini Yapılandırın

`.env.example` dosyasını kopyalayarak `.env` dosyası oluşturun:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyerek veritabanı bilgilerinizi girin:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cold_chain_db
PORT=3000
```

### 5. Veritabanını Kurun

Veritabanı kurulumu otomatik olarak `npm install` sonrasında çalışır veya manuel olarak:

```bash
node setup-database.js
```

Bu script:
- Veritabanını oluşturur
- Gerekli tabloları oluşturur
- Örnek verileri yükler (eğer veritabanı boşsa)

**Not:** `train.csv` dosyasının proje dizininde bulunması gerekmektedir.

### 6. Sunucuyu Başlatın

```bash
npm start
```

Sunucu varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

## API Endpoint Listesi

### Ürünler (Products)

- `GET /api/products` - Tüm ürünleri listele
- `GET /api/products/:id` - Belirli bir ürünü getir
- `POST /api/products` - Yeni ürün oluştur
- `PUT /api/products/:id` - Ürün güncelle
- `DELETE /api/products/:id` - Ürün sil

**Örnek İstek (POST /api/products):**
```json
{
  "id": 1,
  "name": "Maraş Dondurması",
  "category": "Dondurulmuş",
  "min_temp": -25,
  "max_temp": -18,
  "shelf_life_days": 30
}
```

### Araçlar (Vehicles)

- `GET /api/vehicles` - Tüm araçları listele
- `GET /api/vehicles/:id` - Belirli bir aracı getir
- `POST /api/vehicles` - Yeni araç oluştur
- `PUT /api/vehicles/:id` - Araç güncelle
- `DELETE /api/vehicles/:id` - Araç sil

**Örnek İstek (POST /api/vehicles):**
```json
{
  "plaka": "34 ABC 123",
  "kapasite_kg": 1000,
  "aktif_mi": true
}
```

### Siparişler (Orders)

- `GET /api/orders` - Tüm siparişleri listele
- `GET /api/orders/:id` - Belirli bir siparişi getir
- `POST /api/orders` - Yeni sipariş oluştur (İş kuralı: Stok kontrolü ve aktif araç kontrolü)
- `PUT /api/orders/:id` - Sipariş güncelle (İş kuralı: Aktif araç kontrolü)
- `DELETE /api/orders/:id` - Sipariş sil

**Örnek İstek (POST /api/orders):**
```json
{
  "urun_id": 1,
  "arac_id": 1,
  "miktar_kg": 50
}
```

**Hata Yanıtları:**
- `400 Bad Request` - Stok yetersiz veya araç aktif değil
- `404 Not Found` - Sipariş bulunamadı

### Depolar (Warehouses)

- `GET /api/warehouses` - Tüm depoları listele
- `GET /api/warehouses/:id` - Belirli bir depoyu getir
- `POST /api/warehouses` - Yeni depo oluştur
- `PUT /api/warehouses/:id` - Depo güncelle
- `DELETE /api/warehouses/:id` - Depo sil

**Örnek İstek (POST /api/warehouses):**
```json
{
  "ad": "Ana Depo",
  "lokasyon": "İstanbul"
}
```

### Satış Geçmişi (Sales History)

- `GET /api/sales-history` - Satış geçmişini listele

## Veritabanı Şeması

Sistem aşağıdaki tabloları içerir:

- `urunler` - Ürün bilgileri
- `araclar` - Araç bilgileri
- `depolar` - Depo bilgileri
- `siparisler` - Sipariş bilgileri
- `stok` - Stok bilgileri
- `satis_gecmisi` - Satış geçmişi

Detaylı ER diyagramı için `ER_DIAGRAM.png` veya `ER_DIAGRAM.pdf` dosyasına bakınız.

## Teknolojiler

- **Backend:** Node.js, Express.js
- **Veritabanı:** MySQL
- **ORM/Query Builder:** mysql2
- **Ortam Değişkenleri:** dotenv

## MVC Mimarisi

Bu proje katı MVC mimarisine uygun olarak tasarlanmıştır:

- **Model:** `models/` klasöründeki dosyalar veri erişim katmanını temsil eder
- **View:** Frontend (HTML/CSS/JS) istemci tarafında render edilir
- **Controller:** `controllers/` klasöründeki dosyalar iş mantığını ve istek/yanıt yönetimini içerir

## Lisans

ISC

## Yazar

Berk Efendioğlu
