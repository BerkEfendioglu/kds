
# Proje Adı: Soğuk Zincir Lojistiği için Bütünsel Karar Destek Sistemi

**Yazar:** [Author Name]
**Danışman:** [Advisor Name]
**Kurum:** [University/Institution Name]
**Tarih:** [Date] 

---

## 1. Özet

Bu çalışma, soğuk zincir lojistik süreçlerinin optimizasyonu ve yönetimi için geliştirilmiş, çok katmanlı ve veriye dayalı bir Karar Destek Sistemi (KDS) sunmaktadır. Proje, operasyonel verimliliği artırmayı, maliyetleri minimize etmeyi ve ürün kalitesini güvence altına almayı hedeflemektedir. Geliştirilen sistem, gerçek zamanlı veri izleme, tahminsel analitik ve preskriptif (yönlendirici) öneri mekanizmalarını bir araya getirerek, lojistik yöneticilerinin stratejik, taktiksel ve operasyonel düzeylerde daha etkin ve bilgiye dayalı kararlar almasını sağlamayı amaçlamaktadır.

## 2. Giriş

Soğuk zincir lojistiği, sıcaklığa duyarlı ürünlerin (gıda, ilaç, kimyasal maddeler) üretimden tüketime kadar olan tüm süreçlerde, belirlenmiş sıcaklık aralıklarında tutulmasını gerektiren kritik bir alandır. Bu süreçlerdeki en küçük bir sapma dahi, ürünlerin bozulmasına, finansal kayıplara ve halk sağlığı risklerine yol açabilmektedir. Geleneksel lojistik yönetim sistemleri, genellikle reaktif bir yaklaşımla, yani sorunlar ortaya çıktıktan sonra müdahale etme prensibiyle çalışmaktadır. Bu durum, önleyici tedbirlerin alınmasını zorlaştırmakta ve verimliliği düşürmektedir.

Bu çalışmanın temel motivasyonu, geleneksel sistemlerin bu eksikliklerini gidermek ve lojistik yöneticilerine proaktif bir yönetim imkanı sunmaktır. Bu amaçla, modern web teknolojileri, veritabanı yönetimi ve makine öğrenmesi tekniklerini bir araya getiren bütünsel bir Karar Destek Sistemi tasarlanmış ve geliştirilmiştir.

## 3. Sistem Mimarisi ve Tasarımı

Geliştirilen sistem, modüler ve ölçeklenebilir bir yapıya sahip olup, üç ana katmandan oluşmaktadır: Veri İşleme ve Analitik Katmanı, Arka Uç (Backend) Servis Katmanı ve Ön Uç (Frontend) Görselleştirme Katmanı.

### 3.1. Veritabanı Mimarisi ve Veri İşleme

Bu katman, sistemin veri temelini oluşturur ve ham veriden anlamlı, yapılandırılmış bilgiler üretir. Süreç, veritabanı şemasının tasarımını, veri entegrasyonunu (ETL) ve tahminsel analitiği içerir.

*   **Veritabanı Tasarımı (MySQL):**
    Sistem için `cold_chain_db` adında ilişkisel bir veritabanı şeması tasarlanmıştır. Bu şema, soğuk zincir operasyonlarının temel varlıklarını ve ilişkilerini normalleştirilmiş bir yapıda saklar. Başlıca tablolar şunlardır:
    *   `products`: Ürünlerin katalog bilgilerini (ID, isim, kategori, optimum sıcaklık aralığı, raf ömrü) içerir.
    *   `araclar` (Vehicles): Filodaki her bir aracın plaka, tip, kapasite gibi statik bilgilerini barındırır.
    *   `depolar` (Warehouses): Lojistik ağındaki depoların konum, kapasite gibi bilgilerini içerir.
    *   `siparisler` (Orders): Müşteri siparişlerinin detaylarını (ID, müşteri, tarih, tutar, durum) tutar.
    *   `sales_history`: Geçmiş satış verilerini (tarih, ürün ID, mağaza ID, satılan miktar) barındırır. Bu tablo, özellikle talep tahmini modeli için temel veri kaynağıdır.

*   **Veri Entegrasyonu (ETL - Extract, Transform, Load):**
    Sistemin, harici veri kaynaklarından beslenmesi için Python tabanlı bir ETL süreci geliştirilmiştir (`import_data.py`).
    1.  **Extract (Çıkartma):** Süreç, `train.csv` dosyasında bulunan ham ve yapılandırılmamış satış verilerinin Pandas DataFrame'ine okunmasıyla başlar.
    2.  **Transform (Dönüştürme):** Bu aşamada, veri kalitesini artırmak ve veritabanı şemasına uygun hale getirmek için çeşitli dönüşümler uygulanır:
        *   Ürün ID'leri, önceden tanımlanmış bir harita kullanılarak daha anlamlı ürün bilgileri (kategori, sıcaklık aralığı) ile zenginleştirilir.
        *   Tarih/saat sütunları standart bir formata (`datetime`) dönüştürülür.
        *   Sütun isimleri, veritabanı tablolarındaki isimlendirme kurallarına uygun olacak şekilde yeniden adlandırılır (örn. `item` -> `item_id`).
    3.  **Load (Yükleme):** Dönüştürülmüş ve temizlenmiş veriler, SQLAlchemy kütüphanesi aracılığıyla MySQL veritabanındaki ilgili tablolara (`products`, `sales_history`) verimli bir şekilde yüklenir. Bu süreç, `to_sql` fonksiyonunun `chunksize` parametresi kullanılarak büyük veri setlerinde bile performanslı çalışacak şekilde optimize edilmiştir.

