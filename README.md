# Planlama Modülü

Oracle veritabanından veri çekerek planlama yapmak için geliştirilmiş web uygulaması.

## Özellikler

- Oracle veritabanı bağlantısı
- Gerçek zamanlı veri görüntüleme
- İnteraktif grafikler ve tablolar
- Filtreleme ve arama özellikleri
- OOP kurallarına uygun kod yapısı
- Hot reload ile geliştirme desteği (Vite)

## Kurulum

1. Node.js paketlerini yükleyin:
```bash
npm install
```

2. Oracle Instant Client'ı yükleyin (Oracle veritabanı bağlantısı için gerekli)

3. Backend sunucusunu başlatın:
```bash
npm start
```

4. Frontend'i Vite ile başlatın (yeni terminal):
```bash
npm run frontend:dev
```

5. Tarayıcıda `http://localhost:3001` adresini açın

## Veritabanı Bağlantı Bilgileri

- Host: 172.16.34.8
- Port: 1521
- SID: ORCL
- Kullanıcı: ERPREADONLY
- Şifre: ERPREADONLY

## Dosya Yapısı

```
├── index.html          # Ana HTML dosyası
├── server.js           # Node.js backend sunucusu
├── vite.config.js      # Vite konfigürasyonu
├── package.json        # NPM paket tanımları
├── js/
│   ├── DatabaseService.js  # Veritabanı servisi
│   ├── DataGrid.js          # Tablo yönetimi
│   ├── ChartManager.js      # Grafik yönetimi
│   └── PlanningApp.js       # Ana uygulama
```

## Kullanım

1. Uygulama açıldığında Oracle veritabanından veriler otomatik olarak yüklenir
2. Sol paneldeki tabloda verileri görüntüleyebilir ve filtreleyebilirsiniz
3. Sağ paneldeki grafiklerde haftalık ve günlük verileri görüntüleyebilirsiniz
4. Tablodaki tarihleri düzenleyebilirsiniz
5. Grafiklerdeki segmentleri sürükleyerek tarih değiştirebilirsiniz

## Geliştirme

### 🚀 Tam Geliştirme Ortamı (Önerilen)
Hem backend hem frontend'i aynı anda çalıştırmak için:
```bash
npm run dev:full
```

Bu komut:
- Backend'i nodemon ile başlatır (port 3000)
- Frontend'i Vite ile başlatır (port 3001)
- Her iki serviste de hot reload aktif

### Backend Geliştirme
Sadece backend geliştirme modunda çalıştırmak için:
```bash
npm run dev
```

Bu komut nodemon kullanarak dosya değişikliklerini otomatik olarak algılar ve sunucuyu yeniden başlatır.

### Frontend Geliştirme
Sadece frontend geliştirme modunda çalıştırmak için:
```bash
npm run frontend:dev
```

Bu komut Vite kullanarak hot reload özelliği ile frontend'i başlatır. Dosya değişikliklerini otomatik olarak algılar ve tarayıcıyı yeniler.

### Production Build
Production için build almak için:
```bash
npm run build
```

## Port Bilgileri

- Backend API: `http://localhost:3000`
- Frontend (Vite): `http://localhost:3001`
- Production Build: `npm run preview` ile test edilebilir

