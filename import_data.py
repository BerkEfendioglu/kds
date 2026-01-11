import pandas as pd
from sqlalchemy import create_engine
import random

# 1. VERİYİ OKU
print("CSV dosyası okunuyor...")
try:
    df = pd.read_csv('train.csv')
    df = df.head(50000) # Hız için ilk 50k satır
    df['date'] = pd.to_datetime(df['date'])
except FileNotFoundError:
    print("HATA: 'train.csv' bulunamadı.")
    exit()

# 2. ÜRÜN HARİTASI
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

# 3. BAĞLANTI (cold_chain_db)
db_connection_str = 'mysql+mysqlconnector://root:@localhost/cold_chain_db'
db_connection = create_engine(db_connection_str)

print("Veritabanına (cold_chain_db) bağlanıldı...")

# 4. YÜKLEME
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
try:
    df_products.to_sql('products', db_connection, if_exists='append', index=False)
except:
    pass # Zaten varsa geç

# Satışlar
print("Satış verileri yükleniyor...")
df_sales = df.rename(columns={'item': 'item_id', 'store': 'store_id'})
df_sales.to_sql('sales_history', db_connection, if_exists='append', index=False, chunksize=10000)

print("✅ Veriler Yüklendi!")