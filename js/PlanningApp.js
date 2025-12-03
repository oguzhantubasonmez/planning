/**
 * Ana uygulama sınıfı - Tüm bileşenleri koordine eder
 */
class PlanningApp {
    constructor() {
        this.databaseService = new DatabaseService();
        this.dataGrid = null;
        this.chartManager = null;
        this.data = [];
        this.isLoading = false;
        this.CACHE_KEY = 'planning_app_data';
        this.CACHE_DURATION = 300000; // 5 dakika (milisaniye)
        
        this.init();
    }

    /**
     * Uygulamayı başlatır
     */
    async init() {
        try {
            // Bileşenleri oluştur
            this.dataGrid = new DataGrid('left-panel');
            this.chartManager = new ChartManager();
            window.chartManager = this.chartManager; // Global erişim için
            window.dataGrid = this.dataGrid; // Global erişim için
            
            // Event listener'ları bağla
            this.bindEvents();
            
            // Header'ı güncelle
            this.updateHeader();
            
            // Açılışta daima DB'den çek: tüm cache'leri temizle ve forceRefresh ile yükle
            try { this.databaseService.clearCache(); } catch(_) {}
            try { if (this.chartManager && typeof this.chartManager.clearPlanningDataCache === 'function') this.chartManager.clearPlanningDataCache(); } catch(_) {}
            try { localStorage.removeItem(this.CACHE_KEY); } catch(_) {}
            await this.loadData({}, false, true);
            
            // Resize fonksiyonunu başlat
            this.initResize();
            
        } catch (error) {
            console.error('Uygulama başlatma hatası:', error);
            this.showError('Uygulama başlatılamadı: ' + error.message);
        }
    }