*   **Tahminsel Analitik ve Makine Öğrenmesi:**
    Projenin proaktif yeteneklerinin temelini oluşturan talep tahmini modeli (`forecast.py`), şu adımları izler:
    1.  Veritabanından, belirli bir ürünün zaman serisi verisi (tarihe göre satış miktarları) çekilir.
    2.  Bu veriler, Facebook tarafından geliştirilen ve özellikle mevsimsel etkiler (yıllık, haftalık) ve tatil günleri gibi faktörleri başarılı bir şekilde modelleyebilen **Prophet** kütüphanesine girdi olarak sağlanır.
    3.  `Prophet` modeli, `fit` metodu ile eğitilir ve ardından `make_future_dataframe` ile gelecek dönemler için bir zaman çerçevesi oluşturulur.
    4.  `predict` metodu, bu gelecek zaman çerçevesi için tahmini satış değerlerini (`yhat`), güven aralıklarını (`yhat_lower`, `yhat_upper`) ve trend bileşenlerini içeren detaylı bir tahmin tablosu üretir. Bu çıktılar, stratejik stok ve kapasite planlaması için temel oluşturur.

### 3.2. Arka Uç (Backend) Mimarisi ve Servis Katmanı

Arka uç, MVC (Model-View-Controller) tasarım desenine uygun olarak yapılandırılmış, servis odaklı bir mimariye sahiptir. Bu yapı, kodun organize, sürdürülebilir ve ölçeklenebilir olmasını sağlar.

*   **Teknoloji Stack:** Arka uç, asenkron ve olay tabanlı yapısı sayesinde yüksek performanslı I/O operasyonları sunan **Node.js** çalışma zamanı üzerinde çalışır. Web sunucusu ve rota yönetimi için endüstri standardı olan **Express.js** çatısı kullanılmıştır.

*   **MVC Yapılanması:**
    *   **Models:** Bu projede "Model" katmanı, veritabanı şemasının kendisi ve `config/db.js` dosyasında tanımlanan veritabanı bağlantı havuzu (connection pool) tarafından temsil edilmektedir. Bu havuz, `mysql2/promise` kütüphanesi kullanılarak oluşturulmuş olup, veritabanı bağlantılarının verimli bir şekilde yönetilmesini ve yeniden kullanılmasını sağlar.
    *   **Views:** "View" katmanı, sunucu tarafından render edilmeyen, istemci tarafında (frontend) dinamik olarak oluşturulan kullanıcı arayüzüdür. Arka uç, bu katmana veri sağlamakla yükümlüdür.
    *   **Controllers (`controllers/` dizini):** Her bir API uç noktası için iş mantığını içeren dosyalardır (örn. `productController.js`). Bir istek geldiğinde, ilgili controller fonksiyonu veritabanından gerekli veriyi sorgular, işler ve istemciye bir yanıt (genellikle JSON formatında) olarak gönderir. Hata yönetimi (try-catch blokları) ve HTTP durum kodlarının (200, 500 vb.) doğru bir şekilde ayarlanması bu katmanın sorumluluğundadır.

*   **Rota Yönetimi (Routing - `routes/` dizini):**
    Uygulamanın API uç noktaları, `routes/apiRoutes.js` dosyasında merkezi olarak tanımlanmıştır. Express'in `Router` modülü kullanılarak, `/api/products`, `/api/vehicles` gibi yollar (paths), ilgili controller fonksiyonlarına eşlenir. Bu ayrım, uygulamanın uç noktalarının daha kolay yönetilmesini ve okunabilir olmasını sağlar.

*   **Uygulama Giriş Noktası (`app.js` ve `server.js`):**
    *   `app.js`: Express uygulamasının ana yapılandırma dosyasıdır. Middleware'lerin (örn. `express.static` ile statik dosya sunumu), ana yönlendiricinin (`/api` rotasının `apiRoutes`'a bağlanması) ve temel uygulama ayarlarının yapıldığı yerdir.
    *   `server.js`: Uygulamanın başlatıldığı ana betiktir. `.env` dosyasından ortam değişkenlerini (`dotenv` paketi ile) yükler, `app.js`'ten uygulama örneğini alır ve tanımlanan port üzerinden sunucuyu dinlemeye başlar.

