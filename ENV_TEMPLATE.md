# Environment Variables Template

Proje kök dizininde `.env` dosyası oluşturun ve aşağıdaki değerleri ayarlayın:

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
# Alternatif olarak tam connect string kullanabilirsiniz:
# DB_CONNECT_STRING=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=172.16.34.8)(PORT=1521))(CONNECT_DATA=(SID=ORCL)))

# Oracle Client Configuration (Docker için)
ORACLE_HOME=/opt/oracle/instantclient_21_1

# Domain Configuration
DOMAIN=planlama.denizcast.com
```

## Kullanım

1. Bu dosyayı `.env` olarak kopyalayın:
   ```bash
   cp ENV_TEMPLATE.md .env
   ```

2. Değerleri kendi ortamınıza göre düzenleyin

3. `.env` dosyasını git'e commit etmeyin (zaten .dockerignore'da)



















