# Node.js base image
FROM node:18-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Sistem paketlerini yükle (Oracle Instant Client için gerekli)
RUN apt-get update && apt-get install -y \
    libaio1 \
    unzip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Oracle Instant Client'ı yükle
# Not: Oracle Instant Client'ı manuel olarak indirip scripts/oracle-instantclient klasörüne koyabilirsiniz
# veya aşağıdaki komutu kullanarak otomatik indirebilirsiniz (Oracle hesabı gerekebilir)
RUN mkdir -p /opt/oracle && \
    cd /opt/oracle && \
    (curl -L -o instantclient-basiclite.zip "https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linux.x64-21.1.0.0.0.zip" || \
     echo "Oracle Instant Client indirme başarısız. Lütfen manuel olarak ekleyin.") && \
    if [ -f instantclient-basiclite.zip ]; then \
        unzip -q instantclient-basiclite.zip && \
        rm instantclient-basiclite.zip && \
        cd instantclient_21_1 && \
        rm -f *jdbc* *occi* *mysql* *README *jar uidrvci genezi adrci 2>/dev/null || true && \
        echo /opt/oracle/instantclient_21_1 > /etc/ld.so.conf.d/oracle-instantclient.conf && \
        ldconfig; \
    fi

# Oracle Instant Client path'ini ayarla
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_1:$LD_LIBRARY_PATH
ENV ORACLE_HOME=/opt/oracle/instantclient_21_1

# Package dosyalarını kopyala
COPY package*.json ./

# Tüm bağımlılıkları yükle (build için dev dependencies gerekli)
RUN npm ci

# Uygulama dosyalarını kopyala
COPY . .

# Vite build yap
RUN npm run build

# Production dependencies'i tekrar yükle (sadece runtime için)
RUN npm ci --only=production && npm cache clean --force

# Port'u expose et
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Uygulamayı başlat
CMD ["node", "server.js"]

