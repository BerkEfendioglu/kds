
import pandas as pd
from sqlalchemy import create_engine, text
import random
import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

# --- Veritabanı Bağlantısı ---
db_host = os.getenv("DB_HOST", "localhost")
db_user = os.getenv("DB_USER", "root")
db_password = os.getenv("DB_PASSWORD", "")
db_name = os.getenv("DB_NAME", "cold_chain_db")

db_connection_str = f'mysql+mysqlconnector://{db_user}:{db_password}@{db_host}/'
engine = create_engine(db_connection_str)

def setup_database():
    with engine.connect() as connection:
        # Veritabanını oluştur
        connection.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}`"))
        connection.execute(text(f"USE `{db_name}`"))
        print(f"Veritabanı '{db_name}' oluşturuldu veya zaten mevcut ve seçildi.")

        # Tabloların varlığını kontrol et
        tables = ['urunler', 'satis_gecmisi', 'araclar', 'siparisler', 'depolar', 'stok']
        existing_tables_query = connection.execute(text("SHOW TABLES"))
        existing_tables = {row[0] for row in existing_tables_query}

        # Eğer tablolar zaten varsa ve doluysa işlemi atla
        if 'urunler' in existing_tables:
            count_query = connection.execute(text("SELECT COUNT(*) FROM urunler"))
            if count_query.scalar() > 0:
                print("Veritabanı zaten dolu görünüyor. Kurulum atlanıyor.")
                return

        print("Tablolar oluşturuluyor...")
        # --- Tablo Oluşturma ---
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS urunler (
                id INT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                min_temp FLOAT,
                max_temp FLOAT,
                shelf_life_days INT
            );
        """))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS satis_gecmisi (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATETIME,
                store_id INT,
                item_id INT,
                sales INT
            );
        """))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS araclar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                plaka VARCHAR(255) NOT NULL UNIQUE,
                kapasite_kg INT,
                aktif_mi BOOLEAN DEFAULT true
            );
        """))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS depolar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ad VARCHAR(255) NOT NULL,
                lokasyon VARCHAR(255)
            );
        """))
        connection.execute(text("""
           CREATE TABLE IF NOT EXISTS siparisler (
                id INT AUTO_INCREMENT PRIMARY KEY,
                urun_id INT,
                arac_id INT,
                miktar_kg INT,
                siparis_tarihi DATETIME,
                FOREIGN KEY (urun_id) REFERENCES urunler(id),
                FOREIGN KEY (arac_id) REFERENCES araclar(id)
            );
        """))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS stok (
                id INT AUTO_INCREMENT PRIMARY KEY,
                urun_id INT,
                depo_id INT,
                miktar_kg INT,
                FOREIGN KEY (urun_id) REFERENCES urunler(id) ON DELETE CASCADE,
                FOREIGN KEY (depo_id) REFERENCES depolar(id) ON DELETE CASCADE
            );
        """))
        print("Tüm tablolar oluşturuldu veya zaten mevcut.")

        # --- CSV'den Veri Yükleme ---
        print("CSV dosyası okunuyor...")
        try:
            df = pd.read_csv('train.csv', nrows=50000)
            df['date'] = pd.to_datetime(df['date'])
        except FileNotFoundError:
            print("HATA: 'train.csv' bulunamadı.")
            return

        # Ürün Haritası
        product_mapping = {
            1: {"name": "Maraş Dondurması", "category": "Dondurulmuş", "min": -25, "max": -18},
            2: {"name": "Taze Süt (1L)", "category": "Süt Ürünleri", "min": 2, "max": 4},
            3: {"name": "Dondurulmuş Pizza", "category": "Dondurulmuş", "min": -20, "max": -18},
            4: {"name": "Kaşar Peyniri", "category": "Süt Ürünleri", "min": 4, "max": 8},
            5: {"name": "Mevsim Salata", "category": "Taze Sebze", "min": 2, "max": 6},
        }

        def get_product_info(item_id):
            if item_id in product_mapping:
                return product_mapping[item_id]
            else:
                cat_list = [("Yoğurt", 2, 6), ("Tereyağı", 2, 6)]
                cat, min_t, max_t = random.choice(cat_list)
                return {"name": f"Ürün {item_id}", "category": cat, "min": min_t, "max": max_t}

        # Ürünler
        products_data = []
        unique_items = df['item'].unique()
        for item_id in unique_items:
            info = get_product_info(item_id)
            products_data.append({
                'id': item_id, 'name': info['name'], 'category': info['category'],
                'min_temp': info['min'], 'max_temp': info['max'], 'shelf_life_days': 30
            })
        df_products = pd.DataFrame(products_data)
        df_products.to_sql('urunler', engine, if_exists='append', index=False)
        print(f"{len(df_products)} ürün 'urunler' tablosuna eklendi.")

        # Satışlar
        df_sales = df.rename(columns={'item': 'item_id', 'store': 'store_id'})
        df_sales.to_sql('satis_gecmisi', engine, if_exists='append', index=False, chunksize=10000)
        print(f"{len(df_sales)} satış kaydı 'satis_gecmisi' tablosuna eklendi.")


        # --- Örnek Veri Ekleme ---
        print("Örnek veriler ekleniyor...")
        araclar_data = pd.DataFrame([
            {'plaka': '34 ABC 123', 'kapasite_kg': 1000},
            {'plaka': '35 DEF 456', 'kapasite_kg': 1500},
            {'plaka': '06 GHI 789', 'kapasite_kg': 1200}
        ])
        araclar_data.to_sql('araclar', engine, if_exists='append', index=False)
        print(f"{len(araclar_data)} araç eklendi.")

        depolar_data = pd.DataFrame([
            {'ad': 'Ana Depo', 'lokasyon': 'İstanbul'},
            {'ad': 'İzmir Depo', 'lokasyon': 'İzmir'},
            {'ad': 'Ankara Depo', 'lokasyon': 'Ankara'}
        ])
        depolar_data.to_sql('depolar', engine, if_exists='append', index=False)
        print(f"{len(depolar_data)} depo eklendi.")

        # Siparişler (urunler ve araclar tablosundan ID alarak)
        urun_ids = pd.read_sql("SELECT id FROM urunler LIMIT 5", engine)['id'].tolist()
        arac_ids = pd.read_sql("SELECT id FROM araclar LIMIT 3", engine)['id'].tolist()
        if urun_ids and arac_ids:
            siparisler_data = pd.DataFrame([
                {'urun_id': urun_ids[0], 'arac_id': arac_ids[0], 'miktar_kg': 50, 'siparis_tarihi': pd.to_datetime('now')},
                {'urun_id': urun_ids[1], 'arac_id': arac_ids[1], 'miktar_kg': 120, 'siparis_tarihi': pd.to_datetime('now')},
                {'urun_id': urun_ids[2], 'arac_id': arac_ids[0], 'miktar_kg': 75, 'siparis_tarihi': pd.to_datetime('now')},
            ])
            siparisler_data.to_sql('siparisler', engine, if_exists='append', index=False)
            print(f"{len(siparisler_data)} sipariş eklendi.")

        # Stok (urunler ve depolar tablosundan ID alarak)
        depo_ids = pd.read_sql("SELECT id FROM depolar", engine)['id'].tolist()
        if urun_ids and depo_ids:
            stok_data = []
            for urun_id in urun_ids:
                for depo_id in depo_ids:
                    stok_data.append({'urun_id': urun_id, 'depo_id': depo_id, 'miktar_kg': random.randint(100, 1000)})
            df_stok = pd.DataFrame(stok_data)
            df_stok.to_sql('stok', engine, if_exists='append', index=False)
            print(f"{len(df_stok)} stok kaydı eklendi.")

        print("✅ Veritabanı kurulumu başarıyla tamamlandı.")


if __name__ == "__main__":
    try:
        # Gerekli Python paketlerini kontrol et
        import pandas
        import sqlalchemy
        import dotenv
        import mysql.connector
    except ImportError as e:
        print(f"HATA: Gerekli bir Python paketi eksik: {e.name}")
        print("Lütfen 'pip install pandas sqlalchemy python-dotenv mysql-connector-python' komutu ile eksik paketleri kurun.")
        exit(1)
        
    setup_database()
