/**
 * Veritabanı servisi sınıfı - Oracle veritabanından veri çekme işlemlerini yönetir
 */
class DatabaseService {
    constructor() {
        // Environment variable'dan baseUrl al, yoksa window.location.origin kullan
        const apiBaseUrl = window.API_BASE_URL || window.location.origin;
        this.baseUrl = `${apiBaseUrl}/api`;
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 dakika (5 dakikadan 30 dakikaya çıkarıldı)
        this.requestQueue = new Map(); // Aynı anda aynı istekleri engellemek için
    }

    /**
     * Oracle veritabanından veri çeker
     * @param {Object} options - Veri çekme seçenekleri
     * @param {string} options.startDate - Başlangıç tarihi (YYYY-MM-DD)
     * @param {string} options.endDate - Bitiş tarihi (YYYY-MM-DD)
     * @param {number} options.limit - Maksimum kayıt sayısı
     * @returns {Promise<Array>} Veri dizisi
     */
    async fetchData(options = {}) {
        try {
            const { startDate, endDate, limit, weekCount } = options;
            
            // URL parametrelerini oluştur
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (limit) params.append('limit', limit);
            if (weekCount) params.append('weekCount', weekCount);
            
            const url = `${this.baseUrl}/data${params.toString() ? '?' + params.toString() : ''}`;
            
            const cacheKey = `oracle_data_${startDate || 'default'}_${endDate || 'default'}_${limit || 'default'}_${weekCount || 'default'}`;
            
            // Cache kontrolü
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('Veri cache\'den alındı:', cacheKey);
                return cached.data;
            }

            // Aynı anda aynı istek varsa beklet
            if (this.requestQueue.has(cacheKey)) {
                console.log('Aynı istek zaten devam ediyor, bekleniyor...');
                return await this.requestQueue.get(cacheKey);
            }
            
            // İsteği kuyruğa ekle
            const requestPromise = this._fetchFromDatabase(url, cacheKey);
            this.requestQueue.set(cacheKey, requestPromise);
            
            try {
                const result = await requestPromise;
                return result;
            } finally {
                // İsteği kuyruktan çıkar
                this.requestQueue.delete(cacheKey);
            }
            
        } catch (error) {
            console.error('Veritabanı hatası:', error);
            throw new Error(`Veritabanı bağlantı hatası: ${error.message}`);
        }
    }
    
    /**
     * Veritabanından veri çeker ve cache'e kaydeder
     * @private
     */
    async _fetchFromDatabase(url, cacheKey) {
        const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Veri çekme hatası');
            }

            // Cache'e kaydet
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            console.log(`${result.data.length} kayıt Oracle veritabanından çekildi`, result.queryInfo);
            return result;
    }

    /**
     * Cache'i temizler
     */
    clearCache() {
        this.cache.clear();
        console.log('Cache temizlendi');
    }
    
    /**
     * Akıllı cache güncelleme - sadece belirli kayıtları günceller
     * @param {Array} updatedRecords - Güncellenen kayıtlar
     */
    updateCacheRecords(updatedRecords) {
        console.log(`${updatedRecords.length} kayıt için cache güncelleme...`);
        
        // Tüm cache'leri güncelle
        for (const [key, cachedData] of this.cache.entries()) {
            if (cachedData.data && cachedData.data.data) {
                const data = cachedData.data.data;
                
                updatedRecords.forEach(updatedRecord => {
                    const index = data.findIndex(item => item.isemriId === updatedRecord.isemriId);
                    if (index !== -1) {
                        data[index] = { ...data[index], ...updatedRecord };
                    }
                });
                
                // Cache'i yenile
                this.cache.set(key, {
                    data: cachedData.data,
                    timestamp: Date.now()
                });
            }
        }
        
        console.log('Cache güncelleme tamamlandı');
    }

    /**
     * Bağlantı durumunu kontrol eder
     * @returns {Promise<boolean>} Bağlantı durumu
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/data`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

