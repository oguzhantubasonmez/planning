# Docker Deployment Kılavuzu

Bu doküman, planlama uygulamasını Docker ile `planlama.denizcast.com` domain'i üzerinden yayınlamak için gerekli adımları içerir.

## Ön Gereksinimler

1. Docker ve Docker Compose kurulu olmalı
2. `planlama.denizcast.com` domain'i için DNS kaydı yapılmış olmalı
3. SSL sertifikaları hazır olmalı (Let's Encrypt veya şirket içi CA)

## Kurulum Adımları

### 1. Environment Değişkenlerini Ayarlayın

Proje kök dizininde `.env` dosyası oluşturun:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Oracle Database Configuration
DB_HOST=172.16.34.8
DB_PORT=1521
DB_SID=ORCL
DB_USER=ERPREADONLY
DB_PASSWORD=ERPREADONLY

# Oracle Client Configuration (Docker için)
ORACLE_HOME=/opt/oracle/instantclient_21_1

# Domain Configuration
DOMAIN=planlama.denizcast.com
```

### 2. SSL Sertifikalarını Hazırlayın

SSL sertifikalarınızı `nginx/ssl/` klasörüne koyun:

- `planlama.denizcast.com.crt` - SSL sertifikası
- `planlama.denizcast.com.key` - SSL private key

**Not:** Eğer Let's Encrypt kullanıyorsanız, sertifikaları şu şekilde kopyalayabilirsiniz:

```bash
cp /etc/letsencrypt/live/planlama.denizcast.com/fullchain.pem nginx/ssl/planlama.denizcast.com.crt
cp /etc/letsencrypt/live/planlama.denizcast.com/privkey.pem nginx/ssl/planlama.denizcast.com.key
```

### 3. Oracle Instant Client (Opsiyonel)

Dockerfile otomatik olarak Oracle Instant Client'ı indirmeye çalışır. Eğer bu başarısız olursa:

1. Oracle Instant Client'ı manuel olarak indirin
2. `scripts/oracle-instantclient/` klasörüne koyun
3. Dockerfile'ı buna göre düzenleyin

### 4. Docker Container'larını Başlatın

```bash
# Build ve start
docker-compose up -d --build

# Logları kontrol edin
docker-compose logs -f

# Container durumunu kontrol edin
docker-compose ps
```

### 5. DNS Ayarları

`planlama.denizcast.com` domain'inin A kaydını Docker host'unun IP adresine yönlendirin.

## Yapılandırma

### Nginx Yapılandırması

Nginx yapılandırması `nginx/conf.d/planlama.conf` dosyasında bulunur. Gerekirse düzenleyebilirsiniz.

### Port Ayarları

Varsayılan olarak:
- HTTP: Port 80
- HTTPS: Port 443

Bu portları değiştirmek için `docker-compose.yml` dosyasındaki `nginx` servisinin `ports` bölümünü düzenleyin.

### Veritabanı Bağlantısı

Veritabanı bağlantı bilgileri `.env` dosyasından veya `docker-compose.yml` içindeki environment değişkenlerinden alınır.

## Yönetim Komutları

```bash
# Container'ları durdur
docker-compose down

# Container'ları yeniden başlat
docker-compose restart

# Logları görüntüle
docker-compose logs -f app
docker-compose logs -f nginx

# Container'a bağlan
docker-compose exec app sh

# Nginx config'i test et
docker-compose exec nginx nginx -t

# Nginx'i yeniden yükle
docker-compose exec nginx nginx -s reload
```

## Sorun Giderme

### Health Check Hatası

```bash
# Health check endpoint'ini test edin
curl http://localhost:3000/api/health
```

### Oracle Bağlantı Hatası

1. Container loglarını kontrol edin: `docker-compose logs app`
2. Veritabanı IP adresinin container'dan erişilebilir olduğundan emin olun
3. Firewall ayarlarını kontrol edin

### SSL Sertifika Hatası

1. Sertifika dosyalarının doğru konumda olduğundan emin olun
2. Dosya izinlerini kontrol edin
3. Nginx config'i test edin: `docker-compose exec nginx nginx -t`

### Port Çakışması

Eğer 80 veya 443 portları kullanılıyorsa, `docker-compose.yml` dosyasında port mapping'i değiştirin:

```yaml
ports:
  - "8080:80"
  - "8443:443"
```

## Production İpuçları

1. **Log Rotation**: Nginx logları için log rotation yapılandırın
2. **Backup**: Düzenli olarak veritabanı yedekleri alın
3. **Monitoring**: Container'ları izlemek için monitoring araçları kullanın
4. **Updates**: Düzenli olarak Docker image'larını güncelleyin

## Güvenlik

- SSL sertifikalarını güvenli bir şekilde saklayın
- `.env` dosyasını git'e commit etmeyin
- Production'da güçlü şifreler kullanın
- Firewall kurallarını düzenli olarak gözden geçirin








