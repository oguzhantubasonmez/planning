# Hızlı Başlangıç - Docker Deployment

## Hızlı Kurulum (HTTP - Test İçin)

1. **Environment dosyası oluştur:**
   ```bash
   # .env dosyası oluşturun ve aşağıdaki değerleri ayarlayın
   DB_HOST=172.16.34.8
   DB_PORT=1521
   DB_SID=ORCL
   DB_USER=ERPREADONLY
   DB_PASSWORD=ERPREADONLY
   ```

2. **HTTP-only nginx config kullan (SSL olmadan):**
   ```bash
   # planlama.conf'u geçici olarak devre dışı bırak
   mv nginx/conf.d/planlama.conf nginx/conf.d/planlama.conf.bak
   # HTTP-only config'i aktif et
   mv nginx/conf.d/planlama-http.conf nginx/conf.d/planlama-http-active.conf
   ```

3. **Docker container'ları başlat:**
   ```bash
   docker-compose up -d --build
   ```

4. **Logları kontrol et:**
   ```bash
   docker-compose logs -f
   ```

5. **Tarayıcıda aç:**
   - `http://planlama.denizcast.com` (DNS ayarlıysa)
   - veya `http://localhost` (local test için)

## Production Kurulum (HTTPS)

1. **SSL sertifikalarını hazırla:**
   ```bash
   # Sertifikaları nginx/ssl/ klasörüne koyun
   cp your-cert.crt nginx/ssl/planlama.denizcast.com.crt
   cp your-key.key nginx/ssl/planlama.denizcast.com.key
   ```

2. **HTTPS config'i aktif et:**
   ```bash
   # HTTP-only config'i kaldır
   rm nginx/conf.d/planlama-http-active.conf
   # HTTPS config'i aktif et
   mv nginx/conf.d/planlama.conf.bak nginx/conf.d/planlama.conf
   ```

3. **Container'ları yeniden başlat:**
   ```bash
   docker-compose restart nginx
   ```

## Önemli Notlar

- Oracle Instant Client Dockerfile'da otomatik indirilmeye çalışılır
- Eğer indirme başarısız olursa, manuel olarak eklemeniz gerekebilir
- Veritabanı IP adresinin Docker container'dan erişilebilir olduğundan emin olun
- DNS ayarlarını yapmadan önce local IP ile test edebilirsiniz

## Sorun Giderme

**Container başlamıyor:**
```bash
docker-compose logs app
```

**Oracle bağlantı hatası:**
- Veritabanı IP'sini kontrol edin
- Firewall ayarlarını kontrol edin
- `.env` dosyasındaki DB bilgilerini kontrol edin

**Nginx hatası:**
```bash
docker-compose exec nginx nginx -t
```














