import pandas as pd
from sqlalchemy import create_engine
from prophet import Prophet
import matplotlib.pyplot as plt

# BAĞLANTI (cold_chain_db)
db_connection_str = 'mysql+mysqlconnector://root:@localhost/cold_chain_db'
db_connection = create_engine(db_connection_str)

print("Veriler çekiliyor...")
query = "SELECT date as ds, sales as y FROM sales_history WHERE item_id = 1 ORDER BY date ASC"
df = pd.read_sql(query, db_connection)

print(f"{len(df)} satır veri ile model eğitiliyor...")
model = Prophet(yearly_seasonality=True, daily_seasonality=False)
model.fit(df)

future = model.make_future_dataframe(periods=90)
forecast = model.predict(future)

print("Grafik çiziliyor...")
model.plot(forecast)
plt.title("Maraş Dondurması - Gelecek 3 Ay Satış Tahmini")
plt.show()

model.plot_components(forecast)
plt.show()