*   **API Tasarımı (RESTful):**
    API, REST (Representational State Transfer) mimari prensiplerine uygun olarak tasarlanmıştır. Her bir varlık (ürün, sipariş vb.) bir kaynak (resource) olarak kabul edilir ve standart HTTP metotları (GET, POST, PUT, DELETE) ile bu kaynaklar üzerinde işlem yapılır. Bu proje, veri çekme operasyonları için `GET` metodunu kullanır. Örneğin, `GET /api/products` isteği, tüm ürünlerin bir listesini JSON formatında döndürür. Bu standart yaklaşım, API'nin hem insanlar hem de makineler tarafından kolayca anlaşılmasını ve kullanılmasını sağlar.

### 3.3. Ön Uç (Frontend) ve Kullanıcı Arayüzü

Bu katman, sistemin kullanıcı ile etkileşime girdiği görsel arayüzdür.

*   **Merkezi Kontrol Paneli (Dashboard):** Geliştirilen arayüz, tek sayfa uygulaması (Single Page Application, SPA) mantığında çalışan, zengin ve interaktif bir kontrol panelidir. **HTML5**, **CSS3** ve **JavaScript** ile geliştirilmiş, **Bootstrap** ile modern ve duyarlı bir tasarım kazandırılmıştır.
*   **Dinamik Veri Görselleştirme:**
    *   **Etkileşimli Harita:** **Leaflet.js** kütüphanesi, filodaki araçların gerçek zamanlı coğrafi takibini sağlar. Araçların durumu (normal/riskli) renk kodları ile belirtilir ve her bir araç için detaylı telemetri verileri sunulur.
    *   **Analitik Grafikler:** **Chart.js** kütüphanesi, talep tahmin eğrileri, yakıt tüketim analizleri, fire/atık oranları ve depo doluluk oranları gibi karmaşık verileri, anlaşılır ve yorumlanabilir grafikler halinde sunar.
*   **Yapay Zeka Destekli Karar Modülü:** Bu modül, arka planda işlenen veriler ve analitik motorun çıktıları doğrultusunda, kullanıcıya üç seviyede öneriler sunar:
    1.  **Stratejik Kararlar:** Uzun vadeli planlamaya yönelik öneriler (örn. filo genişletme).
    2.  **Taktiksel Kararlar:** Orta vadeli optimizasyonlara yönelik öneriler (örn. depolar arası stok transferi).
    3.  **Operasyonel Kararlar:** Anlık müdahale gerektiren durumlara yönelik öneriler (örn. sıcaklık ihlali durumunda acil durum protokolü).

## 4. Kullanılan Teknolojiler ve Araçlar

*   **Ön Uç (Frontend):** HTML5, CSS3, JavaScript (ES6+), Bootstrap, Leaflet.js, Chart.js
*   **Arka Uç (Backend):** Node.js, Express.js
*   **Veritabanı:** MySQL
*   **Veri Bilimi ve Analitik:** Python 3.x, Pandas, SQLAlchemy, Prophet, Matplotlib

## 5. Sonuç ve Değerlendirme

Bu çalışma kapsamında geliştirilen KECHY Karar Destek Sistemi, soğuk zincir lojistiği alanında sıkça karşılaşılan problemlere modern ve yenilikçi bir çözüm sunmaktadır. Sistem, geleneksel reaktif yönetim anlayışının aksine, **proaktif (önleyici)** ve **preskriptif (yönlendirici)** bir yaklaşım benimsemektedir. Projenin en önemli katkısı, yalnızca mevcut durumu raporlamakla kalmayıp, aynı zamanda makine öğrenmesi ile geleceğe yönelik tahminler üreterek ve bu tahminlere dayalı olarak somut aksiyon planları önererek karar alma süreçlerini otomatize etmesi ve optimize etmesidir.

Yapay zeka destekli öneri motoru, operasyonel verimliliği artırırken, insan faktörünü denklemin dışında bırakmak yerine, yöneticinin sezgisel yeteneklerini veriye dayalı öngörülerle güçlendirmeyi hedefler. Bu entegre yaklaşım, soğuk zincir yönetiminde karşılaşılan risklerin minimize edilmesine, kaynakların daha verimli kullanılmasına ve nihayetinde müşteri memnuniyetinin artırılmasına olanak tanımaktadır.

Gelecek çalışmalarda, sistemin gerçek zamanlı IoT sensör verileri ile doğrudan entegrasyonu, daha karmaşık optimizasyon algoritmalarının (örneğin, dinamik rota optimizasyonu için genetik algoritmalar) eklenmesi ve öneri motorunun pekiştirmeli öğrenme (reinforcement learning) ile kendi kendine daha iyi kararlar alabilen bir yapıya kavuşturulması gibi geliştirmeler planlanmaktadır.
