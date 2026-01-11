# ER Diyagramı Açıklaması

Bu doküman, soğuk zincir lojistik yönetim sisteminin veritabanı şemasını ve varlık-ilişki diyagramını açıklar.

## Veritabanı Şeması

### Tablolar

#### 1. urunler (Ürünler)
Soğuk zincirde taşınan ürünlerin bilgilerini tutar.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT (PK) | Ürün ID (Primary Key) |
| name | VARCHAR(255) | Ürün adı |
| category | VARCHAR(255) | Ürün kategorisi |
| min_temp | FLOAT | Minimum saklama sıcaklığı |
| max_temp | FLOAT | Maksimum saklama sıcaklığı |
| shelf_life_days | INT | Raf ömrü (gün) |

#### 2. araclar (Araçlar)
Lojistik filodaki araçların bilgilerini tutar.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT (PK, AUTO_INCREMENT) | Araç ID (Primary Key) |
| plaka | VARCHAR(255) UNIQUE | Araç plakası (Benzersiz) |
| kapasite_kg | INT | Araç kapasitesi (kg) |
| aktif_mi | BOOLEAN | Araç aktiflik durumu |

#### 3. depolar (Depolar)
Stokların tutulduğu depoların bilgilerini tutar.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT (PK, AUTO_INCREMENT) | Depo ID (Primary Key) |
| ad | VARCHAR(255) | Depo adı |
| lokasyon | VARCHAR(255) | Depo lokasyonu |

#### 4. siparisler (Siparişler)
Müşteri siparişlerinin bilgilerini tutar.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT (PK, AUTO_INCREMENT) | Sipariş ID (Primary Key) |
| urun_id | INT (FK) | Ürün ID (Foreign Key -> urunler.id) |
| arac_id | INT (FK) | Araç ID (Foreign Key -> araclar.id) |
| miktar_kg | INT | Sipariş miktarı (kg) |
| siparis_tarihi | DATETIME | Sipariş tarihi |

#### 5. stok (Stok)
Depolardaki ürün stoklarını tutar.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT (PK, AUTO_INCREMENT) | Stok ID (Primary Key) |
| urun_id | INT (FK) | Ürün ID (Foreign Key -> urunler.id, ON DELETE CASCADE) |
| depo_id | INT (FK) | Depo ID (Foreign Key -> depolar.id, ON DELETE CASCADE) |
| miktar_kg | INT | Stok miktarı (kg) |

#### 6. satis_gecmisi (Satış Geçmişi)
Geçmiş satış verilerini tutar.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT (PK, AUTO_INCREMENT) | Satış ID (Primary Key) |
| date | DATETIME | Satış tarihi |
| store_id | INT | Mağaza ID |
| item_id | INT | Ürün ID |
| sales | INT | Satış miktarı |

## İlişkiler (Relationships)

### 1. siparisler → urunler
- **İlişki Tipi:** Many-to-One
- **Açıklama:** Bir sipariş bir ürüne aittir. Bir ürün birden fazla siparişte bulunabilir.
- **Foreign Key:** `siparisler.urun_id` → `urunler.id`

### 2. siparisler → araclar
- **İlişki Tipi:** Many-to-One
- **Açıklama:** Bir sipariş bir araca atanır. Bir araç birden fazla siparişe sahip olabilir.
- **Foreign Key:** `siparisler.arac_id` → `araclar.id`

### 3. stok → urunler
- **İlişki Tipi:** Many-to-One
- **Açıklama:** Bir stok kaydı bir ürüne aittir. Bir ürün birden fazla depoda stoklanabilir.
- **Foreign Key:** `stok.urun_id` → `urunler.id`
- **Cascade:** ON DELETE CASCADE (Ürün silindiğinde stok kayıtları da silinir)

### 4. stok → depolar
- **İlişki Tipi:** Many-to-One
- **Açıklama:** Bir stok kaydı bir depoya aittir. Bir depoda birden fazla ürün stoklanabilir.
- **Foreign Key:** `stok.depo_id` → `depolar.id`
- **Cascade:** ON DELETE CASCADE (Depo silindiğinde stok kayıtları da silinir)

## ER Diyagramı Görselleştirmesi

```
┌─────────────┐
│   urunler   │
├─────────────┤
│ id (PK)     │◄─────┐
│ name        │      │
│ category    │      │
│ min_temp    │      │
│ max_temp    │      │
│ shelf_life  │      │
└─────────────┘      │
                      │
┌─────────────┐       │
│   araclar   │       │
├─────────────┤       │
│ id (PK)     │◄──┐   │
│ plaka       │   │   │
│ kapasite_kg │   │   │
│ aktif_mi    │   │   │
└─────────────┘   │   │
                  │   │
┌─────────────┐   │   │
│  siparisler │   │   │
├─────────────┤   │   │
│ id (PK)     │   │   │
│ urun_id (FK)├───┘   │
│ arac_id (FK)├───────┘
│ miktar_kg   │
│ siparis_tari│
└─────────────┘

┌─────────────┐
│   depolar   │
├─────────────┤
│ id (PK)     │◄─────┐
│ ad          │      │
│ lokasyon    │      │
└─────────────┘      │
                      │
┌─────────────┐       │
│    stok     │       │
├─────────────┤       │
│ id (PK)     │       │
│ urun_id (FK)├───────┘
│ depo_id (FK)├───────┐
│ miktar_kg   │       │
└─────────────┘       │
                      │
                      │
┌─────────────┐       │
│satis_gecmisi│       │
├─────────────┤       │
│ id (PK)     │       │
│ date        │       │
│ store_id    │       │
│ item_id     │       │
│ sales       │       │
└─────────────┘       │
                      │
                      │
                      │
```

## Notlar

- `urunler` tablosundaki `id` alanı AUTO_INCREMENT değildir çünkü CSV'den yüklenen veriler kendi ID'lerini içerir.
- `siparisler` tablosu hem `urunler` hem de `araclar` tablolarına foreign key ile bağlıdır.
- `stok` tablosu hem `urunler` hem de `depolar` tablolarına foreign key ile bağlıdır ve CASCADE DELETE özelliğine sahiptir.
- `satis_gecmisi` tablosu şu an için diğer tablolarla foreign key ilişkisi içermez (tarihsel veri).

## ER Diyagramı Oluşturma

Görsel ER diyagramı oluşturmak için:

1. Python scriptini çalıştırın:
   ```bash
   pip install eralchemy pymysql
   python generate_er_diagram.py
   ```

2. Veya MySQL Workbench, dbdiagram.io, draw.io gibi araçları kullanarak manuel olarak oluşturabilirsiniz.
