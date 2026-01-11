#!/usr/bin/env python3
"""
ER Diyagramı oluşturma scripti
Bu script, veritabanı şemasından ER diyagramı oluşturur.
"""

try:
    from eralchemy import render_er
    import os
    from dotenv import load_dotenv

    load_dotenv()

    # Veritabanı bağlantı bilgileri
    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "")
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME", "cold_chain_db")

    # MySQL bağlantı string'i
    connection_string = f"mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}"

    # ER diyagramı oluştur
    print("ER diyagramı oluşturuluyor...")
    render_er(connection_string, 'ER_DIAGRAM.png')
    print("✅ ER_DIAGRAM.png oluşturuldu!")
    
except ImportError:
    print("ER diyagramı oluşturmak için gerekli kütüphaneler yüklü değil.")
    print("Yüklemek için: pip install eralchemy pymysql")
    print("\nAlternatif olarak, aşağıdaki SQL şemasını kullanarak manuel olarak oluşturabilirsiniz:")
    print("\n" + "="*80)
    print("ER DİYAGRAMI AÇIKLAMASI")
    print("="*80)
    print("""
TABLOLAR VE İLİŞKİLER:

1. urunler (Ürünler)
   - id (PK, INT)
   - name (VARCHAR)
   - category (VARCHAR)
   - min_temp (FLOAT)
   - max_temp (FLOAT)
   - shelf_life_days (INT)

2. araclar (Araçlar)
   - id (PK, INT, AUTO_INCREMENT)
   - plaka (VARCHAR, UNIQUE)
   - kapasite_kg (INT)
   - aktif_mi (BOOLEAN)

3. depolar (Depolar)
   - id (PK, INT, AUTO_INCREMENT)
   - ad (VARCHAR)
   - lokasyon (VARCHAR)

4. siparisler (Siparişler)
   - id (PK, INT, AUTO_INCREMENT)
   - urun_id (FK -> urunler.id)
   - arac_id (FK -> araclar.id)
   - miktar_kg (INT)
   - siparis_tarihi (DATETIME)

5. stok (Stok)
   - id (PK, INT, AUTO_INCREMENT)
   - urun_id (FK -> urunler.id, ON DELETE CASCADE)
   - depo_id (FK -> depolar.id, ON DELETE CASCADE)
   - miktar_kg (INT)

6. satis_gecmisi (Satış Geçmişi)
   - id (PK, INT, AUTO_INCREMENT)
   - date (DATETIME)
   - store_id (INT)
   - item_id (INT)
   - sales (INT)

İLİŞKİLER:
- siparisler.urun_id -> urunler.id
- siparisler.arac_id -> araclar.id
- stok.urun_id -> urunler.id (CASCADE DELETE)
- stok.depo_id -> depolar.id (CASCADE DELETE)
    """)
except Exception as e:
    print(f"Hata: {e}")
    print("\nManuel ER diyagramı açıklaması yukarıda gösterilmiştir.")