    /**
     * Event listener'ları bağlar
     */
    bindEvents() {
        // DataGrid event'leri
        this.dataGrid.onDataFiltered = (filteredData) => {
            this.chartManager.loadData(filteredData);
        };
        
        // onRowSelected callback'ini kaldırdık - DataGrid.js'deki mantığı kullanıyoruz
        
        // Tarih filtresi checkbox'ını bağla
        const tarihFiltresiCheckbox = document.getElementById('tarihFiltresiCheckbox');
        if (tarihFiltresiCheckbox) {
            tarihFiltresiCheckbox.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                if (this.dataGrid) {
                    this.dataGrid.setChartDateFilterEnabled(isEnabled);
                    if (!isEnabled) {
                        // Filtre kapatıldığında filtreyi temizle
                        this.dataGrid.clearChartDateFilter();
                    }
                }
            });
        }
        
        // ChartManager event'leri
        this.chartManager.onWeekSelected = (week) => {
            // Eğer skipWeekSelectedCallback flag'i set edilmişse, callback'i atla (tablodan tıklandığında)
            if (this.chartManager._skipWeekSelectedCallback) {
                return;
            }
            
            // Tarih filtresi aktifse, hafta filtresini uygula
            // Ancak eğer bir gün seçiliyse, gün filtresi önceliklidir
            if (tarihFiltresiCheckbox && tarihFiltresiCheckbox.checked && this.dataGrid) {
                // Eğer gün seçili değilse hafta filtresini uygula
                if (this.chartManager.selectedDayIndex === -1 || this.chartManager.selectedDayIndex === undefined) {
                    this.dataGrid.applyWeekFilter(week);
                }
            }
        };
        
        this.chartManager.onDaySelected = (dayIndex, week) => {
            // Eğer skipDaySelectedCallback flag'i set edilmişse, callback'i atla (tablodan tıklandığında)
            if (this.chartManager._skipDaySelectedCallback) {
                return;
            }
            
            // Tarih filtresi aktifse, gün filtresini uygula
            // Gün filtresi hafta filtresinden önceliklidir
            if (tarihFiltresiCheckbox && tarihFiltresiCheckbox.checked && this.dataGrid) {
                // Gün filtresini uygula (hafta filtresini ezer)
                this.dataGrid.applyDayFilter(dayIndex, week);
            }
        };
        
        this.chartManager.onSegmentSelected = (isemriNo, dayIndex, segmentIndex) => {
            // Tablodaki ilgili satırı seç
            if (this.dataGrid && isemriNo) {
                this.dataGrid.selectRowByIsemriNo(isemriNo);
            }
        };
        
        // DataGrid tarih filtre event'leri
        this.dataGrid.onDateFilterApplied = (dateRange) => {
            this.loadData({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                limit: 2000
            });
        };
        
        this.dataGrid.onDateFilterReset = () => {
            this.loadData(); // Varsayılan: son 7 günlük veri
        };
    }

    /**
     * Cache'den veri okur
     */
    getCachedData() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();
            
            // Cache geçerli mi kontrol et
            if (now - timestamp < this.CACHE_DURATION) {
                console.log('✅ Cache\'den veri yüklendi');
                return data;
            } else {
                console.log('⚠️ Cache geçersiz, siliniyor');
                localStorage.removeItem(this.CACHE_KEY);
                return null;
            }
        } catch (error) {
            console.error('Cache okuma hatası:', error);
            return null;
        }
    }

    /**
     * Veriyi cache'e kaydeder
     */
    setCachedData(data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            const jsonString = JSON.stringify(cacheData);
            const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
            
            // LocalStorage genellikle 5-10MB limiti var, 4MB'den büyükse cache'leme
            if (sizeInMB > 4) {
                console.warn(`⚠️ Cache boyutu çok büyük (${sizeInMB.toFixed(2)}MB), cache'lenmiyor. LocalStorage limiti aşılmış olabilir.`);
                // Eski cache'i temizle ve tekrar dene
                try {
                    localStorage.removeItem(this.CACHE_KEY);
                    // Daha küçük bir veri seti cache'le (sadece kritik alanlar)
                    const minimalData = data.map(item => ({
                        isemriId: item.isemriId,
                        isemriNo: item.isemriNo,
                        durum: item.durum,
                        planlananMiktar: item.planlananMiktar,
                        planlananTarih: item.planlananTarih,
                        breakdowns: item.breakdowns
                    }));
                    const minimalCache = {
                        data: minimalData,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(this.CACHE_KEY, JSON.stringify(minimalCache));
                    console.log('💾 Minimal veri cache\'e kaydedildi');
                } catch (retryError) {
                    console.error('Minimal cache yazma hatası:', retryError);
                }
                return;
            }
            
            localStorage.setItem(this.CACHE_KEY, jsonString);
            console.log(`💾 Veri cache'e kaydedildi (${sizeInMB.toFixed(2)}MB)`);
        } catch (error) {
            console.error('Cache yazma hatası:', error);
            // Hata durumunda eski cache'i temizle
            try {
                localStorage.removeItem(this.CACHE_KEY);
                console.log('⚠️ Eski cache temizlendi');
            } catch (clearError) {
                console.error('Cache temizleme hatası:', clearError);
            }
        }
    }

    /**
     * Oracle veritabanından veriyi yükler
     * @param {Object} options - Veri çekme seçenekleri
     * @param {boolean} preserveFilters - Filtreleri koru mu?
     * @param {boolean} forceRefresh - Cache'i zorla yenile
     */
    async loadData(options = {}, preserveFilters = false, forceRefresh = false) {
        if (this.isLoading) return;
        
        // Cache kontrolü (forceRefresh false ise)
        if (!forceRefresh && !options.forceRefresh) {
            const cachedData = this.getCachedData();
            if (cachedData && cachedData.length > 0) {
                console.log('📦 Cache\'den veri kullanılıyor:', cachedData.length, 'kayıt');
                this.data = cachedData;
                await this.dataGrid.loadData(this.data, preserveFilters);
                this.chartManager.loadData(this.data);
                return;
            }
        }
        
        this.isLoading = true;
        this.showLoading('Oracle veritabanından veri yükleniyor...');
        
        try {
            // Bağlantı kontrolü
            const isConnected = await this.databaseService.checkConnection();
            if (!isConnected) {
                throw new Error('Oracle veritabanına bağlanılamıyor');
            }
            
            // Veriyi çek
            const result = await this.databaseService.fetchData(options);
            
            // Veriyi işle ve hafta bilgisi ekle (planlanan tarih varsa onu kullan, yoksa sipariş tarihini kullan)
            this.data = result.data.map(item => {
                const dateForWeek = item.planlananTarih || item.onerilenTeslimTarih; // Planlanan tarihi öncelikle kullan
                const week = this.getWeekFromDate(dateForWeek);
                return {
                    ...item,
                    week: week,
                    chartDate: dateForWeek, // Chart için kullanılacak tarih
                    // Alan adlarını standartlaştır
                    siparisMiktar: item.siparisMiktar || item.planMiktar || 0,
                    planlananMiktar: item.planlananMiktar || 0
                };
            });
            
            
            // Durumları düzelt (veritabanındaki eski durumları güncelle)
            this.fixStatusLogic();
            
            // Cache'e kaydet
            this.setCachedData(this.data);
            
            // Bileşenlere veriyi yükle
            await this.dataGrid.loadData(this.data, preserveFilters);
            this.chartManager.loadData(this.data);
            
            // İlk haftayı seç (sadece filtreler korunmuyorsa)
            if (!preserveFilters && this.data.length > 0) {
                const firstWeek = this.data[0].week;
                if (firstWeek) {
                    this.chartManager.selectWeek(firstWeek);
                }
            }
            
            this.hideLoading();
            this.showSuccess(`${this.data.length} kayıt başarıyla yüklendi`, result.queryInfo);
            this.updateDataCount(this.data.length);
            this.checkConnectionStatus();
            
        } catch (error) {
            this.hideLoading();
            console.error('Veri yükleme hatası:', error);
            this.showError('Veri yüklenemedi: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Makinenin üst makine olup olmadığını kontrol eder
     * @param {string} makineAdi - Makine adı
     * @returns {Promise<Object>} Makine bilgileri
     */
    async checkMachineType(makineAdi) {
        // Artık tüm makine kontrolleri veritabanından yapılıyor
        try {
            const response = await fetch(`/api/machine/check-upper?makineAdi=${encodeURIComponent(makineAdi)}`);
            const result = await response.json();
            if (result.success) return result;
            throw new Error(result.message || 'Makine kontrolü başarısız');
        } catch (error) {
            console.error('Makine kontrolü hatası:', error);
            throw error;
        }
    }
    
    /**
     * Makinenin boşluk durumunu kontrol eder
     * @param {string} makineAdi - Makine adı
     * @returns {Promise<Object>} Boşluk durumu bilgileri
     */
    async checkMachineAvailability(makineAdi, startDate = null) {
        try {
            let url = `/api/machine/availability?makineAdi=${encodeURIComponent(makineAdi)}`;
            if (startDate) {
                url += `&startDate=${encodeURIComponent(startDate)}`;
            }
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                return result;
            } else {
                throw new Error(result.message || 'Makine boşluk durumu kontrolü başarısız');
            }
        } catch (error) {
            console.error('Makine boşluk durumu hatası:', error);
            throw error;
        }
    }
    
    /**
     * Birden fazla makinenin boşluk durumunu kontrol eder
     * @param {Array<string>} makineAdlari - Makine adları dizisi
     * @param {string} startDate - Tarih filtresi (opsiyonel)
     * @returns {Promise<Array>} Boşluk durumu bilgileri dizisi
     */
    async checkMultipleMachineAvailability(makineAdlari, startDate = null) {
        try {
            const promises = makineAdlari.map(makineAdi => this.checkMachineAvailability(makineAdi, startDate));
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('Çoklu makine boşluk durumu hatası:', error);
            throw error;
        }
    }

    /**
     * Durumları frontend'de belirler ve günceller
     * Mantık: 
     * - toplam planlanan = 0 ise "Beklemede"
     * - toplam planlanan < toplam sipariş ise "Kısmi Planlandı"  
     * - toplam planlanan >= toplam sipariş miktarı ise "Planlandı"
     */
    fixStatusLogic() {
        if (!this.data || this.data.length === 0) {
            console.log('Veri yok, durum belirleme atlanıyor');
            return;
        }
        
        this.data.forEach(item => {
            const siparisMiktar = item.siparisMiktar || item.planMiktar || 0;
            const planlananMiktar = item.planlananMiktar || 0;
            
            // Sadece geçerli değerler varsa durum belirle
            if (siparisMiktar > 0 || planlananMiktar > 0) {
                // Durumu belirle
                if (planlananMiktar === 0) {
                    item.durum = 'Beklemede';
                } else if (planlananMiktar < siparisMiktar) {
                    item.durum = 'Kısmi Planlandı';
                } else if (planlananMiktar >= siparisMiktar) {
                    item.durum = 'Planlandı';
                }
            }
        });
    }

    /**
     * Tarihten hafta bilgisi çıkarır
     * @param {string} dateString - Tarih string'i
     * @returns {string} Hafta bilgisi
     */
    getWeekFromDate(dateString) {
        if (!dateString) return null;
        
        const date = new Date(dateString);
        const year = date.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    }

    /**
     * Resize fonksiyonunu başlatır
     */
    initResize() {
        const resizeHandle = document.getElementById('resizeHandle');
        const leftPanel = document.querySelector('.left-panel');
        const rightPanel = document.querySelector('.right-panel');
        const container = document.querySelector('.container');
        
        if (!resizeHandle || !leftPanel || !rightPanel || !container) return;
        
        let isResizing = false;
        let startX = 0;
        let startLeftWidth = 0;
        
        resizeHandle.addEventListener('mousedown', function(e) {
            isResizing = true;
            startX = e.clientX;
            startLeftWidth = leftPanel.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            document.body.style.pointerEvents = 'none';
            resizeHandle.style.pointerEvents = 'auto';
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const newLeftWidth = startLeftWidth + deltaX;
            const containerWidth = container.offsetWidth;
            const handleWidth = 12;
            const gaps = 20;
            const rightWidth = containerWidth - newLeftWidth - handleWidth - gaps;
            
            if (newLeftWidth >= 300 && newLeftWidth <= (containerWidth * 0.8) && rightWidth >= 200) {
                leftPanel.style.width = newLeftWidth + 'px';
                leftPanel.style.flex = 'none';
                rightPanel.style.flex = '1';
                rightPanel.style.minWidth = '200px';
            }
        });
        
        document.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.body.style.pointerEvents = '';
                resizeHandle.style.pointerEvents = '';
            }
        });
        
        resizeHandle.addEventListener('selectstart', function(e) {
            e.preventDefault();
        });
    }

    /**
     * Yükleme mesajı gösterir
     * @param {string} message - Mesaj
     */
    showLoading(message) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-overlay';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-size: 18px;
        `;
        loadingDiv.innerHTML = `
            <div style="text-align: center;">
                <div style="margin-bottom: 20px;">⏳</div>
                <div>${message}</div>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }

    /**
     * Yükleme mesajını gizler
     */
    hideLoading() {
        const loadingDiv = document.getElementById('loading-overlay');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    /**
     * Başarı mesajı gösterir
     * @param {string} message - Mesaj
     * @param {Object} queryInfo - Sorgu bilgileri
     */
    showSuccess(message, queryInfo = null) {
        let fullMessage = message;
        if (queryInfo) {
            fullMessage += `\nTarih Aralığı: ${queryInfo.startDate} - ${queryInfo.endDate}`;
            fullMessage += `\nLimit: ${queryInfo.limit}`;
        }
        this.showNotification(fullMessage, 'success');
    }

    /**
     * Hata mesajı gösterir
     * @param {string} message - Mesaj
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Profesyonel toast bildirimi gösterir
     * @param {string} title - Başlık
     * @param {string} message - Mesaj
     * @param {string} type - Tip (success, error, info, warning)
     * @param {number} duration - Süre (ms)
     */
    showToast(title, message, type = 'success', duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-close" onclick="this.parentElement.remove()">×</div>
            <div class="toast-progress"></div>
        `;
        
        container.appendChild(toast);
        
        // Animasyon için requestAnimationFrame kullan (daha hızlı)
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Progress bar animasyonu - async olarak başlat
        requestAnimationFrame(() => {
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.transition = `width ${duration}ms linear`;
            }
        });
        
        // Otomatik kapanma
        setTimeout(() => {
            this.hideToast(toast);
        }, duration);
    }
    
    /**
     * Toast ikonunu döndürür
     * @param {string} type - Tip
     * @returns {string} İkon
     */
    getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };
        return icons[type] || icons.success;
    }
    
    /**
     * Toast'u gizler
     * @param {HTMLElement} toast - Toast elementi
     */
    hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 400);
    }

    /**
     * Başarı mesajı gösterir
     * @param {string} message - Mesaj
     * @param {Object} queryInfo - Sorgu bilgileri
     */
    showSuccess(message, queryInfo = null) {
        let fullMessage = message;
        if (queryInfo) {
            fullMessage += `\nTarih Aralığı: ${queryInfo.startDate} - ${queryInfo.endDate}`;
            fullMessage += `\nLimit: ${queryInfo.limit}`;
        }
        this.showToast('Başarılı', fullMessage, 'success');
    }

    /**
     * Hata mesajı gösterir
     * @param {string} message - Mesaj
     */
    showError(message) {
        this.showToast('Hata', message, 'error');
    }
    
    /**
     * Bilgi mesajı gösterir
     * @param {string} message - Mesaj
     */
    showInfo(message) {
        this.showToast('Bilgi', message, 'info');
    }
    
    /**
     * Uyarı mesajı gösterir
     * @param {string} message - Mesaj
     */
    showWarning(message) {
        this.showToast('Uyarı', message, 'warning');
    }
    
    /**
     * Progress bar gösterir
     * @param {string} initialMessage - İlk mesaj
     */
    showProgressBar(initialMessage = 'İşlem başlatılıyor...') {
        // Eğer zaten bir progress bar varsa kaldır
        const existingProgress = document.getElementById('queueProgressBar');
        if (existingProgress) {
            existingProgress.remove();
        }
        
        // Progress bar oluştur
        const progressBar = document.createElement('div');
        progressBar.id = 'queueProgressBar';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
            animation: fadeIn 0.3s ease;
        `;
        
        progressBar.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            ">
                <div style="
                    text-align: center;
                    margin-bottom: 30px;
                ">
                    <div style="
                        font-size: 24px;
                        font-weight: bold;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        margin-bottom: 10px;
                    ">⏳ İşlem Devam Ediyor</div>
                    <div id="progressMessage" style="
                        color: #666;
            font-size: 14px;
                        margin-top: 10px;
                    ">${initialMessage}</div>
                </div>
                
                <div style="
                    background: #f0f0f0;
                    border-radius: 20px;
                    height: 12px;
                    overflow: hidden;
                    position: relative;
                ">
                    <div id="progressFill" style="
                        background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%);
                        background-size: 200% 100%;
                        height: 100%;
                        width: 0%;
                        border-radius: 20px;
                        transition: width 0.4s ease;
                        animation: shimmer 2s infinite;
                    "></div>
                </div>
                
                <div id="progressPercent" style="
                    text-align: center;
                    margin-top: 15px;
                    font-size: 18px;
                    font-weight: bold;
                    color: #667eea;
                ">0%</div>
                
                <div style="
                    margin-top: 20px;
                    font-size: 13px;
                    color: #999;
                    text-align: center;
                ">
                    Lütfen işlem tamamlanana kadar bekleyin...
                </div>
            </div>
            
            <style>
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            </style>
        `;
        
        document.body.appendChild(progressBar);
    }
    
    /**
     * Progress bar'ı günceller
     * @param {number} percent - Yüzde (0-100)
     * @param {string} message - Durum mesajı
     */
    updateProgressBar(percent, message) {
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');
        const progressMessage = document.getElementById('progressMessage');
        
        if (progressFill) {
            progressFill.style.width = percent + '%';
        }
        if (progressPercent) {
            progressPercent.textContent = Math.round(percent) + '%';
        }
        if (progressMessage && message) {
            progressMessage.textContent = message;
        }
    }
    
    /**
     * Progress bar'ı gizler
     */
    hideProgressBar() {
        const progressBar = document.getElementById('queueProgressBar');
        if (progressBar) {
            progressBar.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
                if (progressBar.parentElement) {
                    progressBar.parentElement.removeChild(progressBar);
                }
            }, 300);
        }
    }

    /**
     * Bildirim gösterir (Eski sistem - geriye uyumluluk için)
     * @param {string} message - Mesaj
     * @param {string} type - Tip (success, error)
     */
    showNotification(message, type = 'success') {
        // Eski sistemi yeni sisteme yönlendir
        const title = type === 'error' ? 'Hata' : 'Başarılı';
        this.showToast(title, message, type);
    }

    /**
     * Veriyi yeniler
     */
    async refreshData(forceRefresh = true) {
        this.databaseService.clearCache();
        // Cache'i de temizle
        localStorage.removeItem(this.CACHE_KEY);
        await this.loadData({}, false, forceRefresh);
    }

    /**
     * Akıllı veri güncelleme - cache'i temizlemeden günceller
     * @param {string} operation - İşlem türü (update, delete, split)
     * @param {Object} changedRecord - Değişen kayıt bilgileri
     */
    async smartUpdateData(operation, changedRecord) {
        try {
            console.log(`${operation} işlemi için akıllı güncelleme başlatılıyor...`);
            
            // Cache'i temizleme - sadece gerekli veriyi çek
            const currentFilters = this.dataGrid.getCurrentFilters();
            const options = {
                startDate: currentFilters.startDate,
                endDate: currentFilters.endDate,
                limit: 2000 // Mevcut limit
            };
            
            // Veriyi yeniden yükle ama filtreleri koru
            await this.loadData(options, true);
            
            console.log(`${operation} işlemi tamamlandı - veri güncellendi`);
            
        } catch (error) {
            console.error('Akıllı güncelleme hatası:', error);
            // Hata durumunda normal refresh yap
            await this.refreshData();
        }
    }

    /**
     * Ultra hızlı güncelleme - sadece cache'i günceller ve kırılım verilerini de günceller
     * @param {Array} updatedRecords - Güncellenen kayıtlar
     */
    async ultraFastUpdate(updatedRecords) {
        try {
            const recordsArray = Array.isArray(updatedRecords) ? updatedRecords : [updatedRecords];
            
            // Cache'i güncelle
            this.databaseService.updateCacheRecords(recordsArray);
            
            // Mevcut veriyi güncelle
            recordsArray.forEach(updatedRecord => {
                
                // Kırılım işlemlerinde planId ile kayıt bul, yoksa isemriId ile bul
                let index = -1;
                
                if (updatedRecord.planId && updatedRecord.planId !== 'new') {
                    // Kırılım işlemi - ana kaydı bul ve kırılımı güncelle
                    index = this.data.findIndex(item => item.isemriId === updatedRecord.isemriId);
                    
                    if (index !== -1) {
                        // Ana kayıt bulundu, kırılımı güncelle
                        const mainRecord = this.data[index];
                        
                        if (mainRecord.breakdowns && Array.isArray(mainRecord.breakdowns)) {
                            const breakdownIndex = mainRecord.breakdowns.findIndex(
                                breakdown => breakdown.planId === updatedRecord.planId
                            );
                            
                            if (breakdownIndex !== -1) {
                                // Kırılımı güncelle
                                mainRecord.breakdowns[breakdownIndex] = {
                                    ...mainRecord.breakdowns[breakdownIndex],
                                    planlananMiktar: updatedRecord.planlananMiktar,
                                    planTarihi: updatedRecord.planTarihi
                                };
                                
                                // Ana kaydın toplam değerlerini güncelle
                                mainRecord.totalPlanned = mainRecord.breakdowns
                                    .filter(b => b.durum === 'Planlandı')
                                    .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
                                
                                // Bekleyen miktar = Sipariş miktarı - Planlanan miktar
                                mainRecord.totalWaiting = Math.max(0, (mainRecord.siparisMiktar || 0) - mainRecord.totalPlanned);
                                
                                // Ana kaydın planlanan miktarını da güncelle
                                mainRecord.planlananMiktar = mainRecord.totalPlanned;
                                
                                // Ana kaydın durumunu frontend mantığıyla güncelle
                                const siparisMiktar = (mainRecord.siparisMiktar || mainRecord.planMiktar || 0);
                                if (mainRecord.totalPlanned === 0) {
                                    mainRecord.durum = 'Beklemede';
                                } else if (mainRecord.totalPlanned < siparisMiktar) {
                                    mainRecord.durum = 'Kısmi Planlandı';
                                } else if (mainRecord.totalPlanned >= siparisMiktar) {
                                    mainRecord.durum = 'Planlandı';
                                }
                                
                            } else {
                                index = -1; // Kırılım bulunamadı, ana kayıt güncelleme
                            }
                        } else {
                            index = -1; // Breakdowns bulunamadı, ana kayıt güncelleme
                        }
                    }
                }
                
                if (index === -1) {
                    // Ana kayıt işlemi veya planId bulunamadı - isemriId ile bul
                    index = this.data.findIndex(item => item.isemriId === updatedRecord.isemriId);
                }
                
                if (index !== -1) {
                    const mainRecord = this.data[index];
                    // Sadece ana kayıt işlemlerinde ana kaydı güncelle
                    if (!updatedRecord.isBreakdown) {
                        // Geri çekme işlemi (deleteMain) kontrolü
                        if (updatedRecord.action === 'deleteMain') {
                            // Eğer planningData breakdowns içeriyorsa, sadece silinen planı kaldır
                            if (updatedRecord.planningData && Array.isArray(updatedRecord.planningData.breakdowns)) {
                                // Kalan breakdown'ları kullan
                                mainRecord.breakdowns = updatedRecord.planningData.breakdowns;
                                mainRecord.totalPlanned = updatedRecord.planningData.totalPlanned || 0;
                                mainRecord.totalWaiting = updatedRecord.planningData.totalWaiting || 0;
                                mainRecord.planlananMiktar = updatedRecord.planlananMiktar || 0;
                                mainRecord.planlananTarih = updatedRecord.planTarihi || null;
                                mainRecord.durum = updatedRecord.durum || 'Beklemede';
                                mainRecord.planId = updatedRecord.planId || null;
                                mainRecord.selectedMachine = updatedRecord.selectedMachine || null;
                            } else {
                                // PlanningData yoksa, tüm planlamayı temizle (eski davranış)
                                mainRecord.planId = null;
                                mainRecord.planlananTarih = null;
                                mainRecord.planlananMiktar = 0;
                                mainRecord.breakdowns = [];
                                mainRecord.totalPlanned = 0;
                                mainRecord.totalWaiting = mainRecord.siparisMiktar || mainRecord.planMiktar || 0;
                                mainRecord.durum = 'Beklemede';
                                mainRecord.selectedMachine = null;
                            }
                        } else {
                            // Normal ana kayıt güncelleme
                            this.data[index] = { ...mainRecord, ...updatedRecord };
                            const current = this.data[index];
                            // Yeni plan eklendiyse frontende breakdown oluştur/yenile
                            if (updatedRecord.planningData && Array.isArray(updatedRecord.planningData.breakdowns)) {
                                // ÖNEMLİ: breakdowns'ı deep copy ile set et, planTarihi değerlerini koru
                                current.breakdowns = updatedRecord.planningData.breakdowns.map(brk => ({
                                    ...brk,
                                    // planTarihi değerini koru (eğer boşsa ve updatedRecord.planTarihi varsa onu kullan)
                                    planTarihi: brk.planTarihi || updatedRecord.planTarihi || brk.planTarihi
                                }));
                                
                                console.log('🔍 ultraFastUpdate - breakdowns güncellendi:', {
                                    isemriId: current.isemriId,
                                    breakdownCount: current.breakdowns.length,
                                    breakdowns: current.breakdowns.map(brk => ({
                                        planId: brk.planId,
                                        planTarihi: brk.planTarihi,
                                        planlananMiktar: brk.planlananMiktar,
                                        durum: brk.durum
                                    }))
                                });
                                
                                // ÖNEMLİ: breakdowns içindeki planId'leri güncelle (eğer updatedRecord.planId varsa)
                                // Bu, backend'den gelen createdPlanId'nin breakdowns'a yansımasını sağlar
                                if (updatedRecord.planId && updatedRecord.planId !== 'new') {
                                    current.breakdowns.forEach(brk => {
                                        if (brk.durum === 'Planlandı' && (!brk.planId || brk.planId === 'new')) {
                                            brk.planId = updatedRecord.planId;
                                        }
                                    });
                                }
                                
                                // Maça aşaması için breakdown'lardaki makAd'ı selectedMachine olarak da set et
                                current.breakdowns.forEach(brk => {
                                    if (brk.makAd && !brk.selectedMachine) {
                                        brk.selectedMachine = brk.makAd;
                                    }
                                });
                                
                                // Toplamlar ve durum
                                const plannedSum = (current.breakdowns || []).filter(b => (b.durum || '').toLowerCase() === 'planlandı')
                                    .reduce((s, b) => s + (b.planlananMiktar || 0), 0);
                                current.totalPlanned = plannedSum;
                                current.totalWaiting = Math.max(0, (current.siparisMiktar || current.planMiktar || 0) - plannedSum);
                                if (plannedSum === 0) current.durum = 'Beklemede';
                                else if (plannedSum < (current.siparisMiktar || current.planMiktar || 0)) current.durum = 'Kısmi Planlandı';
                                else current.durum = 'Planlandı';
                                // Ana alanlar
                                current.planlananMiktar = plannedSum;
                                const dates = (current.breakdowns || []).map(b => b.planTarihi).filter(Boolean).sort((a,b)=> new Date(a)-new Date(b));
                                current.planlananTarih = dates.length ? dates[dates.length-1] : null;
                                const firstPlan = (current.breakdowns || []).find(b => (b.durum || '').toLowerCase() === 'planlandı');
                                // ÖNEMLİ: updatedRecord.planId varsa ve geçerliyse onu kullan, yoksa breakdowns'tan bul
                                current.planId = (updatedRecord.planId && updatedRecord.planId !== 'new') ? updatedRecord.planId : (firstPlan?.planId && firstPlan.planId !== 'new' ? firstPlan.planId : null);
                                // Makine bilgisini güncelle - selectedMachine varsa hem makAd hem selectedMachine'i güncelle
                                const newMachine = updatedRecord.selectedMachine || firstPlan?.makAd || firstPlan?.selectedMachine || current.selectedMachine || null;
                                if (newMachine) {
                                    current.makAd = newMachine;
                                    current.selectedMachine = newMachine;
                                }
                                // Açıklama alanını güncelle - önce updatedRecord'dan, sonra breakdown'lardan
                                current.aciklama = updatedRecord.aciklama !== undefined ? updatedRecord.aciklama : (firstPlan?.aciklama || (current.breakdowns || []).find(b => b.aciklama)?.aciklama || null);
                            }
                        }
                    } else {
                        // Kırılım güncellemesi ise; durum ve makine bilgisini de senkronize et
                        let brkIndex = (mainRecord.breakdowns || []).findIndex(b => b.planId === updatedRecord.planId);
                        // Eğer backend'den planId gelmediyse (örn. BEKLEMEDE → PLANLANDI update'i),
                        // miktar ve durum üzerinden bekleyen kırılımı bul ve güncelle
                        if (brkIndex === -1) {
                            brkIndex = (mainRecord.breakdowns || []).findIndex(b =>
                                (b.durum || '').toLowerCase() === 'beklemede' &&
                                (Number(b.planlananMiktar) || 0) === (Number(updatedRecord.planlananMiktar) || 0)
                            );
                        }
                        if (updatedRecord.action === 'deleteBreakdown') {
                            // Eğer planningData gönderilmişse onu kullan (daha güvenilir)
                            if (updatedRecord.planningData && Array.isArray(updatedRecord.planningData.breakdowns)) {
                                mainRecord.breakdowns = updatedRecord.planningData.breakdowns;
                                mainRecord.totalPlanned = updatedRecord.planningData.totalPlanned || 0;
                                mainRecord.totalWaiting = updatedRecord.planningData.totalWaiting || 0;
                                mainRecord.planlananMiktar = updatedRecord.planlananMiktar || 0;
                                mainRecord.planlananTarih = updatedRecord.planTarihi || null;
                                mainRecord.durum = updatedRecord.durum || 'Beklemede';
                                mainRecord.planId = updatedRecord.planId || null;
                                // Makine bilgisini güncelle
                                const newMachine = updatedRecord.selectedMachine || null;
                                if (newMachine) {
                                    mainRecord.makAd = newMachine;
                                    mainRecord.selectedMachine = newMachine;
                                } else {
                                    mainRecord.selectedMachine = null;
                                }
                                // Açıklama alanını güncelle
                                const plannedBreakdown = updatedRecord.planningData.breakdowns.find(b => b.durum === 'Planlandı');
                                mainRecord.aciklama = plannedBreakdown?.aciklama || updatedRecord.planningData.breakdowns.find(b => b.aciklama)?.aciklama || null;
                            } else {
                                // PlanningData yoksa eski yöntemle kaldır
                            mainRecord.breakdowns = (mainRecord.breakdowns || []).filter(b => b.planId !== updatedRecord.planId);
                            
                            // Ana toplam/durum yeniden hesapla
                            const plannedSum = (mainRecord.breakdowns || []).filter(b => (b.durum || '').toLowerCase() === 'planlandı')
                                .reduce((s, b) => s + (b.planlananMiktar || 0), 0);
                            mainRecord.totalPlanned = plannedSum;
                            // Bakiye miktarı hesapla (sipariş miktarı - sevk miktarı)
                            const siparisMiktarHesaplanan = mainRecord.siparisMiktarHesaplanan || mainRecord.siparisMiktar || mainRecord.planMiktar || 0;
                            const sevkMiktari = mainRecord.SEVK_MIKTARI || mainRecord.sevkMiktari || 0;
                            const bakiyeMiktar = Math.max(0, siparisMiktarHesaplanan - sevkMiktari);
                            mainRecord.totalWaiting = Math.max(0, bakiyeMiktar - plannedSum);
                            mainRecord.planlananMiktar = plannedSum;
                            
                            // Durum hesapla (bakiye miktarı ile karşılaştırma)
                            if (plannedSum === 0) {
                                mainRecord.durum = 'Beklemede';
                            } else if (plannedSum < bakiyeMiktar) {
                                mainRecord.durum = 'Kısmi Planlandı';
                            } else {
                                mainRecord.durum = 'Planlandı';
                            }
                            
                            // Planlanan tarih - kalan breakdown'lardan en son tarih
                            const planDates = (mainRecord.breakdowns || [])
                                .map(b => b.planTarihi)
                                .filter(Boolean)
                                .sort((a, b) => new Date(a) - new Date(b));
                            mainRecord.planlananTarih = planDates.length > 0 ? planDates[planDates.length - 1] : null;
                            
                            // İlk planlı breakdown'dan planId ve selectedMachine al
                            const firstPlannedBreakdown = (mainRecord.breakdowns || []).find(b => 
                                (b.durum || '').toLowerCase() === 'planlandı'
                            );
                            mainRecord.planId = firstPlannedBreakdown?.planId || null;
                            // Makine bilgisini güncelle - selectedMachine varsa hem makAd hem selectedMachine'i güncelle
                            const newMachine = updatedRecord.selectedMachine || firstPlannedBreakdown?.makAd || firstPlannedBreakdown?.selectedMachine || null;
                            if (newMachine) {
                                mainRecord.makAd = newMachine;
                                mainRecord.selectedMachine = newMachine;
                            }
                            }
                        } else if (brkIndex !== -1) {
                            const old = mainRecord.breakdowns[brkIndex];
                            const newMakAd = updatedRecord.selectedMachine ?? old.makAd;
                            mainRecord.breakdowns[brkIndex] = {
                                ...old,
                                planlananMiktar: updatedRecord.planlananMiktar ?? old.planlananMiktar,
                                planTarihi: updatedRecord.planTarihi ?? old.planTarihi,
                                durum: (updatedRecord.durum || old.durum || 'Planlandı'),
                                makAd: newMakAd,
                                // Maça aşaması için selectedMachine'i de set et
                                selectedMachine: newMakAd,
                                // Açıklama alanını güncelle (eğer updatedRecord'da varsa)
                                aciklama: updatedRecord.aciklama !== undefined ? updatedRecord.aciklama : old.aciklama
                            };
                            // Ana toplam/durum yeniden hesapla
                            const plannedSum = (mainRecord.breakdowns || []).filter(b => (b.durum || '').toLowerCase() === 'planlandı')
                                .reduce((s, b) => s + (b.planlananMiktar || 0), 0);
                            mainRecord.totalPlanned = plannedSum;
                            const orderQty = (mainRecord.siparisMiktar || mainRecord.planMiktar || 0);
                            mainRecord.totalWaiting = Math.max(0, orderQty - plannedSum);
                            if (plannedSum === 0) mainRecord.durum = 'Beklemede';
                            else if (plannedSum < orderQty) mainRecord.durum = 'Kısmi Planlandı';
                            else mainRecord.durum = 'Planlandı';
                            mainRecord.planlananMiktar = plannedSum;
                            const dates = (mainRecord.breakdowns || []).map(b => b.planTarihi).filter(Boolean).sort((a,b)=> new Date(a)-new Date(b));
                            mainRecord.planlananTarih = dates.length ? dates[dates.length-1] : null;
                            const firstPlan = (mainRecord.breakdowns || []).find(b => (b.durum || '').toLowerCase() === 'planlandı');
                            // Açıklama alanını güncelle (planlı breakdown'dan)
                            mainRecord.aciklama = firstPlan?.aciklama || (mainRecord.breakdowns || []).find(b => b.aciklama)?.aciklama || null;
                            mainRecord.planId = firstPlan?.planId || mainRecord.planId;
                            // Makine bilgisini güncelle - selectedMachine varsa hem makAd hem selectedMachine'i güncelle
                            const newMachine = updatedRecord.selectedMachine || firstPlan?.makAd || firstPlan?.selectedMachine || mainRecord.selectedMachine || null;
                            if (newMachine) {
                                mainRecord.makAd = newMachine;
                                mainRecord.selectedMachine = newMachine;
                            }
                        }
                    }
                }
            });
            
            // Bileşenleri güncelle - sadece değişen kayıtları güncelle (performans optimizasyonu)
            const updatedIsemriIds = recordsArray.map(rec => rec.isemriId);
            
            // Filtrelenmiş veriyi güncelle (sadece değişen kayıtlar)
            updatedIsemriIds.forEach(isemriId => {
                const filteredIndex = this.dataGrid.filteredData.findIndex(item => item.isemriId === isemriId);
                if (filteredIndex !== -1) {
                    // Güncel veriyi bul ve filteredData'ya kopyala
                    const updatedItem = this.data.find(item => item.isemriId === isemriId);
                    if (updatedItem) {
                        this.dataGrid.filteredData[filteredIndex] = updatedItem;
                    }
                }
            });
            
            // UI thread'i bloke etmemek için async olarak yap
            requestAnimationFrame(() => {
                // Sadece değişen satırları güncelle (tüm grid'i yeniden render etme)
                this.dataGrid.updateGridRows(updatedIsemriIds);
                
                // Chart güncellemesini bir sonraki frame'de yap (daha fazla performans için)
                requestAnimationFrame(async () => {
                    if (this.chartManager) {
                        // Sadece veriyi set et ve chart'ı güncelle
                        this.chartManager.data = this.data;
                        try {
                            if (typeof this.chartManager.updateCharts === 'function') {
                                // Chart güncellemesini async olarak yap, UI thread'i bloke etme
                                await this.chartManager.updateCharts();
                            }
                        } catch (e) {
                            console.error('Chart güncelleme hatası:', e);
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error('Ultra hızlı güncelleme hatası:', error);
            // Hata durumunda akıllı güncelleme yap
            await this.smartUpdateData('ultra-fast-update', null);
        }
    }

    /**
     * Minimal veri güncelleme - sadece belirli kayıtları günceller
     * @param {Array} updatedRecords - Güncellenen kayıtlar
     */
    async minimalUpdateData(updatedRecords) {
        try {
            console.log(`${updatedRecords.length} kayıt için minimal güncelleme...`);
            
            // Mevcut veriyi güncelle
            updatedRecords.forEach(updatedRecord => {
                const index = this.data.findIndex(item => item.isemriId === updatedRecord.isemriId);
                if (index !== -1) {
                    this.data[index] = { ...this.data[index], ...updatedRecord };
                }
            });
            
            // Bileşenleri güncelle
            this.dataGrid.loadData(this.data, true); // Filtreleri koru
            this.chartManager.loadData(this.data);
            
            console.log('Minimal güncelleme tamamlandı');
            
        } catch (error) {
            console.error('Minimal güncelleme hatası:', error);
            // Hata durumunda akıllı güncelleme yap
            await this.smartUpdateData('minimal-update', null);
        }
    }

    /**
     * Header bilgilerini günceller
     */
    updateHeader() {
        // Tarih bilgisini güncelle
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            const now = new Date();
            currentDateElement.textContent = now.toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Hafta bilgisini güncelle
        const currentWeekElement = document.getElementById('currentWeek');
        if (currentWeekElement) {
            const now = new Date();
            const weekNumber = this.getWeekNumber(now);
            currentWeekElement.textContent = `Hafta ${weekNumber} - W${weekNumber}`;
        }

        // Bağlantı durumunu kontrol et
        this.checkConnectionStatus();
        
        // Gerçek zamanlı saat güncellemesi
        this.startRealTimeClock();
    }

    /**
     * Bağlantı durumunu kontrol eder ve header'ı günceller
     */
    async checkConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        const indicatorElement = statusElement?.querySelector('.status-indicator');
        const textElement = statusElement?.querySelector('.status-text');
        const footerStatusElement = document.getElementById('footerConnectionStatus');

        if (!statusElement || !indicatorElement || !textElement) return;

        try {
            const isConnected = await this.databaseService.checkConnection();
            
            if (isConnected) {
                indicatorElement.className = 'status-indicator connected';
                textElement.textContent = 'Oracle Bağlantısı Aktif';
                
                // Footer'ı güncelle
                if (footerStatusElement) {
                    footerStatusElement.textContent = 'Bağlı';
                    footerStatusElement.className = 'status-indicator connected';
                }
            } else {
                indicatorElement.className = 'status-indicator error';
                textElement.textContent = 'Bağlantı Hatası';
                
                // Footer'ı güncelle
                if (footerStatusElement) {
                    footerStatusElement.textContent = 'Bağlantı Yok';
                    footerStatusElement.className = 'status-indicator disconnected';
                }
            }
        } catch (error) {
            indicatorElement.className = 'status-indicator error';
            textElement.textContent = 'Bağlantı Hatası';
            
            // Footer'ı güncelle
            if (footerStatusElement) {
                footerStatusElement.textContent = 'Hata';
                footerStatusElement.className = 'status-indicator disconnected';
            }
        }
    }

    /**
     * Veri sayısını header'da günceller
     * @param {number} count - Veri sayısı
     */
    updateDataCount(count) {
        const dataCountElement = document.getElementById('dataCount');
        if (dataCountElement) {
            dataCountElement.textContent = `${count} kayıt yüklendi`;
        }
    }

    /**
     * Gerçek zamanlı saat güncellemesini başlatır
     */
    startRealTimeClock() {
        // İlk güncelleme
        this.updateCurrentTime();
        
        // Her dakika güncelle
        setInterval(() => {
            this.updateCurrentTime();
        }, 60000); // 60 saniye
    }

    /**
     * Mevcut zamanı header'da günceller
     */
    updateCurrentTime() {
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            const now = new Date();
            currentDateElement.textContent = now.toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    /**
     * Verilen tarihin hafta numarasını döndürür
     * @param {Date} date - Tarih
     * @returns {number} Hafta numarası
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
}

// Global değişkenler
let planningApp;
let dataGrid;
let chartManager;

// Şifre kontrolü - dinamik şifre (şimdilik 123)
const APP_PASSWORD = '123';
const PASSWORD_SESSION_KEY = 'app_password_verified';

/**
 * Şifre kontrol fonksiyonu (global)
 */
window.checkPassword = function() {
    console.log('checkPassword fonksiyonu çağrıldı');
    
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    const passwordModal = document.getElementById('passwordModal');
    
    if (!passwordInput || !passwordError || !passwordModal) {
        console.error('Şifre modalı elementleri bulunamadı', {
            passwordInput: !!passwordInput,
            passwordError: !!passwordError,
            passwordModal: !!passwordModal
        });
        return;
    }
    
    const enteredPassword = passwordInput.value.trim();
    console.log('Girilen şifre:', enteredPassword, 'Beklenen şifre:', APP_PASSWORD);
    
    if (enteredPassword === APP_PASSWORD) {
        console.log('Şifre doğru - uygulama başlatılıyor');
        
        // Şifre doğru - sessionStorage'a kaydet
        sessionStorage.setItem(PASSWORD_SESSION_KEY, 'true');
        
        // Modal'ı kapat ve uygulamayı başlat
        passwordModal.style.display = 'none';
        
        // Uygulama içeriğini göster
        const mainContent = document.querySelector('main') || document.querySelector('.container');
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        
        if (mainContent) mainContent.style.display = '';
        if (header) header.style.display = '';
        if (footer) footer.style.display = '';
        
        // Uygulamayı başlat
        console.log('startApplication çağrılıyor');
        if (typeof window.startApplication === 'function') {
            window.startApplication();
        } else {
            console.error('startApplication fonksiyonu bulunamadı');
        }
    } else {
        console.log('Şifre yanlış');
        // Şifre yanlış - hata mesajı göster
        passwordError.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        
        // Hata mesajını 3 saniye sonra gizle
        setTimeout(() => {
            passwordError.style.display = 'none';
        }, 3000);
    }
};

/**
 * Uygulamayı başlatır (şifre doğru girildikten sonra)
 */
window.startApplication = function() {
    try {
        planningApp = new PlanningApp();
        dataGrid = planningApp.dataGrid;
        chartManager = planningApp.chartManager;
        
        // Global erişim için window'a ekle
        window.planningApp = planningApp;
        
    } catch (error) {
        console.error('Uygulama başlatma hatası:', error);
        alert('Uygulama başlatılamadı: ' + error.message);
    }
};

// Sayfa yüklendiğinde şifre kontrolü yap
document.addEventListener('DOMContentLoaded', function() {
    // SessionStorage'da şifre kontrolü var mı?
    const isPasswordVerified = sessionStorage.getItem(PASSWORD_SESSION_KEY) === 'true';
    
    if (isPasswordVerified) {
        // Şifre daha önce doğru girilmiş - direkt uygulamayı başlat
        const passwordModal = document.getElementById('passwordModal');
        if (passwordModal) {
            passwordModal.style.display = 'none';
        }
        
        // Uygulama içeriğini göster
        const mainContent = document.querySelector('main') || document.querySelector('.container');
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        
        if (mainContent) mainContent.style.display = '';
        if (header) header.style.display = '';
        if (footer) footer.style.display = '';
        
        // Uygulamayı başlat
        window.startApplication();
    } else {
        // Şifre modalını göster
        const passwordModal = document.getElementById('passwordModal');
        if (passwordModal) {
            passwordModal.style.display = 'block';
        }
        
        // Şifre input'una odaklan
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.focus();
        }
        
        // Uygulama içeriğini gizle (şifre modalı açıkken)
        const mainContent = document.querySelector('main') || document.querySelector('.container');
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        
        if (mainContent) mainContent.style.display = 'none';
        if (header) header.style.display = 'none';
        if (footer) footer.style.display = 'none';
        
        // Şifre modalının dışına tıklandığında kapanmasını engelle
        if (passwordModal) {
            passwordModal.addEventListener('click', function(e) {
                // Modal içeriğine tıklanmadıysa (arka plana tıklandıysa) hiçbir şey yapma
                if (e.target === passwordModal) {
                    e.stopPropagation();
                }
            });
        }
    }
});

