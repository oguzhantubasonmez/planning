/**
 * Veri tablosu yönetim sınıfı - Grid işlemlerini yönetir
 */
class DataGrid {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = [];
        this.filteredData = [];
        this.selectedRowIndex = -1;
        this.selectedWeek = null;
        this.sortColumns = []; // Çoklu sıralama için: [{column: 'firmaAdi', direction: 'asc'}, ...]
        this.selectedRows = new Set(); // Seçili satırların planId'leri (checkbox ile seçilenler)
        this.areBreakdownsExpanded = false; // toplu aç/kapat durumu
        this.isSubmittingQueuePlan = false; // çift submit engelle
        this.filters = {
            bolum: '',
            ustMakineGrubu: '',
            makina: '',
            firma: '',
			malzeme: [],
            durum: '',
            search: '',
            tarihBaslangic: '',
            tarihBitis: ''
        };
        
        // Bölüm-Üst Makine-Makine Mapping
        this.machineMapping = {
            '01.MAÇAHANE': {
                'Furan Maça': ['Furan El Maçası'],
                'Sıcak Maça Makinesi Grubu': ['1 Numaralı Sıcak Maça Makinesi', '2 Numaralı Sıcak Maça Makinesi'],
                'Otomatik Maça Makinesi Grubu': ['25 Numaralı Maça Makinesi Protek4', '24 Numaralı Maça Makinesi Protek3', '23 Numaralı Maça Makinesi Protek2', '22 Numaralı Maça Makinesi Protek1', '20 Numaralı Maça Makinesi', '19 Numaralı Maça Makinesi'],
                'Orta Maça Makineleri': ['16 Numaralı Maça Makinesi', '15 Numaralı Maça Makinesi', '14 Numaralı Maça Makinesi', '11 Numaralı Maça Makinesi'],
                'Küçük Maça Makineleri': ['9 Numaralı Maça Makinesi', '8 Numaralı Maça Makinesi', '7 Numaralı Maça Makinesi', '6 Numaralı Maça Makinesi', '13 Numaralı Maça Makinesi', '12 Numaralı Maça Makinesi', '10 Numaralı Maça Makinesi'],
                'El Maçası': ['El Maçası'],
                'Büyük Maça Makineleri': ['18 Numaralı Maça Makinesi', '17 Numaralı Maça Makinesi']
            },
            '02.KALIPLAMA': {
                'Yaş Kum Hatları': ['Hunter 2', 'Hunter 1', 'Disa -2 Match 20/24', 'Disa -1 Match 24/28'],
                'Reçineli Kalıplama Hatları': ['Yer Kalıbı', 'Küçük Omega Hattı', 'Büyük Omega Hattı']
            },
            '04.DÖKÜM': {
                'DÖKÜM POTALARI': ['300 KİLOLUK POTA', '600 KİLOLUK POTA', '1000 KİLOLUK POTA', '2000 KİLOLUK POTA', '12000 KİLOLUK POTA', '3000 KİLOLUK POTA', '500 KİLOLUK POTA', '6000 KİLOLUK POTA']
            },
            '05.TAŞLAMA': {
                'Büyük Parça Taşlama': ['Havalı Canavar 1', 'Havalı Canavar 2', 'Havalı Canavar 3', 'Havalı Canavar 4', 'Havalı Canavar 5', 'Havalı Canavar 6', 'Havalı Canavar 7', 'Havalı Canavar 8', 'Havalı Canavar 9', 'Havalı Canavar 10', 'Havalı Canavar 11', 'Havalı Canavar 12', 'Havalı Canavar 13', 'Havalı Canavar 14', 'Havalı Canavar 15', 'El Taşı'],
                'Küçük Parça Taşlama': ['Dayama Taşlama Makinesi 1', 'Dayama Taşlama Makinesi 2', 'Dayama Taşlama Makinesi 3', 'Dayama Taşlama Makinesi 4', 'Dayama Taşlama Makinesi 5', 'Dayama Taşlama Makinesi 6'],
                'Maus CNC Taşlama Makinesi': ['Maus CNC Taşlama Makinesi'],
                'Denizciler Grubu': ['Denizciler CNC Taşlama Makinesi 1', 'Denizciler CNC Taşlama Makinesi 2'],
                'Kenan grubu': ['Kenan CNC Taşlama Makinesi 1', 'Kenan CNC Taşlama Makinesi 2'],
                'Koyama Grubu': ['Koyama CNC Taşlama Makinesi (No:2146)', 'Koyama CNC Taşlama Makinesi (No:2516)', 'Koyama CNC Taşlama Makinesi (No:2559)']
            },
            '06.BOYAHANE': {
                'Toz Boya Hattı': ['Toz Boya Hattı'],
                'Yaş Boya Hattı': ['Yaş Boya Hattı 1', 'Yaş Boya Hattı 2']
            },
            '07.İŞLEME': {
                'Altor Ahşap İşleme CNC': ['Altor Ahşap İşleme CNC'],
                'Dik İşlem Merkezi': ['Ajan Dik İşlem CNC 1', 'Ajan Dik İşlem CNC 2', 'Quaser Dik İşlem CNC 1', 'Quaser Dik İşlem CNC 2', 'Quaser Dik İşlem CNC 3', 'Awea Dik İşlem CNC', 'Sunmill JHV1300 CNC Dik İşlem Merkezi', 'Wele VB315 Köprü Tipi İşlem Merkezi', 'Sunmill JHV1500 CNC Dik İlem Merkezi'],
                'Freze': ['Universal Freze'],
                'Matkap': ['Sütunlu Matkap 1 (Kılavuz)', 'Sütunlu Matkap 2', 'Sütunlu Matkap 3', 'Sütunlu Matkap 4', 'Sütunlu Matkap 5 (Rayba)', 'Sütunlu Matkap 6 (Rayba)', 'Radyal Matkap'],
                'Torna': ['Torna'],
                'CNC Torna': ['Takisawa Yatay CNC Torna', 'Mazak Yatay CNC Torna', 'Doosan Puma V8 300M CNC Dik Torna', 'Doosan Puma VTR1620M CNC Dik Torna', 'Doosan Puma PV9 300M CNC Dik Torna', 'Universal Torna', 'Universal Torna 2000', 'Universal Torna 3000']
            },
            '08.PAKETLEME': {
                'SEVKİYAT': ['SEVKİYAT']
            },
            'FASON İŞLEMLER': {
                'Fason İşlemler': ['Fason İşlemler']
            }
        };
        this.dateRange = {
            startDate: '',
            endDate: ''
        };
        this.chartDateFilter = {
            enabled: false,
            startDate: '',
            endDate: ''
        };
        // Sütun görünürlüğü ayarları
        this.columnVisibility = this.loadColumnVisibility();
        // Sütun sıralaması ayarları
        this.columnOrder = this.loadColumnOrder();
        this.init();
    }
    /**
     * Grid'i başlatır
     */
    init() {
        this.createTableStructure();
		this.injectMultiSelectStyles();
        this.bindEvents();
        this.setupColumnVisibility();
        this.applyColumnVisibilitySettings();
    }
    /**
     * Tablo yapısını oluşturur
     */
    createTableStructure() {
        this.container.innerHTML = `
            <div class="filter-section">
                <div class="filter-grid">
                    <div class="filter-column">
                        <div class="filter-row">
                            <label for="bolumFilter">Bölüm Filtresi:</label>
                            <select id="bolumFilter">
                                <option value="">Tümü</option>
                            </select>
                        </div>
                        <div class="filter-row">
                            <label for="ustMakineFilter">Üst Makine Grubu Filtresi:</label>
                            <select id="ustMakineFilter">
                                <option value="">Tümü</option>
                            </select>
                        </div>
                        <div class="filter-row">
                            <label for="makinaFilter">Makina Filtresi:</label>
                            <select id="makinaFilter">
                                <option value="">Tümü</option>
                            </select>
                        </div>
                    </div>
                    <div class="filter-column">
                        <div class="filter-row">
							<label for="malzemeMultiSelect">Malzeme Filtresi:</label>
							<div id="malzemeMultiSelect" class="multi-select">
								<div id="malzemeControl" class="multi-select-control" tabindex="0">
									<span id="malzemePlaceholder" class="multi-select-placeholder">Tümü</span>
									<span id="malzemeValues" class="multi-select-values"></span>
									<span class="multi-select-arrow">▾</span>
								</div>
								<div id="malzemeMenu" class="multi-select-menu" aria-hidden="true">
									<div class="multi-select-actions"><button type="button" id="malzemeToggleAll">Tümünü Seç</button></div>
									<div id="malzemeList" class="multi-select-list"></div>
								</div>
							</div>
                        </div>
                        <div class="filter-row">
                            <label for="durumFilter">Durum Filtresi:</label>
                            <div id="durumMultiSelect" class="multi-select" style="width: 100%;">
                                <div id="durumControl" class="multi-select-control" tabindex="0" style="width: 100%;">
                                    <span id="durumPlaceholder" class="multi-select-placeholder">Tümü</span>
                                    <span id="durumValues" class="multi-select-values"></span>
                                    <span class="multi-select-arrow">▾</span>
                                </div>
                                <div id="durumMenu" class="multi-select-menu" aria-hidden="true" style="width: 100%;">
                                    <div class="multi-select-actions"><button type="button" id="durumToggleAll">Tümünü Seç</button></div>
                                    <div id="durumList" class="multi-select-list"></div>
                                </div>
                            </div>
                        </div>
                        <div class="filter-row">
                            <label for="firmaFilter">Firma Filtresi:</label>
                            <select id="firmaFilter">
                                <option value="">Tümü</option>
                            </select>
                        </div>
                    </div>
                    <div class="button-column">
                        <div class="button-group">
                            <button type="button" id="printWorkOrderBtn" class="action-btn print-btn" onclick="dataGrid.printWorkOrder()">
                                <span class="btn-icon">🖨️</span>
                                <span class="btn-text">İş Emri Yazdır</span>
                            </button>
                            <button type="button" id="printShippingPlanBtn" class="action-btn shipping-btn" onclick="dataGrid.printShippingPlan()">
                                <span class="btn-icon">📦</span>
                                <span class="btn-text">Sevkiyat Planı Yazdır</span>
                            </button>
                            <button type="button" id="transferDelayedBtn" class="action-btn" onclick="dataGrid.transferDelayedJobs()" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #f97316 100%); border: 2px solid rgba(249, 115, 22, 0.5);">
                                <span class="btn-icon">⚠️</span>
                                <span class="btn-text">Gecikmişleri Aktar</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="search-row">
                    <div class="search-container">
                        <input type="text" id="searchInput" placeholder="Tabloda arama yapın..." />
                        <button type="button" id="clearSearch" class="clear-search-btn">
                            <span class="clear-icon">×</span>
                        </button>
                    </div>
                </div>
                <div class="filter-row date-filter-row">
                    <label for="startDateFilter">Planlanan Tarih Başlangıç:</label>
                    <input type="date" id="startDateFilter" />
                    <label for="endDateFilter">Planlanan Tarih Bitiş:</label>
                    <input type="date" id="endDateFilter" />
                    <button id="applyDateFilter" onclick="dataGrid.applyDateFilter()">Tarih Filtresini Uygula</button>
                    <button id="resetDateFilter" onclick="dataGrid.resetDateFilter()">Filtreyi Sıfırla</button>
                    <button id="toggleAllBtn" type="button" class="toggle-chip" title="Kırılımları Aç/Kapat">▼ Kırılımları Aç</button>
                </div>
            </div>
            <div id="dataGrid">
                    <table class="grid-table">
                        <thead>
                            <tr id="tableHeadersRow">
                                <!-- Sütun başlıkları JavaScript ile doldurulacak -->
                            </tr>
                        </thead>
                        <tbody id="gridBody">
                            <!-- Veriler JavaScript ile doldurulacak -->
                        </tbody>
                    </table>
            </div>
        `;
        
        // Sütun başlıklarını columnOrder sırasına göre oluştur
        this.createColumnHeaders();
    }
    
    /**
     * Sütun başlıklarını columnOrder sırasına göre oluşturur
     */
    createColumnHeaders() {
        const columnLabels = {
            'durum': 'Durum',
            'isemriNo': 'İş Emri No',
            'malhizKodu': 'Malzeme Kodu',
            'imalatTuru': 'Malzeme',
            'makAd': 'Makina Adı',
            'tarih': 'Sipariş Tarihi',
            'agirlik': 'Net Ağırlık',
            'brutAgirlik': 'Brüt Ağırlık',
            'toplamSure': 'Toplam Süre',
            'planMiktar': 'Sipariş Miktar (Kalıp)',
            'sevkMiktari': 'Sevk Miktarı',
            'bakiyeMiktar': 'Bakiye Miktar',
            'figurSayisi': 'Figür Sayısı',
            'siparisMiktarHesaplanan': 'Sipariş Miktar (Adet)',
            'gercekMiktar': 'Gerçekleşen Miktar',
            'planlananMiktar': 'Planlanan Miktar',
            'planlananTarih': 'Planlanan Tarih',
            'onerilenTeslimTarih': 'Önerilen Teslim',
            'firmaAdi': 'Firma',
            'aciklama': 'Açıklama'
        };
        
        const theadRow = document.getElementById('tableHeadersRow');
        if (!theadRow) {
            console.error('tableHeadersRow bulunamadı!');
            return;
        }
        
        // Mevcut başlıkları temizle
        theadRow.innerHTML = '';
        
        // columnOrder içinde olmayan ama columnLabels içinde olan sütunları bul ve ekle
        const defaultOrder = ['durum', 'isemriNo', 'malhizKodu', 'imalatTuru', 'makAd', 'tarih', 'agirlik', 'brutAgirlik', 'toplamSure', 'planMiktar', 'figurSayisi', 'siparisMiktarHesaplanan', 'sevkMiktari', 'bakiyeMiktar', 'gercekMiktar', 'planlananMiktar', 'planlananTarih', 'onerilenTeslimTarih', 'firmaAdi', 'aciklama'];
        const missingColumns = Object.keys(columnLabels).filter(key => !this.columnOrder.includes(key));
        if (missingColumns.length > 0) {
            // Eksik sütunları varsayılan konumlarına ekle
            missingColumns.forEach(missingKey => {
                const defaultIndex = defaultOrder.indexOf(missingKey);
                if (defaultIndex !== -1 && defaultIndex > 0) {
                    const insertAfter = defaultOrder[defaultIndex - 1];
                    const insertIndex = this.columnOrder.indexOf(insertAfter);
                    if (insertIndex !== -1) {
                        this.columnOrder.splice(insertIndex + 1, 0, missingKey);
                    } else {
                        this.columnOrder.push(missingKey);
                    }
                } else {
                    this.columnOrder.push(missingKey);
                }
            });
            // Güncellenmiş sıralamayı kaydet
            this.saveColumnOrder();
        }
        
        // İlk sütun olarak checkbox başlığı ekle
        const checkboxHeader = document.createElement('th');
        checkboxHeader.style.width = '40px';
        checkboxHeader.style.textAlign = 'center';
        checkboxHeader.innerHTML = `
            <input type="checkbox" id="selectAllRows" title="Tümünü seç/seçimi kaldır" 
                   onchange="dataGrid.toggleSelectAllRows(this.checked)">
        `;
        theadRow.appendChild(checkboxHeader);
        
        // columnOrder sırasına göre başlıkları oluştur
        this.columnOrder.forEach(columnKey => {
            const label = columnLabels[columnKey];
            if (label) {
                const th = document.createElement('th');
                th.className = 'sortable';
                th.setAttribute('data-column', columnKey);
                th.textContent = label;
                th.style.cursor = 'pointer';
                th.title = 'Sıralamak için tıklayın';
                theadRow.appendChild(th);
            } else {
                console.warn('Bilinmeyen sütun anahtarı:', columnKey);
            }
        });
    }
    
    /**
     * Sütun başlıklarını columnOrder sırasına göre oluşturur (eski metod, geriye uyumluluk için)
     */
    getColumnHeadersHTML() {
        const columnLabels = {
            'durum': 'Durum',
            'isemriNo': 'İş Emri No',
            'malhizKodu': 'Malzeme Kodu',
            'imalatTuru': 'Malzeme',
            'makAd': 'Makina Adı',
            'tarih': 'Sipariş Tarihi',
            'agirlik': 'Net Ağırlık',
            'brutAgirlik': 'Brüt Ağırlık',
            'toplamSure': 'Toplam Süre',
            'planMiktar': 'Sipariş Miktar (Kalıp)',
            'sevkMiktari': 'Sevk Miktarı',
            'bakiyeMiktar': 'Bakiye Miktar',
            'figurSayisi': 'Figür Sayısı',
            'siparisMiktarHesaplanan': 'Sipariş Miktar (Adet)',
            'gercekMiktar': 'Gerçekleşen Miktar',
            'planlananMiktar': 'Planlanan Miktar',
            'planlananTarih': 'Planlanan Tarih',
            'onerilenTeslimTarih': 'Önerilen Teslim',
            'firmaAdi': 'Firma',
            'aciklama': 'Açıklama'
        };
        
        return this.columnOrder.map(columnKey => {
            const label = columnLabels[columnKey] || columnKey;
            return `<th class="sortable" data-column="${columnKey}">${label}</th>`;
        }).join('');
    }
    
    /**
     * Event listener'ları bağlar
     */
    bindEvents() {
        const bolumFilter = document.getElementById('bolumFilter');
        const ustMakineFilter = document.getElementById('ustMakineFilter');
        const makinaFilter = document.getElementById('makinaFilter');
        const firmaFilter = document.getElementById('firmaFilter');
		const malzemeControl = document.getElementById('malzemeControl');
		const malzemeMenu = document.getElementById('malzemeMenu');
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearch');
        const toggleAllBtn = document.getElementById('toggleAllBtn');
        if (toggleAllBtn) {
            toggleAllBtn.addEventListener('click', () => {
                if (this.areBreakdownsExpanded) {
                    this.collapseAllBreakdowns();
                    this.areBreakdownsExpanded = false;
                    toggleAllBtn.textContent = 'Kırılımları Aç';
                } else {
                    this.expandAllBreakdowns();
                    this.areBreakdownsExpanded = true;
                    toggleAllBtn.textContent = 'Kırılımları Kapat';
                }

            });
        }
        if (bolumFilter) {
            bolumFilter.addEventListener('change', async (e) => {
                this.filters.bolum = e.target.value;
                this.filters.ustMakineGrubu = '';
                this.filters.makina = '';
                
                // "Tanımsız" filtresi aktifse
                if (e.target.value === 'tanımsız') {
                    if (ustMakineFilter) {
                        ustMakineFilter.innerHTML = '<option value="">Tümü</option>';
                    }
                    if (makinaFilter) {
                        makinaFilter.innerHTML = '<option value="">Tümü</option>';
                    }
                    this.applyFilters();
                    return;
                }
                
                // Üst makine grubu filtresini güncelle
                await this.updateUstMakineFilter();
                // Makina filtresini sıfırla
                if (makinaFilter) {
                    makinaFilter.innerHTML = '<option value="">Tümü</option>';
                }
                this.applyFilters();
                
                // ChartManager'ı güncelle
                if (window.chartManager) {
                    await window.chartManager.updateDepartmentFilter(e.target.value);
                }
            });
        }
        if (ustMakineFilter) {
            ustMakineFilter.addEventListener('change', async (e) => {
                this.filters.ustMakineGrubu = e.target.value;
                this.filters.makina = '';
                
                // Makina filtresini güncelle
                await this.updateMakinaFilter();
                this.applyFilters();
            });
        }
        if (makinaFilter) {
            makinaFilter.addEventListener('change', async (e) => {
                this.filters.makina = e.target.value;
                this.applyFilters();
                // ChartManager'ı güncelle
                if (window.chartManager) {
                    await window.chartManager.updateMachineFilter(e.target.value);
                }
            });
        }
        if (firmaFilter) {
            firmaFilter.addEventListener('change', (e) => {
                this.filters.firma = e.target.value;
                this.applyFilters();
            });
        }
		// Malzeme ve Durum filtreleri populateFilters içinde oluşturulacak
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.applyFilters();
            });
        } else {
            console.error('Arama barı bulunamadı!');
        }
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                }
                this.filters.search = '';
                this.applyFilters();
            });
        } else {
            console.error('Temizleme butonu bulunamadı!');
        }
        // Sıralama event listener'ları - event delegation kullan (dinamik başlıklar için)
        const thead = document.querySelector('.grid-table thead');
        if (thead) {
            thead.addEventListener('click', (e) => {
                const header = e.target.closest('.sortable');
                if (header) {
                    const column = header.getAttribute('data-column');
                    if (column) {
                this.sortData(column);
                    }
                }
            });
        }
        
        // Hafta aralığı seçici event listener'ı
        const yearRangeStart = document.getElementById('yearRangeStart');
        const weekRangeStart = document.getElementById('weekRangeStart');
        const yearRangeEnd = document.getElementById('yearRangeEnd');
        const weekRangeEnd = document.getElementById('weekRangeEnd');
        const applyWeekRange = document.getElementById('applyWeekRange');
        
        if (applyWeekRange) {
            // Hafta seçeneklerini doldur
            this.populateWeekRangeSelectors();
            
            // Yıl değiştiğinde hafta dropdown'larını güncelle
            if (yearRangeStart) {
                yearRangeStart.addEventListener('change', () => {
                    const selectedYear = parseInt(yearRangeStart.value);
                    const currentStartWeek = parseInt(weekRangeStart.value) || 1;
                    const currentEndWeek = parseInt(weekRangeEnd.value) || 1;
                    // Yıl değiştiğinde hafta seçeneklerini güncelle
                    this.updateWeekOptionsForYear(selectedYear, 'start');
                });
            }
            
            if (yearRangeEnd) {
                yearRangeEnd.addEventListener('change', () => {
                    const selectedYear = parseInt(yearRangeEnd.value);
                    // Yıl değiştiğinde hafta seçeneklerini güncelle
                    this.updateWeekOptionsForYear(selectedYear, 'end');
                });
            }
            
            applyWeekRange.addEventListener('click', () => {
                const startYear = parseInt(yearRangeStart.value);
                const startWeek = parseInt(weekRangeStart.value);
                const endYear = parseInt(yearRangeEnd.value);
                const endWeek = parseInt(weekRangeEnd.value);
                
                // Tarih kontrolü
                const startDate = new Date(startYear, 0, 1);
                const endDate = new Date(endYear, 0, 1);
                
                if (startDate > endDate || (startDate.getTime() === endDate.getTime() && startWeek > endWeek)) {
                    window.planningApp.showWarning('Başlangıç tarihi bitiş tarihinden sonra olamaz!');
                    return;
                }
                
                window.chartManager.setWeekRangeWithYear(startYear, startWeek, endYear, endWeek);
            });
        }
    }

	/**
	 * Multi-select için gerekli stilleri enjekte eder
	 */
	injectMultiSelectStyles() {
		if (document.getElementById('dg-multiselect-styles')) return;
		const style = document.createElement('style');
		style.id = 'dg-multiselect-styles';
		style.textContent = `
			.multi-select { position: relative; flex: 1; min-width: 200px; max-width: 300px; }
			.filter-row .multi-select { align-self: stretch; }
			.multi-select-control { display: flex; align-items: center; justify-content: space-between; gap: 8px; border: 1px solid #ced4da; background: #fff; padding: 6px 10px; border-radius: 4px; min-height: 34px; cursor: pointer; position: relative; }
			.multi-select-control:focus { outline: none; box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.25); border-color: #007acc; }
			.multi-select-placeholder { color: #6c757d; }
			.multi-select-values { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
			.multi-select-arrow { margin-left: auto; color: #666; flex-shrink: 0; }
			.multi-select-menu { position: absolute; left: 0; right: 0; top: calc(100% + 6px); background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 8px; max-height: 260px; overflow-y: auto; overflow-x: visible; z-index: 10000; display: none; min-width: 100%; box-sizing: border-box; }
			.multi-select-actions { display: flex; gap: 8px; justify-content: flex-start; padding: 4px 0 8px 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 8px; }
			.multi-select-actions button { padding: 6px 10px; border: 1px solid #d0d7de; background: #f6f8fa; color: #24292f; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; margin: 0; margin-left: 0; min-width: auto; }
			.multi-select-actions button:hover { background: #eef2f6; }
			.multi-select-list { display: grid; grid-template-columns: 1fr; gap: 6px; }
			.multi-select-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 4px; cursor: pointer; line-height: 1.5; min-height: 32px; justify-content: flex-start; text-align: left; white-space: nowrap; width: 100%; box-sizing: border-box; }
			.multi-select-item > *:not(.multi-select-checkbox) { flex-shrink: 0; }
			.multi-select-item:hover { background: #f8fafc; }
			.multi-select-checkbox { margin: 0; cursor: pointer; flex-shrink: 0; width: 16px; height: 16px; }
			.multi-chip { background: #e8f4fd; color: #0b5cab; border: 1px solid #b3d9ff; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
		`;
		document.head.appendChild(style);
	}

	/**
	 * Malzeme filtresini sıfırdan oluşturur
	 */
	setupMalzemeFilter() {
		const malzemeControl = document.getElementById('malzemeControl');
		const malzemeMenu = document.getElementById('malzemeMenu');
		const malzemeList = document.getElementById('malzemeList');
		const malzemeToggleAll = document.getElementById('malzemeToggleAll');
		
		if (!malzemeControl || !malzemeMenu || !malzemeList) {
			console.warn('Malzeme filtre elementleri bulunamadı');
			return;
		}
		
		// Mevcut event listener'ları temizle (çift bağlanmayı önlemek için)
		const newControl = malzemeControl.cloneNode(true);
		malzemeControl.parentNode.replaceChild(newControl, malzemeControl);
		const newMenu = malzemeMenu.cloneNode(true);
		malzemeMenu.parentNode.replaceChild(newMenu, malzemeMenu);
		
		// Yeni elementleri al
		const control = document.getElementById('malzemeControl');
		const menu = document.getElementById('malzemeMenu');
		const list = document.getElementById('malzemeList');
		const toggleAll = document.getElementById('malzemeToggleAll');
		
		// Mevcut içeriği temizle
		list.innerHTML = '';
		
		// Veri kontrolü
		if (!this.data || this.data.length === 0) {
			console.warn('Malzeme filtresi için veri yok');
			return;
		}
		
		// Malzeme seçeneklerini al
		const malzemeler = [...new Set(this.data.map(item => item.imalatTuru))].filter(m => m).sort();
		
		// Checkbox'ları oluştur
		malzemeler.forEach(malzeme => {
			const label = document.createElement('label');
			label.className = 'multi-select-item';
			
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.value = malzeme;
			checkbox.className = 'multi-select-checkbox';
			checkbox.addEventListener('change', () => {
				this.updateMalzemeControlDisplay();
				this.applyFilters();
			});
			
			label.appendChild(checkbox);
			label.appendChild(document.createTextNode(malzeme));
			list.appendChild(label);
		});
		
		// Tümünü seç/kaldır butonu
		if (toggleAll) {
			toggleAll.addEventListener('click', (e) => {
				e.stopPropagation();
				const checkboxes = list.querySelectorAll('input[type="checkbox"]');
				const allChecked = Array.from(checkboxes).every(cb => cb.checked);
				checkboxes.forEach(cb => cb.checked = !allChecked);
				this.updateMalzemeControlDisplay();
				this.applyFilters();
			});
		}
		
		// Dropdown aç/kapa
		const toggleMenu = () => {
			const isHidden = menu.getAttribute('aria-hidden') === 'true';
			menu.setAttribute('aria-hidden', isHidden ? 'false' : 'true');
			menu.style.display = isHidden ? 'block' : 'none';
		};
		
		control.addEventListener('click', (e) => {
			e.stopPropagation();
			toggleMenu();
		});
		
		// Dışarı tıklandığında kapat
		document.addEventListener('click', (e) => {
			if (menu.getAttribute('aria-hidden') === 'false' && !document.getElementById('malzemeMultiSelect').contains(e.target)) {
				menu.setAttribute('aria-hidden', 'true');
				menu.style.display = 'none';
			}
		});
		
		// İlk gösterimi güncelle
		this.updateMalzemeControlDisplay();
	}
	
	/**
	 * Durum filtresini sıfırdan oluşturur
	 */
	setupDurumFilter() {
		const durumControl = document.getElementById('durumControl');
		const durumMenu = document.getElementById('durumMenu');
		const durumList = document.getElementById('durumList');
		const durumToggleAll = document.getElementById('durumToggleAll');
		
		if (!durumControl || !durumMenu || !durumList) {
			console.warn('Durum filtre elementleri bulunamadı');
			return;
		}
		
		// Mevcut event listener'ları temizle (çift bağlanmayı önlemek için)
		const newControl = durumControl.cloneNode(true);
		durumControl.parentNode.replaceChild(newControl, durumControl);
		const newMenu = durumMenu.cloneNode(true);
		durumMenu.parentNode.replaceChild(newMenu, durumMenu);
		
		// Yeni elementleri al
		const control = document.getElementById('durumControl');
		const menu = document.getElementById('durumMenu');
		const list = document.getElementById('durumList');
		const toggleAll = document.getElementById('durumToggleAll');
		
		// Mevcut içeriği temizle
		list.innerHTML = '';
		
		// Durum seçenekleri
		const durumOptions = ['Planlandı', 'Kısmi Planlandı', 'Beklemede', 'Gecikti', 'Tamamlandı'];
		
		// Checkbox'ları oluştur
		durumOptions.forEach(durum => {
			const label = document.createElement('label');
			label.className = 'multi-select-item';
			
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.value = durum;
			checkbox.className = 'multi-select-checkbox';
			checkbox.addEventListener('change', () => {
				this.updateDurumControlDisplay();
				this.applyFilters();
			});
			
			label.appendChild(checkbox);
			label.appendChild(document.createTextNode(durum));
			list.appendChild(label);
		});
		
		// Tümünü seç/kaldır butonu
		if (toggleAll) {
			toggleAll.addEventListener('click', (e) => {
				e.stopPropagation();
				const checkboxes = list.querySelectorAll('input[type="checkbox"]');
				const allChecked = Array.from(checkboxes).every(cb => cb.checked);
				checkboxes.forEach(cb => cb.checked = !allChecked);
				this.updateDurumControlDisplay();
				this.applyFilters();
			});
		}
		
		// Dropdown aç/kapa
		const toggleMenu = () => {
			const isHidden = menu.getAttribute('aria-hidden') === 'true';
			menu.setAttribute('aria-hidden', isHidden ? 'false' : 'true');
			menu.style.display = isHidden ? 'block' : 'none';
		};
		
		control.addEventListener('click', (e) => {
			e.stopPropagation();
			toggleMenu();
		});
		
		// Dışarı tıklandığında kapat
		document.addEventListener('click', (e) => {
			if (menu.getAttribute('aria-hidden') === 'false' && !document.getElementById('durumMultiSelect').contains(e.target)) {
				menu.setAttribute('aria-hidden', 'true');
				menu.style.display = 'none';
			}
		});
		
		// İlk gösterimi güncelle
		this.updateDurumControlDisplay();
	}

	/**
	 * Malzeme çoklu seçim listesini bağlar
	 */
	bindMalzemeListEvents() {
		const list = document.getElementById('malzemeList');
		const toggleAllBtn = document.getElementById('malzemeToggleAll');
		if (!list) return;
		const sync = () => {
			const selected = Array.from(list.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
			this.filters.malzeme = selected;
			this.updateMalzemeControlDisplay();
			this.applyFilters();
		};
		list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
			cb.addEventListener('change', sync);
		});
		const updateToggleLabel = () => {
			const total = list.querySelectorAll('input[type="checkbox"]').length;
			const selected = list.querySelectorAll('input[type="checkbox"]:checked').length;
			if (toggleAllBtn) toggleAllBtn.textContent = selected === total && total > 0 ? 'Temizle' : 'Tümünü Seç';
		};
		if (toggleAllBtn) {
			toggleAllBtn.addEventListener('click', () => {
				const total = list.querySelectorAll('input[type="checkbox"]').length;
				const selected = list.querySelectorAll('input[type="checkbox"]:checked').length;
				const selectAll = !(selected === total && total > 0);
				list.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = selectAll; });
				sync();
				updateToggleLabel();
			});
		}
		updateToggleLabel();
		// İlk render sonrası görüntüyü güncelle
		this.updateMalzemeControlDisplay();
	}

	/**
	 * Seçilen malzeme değerlerini kontrol üzerinde görüntüler
	 */
	updateMalzemeControlDisplay() {
		const placeholderEl = document.getElementById('malzemePlaceholder');
		const valuesEl = document.getElementById('malzemeValues');
		if (!placeholderEl || !valuesEl) return;
		const selected = this.filters.malzeme || [];
		valuesEl.innerHTML = '';
		if (!selected.length) {
			placeholderEl.style.display = '';
			return;
		}
		placeholderEl.style.display = 'none';
		const itemsToShow = selected.slice(0, 3);
		itemsToShow.forEach(val => {
			const chip = document.createElement('span');
			chip.className = 'multi-chip';
			chip.textContent = val;
			valuesEl.appendChild(chip);
		});
		if (selected.length > 3) {
			const more = document.createElement('span');
			more.className = 'multi-chip';
			more.textContent = `+${selected.length - 3}`;
			valuesEl.appendChild(more);
        }
    }
    
    /**
     * Bir yıldaki ISO 8601 hafta sayısını hesaplar (52 veya 53)
     * @param {number} year - Yıl
     * @returns {number} Hafta sayısı (52 veya 53)
     */
    getWeeksInYear(year) {
        // ISO 8601: 31 Aralık'ın hafta numarasını kontrol et
        const dec31 = new Date(year, 11, 31);
        const weekString = this.getWeekFromDate(this.formatDateISO(dec31));
        if (weekString) {
            const weekYear = parseInt(weekString.split('-W')[0]);
            const weekNum = parseInt(weekString.split('-W')[1]);
            // Eğer hafta yılı farklıysa (31 Aralık bir sonraki yılın ilk haftasında), 
            // bir önceki haftaya bak
            if (weekYear !== year) {
                const dec28 = new Date(year, 11, 28);
                const weekString28 = this.getWeekFromDate(this.formatDateISO(dec28));
                if (weekString28) {
                    const weekNum28 = parseInt(weekString28.split('-W')[1]);
                    return weekNum28;
                }
            }
            return weekNum;
        }
        // Fallback: Genellikle 52 hafta
        return 52;
    }

    /**
     * Belirli bir yıl için hafta dropdown seçeneklerini günceller
     * @param {number} year - Yıl
     * @param {string} type - 'start' veya 'end'
     */
    updateWeekOptionsForYear(year, type) {
        const weekSelector = type === 'start' 
            ? document.getElementById('weekRangeStart') 
            : document.getElementById('weekRangeEnd');
        
        if (!weekSelector) return;
        
        const maxWeeks = this.getWeeksInYear(year);
        const currentValue = parseInt(weekSelector.value) || 1;
        const selectedValue = Math.min(currentValue, maxWeeks); // Mevcut değer geçerli aralıkta değilse, maksimum değeri kullan
        
        let weekOptions = '';
        for (let i = 1; i <= maxWeeks; i++) {
            const isSelected = i === selectedValue;
            weekOptions += `<option value="${i}" ${isSelected ? 'selected' : ''}>Hafta ${i}</option>`;
        }
        
        weekSelector.innerHTML = weekOptions;
        weekSelector.value = selectedValue;
    }

    /**
     * Hafta aralığı seçicilerini doldurur
     * @param {number} targetYear - Hedef yıl (opsiyonel, varsayılan: mevcut yıl)
     * @param {number} targetStartWeek - Hedef başlangıç haftası (opsiyonel)
     * @param {number} targetEndWeek - Hedef bitiş haftası (opsiyonel)
     * @param {string|null} selectedWeek - Seçili hafta (opsiyonel, focusOnWeek'ten geçirilir)
     */
    populateWeekRangeSelectors(targetYear = null, targetStartWeek = null, targetEndWeek = null, selectedWeek = null) {
        const yearRangeStart = document.getElementById('yearRangeStart');
        const weekRangeStart = document.getElementById('weekRangeStart');
        const yearRangeEnd = document.getElementById('yearRangeEnd');
        const weekRangeEnd = document.getElementById('weekRangeEnd');
        
        if (!yearRangeStart || !weekRangeStart || !yearRangeEnd || !weekRangeEnd) return;
        
        // Mevcut haftayı hesapla
        const currentDate = new Date();
        const currentWeek = this.getWeekFromDate(this.formatDateISO(currentDate));
        const currentWeekNumber = parseInt(currentWeek.split('-W')[1]);
        const currentYear = parseInt(currentWeek.split('-W')[0]);
        
        // Hedef yıl varsa onu kullan, yoksa mevcut yılı kullan
        const baseYear = targetYear !== null ? targetYear : currentYear;
        
        // Yıl seçeneklerini oluştur (mevcut yıl ± 2 yıl)
        let yearOptions = '';
        for (let year = currentYear - 2; year <= currentYear + 2; year++) {
            const isSelectedStart = year === baseYear;
            const isSelectedEnd = year === baseYear;
            yearOptions += `<option value="${year}" ${isSelectedStart ? 'selected' : ''}>${year}</option>`;
        }
        
        yearRangeStart.innerHTML = yearOptions;
        yearRangeEnd.innerHTML = yearOptions;
        
        // Yıl değerlerini set et
        yearRangeStart.value = baseYear;
        yearRangeEnd.value = baseYear;
        
        // Her yıl için gerçek hafta sayısını hesapla (52 veya 53)
        const maxWeeks = this.getWeeksInYear(baseYear);
        
        // Hafta seçeneklerini oluştur
        let startWeekOptions = '';
        let endWeekOptions = '';
        
        // Hedef haftalar varsa onları kullan, yoksa varsayılan değerleri kullan
        const startWeek = targetStartWeek !== null ? targetStartWeek : currentWeekNumber;
        const endWeekNumber = targetEndWeek !== null ? targetEndWeek : Math.min(currentWeekNumber + 3, maxWeeks);
        
        for (let i = 1; i <= maxWeeks; i++) {
            const isSelectedStart = i === startWeek;
            const isSelectedEnd = i === endWeekNumber;
            
            startWeekOptions += `<option value="${i}" ${isSelectedStart ? 'selected' : ''}>Hafta ${i}</option>`;
            endWeekOptions += `<option value="${i}" ${isSelectedEnd ? 'selected' : ''}>Hafta ${i}</option>`;
        }
        
        weekRangeStart.innerHTML = startWeekOptions;
        weekRangeEnd.innerHTML = endWeekOptions;
        
        // Hafta değerlerini set et
        weekRangeStart.value = startWeek;
        weekRangeEnd.value = endWeekNumber;
        
        // Varsayılan aralığı uygula
        const startYear = baseYear;
        const endYear = baseYear;
        const endWeek = endWeekNumber;
        
        // ChartManager'a varsayılan aralığı bildir (updateCharts'ı atla, çünkü focusOnWeek zaten çağıracak)
        // selectedWeek parametresini de geçir ki doğru hafta seçili kalsın
        if (window.chartManager) {
            window.chartManager.setWeekRangeWithYear(startYear, startWeek, endYear, endWeek, true, selectedWeek);
        }
    }
    
    /**
     * Mevcut filtreleri döndürür
     * @returns {Object} Filtre bilgileri
     */
    getCurrentFilters() {
        return {
            startDate: document.getElementById('startDateFilter')?.value || null,
            endDate: document.getElementById('endDateFilter')?.value || null,
            bolum: document.getElementById('bolumFilter')?.value || '',
            ustMakineGrubu: document.getElementById('ustMakineFilter')?.value || '',
            makina: document.getElementById('makinaFilter')?.value || '',
            firma: document.getElementById('firmaFilter')?.value || '',
			malzeme: Array.from(document.getElementById('malzemeList')?.querySelectorAll('input[type="checkbox"]:checked') || []).map(cb => cb.value)
        };
    }
    
    /**
     * Veriyi grid'e yükler
     * @param {Array} data - Yüklenecek veri
     * @param {boolean} skipFilters - Filtreleri atla mı?
     */
    async loadData(data, skipFilters = false) {
        this.data = data;
        this.filteredData = [...data];
        
        if (!skipFilters) {
            await this.populateFilters();
        }
        
        this.updateGrid();
    }
    /**
     * Filtre seçeneklerini doldurur
     */
    async populateFilters() {
        const bolumFilter = document.getElementById('bolumFilter');
        const ustMakineFilter = document.getElementById('ustMakineFilter');
        const makinaFilter = document.getElementById('makinaFilter');
        const firmaFilter = document.getElementById('firmaFilter');
        
        // Element kontrolü
		if (!bolumFilter) {
			console.error('bolumFilter elementi bulunamadı');
            return;
        }
        if (!ustMakineFilter) {
			console.error('ustMakineFilter elementi bulunamadı');
            return;
        }
        if (!makinaFilter) {
			console.error('makinaFilter elementi bulunamadı');
            return;
        }
        if (!firmaFilter) {
			console.error('firmaFilter elementi bulunamadı');
            return;
        }
        
        // Bölüm filtreleri - data'dan al, mapping'de olanları öncelikli yap
        const dataBolumler = this.data && this.data.length > 0 
            ? [...new Set(this.data.map(item => item.bolumAdi))].filter(b => b).sort()
            : [];
        const mappingBolumler = Object.keys(this.machineMapping).sort();
        
        // Mapping'de olanları önce, sonra data'dan gelen diğerlerini ekle
        const allBolumler = [...new Set([...mappingBolumler, ...dataBolumler])].sort();
        
        bolumFilter.innerHTML = allBolumler.map(bolum => `<option value="${bolum}">${bolum}</option>`).join('') +
            '<option value="tanımsız">TANIMSIZ</option>' +
            '<option value="">TÜMÜ</option>';
        
        // Varsayılan seçim: Kalıplama'yı tercih et; yoksa ilkini seç
        if (allBolumler.length > 0) {
            const normalize = (s) => (s || '').toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ğ/g, 'g');
            const preferredIndex = allBolumler.findIndex(b => normalize(b).includes('kalip'));
            const defaultBolum = preferredIndex >= 0 ? allBolumler[preferredIndex] : allBolumler[0];
            bolumFilter.value = defaultBolum;
            this.filters.bolum = defaultBolum;
            
            // Varsayılan bölüm seçildiğinde üst makine gruplarını doldur
            await this.updateUstMakineFilter();
        } else {
            ustMakineFilter.innerHTML = '<option value="">Tümü</option>';
        }
        
        // Makina filtresini sıfırla
        makinaFilter.innerHTML = '<option value="">Tümü</option>';
        
        // Firma filtreleri - alfabetik sıralama
        const firmalar = this.data && this.data.length > 0
            ? [...new Set(this.data.map(item => item.firmaAdi))].filter(f => f).sort()
            : [];
        firmaFilter.innerHTML = '<option value="">Tümü</option>' + 
            firmalar.map(firma => `<option value="${firma}">${firma}</option>`).join('');
		
		// Malzeme ve Durum filtrelerini sıfırdan oluştur
		this.setupMalzemeFilter();
		this.setupDurumFilter();
        
        // ChartManager'ı güncelle
        if (window.chartManager && this.filters.bolum) {
            window.chartManager.updateDepartmentFilter(this.filters.bolum);
        }
        
        // Filtreleri uygula
        this.applyFilters();
    }
    
    /**
     * Üst makine grubu filtresini günceller (bölüm seçimine göre)
     */
    async updateUstMakineFilter() {
        const ustMakineFilter = document.getElementById('ustMakineFilter');
        if (!ustMakineFilter) {
            console.warn('ustMakineFilter elementi bulunamadı');
            return;
        }
        
        const selectedBolum = this.filters.bolum;
        
        if (!selectedBolum || selectedBolum === 'tanımsız' || selectedBolum === '') {
            ustMakineFilter.innerHTML = '<option value="">Tümü</option>';
            return;
        }
        
        // Mapping'den üst makine gruplarını al
        const ustMakineGruplari = this.machineMapping[selectedBolum];
        if (!ustMakineGruplari) {
            // Mapping'de yoksa boş bırak (kullanıcı direkt makine seçebilir)
            ustMakineFilter.innerHTML = '<option value="">Tümü</option>';
            return;
        }
        
        const gruplar = Object.keys(ustMakineGruplari).sort();
        ustMakineFilter.innerHTML = '<option value="">Tümü</option>' + 
            gruplar.map(grup => `<option value="${grup}">${grup}</option>`).join('');
    }
    /**
     * Makina filtresini günceller (üst makine grubu seçimine göre)
     */
    async updateMakinaFilter() {
        const makinaFilter = document.getElementById('makinaFilter');
        if (!makinaFilter) return;
        
        const selectedBolum = this.filters.bolum;
        const selectedUstMakineGrubu = this.filters.ustMakineGrubu;
        
        if (!selectedBolum || selectedBolum === 'tanımsız' || selectedBolum === '') {
            makinaFilter.innerHTML = '<option value="">Tümü</option>';
            return;
        }
        
        let makineler = [];
        
        // Mapping'den makineleri al
        const ustMakineGruplari = this.machineMapping[selectedBolum];
        if (ustMakineGruplari) {
            if (selectedUstMakineGrubu && selectedUstMakineGrubu !== '') {
                // Seçili üst makine grubuna ait makineler
                makineler = ustMakineGruplari[selectedUstMakineGrubu] || [];
                } else {
                // Tüm üst makine gruplarındaki makineleri birleştir
                Object.values(ustMakineGruplari).forEach(makineListesi => {
                    makineler.push(...makineListesi);
                });
            }
        }
        
        // Mapping'de yoksa veya eksikse, data'dan al
        if (makineler.length === 0 || !ustMakineGruplari) {
            const dataMachines = [...new Set(this.data
                .filter(item => item.bolumAdi === selectedBolum)
                .map(item => item.makAd)
            )].filter(m => m).sort();
            makineler = [...new Set([...makineler, ...dataMachines])].sort();
        } else {
            // Tekrarları kaldır ve sırala
            makineler = [...new Set(makineler)].sort();
        }
        
        makinaFilter.innerHTML = '<option value="">Tümü</option>' + 
            makineler.map(makina => `<option value="${makina}">${makina}</option>`).join('');
    }
    /**
     * Filtreleri uygular
     */
    applyFilters() {
        // Filtre değerlerini al
        const bolumFilter = document.getElementById('bolumFilter');
        const ustMakineFilter = document.getElementById('ustMakineFilter');
        const makinaFilter = document.getElementById('makinaFilter');
        const firmaFilter = document.getElementById('firmaFilter');
        const malzemeFilter = document.getElementById('malzemeFilter');
        if (bolumFilter) this.filters.bolum = bolumFilter.value;
        if (ustMakineFilter) this.filters.ustMakineGrubu = ustMakineFilter.value;
        if (makinaFilter) this.filters.makina = makinaFilter.value;
        if (firmaFilter) this.filters.firma = firmaFilter.value;
		if (malzemeFilter) this.filters.malzeme = Array.from(malzemeFilter.selectedOptions).map(o => o.value).filter(v => v);
		// Yeni multi-select yapısı için DOM'dan oku
		const malzemeList = document.getElementById('malzemeList');
		if (malzemeList) {
			const selected = Array.from(malzemeList.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
			this.filters.malzeme = selected;
		}
        // Durum filtresi - çoklu seçim
        const durumList = document.getElementById('durumList');
        if (durumList) {
            const selected = Array.from(durumList.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
            this.filters.durum = selected.length > 0 ? selected : null;
        }
        
        // "Tanımsız" filtresi kontrolü - makina ve bölüm null olan kayıtları göster
        const isTanimsizFilter = this.filters.bolum === 'tanımsız';
        
        this.filteredData = this.data.filter(item => {
            // Tanımsız filtresi aktifse: sadece makina ve bölüm null olan kayıtları göster
            if (isTanimsizFilter) {
                const isTanimsiz = (!item.makAd || item.makAd === null || item.makAd === '') && 
                                   (!item.bolumAdi || item.bolumAdi === null || item.bolumAdi === '');
                return isTanimsiz; // Tanımsız filtresi aktifken diğer filtreleri dikkate alma
            }
            
            // Normal filtre mantığı
            const bolumMatch = !this.filters.bolum || item.bolumAdi === this.filters.bolum;
            
            // Üst makine grubu filtresi
            let ustMakineGrubuMatch = true;
            if (this.filters.ustMakineGrubu && this.filters.ustMakineGrubu !== '' && this.filters.bolum) {
                const ustMakineGruplari = this.machineMapping[this.filters.bolum];
                if (ustMakineGruplari) {
                    const makinelerInGroup = ustMakineGruplari[this.filters.ustMakineGrubu] || [];
                    const selectedUstMakineGrubu = this.filters.ustMakineGrubu;
                    
                    if (makinelerInGroup.length > 0) {
                        // 1. Ana kayıt makine kontrolü - alt makinelere tanımlı mı?
                        const mainMachineInGroup = makinelerInGroup.some(m => 
                            m.toLowerCase() === (item.makAd || '').toLowerCase()
                        );
                        
                        // 2. Ana kayıt makine kontrolü - direkt üst makineye tanımlı mı?
                        const mainMachineIsUpper = (item.makAd || '').toLowerCase() === selectedUstMakineGrubu.toLowerCase();
                        
                        // 3. Breakdown'lardaki makine kontrolü - alt makinelere tanımlı mı?
                        let breakdownMachineInGroup = false;
                        if (item.breakdowns && item.breakdowns.length > 0) {
                            breakdownMachineInGroup = item.breakdowns.some(breakdown => {
                                const breakdownMakAd = breakdown.makAd || breakdown.selectedMachine;
                                if (!breakdownMakAd) return false;
                                // Alt makine kontrolü
                                const isSubMachine = makinelerInGroup.some(m => 
                                    m.toLowerCase() === breakdownMakAd.toLowerCase()
                                );
                                // Üst makine kontrolü
                                const isUpperMachine = breakdownMakAd.toLowerCase() === selectedUstMakineGrubu.toLowerCase();
                                return isSubMachine || isUpperMachine;
                            });
                        }
                        
                        // 4. selectedMachine kontrolü - alt makinelere veya üst makineye tanımlı mı?
                        const selectedMachineInGroup = item.selectedMachine && (
                            makinelerInGroup.some(m => 
                                m.toLowerCase() === item.selectedMachine.toLowerCase()
                            ) || item.selectedMachine.toLowerCase() === selectedUstMakineGrubu.toLowerCase()
                        );
                        
                        ustMakineGrubuMatch = mainMachineInGroup || mainMachineIsUpper || breakdownMachineInGroup || selectedMachineInGroup;
                    } else {
                        // Üst makine grubunda makine yoksa eşleşme yok
                        ustMakineGrubuMatch = false;
                    }
                } else {
                    // Mapping'de bölüm yoksa üst makine grubu filtresini görmezden gel
                    ustMakineGrubuMatch = true;
                }
            }
            
            // Makine filtresi
            let makinaMatch = true;
            if (this.filters.makina) {
                const selectedMachine = this.filters.makina;
                // Ana kayıt makine kontrolü
                const mainMachineMatch = item.makAd === selectedMachine;
                // Breakdown'lardaki makine kontrolü
                let breakdownMachineMatch = false;
                if (item.breakdowns && item.breakdowns.length > 0) {
                    breakdownMachineMatch = item.breakdowns.some(breakdown => {
                        const breakdownMakAd = breakdown.makAd || breakdown.selectedMachine;
                        return breakdownMakAd && breakdownMakAd.toLowerCase() === selectedMachine.toLowerCase();
                    });
                }
                // selectedMachine kontrolü
                const selectedMachineMatch = item.selectedMachine && 
                    item.selectedMachine.toLowerCase() === selectedMachine.toLowerCase();
                
                makinaMatch = mainMachineMatch || breakdownMachineMatch || selectedMachineMatch;
            }
            
            const firmaMatch = !this.filters.firma || item.firmaAdi === this.filters.firma;
			const malzemeMatch = !this.filters.malzeme || this.filters.malzeme.length === 0 || this.filters.malzeme.includes(item.imalatTuru);
            const durumMatch = !this.filters.durum || (Array.isArray(this.filters.durum) ? this.filters.durum.includes(item.durum) : item.durum === this.filters.durum);
            
            // Chart tarih filtresi - aktifse öncelikli
            let chartTarihMatch = true;
            if (this.chartDateFilter.enabled && this.chartDateFilter.startDate && this.chartDateFilter.endDate) {
                const normalizeDate = (dateStr) => {
                    if (!dateStr) return null;
                    // Date objesi ise
                    if (dateStr instanceof Date) {
                        const year = dateStr.getFullYear();
                        const month = String(dateStr.getMonth() + 1).padStart(2, '0');
                        const day = String(dateStr.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    }
                    // String ise
                    if (typeof dateStr === 'string') {
                        // T veya boşluk ile ayrılmış tarih kısmını al
                        let datePart = dateStr;
                        if (dateStr.includes('T')) {
                            datePart = dateStr.split('T')[0];
                        } else if (dateStr.includes(' ')) {
                            datePart = dateStr.split(' ')[0];
                        }
                        // DD.MM.YYYY formatından YYYY-MM-DD formatına çevir
                        if (datePart.includes('.')) {
                            const parts = datePart.split('.');
                            if (parts.length === 3) {
                                return `${parts[2]}-${parts[1]}-${parts[0]}`;
                            }
                        }
                        return datePart;
                    }
                    return null;
                };
                
                const filterStartDate = this.chartDateFilter.startDate;
                const filterEndDate = this.chartDateFilter.endDate;
                
                const checkDate = (dateStr) => {
                    const normalizedDate = normalizeDate(dateStr);
                    if (!normalizedDate) return false;
                    return normalizedDate >= filterStartDate && normalizedDate <= filterEndDate;
                };
                
                if (item.planlananTarih) {
                    chartTarihMatch = checkDate(item.planlananTarih);
                } else if (item.breakdowns && item.breakdowns.length > 0) {
                    chartTarihMatch = item.breakdowns.some(b => b.planTarihi && checkDate(b.planTarihi));
                } else {
                    chartTarihMatch = false;
                }
            }
            
            // Tarih filtresi - planlanan tarih aralığında mı kontrol et
            let tarihMatch = true;
            if (!this.chartDateFilter.enabled && this.dateRange.startDate && this.dateRange.endDate) {
                // Ana kayıt planlanan tarihi kontrol et
                if (item.planlananTarih) {
                    const planlananTarih = new Date(item.planlananTarih);
                    const baslangicTarih = new Date(this.dateRange.startDate);
                    const bitisTarih = new Date(this.dateRange.endDate);
                    baslangicTarih.setHours(0, 0, 0, 0);
                    bitisTarih.setHours(23, 59, 59, 999);
                    planlananTarih.setHours(0, 0, 0, 0);
                    tarihMatch = planlananTarih >= baslangicTarih && planlananTarih <= bitisTarih;
                } else {
                    // Ana kayıtta planlanan tarih yoksa, breakdown'larda ara
                    if (item.breakdowns && item.breakdowns.length > 0) {
                        tarihMatch = item.breakdowns.some(breakdown => {
                            if (breakdown.planTarihi) {
                                const breakdownTarih = new Date(breakdown.planTarihi);
                                const baslangicTarih = new Date(this.dateRange.startDate);
                                const bitisTarih = new Date(this.dateRange.endDate);
                                baslangicTarih.setHours(0, 0, 0, 0);
                                bitisTarih.setHours(23, 59, 59, 999);
                                breakdownTarih.setHours(0, 0, 0, 0);
                                return breakdownTarih >= baslangicTarih && breakdownTarih <= bitisTarih;
                            }
                            return false;
                        });
                    } else {
                        tarihMatch = false; // Planlanan tarih yoksa filtreleme dışında bırak
                    }
                }
            }
            
            // Arama mantığı - tüm metin alanlarında arama yap
            let searchMatch = true;
            if (this.filters.search) {
                const searchTerm = this.filters.search;
                searchMatch = (
                    this.safeStringSearch(item.isemriNo, searchTerm) ||
                    this.safeStringSearch(item.malhizKodu, searchTerm) ||
                    this.safeStringSearch(item.malhizAdi, searchTerm) ||
                    this.safeStringSearch(item.imalatTuru, searchTerm) ||
                    this.safeStringSearch(item.makAd, searchTerm) ||
                    this.safeStringSearch(item.bolumAdi, searchTerm) ||
                    this.safeStringSearch(item.firmaAdi, searchTerm) ||
                    this.safeStringSearch(item.selectedMachine, searchTerm) ||
                    // Kırılım satırlarında da makine bilgisini ara
                    (item.breakdowns && item.breakdowns.some(breakdown => 
                        this.safeStringSearch(breakdown.makAd, searchTerm)
                    )) ||
                    this.safeStringSearch(item.durum, searchTerm)
                );
            }
            
            return bolumMatch && ustMakineGrubuMatch && makinaMatch && firmaMatch && malzemeMatch && durumMatch && chartTarihMatch && tarihMatch && searchMatch;
        });
        
        this.updateGrid();
        this.onDataFiltered(this.filteredData);
    }
    /**
     * Grid'i günceller
     */
    updateGrid() {
        const gridBody = document.getElementById('gridBody');
        if (!gridBody) return;
        
        gridBody.innerHTML = '';
        this.filteredData.forEach((item, index) => {
            // Ana satır - createRow fonksiyonu tüm sütunları doğru sırada oluşturuyor
            const mainRow = this.createRow(item, index);
            
            // Kırılım kontrolü
            const hasBreakdowns = (item.breakdowns && item.breakdowns.length > 0) || item.durum === 'Kısmi Planlandı';
            
            // Event listener'ları ekle
            mainRow.addEventListener('click', async (e) => {
                // Açıklama hücresine tıklandıysa satır seçimini yapma
                if (e.target.closest('.editable-aciklama')) {
                    return;
                }
                await this.selectRow(index, item);
            });
            
            // Sağ tıklama event'i ekle
            mainRow.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, item);
            });
            
            gridBody.appendChild(mainRow);
            
            // Kırılım satırlarını ekle (planlanan breakdown'lar veya bekleyen miktar varsa)
            const siparisMiktar = item.siparisMiktarHesaplanan || 0;
            const totalPlanned = (item.breakdowns || [])
                .filter(b => b.durum === 'Planlandı')
                .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
            const totalWaiting = Math.max(0, siparisMiktar - totalPlanned);
            
            if (hasBreakdowns || totalWaiting > 0) {
                this.appendBreakdownRows(gridBody, item);
            }
        });
        
        // Sütun başlıklarını columnOrder sırasına göre yeniden düzenle
        this.createColumnHeaders();
        
        // Sütun görünürlüğü ayarlarını uygula
        this.applyColumnVisibilitySettings();
        
        // Sütun başlıklarına sağ tıklama event'lerini tekrar ekle (yeni tablo için)
        this.setupColumnVisibility();
        
        // Footer istatistiklerini güncelle
        this.updateFilterStats();
        
        // Tümünü seç checkbox'ını güncelle
        this.updateSelectAllCheckbox();
    }
    
    /**
     * Durum filtresi display'ini günceller (malzeme filtresi ile aynı mantık)
     */
    updateDurumControlDisplay() {
        const durumPlaceholder = document.getElementById('durumPlaceholder');
        const durumValues = document.getElementById('durumValues');
        const durumList = document.getElementById('durumList');
        if (!durumPlaceholder || !durumValues || !durumList) return;
        
        const selected = Array.from(durumList.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
        
        if (selected.length === 0) {
            durumPlaceholder.style.display = 'inline';
            durumValues.textContent = '';
        } else {
            durumPlaceholder.style.display = 'none';
            if (selected.length === 1) {
                durumValues.textContent = selected[0];
            } else {
                durumValues.textContent = `${selected.length} seçili`;
            }
        }
    }
    
    /**
     * Tek bir satır oluşturur
     * @param {Object} item - Satır verisi
     * @param {number} index - Satır index'i
     * @returns {HTMLElement} Oluşturulan satır elementi
     */
    createRow(item, index) {
        const mainRow = document.createElement('tr');
        
        // Açıklama alanını belirle: önce item.aciklama, yoksa breakdown'lardan al
        let displayAciklama = item.aciklama;
        if (!displayAciklama && item.breakdowns && item.breakdowns.length > 0) {
            // Planlandı breakdown'dan açıklama al, yoksa herhangi bir breakdown'dan
            const plannedBreakdown = item.breakdowns.find(b => b.durum === 'Planlandı');
            displayAciklama = plannedBreakdown?.aciklama || item.breakdowns.find(b => b.aciklama)?.aciklama || null;
        }
        
        // data-isemri-id attribute'unu ekle (sadece değişen satırları güncellemek için)
        mainRow.setAttribute('data-isemri-id', item.isemriId);
        
        const hasBreakdowns = (item.breakdowns && item.breakdowns.length > 0) || item.durum === 'Kısmi Planlandı';
        const isPartialPlanned = item.durum === 'Kısmi Planlandı';
        
        // Hesaplamalar: toplam planlanan (kırılımlardan) ve durum
        const computePlannedSum = (it) => {
            if (Array.isArray(it?.breakdowns)) {
                return it.breakdowns
                    .filter(b => (b.durum || '').toLowerCase() === 'planlandı')
                    .reduce((s, b) => s + (Number(b.planlananMiktar) || 0), 0);
            }
            if (typeof it?.totalPlanned === 'number') return Number(it.totalPlanned) || 0;
            return Number(it?.planlananMiktar) || 0;
        };
        const totalPlannedComputed = computePlannedSum(item);
        const orderQtyComputed = Number(item.siparisMiktarHesaplanan || 0);
        const totalRealizedComputed = Number(item.gercekMiktar || 0);
        
        // Tamamlanma kontrolü: Gerçekleşme miktarı planlanan miktara eşit veya büyük mü?
        const isTamamlandi = totalPlannedComputed > 0 && totalRealizedComputed >= totalPlannedComputed;
        
        // Gecikme kontrolü: Planlanan tarih geçmiş mi ve tamamlanmamış mı?
        const planlananTarih = item.planlananTarih ? new Date(item.planlananTarih) : null;
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0); // Sadece tarih karşılaştırması için saat bilgilerini sıfırla
        
        const isGecikmeli = planlananTarih && 
            planlananTarih < bugun && 
            !isTamamlandi &&
            totalRealizedComputed < totalPlannedComputed;
        
        let computedStatus = 'Beklemede';
        if (isTamamlandi) {
            computedStatus = 'Tamamlandı';
        } else if (isGecikmeli) {
            computedStatus = 'Gecikti';
        } else if (totalPlannedComputed > 0 && orderQtyComputed > 0) {
            computedStatus = totalPlannedComputed < orderQtyComputed ? 'Kısmi Planlandı' : 'Planlandı';
        } else if (totalPlannedComputed > 0 && orderQtyComputed === 0) {
            computedStatus = 'Planlandı';
        }
        
        // item.durum'u hesaplanan durumla güncelle (filtreleme için)
        item.durum = computedStatus;

        // Planlanan iş emirleri için CSS class ekle (normalize ederek)
        const durumText = computedStatus;
        const normDurum = durumText
            .toLowerCase()
            .replace(/\s+/g,'-')
            .replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g')
            .replace(/ç/g,'c').replace(/ö/g,'o').replace(/ü/g,'u');
        
        // Tamamlanma kontrolü - en yüksek öncelik
        if (isTamamlandi) {
            mainRow.classList.add('tamamlandi');
        } else if (isGecikmeli) {
            // Gecikme kontrolü - tamamlanma sonrası ikinci öncelik
            mainRow.classList.add('gecikti');
        } else if (normDurum === 'planlandi' || normDurum === 'kismi-planlandi') {
            mainRow.classList.add('planned');
        }
        if (normDurum === 'kismi-planlandi') {
            mainRow.classList.add('kısmi-planlandı'); // Türkçe
            mainRow.classList.add('kismi-planlandi'); // ASCII
        }
            
        // Ek koruma: miktarlardan kısmi planlama tespiti (gecikmeli veya tamamlanmış değilse)
        if (!isGecikmeli && !isTamamlandi && orderQtyComputed > 0 && totalPlannedComputed > 0 && totalPlannedComputed < orderQtyComputed) {
            mainRow.classList.add('planned');
            mainRow.classList.add('kısmi-planlandı');
            mainRow.classList.add('kismi-planlandi');
        }

        // Tüm aşamaların planlanmış olup olmadığını kontrol et
        const allStagesPlanned = this.checkAllStagesPlanned(item);
        if (allStagesPlanned) {
            mainRow.classList.add('all-stages-planned');
        }
        
        // Ağırlık ve süre hesaplama: Planlanan miktar varsa orantılı, yoksa orijinal değerler
        const siparisMiktar = item.siparisMiktarHesaplanan || 1;
        const orijinalAgirlik = item.degerKk || 0; // Sipariş miktarı için orijinal ağırlık
        const orijinalSure = item.degerDk || 0; // Sipariş miktarı için orijinal süre
        
        // Planlanan miktarı belirle: Kırılım varsa toplam planlanan, yoksa direkt planlanan miktar
        // Eğer kırılım yoksa ve item.planlananMiktar varsa onu kullan (ana satır planlanmışsa)
        const planlananMiktar = totalPlannedComputed > 0 
            ? totalPlannedComputed 
            : (item.planlananMiktar || 0);
        
        let gosterilecekAgirlik, gosterilecekSure;
        if (planlananMiktar > 0 && siparisMiktar > 0) {
            // Planlanan miktar varsa: birim değerleri hesapla ve planlanan miktarla çarp
            // Bu şekilde eski kayıtlar için de doğru çalışır (planlanan miktar sipariş miktarından farklı olsa bile)
            const birimAgirlik = orijinalAgirlik / siparisMiktar; // Birim ağırlık (KG/adet)
            const birimSure = orijinalSure / siparisMiktar; // Birim süre (saat/adet)
            
            gosterilecekAgirlik = birimAgirlik * planlananMiktar;
            gosterilecekSure = birimSure * planlananMiktar;
        } else {
            // Planlanan miktar yoksa: orijinal değerleri göster
            gosterilecekAgirlik = orijinalAgirlik;
            gosterilecekSure = orijinalSure;
        }
        
        // Sütun içeriklerini oluştur (columnOrder sırasına göre)
        const createCellContent = (columnKey) => {
            const normDurum = computedStatus.toLowerCase().replace(/\s+/g,'-').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ç/g,'c').replace(/ö/g,'o').replace(/ü/g,'u');
            const statusBadge = `<span class="status-badge ${normDurum}">${computedStatus}</span>`;
            const expandIcon = hasBreakdowns ? `<span class="expand-icon ${allStagesPlanned ? 'all-stages-planned-icon' : ''}" onclick="dataGrid.toggleBreakdown(${index})" title="${allStagesPlanned ? 'Tüm aşamalar planlanmış demektir' : 'Kırılımları aç/kapat'}">▼</span>` : '';
            const machineInfo = !hasBreakdowns && this.isMacaBolumu(item) && item.selectedMachine ? `<div class="machine-info">${item.selectedMachine}</div>` : '';
            
            // Brüt ağırlık hesaplama
            const birimBrutAgirlik = item.brutAgirlik ? (item.brutAgirlik / (item.degerAdet || item.planMiktar || 1)) : 0;
            const brutAgirlik = planlananMiktar > 0 && siparisMiktar > 0 
                ? (birimBrutAgirlik * planlananMiktar) 
                : (item.brutAgirlik || 0);
            const brutAgirlikText = brutAgirlik > 0 ? brutAgirlik.toFixed(1) : '-';
            
            switch(columnKey) {
                case 'durum':
                    return hasBreakdowns 
                        ? `${statusBadge}${expandIcon}`
                        : `${statusBadge}${machineInfo}`;
                case 'isemriNo':
                    return item.isemriNo || '';
                case 'malhizKodu':
                    return item.malhizKodu || '';
                case 'imalatTuru':
                    return item.imalatTuru || '';
                case 'makAd':
                    return item.makAd || '-';
                case 'tarih':
                    return `<span class="editable-date" onclick="dataGrid.editDate(${item.id}, '${item.tarih}')" title="Tarihi düzenlemek için tıklayın">${this.formatDateTR(item.tarih)}</span>`;
                case 'agirlik':
                    return gosterilecekAgirlik > 0 ? gosterilecekAgirlik.toFixed(1) : '-';
                case 'brutAgirlik':
                    return brutAgirlikText;
                case 'toplamSure':
                    return gosterilecekSure.toFixed(2);
                case 'planMiktar':
                    return Math.ceil(item.degerAdet || 0);
                case 'sevkMiktari':
                    return item.SEVK_MIKTARI || item.sevkMiktari || 0;
                case 'bakiyeMiktar':
                    const siparisMiktarHesaplanan = item.siparisMiktarHesaplanan || 0;
                    const sevkMiktari = item.SEVK_MIKTARI || item.sevkMiktari || 0;
                    return Math.max(0, siparisMiktarHesaplanan - sevkMiktari); // Negatif değerleri önlemek için
                case 'figurSayisi':
                    return item.figurSayisi || 0;
                case 'siparisMiktarHesaplanan':
                    return item.siparisMiktarHesaplanan || 0;
                case 'gercekMiktar':
                    return item.gercekMiktar || 0;
                case 'planlananMiktar':
                    return totalPlannedComputed;
                case 'planlananTarih':
                    return this.formatDateTR(item.planlananTarih);
                case 'onerilenTeslimTarih':
                    return this.formatDateTR(item.onerilenTeslimTarih);
                case 'firmaAdi':
                    const firmaAdi = item.firmaAdi || '';
                    const firmaAdiEscaped = String(firmaAdi).replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    const firmaAdiShort = firmaAdi.length > 30 ? firmaAdi.substring(0, 30) + '...' : firmaAdi;
                    return firmaAdi ? `<span class="firma-cell-text" title="${firmaAdiEscaped}">${firmaAdiShort}</span>` : '-';
                case 'aciklama':
                    const escapedAciklama = String(displayAciklama || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ').replace(/\r/g, '');
                    return `<span class="editable-aciklama" data-isemri-id="${item.isemriId}" style="border: 1px solid #ddd !important;" onclick="event.stopPropagation(); event.preventDefault(); event.stopImmediatePropagation(); dataGrid.editAciklama(${item.isemriId}, '${escapedAciklama}')" title="Açıklamayı düzenlemek için tıklayın">${displayAciklama && String(displayAciklama).trim() ? String(displayAciklama).substring(0, 50) + (String(displayAciklama).length > 50 ? '...' : '') : '-'}</span>`;
                default:
                    return '';
            }
        };
        
        // İlk sütun olarak checkbox ekle
        const checkboxTd = document.createElement('td');
        checkboxTd.style.width = '40px';
        checkboxTd.style.textAlign = 'center';
        
        // Planlanmamış işler için checkbox göster (sadece "Beklemede" durumundaki işler için)
        // Planlanmış işler için de checkbox göster (taşıma işlemi için)
        const isUnplanned = item.durum === 'Beklemede';
        
        if (isUnplanned) {
            // Planlanmamış işler için checkbox (planId yok, sadece isemriId kullanılacak)
            const isChecked = this.selectedRows.has(`unplanned_${item.isemriId}`);
            checkboxTd.innerHTML = `
                <input type="checkbox" class="row-checkbox unplanned-checkbox" 
                       data-isemri-id="${item.isemriId}"
                       data-unplanned="true"
                       ${isChecked ? 'checked' : ''}
                       onclick="event.stopPropagation(); dataGrid.toggleUnplannedRowSelection(${item.isemriId}, this.checked)">
            `;
        } else {
            // Planlanmış işler için checkbox (mevcut mantık)
            // PlanId'yi bul (breakdown'lardan veya direkt item'dan)
            let planId = null;
            if (item.breakdowns && item.breakdowns.length > 0) {
                // Planlandı breakdown'dan planId al
                const plannedBreakdown = item.breakdowns.find(b => b.durum === 'Planlandı' && b.planId);
                if (plannedBreakdown) {
                    planId = plannedBreakdown.planId;
                } else if (item.breakdowns.length > 0 && item.breakdowns[0].planId) {
                    planId = item.breakdowns[0].planId;
                }
            } else if (item.planId) {
                planId = item.planId;
            }
            
            // PlanId'yi string'e çevir (Set karşılaştırması için)
            const planIdStr = planId ? String(planId) : null;
            const isChecked = planIdStr && this.selectedRows.has(planIdStr);
            const planIdForOnclick = planId ? planId : 'null';
            checkboxTd.innerHTML = `
                <input type="checkbox" class="row-checkbox" 
                       data-plan-id="${planId || ''}" 
                       data-isemri-id="${item.isemriId}"
                       ${isChecked ? 'checked' : ''}
                       onclick="event.stopPropagation(); dataGrid.toggleRowSelection(${item.isemriId}, ${planIdForOnclick}, this.checked)">
            `;
        }
        mainRow.appendChild(checkboxTd);
        
        // columnOrder sırasına göre td'leri oluştur
        // columnOrder yoksa veya boşsa varsayılan sırayı kullan
        const orderToUse = (this.columnOrder && this.columnOrder.length > 0) 
            ? this.columnOrder 
            : ['durum', 'isemriNo', 'malhizKodu', 'imalatTuru', 'makAd', 'tarih', 'agirlik', 'brutAgirlik', 'toplamSure', 'planMiktar', 'figurSayisi', 'siparisMiktarHesaplanan', 'sevkMiktari', 'bakiyeMiktar', 'gercekMiktar', 'planlananMiktar', 'planlananTarih', 'onerilenTeslimTarih', 'firmaAdi', 'aciklama'];
        
        orderToUse.forEach(columnKey => {
            const td = document.createElement('td');
            td.setAttribute('data-column', columnKey);
            
            // Özel class'lar ekle
            if (columnKey === 'tarih') {
                td.className = 'editable-date';
            } else if (columnKey === 'aciklama') {
                td.className = 'editable-aciklama';
            }
            
            td.innerHTML = createCellContent(columnKey);
            mainRow.appendChild(td);
        });
        
        if (hasBreakdowns) {
            mainRow.classList.add('expandable');
        }
        
        return mainRow;
    }
    
    /**
     * Kırılım satırlarını ekler
     * @param {HTMLElement} gridBody - Grid body elementi
     * @param {Object} item - İş emri verisi
     */
    appendBreakdownRows(gridBody, item) {
        // Planlanan breakdown'ları göster (veritabanından gelen)
                if (item.breakdowns && item.breakdowns.length > 0) {
                    item.breakdowns.forEach((breakdown, breakdownIndex) => {
                const breakdownRow = this.createBreakdownRow(item, breakdown);
                        gridBody.appendChild(breakdownRow);
                    });
        }
        
        // Bekleyen kırılımı dinamik olarak hesapla ve göster (sadece bekleyen miktar > 0 ise)
        const siparisMiktar = item.siparisMiktarHesaplanan || 0;
        const totalPlanned = (item.breakdowns || [])
            .filter(b => b.durum === 'Planlandı')
            .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
        const totalWaiting = Math.max(0, siparisMiktar - totalPlanned);
        
        // Bekleyen miktar varsa bekleyen kırılımı göster
        if (totalWaiting > 0) {
            const waitingBreakdown = {
                planId: null,
                parcaNo: (item.breakdowns || []).length + 1,
                planTarihi: null,
                planlananMiktar: totalWaiting,
                durum: 'Beklemede',
                makAd: item.makAd || null,
                selectedMachine: item.selectedMachine || null
            };
            const waitingBreakdownRow = this.createBreakdownRow(item, waitingBreakdown);
                    gridBody.appendChild(waitingBreakdownRow);
                }
            }
    
    /**
     * Sadece belirli satırları günceller (performans optimizasyonu)
     * @param {Array} updatedIsemriIds - Güncellenen kayıtların isemriId'leri
     */
    updateGridRows(updatedIsemriIds) {
        if (!updatedIsemriIds || updatedIsemriIds.length === 0) return;
        
        const gridBody = document.getElementById('gridBody');
        if (!gridBody) return;
        
        // Sadece değişen satırları güncelle
        updatedIsemriIds.forEach(isemriId => {
            // Filtrelenmiş veride kaydı bul
            const filteredIndex = this.filteredData.findIndex(item => item.isemriId === isemriId);
            if (filteredIndex === -1) return; // Filtrelenmiş veride yoksa atla
            
            const item = this.filteredData[filteredIndex];
            
            // Mevcut satırı bul (data-isemri-id attribute'u ile)
            const existingRow = gridBody.querySelector(`tr[data-isemri-id="${isemriId}"]`);
            if (existingRow) {
                // Mevcut satırı güncelle
                this.updateSingleRow(existingRow, item, filteredIndex);
            }
            // Eğer satır yoksa ve filtrelenmiş veride görünmesi gerekiyorsa, 
            // bu durumda filtreler değişmiş olabilir, o zaman tüm grid'i güncelle
            // Ama genellikle satır zaten var, sadece güncellenmesi gerekiyor
        });
        
        // Footer istatistiklerini güncelle
        this.updateFilterStats();
    }
    
    /**
     * Tek bir satırı günceller
     * @param {HTMLElement} row - Güncellenecek satır elementi
     * @param {Object} item - Güncel veri
     * @param {number} index - Satır index'i
     */
    updateSingleRow(row, item, index) {
        const gridBody = document.getElementById('gridBody');
        if (!gridBody) return;
        
        // Eski breakdown satırlarını kaldır (önce bunları kaldır ki index doğru kalsın)
        const oldBreakdownRows = gridBody.querySelectorAll(`tr.breakdown-row[data-parent-isemri-id="${item.isemriId}"]`);
        oldBreakdownRows.forEach(br => br.remove());
        
        // Ana satırı yeniden render et
        const newRow = this.createRow(item, index);
        
        // Event listener'ları ekle
        newRow.addEventListener('click', async (e) => {
            // Açıklama hücresine tıklandıysa satır seçimini yapma
            if (e.target.closest('.editable-aciklama')) {
                return;
            }
            await this.selectRow(index, item);
        });
        
        // Sağ tıklama event'i ekle
        newRow.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, item);
        });
        
        // Ana satırı değiştir
        row.replaceWith(newRow);
        
        // Yeni breakdown satırlarını ana satırın hemen sonrasına ekle
        const siparisMiktar = item.siparisMiktarHesaplanan || 0;
        const totalPlanned = (item.breakdowns || [])
            .filter(b => b.durum === 'Planlandı')
            .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
        const totalWaiting = Math.max(0, siparisMiktar - totalPlanned);
        const hasBreakdowns = (item.breakdowns && item.breakdowns.length > 0) || totalWaiting > 0;
        
        if (hasBreakdowns) {
            // Ana satırın hemen sonrasına breakdown satırlarını ekle
            const nextSibling = newRow.nextSibling;
            
            // Planlanan breakdown'ları ekle
                if (item.breakdowns && item.breakdowns.length > 0) {
                    item.breakdowns.forEach((breakdown) => {
                        const breakdownRow = this.createBreakdownRow(item, breakdown);
                    if (nextSibling && !nextSibling.classList.contains('breakdown-row')) {
                        nextSibling.parentNode.insertBefore(breakdownRow, nextSibling);
            } else {
                        newRow.parentNode.insertBefore(breakdownRow, newRow.nextSibling);
                    }
                });
            }
            
            // Bekleyen kırılımı ekle (varsa)
            if (totalWaiting > 0) {
                const waitingBreakdown = {
                    planId: null,
                    parcaNo: (item.breakdowns || []).length + 1,
                    planTarihi: null,
                    planlananMiktar: totalWaiting,
                    durum: 'Beklemede',
                    makAd: item.makAd || null,
                    selectedMachine: item.selectedMachine || null
                };
                const waitingBreakdownRow = this.createBreakdownRow(item, waitingBreakdown);
                if (nextSibling && !nextSibling.classList.contains('breakdown-row')) {
                    nextSibling.parentNode.insertBefore(waitingBreakdownRow, nextSibling);
                } else {
                    newRow.parentNode.insertBefore(waitingBreakdownRow, newRow.nextSibling);
                }
            }
        }
        
        // Expand icon'un onclick event'ini düzelt (inline onclick yerine event listener kullan)
        const expandIcon = newRow.querySelector('.expand-icon');
        if (expandIcon) {
            // Eski onclick'i kaldır
            expandIcon.removeAttribute('onclick');
            // Yeni event listener ekle
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleBreakdown(index);
            });
        }
    }
    
    /**
     * Kırılım satırlarını bir DocumentFragment'e ekler
     * @param {DocumentFragment} fragment - Fragment elementi
     * @param {Object} item - İş emri verisi
     */
    appendBreakdownRowsToFragment(fragment, item) {
        // Planlanan breakdown'ları göster (veritabanından gelen)
        if (item.breakdowns && item.breakdowns.length > 0) {
            item.breakdowns.forEach((breakdown, breakdownIndex) => {
                const breakdownRow = this.createBreakdownRow(item, breakdown);
                fragment.appendChild(breakdownRow);
            });
        }
        
        // Bekleyen kırılımı dinamik olarak hesapla ve göster (sadece bekleyen miktar > 0 ise)
        const siparisMiktar = item.siparisMiktarHesaplanan || 0;
        const totalPlanned = (item.breakdowns || [])
            .filter(b => b.durum === 'Planlandı')
            .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
        const totalWaiting = Math.max(0, siparisMiktar - totalPlanned);
        
        // Bekleyen miktar varsa bekleyen kırılımı göster
        if (totalWaiting > 0) {
            const waitingBreakdown = {
                planId: null,
                parcaNo: (item.breakdowns || []).length + 1,
                planTarihi: null,
                planlananMiktar: totalWaiting,
                durum: 'Beklemede',
                makAd: item.makAd || null,
                selectedMachine: item.selectedMachine || null
            };
            const waitingBreakdownRow = this.createBreakdownRow(item, waitingBreakdown);
            fragment.appendChild(waitingBreakdownRow);
        }
    }
    
    /**
     * Tek bir breakdown satırı oluşturur
     * @param {Object} item - İş emri verisi
     * @param {Object} breakdown - Breakdown verisi
     * @returns {HTMLElement} Breakdown satır elementi
     */
    createBreakdownRow(item, breakdown) {
        const breakdownRow = document.createElement('tr');
        breakdownRow.classList.add('breakdown-row');
        breakdownRow.style.display = 'none';
        breakdownRow.setAttribute('data-parent-isemri-id', item.isemriId);
        
        // Checkbox ekle (normal satırlarla aynı)
        const checkboxTd = document.createElement('td');
        checkboxTd.style.width = '40px';
        checkboxTd.style.textAlign = 'center';
        checkboxTd.className = 'breakdown-cell';
        
        // Kırılım için planId bul
        const planId = breakdown.planId || null;
        const planIdStr = planId ? String(planId) : null;
        const isChecked = planIdStr && this.selectedRows.has(planIdStr);
        const planIdForOnclick = planId ? planId : 'null';
        
        checkboxTd.innerHTML = `
            <input type="checkbox" class="row-checkbox breakdown-checkbox" 
                   data-plan-id="${planId || ''}" 
                   data-isemri-id="${item.isemriId}"
                   ${isChecked ? 'checked' : ''}
                   onclick="event.stopPropagation(); dataGrid.toggleRowSelection(${item.isemriId}, ${planIdForOnclick}, this.checked)">
        `;
        breakdownRow.appendChild(checkboxTd);
        
        // Kırılıma göre ağırlık ve süre hesapları
        // Birim değerleri hesaplamak için sipariş miktarını kullan (planlanan miktar değil)
        const siparisMiktar = item.siparisMiktarHesaplanan || 1;
        const birimAgirlik = (item.degerKk || 0) / siparisMiktar; // Birim ağırlık (KG/adet)
        const birimBrutAgirlik = (item.brutAgirlik || 0) / siparisMiktar; // Birim brüt ağırlık (KG/adet)
        const birimSure = (item.degerDk || 0) / siparisMiktar; // Birim süre (saat/adet)
        
        // Bekleyen kırılım için planlanan miktarı dinamik olarak hesapla
        let breakdownPlanlananMiktar = breakdown.planlananMiktar || 0;
        if (breakdown.durum === 'Beklemede' && breakdown.planId === null) {
            // Bekleyen kırılım: sipariş miktarı - toplam planlanan
            const totalPlanned = (item.breakdowns || [])
                .filter(b => b.durum === 'Planlandı')
                .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
            breakdownPlanlananMiktar = Math.max(0, siparisMiktar - totalPlanned);
        }
        
        const brkKg = breakdown.durum === 'Planlandı' ? (birimAgirlik * (breakdown.planlananMiktar || 0)) : 0;
        const brkBrutKg = breakdown.durum === 'Planlandı' ? (birimBrutAgirlik * (breakdown.planlananMiktar || 0)) : 0;
        const brkDk = breakdown.durum === 'Planlandı' ? (birimSure * (breakdown.planlananMiktar || 0)) : 0;
        
        // Sipariş miktarı, sevk miktarı ve bakiye miktarı hesaplamaları
        const planMiktar = Math.ceil(item.degerAdet || item.planMiktar || 0);
        const figurSayisi = item.figurSayisi || 0;
        const siparisMiktarHesaplanan = planMiktar * figurSayisi;
        const sevkMiktari = item.SEVK_MIKTARI || item.sevkMiktari || 0;
        const bakiyeMiktar = Math.max(0, siparisMiktarHesaplanan - sevkMiktari);
        
        // Kırılım satırı için hücre içeriği oluşturma fonksiyonu
        const createBreakdownCellContent = (columnKey) => {
            switch(columnKey) {
                case 'durum':
                    const normDurum = breakdown.durum.toLowerCase().replace(/\s+/g,'-').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ç/g,'c').replace(/ö/g,'o').replace(/ü/g,'u');
                    const statusBadge = `<span class="status-badge ${normDurum}">${breakdown.durum}</span>`;
                    const machineInfo = this.isMacaBolumu(item) && breakdown.makAd ? `<div class="machine-info">${breakdown.makAd}</div>` : '';
                    return `<span class="breakdown-indent">└─</span>${statusBadge}${machineInfo}`;
                case 'isemriNo':
                    return breakdown.parcaNo || '';
                case 'malhizKodu':
                    return item.malhizKodu || '';
                case 'imalatTuru':
                    return item.imalatTuru || '';
                case 'makAd':
                    return breakdown.makAd || item.makAd || '-';
                case 'tarih':
                    return item.tarih ? new Date(item.tarih).toLocaleDateString('tr-TR') : '';
                case 'agirlik':
                    return brkKg > 0 ? brkKg.toFixed(1) : '-';
                case 'brutAgirlik':
                    return brkBrutKg > 0 ? brkBrutKg.toFixed(1) : '-';
                case 'toplamSure':
                    return brkDk.toFixed(2);
                case 'planMiktar':
                    return planMiktar;
                case 'figurSayisi':
                    return item.figurSayisi || 0;
                case 'siparisMiktarHesaplanan':
                    return siparisMiktarHesaplanan;
                case 'sevkMiktari':
                    return sevkMiktari;
                case 'bakiyeMiktar':
                    return bakiyeMiktar;
                case 'gercekMiktar':
                    return breakdown.gercekMiktar !== undefined ? breakdown.gercekMiktar : (item.gercekMiktar || 0);
                    case 'planlananMiktar':
                        if (breakdown.durum === 'Planlandı') {
                            return breakdown.planlananMiktar || 0;
                        } else if (breakdown.durum === 'Beklemede') {
                            // Bekleyen kırılım için dinamik hesaplama
                            const totalPlanned = (item.breakdowns || [])
                                .filter(b => b.durum === 'Planlandı')
                                .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
                            const siparisMiktar = item.siparisMiktarHesaplanan || 0;
                            return Math.max(0, siparisMiktar - totalPlanned);
                        }
                        return '';
                case 'planlananTarih':
                    return this.formatDateTR(breakdown.planTarihi);
                case 'onerilenTeslimTarih':
                    return this.formatDateTR(item.onerilenTeslimTarih);
                case 'firmaAdi':
                    return item.firmaAdi || '';
                case 'aciklama':
                    return breakdown.aciklama && String(breakdown.aciklama).trim() ? String(breakdown.aciklama).substring(0, 50) + (String(breakdown.aciklama).length > 50 ? '...' : '') : '-';
                default:
                    return '';
            }
        };
        
        // columnOrder sırasına göre td'leri oluştur (normal satırlarla aynı sıra)
        const orderToUse = (this.columnOrder && this.columnOrder.length > 0) 
            ? this.columnOrder 
            : ['durum', 'isemriNo', 'malhizKodu', 'imalatTuru', 'makAd', 'tarih', 'agirlik', 'brutAgirlik', 'toplamSure', 'planMiktar', 'figurSayisi', 'siparisMiktarHesaplanan', 'sevkMiktari', 'bakiyeMiktar', 'gercekMiktar', 'planlananMiktar', 'planlananTarih', 'onerilenTeslimTarih', 'firmaAdi', 'aciklama'];
        
        orderToUse.forEach(columnKey => {
            const td = document.createElement('td');
            td.className = 'breakdown-cell';
            td.setAttribute('data-column', columnKey);
            td.innerHTML = createBreakdownCellContent(columnKey);
            breakdownRow.appendChild(td);
        });
        
        // Kırılım satırına tıklandığında grafiğe odaklan
        breakdownRow.addEventListener('click', async () => {
            const targetDate = breakdown.planTarihi || item.onerilenTeslimTarih;
            if (targetDate && window.chartManager) {
                // PlanId'yi bul - önce breakdown'dan, yoksa item'dan
                let planId = breakdown.planId;
                
                console.log('🔍 Breakdown satırına tıklandı - PlanId arama:', {
                    breakdownPlanId: breakdown.planId,
                    breakdownParcaNo: breakdown.parcaNo,
                    breakdownPlanTarihi: breakdown.planTarihi,
                    breakdownMakAd: breakdown.makAd,
                    breakdownDurum: breakdown.durum,
                    itemIsemriId: item.isemriId,
                    itemIsemriNo: item.isemriNo,
                    breakdownsCount: item.breakdowns ? item.breakdowns.length : 0
                });
                
                // Eğer breakdown'da planId yoksa, breakdowns array'inde ara
                if (!planId && item.breakdowns && Array.isArray(item.breakdowns)) {
                    console.log('🔍 Breakdowns array\'inde planId aranıyor:', item.breakdowns.map(b => ({
                        planId: b.planId,
                        parcaNo: b.parcaNo,
                        planTarihi: b.planTarihi,
                        makAd: b.makAd,
                        durum: b.durum
                    })));
                    
                    // Önce aynı parcaNo ile eşleşen breakdown'ı bul
                    let matchingBreakdown = item.breakdowns.find(b => 
                        b.parcaNo === breakdown.parcaNo && b.planId
                    );
                    
                    // Eğer parcaNo ile bulunamazsa, aynı planTarihi ve makAd ile eşleşen breakdown'ı bul
                    if (!matchingBreakdown) {
                        matchingBreakdown = item.breakdowns.find(b => {
                            const tarihMatch = b.planTarihi === breakdown.planTarihi;
                            const makineMatch = b.makAd === breakdown.makAd;
                            const planIdVar = b.planId;
                            const durumMatch = b.durum === 'Planlandı';
                            return tarihMatch && makineMatch && planIdVar && durumMatch;
                        });
                    }
                    
                    // Hala bulunamazsa, sadece planTarihi ve durum ile eşleşen breakdown'ı bul
                    if (!matchingBreakdown) {
                        matchingBreakdown = item.breakdowns.find(b => 
                            b.planTarihi === breakdown.planTarihi && 
                            b.planId && 
                            b.durum === 'Planlandı'
                        );
                    }
                    
                    // Hala bulunamazsa, sadece planTarihi ile eşleşen herhangi bir planId'li breakdown'ı bul
                    if (!matchingBreakdown) {
                        matchingBreakdown = item.breakdowns.find(b => 
                            b.planTarihi === breakdown.planTarihi && 
                            b.planId
                        );
                    }
                    
                    if (matchingBreakdown && matchingBreakdown.planId) {
                        planId = matchingBreakdown.planId;
                        console.log('✅ PlanId breakdowns array\'inden bulundu:', {
                            planId: planId,
                            parcaNo: breakdown.parcaNo,
                            planTarihi: breakdown.planTarihi,
                            makAd: breakdown.makAd,
                            matchingBreakdown: {
                                planId: matchingBreakdown.planId,
                                parcaNo: matchingBreakdown.parcaNo,
                                planTarihi: matchingBreakdown.planTarihi,
                                makAd: matchingBreakdown.makAd
                            }
                        });
                    } else {
                        console.warn('⚠️ PlanId breakdowns array\'inde bulunamadı:', {
                            breakdown: {
                                parcaNo: breakdown.parcaNo,
                                planTarihi: breakdown.planTarihi,
                                makAd: breakdown.makAd,
                                durum: breakdown.durum
                            },
                            allBreakdowns: item.breakdowns.map(b => ({
                                planId: b.planId,
                                parcaNo: b.parcaNo,
                                planTarihi: b.planTarihi,
                                makAd: b.makAd,
                                durum: b.durum
                            }))
                        });
                    }
                }
                
                // Hala planId yoksa ve durum "Planlandı" ise, chart'ta isemriNo ile arama yapılacak
                const week = this.getWeekFromDate(targetDate);
                // Önce haftaya odaklan (planId'yi de geçir)
                await window.chartManager.focusOnWeek(week, targetDate, item.isemriNo, planId);
                // Sonra plan ID ile segment seçimi yap
                if (typeof window.chartManager.setBreakdownSelection === 'function') {
                    window.chartManager.setBreakdownSelection({
                        isemriId: item.isemriId,
                        isemriNo: item.isemriNo,
                        planId: planId || null,
                        parcaNo: breakdown.parcaNo,
                        planlananMiktar: breakdown.durum === 'Planlandı' ? (breakdown.planlananMiktar || 0) : 0,
                        agirlik: brkKg,
                        toplamSure: brkDk,
                        planlananTarih: targetDate,
                        selectedMachine: breakdown.makAd
                    });
                }
            }
        });

        // Kırılım satırına da sağ tıklama event'i ekle
        breakdownRow.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // Kırılım için özel item oluştur (kırılıma özgü miktar ve planId)
            // ÖNEMLİ: breakdown.planId obje olabilir, bu durumda alternatif yöntem kullanılacak
            const breakdownItem = {
                ...item,
                isemriParcaNo: breakdown.parcaNo,
                parcaNo: breakdown.parcaNo, // Alternatif yöntem için de ekle
                planId: breakdown.planId,
                breakdownPlanId: breakdown.planId, // Geri çekme için breakdownPlanId set et
                // Beklemede ise bu kırılımın bekleyen miktarı kullanıcıya varsayılan olarak gelsin (dinamik hesaplama)
                planlananMiktar: breakdown.durum === 'Beklemede' ? (() => {
                    const totalPlanned = (item.breakdowns || [])
                        .filter(b => b.durum === 'Planlandı')
                        .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
                    const siparisMiktar = item.siparisMiktarHesaplanan || 0;
                    return Math.max(0, siparisMiktar - totalPlanned);
                })() : breakdown.planlananMiktar,
                planlananTarih: breakdown.planTarihi,
                durum: breakdown.durum
            };
            
            // Kırılım item'ı oluşturuldu
            this.showContextMenu(e, breakdownItem);
        });
        
        return breakdownRow;
    }
    
    /**
     * Kısmi planlandı için breakdown satırı oluşturur
     * @param {Object} item - İş emri verisi
     * @param {boolean} isPlanned - Planlandı mı beklemede mi
     * @returns {HTMLElement} Breakdown satır elementi
     */
    createPartialBreakdownRow(item, isPlanned) {
        const breakdownRow = document.createElement('tr');
        breakdownRow.classList.add('breakdown-row');
        breakdownRow.style.display = 'none';
        breakdownRow.setAttribute('data-parent-isemri-id', item.isemriId);
        
        // Checkbox ekle
        const checkboxTd = document.createElement('td');
        checkboxTd.style.width = '40px';
        checkboxTd.style.textAlign = 'center';
        checkboxTd.className = 'breakdown-cell';
        
        let planId = null;
        if (isPlanned) {
            if (item.breakdowns && item.breakdowns.length > 0) {
                const plannedBreakdown = item.breakdowns.find(b => b.durum === 'Planlandı' && b.planId);
                if (plannedBreakdown) planId = plannedBreakdown.planId;
            } else if (item.planId) {
                planId = item.planId;
            }
        }
        
        const planIdStr = planId ? String(planId) : null;
        const isChecked = planIdStr && this.selectedRows.has(planIdStr);
        const planIdForOnclick = planId ? planId : 'null';
        
        checkboxTd.innerHTML = `
            <input type="checkbox" class="row-checkbox breakdown-checkbox" 
                   data-plan-id="${planId || ''}" 
                   data-isemri-id="${item.isemriId}"
                   ${isChecked ? 'checked' : ''}
                   onclick="event.stopPropagation(); dataGrid.toggleRowSelection(${item.isemriId}, ${planIdForOnclick}, this.checked)">
        `;
        breakdownRow.appendChild(checkboxTd);
        
        // Sipariş miktarı, sevk miktarı ve bakiye miktarı hesaplamaları
        const planMiktar = Math.ceil(item.degerAdet || item.planMiktar || 0);
        const siparisMiktarHesaplanan = item.siparisMiktarHesaplanan || 0;
        const sevkMiktari = item.SEVK_MIKTARI || item.sevkMiktari || 0;
        const bakiyeMiktar = Math.max(0, siparisMiktarHesaplanan - sevkMiktari);
        
        // Kırılım satırı için hücre içeriği oluşturma fonksiyonu
        const createPartialBreakdownCellContent = (columnKey) => {
            switch(columnKey) {
                case 'durum':
                    const status = isPlanned ? 'Planlandı' : 'Beklemede';
                    const normDurum = status.toLowerCase().replace(/\s+/g,'-').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ç/g,'c').replace(/ö/g,'o').replace(/ü/g,'u');
                    return `<span class="breakdown-indent">└─</span><span class="status-badge ${normDurum}">${status}</span>`;
                case 'isemriNo':
                    return isPlanned ? '1' : '2';
                case 'malhizKodu':
                    return item.malhizKodu || '';
                case 'imalatTuru':
                    return item.imalatTuru || '';
                case 'makAd':
                    return item.makAd || item.selectedMachine || '-';
                case 'tarih':
                    return item.tarih ? new Date(item.tarih).toLocaleDateString('tr-TR') : '';
                case 'agirlik':
                    return (item.degerKk || 0) > 0 ? (item.degerKk || 0).toFixed(1) : '-';
                case 'brutAgirlik':
                    return (item.brutAgirlik || 0) > 0 ? (item.brutAgirlik || 0).toFixed(1) : '-';
                case 'toplamSure':
                    return (item.degerDk || 0).toFixed(2);
                case 'planMiktar':
                    return planMiktar;
                case 'figurSayisi':
                    return item.figurSayisi || 0;
                case 'siparisMiktarHesaplanan':
                    return siparisMiktarHesaplanan;
                case 'sevkMiktari':
                    return sevkMiktari;
                case 'bakiyeMiktar':
                    return bakiyeMiktar;
                case 'gercekMiktar':
                    return item.gercekMiktar || 0;
                case 'planlananMiktar':
                    if (isPlanned) {
                        // Planlanan miktar: tüm planlanan breakdown'ların toplamı
                        const totalPlanned = (item.breakdowns || [])
                            .filter(b => b.durum === 'Planlandı')
                            .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
                        return totalPlanned || 0;
                    } else {
                        // Bekleyen miktar: sipariş miktarı - toplam planlanan
                        const siparisMiktar = item.siparisMiktarHesaplanan || 0;
                        const totalPlanned = (item.breakdowns || [])
                            .filter(b => b.durum === 'Planlandı')
                            .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
                        return Math.max(0, siparisMiktar - totalPlanned);
                    }
                case 'planlananTarih':
                    return isPlanned && item.planlananTarih ? new Date(item.planlananTarih).toLocaleDateString('tr-TR') : '';
                case 'onerilenTeslimTarih':
                    return this.formatDateTR(item.onerilenTeslimTarih);
                case 'firmaAdi':
                    return item.firmaAdi || '';
                case 'aciklama':
                    return item.aciklama && String(item.aciklama).trim() ? String(item.aciklama).substring(0, 50) + (String(item.aciklama).length > 50 ? '...' : '') : '-';
                default:
                    return '';
            }
        };
        
        // columnOrder sırasına göre td'leri oluştur
        const orderToUse = (this.columnOrder && this.columnOrder.length > 0) 
            ? this.columnOrder 
            : ['durum', 'isemriNo', 'malhizKodu', 'imalatTuru', 'makAd', 'tarih', 'agirlik', 'brutAgirlik', 'toplamSure', 'planMiktar', 'figurSayisi', 'siparisMiktarHesaplanan', 'sevkMiktari', 'bakiyeMiktar', 'gercekMiktar', 'planlananMiktar', 'planlananTarih', 'onerilenTeslimTarih', 'firmaAdi', 'aciklama'];
        
        orderToUse.forEach(columnKey => {
            const td = document.createElement('td');
            td.className = 'breakdown-cell';
            td.setAttribute('data-column', columnKey);
            td.innerHTML = createPartialBreakdownCellContent(columnKey);
            breakdownRow.appendChild(td);
        });
        
        // Event listener ekle
            breakdownRow.addEventListener('click', async () => {
            const targetDate = isPlanned ? (item.planlananTarih || item.onerilenTeslimTarih) : item.onerilenTeslimTarih;
                if (targetDate && window.chartManager) {
                    const week = this.getWeekFromDate(targetDate);
                await window.chartManager.focusOnWeek(week, targetDate);
                }
            });
        
        return breakdownRow;
    }
    
    
    /**
     * Footer'daki filtre istatistiklerini günceller
     */
    updateFilterStats() {
        const statsText = document.getElementById('statsText');
        if (!statsText) return;
        
        try {
            // Tüm durum istatistiklerini hesapla
            const computePlannedSum = (it) => {
                if (Array.isArray(it?.breakdowns)) {
                    return it.breakdowns
                        .filter(b => (b.durum || '').toLowerCase() === 'planlandı')
                        .reduce((s, b) => s + (Number(b.planlananMiktar) || 0), 0);
                }
                if (typeof it?.totalPlanned === 'number') return Number(it.totalPlanned) || 0;
                return Number(it?.planlananMiktar) || 0;
            };
            
            const bekleyen = this.filteredData.filter(item => item.durum === 'Beklemede').length;
            
            const planlandi = this.filteredData.filter(item => {
                const totalPlanned = computePlannedSum(item);
                const orderQty = Number(item.siparisMiktarHesaplanan || 0);
                return totalPlanned > 0 && totalPlanned >= orderQty && orderQty > 0;
            }).length;
            
            const kismiPlanlandi = this.filteredData.filter(item => {
                const totalPlanned = computePlannedSum(item);
                const orderQty = Number(item.siparisMiktarHesaplanan || 0);
                return totalPlanned > 0 && totalPlanned < orderQty && orderQty > 0;
            }).length;
            
            const tamamlandi = this.filteredData.filter(item => {
                const totalPlanned = computePlannedSum(item);
                const totalRealized = Number(item.gercekMiktar || 0);
                return totalPlanned > 0 && totalRealized >= totalPlanned;
            }).length;
            
            const gecikti = this.filteredData.filter(item => {
                const planlananTarih = item.planlananTarih ? new Date(item.planlananTarih) : null;
                const bugun = new Date();
                bugun.setHours(0, 0, 0, 0);
                const totalPlanned = computePlannedSum(item);
                const totalRealized = Number(item.gercekMiktar || 0);
                return planlananTarih && planlananTarih < bugun && totalRealized < totalPlanned;
            }).length;
            
            // Toplam değeri hesapla
            const toplam = bekleyen + planlandi + kismiPlanlandi + tamamlandi + gecikti;
            
            // İstatistik metnini oluştur
            const statsInfo = `Beklemede: ${bekleyen} | Planlandı: ${planlandi} | Kısmi Planlandı: ${kismiPlanlandi} | Tamamlandı: ${tamamlandi} | Gecikti: ${gecikti} | Toplam: ${toplam}`;
            
            statsText.textContent = statsInfo;
        } catch (error) {
            console.error('İstatistik güncelleme hatası:', error);
            statsText.textContent = 'Hesaplanamadı';
        }
    }

    /**
     * Kırılım satırlarını açıp kapatır
     * @param {number} index - Ana satır indeksi
     */
    toggleBreakdown(index) {
        // Yalnızca ana satırlar üzerinden indeksi eşleştir
        const allRows = Array.from(document.querySelectorAll('#gridBody tr'));
        const mainRows = allRows.filter(r => !r.classList.contains('breakdown-row'));
        const mainRow = mainRows[index];
        if (!mainRow) return;

        const expandIcon = mainRow.querySelector('.expand-icon');

        // Bu ana satırdan sonraki kırılım satırlarını, bir sonraki ana satıra kadar topla
        const relevantBreakdownRows = [];
        const mainRowIndex = allRows.indexOf(mainRow);
        for (let i = mainRowIndex + 1; i < allRows.length; i++) {
            const row = allRows[i];
            if (row.classList.contains('breakdown-row')) {
                relevantBreakdownRows.push(row);
            } else {
                break; // Sonraki ana satıra gelindi
            }
        }

        const isExpanded = relevantBreakdownRows.some(row => row.style.display !== 'none');
        if (isExpanded) {
            relevantBreakdownRows.forEach(row => { row.style.display = 'none'; });
            if (expandIcon) expandIcon.textContent = '▼';
        } else {
            relevantBreakdownRows.forEach(row => { row.style.display = ''; });
            if (expandIcon) expandIcon.textContent = '▲';
        }
    }

    /**
     * Tüm kırılımları açar
     */
    expandAllBreakdowns() {
        const allRows = Array.from(document.querySelectorAll('#gridBody tr'));
        const mainRows = allRows.filter(r => !r.classList.contains('breakdown-row'));
        mainRows.forEach(mainRow => {
            const mainRowIndex = allRows.indexOf(mainRow);
            for (let i = mainRowIndex + 1; i < allRows.length; i++) {
                const row = allRows[i];
                if (!row.classList.contains('breakdown-row')) break;
                row.style.display = '';
            }
            const icon = mainRow.querySelector('.expand-icon');
            if (icon) icon.textContent = '▲';
        });
    }

    /**
     * Tüm kırılımları kapatır
     */
    collapseAllBreakdowns() {
        const breakdownRows = document.querySelectorAll('#gridBody tr.breakdown-row');
        breakdownRows.forEach(row => row.style.display = 'none');
        document.querySelectorAll('#gridBody tr .expand-icon').forEach(icon => icon.textContent = '▼');
    }

    /**
     * Satır seçer
     * @param {number} index - Satır indeksi
     * @param {Object} item - Seçilen öğe
     */
    async selectRow(index, item) {
        // Önceki seçimi kaldır
        const rows = document.querySelectorAll('#gridBody tr');
        rows.forEach(row => row.classList.remove('selected'));
        
        // Ana satırları bul (breakdown satırları hariç)
        const mainRows = Array.from(rows).filter(row => !row.classList.contains('breakdown-row'));
        
        // Yeni seçimi ekle
        if (mainRows[index]) {
            mainRows[index].classList.add('selected');
            this.selectedRowIndex = index;
            
            // Planlanan tarih varsa onu kullan, yoksa önerilen teslim tarihini kullan
            const targetDate = item.planlananTarih || item.onerilenTeslimTarih;
            const calculatedWeek = this.getWeekFromDate(targetDate);
            this.selectedWeek = calculatedWeek; // selectedWeek'i set et
            
            // ChartManager'a haftaya odaklanmasını söyle
            if (window.chartManager && calculatedWeek) {
                // İş emri numarasını al (segment seçimi için)
                const isemriNo = item.isemriNo;
                
                // Haftaya odaklan ve gün/segment seçimi yap
                await window.chartManager.focusOnWeek(calculatedWeek, targetDate, isemriNo);
            }
            
            await this.onRowSelected(item, index);
        }
    }
    /**
     * Tarih düzenleme fonksiyonu
     * @param {number} itemId - Öğe ID'si
     * @param {string} currentDate - Mevcut tarih
     */
    editDate(itemId, currentDate) {
        // Bu fonksiyon daha sonra implement edilecek
    }
    /**
     * Tarihten hafta bilgisi çıkarır (planlanan tarih varsa onu kullan, yoksa sipariş tarihini kullan)
     * @param {string} dateString - Tarih string'i
     * @returns {string} Hafta bilgisi
     */
    getWeekFromDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        date.setHours(0, 0, 0, 0);
        
        // ISO 8601 hafta numarası hesaplama
        // Tarihi kopyala
        const target = new Date(date.valueOf());
        const dayNum = (date.getDay() + 6) % 7; // Pazartesi = 0, Pazar = 6
        target.setDate(target.getDate() - dayNum + 3); // En yakın Perşembe
        const firstThursday = new Date(target.getFullYear(), 0, 4);
        const diff = target - firstThursday;
        const weekNumber = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
        const year = target.getFullYear();
        
        return `${year}-W${String(weekNumber).padStart(2, '0')}`;
    }
    /**
     * Veri filtrelendiğinde çağrılan callback
     * @param {Array} filteredData - Filtrelenmiş veri
     */
    onDataFiltered(filteredData) {
        // Bu metod alt sınıflarda override edilebilir
    }
    /**
     * İş emri numarasına göre satır seçer
     * @param {string} isemriNo - İş emri numarası
     */
    selectRowByIsemriNo(isemriNo) {
        // Önceki seçimi kaldır
        const rows = document.querySelectorAll('#gridBody tr');
        rows.forEach(row => row.classList.remove('selected'));
        
        // İlgili satırı bul ve seç - hem string hem number karşılaştırması yap
        const rowIndex = this.filteredData.findIndex(item => {
            const itemNo = item.isemriNo;
            const searchNo = isemriNo;
            // String olarak karşılaştır
            if (String(itemNo) === String(searchNo)) {
                return true;
            }
            // Number olarak karşılaştır
            if (Number(itemNo) === Number(searchNo)) {
                return true;
            }
            return false;
        });
        
        if (rowIndex !== -1) {
            // Ana satırları bul (breakdown satırları hariç)
            const mainRows = Array.from(rows).filter(row => !row.classList.contains('breakdown-row'));
            
            if (mainRows[rowIndex]) {
                mainRows[rowIndex].classList.add('selected');
            this.selectedRowIndex = rowIndex;
            const item = this.filteredData[rowIndex];
            // Satırı görünür hale getir (scroll)
                mainRows[rowIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    /**
     * Malzeme koduna göre satır seçer
     * @param {string} malhizKodu - Malzeme kodu
     */
    selectRowByMalhizKodu(malhizKodu) {
        // Önceki seçimi kaldır
        const rows = document.querySelectorAll('#gridBody tr');
        rows.forEach(row => row.classList.remove('selected'));
        // İlgili satırı bul ve seç
        const rowIndex = this.filteredData.findIndex(item => item.malhizKodu === malhizKodu);
        if (rowIndex !== -1 && rows[rowIndex]) {
            rows[rowIndex].classList.add('selected');
            this.selectedRowIndex = rowIndex;
            const item = this.filteredData[rowIndex];
            // Satırı görünür hale getir (scroll)
            rows[rowIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    /**
     * Satır seçildiğinde çağrılan callback
     * @param {Object} item - Seçilen öğe
     * @param {number} index - Satır indeksi
     */
    async onRowSelected(item, index) {
        // Bu metod alt sınıflarda override edilebilir
        // Not: Chart güncellemesi selectRow içinde focusOnWeek ile yapılıyor, burada tekrar yapmaya gerek yok
    }
    /**
     * Veriyi sıralar
     * @param {string} column - Sıralanacak sütun
     */
    sortData(column) {
        // Aynı sütuna tekrar tıklandığında yönü değiştir
        const existingSortIndex = this.sortColumns.findIndex(s => s.column === column);
        
        if (existingSortIndex !== -1) {
            // Sütun zaten sıralamada var, yönü değiştir
            this.sortColumns[existingSortIndex].direction = 
                this.sortColumns[existingSortIndex].direction === 'asc' ? 'desc' : 'asc';
        } else {
            // Yeni sütun ekle (çoklu sıralama)
            this.sortColumns.push({ column: column, direction: 'asc' });
        }
        
        // Veriyi çoklu sıralamaya göre sırala
        this.filteredData.sort((a, b) => {
            // Tüm sıralama kriterlerini sırayla uygula
            for (const sort of this.sortColumns) {
                const result = this.compareValues(a[sort.column], b[sort.column], sort.column, sort.direction);
                if (result !== 0) {
                    return result;
                }
            }
            return 0; // Tüm kriterler eşitse
        });
        
        // Sıralama ikonlarını güncelle
        this.updateSortIcons();
        // Tabloyu güncelle
        this.updateGrid();
    }
    
    /**
     * İki değeri karşılaştırır
     * @param {*} valueA - İlk değer
     * @param {*} valueB - İkinci değer
     * @param {string} column - Sütun adı
     * @param {string} direction - Sıralama yönü ('asc' veya 'desc')
     * @returns {number} - Karşılaştırma sonucu (-1, 0, 1)
     */
    compareValues(valueA, valueB, column, direction) {
        // Null/undefined kontrolü
        if (valueA === null || valueA === undefined) valueA = '';
        if (valueB === null || valueB === undefined) valueB = '';
        
        // Sayısal değerler için özel işlem
        if (column === 'isemriNo' || column === 'agirlik' || column === 'toplamSure' || 
            column === 'planMiktar' || column === 'figurSayisi' || column === 'gercekMiktar' || 
            column === 'planlananMiktar' || column === 'hurdaMiktar' || column === 'brutAgirlik' ||
            column === 'degerKk' || column === 'degerDk' || column === 'degerAdet' || 
            column === 'totalPlanned' || column === 'totalWaiting') {
            valueA = parseFloat(valueA) || 0;
            valueB = parseFloat(valueB) || 0;
        }
        
        // Tarih değerleri için özel işlem
        if (column === 'tarih' || column === 'planlananTarih' || column === 'onerilenTeslimTarih') {
            valueA = valueA ? new Date(valueA) : new Date(0);
            valueB = valueB ? new Date(valueB) : new Date(0);
        }
        
        // String değerler için
        if (typeof valueA === 'string') valueA = valueA.toLowerCase();
        if (typeof valueB === 'string') valueB = valueB.toLowerCase();
        
        // Sıralama
        if (valueA < valueB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    }
    /**
     * Sıralama durumunu günceller
     */
    updateSortIcons() {
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            const column = header.getAttribute('data-column');
            const sortIndex = this.sortColumns.findIndex(s => s.column === column);
            
            if (sortIndex !== -1) {
                // Bu sütun sıralamada var
                header.classList.add('sorted');
                const sort = this.sortColumns[sortIndex];
                const directionText = sort.direction === 'asc' ? 'Artan' : 'Azalan';
                const priorityText = this.sortColumns.length > 1 ? ` (${sortIndex + 1}. öncelik)` : '';
                header.title = `Sıralama: ${directionText}${priorityText}`;
                
                // Sıralama önceliğini göster (çoklu sıralama varsa)
                if (this.sortColumns.length > 1) {
                    header.setAttribute('data-sort-priority', sortIndex + 1);
                } else {
                    header.removeAttribute('data-sort-priority');
                }
            } else {
                // Bu sütun sıralamada yok
                header.classList.remove('sorted');
                header.title = 'Sıralamak için tıklayın (çoklu sıralama desteklenir)';
                header.removeAttribute('data-sort-priority');
            }
        });
    }
    /**
     * Güvenli string dönüşümü ve arama
     * @param {any} value - Dönüştürülecek değer
     * @param {string} searchTerm - Aranacak terim
     * @returns {boolean} - Arama sonucu
     */
    safeStringSearch(value, searchTerm) {
        if (!value || !searchTerm) return false;
        try {
            return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        } catch (error) {
            console.warn('String dönüşüm hatası:', value, error);
            return false;
        }
    }
    /**
     * Arama yapar
     * @param {string} searchTerm - Aranacak terim
     */
    searchTable(searchTerm) {
        this.filters.search = searchTerm.toLowerCase();
        this.applyFilters();
    }
    /**
     * Arama barını temizler
     */
    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        this.filters.search = '';
        this.applyFilters();
    }
    /**
     * Tarih filtresini uygular (Planlanan Tarih alanında arama)
     */
    applyDateFilter() {
        const startDate = document.getElementById('startDateFilter').value;
        const endDate = document.getElementById('endDateFilter').value;
        if (!startDate || !endDate) {
            window.planningApp.showWarning('Lütfen başlangıç ve bitiş tarihlerini seçin');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            window.planningApp.showWarning('Başlangıç tarihi bitiş tarihinden sonra olamaz');
            return;
        }
        this.dateRange.startDate = startDate;
        this.dateRange.endDate = endDate;
        // Tüm filtreleri uygula (bölüm, makine, firma, malzeme, durum + tarih)
        this.applyFilters();
    }
    /**
     * Tarih filtresini sıfırlar (diğer filtreleri korur)
     */
    resetDateFilter() {
        document.getElementById('startDateFilter').value = '';
        document.getElementById('endDateFilter').value = '';
        this.dateRange.startDate = '';
        this.dateRange.endDate = '';
        // Sadece tarih filtresini kaldır, diğer filtreleri koru
        this.applyFilters();
    }
    
    /**
     * Gecikmiş işleri bugüne aktarır - Modal açar
     */
    async transferDelayedJobs() {
        const modal = document.getElementById('delayedJobsTransferModal');
        if (!modal) {
            window.planningApp.showError('Modal bulunamadı');
            return;
        }
        
        // Modal'ı göster
        modal.style.display = 'block';
        
        // Loading göster
        document.getElementById('delayedJobsLoading').style.display = 'flex';
        document.getElementById('delayedJobsContent').style.display = 'none';
        
        try {
            // Önce cache'den gecikmiş işleri al
            const cacheDelayedJobs = this.getDelayedJobsFromCache();
            
            // Backend'den de gecikmiş işleri getir (cache'i doğrulamak için)
            const response = await fetch('/api/planning/delayed-jobs');
            const result = await response.json();
            
            if (result.success) {
                // Cache'den gelen işleri backend'den gelenlerle birleştir
                // Backend'den gelenler öncelikli (daha güncel)
                const mergedData = this.mergeDelayedJobsData(cacheDelayedJobs, result.data);
                
                // Modal içeriğini doldur
                this.populateDelayedJobsModal(mergedData);
                
                // Loading gizle, içeriği göster
                document.getElementById('delayedJobsLoading').style.display = 'none';
                document.getElementById('delayedJobsContent').style.display = 'block';
            } else {
                // Backend başarısız olursa cache'den göster
                if (Object.keys(cacheDelayedJobs).length > 0) {
                    this.populateDelayedJobsModal(cacheDelayedJobs);
                    document.getElementById('delayedJobsLoading').style.display = 'none';
                    document.getElementById('delayedJobsContent').style.display = 'block';
                } else {
                    document.getElementById('delayedJobsLoading').style.display = 'none';
                    window.planningApp.showError(result.message || 'Gecikmiş işler getirilemedi');
                    modal.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Gecikmiş işleri getirme hatası:', error);
            // Hata durumunda cache'den göster
            const cacheDelayedJobs = this.getDelayedJobsFromCache();
            if (Object.keys(cacheDelayedJobs).length > 0) {
                this.populateDelayedJobsModal(cacheDelayedJobs);
                document.getElementById('delayedJobsLoading').style.display = 'none';
                document.getElementById('delayedJobsContent').style.display = 'block';
            } else {
                document.getElementById('delayedJobsLoading').style.display = 'none';
                window.planningApp.showError('Gecikmiş işler getirilirken hata oluştu: ' + error.message);
                modal.style.display = 'none';
            }
        }
    }
    
    /**
     * Cache'den gecikmiş işleri alır
     */
    getDelayedJobsFromCache() {
        if (!window.planningApp || !window.planningApp.data) {
            return {};
        }
        
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        
        const delayedJobsByBolum = {};
        
        window.planningApp.data.forEach(item => {
            // Gecikmiş kontrolü: Planlanan tarih geçmiş mi ve tamamlanmamış mı?
            const planlananTarih = item.planlananTarih ? new Date(item.planlananTarih) : null;
            const totalPlanned = this.computePlannedSum(item);
            const totalRealized = Number(item.gercekMiktar || 0);
            const isTamamlandi = totalPlanned > 0 && totalRealized >= totalPlanned;
            
            const isGecikmeli = planlananTarih && 
                planlananTarih < bugun && 
                !isTamamlandi &&
                totalRealized < totalPlanned;
            
            // Gecikmiş değilse veya bölüm tanımsızsa atla
            if (!isGecikmeli || !item.bolumAdi || item.bolumAdi.trim().toUpperCase() === 'TANIMSIZ') {
                return;
            }
            
            const bolumAdi = item.bolumAdi;
            if (!delayedJobsByBolum[bolumAdi]) {
                delayedJobsByBolum[bolumAdi] = [];
            }
            
            // Ana kayıt için plan bilgisi
            if (item.planId && item.planlananTarih) {
                const planTarihi = new Date(item.planlananTarih);
                if (planTarihi < bugun) {
                    const kalanMiktar = totalPlanned - totalRealized;
                    if (kalanMiktar > 0) {
                        delayedJobsByBolum[bolumAdi].push({
                            planId: item.planId,
                            isemriId: item.isemriId,
                            isemriNo: item.isemriNo,
                            isemriParcaNo: null,
                            planTarihi: item.planlananTarih,
                            planlananMiktar: totalPlanned,
                            gercekMiktar: totalRealized,
                            kalanMiktar: kalanMiktar,
                            makAd: item.makAd || item.selectedMachine,
                            malhizKodu: item.malhizKodu,
                            malhizAdi: item.malhizAdi,
                            firmaAdi: item.firmaAdi,
                            bolumAdi: bolumAdi
                        });
                    }
                }
            }
            
            // Breakdown'lar için
            if (item.breakdowns && Array.isArray(item.breakdowns)) {
                item.breakdowns.forEach(breakdown => {
                    if (breakdown.planId && breakdown.planTarihi) {
                        const breakdownTarih = new Date(breakdown.planTarihi);
                        if (breakdownTarih < bugun && breakdown.durum === 'Planlandı') {
                            // Breakdown için gerçekleşen miktar - breakdown'da varsa onu kullan, yoksa ana kayıttan al
                            const breakdownGercek = Number(breakdown.gercekMiktar !== undefined ? breakdown.gercekMiktar : (item.gercekMiktar || 0));
                            const breakdownPlanlanan = Number(breakdown.planlananMiktar || 0);
                            const breakdownKalan = breakdownPlanlanan - breakdownGercek;
                            
                            if (breakdownKalan > 0) {
                                delayedJobsByBolum[bolumAdi].push({
                                    planId: breakdown.planId,
                                    isemriId: item.isemriId,
                                    isemriNo: item.isemriNo,
                                    isemriParcaNo: breakdown.parcaNo,
                                    planTarihi: breakdown.planTarihi,
                                    planlananMiktar: breakdownPlanlanan,
                                    gercekMiktar: breakdownGercek,
                                    kalanMiktar: breakdownKalan,
                                    makAd: breakdown.makAd || breakdown.selectedMachine,
                                    malhizKodu: item.malhizKodu,
                                    malhizAdi: item.malhizAdi,
                                    firmaAdi: item.firmaAdi,
                                    bolumAdi: bolumAdi
                                });
                            }
                        }
                    }
                });
            }
        });
        
        return delayedJobsByBolum;
    }
    
    /**
     * Cache ve backend'den gelen gecikmiş iş verilerini birleştirir
     */
    mergeDelayedJobsData(cacheData, backendData) {
        const merged = { ...backendData };
        
        // Cache'den gelen işleri ekle (backend'de yoksa)
        Object.keys(cacheData).forEach(bolumAdi => {
            if (!merged[bolumAdi]) {
                merged[bolumAdi] = [];
            }
            
            cacheData[bolumAdi].forEach(cacheJob => {
                // Backend'de aynı planId var mı kontrol et
                const exists = merged[bolumAdi].some(backendJob => backendJob.planId === cacheJob.planId);
                if (!exists) {
                    merged[bolumAdi].push(cacheJob);
                }
            });
        });
        
        return merged;
    }
    
    /**
     * Planlanan miktar toplamını hesaplar
     */
    computePlannedSum(item) {
        if (item.breakdowns && Array.isArray(item.breakdowns) && item.breakdowns.length > 0) {
            return item.breakdowns
                .filter(b => (b.durum || '').toLowerCase() === 'planlandı')
                .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
        }
        return Number(item.planlananMiktar || 0);
    }
    
    /**
     * Gecikmiş işler modal'ını doldurur
     */
    populateDelayedJobsModal(dataByBolum) {
        const container = document.getElementById('delayedJobsByBolum');
        if (!container) return;
        
        container.innerHTML = '';
        
        const bolumler = Object.keys(dataByBolum).sort();
        
        if (bolumler.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Gecikmiş iş bulunamadı.</p>';
            return;
        }
        
        bolumler.forEach(bolumAdi => {
            const jobs = dataByBolum[bolumAdi];
            
            // Bölüm başlığı
            const bolumSection = document.createElement('div');
            bolumSection.style.marginBottom = '20px';
            bolumSection.style.border = '1px solid #e0e0e0';
            bolumSection.style.borderRadius = '8px';
            bolumSection.style.overflow = 'hidden';
            
            const bolumHeader = document.createElement('div');
            bolumHeader.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            bolumHeader.style.color = 'white';
            bolumHeader.style.padding = '12px 15px';
            bolumHeader.style.fontWeight = '600';
            bolumHeader.style.fontSize = '16px';
            bolumHeader.textContent = `${bolumAdi} (${jobs.length} iş)`;
            bolumSection.appendChild(bolumHeader);
            
            // Tablo
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.tableLayout = 'fixed'; // Sabit tablo düzeni için
            
            // Tablo başlığı
            const thead = document.createElement('thead');
            thead.style.background = '#f5f5f5';
            thead.innerHTML = `
                <tr>
                    <th style="padding: 10px; text-align: left; width: 40px;">
                        <input type="checkbox" class="bolum-select-all" data-bolum="${bolumAdi}" checked onchange="dataGrid.toggleBolumDelayedJobs('${bolumAdi}', this.checked)">
                    </th>
                    <th style="padding: 10px; text-align: left; width: 100px;">İş Emri No</th>
                    <th style="padding: 10px; text-align: left; width: 200px;">Malzeme</th>
                    <th style="padding: 10px; text-align: left; width: 180px;">Makine</th>
                    <th style="padding: 10px; text-align: right; width: 80px;">Planlanan</th>
                    <th style="padding: 10px; text-align: right; width: 90px;">Gerçekleşen</th>
                    <th style="padding: 10px; text-align: right; width: 70px;">Kalan</th>
                    <th style="padding: 10px; text-align: center; width: 110px;">Plan Tarihi</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Tablo gövdesi
            const tbody = document.createElement('tbody');
            jobs.forEach(job => {
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #eee';
                row.style.transition = 'background-color 0.2s';
                row.onmouseenter = () => row.style.background = '#f9f9f9';
                row.onmouseleave = () => row.style.background = '';
                
                row.innerHTML = `
                    <td style="padding: 10px;">
                        <input type="checkbox" 
                               class="delayed-job-checkbox" 
                               data-plan-id="${job.planId}"
                               data-planlanan-miktar="${job.planlananMiktar}"
                               data-gercek-miktar="${job.gercekMiktar}"
                               data-kalan-miktar="${job.kalanMiktar}"
                               data-isemri-id="${job.isemriId}"
                               data-isemri-parca-no="${job.isemriParcaNo || ''}"
                               data-mak-ad="${job.makAd || ''}"
                               checked>
                    </td>
                    <td style="padding: 10px; white-space: nowrap;">${job.isemriNo || '-'}</td>
                    <td style="padding: 10px; max-width: 200px; word-wrap: break-word; word-break: break-word; line-height: 1.4;">${job.malhizKodu || job.malhizAdi || '-'}</td>
                    <td style="padding: 10px; max-width: 180px; word-wrap: break-word; word-break: break-word; line-height: 1.4;">${job.makAd || '-'}</td>
                    <td style="padding: 10px; text-align: right; white-space: nowrap;">${job.planlananMiktar}</td>
                    <td style="padding: 10px; text-align: right; white-space: nowrap;">${job.gercekMiktar}</td>
                    <td style="padding: 10px; text-align: right; font-weight: 600; color: #f97316; white-space: nowrap;">${job.kalanMiktar}</td>
                    <td style="padding: 10px; text-align: center; white-space: nowrap;">${job.planTarihi ? new Date(job.planTarihi).toLocaleDateString('tr-TR') : '-'}</td>
                `;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            bolumSection.appendChild(table);
            container.appendChild(bolumSection);
        });
        
        // Butonun başlangıç durumunu ayarla (tüm checkbox'lar seçili olduğu için "Tümünü Kaldır")
        const toggleBtn = document.getElementById('toggleAllDelayedBtn');
        if (toggleBtn) {
            const toggleIcon = toggleBtn.querySelector('.toggle-icon');
            const toggleText = toggleBtn.querySelector('.toggle-text');
            if (toggleIcon && toggleText) {
                toggleIcon.textContent = '☑';
                toggleText.textContent = 'Tümünü Kaldır';
                toggleBtn.classList.add('toggled');
            }
        }
    }
    
    /**
     * Bölüm bazında tüm işleri seç/seçme
     */
    toggleBolumDelayedJobs(bolumAdi, checked) {
        const container = document.getElementById('delayedJobsByBolum');
        const bolumCheckbox = container.querySelector(`.bolum-select-all[data-bolum="${bolumAdi}"]`);
        if (bolumCheckbox) {
            const bolumSection = bolumCheckbox.closest('div[style*="margin-bottom"]');
            if (bolumSection) {
                const checkboxes = bolumSection.querySelectorAll('.delayed-job-checkbox');
                checkboxes.forEach(cb => cb.checked = checked);
            }
        }
    }
    
    /**
     * Tüm gecikmiş işleri seç/seçme
     */
    toggleAllDelayedJobs() {
        const toggleBtn = document.getElementById('toggleAllDelayedBtn');
        const toggleIcon = toggleBtn.querySelector('.toggle-icon');
        const toggleText = toggleBtn.querySelector('.toggle-text');
        const allCheckboxes = document.querySelectorAll('.delayed-job-checkbox');
        const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
        
        allCheckboxes.forEach(cb => cb.checked = !allChecked);
        document.querySelectorAll('.bolum-select-all').forEach(cb => cb.checked = !allChecked);
        
        if (!allChecked) {
            // Tümünü seçildi
            toggleIcon.textContent = '☑';
            toggleText.textContent = 'Tümünü Kaldır';
            toggleBtn.classList.add('toggled');
        } else {
            // Tümü kaldırıldı
            toggleIcon.textContent = '☐';
            toggleText.textContent = 'Tümünü Seç';
            toggleBtn.classList.remove('toggled');
        }
    }
    
    /**
     * Seçili gecikmiş işleri aktarır
     */
    async confirmDelayedJobsTransfer() {
        const selectedCheckboxes = document.querySelectorAll('.delayed-job-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            window.planningApp.showWarning('Lütfen en az bir iş seçin');
            return;
        }
        
        // Cache'deki bilgileri kullanarak seçili işlerin tam bilgilerini hazırla
        const selectedJobs = Array.from(selectedCheckboxes).map(cb => {
            const parcaNoAttr = cb.getAttribute('data-isemri-parca-no');
            // Eğer attribute boş string veya null ise null, değilse sayıya çevir
            let isemriParcaNo = null;
            if (parcaNoAttr && parcaNoAttr.trim() !== '') {
                const parsed = parseInt(parcaNoAttr);
                isemriParcaNo = isNaN(parsed) ? null : parsed;
            }
            
            const job = {
                planId: parseInt(cb.getAttribute('data-plan-id')),
                planlananMiktar: Number(cb.getAttribute('data-planlanan-miktar') || 0),
                gercekMiktar: Number(cb.getAttribute('data-gercek-miktar') || 0),
                kalanMiktar: Number(cb.getAttribute('data-kalan-miktar') || 0),
                isemriId: parseInt(cb.getAttribute('data-isemri-id')),
                isemriParcaNo: isemriParcaNo,
                makAd: cb.getAttribute('data-mak-ad') || null
            };
            
            
            return job;
        });
        
        try {
            // Progress bar göster
            if (window.planningApp) {
                window.planningApp.showProgressBar('Gecikmiş işler aktarılıyor...');
            }
            
            const response = await fetch('/api/planning/transfer-delayed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ selectedJobs })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Modal'ı kapat
                closeDelayedJobsTransferModal();
                
                // Başarı mesajı
                if (window.planningApp) {
                    window.planningApp.hideProgressBar();
                    window.planningApp.showSuccess(
                        `${result.transferredCount} gecikmiş iş bugüne aktarıldı!`
                    );
                }
                
                // Veriyi yeniden yükle
                if (window.planningApp && window.planningApp.databaseService) {
                    // Cache'i temizle
                    window.planningApp.databaseService.clearCache();
                    
                    // Veriyi yeniden yükle
                    await window.planningApp.loadData();
                    
                    // Grid'i güncelle
                    this.data = window.planningApp.data;
                    this.applyFilters();
                }
            } else {
                if (window.planningApp) {
                    window.planningApp.hideProgressBar();
                    window.planningApp.showError(
                        result.message || 'Gecikmiş işler aktarılırken hata oluştu'
                    );
                }
            }
        } catch (error) {
            console.error('Gecikmiş işleri aktarma hatası:', error);
            if (window.planningApp) {
                window.planningApp.hideProgressBar();
                window.planningApp.showError('Gecikmiş işler aktarılırken hata oluştu: ' + error.message);
            }
        }
    }
    
    /**
     * Tarih filtresi uygulandığında çağrılan callback
     * @param {Object} dateRange - Tarih aralığı
     */
    onDateFilterApplied(dateRange) {
        // Bu metod alt sınıflarda override edilebilir
    }
    /**
     * Tarih filtresi sıfırlandığında çağrılan callback
     */
    onDateFilterReset() {
        // Bu metod alt sınıflarda override edilebilir
    }
    /**
     * Planlama modal'ını açar
     * @param {Object} item - Seçilen iş emri verisi
     */
    openPlanningModal(item) {
        const modal = document.getElementById('planningModal');
        if (!modal) return;
        
        // Önce modal içeriğini temizle
        this.resetModalContent();
        
        // Modal başlığını güncelle
        const modalTitle = modal.querySelector('.modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = 'Yeni Planlama';
        }
        
        // Tab yapısını başlat
        this.initializePlanningTabs(modal, item);
        
        // Normal planlama tab'ını doldur
        this.populateNormalPlanningTab(modal, item);
        
        // Makine kontrolü yap ve modal'ı aç
        this.checkMachineAndOpenModal(item, modal);
    }
    
    /**
     * Planlama modalı tab yapısını başlatır
     */
    initializePlanningTabs(modal, item) {
        // Normal planlama form submit handler
        const normalForm = modal.querySelector('#planningForm');
        if (normalForm) {
            normalForm.onsubmit = (e) => {
                e.preventDefault();
                this.submitPlanning(item);
            };
        }
        
        // Kuyruk planlama form submit handler
        const queueForm = modal.querySelector('#queuePlanningForm');
        if (queueForm) {
            queueForm.onsubmit = (e) => {
                e.preventDefault();
                this.submitQueueFullPlanFromTab(item);
            };
        }
    }
    
    /**
     * Tab değiştirme fonksiyonu
     */
    switchPlanningTab(tabName) {
        const modal = document.getElementById('planningModal');
        if (!modal) return;
        
        // Tab butonlarını güncelle
        const tabButtons = modal.querySelectorAll('.planning-tab-button');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Tab içeriklerini güncelle
        const tabContents = modal.querySelectorAll('.planning-tab-content');
        tabContents.forEach(content => {
            if ((tabName === 'normal' && content.id === 'normalPlanningTab') ||
                (tabName === 'queue' && content.id === 'queuePlanningTab')) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }
    
    /**
     * Normal planlama tab'ını doldurur
     */
    populateNormalPlanningTab(modal, item) {
        // Bilgi alanlarını doldur
        const planningIsemriNo = modal.querySelector('#planningIsemriNo');
        if (planningIsemriNo) planningIsemriNo.value = item.isemriNo || '';
        
        const planningMalhizKodu = modal.querySelector('#planningMalhizKodu');
        if (planningMalhizKodu) planningMalhizKodu.value = item.malhizKodu || '';
        
        const planningMalzeme = modal.querySelector('#planningMalzeme');
        if (planningMalzeme) planningMalzeme.value = item.imalatTuru || '';
        
        const planningOnerilenTeslim = modal.querySelector('#planningOnerilenTeslim');
        if (planningOnerilenTeslim) {
            planningOnerilenTeslim.value = item.onerilenTeslimTarih ? 
                new Date(item.onerilenTeslimTarih).toLocaleDateString('tr-TR') : '';
        }
        
        // Planlama alanlarını doldur
        const onerilenTeslim = item.onerilenTeslimTarih;
        let defaultTarih = '';
        if (onerilenTeslim) {
            const teslimTarihi = new Date(onerilenTeslim);
            const planlananTarih = new Date(teslimTarihi);
            planlananTarih.setDate(teslimTarihi.getDate() - 7);
            defaultTarih = planlananTarih.toISOString().split('T')[0];
        }
        
        const planningTarih = modal.querySelector('#planningTarih');
        if (planningTarih) planningTarih.value = defaultTarih;
        
        const siparisMiktarDefault = Math.ceil(Number(item.siparisMiktarHesaplanan || 0));
        const providedBreakdownAmount = (typeof item.planlananMiktar === 'number') ? item.planlananMiktar : Number(item.planlananMiktar);
        const defaultAmount = (providedBreakdownAmount && providedBreakdownAmount > 0)
            ? providedBreakdownAmount
            : siparisMiktarDefault;
        
        const planningMiktar = modal.querySelector('#planningMiktar');
        if (planningMiktar) planningMiktar.value = isNaN(defaultAmount) ? '' : defaultAmount;
        
        // Miktar değişikliğini dinle
        if (planningMiktar) {
            // Önceki event listener'ları kaldır
            const newMiktarInput = planningMiktar.cloneNode(true);
            planningMiktar.parentNode.replaceChild(newMiktarInput, planningMiktar);
            
            // Yeni event listener ekle
            newMiktarInput.addEventListener('input', () => {
                this.updatePlanningResult(item);
                this.updatePlanningWeightAndTime(item, 'normal');
            });
        }
        
        // Makine dropdown'ı dinamik olarak addMachineSelectionField ile ekleniyor
        
        // Sonuç alanını güncelle
        this.updatePlanningResult(item);
        // Ağırlık ve süre alanlarını güncelle
        this.updatePlanningWeightAndTime(item, 'normal');
    }
    
    /**
     * Makine dropdown'ını doldurur
     */
    async populateMachineDropdown(modal, item, selectId) {
        const machineSelect = modal.querySelector(`#${selectId}`);
        if (!machineSelect) return;
        
        // Önce loading göster
        machineSelect.innerHTML = '<option value="">Yükleniyor...</option>';
        
        try {
            let machines = [];
            const defaultMachine = item.selectedMachine || item.makAd || '';
            
            // Maça bölümü kontrolü
            const isMaca = this.isMacaBolumu(item);
            if (isMaca && window.planningApp) {
                // Maça için üst makine kontrolü yap
                const machineInfo = await window.planningApp.checkMachineType(item.makAd || '');
                if (machineInfo && machineInfo.isUpperMachine && machineInfo.subMachines) {
                    // Alt makineleri kullan
                    machines = machineInfo.subMachines.map(sub => sub.makAd);
                } else {
                    // Direkt makine veya alt makine
                    machines = [item.makAd].filter(Boolean);
                }
            } else {
                // Diğer bölümler için bölüm makinelerini al
                if (item.bolumAdi && window.dataGrid) {
                    const bolumMachines = await this.getMachinesForBolum(item.bolumAdi);
                    machines = bolumMachines.length > 0 ? bolumMachines : [item.makAd].filter(Boolean);
                } else {
                    machines = [item.makAd].filter(Boolean);
                }
            }
            
            // Dropdown'ı doldur
            machineSelect.innerHTML = '';
            machines.forEach(machine => {
                const option = document.createElement('option');
                option.value = machine;
                option.textContent = machine;
                if (machine === defaultMachine) {
                    option.selected = true;
                }
                machineSelect.appendChild(option);
            });
            
            // Eğer hiç makine yoksa
            if (machines.length === 0) {
                machineSelect.innerHTML = '<option value="">Makine bulunamadı</option>';
            }
        } catch (error) {
            console.error('Makine dropdown doldurma hatası:', error);
            machineSelect.innerHTML = '<option value="">Hata oluştu</option>';
        }
    }
    
    /**
     * Bölüm için makineleri getirir
     */
    async getMachinesForBolum(bolumAdi) {
        if (!window.dataGrid || !window.dataGrid.data) return [];
        
        const machines = new Set();
        window.dataGrid.data.forEach(item => {
            if (item.bolumAdi === bolumAdi && item.makAd) {
                machines.add(item.makAd);
            }
        });
        
        return Array.from(machines).sort();
    }
    
    /**
     * Tarihi Türkçe formatında formatlar
     * @param {string|Date} date - Tarih
     * @returns {string} Formatlanmış tarih
     */
    formatDateTR(date) {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString('tr-TR');
        } catch {
            return '';
        }
    }
    
    /**
     * Tarihi ISO string formatına çevirir (YYYY-MM-DD)
     * @param {string|Date} date - Tarih
     * @returns {string} ISO format tarih
     */
    formatDateISO(date) {
        if (!date) return '';
        try {
            const d = date instanceof Date ? date : new Date(date);
            return d.toISOString().split('T')[0];
        } catch {
            return '';
        }
    }
    
    /**
     * Ürün bazlı planlama tablosundaki her iş emri için makine dropdown'larını doldurur
     */
    async populateProductBasedMachineDropdowns(ordersList, orders) {
        const machineSelects = ordersList.querySelectorAll('.product-order-machine-input');
        
        for (const select of machineSelects) {
            const isemriId = select.dataset.isemriId;
            const bolumAdi = select.dataset.bolumAdi || '';
            const currentMachine = select.dataset.makAd || '';
            
            // İş emrini bul
            const order = orders.find(o => o.ISEMRI_ID === parseInt(isemriId));
            if (!order) {
                console.warn(`İş emri bulunamadı: ${isemriId}`);
                continue;
            }
            
            // BOLUM_ADI ve MAK_AD bilgilerini order'dan al (eğer dataset'te yoksa)
            const orderBolumAdi = order.BOLUM_ADI || bolumAdi || '';
            const orderMakAd = order.MAK_AD || currentMachine || '';
            
            try {
                let machines = [];
                
                // Eğer makine adı yoksa, sadece "Makine bulunamadı" göster
                if (!orderMakAd || orderMakAd.trim() === '') {
                    select.innerHTML = '<option value="">Makine bulunamadı</option>';
                    continue;
                }
                
                // Maça bölümü kontrolü
                const isMaca = this.isMacaBolumu({ bolumAdi: orderBolumAdi, makAd: orderMakAd });
                if (isMaca && window.planningApp) {
                    // Maça için üst makine kontrolü yap
                    const machineInfo = await window.planningApp.checkMachineType(orderMakAd);
                    if (machineInfo && machineInfo.isUpperMachine && machineInfo.subMachines) {
                        // Alt makineleri kullan
                        machines = machineInfo.subMachines.map(sub => sub.makAd);
                    } else {
                        // Direkt makine veya alt makine
                        machines = [orderMakAd].filter(Boolean);
                    }
                } else {
                    // Diğer bölümler için bölüm makinelerini al
                    if (orderBolumAdi) {
                        machines = await this.getMachinesForBolum(orderBolumAdi);
                        if (machines.length === 0) {
                            machines = [orderMakAd].filter(Boolean);
                        }
                    } else {
                        machines = [orderMakAd].filter(Boolean);
                    }
                }
                
                // Dropdown'ı doldur
                select.innerHTML = '';
                machines.forEach(machine => {
                    const option = document.createElement('option');
                    option.value = machine;
                    option.textContent = machine;
                    if (machine === currentMachine || (currentMachine === '' && machines.length === 1)) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
                
                // Eğer hiç makine yoksa
                if (machines.length === 0) {
                    select.innerHTML = '<option value="">Makine bulunamadı</option>';
                }
            } catch (error) {
                console.error('Makine dropdown doldurma hatası:', error, { isemriId, order });
                select.innerHTML = `<option value="${orderMakAd || ''}" selected>${orderMakAd || 'Makine seçin...'}</option>`;
            }
        }
    }
    
    /**
     * Kuyruk planlama tablosundaki her aşama için makine dropdown'larını doldurur
     */
    async populateStageMachineDropdowns(modal, stages) {
        const machineSelects = modal.querySelectorAll('.stage-machine-input');
        
        for (const select of machineSelects) {
            const isemriId = select.dataset.isemriId;
            const bolumAdi = select.dataset.bolumAdi || '';
            const currentMachine = select.value || '';
            
            // Aşamayı bul
            const stage = stages.find(s => s.isemriId === parseInt(isemriId));
            if (!stage) continue;
            
            try {
                let machines = [];
                
                // Maça bölümü kontrolü
                const isMaca = this.isMacaBolumu({ bolumAdi: bolumAdi, makAd: stage.makAd || '' });
                if (isMaca && window.planningApp) {
                    // Maça için üst makine kontrolü yap
                    const machineInfo = await window.planningApp.checkMachineType(stage.makAd || '');
                    if (machineInfo && machineInfo.isUpperMachine && machineInfo.subMachines) {
                        // Alt makineleri kullan
                        machines = machineInfo.subMachines.map(sub => sub.makAd);
                    } else {
                        // Direkt makine veya alt makine
                        machines = [stage.makAd].filter(Boolean);
                    }
                } else {
                    // Diğer bölümler için bölüm makinelerini al
                    if (bolumAdi) {
                        machines = await this.getMachinesForBolum(bolumAdi);
                        if (machines.length === 0) {
                            machines = [stage.makAd].filter(Boolean);
                        }
                    } else {
                        machines = [stage.makAd].filter(Boolean);
                    }
                }
                
                // Dropdown'ı doldur
                select.innerHTML = '';
                machines.forEach(machine => {
                    const option = document.createElement('option');
                    option.value = machine;
                    option.textContent = machine;
                    if (machine === currentMachine || (currentMachine === '' && machines.length === 1)) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
                
                // Eğer hiç makine yoksa
                if (machines.length === 0) {
                    select.innerHTML = '<option value="">Makine bulunamadı</option>';
                }
            } catch (error) {
                console.error('Makine dropdown doldurma hatası:', error);
                select.innerHTML = '<option value="">Hata oluştu</option>';
            }
        }
    }
    
    /**
     * Kuyruk planlama tab'ını doldurur
     */
    populateQueuePlanningTab(modal, item) {
        // Bilgi alanlarını doldur
        const queuePlanningIsemriNo = modal.querySelector('#queuePlanningIsemriNo');
        if (queuePlanningIsemriNo) queuePlanningIsemriNo.value = item.isemriNo || '';
        
        const queuePlanningMalhizKodu = modal.querySelector('#queuePlanningMalhizKodu');
        if (queuePlanningMalhizKodu) queuePlanningMalhizKodu.value = item.malhizKodu || '';
        
        const queuePlanningMalzeme = modal.querySelector('#queuePlanningMalzeme');
        if (queuePlanningMalzeme) queuePlanningMalzeme.value = item.imalatTuru || '';
        
        const queuePlanningOnerilenTeslim = modal.querySelector('#queuePlanningOnerilenTeslim');
        if (queuePlanningOnerilenTeslim) {
            queuePlanningOnerilenTeslim.value = item.onerilenTeslimTarih ? 
                new Date(item.onerilenTeslimTarih).toLocaleDateString('tr-TR') : '';
        }
        
        // Başlangıç tarihi alanını doldur (önerilen teslim tarihinin 7 gün öncesi)
        const queuePlanningBaslangicTarih = modal.querySelector('#queuePlanningBaslangicTarih');
        if (queuePlanningBaslangicTarih && item.onerilenTeslimTarih) {
            const onerilenTarih = new Date(item.onerilenTeslimTarih);
            // 7 gün öncesini hesapla
            const baslangicTarih = new Date(onerilenTarih);
            baslangicTarih.setDate(baslangicTarih.getDate() - 7);
            // YYYY-MM-DD formatına çevir (date input için)
            const year = baslangicTarih.getFullYear();
            const month = String(baslangicTarih.getMonth() + 1).padStart(2, '0');
            const day = String(baslangicTarih.getDate()).padStart(2, '0');
            queuePlanningBaslangicTarih.value = `${year}-${month}-${day}`;
        }
        
        // Miktar alanını doldur
        const siparisMiktarDefault = Math.ceil(Number(item.siparisMiktarHesaplanan || 0));
        const providedBreakdownAmount = (typeof item.planlananMiktar === 'number') ? item.planlananMiktar : Number(item.planlananMiktar);
        const defaultAmount = (providedBreakdownAmount && providedBreakdownAmount > 0)
            ? providedBreakdownAmount
            : siparisMiktarDefault;
        
        const queuePlanningMiktar = modal.querySelector('#queuePlanningMiktar');
        if (queuePlanningMiktar) {
            queuePlanningMiktar.value = isNaN(defaultAmount) ? '' : defaultAmount;
            
            // Önceki event listener'ları kaldır
            const newMiktarInput = queuePlanningMiktar.cloneNode(true);
            queuePlanningMiktar.parentNode.replaceChild(newMiktarInput, queuePlanningMiktar);
            
            // Yeni event listener ekle
            newMiktarInput.addEventListener('input', () => {
                this.updatePlanningWeightAndTime(item, 'queue');
            });
        }
        
        // Ağırlık ve süre alanlarını güncelle
        this.updatePlanningWeightAndTime(item, 'queue');
        
        // Aşamaları yükle ve önizle
        this.loadQueueStagesPreview(modal, item);
    }
    
    /**
     * Kuyruk planlama için aşamaları yükler ve önizleme gösterir
     */
    async loadQueueStagesPreview(modal, item) {
        const previewContainer = modal.querySelector('#queueStagesPreview');
        if (!previewContainer) return;
        
        previewContainer.innerHTML = '<div class="info-message">Aşamalar yükleniyor...</div>';
        
        try {
            // Backend'den aşamaları çek
            const response = await fetch(`/api/production-stages/${item.isemriNo}`);
            const result = await response.json();
            
            if (!result.success || !result.data || !result.data.stages) {
                previewContainer.innerHTML = '<div class="info-message">Aşamalar yüklenemedi.</div>';
                return;
            }
            
            const stages = result.data.stages;
            if (stages.length === 0) {
                previewContainer.innerHTML = '<div class="info-message">Bu iş emri için aşama bulunamadı.</div>';
                return;
            }
            
            // Aşamaları göster - her aşama için makine seçim alanı ile
            let html = '';
            stages.forEach((stage, index) => {
                const stageId = stage.isemriId || stage.id || `stage_${index}`;
                const currentMachine = stage.makAd || stage.workCenter || '';
                const malhizKodu = stage.productCode || stage.malhizKodu || '';
                const malhizAdi = stage.malhizAdi || '';
                
                // Aşamanın planlı olup olmadığını kontrol et
                const isPlanned = stage.planId !== null && stage.planId !== undefined;
                const planTarihi = stage.planTarihi ? new Date(stage.planTarihi) : null;
                
                // Planlı ise tarih bilgisini göster, değilse "Planlanacak"
                let statusHtml = '';
                if (isPlanned && planTarihi) {
                    const formattedDate = planTarihi.toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    statusHtml = `<div class="queue-stage-date planned">Planlı<br><small>${formattedDate}</small></div>`;
                } else {
                    statusHtml = '<div class="queue-stage-date">Planlanacak</div>';
                }
                
                html += `
                    <div class="queue-stage-item">
                        <div class="queue-stage-info">
                            <div class="queue-stage-name">
                                ${malhizKodu ? `${malhizKodu} - ${malhizAdi}` : (stage.productCode || stage.stageName || `Aşama ${index + 1}`)}
                            </div>
                            <div class="queue-stage-details">
                                Makine: ${currentMachine || '-'} | 
                                Sıra: ${stage.isemriSira !== undefined ? stage.isemriSira : '-'}
                            </div>
                        </div>
                        ${statusHtml}
                    </div>
                `;
            });
            
            previewContainer.innerHTML = html;
        } catch (error) {
            console.error('Aşamalar yüklenirken hata:', error);
            previewContainer.innerHTML = '<div class="info-message">Aşamalar yüklenirken hata oluştu.</div>';
        }
    }
    
    /**
     * Kuyruk planlama modal'ını açar (sağ tık menüden)
     */
    openQueuePlanningModal(item) {
        const summaryModal = document.getElementById('queuePlanSummaryModal');
        if (!summaryModal) return;
        
        // Modal'ı aç
        summaryModal.style.display = 'block';
        
        // Tüm bölümleri göster
        const inputSection = summaryModal.querySelector('#queuePlanInputSection');
        const loadingDiv = summaryModal.querySelector('#queuePlanSummaryLoading');
        const contentDiv = summaryModal.querySelector('#queuePlanSummaryContent');
        const stagesList = summaryModal.querySelector('#queuePlanStagesList');
        
        if (inputSection) inputSection.style.display = 'block';
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (contentDiv) contentDiv.style.display = 'block';
        
        // Form alanlarını temizle
        const miktarInput = summaryModal.querySelector('#queuePlanInputMiktar');
        const tarihInput = summaryModal.querySelector('#queuePlanInputBaslangicTarih');
        const aciklamaInput = summaryModal.querySelector('#queuePlanInputAciklama');
        
        if (miktarInput) {
            miktarInput.value = item.siparisMiktarHesaplanan || '';
            // Miktar değiştiğinde özeti güncelle
            miktarInput.removeEventListener('input', this.queuePlanInputHandler);
            this.queuePlanInputHandler = () => {
                if (miktarInput.value && tarihInput && tarihInput.value) {
                    this.loadQueuePlanSummary();
                }
            };
            miktarInput.addEventListener('input', this.queuePlanInputHandler);
        }
        if (tarihInput) {
            // Bugünün tarihini varsayılan olarak ayarla
            const today = new Date().toISOString().split('T')[0];
            tarihInput.value = today;
            // Tarih değiştiğinde özeti güncelle
            tarihInput.removeEventListener('change', this.queuePlanDateHandler);
            this.queuePlanDateHandler = () => {
                if (miktarInput && miktarInput.value && tarihInput.value) {
                    this.loadQueuePlanSummary();
                }
            };
            tarihInput.addEventListener('change', this.queuePlanDateHandler);
        }
        if (aciklamaInput) {
            aciklamaInput.value = '';
        }
        
        // Item'ı sakla (loadQueuePlanSummary için)
        this.queuePlanningItem = item;
        
        // Bilgileri başlangıç durumuna getir
        const isemriNoSpan = summaryModal.querySelector('#summaryIsemriNo');
        const toplamAgirlikSpan = summaryModal.querySelector('#summaryToplamAgirlik');
        const toplamSureSpan = summaryModal.querySelector('#summaryToplamSure');
        
        if (isemriNoSpan) isemriNoSpan.textContent = item.isemriNo || '-';
        if (toplamAgirlikSpan) toplamAgirlikSpan.textContent = '-';
        if (toplamSureSpan) toplamSureSpan.textContent = '-';
        
        if (stagesList) {
            stagesList.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">Miktar ve tarih girin, özet otomatik güncellenecektir</p>';
        }
        
        // İlk özeti yükle (varsayılan değerlerle)
        if (miktarInput && miktarInput.value && tarihInput && tarihInput.value) {
            this.loadQueuePlanSummary();
        }
    }
    
    /**
     * Kuyruk planlama özetini yükler
     */
    async loadQueuePlanSummary() {
        if (!this.queuePlanningItem) return;
        
        const summaryModal = document.getElementById('queuePlanSummaryModal');
        if (!summaryModal) return;
        
        const miktarInput = summaryModal.querySelector('#queuePlanInputMiktar');
        const tarihInput = summaryModal.querySelector('#queuePlanInputBaslangicTarih');
        
        if (!miktarInput || !miktarInput.value) {
            // Miktar yoksa özeti temizle
            const stagesList = summaryModal.querySelector('#queuePlanStagesList');
            const toplamAgirlikSpan = summaryModal.querySelector('#summaryToplamAgirlik');
            const toplamSureSpan = summaryModal.querySelector('#summaryToplamSure');
            
            if (toplamAgirlikSpan) toplamAgirlikSpan.textContent = '-';
            if (toplamSureSpan) toplamSureSpan.textContent = '-';
            
            if (stagesList) {
                stagesList.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">Lütfen planlanan miktar girin</p>';
            }
            return;
        }
        
        const planlananMiktar = parseInt(miktarInput.value);
        const planTarihi = tarihInput && tarihInput.value ? tarihInput.value : null;
        
        if (!planTarihi) {
            // Tarih yoksa özeti temizle
            const stagesList = summaryModal.querySelector('#queuePlanStagesList');
            const toplamAgirlikSpan = summaryModal.querySelector('#summaryToplamAgirlik');
            const toplamSureSpan = summaryModal.querySelector('#summaryToplamSure');
            
            if (toplamAgirlikSpan) toplamAgirlikSpan.textContent = '-';
            if (toplamSureSpan) toplamSureSpan.textContent = '-';
            
            if (stagesList) {
                stagesList.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">Lütfen başlangıç tarihi girin</p>';
            }
            return;
        }
        
        // Özeti yükle
        await this.showQueuePlanSummary(this.queuePlanningItem, planTarihi, planlananMiktar);
    }
    
    /**
     * Tab'dan kuyruk planlamayı gönderir - önce özet modal'ı açar
     */
    async submitQueueFullPlanFromTab(item) {
        const modal = document.getElementById('planningModal');
        if (!modal) return;
        
        // Form değerlerini al
        const queuePlanningMiktar = modal.querySelector('#queuePlanningMiktar');
        const queuePlanningBaslangicTarih = modal.querySelector('#queuePlanningBaslangicTarih');
        const queuePlanningAciklama = modal.querySelector('#queuePlanningAciklama');
        
        if (!queuePlanningMiktar || !queuePlanningMiktar.value) {
            window.planningApp.showWarning('Planlanan miktar gerekli');
            return;
        }
        
        const planlananMiktar = parseInt(queuePlanningMiktar.value);
        const planTarihi = queuePlanningBaslangicTarih && queuePlanningBaslangicTarih.value 
            ? queuePlanningBaslangicTarih.value 
            : null;
        const aciklama = queuePlanningAciklama?.value || '';
        
        if (!planTarihi) {
            window.planningApp.showWarning('Başlangıç tarihi gerekli');
            return;
        }
        
        // Özet modal'ı aç
        await this.showQueuePlanSummary(item, planTarihi, planlananMiktar);
    }

    /**
     * Kuyruk planlama özet modal'ını gösterir
     */
    async showQueuePlanSummary(item, planTarihi, planlananMiktar) {
        const summaryModal = document.getElementById('queuePlanSummaryModal');
        if (!summaryModal) return;
        
        const loadingDiv = summaryModal.querySelector('#queuePlanSummaryLoading');
        const contentDiv = summaryModal.querySelector('#queuePlanSummaryContent');
        
        // Loading göster
        loadingDiv.style.display = 'block';
        contentDiv.style.display = 'block';
        summaryModal.style.display = 'block';
        
        try {
            // Makine seçimini al (dropdown veya radio button)
            const selectedMachines = {};
            const queuePlanInputMakine = summaryModal.querySelector('#queuePlanInputMakine');
            const selectedMachineInput = document.querySelector('input[name="selectedMachine"]:checked');
            const selectedMachine = queuePlanInputMakine ? queuePlanInputMakine.value : 
                                   (selectedMachineInput ? selectedMachineInput.value : null);
            if (selectedMachine) {
                selectedMachines[item.isemriId] = selectedMachine;
            }
            
            // Preview endpoint'ini çağır
            const response = await fetch('/api/planning/queue-plan-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isemriNo: item.isemriNo,
                    anchorIsemriId: item.isemriId,
                    planTarihi,
                    planlananMiktar,
                    selectedMachines
                })
            });
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Özet hazırlanamadı');
            }
            
            // Özet verilerini sakla (onaylandığında kullanılacak)
            const queuePlanInputAciklama = summaryModal.querySelector('#queuePlanInputAciklama');
            const queuePlanningAciklama = document.querySelector('#queuePlanningAciklama');
            const aciklama = queuePlanInputAciklama?.value || queuePlanningAciklama?.value || '';
            this.queuePlanSummaryData = {
                item: { ...item, aciklama: aciklama },
                planTarihi,
                planlananMiktar,
                selectedMachines,
                plannedStages: result.data.plannedStages
            };
            
            // Modal içeriğini doldur
            this.populateQueuePlanSummary(summaryModal, item, planlananMiktar, result.data.plannedStages);
            
            // Loading gizle, içeriği göster
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            
        } catch (error) {
            console.error('Özet hazırlama hatası:', error);
            window.planningApp.showError('Özet hazırlanırken hata oluştu: ' + error.message);
            summaryModal.style.display = 'none';
        }
    }

    /**
     * Kuyruk planlama özet modalında ağırlık ve süre bilgilerini günceller
     * @param {Object} item - İş emri verisi
     */
    updateSummaryWeightAndTime(item) {
        const miktarInput = document.getElementById('queuePlanInputMiktar');
        const agirlikSpan = document.getElementById('summaryToplamAgirlik');
        const sureSpan = document.getElementById('summaryToplamSure');
        
        if (!miktarInput || !agirlikSpan || !sureSpan) return;
        
        const planlananMiktar = parseFloat(miktarInput.value) || 0;
        
        if (planlananMiktar <= 0) {
            agirlikSpan.textContent = '-';
            sureSpan.textContent = '-';
            return;
        }
        
        // Tablodaki değerler zaten toplam değerler (planMiktar için)
        // Yeni miktar için orantılı olarak güncelle
        const referansMiktar = item.siparisMiktarHesaplanan || 1;
        const tablodakiToplamAgirlik = item.agirlik || 0; // Tablodaki toplam ağırlık (KG)
        const tablodakiToplamSure = item.toplamSure || 0; // Tablodaki toplam süre (saat)
        
        // Oran hesapla: yeni miktar / referans miktar
        const oran = referansMiktar > 0 ? (planlananMiktar / referansMiktar) : 1;
        
        // Yeni toplam değerler = tablodaki toplam değerler × oran
        const yeniToplamAgirlik = tablodakiToplamAgirlik * oran;
        const yeniToplamSure = tablodakiToplamSure * oran;
        
        // Değerleri formatla ve göster
        if (yeniToplamAgirlik > 0) {
            agirlikSpan.textContent = `${yeniToplamAgirlik.toFixed(1)} KG`;
        } else {
            agirlikSpan.textContent = '-';
        }
        
        if (yeniToplamSure > 0) {
            sureSpan.textContent = `${yeniToplamSure.toFixed(2)} SAAT`;
        } else {
            sureSpan.textContent = '-';
        }
    }

    /**
     * Kuyruk planlama özet modal içeriğini doldurur
     */
    populateQueuePlanSummary(modal, item, planlananMiktar, plannedStages) {
        // Bilgileri göster (isemriNo zaten gösteriliyor)
        const isemriNoSpan = modal.querySelector('#summaryIsemriNo');
        if (isemriNoSpan) isemriNoSpan.textContent = item.isemriNo || '-';
        
        // Planlanan miktar input'unu güncelle (zaten form'da var)
        const miktarInput = modal.querySelector('#queuePlanInputMiktar');
        if (miktarInput && miktarInput.value !== planlananMiktar.toString()) {
            miktarInput.value = planlananMiktar;
        }
        
        // Aşamalardaki miktar input'larını güncelle
        const stageQuantityInputs = modal.querySelectorAll('.stage-quantity-input');
        if (stageQuantityInputs.length > 0) {
                    // Anchor aşamasını bul
                    const anchorInput = modal.querySelector('.stage-quantity-input[data-is-anchor="true"]');
                    
                    if (!anchorInput) {
                        // Anchor bulunamazsa eski mantıkla devam et
                        stageQuantityInputs.forEach(input => {
                    input.value = planlananMiktar;
                        });
                    } else {
                        // Anchor aşamasının figür sayısını al
                        const anchorFigurSayisi = parseFloat(anchorInput.getAttribute('data-figur-sayisi')) || 1;
                        
                        // Toplam iş emri miktarını hesapla: anchor_miktarı * anchor_figür_sayısı
                const toplamIsemriMiktari = planlananMiktar * anchorFigurSayisi;
                        
                        // Tüm aşamalardaki miktar input'larını güncelle
                stageQuantityInputs.forEach((input) => {
                            const figurSayisi = parseFloat(input.getAttribute('data-figur-sayisi')) || 1;
                            // Aşama miktarı = toplam iş emri miktarı / aşama figür sayısı
                            const stageMiktar = Math.ceil(toplamIsemriMiktari / figurSayisi);
                            input.value = stageMiktar;
                        });
            }
                    }
                    
                    // Ağırlık ve süre değerlerini güncelle
        this.updateSummaryWeightAndTime(item);
        
        // Aşamaları listele
        const stagesList = modal.querySelector('#queuePlanStagesList');
        if (!stagesList) return;
        
        let html = '<table style="width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px;">';
        html += '<thead><tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-bottom: 2px solid #5a67d8;">';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px; width: 50px;"><input type="checkbox" id="selectAllStages" checked style="width: 18px; height: 18px; cursor: pointer;" /></th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Aşama</th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Bölüm</th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Makine</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Planlanan Tarih</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Miktar</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Durum</th>';
        html += '</tr></thead><tbody>';
        
        plannedStages.forEach((stage, index) => {
            const isAnchor = stage.isAnchor;
            const isAlreadyPlanned = stage.isAlreadyPlanned || false;
            const rowBgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            const rowStyle = isAnchor 
                ? `background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); font-weight: 600; border-left: 4px solid #2196f3;` 
                : `background-color: ${rowBgColor};`;
            const statusBadge = isAlreadyPlanned 
                ? '<span style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3); display: inline-block;">Planlandı</span>'
                : '<span style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3); display: inline-block;">Yeni Plan</span>';
            
            html += `<tr style="${rowStyle} border-bottom: 1px solid #e0e0e0; transition: background-color 0.2s ease;" data-stage-index="${index}">`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <input type="checkbox" 
                       class="stage-checkbox" 
                       data-isemri-id="${stage.isemriId}"
                       data-isemri-sira="${stage.isemriSira || 0}"
                       data-plan-id="${stage.planId || ''}"
                       checked
                       style="width: 18px; height: 18px; cursor: pointer;" />
            </td>`;
            html += `<td style="padding: 12px 15px; color: #2d3748; font-size: 13px; vertical-align: middle; word-wrap: break-word; word-break: break-word; max-width: 200px; white-space: normal; line-height: 1.4;">${stage.malhizKodu || '-'}</td>`;
            html += `<td style="padding: 12px 15px; color: #4a5568; font-size: 13px; vertical-align: middle;">${stage.bolumAdi || '-'}</td>`;
            html += `<td style="padding: 12px 15px; vertical-align: middle;">
                <select class="stage-machine-input" 
                       data-isemri-id="${stage.isemriId}"
                       data-plan-id="${stage.planId || ''}"
                       data-bolum-adi="${stage.bolumAdi || ''}"
                       style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 6px; background-color: white; cursor: pointer; font-size: 13px; color: #2d3748; font-family: inherit; box-sizing: border-box;">
                    <option value="${stage.makAd || ''}" selected>${stage.makAd || 'Makine seçin...'}</option>
                </select>
            </td>`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <input type="date" 
                       class="stage-date-input" 
                       data-isemri-id="${stage.isemriId}"
                       data-isemri-sira="${stage.isemriSira || 0}"
                       data-plan-id="${stage.planId || ''}"
                       data-original-date="${stage.planTarihi}"
                       data-is-already-planned="${isAlreadyPlanned}"
                       value="${stage.planTarihi}" 
                       style="padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; color: #2d3748; font-family: inherit; text-align: center; cursor: pointer; transition: border-color 0.2s ease; box-sizing: border-box; min-width: 140px;" 
                       onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';" 
                       onblur="this.style.borderColor='#cbd5e0'; this.style.boxShadow='none';" />
            </td>`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <input type="number" 
                       class="stage-quantity-input" 
                       data-isemri-id="${stage.isemriId}"
                       data-plan-id="${stage.planId || ''}"
                       data-original-quantity="${stage.planlananMiktar || ''}"
                       data-figur-sayisi="${stage.figurSayisi || 1}"
                       data-is-anchor="${isAnchor ? 'true' : 'false'}"
                       value="${stage.planlananMiktar || ''}" 
                       min="1"
                       style="width: 90px; padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; color: #2d3748; font-family: inherit; text-align: center; transition: border-color 0.2s ease; box-sizing: border-box;" 
                       onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';" 
                       onblur="this.style.borderColor='#cbd5e0'; this.style.boxShadow='none';" />
            </td>`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">${statusBadge}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        stagesList.innerHTML = html;
        
        // Her aşama için makine dropdown'ını doldur
        this.populateStageMachineDropdowns(modal, plannedStages);
        
        // Checkbox değişikliklerini dinle - satır görünümünü güncelle
        const checkboxes = stagesList.querySelectorAll('.stage-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const row = this.closest('tr');
                if (row) {
                    if (this.checked) {
                        row.style.opacity = '1';
                        row.style.pointerEvents = 'auto';
                    } else {
                        row.style.opacity = '0.5';
                        row.style.pointerEvents = 'none';
                    }
                }
            });
            // İlk yüklemede görünümü ayarla
            const row = checkbox.closest('tr');
            if (row && !checkbox.checked) {
                row.style.opacity = '0.5';
                row.style.pointerEvents = 'none';
            }
        });
        
        // "Tümünü seç" checkbox'ı için event listener
        const selectAllCheckbox = modal.querySelector('#selectAllStages');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const checkboxes = stagesList.querySelectorAll('.stage-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                    const row = checkbox.closest('tr');
                    if (row) {
                        if (this.checked) {
                            row.style.opacity = '1';
                            row.style.pointerEvents = 'auto';
                        } else {
                            row.style.opacity = '0.5';
                            row.style.pointerEvents = 'none';
                        }
                    }
                });
            });
        }
    }

    /**
     * Tüm aşamaları seç/seçimi kaldır
     */
    toggleAllStages(checked) {
        const checkboxes = document.querySelectorAll('#queuePlanStagesList .stage-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
    }

    /**
     * Kuyruk planlama özetini onaylar ve gerçek planlamayı yapar
     */
    async confirmQueuePlan() {
        if (!this.queuePlanSummaryData) {
            window.planningApp.showError('Özet verisi bulunamadı');
            return;
        }
        
        const summaryModal = document.getElementById('queuePlanSummaryModal');
        if (!summaryModal) return;
        
        // Açıklama alanını al ve güncelle
        const aciklamaInput = summaryModal.querySelector('#queuePlanInputAciklama');
        const aciklama = aciklamaInput ? (aciklamaInput.value || '').trim() : '';
        if (this.queuePlanSummaryData && this.queuePlanSummaryData.item) {
            this.queuePlanSummaryData.item.aciklama = aciklama;
        }
        
        // Güncellenmiş planlanan miktarı al
        const miktarInput = summaryModal.querySelector('#summaryPlanlananMiktarInput');
        let updatedPlanlananMiktar = miktarInput ? parseInt(miktarInput.value) : this.queuePlanSummaryData.planlananMiktar;
        // NaN kontrolü
        if (isNaN(updatedPlanlananMiktar)) {
            updatedPlanlananMiktar = this.queuePlanSummaryData.planlananMiktar || 0;
        }
        
        // Seçili checkbox'ları al
        const checkedBoxes = summaryModal.querySelectorAll('.stage-checkbox:checked');
        if (checkedBoxes.length === 0) {
            window.planningApp.showWarning('Lütfen en az bir aşama seçin');
            return;
        }
        
        // Seçili aşamaların isemriId'lerini topla
        const selectedIsemriIds = new Set();
        checkedBoxes.forEach(checkbox => {
            selectedIsemriIds.add(checkbox.dataset.isemriId);
        });
        
        // Modal'dan güncellenmiş verileri al (sadece seçili aşamalar için)
        const machineInputs = summaryModal.querySelectorAll('.stage-machine-input');
        const dateInputs = summaryModal.querySelectorAll('.stage-date-input');
        const quantityInputs = summaryModal.querySelectorAll('.stage-quantity-input');
        
        const updatedSelectedMachines = {};
        const updatedStages = [];
        const stageQuantities = {};
        const stagePlanIds = {}; // Plan ID'leri sakla
        const quantityChangedFlags = {}; // Miktar değişiklik flag'leri
        
        // Makine, tarih ve miktar bilgilerini topla (sadece seçili aşamalar için)
        machineInputs.forEach(input => {
            const isemriId = input.dataset.isemriId;
            if (!selectedIsemriIds.has(isemriId)) return; // Seçili değilse atla
            
            const planId = input.dataset.planId;
            const makAd = input.value.trim();
            if (makAd) {
                updatedSelectedMachines[isemriId] = makAd;
            }
            if (planId) {
                stagePlanIds[isemriId] = planId;
            }
        });
        
        dateInputs.forEach(input => {
            const isemriId = input.dataset.isemriId;
            if (!selectedIsemriIds.has(isemriId)) return; // Seçili değilse atla
            
            const planId = input.dataset.planId;
            const originalDate = input.dataset.originalDate;
            const planTarihi = input.value;
            const isChanged = planTarihi !== originalDate;
            updatedStages.push({ 
                isemriId, 
                planTarihi,
                planId: planId || null,
                isChanged,
                originalDate
            });
            if (planId) {
                stagePlanIds[isemriId] = planId;
            }
        });
        
        quantityInputs.forEach(input => {
            const isemriId = input.dataset.isemriId;
            if (!selectedIsemriIds.has(isemriId)) return; // Seçili değilse atla
            
            const planId = input.dataset.planId;
            const originalQuantity = parseInt(input.dataset.originalQuantity) || 0;
            const miktar = parseInt(input.value);
            // NaN kontrolü
            if (isNaN(miktar) || miktar <= 0) {
                return; // Geçersiz miktar, bu aşamayı atla
            }
            const isChanged = miktar !== originalQuantity;
            quantityChangedFlags[isemriId] = isChanged;
            stageQuantities[isemriId] = miktar;
            if (planId) {
                stagePlanIds[isemriId] = planId;
            }
        });
        
        // Eğer hiçbir aşama için miktar girilmemişse, genel miktarı kontrol et ve kullan
        const hasStageQuantities = Object.keys(stageQuantities).length > 0;
        if (!hasStageQuantities) {
            if (!updatedPlanlananMiktar || updatedPlanlananMiktar <= 0) {
                window.planningApp.showWarning('Planlanan miktar geçerli bir değer olmalıdır');
                return;
            }
        }
        
        const finalPlanlananMiktar = hasStageQuantities ? null : updatedPlanlananMiktar;
        
        // Özet modal'ı kapat
        summaryModal.style.display = 'none';
        
        // Planlama modal'ını da kapat
        const planningModal = document.getElementById('planningModal');
        if (planningModal) {
            planningModal.style.display = 'none';
        }
        
        // Seçili aşamaların isemriId listesini array olarak hazırla
        const selectedIsemriIdsArray = Array.from(selectedIsemriIds);
        
        // Güncellenmiş verilerle gerçek planlamayı yap
        await this.submitQueueFullPlanWithData(
            this.queuePlanSummaryData.item,
            this.queuePlanSummaryData.planTarihi,
            finalPlanlananMiktar,
            updatedSelectedMachines,
            stageQuantities,
            updatedStages,
            stagePlanIds,
            quantityChangedFlags,
            selectedIsemriIdsArray
        );
        
        // Özet verisini temizle
        this.queuePlanSummaryData = null;
    }

    /**
     * Kuyruk planlamayı belirtilen verilerle yapar
     */
    async submitQueueFullPlanWithData(item, planTarihi, planlananMiktar, selectedMachines, stageQuantities, stageDates, stagePlanIds, quantityChangedFlags, selectedIsemriIds = null) {
        try {
            if (this.isSubmittingQueuePlan) {
                return;
            }
            
            this.isSubmittingQueuePlan = true;
            this.showProgressBar('Kuyruk planlama yapılıyor...');
            
            // NaN kontrolü - planlananMiktar
            if (planlananMiktar !== null && planlananMiktar !== undefined && isNaN(planlananMiktar)) {
                planlananMiktar = null;
            }
            
            // Stage dates'i object formatına çevir (sadece değiştirilen tarihleri gönder)
            const stageDatesObj = {};
            const stageChangedFlags = {};
            if (stageDates && Array.isArray(stageDates)) {
                stageDates.forEach(stage => {
                    if (stage.isemriId && stage.planTarihi) {
                        // Sadece değiştirilen tarihleri gönder
                        if (stage.isChanged) {
                            stageDatesObj[stage.isemriId] = stage.planTarihi;
                        }
                        stageChangedFlags[stage.isemriId] = stage.isChanged || false;
                    }
                });
            }
            
            // stageQuantities'deki NaN değerleri temizle
            const cleanedStageQuantities = {};
            if (stageQuantities && typeof stageQuantities === 'object') {
                Object.keys(stageQuantities).forEach(key => {
                    const value = stageQuantities[key];
                    if (value !== null && value !== undefined && !isNaN(value) && value > 0) {
                        cleanedStageQuantities[key] = parseInt(value);
                    }
                });
            }
            
            // Quantity changed flags'leri de ekle
            const allChangedFlags = { ...stageChangedFlags, ...quantityChangedFlags };
            
            const payload = {
                isemriNo: item.isemriNo,
                anchorIsemriId: item.isemriId,
                planTarihi,
                planlananMiktar: planlananMiktar !== null && !isNaN(planlananMiktar) ? parseInt(planlananMiktar) : null,
                selectedMachines: selectedMachines || {},
                stageQuantities: cleanedStageQuantities,
                stageDates: stageDatesObj,
                stagePlanIds: stagePlanIds || {},
                stageChangedFlags: allChangedFlags,
                selectedIsemriIds: selectedIsemriIds || null, // Seçili aşamaların listesi
                aciklama: item.aciklama || '' // Açıklama (queuePlanSummaryData'dan gelir)
            };
            
            this.updateProgressBar(20, 'Aşamalar analiz ediliyor...');
            
            const resp = await fetch('/api/planning/queue-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            this.updateProgressBar(60, 'Planlar oluşturuluyor...');
            
            const result = await resp.json();
            if (!result.success) throw new Error(result.message || 'Kuyruk planlama başarısız');
            
            const currentFilters = this.preserveFilters();
            this.updateProgressBar(85, 'Tablolar güncelleniyor...');
            
            const plannedStages = result.data?.plannedStages || [];
            const isemriIds = plannedStages.map(s => s.isemriId);
            
            // Veritabanından yeni planlama verilerini çek
            if (isemriIds.length > 0) {
                try {
                    const refreshResponse = await fetch('/api/data', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (refreshResponse.ok) {
                        const refreshResult = await refreshResponse.json();
                        if (refreshResult.data && Array.isArray(refreshResult.data)) {
                            // Güncellenen kayıtları bul
                            const updatedRecords = [];
                            for (const isemriId of isemriIds) {
                                const newRecord = refreshResult.data.find(d => d.isemriId === isemriId);
                                if (newRecord) {
                                    updatedRecords.push(newRecord);
                                }
                            }
                            
                            if (updatedRecords.length > 0) {
                                // Cache'i güncelle
                                await window.planningApp.databaseService.updateCacheRecords(updatedRecords);
                                
                                // Veriyi güncelle
                                updatedRecords.forEach(newRecord => {
                                    const index = window.planningApp.data.findIndex(d => d.isemriId === newRecord.isemriId);
                                    if (index !== -1) {
                                        window.planningApp.data[index] = newRecord;
                                    }
                                });
                                
                                // Tabloyu güncelle
                                this.updateProgressBar(95, 'Son güncellemeler yapılıyor...');
                                await window.planningApp.ultraFastUpdate(updatedRecords, 'update');
                                
                                // Grid'i güncelle
                                this.updateGridRows();
                            }
                        }
                    }
                } catch (refreshError) {
                    console.error('Veri yenileme hatası:', refreshError);
                    // Hata olsa bile devam et
                }
            }
            
            this.hideProgressBar();
            window.planningApp.showSuccess('Kuyruk planlama tamamlandı');
            
            this.isSubmittingQueuePlan = false;
        } catch (error) {
            console.error('Kuyruk planlama hatası:', error);
            this.hideProgressBar();
            window.planningApp.showError('Kuyruk planlama hatası: ' + error.message);
            this.isSubmittingQueuePlan = false;
        }
    }

    /**
     * Makine kontrolü yapar ve modal'ı açar
     * @param {Object} item - Seçilen iş emri verisi
     * @param {HTMLElement} modal - Modal elementi
     */
    async checkMachineAndOpenModal(item, modal) {
        try {
            const makineAdi = item.makAd || item.makinaAdi;
            
            if (!makineAdi) {
                this.openNormalPlanningModal(item, modal);
                return;
            }
            
            // Tüm bölümler için normal modal'ı aç (makine seçimi içinde gösterilecek)
            // Maça bölümü için üst makine kontrolü yap
            const isMaca = this.isMacaBolumu({ bolumAdi: item.bolumAdi, makAd: makineAdi });
            
            if (isMaca) {
            // Makine tipini kontrol et
            const machineInfo = await window.planningApp.checkMachineType(makineAdi);
            
            if (machineInfo.isUpperMachine) {
                // Üst makine - alt makineleri göster
                await this.openUpperMachinePlanningModal(item, modal, machineInfo);
            } else {
                // Normal makine
                    await this.openNormalPlanningModal(item, modal);
                }
            } else {
                // Diğer bölümler için normal modal
                await this.openNormalPlanningModal(item, modal);
            }
            
        } catch (error) {
            console.error('Makine kontrolü hatası:', error);
            // Hata durumunda normal modal'ı aç
            this.openNormalPlanningModal(item, modal);
        }
    }
    
    /**
     * Normal planlama modal'ını açar
     * @param {Object} item - Seçilen iş emri verisi
     * @param {HTMLElement} modal - Modal elementi
     */
    async openNormalPlanningModal(item, modal) {
        // Önce makine seçim alanını temizle
        const existingMachineField = modal.querySelector('#machineSelectionField');
        if (existingMachineField) {
            existingMachineField.remove();
        }
        
        // Normal planlama tab'ını güncelle
        this.populateNormalPlanningTab(modal, item);
        
        // Tüm bölümler için makine seçimi ekle
        await this.addMachineSelectionForAllDepartments(modal, item);
        
        // Normal tab'a geç
        this.switchPlanningTab('normal');
        
        // Modal'ı göster
        modal.style.display = 'block';
    }
    
    /**
     * Tüm bölümler için makine seçimi ekler
     */
    async addMachineSelectionForAllDepartments(modal, item) {
        if (!window.planningApp) return;
        
        try {
            const bolumAdi = item.bolumAdi || '';
            const makAd = item.makAd || '';
            
            // Bölüm için makineleri al
            let machines = [];
            let machineInfo = null;
            
            // Maça bölümü kontrolü
            const isMaca = this.isMacaBolumu(item);
            if (isMaca && makAd) {
                // Maça için üst makine kontrolü yap
                machineInfo = await window.planningApp.checkMachineType(makAd);
                if (machineInfo && machineInfo.isUpperMachine && machineInfo.subMachines) {
                    machines = machineInfo.subMachines;
                } else {
                    // Alt makine veya direkt makine
                    machines = [{ makAd: makAd }];
                    machineInfo = { subMachines: machines };
                }
            } else {
                // Diğer bölümler için bölüm makinelerini al
                const bolumMachines = await this.getMachinesForBolum(bolumAdi);
                if (bolumMachines.length > 0) {
                    machines = bolumMachines.map(m => ({ makAd: m }));
                    machineInfo = { subMachines: machines };
                } else if (makAd) {
                    machines = [{ makAd: makAd }];
                    machineInfo = { subMachines: machines };
                }
            }
            
            if (machines.length > 0 && machineInfo) {
                // Seçilen tarihi al
                const tarihField = modal.querySelector('#planningTarih');
                const selectedDate = tarihField ? tarihField.value : null;
                
                // Makine durumlarını al
                const machineNames = machines.map(m => m.makAd);
                const availabilityData = await window.planningApp.checkMultipleMachineAvailability(machineNames, selectedDate);
                
                // Default makineyi belirle
                const defaultMachine = item.selectedMachine || item.makAd || machines[0].makAd;
                
                // Makine seçim alanını ekle
                await this.addMachineSelectionField(modal, machineInfo, availabilityData, defaultMachine, selectedDate);
            }
        } catch (error) {
            console.error('Makine seçimi ekleme hatası:', error);
        }
    }

    /**
     * Kuyruk tam planlamayı gönderir
     */
    async submitQueueFullPlan(item) {
        try {
            // Çift submit'i engelle
            if (this.isSubmittingQueuePlan) {
                return;
            }
            
            this.isSubmittingQueuePlan = true;
            
            const planningModal = document.getElementById('planningModal');
            // Önce tab'dan değerleri al, yoksa normal form'dan al
            let planTarihi = null;
            let planlananMiktar = null;
            
            if (planningModal) {
                const queuePlanningMiktar = planningModal.querySelector('#queuePlanningMiktar');
                const queuePlanningBaslangicTarih = planningModal.querySelector('#queuePlanningBaslangicTarih');
                const planningMiktar = planningModal.querySelector('#planningMiktar');
                const planningTarih = planningModal.querySelector('#planningTarih');
                
                // Tab'dan değerleri al
                if (queuePlanningMiktar && queuePlanningMiktar.value) {
                    planlananMiktar = parseInt(queuePlanningMiktar.value);
                } else if (planningMiktar && planningMiktar.value) {
                    planlananMiktar = parseInt(planningMiktar.value);
                }
                
                if (queuePlanningBaslangicTarih && queuePlanningBaslangicTarih.value) {
                    planTarihi = queuePlanningBaslangicTarih.value;
                } else if (planningTarih && planningTarih.value) {
                    planTarihi = planningTarih.value;
                }
            } else {
                // Fallback: eski yöntem
                planTarihi = document.getElementById('planningTarih')?.value;
                planlananMiktar = parseInt(document.getElementById('planningMiktar')?.value || 0);
            }

            if (!planlananMiktar) {
                window.planningApp.showWarning('Planlanan miktar gerekli');
                this.isSubmittingQueuePlan = false;
                return;
            }

            // Maça için seçilmiş alt makine varsa onu anchor için gönderiyoruz
            const selectedMachines = {};
            const selectedMachineInput = document.querySelector('input[name="selectedMachine"]:checked');
            if (selectedMachineInput) {
                // Anchor aşamanın ISEMRI_ID'si item.isemriId
                selectedMachines[item.isemriId] = selectedMachineInput.value;
            }

            // Progress bar göster
            this.showProgressBar('Kuyruk tam planlama başlatılıyor...');

            const payload = {
                isemriNo: item.isemriNo,
                anchorIsemriId: item.isemriId,
                planTarihi,
                planlananMiktar,
                selectedMachines
            };

            this.updateProgressBar(20, 'Aşamalar analiz ediliyor...');
            
            const resp = await fetch('/api/planning/queue-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            this.updateProgressBar(60, 'Planlar oluşturuluyor...');
            
            const result = await resp.json();
            if (!result.success) throw new Error(result.message || 'Kuyruk planlama başarısız');
            
            // Filtreleri koru
            const currentFilters = this.preserveFilters();
            
            this.updateProgressBar(85, 'Tablolar güncelleniyor...');
            
            // Tüm stage'leri tek seferde güncelle (her aşama için ayrı ana kayıt)
            const plannedStages = result.data?.plannedStages || [];
            if (plannedStages.length > 0 && window.planningApp) {
                // Her aşama için ayrı ana kayıt bulup sadece kendi breakdown'ını ekle
                const updateRecords = [];
                
                plannedStages.forEach((st, idx) => {
                    // Her aşama için ana kaydı bul (isemriId ile)
                    const mainRecordIndex = window.planningApp.data.findIndex(rec => rec.isemriId === st.isemriId);
                    
                    if (mainRecordIndex !== -1) {
                        const mainRecord = window.planningApp.data[mainRecordIndex];
                        
                        // Ana kaydın breakdown'larını başlat
                        if (!mainRecord.breakdowns || !Array.isArray(mainRecord.breakdowns)) {
                            mainRecord.breakdowns = [];
                        }
                        
                        // Bu aşama için breakdown zaten var mı kontrol et
                        const existingBreakdown = mainRecord.breakdowns.find(
                            brk => brk.isemriId === st.isemriId && 
                                   brk.planTarihi === st.planTarihi &&
                                   brk.planlananMiktar === planlananMiktar
                        );
                        
                        if (!existingBreakdown) {
                            // Yeni breakdown ekle (sadece bu aşama için)
                            mainRecord.breakdowns.push({
                                planId: `queue-${st.isemriId}-${Date.now()}-${idx}`,
                                parcaNo: mainRecord.breakdowns.length + 1,
                                planTarihi: st.planTarihi,
                                planlananMiktar: planlananMiktar,
                                durum: 'Planlandı',
                                makAd: st.makAd,
                                isemriId: st.isemriId,
                                isemriSira: st.isemriSira
                            });
                        }
                        
                        // Toplam planlanan miktarı hesapla (sadece bu aşamanın breakdown'ları)
                        const totalPlanned = mainRecord.breakdowns
                            .filter(b => b.durum === 'Planlandı')
                            .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
                        
                        mainRecord.totalPlanned = totalPlanned;
                        mainRecord.totalWaiting = Math.max(0, (mainRecord.siparisMiktar || mainRecord.planMiktar || 0) - totalPlanned);
                        mainRecord.planlananMiktar = totalPlanned;
                        
                        // Durumu güncelle
                        const siparisMiktar = mainRecord.siparisMiktar || mainRecord.planMiktar || 0;
                        if (totalPlanned === 0) {
                            mainRecord.durum = 'Beklemede';
                        } else if (totalPlanned < siparisMiktar) {
                            mainRecord.durum = 'Kısmi Planlandı';
                        } else {
                            mainRecord.durum = 'Planlandı';
                        }
                        
                        // Planlanan tarihi güncelle (bu aşamanın breakdown'larındaki en son tarih)
                        const dates = mainRecord.breakdowns
                            .map(b => b.planTarihi)
                            .filter(Boolean)
                            .sort((a, b) => new Date(b) - new Date(a));
                        mainRecord.planlananTarih = dates.length > 0 ? dates[0] : null;
                        
                        // PlanId ve selectedMachine güncelle
                        const firstPlan = mainRecord.breakdowns.find(b => b.durum === 'Planlandı');
                        if (firstPlan) {
                            mainRecord.planId = firstPlan.planId;
                            mainRecord.selectedMachine = firstPlan.makAd;
                        }
                        
                        // Güncelleme kaydı ekle
                        const updateRecord = {
                            isemriId: st.isemriId,
                            planTarihi: st.planTarihi,
                            planlananMiktar: planlananMiktar,
                            selectedMachine: st.makAd,
                            isBreakdown: false,
                            planningData: {
                                breakdowns: mainRecord.breakdowns.map(brk => ({
                                    ...brk,
                                    // planTarihi değerini açıkça koru
                                    planTarihi: brk.planTarihi || st.planTarihi || null
                                })),
                                totalPlanned: totalPlanned,
                                totalWaiting: mainRecord.totalWaiting,
                                status: mainRecord.durum
                            }
                        };
                        
                        updateRecords.push(updateRecord);
                    }
                });
                
                // Tüm güncellemeleri ultraFastUpdate ile yap (içinde chart güncellemesi de var)
                if (updateRecords.length > 0) {
                    await window.planningApp.ultraFastUpdate(updateRecords);
                    // ultraFastUpdate içinde zaten chart güncellemesi yapılıyor, tekrar yapmaya gerek yok
                }
            }
            
            this.updateProgressBar(95, 'Filtreler geri yükleniyor...');
            
            // Filtreleri geri yükle
            if (currentFilters) {
                await this.restoreFilters(currentFilters);
                
                // Filtreler geri yüklendikten sonra grid'i güncelle
                this.updateGrid();
            }
            
            this.updateProgressBar(100, 'Tamamlandı! ✅');
            // Kısa bir delay - kullanıcının mesajı görmesi için
            await new Promise(resolve => setTimeout(resolve, 200));
            this.hideProgressBar();

            window.planningApp.showSuccess('Kuyruk tam planlama tamamlandı');
            const modal = document.getElementById('planningModal');
            if (modal) modal.style.display = 'none';
            this.isSubmittingQueuePlan = false;
        } catch (err) {
            console.error('Kuyruk planlama hatası:', err);
            this.hideProgressBar();
            window.planningApp.showError('Kuyruk planlama hatası: ' + err.message);
            this.isSubmittingQueuePlan = false;
        }
    }
    
    /**
     * Üst makine için planlama modal'ını açar
     * @param {Object} item - Seçilen iş emri verisi
     * @param {HTMLElement} modal - Modal elementi
     * @param {Object} machineInfo - Makine bilgileri
     */
    async openUpperMachinePlanningModal(item, modal, machineInfo) {
        console.log('🏭 Üst makine modal açılıyor:', { item, machineInfo });
        
        // Bilgi alanlarını doldur
        document.getElementById('planningIsemriNo').value = item.isemriNo || '';
        document.getElementById('planningMalhizKodu').value = item.malhizKodu || '';
        document.getElementById('planningMalzeme').value = item.imalatTuru || '';
        document.getElementById('planningOnerilenTeslim').value = item.onerilenTeslimTarih ? 
            new Date(item.onerilenTeslimTarih).toLocaleDateString('tr-TR') : '';
        
        // Planlama alanlarını doldur
        const onerilenTeslim = item.onerilenTeslimTarih;
        let defaultTarih = '';
        if (onerilenTeslim) {
            const teslimTarihi = new Date(onerilenTeslim);
            const planlananTarih = new Date(teslimTarihi);
            planlananTarih.setDate(teslimTarihi.getDate() - 7);
            defaultTarih = planlananTarih.toISOString().split('T')[0];
        }
        document.getElementById('planningTarih').value = defaultTarih;
        
        const siparisMiktarDefault = Math.ceil(Number(item.siparisMiktarHesaplanan || 0));
        const providedBreakdownAmount = (typeof item.planlananMiktar === 'number') ? item.planlananMiktar : Number(item.planlananMiktar);
        const defaultAmount = (providedBreakdownAmount && providedBreakdownAmount > 0)
            ? providedBreakdownAmount
            : siparisMiktarDefault;
        document.getElementById('planningMiktar').value = isNaN(defaultAmount) ? '' : defaultAmount;
        
        // Alt makinelerin boşluk durumunu kontrol et
        const subMachineNames = machineInfo.subMachines.map(sub => sub.makAd);
        
        try {
            const availabilityData = await window.planningApp.checkMultipleMachineAvailability(subMachineNames);
            console.log('✅ Boşluk durumu verileri alındı:', availabilityData);
            
            // Default makineyi belirle (veritabanından gelen makine varsa onu seç)
            const defaultMachine = this.getDefaultMachineForItem(item, machineInfo.subMachines);
            
            // Seçilen tarihi al
            const tarihField = modal.querySelector('#planningTarih');
            const selectedDate = tarihField ? tarihField.value : null;
            
            // Makine seçim alanını ekle
            await this.addMachineSelectionField(modal, machineInfo, availabilityData, defaultMachine, selectedDate);
            
        } catch (error) {
            console.error('Boşluk durumu kontrolü hatası:', error);
            // Hata durumunda da makine seçim alanını ekle (boş verilerle)
            const tarihField = modal.querySelector('#planningTarih');
            const selectedDate = tarihField ? tarihField.value : null;
            await this.addMachineSelectionField(modal, machineInfo, [], null, selectedDate);
        }
        
        // Miktar değişikliğini dinle
        const miktarInput = document.getElementById('planningMiktar');
        if (miktarInput) {
            miktarInput.addEventListener('input', () => {
                this.updatePlanningResult(item);
            });
        }
        
        // Sonuç alanını güncelle
        this.updatePlanningResult(item);
        
        // Modal'ı göster
        modal.style.display = 'block';
        console.log('✅ Modal gösterildi');
        
        // Form submit event'ini ekle
        const form = document.getElementById('planningForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            const queueCheck = document.getElementById('queueFullPlan');
            if (queueCheck && queueCheck.checked) {
                this.submitQueueFullPlan(item);
            } else {
                this.submitPlanningWithMachineSelection(item);
            }
        };
    }
    
    /**
     * İş emrinin maça bölümüne ait olup olmadığını kontrol eder
     * @param {Object} item - İş emri verisi
     * @returns {boolean} Maça bölümü mü?
     */
    isMacaBolumu(item) {
        const bolumAdi = item.bolumAdi || '';
        const makAd = item.makAd || '';
        
        return bolumAdi.toLowerCase().includes('maça') || 
               makAd.toLowerCase().includes('maça') || 
               makAd.toLowerCase().includes('maca') ||
               makAd.toLowerCase().includes('büyük maça') ||
               makAd.toLowerCase().includes('sıcak maça') ||
               makAd.toLowerCase().includes('maça makinesi') ||
               makAd.toLowerCase().includes('maça grubu') ||
               makAd.toLowerCase().includes('maça tezgah') ||
               makAd.toLowerCase().includes('maça pres');
    }
    
    /**
     * İş emri için default makineyi belirler
     * @param {Object} item - İş emri verisi
     * @param {Array} subMachines - Alt makineler listesi
     * @returns {string|null} Default makine adı
     */
    getDefaultMachineForItem(item, subMachines) {
        // Eğer item'da zaten bir makine seçimi varsa onu kullan
        if (item.selectedMachine) {
            return item.selectedMachine;
        }
        
        // Eğer item'da makAd alt makine ise onu default yap
        const currentMachine = item.makAd;
        const isSubMachine = subMachines.some(sub => sub.makAd === currentMachine);
        
        if (isSubMachine) {
            return currentMachine;
        }
        
        // Yoksa ilk alt makineyi default yap
        if (subMachines.length > 0) {
            return subMachines[0].makAd;
        }
        
        return null;
    }
    
    /**
     * Makine seçim alanını modal'a ekler
     * @param {HTMLElement} modal - Modal elementi
     * @param {Object} machineInfo - Makine bilgileri
     * @param {Array} availabilityData - Boşluk durumu bilgileri
     * @param {string|null} defaultMachine - Default seçili makine
     */
    async addMachineSelectionField(modal, machineInfo, availabilityData, defaultMachine = null, selectedDate = null) {
        
        // Mevcut makine seçim alanını kaldır
        const existingField = modal.querySelector('#machineSelectionField');
        if (existingField) {
            existingField.remove();
        }
        
        // Makine seçim alanını oluştur (dropdown olarak)
        const machineField = document.createElement('div');
        machineField.id = 'machineSelectionField';
        
        const machines = machineInfo.subMachines || [];
        
        // Makine durumlarını güncelle
        await this.updateMachineSelectionOptions(machineField, machines, availabilityData, defaultMachine, selectedDate);
        
        console.log('📍 Makine seçim alanı modal\'a ekleniyor...');
        // Makine seçim alanını uygun tarih alanından sonra ekle
        let tarihField = modal.querySelector('#planningTarih') || modal.querySelector('#yeniTarih');
        if (tarihField && tarihField.parentElement) {
            tarihField.parentElement.insertAdjacentElement('afterend', machineField);
            console.log('✅ Makine seçim alanı eklendi');
            
            // Tarih değişikliğini dinle (önceki listener'ları kaldır)
            const newTarihField = tarihField.cloneNode(true);
            tarihField.parentNode.replaceChild(newTarihField, tarihField);
            newTarihField.addEventListener('change', async () => {
                const newDate = newTarihField.value;
                await this.updateMachineSelectionOptions(machineField, machines, [], defaultMachine, newDate);
            });
        } else {
            console.error('❌ Tarih alanı bulunamadı!');
            // Fallback: modal body'nin sonuna ekle
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.appendChild(machineField);
                console.log('✅ Makine seçim alanı fallback ile eklendi');
            }
        }
    }
    
    /**
     * Makine seçim dropdown'ındaki seçenekleri günceller
     */
    async updateMachineSelectionOptions(machineField, machines, availabilityData, defaultMachine, selectedDate) {
        const machineSelect = machineField.querySelector('#machineSelection');
        const currentValue = machineSelect ? machineSelect.value : null;
        
        // Eğer tarih varsa, o tarihe göre makine durumlarını al
        if (selectedDate && machines.length > 0 && window.planningApp) {
            try {
                const machineNames = machines.map(m => typeof m === 'string' ? m : m.makAd);
                availabilityData = await window.planningApp.checkMultipleMachineAvailability(machineNames, selectedDate);
            } catch (error) {
                console.error('Makine durumu güncelleme hatası:', error);
            }
        }
        
        const options = machines.map((subMachine) => {
            const machineName = typeof subMachine === 'string' ? subMachine : subMachine.makAd;
            const availability = availabilityData.find(av => av.machineName === machineName);
            const isAvailable = availability ? availability.isAvailable : true;
            const firstAvailableDate = availability ? availability.firstAvailableDate : null;
            const plannedJobsCount = availability ? availability.plannedJobsCount : 0;
            const totalPlannedQuantity = availability ? availability.totalPlannedQuantity : 0;
            
            const isDefault = defaultMachine === machineName;
            const isSelected = currentValue === machineName;
            const statusText = isAvailable 
                ? `✓ Boş (${totalPlannedQuantity} adet)` 
                : `⚠ Dolu (${plannedJobsCount} iş, ${totalPlannedQuantity} adet)`;
            
            return `<option value="${machineName}" ${isDefault || isSelected ? 'selected' : ''} data-available="${isAvailable}" data-date="${firstAvailableDate || ''}">${machineName} - ${statusText}</option>`;
        }).join('');
        
        if (machineSelect) {
            machineSelect.innerHTML = options || '<option value="">Makine bulunamadı</option>';
        } else {
            // İlk kez oluşturuluyor
            machineField.innerHTML = `
                <div class="form-group">
                    <div class="form-row">
                        <label for="machineSelection">Makine Seçimi:</label>
                        <select id="machineSelection" name="selectedMachine" style="padding: 10px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 14px; width: 100%;">
                            ${options || '<option value="">Makine bulunamadı</option>'}
                        </select>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Makine seçim alanı için CSS stillerini ekler
     */
    addMachineSelectionStyles() {
        if (document.getElementById('machineSelectionStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'machineSelectionStyles';
        style.textContent = `
            .machine-selection-container {
                margin-top: 10px;
            }
            
            .machine-info {
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 15px;
            }
            
            .machine-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 10px;
            }
            
            .machine-option {
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #f9f9f9;
            }
            
            .machine-option:hover {
                border-color: #3498db;
                background: #f0f8ff;
            }
            
            .machine-option.available {
                border-color: #27ae60;
                background: #f0fff4;
            }
            
            .machine-option.busy {
                border-color: #e74c3c;
                background: #fff5f5;
            }
            
            .machine-option input[type="radio"] {
                margin-right: 10px;
            }
            
            .machine-name {
                font-weight: 600;
                font-size: 14px;
                color: #2c3e50;
                margin-bottom: 5px;
            }
            
            .machine-status {
                margin-bottom: 5px;
            }
            
            .status-available {
                color: #27ae60;
                font-weight: 500;
            }
            
            .status-busy {
                color: #e74c3c;
                font-weight: 500;
            }
            
            .machine-date {
                font-size: 12px;
                color: #7f8c8d;
            }
            
            .machine-option input[type="radio"]:checked + label {
                color: #3498db;
            }
            
            .machine-option:has(input[type="radio"]:checked) {
                border-color: #3498db;
                background: #e3f2fd;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Makine seçimi ile planlama gönderir
     * @param {Object} item - İş emri verisi
     */
    async submitPlanningWithMachineSelection(item) {
        const selectedMachine = document.querySelector('input[name="selectedMachine"]:checked');
        
        if (!selectedMachine) {
            window.planningApp.showWarning('Lütfen bir makine seçin');
            return;
        }
        
        // Seçilen makineyi item'a ekle
        const itemWithSelectedMachine = {
            ...item,
            selectedMachine: selectedMachine.value
        };
        
        console.log('🎯 Seçilen makine ile planlama:', {
            originalMachine: item.makAd,
            selectedMachine: selectedMachine.value,
            item: itemWithSelectedMachine
        });
        
        // Normal planlama fonksiyonunu çağır
        await this.submitPlanning(itemWithSelectedMachine);
    }

    /**
     * Planlama ağırlık ve süre bilgilerini günceller
     * @param {Object} item - Seçilen iş emri verisi
     * @param {string} tabType - 'normal' veya 'queue'
     */
    updatePlanningWeightAndTime(item, tabType) {
        let miktarInput, agirlikInput, sureInput;
        
        if (tabType === 'normal') {
            miktarInput = document.getElementById('planningMiktar');
            agirlikInput = document.getElementById('planningToplamAgirlik');
            sureInput = document.getElementById('planningToplamSure');
        } else if (tabType === 'queue') {
            miktarInput = document.getElementById('queuePlanningMiktar');
            agirlikInput = document.getElementById('queuePlanningToplamAgirlik');
            sureInput = document.getElementById('queuePlanningToplamSure');
        }
        
        if (!miktarInput || !agirlikInput || !sureInput) return;
        
        const planlananMiktar = parseFloat(miktarInput.value) || 0;
        
        if (planlananMiktar <= 0) {
            agirlikInput.value = '-';
            sureInput.value = '-';
            return;
        }
        
        // Tablodaki değerler zaten toplam değerler (planMiktar için)
        // Yeni miktar için orantılı olarak güncelle
        const referansMiktar = item.siparisMiktarHesaplanan || 1;
        const tablodakiToplamAgirlik = item.agirlik || 0; // Tablodaki toplam ağırlık (KG)
        const tablodakiToplamSure = item.toplamSure || 0; // Tablodaki toplam süre (saat)
        
        // Oran hesapla: yeni miktar / referans miktar
        const oran = referansMiktar > 0 ? (planlananMiktar / referansMiktar) : 1;
        
        // Yeni toplam değerler = tablodaki toplam değerler × oran
        const yeniToplamAgirlik = tablodakiToplamAgirlik * oran;
        const yeniToplamSure = tablodakiToplamSure * oran;
        
        // Değerleri formatla ve göster
        if (yeniToplamAgirlik > 0) {
            agirlikInput.value = `${yeniToplamAgirlik.toFixed(1)} KG`;
        } else {
            agirlikInput.value = '-';
        }
        
        if (yeniToplamSure > 0) {
            sureInput.value = `${yeniToplamSure.toFixed(2)} SAAT`;
        } else {
            sureInput.value = '-';
        }
    }

    /**
     * Planlama sonucunu günceller
     * @param {Object} item - Seçilen iş emri verisi
     */
    updatePlanningResult(item) {
        const miktarInput = document.getElementById('planningMiktar');
        if (!miktarInput) return;
        
        const planlananMiktar = parseInt(miktarInput.value) || 0;
        const siparisMiktar = item.siparisMiktarHesaplanan || 0;
        const kalanMiktar = siparisMiktar - planlananMiktar;
        
        // Sonuç alanını oluştur veya güncelle
        let resultDiv = document.getElementById('planningResult');
        if (!resultDiv) {
            resultDiv = document.createElement('div');
            resultDiv.id = 'planningResult';
            resultDiv.className = 'planning-result';
            resultDiv.style.marginTop = '10px';
            resultDiv.style.padding = '10px';
            resultDiv.style.backgroundColor = '#f5f5f5';
            resultDiv.style.borderRadius = '5px';
            resultDiv.style.fontSize = '14px';
            
            // Miktar input'unun yanına ekle
            miktarInput.parentNode.appendChild(resultDiv);
        }
        
        if (planlananMiktar > 0) {
            if (planlananMiktar < siparisMiktar) {
                // Kısmi planlama (yalnız planlanacak miktarı göster)
                resultDiv.innerHTML = `
                    <div style=\"color: #ff9800; font-weight: bold;\">⚠️ Kısmi Planlama</div>
                    <div>• <strong>${planlananMiktar}</strong> adet planlanacak</div>
                `;
                resultDiv.style.border = '2px solid #ff9800';
            } else if (planlananMiktar === siparisMiktar) {
                // Tam planlama
                resultDiv.innerHTML = `
                    <div style="color: #4caf50; font-weight: bold;">✅ Tam Planlama</div>
                    <div>• <strong>${planlananMiktar}</strong> adet planlanacak</div>
                `;
                resultDiv.style.border = '2px solid #4caf50';
            } else {
                // Sipariş miktarından fazla planlama – uyarı ama engelleme yok
                const fazla = planlananMiktar - siparisMiktar;
                resultDiv.innerHTML = `
                    <div style="color: #1976d2; font-weight: bold;">ℹ️ Sipariş Üstü Planlama</div>
                    <div>• <strong>${planlananMiktar}</strong> adet planlanacak (sipariş üstü +${fazla})</div>
                `;
                resultDiv.style.border = '2px solid #1976d2';
            }
        } else {
            resultDiv.innerHTML = '';
            resultDiv.style.border = 'none';
        }
    }
    /**
     * Bir iş emri için kırılım verilerini günceller
     * @param {Object} item - İş emri verisi
     * @param {string} planTarihi - Planlanan tarih
     * @param {number} planlananMiktar - Planlanan miktar
     * @returns {Object} Güncellenmiş kırılım verisi
     */
    updatePlanningDataForItem(item, planTarihi, planlananMiktar, createdPlanId = null, aciklama = null) {
        const siparisMiktar = item.siparisMiktarHesaplanan || 0;
        const isPartialPlanning = planlananMiktar < siparisMiktar;
        
        // ÖNEMLİ: createdPlanId varsa onu kullan, yoksa item.planId kullan (ama "new" değilse)
        const planIdToUse = createdPlanId || (item.planId && item.planId !== 'new' ? item.planId : null);
        
        // Seçilen makineyi al (maça aşaması için)
        const selectedMachine = item.selectedMachine || item.makAd || null;
        
        // Mevcut breakdown'ları al (eğer varsa)
        const existingBreakdowns = (item.breakdowns || []).filter(b => b.durum === 'Planlandı');
        
        // Yeni breakdown oluştur
        const newBreakdown = {
                        planId: planIdToUse,
            parcaNo: existingBreakdowns.length > 0 ? Math.max(...existingBreakdowns.map(b => b.parcaNo || 1)) + 1 : 1,
                        planTarihi: planTarihi,
                        planlananMiktar: planlananMiktar,
                        durum: 'Planlandı',
                        makAd: selectedMachine,
                        selectedMachine: selectedMachine,
                        aciklama: aciklama || null
        };
        
        // Mevcut breakdown'ları koru ve yeni breakdown'ı ekle
        const allBreakdowns = [...existingBreakdowns, newBreakdown];
        const totalPlanned = allBreakdowns.reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
        const totalWaiting = Math.max(0, siparisMiktar - totalPlanned);
        
        if (isPartialPlanning) {
            // Kısmi planlama - mevcut breakdown'ları koru, yeni breakdown'ı ekle
            // Bekleyen kırılım frontend'de dinamik olarak hesaplanacak (appendBreakdownRowsToFragment'te)
            return {
                breakdowns: allBreakdowns,
                totalPlanned: totalPlanned,
                totalWaiting: totalWaiting,
                status: totalPlanned >= siparisMiktar ? 'Planlandı' : 'Kısmi Planlandı'
            };
        } else {
            // Tam planlama - tüm breakdown'ları göster
            return {
                breakdowns: allBreakdowns,
                totalPlanned: totalPlanned,
                totalWaiting: 0,
                status: 'Planlandı'
            };
        }
    }

    /**
     * Parçalama işlemi için kırılım verilerini günceller
     * @param {Object} item - İş emri verisi
     * @param {number} splitMiktar - Bölünen miktar
     * @param {string} yeniTarih - Yeni tarih
     * @returns {Object} Güncellenmiş kırılım verisi
     */
    updatePlanningDataForSplit(item, splitMiktar, yeniTarih, newPlanId, nextParcaNo) {
        const kalanMiktar = item.planlananMiktar - splitMiktar;
        
        // Parçalanan breakdown'ın gerçekleşen miktarını bul
        let splitBreakdownGercekMiktar = 0;
        if (item.breakdowns && Array.isArray(item.breakdowns)) {
            const splitBreakdown = item.breakdowns.find(b => b.planId === item.planId);
            if (splitBreakdown && splitBreakdown.gercekMiktar !== undefined) {
                splitBreakdownGercekMiktar = splitBreakdown.gercekMiktar || 0;
            }
        }
        
        // Mevcut breakdowns varsa, bunları koruyup yeni breakdown'ı ekle
        // Yoksa yeni breakdown'lar oluştur
        let existingBreakdowns = [];
        let existingParcaNo = 1;
        
        if (item.breakdowns && Array.isArray(item.breakdowns) && item.breakdowns.length > 0) {
            // Mevcut breakdown'ları kopyala (parçalanan plan hariç)
            // Parçalanan planı bul ve güncelle
            const splitPlanIndex = item.breakdowns.findIndex(b => b.planId === item.planId);
            
            if (splitPlanIndex !== -1) {
                // Mevcut breakdown içinde parçalanan plan var, güncelle
                existingBreakdowns = [...item.breakdowns];
                // Seçilen makineyi al (maça aşaması için)
                const selectedMachine = item.selectedMachine || existingBreakdowns[splitPlanIndex].makAd || item.makAd || null;
                // Parçalanan planı güncelle (kalan miktar ile)
                existingBreakdowns[splitPlanIndex] = {
                    ...existingBreakdowns[splitPlanIndex],
                    planlananMiktar: kalanMiktar,
                    durum: 'Planlandı',
                    makAd: selectedMachine,
                    selectedMachine: selectedMachine
                };
                // Mevcut parça numarasını al
                existingParcaNo = existingBreakdowns[splitPlanIndex].parcaNo || 1;
            } else {
                // Mevcut breakdown'larda parçalanan plan yok, tümünü koru
                existingBreakdowns = [...item.breakdowns];
                const maxParcaNo = Math.max(...item.breakdowns.map(b => b.parcaNo || 1));
                existingParcaNo = item.isemriParcaNo || maxParcaNo;
            }
        } else {
            // Mevcut breakdown yok
            // Ana kayıt seviyesinde parçalama: İki breakdown oluştur (kalan ve bölünen)
            // Breakdown seviyesinde parçalama: Parçalanan breakdown için kalan miktarı ekle
            // Seçilen makineyi al (maça aşaması için)
            const selectedMachine = item.selectedMachine || item.makAd || null;
            
            if (item.isemriParcaNo) {
                // Breakdown seviyesinde parçalama - parçalanan breakdown'ı ekle
                existingParcaNo = item.isemriParcaNo;
                existingBreakdowns.push({
                    planId: item.planId,
                    parcaNo: existingParcaNo,
                    planTarihi: item.planTarihi,
                    planlananMiktar: kalanMiktar,
                    durum: 'Planlandı',
                    makAd: selectedMachine,
                    selectedMachine: selectedMachine
                });
            } else {
                // Ana kayıt seviyesinde parçalama - parçalanan plan için kalan miktarı ekle
                existingParcaNo = 1;
                existingBreakdowns.push({
                    planId: item.planId,
                    parcaNo: existingParcaNo,
                    planTarihi: item.planTarihi,
                    planlananMiktar: kalanMiktar,
                    durum: 'Planlandı',
                    makAd: selectedMachine,
                    selectedMachine: selectedMachine
                });
            }
        }
        
        // Yeni parça numarasını belirle
        const newParcaNo = nextParcaNo || (existingParcaNo + 1);
        
        // Seçilen makineyi al (maça aşaması için)
        const selectedMachine = item.selectedMachine || item.makAd || null;
        
        // Yeni breakdown'ı ekle
        const newBreakdown = {
            planId: newPlanId || 'new',
            parcaNo: newParcaNo,
            planTarihi: yeniTarih,
            planlananMiktar: splitMiktar,
            durum: 'Planlandı',
            makAd: selectedMachine,
            selectedMachine: selectedMachine
        };
        
        existingBreakdowns.push(newBreakdown);
        
        // Gerçekleşen miktarı "doldura doldura" mantığıyla dağıt
        // Önce parçalanan breakdown'ı bul ve güncelle, sonra yeni breakdown'a dağıt
        const splitBreakdownIndex = existingBreakdowns.findIndex(b => b.planId === item.planId);
        if (splitBreakdownIndex !== -1 && splitBreakdownGercekMiktar > 0) {
            // Parçalanan breakdown ve yeni breakdown'ı tarih sıralı olarak sırala
            const splitBreakdown = existingBreakdowns[splitBreakdownIndex];
            const splitBreakdownTarih = splitBreakdown.planTarihi ? new Date(splitBreakdown.planTarihi) : null;
            const newBreakdownTarih = newBreakdown.planTarihi ? new Date(newBreakdown.planTarihi) : null;
            
            let kalanGercek = splitBreakdownGercekMiktar;
            
            // Tarih sıralı olarak gerçekleşen miktarı dağıt
            if (!splitBreakdownTarih || !newBreakdownTarih || splitBreakdownTarih <= newBreakdownTarih) {
                // Eski breakdown önce (veya aynı tarih)
                // Önce eski breakdown'ı doldur
                if (kalanGercek >= splitBreakdown.planlananMiktar) {
                    splitBreakdown.gercekMiktar = splitBreakdown.planlananMiktar;
                    kalanGercek -= splitBreakdown.planlananMiktar;
                } else {
                    splitBreakdown.gercekMiktar = kalanGercek;
                    kalanGercek = 0;
                }
                
                // Kalan gerçekleşme miktarını yeni breakdown'a ver
                if (kalanGercek > 0) {
                    if (kalanGercek >= newBreakdown.planlananMiktar) {
                        newBreakdown.gercekMiktar = newBreakdown.planlananMiktar;
                    } else {
                        newBreakdown.gercekMiktar = kalanGercek;
                    }
                } else {
                    newBreakdown.gercekMiktar = 0;
                }
            } else {
                // Yeni breakdown önce (daha erken tarih)
                // Önce yeni breakdown'ı doldur
                if (kalanGercek >= newBreakdown.planlananMiktar) {
                    newBreakdown.gercekMiktar = newBreakdown.planlananMiktar;
                    kalanGercek -= newBreakdown.planlananMiktar;
                } else {
                    newBreakdown.gercekMiktar = kalanGercek;
                    kalanGercek = 0;
                }
                
                // Kalan gerçekleşme miktarını eski breakdown'a ver
                if (kalanGercek > 0) {
                    if (kalanGercek >= splitBreakdown.planlananMiktar) {
                        splitBreakdown.gercekMiktar = splitBreakdown.planlananMiktar;
                    } else {
                        splitBreakdown.gercekMiktar = kalanGercek;
                    }
                } else {
                    splitBreakdown.gercekMiktar = 0;
                }
            }
            
            // Güncellenmiş breakdown'ları geri yaz
            existingBreakdowns[splitBreakdownIndex] = splitBreakdown;
            const newBreakdownIndex = existingBreakdowns.findIndex(b => b.planId === (newPlanId || 'new'));
            if (newBreakdownIndex !== -1) {
                existingBreakdowns[newBreakdownIndex] = newBreakdown;
            }
        }
        
        // Toplam planlanan miktarı hesapla
        const totalPlanned = existingBreakdowns
            .filter(b => b.durum === 'Planlandı')
            .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
        
        return {
            breakdowns: existingBreakdowns,
            totalPlanned: totalPlanned,
            totalWaiting: Math.max(0, (item.siparisMiktar || item.planMiktar || 0) - totalPlanned),
            status: totalPlanned >= (item.siparisMiktarHesaplanan || 0) ? 'Planlandı' : 
                    totalPlanned > 0 ? 'Kısmi Planlandı' : 'Beklemede'
        };
    }

    /**
     * Planlama formunu submit eder
     * @param {Object} item - İş emri verisi
     */
    async submitPlanning(item) {
        try {
            const planTarihi = document.getElementById('planningTarih').value;
            const planlananMiktar = parseInt(document.getElementById('planningMiktar').value);
            const aciklama = document.getElementById('planningAciklama')?.value || '';
            
            // Makine seçimini al (dropdown veya radio button)
            const machineSelection = document.getElementById('machineSelection');
            const selectedMachineRadio = document.querySelector('input[name="selectedMachine"]:checked');
            const selectedMachine = machineSelection ? machineSelection.value : 
                                   (selectedMachineRadio ? selectedMachineRadio.value : null);

            // ÖNEMLİ: item referansı eski olabilir, güncel data array'inden yeniden al
            // Geri çekme sonrası planId null olur, bu yüzden güncel veriyi kullanmalıyız
            // Ama selectedMachine ve breakdownPlanId değerlerini koru (maça aşamasında seçilen alt makine ve bekleyen kırılım kontrolü için)
            let currentItem = item;
            if (window.planningApp && window.planningApp.data) {
                const freshItem = window.planningApp.data.find(rec => rec.isemriId === item.isemriId);
                if (freshItem) {
                    currentItem = freshItem;
                    // Seçilen makineyi koru (form'dan gelen veya item'dan)
                    if (selectedMachine) {
                        currentItem.selectedMachine = selectedMachine;
                    } else if (item.selectedMachine) {
                        currentItem.selectedMachine = item.selectedMachine;
                    }
                    // breakdownPlanId'yi koru (bekleyen kırılım kontrolü için)
                    if (item.breakdownPlanId !== undefined) {
                        currentItem.breakdownPlanId = item.breakdownPlanId;
                    }
                } else {
                    // Fresh item bulunamazsa, form'dan veya item'dan selectedMachine ve breakdownPlanId'yi koru
                    if (selectedMachine) {
                        currentItem.selectedMachine = selectedMachine;
                    } else if (item.selectedMachine) {
                        currentItem.selectedMachine = item.selectedMachine;
                    }
                    if (item.breakdownPlanId !== undefined) {
                        currentItem.breakdownPlanId = item.breakdownPlanId;
                    }
                }
            } else {
                // PlanningApp yoksa, form'dan veya item'dan selectedMachine ve breakdownPlanId'yi koru
                if (selectedMachine) {
                    currentItem.selectedMachine = selectedMachine;
                } else if (item.selectedMachine) {
                    currentItem.selectedMachine = item.selectedMachine;
                }
                if (item.breakdownPlanId !== undefined) {
                    currentItem.breakdownPlanId = item.breakdownPlanId;
                }
            }

            let result;

            // Beklemede olan bir kırılım planlanıyorsa kontrol et
            // ÖNEMLİ: Frontend'de dinamik olarak gösterilen bekleyen kırılımın planId'si null'dur
            // Bu durumda yeni kayıt oluşturulmalı (INSERT), mevcut plan güncellenmemeli
            const hasValidPlanId = currentItem?.planId && 
                                   currentItem.planId !== 'new' && 
                                   currentItem.planId !== null && 
                                   currentItem.planId !== undefined;
            
            // Bekleyen kırılım: planId null ise ve durum 'Beklemede' ise → YENİ KAYIT (INSERT)
            // Geri çekilmiş kırılım: planId null ama veritabanında kayıt var → UPDATE (ama bu durumda planId olmaz, INSERT yapılır)
            const isWaitingBreakdownFromFrontend = currentItem?.durum === 'Beklemede' && 
                                                   (currentItem?.planId === null || currentItem?.planId === undefined) &&
                                                   currentItem?.breakdownPlanId === null;
            
            if (hasValidPlanId && currentItem?.durum === 'Beklemede' && currentItem?.isemriParcaNo && !isWaitingBreakdownFromFrontend) {
                // Beklemede kırılım var ve geçerli planId var → UPDATE (veritabanında kayıt var)
                console.log('Beklemede kırılım planlanıyor -> UPDATE ile durum PLANLANDI yapılacak', {
                    planId: currentItem.planId,
                    planTarihi,
                    planlananMiktar
                });
                const resp = await fetch('/api/planning/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        planId: currentItem.planId,
                        planTarihi: planTarihi,
                        planlananMiktar: planlananMiktar,
                        selectedMachine: currentItem.selectedMachine || selectedMachine || currentItem.makAd || null, // Seçilen makineyi ekle
                        aciklama: aciklama
                    })
                });
                result = await resp.json();
                if (!result.success) throw new Error(result.message || 'Kırılım güncellenemedi');
            } else {
                // Yeni plan: ana satırdan, geri çekilmiş kayıttan, kırılımı olmayan kayıttan veya frontend'de dinamik gösterilen bekleyen kırılımdan → INSERT
                // Bekleyen kırılım frontend'de dinamik olarak gösterildiği için planId null'dur, yeni kayıt oluşturulmalı
                const planningData = {
                    isemriId: currentItem.isemriId,
                    planTarihi: planTarihi,
                    planlananMiktar: planlananMiktar,
                    selectedMachine: currentItem.selectedMachine || selectedMachine || currentItem.makAd || null, // Seçilen makineyi ekle
                    aciklama: aciklama
                };
                console.log('Yeni plan INSERT gönderiliyor:', planningData);
                const response = await fetch('/api/planning', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(planningData)
                });
                result = await response.json();
                if (!result.success) throw new Error(result.message || 'Planlama kaydedilemedi');
            }

            if (result.success) {
                console.log('Planlama başarılı');
                
                // Mevcut filtre durumlarını koru
                const currentFilters = this.preserveFilters();
                console.log('Filtreler korundu:', currentFilters);
                
                // Ultra hızlı güncelleme - sadece değişen kayıtları güncelle
                if (window.planningApp) {
                    console.log('Planlama işlemi için ultra hızlı güncelleme...');

                    // Beklemede olan kırılım planlandıysa kontrol et
                    // Frontend'de dinamik gösterilen bekleyen kırılım için yeni breakdown oluştur
                    const isWaitingBreakdownFromFrontend = currentItem?.durum === 'Beklemede' && 
                                                           (currentItem?.planId === null || currentItem?.planId === undefined) &&
                                                           currentItem?.breakdownPlanId === null;
                    
                    if (isWaitingBreakdownFromFrontend) {
                        // Frontend'de dinamik gösterilen bekleyen kırılım planlandı → Yeni breakdown oluştur
                        const createdPlanId = result?.data?.createdPlanId?.outBinds ? result.data.createdPlanId.outBinds[0] : result?.data?.createdPlanId;
                        const updatedPlanningData = this.updatePlanningDataForItem(currentItem, planTarihi, planlananMiktar, createdPlanId);
                        const updatedRecord = {
                            isemriId: currentItem.isemriId,
                            planTarihi: planTarihi,
                            planlananMiktar: planlananMiktar,
                            planId: createdPlanId,
                            planningData: updatedPlanningData,
                            isBreakdown: true,
                            selectedMachine: currentItem.selectedMachine
                        };
                        await window.planningApp.ultraFastUpdate([updatedRecord]);
                    } else if (currentItem?.durum === 'Beklemede' && currentItem?.isemriParcaNo && hasValidPlanId) {
                        // Veritabanında kayıtlı bekleyen kırılım planlandı → Mevcut kırılımı güncelle
                        const updatedRecord = {
                            isemriId: currentItem.isemriId,
                            planTarihi: planTarihi,
                            planlananMiktar: planlananMiktar,
                            planId: currentItem.planId || (result?.data?.updatedPlanIds?.[0] ?? null) || 'new',
                            isBreakdown: true,
                            selectedMachine: currentItem.selectedMachine
                        };
                        await window.planningApp.ultraFastUpdate([updatedRecord]);
                    } else {
                        // Ana kayıt veya ilk planlama için mevcut yardımcıyı kullan
                        const createdPlanId = result?.data?.createdPlanId?.outBinds ? result.data.createdPlanId.outBinds[0] : result?.data?.createdPlanId || currentItem.planId || 'new';
                        const updatedPlanningData = this.updatePlanningDataForItem(currentItem, planTarihi, planlananMiktar, createdPlanId);
                        const updatedRecord = {
                            isemriId: currentItem.isemriId,
                            planTarihi: planTarihi,
                            planlananMiktar: planlananMiktar,
                            planId: createdPlanId,
                            planningData: updatedPlanningData,
                            isBreakdown: currentItem.isemriParcaNo ? true : false
                        };
                        await window.planningApp.ultraFastUpdate([updatedRecord]);
                    }
                    console.log('Ultra hızlı güncelleme tamamlandı');
                }
                
                // Not: restoreFilters() çağrısı kaldırıldı - ultraFastUpdate zaten chart'ları güncelliyor
                // restoreFilters() gereksiz chart güncellemesi yapıyordu ve UI thread'i bloke ediyordu
                
                // Modal'ı hemen kapat (animasyonları beklemeden)
                const modal = document.getElementById('planningModal');
                if (modal) {
                    modal.style.display = 'none';
                    // resetModalContent'ı async olarak yap (UI thread'i bloke etmemek için)
                    setTimeout(() => {
                        this.resetModalContent();
                    }, 0);
                }
                
                // Başarı mesajını async göster (UI thread'i bloke etmemek için)
                setTimeout(() => {
                    window.planningApp.showSuccess('Planlama başarıyla kaydedildi!');
                }, 0);
            } else {
                window.planningApp.showError('Planlama kaydedilirken hata oluştu: ' + result.message);
            }
        } catch (error) {
            console.error('Planlama gönderme hatası:', error);
            window.planningApp.showError('Planlama gönderilirken hata oluştu: ' + error.message);
        }
    }
    /**
     * Planlama modal'ını kapatır
     */
    closePlanningModal() {
        const modal = document.getElementById('planningModal');
        if (modal) {
            modal.style.display = 'none';
            // Modal içeriğini temizle
            this.resetModalContent();
        }
    }

    /**
     * Modal içeriğini orijinal haline getirir
     */
    resetModalContent() {
        const modal = document.getElementById('planningModal');
        if (!modal) return;

        // Modal body'yi orijinal yapısına getir
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            // Eğer innerHTML ile değiştirilmişse (split modal), orijinal yapıyı geri getir
            const originalContent = modalBody.getAttribute('data-original-content');
            if (!originalContent) {
                // Orijinal içeriği kaydet (sadece ilk kez)
                const originalHTML = modalBody.innerHTML;
                // Sadece gerçekten orijinal yapıyı kaydet (split modal değilse)
                if (originalHTML.includes('planningForm') || originalHTML.includes('planning-tabs')) {
                    modalBody.setAttribute('data-original-content', originalHTML);
                }
            } else {
                // Orijinal içeriği geri yükle (sadece split modal'dan sonra)
                if (!modalBody.innerHTML.includes('planningForm') && !modalBody.innerHTML.includes('planning-tabs')) {
                    modalBody.innerHTML = originalContent;
                }
            }
        }

        // Modal footer'ı temizle (split modal tarafından oluşturulmuş olabilir)
        const modalContentContainer = modal.querySelector('.modal-content') || modal;
        const footer = modalContentContainer.querySelector('.modal-footer');
        if (footer) {
            // Footer'ı kaldır (planlama modal'ında footer yok, butonlar form içinde)
            footer.remove();
        }

        // Makine seçim alanını temizle
        const existingMachineField = modal.querySelector('#machineSelectionField');
        if (existingMachineField) {
            existingMachineField.remove();
        }

        // Tüm form alanlarını temizle
        const allInputs = modal.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else if (!input.hasAttribute('readonly')) {
                if (input.type === 'date' || input.type === 'number' || input.type === 'text') {
                    input.value = '';
                }
            }
        });

        // Tab butonlarını sıfırla (plan modal için)
        const tabButtons = modal.querySelectorAll('.planning-tab-button');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.style.display = ''; // Gizlenmişse görünür yap
        });
        if (tabButtons.length > 0) {
            tabButtons[0].classList.add('active');
        }

        // Tab içeriklerini sıfırla
        const tabContents = modal.querySelectorAll('.planning-tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = ''; // Gizlenmişse görünür yap
        });
        const normalTab = modal.querySelector('#normalPlanningTab');
        if (normalTab) {
            normalTab.classList.add('active');
        }

        // Modal başlığını sıfırla
        const modalTitle = modal.querySelector('.modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = 'İş Emri Planlama';
        }

        // Submit butonunu sıfırla (form içindeki butonlar)
        const submitButtons = modal.querySelectorAll('button[type="submit"]');
        submitButtons.forEach(btn => {
            if (btn.textContent === 'Güncelle') {
                btn.textContent = 'Planla';
            }
        });
    }

    /**
     * Context menu'yu gösterir
     * @param {Event} e - Mouse event
     * @param {Object} item - Seçilen iş emri verisi
     */
    showContextMenu(e, item) {
        const contextMenu = document.getElementById('contextMenu');
        if (!contextMenu) return;
        
        // "Tanımsız" filtresi aktifse context menüyü gösterme
        if (this.filters.bolum === 'tanımsız') {
            e.preventDefault();
            return;
        }
        
        // Mevcut seçili item'ı sakla
        this.selectedItem = item;
        
        // Menu item'larını duruma göre aktif/pasif yap
        const planMenuItem = document.getElementById('planMenuItem');
        const updateMenuItem = document.getElementById('updateMenuItem');
        const splitMenuItem = document.getElementById('splitMenuItem');
        const revertMenuItem = document.getElementById('revertMenuItem');
        const bulkPlanMenuItem = document.getElementById('bulkPlanMenuItem');
        
        // Durum kontrolü
        const isPending = item.durum === 'Beklemede';
        const isPlanned = item.durum === 'Planlandı';
        const isPartialPlanned = item.durum === 'Kısmi Planlandı';
        
        // Planlanmamış seçili işler var mı kontrol et
        const hasUnplannedSelected = this.filteredData.some(i => {
            if (i.durum === 'Beklemede') {
                const key = `unplanned_${i.isemriId}`;
                return this.selectedRows.has(key);
            }
            return false;
        });
        
        // Planla - sadece Beklemede durumunda aktif
        if (isPending) {
            planMenuItem.classList.remove('disabled');
        } else {
            planMenuItem.classList.add('disabled');
        }
        
        // Toplu Planla - sadece planlanmamış seçili işler varsa aktif
        if (bulkPlanMenuItem) {
            if (hasUnplannedSelected) {
                bulkPlanMenuItem.classList.remove('disabled');
            } else {
                bulkPlanMenuItem.classList.add('disabled');
            }
        }
        
        // Güncelle - sadece Planlandı durumunda aktif
        if (isPlanned) {
            updateMenuItem.classList.remove('disabled');
        } else {
            updateMenuItem.classList.add('disabled');
        }
        
        // İş Emri Parçala - Planlandı veya Kısmi Planlandı durumunda aktif
        if (isPlanned || isPartialPlanned) {
            splitMenuItem.classList.remove('disabled');
        } else {
            splitMenuItem.classList.add('disabled');
        }
        
        // Geri Çek - sadece Planlandı durumunda aktif
        if (isPlanned) {
            revertMenuItem.classList.remove('disabled');
        } else {
            revertMenuItem.classList.add('disabled');
        }
        
        // Pozisyon hesapla - ekran sınırlarını kontrol et
        let left = e.pageX;
        let top = e.pageY;
        
        // Context menu'yu göster (önce pozisyonu ayarla, sonra görünür yap)
        contextMenu.style.display = 'block';
        contextMenu.style.left = left + 'px';
        contextMenu.style.top = top + 'px';
        
        // Menu boyutlarını al (görünür olduktan sonra)
        setTimeout(() => {
            const menuWidth = contextMenu.offsetWidth || 220;
            const menuHeight = contextMenu.offsetHeight || 300;
            
            // Sağ kenardan taşmamak için kontrol
            if (left + menuWidth > window.innerWidth) {
                left = e.pageX - menuWidth;
            }
            
            // Alt kenardan taşmamak için kontrol
            if (top + menuHeight > window.innerHeight) {
                top = e.pageY - menuHeight;
            }
            
            // Üst kenardan taşmamak için kontrol
            if (top < 0) {
                top = 10;
            }
            
            // Sol kenardan taşmamak için kontrol
            if (left < 0) {
                left = 10;
            }
            
            // Animasyonu tetiklemek için pozisyonu güncelle
            contextMenu.style.left = left + 'px';
            contextMenu.style.top = top + 'px';
            
            // Animasyonu başlat
            requestAnimationFrame(() => {
                contextMenu.classList.add('show');
            });
        }, 0);
        
        // Sayfa dışına tıklandığında kapat
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
        }, 0);
    }
    /**
     * Context menu'yu gizler
     */
    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            // Fade out animasyonu
            contextMenu.classList.remove('show');
            setTimeout(() => {
            contextMenu.style.display = 'none';
            }, 200);
        }
    }
    /**
     * Context menu action'ını işler
     * @param {string} action - Yapılacak işlem (plan, update, revert)
     */
    handleContextMenuAction(action) {
        if (!this.selectedItem) return;
        
        // "Tanımsız" filtresi aktifse hiçbir işlem yapma
        if (this.filters.bolum === 'tanımsız') {
            this.hideContextMenu();
            return;
        }
        
        this.hideContextMenu();
        switch (action) {
            case 'plan':
                if (this.selectedItem.durum === 'Beklemede') {
                    this.openPlanningModal(this.selectedItem);
                }
                break;
            case 'productBasedPlanning':
                this.openProductBasedPlanningModal(this.selectedItem);
                break;
            case 'queuePlanning':
                this.openQueuePlanningModal(this.selectedItem);
                break;
            case 'update':
                if (this.selectedItem.durum === 'Planlandı') {
                    this.openUpdateModal(this.selectedItem);
                }
                break;
            case 'split':
                if (this.selectedItem.durum === 'Planlandı' || this.selectedItem.durum === 'Kısmi Planlandı') {
                    this.openSplitModal(this.selectedItem);
                }
                break;
            case 'revert':
                if (this.selectedItem.durum === 'Planlandı') {
                    this.revertPlanning(this.selectedItem);
                }
                break;
            case 'productInfoCard':
                this.openProductInfoCardModal();
                break;
            case 'refresh':
                // Oracle'dan verileri yeniden yükle
                this.refreshFromOracle();
                break;
        }
    }

    // Ürün Bazlı Planlama Modal Fonksiyonları
    async openProductBasedPlanningModal(item) {
        if (!item) {
            this.showError('Lütfen önce bir satır seçin');
            return;
        }

        const modal = document.getElementById('productBasedPlanningModal');
        const loading = document.getElementById('productBasedPlanningLoading');
        const content = document.getElementById('productBasedPlanningContent');
        
        modal.style.display = 'block';
        loading.style.display = 'block';
        content.style.display = 'none';

        try {
            // Ürün bilgilerini göster
            // item.malhizKodu veritabanından gelen değer, bunu direkt kullan
            let malhizKodu = item.malhizKodu || '';
            
            // Eğer malhizKodu yoksa veya boşsa hata ver
            if (!malhizKodu || malhizKodu.trim() === '') {
                throw new Error('Malzeme kodu bulunamadı');
            }
            
            // Trim yap ve normalize et (başlangıç/bitiş boşluklarını temizle)
            malhizKodu = malhizKodu.trim();
            
            console.log('Ürün bazlı planlama açılıyor');
            console.log('Item malhizKodu (orijinal):', item.malhizKodu);
            console.log('Item malhizKodu (trim edilmiş):', malhizKodu);
            console.log('Item:', item);
            
            document.getElementById('productBasedMalhizKodu').textContent = malhizKodu || '-';
            
            // Aynı ürün kodlu iş emirlerini cache'den filtrele
            // Veritabanına sorgu atmak yerine cache'deki verileri kullan
            console.log('Cache\'den aynı ürün kodlu iş emirleri aranıyor:', malhizKodu);
            console.log('Toplam cache kayıt sayısı:', this.data.length);
            
            // Cache'deki tüm verilerden aynı malzeme kodlu olanları filtrele
            // Her aşamanın kodu farklı olduğu için (maça: -MAÇ, kalıp: -KLP) sadece malhizKodu eşleşmesi yeterli
            const orders = this.data.filter(cacheItem => {
                // Sadece aynı malzeme kodu kontrolü - ISEMRI_SIRA filtresine gerek yok
                return cacheItem.malhizKodu === malhizKodu;
            });
            
            console.log('Cache\'den bulunan aynı ürün kodlu iş emirleri:', orders.length);
            
            if (orders.length === 0) {
                loading.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <p>Aynı ürün kodlu başka iş emri bulunamadı.</p>
                    </div>
                `;
                return;
            }
            
            // Cache'deki verileri backend formatına dönüştür
            const formattedOrders = orders.map(cacheItem => {
                // Planlanan miktarı breakdowns'tan hesapla (daha doğru)
                let planlananMiktar = 0;
                if (cacheItem.breakdowns && Array.isArray(cacheItem.breakdowns)) {
                    // Sadece "Planlandı" durumundaki breakdown'ları say
                    planlananMiktar = cacheItem.breakdowns
                        .filter(b => (b.durum || '').toLowerCase() === 'planlandı')
                        .reduce((sum, b) => sum + (Number(b.planlananMiktar) || 0), 0);
                } else {
                    // Breakdowns yoksa cache'deki totalPlanned'i kullan
                    planlananMiktar = cacheItem.totalPlanned || 0;
                }
                
                const siparisMiktar = cacheItem.siparisMiktarHesaplanan || 0;
                const gercekMiktar = cacheItem.gercekMiktar || 0;
                
                // Durum belirleme - planlanan miktara göre
                let durum = 'BEKLEMEDE';
                if (gercekMiktar > 0 && gercekMiktar >= siparisMiktar) {
                    durum = 'TAMAMLANDI';
                } else if (planlananMiktar > 0) {
                    // Eşit değil, tam olarak küçük olmalı (kısmi planlama)
                    if (planlananMiktar < siparisMiktar) {
                        durum = 'KISMI_PLANLANDI';
                    } else {
                        // planlananMiktar >= siparisMiktar (tam planlama)
                        durum = 'PLANLANDI';
                    }
                }
                
                return {
                    ISEMRI_ID: cacheItem.isemriId,
                    ISEMRI_NO: cacheItem.isemriNo,
                    MALHIZ_KODU: cacheItem.malhizKodu,
                    MALHIZ_ADI: cacheItem.malhizAdi,
                    IMALAT_TURU: cacheItem.imalatTuru,
                    PLAN_MIKTAR: cacheItem.planMiktar || 0, // Kalıp miktarı (backend için)
                    SIPARIS_MIKTAR: siparisMiktar, // Adet miktarı (planlama için)
                    GERCEK_MIKTAR: gercekMiktar,
                    AGIRLIK: cacheItem.agirlik || 0,
                    TOPLAM_SURE: cacheItem.toplamSure || 0,
                    ONERILEN_TESLIM_TARIH: cacheItem.onerilenTeslimTarih,
                    ISEMRI_AC_TAR: cacheItem.tarih,
                    FIRMA_ADI: cacheItem.firmaAdi,
                    BOLUM_ADI: cacheItem.bolumAdi || '',
                    MAK_AD: cacheItem.makAd || '',
                    DURUM: durum,
                    PLANLANAN_MIKTAR: planlananMiktar, // Planlanan miktarı da ekle
                    PLANLANAN_TARIH: cacheItem.planlananTarih || null // Planlanmış iş emirleri için plan tarihi
                };
            });

            // Başlangıç tarihini bugün olarak ayarla
            const startDateInput = document.getElementById('productBasedStartDate');
            const today = new Date().toISOString().split('T')[0];
            startDateInput.value = today;
            
            // İş emirlerini listele - formattedOrders kullan (backend formatında)
            this.populateProductBasedOrdersList(formattedOrders, item, today);
            
            loading.style.display = 'none';
            content.style.display = 'block';

        } catch (error) {
            console.error('Ürün bazlı planlama hatası:', error);
            loading.innerHTML = `
                <div class="error-message">
                    <span class="icon">❌</span>
                    <p>İş emirleri yüklenirken hata oluştu: ${error.message}</p>
                </div>
            `;
        }
    }

    populateProductBasedOrdersList(orders, selectedItem, startDate) {
        const ordersList = document.getElementById('productBasedOrdersList');
        if (!ordersList) return;
        
        // Seçilen iş emrini bul (ilk açılan iş emri olacak)
        const selectedIsemriId = selectedItem.isemriId;
        const selectedOrder = orders.find(o => o.ISEMRI_ID === selectedIsemriId);
        
        // İş emirlerini tarih sıralı olarak düzenle
        // Seçilen iş emri ilk sırada, sonra diğerleri tarih sıralı
        const sortedOrders = [];
        if (selectedOrder) {
            sortedOrders.push(selectedOrder);
        }
        orders.forEach(order => {
            if (order.ISEMRI_ID !== selectedIsemriId) {
                sortedOrders.push(order);
            }
        });
        
        // Tarih hesaplama için başlangıç tarihini kullan
        let currentDate = new Date(startDate);
        
        let html = '<table style="width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px;">';
        html += '<thead><tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-bottom: 2px solid #5a67d8;">';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px; width: 50px;"><input type="checkbox" id="selectAllProductOrders" checked style="width: 18px; height: 18px; cursor: pointer;" /></th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">İş Emri No</th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Malzeme</th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Firma</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Sipariş Miktar (Adet)</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Planlanan Miktar</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Plan Tarihi</th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Makine</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Durum</th>';
        html += '</tr></thead><tbody>';
        
        sortedOrders.forEach((order, index) => {
            const isSelected = order.ISEMRI_ID === selectedIsemriId;
            // Planlanmış iş emirleri için readonly/disabled (kısmi planlandı hariç)
            const isPlanned = order.DURUM === 'PLANLANDI';
            const isKismiPlanlandi = order.DURUM === 'KISMI_PLANLANDI';
            
            // Planlanmış veya kısmi planlanmış iş emirleri için cache'deki plan tarihini kullan
            // Planlanmamış iş emirleri için otomatik tarih hesapla
            let planDate = startDate;
            
            if ((isPlanned || isKismiPlanlandi) && order.PLANLANAN_TARIH) {
                // Planlanmış veya kısmi planlanmış iş emri için cache'deki plan tarihini kullan
                let cachedDate = order.PLANLANAN_TARIH;
                
                // Tarih formatını normalize et (YYYY-MM-DD formatına çevir)
                if (cachedDate instanceof Date) {
                    planDate = cachedDate.toISOString().split('T')[0];
                } else if (typeof cachedDate === 'string') {
                    // Eğer tarih string ise, formatı kontrol et
                    if (cachedDate.includes('T')) {
                        planDate = cachedDate.split('T')[0];
                    } else if (cachedDate.includes(' ')) {
                        planDate = cachedDate.split(' ')[0];
                    } else if (cachedDate.includes('.')) {
                        // DD.MM.YYYY formatından YYYY-MM-DD formatına çevir
                        const parts = cachedDate.split('.');
                        if (parts.length === 3) {
                            planDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        } else {
                            planDate = cachedDate;
                        }
                    } else {
                        planDate = cachedDate;
                    }
                } else {
                    planDate = cachedDate;
                }
            } else {
                // Planlanmamış iş emirleri için otomatik tarih hesapla
                if (index > 0) {
                    // Önceki iş emrinin plan miktarına göre tarih hesapla (basit mantık)
                    // Her iş emri için 1 gün ekle (daha gelişmiş mantık eklenebilir)
                    const prevOrder = sortedOrders[index - 1];
                    const prevPlanMiktar = parseInt(prevOrder.SIPARIS_MIKTAR || 0);
                    // Basit mantık: her iş emri için 1 gün ekle
                    currentDate.setDate(currentDate.getDate() + 1);
                    planDate = currentDate.toISOString().split('T')[0];
                }
            }
            
            const rowBgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            const rowStyle = isSelected 
                ? `background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); font-weight: 600; border-left: 4px solid #2196f3;` 
                : `background-color: ${rowBgColor};`;
            
            // Durum badge'ini doğru göster - order.DURUM değerine göre
            let statusBadge = '';
            if (order.DURUM === 'PLANLANDI') {
                statusBadge = '<span style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3); display: inline-block;">Planlandı</span>';
            } else if (order.DURUM === 'KISMI_PLANLANDI') {
                statusBadge = '<span style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3); display: inline-block;">Kısmi Planlandı</span>';
            } else {
                statusBadge = '<span style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3); display: inline-block;">Beklemede</span>';
            }
            
            html += `<tr style="${rowStyle} border-bottom: 1px solid #e0e0e0; transition: background-color 0.2s ease;" data-order-index="${index}">`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <input type="checkbox" 
                       class="product-order-checkbox" 
                       data-isemri-id="${order.ISEMRI_ID}"
                       data-isemri-no="${order.ISEMRI_NO}"
                       ${isPlanned ? 'disabled' : 'checked'}
                       style="width: 18px; height: 18px; cursor: pointer;" />
            </td>`;
            html += `<td style="padding: 12px 15px; color: #2d3748; font-size: 13px; vertical-align: middle; font-weight: ${isSelected ? '600' : '400'};">${order.ISEMRI_NO || '-'}</td>`;
            html += `<td style="padding: 12px 15px; color: #4a5568; font-size: 13px; vertical-align: middle;">${order.IMALAT_TURU || order.MALHIZ_ADI || '-'}</td>`;
            html += `<td style="padding: 12px 15px; color: #4a5568; font-size: 13px; vertical-align: middle;">${order.FIRMA_ADI || '-'}</td>`;
            html += `<td style="padding: 12px 15px; text-align: center; color: #2d3748; font-size: 13px; vertical-align: middle;">${order.SIPARIS_MIKTAR || 0}</td>`;
            const quantityInputStyle = 'width: 90px; padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; color: #2d3748; font-family: inherit; text-align: center; transition: border-color 0.2s ease; box-sizing: border-box;';
            const dateInputStyle = 'padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; color: #2d3748; font-family: inherit; text-align: center; transition: border-color 0.2s ease; box-sizing: border-box; min-width: 140px;';
            
            // Planlanan miktarı belirle: planlanmış veya kısmi planlanmış iş emirleri için PLANLANAN_MIKTAR, diğerleri için SIPARIS_MIKTAR
            const displayQuantity = (isPlanned || isKismiPlanlandi) ? (order.PLANLANAN_MIKTAR || order.SIPARIS_MIKTAR || 0) : (order.SIPARIS_MIKTAR || 0);
            
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <input type="number" 
                       class="product-order-quantity-input" 
                       data-isemri-id="${order.ISEMRI_ID}"
                       value="${displayQuantity}" 
                       min="1"
                       max="${order.SIPARIS_MIKTAR || ''}"
                       ${isPlanned ? 'readonly' : ''}
                       ${isKismiPlanlandi ? '' : ''}
                       style="${quantityInputStyle}${isPlanned ? ' cursor: default; opacity: 0.7;' : ' cursor: text;'}"
                       onfocus="if(!this.readOnly) { this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'; }" 
                       onblur="if(!this.readOnly) { this.style.borderColor='#cbd5e0'; this.style.boxShadow='none'; }" />
            </td>`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <input type="date" 
                       class="product-order-date-input" 
                       data-isemri-id="${order.ISEMRI_ID}"
                       value="${planDate}" 
                       ${isPlanned ? 'readonly' : ''}
                       ${isKismiPlanlandi ? '' : ''}
                       style="${dateInputStyle}${isPlanned ? ' cursor: default; opacity: 0.7;' : ' cursor: pointer;'}"
                       onfocus="if(!this.readOnly) { this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'; }" 
                       onblur="if(!this.readOnly) { this.style.borderColor='#cbd5e0'; this.style.boxShadow='none'; }" />
            </td>`;
            html += `<td style="padding: 12px 15px; vertical-align: middle;">
                <select class="product-order-machine-input" 
                       data-isemri-id="${order.ISEMRI_ID}"
                       data-bolum-adi="${order.BOLUM_ADI || ''}"
                       data-mak-ad="${order.MAK_AD || ''}"
                       ${isPlanned ? 'disabled' : ''}
                       style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 6px; background-color: ${isPlanned ? '#f7fafc' : 'white'}; cursor: ${isPlanned ? 'not-allowed' : 'pointer'}; font-size: 13px; color: #2d3748; font-family: inherit; box-sizing: border-box;">
                    <option value="${order.MAK_AD || ''}" selected>${order.MAK_AD || 'Makine seçin...'}</option>
                </select>
            </td>`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">${statusBadge}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        ordersList.innerHTML = html;
        
        // Her iş emri için makine dropdown'ını doldur
        this.populateProductBasedMachineDropdowns(ordersList, sortedOrders);
        
        // Checkbox değişikliklerini dinle
        const checkboxes = ordersList.querySelectorAll('.product-order-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const row = this.closest('tr');
                if (row) {
                    if (this.checked) {
                        row.style.opacity = '1';
                        row.style.pointerEvents = 'auto';
                    } else {
                        row.style.opacity = '0.5';
                        row.style.pointerEvents = 'none';
                    }
                }
            });
            // İlk yüklemede görünümü ayarla
            const row = checkbox.closest('tr');
            if (row && !checkbox.checked) {
                row.style.opacity = '0.5';
                row.style.pointerEvents = 'none';
            }
        });
        
        // "Tümünü seç" checkbox'ı için event listener
        const selectAllCheckbox = document.getElementById('selectAllProductOrders');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const checkboxes = ordersList.querySelectorAll('.product-order-checkbox:not([disabled])');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                    const row = checkbox.closest('tr');
                    if (row) {
                        if (this.checked) {
                            row.style.opacity = '1';
                            row.style.pointerEvents = 'auto';
                        } else {
                            row.style.opacity = '0.5';
                            row.style.pointerEvents = 'none';
                        }
                    }
                });
            });
        }
        
        // Başlangıç tarihi değiştiğinde tüm iş emirlerinin tarihlerini kaydır
        const startDateInput = document.getElementById('productBasedStartDate');
        if (startDateInput) {
            startDateInput.addEventListener('change', function() {
                const newStartDate = new Date(this.value);
                if (isNaN(newStartDate.getTime())) return;
                
                // İlk iş emrinin tarihini güncelle
                const firstOrderRow = ordersList.querySelector('tr[data-order-index="0"]');
                if (firstOrderRow) {
                    const firstDateInput = firstOrderRow.querySelector('.product-order-date-input');
                    if (firstDateInput && !firstDateInput.readOnly) {
                        firstDateInput.value = this.value;
                    }
                }
                
                // Diğer iş emirlerinin tarihlerini sırayla güncelle
                let currentDate = new Date(newStartDate);
                const allRows = Array.from(ordersList.querySelectorAll('tr[data-order-index]'));
                
                // Önce tüm satırları index'e göre sırala
                allRows.sort((a, b) => {
                    const indexA = parseInt(a.getAttribute('data-order-index')) || 0;
                    const indexB = parseInt(b.getAttribute('data-order-index')) || 0;
                    return indexA - indexB;
                });
                
                allRows.forEach((row, index) => {
                    if (index === 0) {
                        // İlk satır için tarihi başlangıç tarihi olarak ayarla
                        const dateInput = row.querySelector('.product-order-date-input');
                        if (dateInput && !dateInput.readOnly) {
                            dateInput.value = this.value;
                        }
                        return;
                    }
                    
                    const dateInput = row.querySelector('.product-order-date-input');
                    if (dateInput && !dateInput.readOnly) {
                        // Önceki satırın plan miktarını al
                        const prevRow = allRows[index - 1];
                        const prevQuantityInput = prevRow.querySelector('.product-order-quantity-input');
                        const prevQuantity = prevQuantityInput ? parseInt(prevQuantityInput.value) || 0 : 0;
                        
                        // Basit mantık: Her iş emri için 1 gün ekle
                        // Daha gelişmiş mantık: Önceki iş emrinin plan miktarına göre süre hesaplanabilir
                        currentDate.setDate(currentDate.getDate() + 1);
                        dateInput.value = currentDate.toISOString().split('T')[0];
                    }
                });
            });
        }
    }

    async confirmProductBasedPlanning() {
        const modal = document.getElementById('productBasedPlanningModal');
        if (!modal) return;
        
        const ordersList = modal.querySelector('#productBasedOrdersList');
        if (!ordersList) return;
        
        // Seçili checkbox'ları al
        const checkedBoxes = ordersList.querySelectorAll('.product-order-checkbox:checked:not([disabled])');
        if (checkedBoxes.length === 0) {
            window.planningApp.showWarning('Lütfen en az bir iş emri seçin');
            return;
        }
        
        // Seçili iş emirlerinin verilerini topla
        const ordersToPlan = [];
        checkedBoxes.forEach(checkbox => {
            const isemriId = checkbox.dataset.isemriId;
            const isemriNo = checkbox.dataset.isemriNo;
            const row = checkbox.closest('tr');
            
            const quantityInput = row.querySelector('.product-order-quantity-input');
            const dateInput = row.querySelector('.product-order-date-input');
            const machineInput = row.querySelector('.product-order-machine-input');
            
            const planlananMiktar = parseInt(quantityInput.value) || 0;
            const planTarihi = dateInput.value;
            const selectedMachine = machineInput ? machineInput.value : null;
            
            if (planlananMiktar > 0 && planTarihi) {
                // Açıklama alanını al
                const aciklamaInput = document.getElementById('productBasedAciklama');
                const aciklama = aciklamaInput ? aciklamaInput.value.trim() : '';
                
                ordersToPlan.push({
                    isemriId: parseInt(isemriId),
                    isemriNo: isemriNo,
                    planTarihi: planTarihi,
                    planlananMiktar: planlananMiktar,
                    selectedMachine: selectedMachine || null,
                    aciklama: aciklama || null
                });
            }
        });
        
        if (ordersToPlan.length === 0) {
            window.planningApp.showWarning('Geçerli planlama verisi bulunamadı');
            return;
        }
        
        // Modal'ı kapat
        modal.style.display = 'none';
        
        // Planlama işlemini başlat (Kuyruk Tam Planlama progress bar'ı gösterme)
        // Sadece basit bir loading mesajı göster
        window.planningApp.showLoading('İş emirleri planlanıyor...');
        
        try {
            const response = await fetch('/api/product-based-planning/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders: ordersToPlan })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Planlama yapılamadı');
            }
            
            // Başarı mesajı
            window.planningApp.showSuccess(`${result.message}`);
            
            // Kuyruk planlama modalını kapat (eğer açıksa)
            const queueModal = document.getElementById('queuePlanSummaryModal');
            if (queueModal) {
                queueModal.style.display = 'none';
            }
            
            // Cache'i ultraFastUpdate ile güncelle (veritabanına sorgu atmadan)
            if (window.planningApp && result.data && result.data.results) {
                const updatedRecords = [];
                
                // Her planlanan iş emri için cache'i güncelle
                for (const planResult of result.data.results) {
                    const { isemriId, createdPlanId, isPartialPlanning } = planResult;
                    
                    // Cache'deki mevcut kaydı bul
                    const cacheItem = window.planningApp.data.find(item => item.isemriId === isemriId);
                    if (!cacheItem) {
                        console.warn(`İş emri ${isemriId} cache'de bulunamadı`);
                        continue;
                    }
                    
                    // Planlanan iş emrini ordersToPlan'dan bul (planTarihi ve planlananMiktar için)
                    const plannedOrder = ordersToPlan.find(o => o.isemriId === isemriId);
                    if (!plannedOrder) {
                        console.warn(`İş emri ${isemriId} planlama verileri bulunamadı`);
                        continue;
                    }
                    
                    // Planning data'yı güncelle
                    const updatedPlanningData = this.updatePlanningDataForItem(
                        cacheItem, 
                        plannedOrder.planTarihi, 
                        plannedOrder.planlananMiktar, 
                        createdPlanId,
                        plannedOrder.aciklama || null
                    );
                    
                    // Açıklamayı cache'e ekle
                    if (plannedOrder.aciklama) {
                        cacheItem.aciklama = plannedOrder.aciklama;
                    }
                    
                    // Updated record oluştur
                    const updatedRecord = {
                        isemriId: isemriId,
                        planTarihi: plannedOrder.planTarihi,
                        planlananMiktar: plannedOrder.planlananMiktar,
                        planId: createdPlanId,
                        planningData: updatedPlanningData,
                        isBreakdown: false,
                        aciklama: plannedOrder.aciklama || null
                    };
                    
                    updatedRecords.push(updatedRecord);
                }
                
                // Ultra hızlı güncelleme - cache'i güncelle, chart'ları ve grid'i yenile
                if (updatedRecords.length > 0) {
                    await window.planningApp.ultraFastUpdate(updatedRecords);
                    console.log(`${updatedRecords.length} iş emri cache'de güncellendi`);
                }
            } else {
                // Eğer result.data yoksa, eski yöntemle veritabanından çek
                console.warn('Backend\'den planlama sonuçları gelmedi, veritabanından veri çekiliyor...');
                if (window.planningApp) {
                    await window.planningApp.refreshData(true);
                }
                
                // Chart'ları yenile
                if (window.chartManager) {
                    await window.chartManager.refreshCharts();
                }
            }
            
        } catch (error) {
            console.error('Ürün bazlı planlama hatası:', error);
            window.planningApp.showError('Planlama yapılırken hata oluştu: ' + error.message);
        } finally {
            window.planningApp.hideLoading();
        }
    }

    // Sipariş İzleme Modal Fonksiyonları
    async openOrderTrackingModal() {
        if (!this.selectedItem) {
            this.showError('Lütfen önce bir satır seçin');
            return;
        }

        const modal = document.getElementById('orderTrackingModal');
        const loading = document.getElementById('orderTrackingLoading');
        const content = document.getElementById('orderTrackingContent');
        
        modal.style.display = 'block';
        loading.style.display = 'block';
        content.style.display = 'none';

        try {
            const response = await fetch(`/api/order-tracking/${this.selectedItem.isemriNo}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Sipariş bilgileri alınamadı');
            }

            this.populateOrderTrackingModal(result.data);
            
            loading.style.display = 'none';
            content.style.display = 'block';

        } catch (error) {
            console.error('Sipariş izleme hatası:', error);
            loading.innerHTML = `
                <div class="error-message">
                    <span class="icon">❌</span>
                    <p>Sipariş bilgileri yüklenirken hata oluştu: ${error.message}</p>
                </div>
            `;
        }
    }

    populateOrderTrackingModal(orderData) {
        // Sipariş özet bilgilerini doldur
        // Sipariş numarasını göster (SIP_KOD), yoksa ID'yi göster
        document.getElementById('orderSipId').textContent = orderData.sipKod || orderData.sipId || '-';
        document.getElementById('orderMusteri').textContent = orderData.musteriAdi || '-';
        document.getElementById('orderOnerilenTeslim').textContent = orderData.onerilenTeslimTarihi || '-';
        document.getElementById('orderTermini').textContent = orderData.siparisTermini || '-';

        // Ürünleri listele
        const productsList = document.getElementById('productsList');
        productsList.innerHTML = '';

        Object.values(orderData.urunler).forEach(urun => {
            const productCard = this.createProductCard(urun);
            productsList.appendChild(productCard);
        });
    }

    createProductCard(urun) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Durum belirleme - TÜM aşamalar planlanmış olmalı
        let status = 'waiting';
        let statusText = 'Beklemede';
        
        // Ana ürün durumunu da kontrol et (paketleme aşaması)
        const anaUrunPlanlandi = urun.durumu === 'Planlandı' || urun.durumu === 'Tamamlandı';
        
        if (urun.asamalar && urun.asamalar.length > 0) {
            const plannedStages = urun.asamalar.filter(a => a.durumu === 'Planlandı' || a.durumu === 'Tamamlandı');
            const completedStages = urun.asamalar.filter(a => a.durumu === 'Tamamlandı');
            
            // Tüm aşamalar tamamlandıysa
            if (completedStages.length === urun.asamalar.length && anaUrunPlanlandi) {
                status = 'completed';
                statusText = 'Tamamlandı';
            } 
            // Tüm aşamalar planlandıysa (veya tamamlandıysa) ve ana ürün de planlandıysa
            else if (plannedStages.length === urun.asamalar.length && anaUrunPlanlandi) {
                status = 'planned';
                statusText = 'Planlandı';
            }
            // Kısmi planlanmışsa
            else if (plannedStages.length > 0 || anaUrunPlanlandi) {
                status = 'kismi-planlandi';
                statusText = 'Kısmi Planlandı';
            }
        } else {
            // Aşama yoksa sadece ana ürün durumunu kontrol et
            if (anaUrunPlanlandi) {
                status = 'planned';
                statusText = 'Planlandı';
            }
        }

        card.innerHTML = `
            <div class="product-header" onclick="this.parentElement.classList.toggle('expanded')">
                <div class="product-info">
                    <div class="product-title">${urun.malhizKodu} - ${urun.malhizAdi}</div>
                    <div class="product-subtitle">İş Emri: ${urun.isemriNo} | Miktar: ${urun.planMiktar || 0}</div>
                </div>
                <div class="product-status">
                    <span class="status-badge ${status}">${statusText}</span>
                    <span class="expand-icon">▼</span>
                </div>
            </div>
            <div class="product-details">
                <div class="product-meta">
                    <div class="meta-item">
                        <div class="meta-label">Planlanan Miktar</div>
                        <div class="meta-value">${urun.planlananMiktar || 0}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Gerçekleşen Miktar</div>
                        <div class="meta-value">${urun.gercekMiktar || 0}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Planlanan Tarih</div>
                        <div class="meta-value">${urun.planlananTarihi || '-'}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Ağırlık</div>
                        <div class="meta-value">${urun.agirlik || '-'}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Toplam Süre</div>
                        <div class="meta-value">${urun.toplamSure || '-'} saat</div>
                    </div>
                </div>
                <div class="stages-section">
                    <div class="stages-title">
                        <span class="icon">⚙️</span>
                        Üretim Aşamaları
                    </div>
                    <div class="stages-list">
                        ${urun.asamalar && urun.asamalar.length > 0 ? 
                            urun.asamalar.map(asama => {
                                // İlerleme yüzdesini hesapla
                                const planlananMiktar = asama.planlananMiktar || 0;
                                const gercekMiktar = asama.gercekMiktar || 0;
                                let progressPercent = 0;
                                
                                if (planlananMiktar > 0) {
                                    progressPercent = Math.min(100, Math.round((gercekMiktar / planlananMiktar) * 100));
                                } else if (asama.durumu === 'Tamamlandı') {
                                    progressPercent = 100;
                                } else if (asama.durumu === 'Planlandı') {
                                    progressPercent = 0; // Planlandı ama henüz başlamadı
                                }
                                
                                // Durum class'ını belirle
                                let statusClass = 'waiting';
                                if (asama.durumu === 'Tamamlandı' || progressPercent >= 100) {
                                    statusClass = 'completed';
                                } else if (asama.durumu === 'Planlandı' && progressPercent > 0) {
                                    statusClass = 'in-progress';
                                } else if (asama.durumu === 'Planlandı') {
                                    statusClass = 'planned';
                                }
                                
                                return `
                                <div class="stage-item">
                                    <div class="stage-info">
                                        <div class="stage-name">${asama.malhizKodu || ('Aşama ' + (asama.parcaNo || ''))}</div>
                                        <div class="stage-details">
                                            Makine: ${asama.makAd || '-'} | 
                                            Planlanan: ${asama.planlananMiktar || 0} | 
                                            Gerçekleşen: ${gercekMiktar} | 
                                            Tarih: ${asama.planTarihi || '-'}
                                        </div>
                                        <div class="stage-progress">
                                            <div class="stage-progress-bar">
                                                <div class="stage-progress-fill ${statusClass}" style="width: ${progressPercent}%"></div>
                                            </div>
                                            <div class="stage-progress-text">${progressPercent}%</div>
                                        </div>
                                    </div>
                                    <div class="stage-status">
                                        <span class="status-badge ${statusClass}">
                                            ${asama.durumu}
                                        </span>
                                    </div>
                                </div>
                            `;
                            }).join('') : 
                            '<div class="stage-item"><div class="stage-info">Henüz aşama planlanmamış</div></div>'
                        }
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Ürün Bilgi Kartı modalını açar
     */
    openProductInfoCardModal() {
        if (!this.selectedItem) {
            this.showError('Lütfen önce bir satır seçin');
            return;
        }

        const modal = document.getElementById('productInfoCardModal');
        if (!modal) {
            this.showError('Ürün bilgi kartı modalı bulunamadı');
            return;
        }

        // Modal'ı göster ve pozisyonla
        modal.style.display = 'block';
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            // Her açılışta sayfa ortasına yerleştir
            // Önce modal içeriğini görünür yap (boyutları hesaplamak için)
            modalContent.style.visibility = 'hidden';
            modalContent.style.display = 'block';
            
            // Kısa bir gecikme ile boyutları al (render tamamlanması için)
            setTimeout(() => {
                const rect = modalContent.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                
                // Merkez pozisyonunu hesapla
                const centerX = (windowWidth - rect.width) / 2;
                const centerY = (windowHeight - rect.height) / 2;
                
                // Pozisyonu ayarla (negatif değerleri 0 yap)
                modalContent.style.left = '0';
                modalContent.style.top = '0';
                modalContent.style.transform = `translate(${Math.max(0, centerX)}px, ${Math.max(0, centerY)}px)`;
                modalContent.style.visibility = 'visible';
            }, 10);
        }

        // İlk tab'ı (Genel Bilgiler) yükle
        this.populateProductInfoGeneralTab(this.selectedItem);
        
        // Diğer tab'ları sıfırla
        const productionContent = document.getElementById('productInfoProductionContent');
        const orderContent = document.getElementById('productInfoOrderTrackingContent');
        const orderLoading = document.getElementById('productInfoOrderLoading');
        
        if (productionContent) productionContent.innerHTML = '';
        if (orderContent) {
            orderContent.innerHTML = '';
            orderContent.style.display = 'none';
        }
        if (orderLoading) orderLoading.style.display = 'none';
        
        // İlk tab'ı aktif et
        switchProductInfoTab('general');
        
        // Draggable'ı başlat
        if (typeof makeProductInfoCardDraggable === 'function') {
            makeProductInfoCardDraggable();
        }
    }

    /**
     * Ürün genel bilgileri tab'ını doldurur
     * @param {Object} item - İş emri verisi
     */
    populateProductInfoGeneralTab(item) {
        const content = document.getElementById('productInfoGeneralContent');
        if (!content) return;

        // Tüm sütun bilgilerini topla (gizlenmiş olsa bile)
        const allColumns = [
            { key: 'durum', label: 'Durum', value: item.durum || '-' },
            { key: 'isemriNo', label: 'İş Emri No', value: item.isemriNo || '-' },
            { key: 'malhizKodu', label: 'Malzeme Kodu', value: item.malhizKodu || '-' },
            { key: 'imalatTuru', label: 'Malzeme', value: item.imalatTuru || '-' },
            { key: 'makAd', label: 'Makina Adı', value: item.makAd || '-' },
            { key: 'tarih', label: 'Sipariş Tarihi', value: item.tarih ? new Date(item.tarih).toLocaleDateString('tr-TR') : '-' },
            { key: 'agirlik', label: 'Net Ağırlık', value: item.agirlik || 0 },
            { key: 'brutAgirlik', label: 'Brüt Ağırlık', value: item.brutAgirlik || 0 },
            { key: 'toplamSure', label: 'Toplam Süre', value: item.toplamSure || 0 },
            { key: 'planMiktar', label: 'Sipariş Miktar (Kalıp)', value: item.planMiktar || 0 },
            { key: 'figurSayisi', label: 'Figür Sayısı', value: item.figurSayisi || 0 },
            { key: 'siparisMiktarHesaplanan', label: 'Sipariş Miktar (Adet)', value: item.siparisMiktarHesaplanan || 0 },
            { key: 'sevkMiktari', label: 'Sevk Miktarı', value: item.sevkMiktari || 0 },
            { key: 'bakiyeMiktar', label: 'Bakiye Miktar', value: (() => {
                const siparisMiktarHesaplanan = item.siparisMiktarHesaplanan || 0;
                const sevkMiktari = item.sevkMiktari || 0;
                return Math.max(0, siparisMiktarHesaplanan - sevkMiktari);
            })() },
            { key: 'gercekMiktar', label: 'Gerçekleşen Miktar', value: item.gercekMiktar || 0 },
            { key: 'planlananMiktar', label: 'Planlanan Miktar', value: (() => {
                if (item.breakdowns && item.breakdowns.length > 0) {
                    return item.breakdowns
                        .filter(b => b.durum === 'Planlandı')
                        .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
                }
                return item.planlananMiktar || 0;
            })() },
            { key: 'planlananTarih', label: 'Planlanan Tarih', value: item.planlananTarih ? new Date(item.planlananTarih).toLocaleDateString('tr-TR') : '-' },
            { key: 'onerilenTeslimTarih', label: 'Önerilen Teslim', value: item.onerilenTeslimTarih ? new Date(item.onerilenTeslimTarih).toLocaleDateString('tr-TR') : '-' },
            { key: 'firmaAdi', label: 'Firma', value: item.firmaAdi || '-' },
            { key: 'aciklama', label: 'Açıklama', value: item.aciklama || '-' },
            { key: 'bolumAdi', label: 'Bölüm Adı', value: item.bolumAdi || '-' },
            { key: 'isemriSira', label: 'İş Emri Sıra', value: item.isemriSira || '-' },
            { key: 'hurdaMiktar', label: 'Hurda Miktar', value: item.hurdaMiktar || 0 }
        ];

        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">';
        
        allColumns.forEach(col => {
            html += `
                <div style="background: #e9ecef; padding: 15px; border-radius: 8px; border: 2px solid #ced4da; border-left: 6px solid var(--theme-primary-4); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 12px; color: #495057; margin-bottom: 5px; font-weight: 500;">${col.label}</div>
                    <div style="font-size: 16px; color: #212529; font-weight: 600;">${col.value}</div>
                </div>
            `;
        });

        // Breakdown bilgileri varsa göster
        if (item.breakdowns && item.breakdowns.length > 0) {
            html += '</div><div style="margin-top: 30px;"><h4 style="margin-bottom: 15px; color: #2d3748;">Planlama Kırılımları</h4>';
            html += '<div style="display: grid; gap: 10px;">';
            
            item.breakdowns.forEach((breakdown, index) => {
                html += `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 2px solid #ced4da; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-weight: 600; color: #212529;">Kırılım ${breakdown.parcaNo || index + 1}</span>
                            <span class="status-badge ${breakdown.durum.toLowerCase()}" style="padding: 4px 12px; border-radius: 4px; font-size: 12px;">${breakdown.durum}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 14px;">
                            <div><strong>Miktar:</strong> ${breakdown.planlananMiktar || 0}</div>
                            <div><strong>Tarih:</strong> ${breakdown.planTarihi ? new Date(breakdown.planTarihi).toLocaleDateString('tr-TR') : '-'}</div>
                            <div><strong>Makine:</strong> ${breakdown.makAd || '-'}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        html += '</div>';
        content.innerHTML = html;
    }

    /**
     * Üretim süreci izleme içeriğini ürün bilgi kartına yükler
     */
    async loadProductionTrackingInProductInfoCard() {
        if (!this.selectedItem) return;

        const content = document.getElementById('productInfoProductionContent');
        if (!content) return;

        try {
            content.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>Üretim süreci bilgileri yükleniyor...</p></div>';

            const response = await fetch(`/api/production-stages/${this.selectedItem.isemriNo}`);
            const result = await response.json();

            if (result.success) {
                // Üretim süreci içeriğini HTML olarak oluştur
                let html = `
                    <!-- Tab Navigation -->
                    <div class="production-tabs">
                        <button class="tab-button active" onclick="switchProductInfoProductionTab('visual', event)">
                            <span class="tab-icon">👁️</span>
                            Görsel İzleme
                        </button>
                        <button class="tab-button" onclick="switchProductInfoProductionTab('tabular', event)">
                            <span class="tab-icon">📋</span>
                            Tablosal İzleme
                        </button>
                        <button class="tab-button" onclick="switchProductInfoProductionTab('gantt', event)">
                            <span class="tab-icon">📊</span>
                            Gantt Chart
                        </button>
                    </div>

                    <!-- Visual Tracking Tab -->
                    <div id="productInfo_visualTrackingTab" class="tab-content active">
                        <div class="workflow-section">
                            <h4>Üretim Süreci Akışı</h4>
                            <p class="workflow-subtitle" id="productInfo_workflowSubtitle">Ürünün tüm üretim aşamaları</p>
                            
                            <div class="workflow-container">
                                <div id="productInfo_workflowCards" class="workflow-cards">
                                    <!-- Workflow cards will be generated here -->
                                </div>
                                <div class="workflow-timeline">
                                    <div class="timeline-slider" id="productInfo_timelineSlider">
                                        <div class="timeline-indicator" id="productInfo_timelineIndicator"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Summary Information -->
                        <div class="summary-info">
                            <div class="summary-panel">
                                <h5>Genel Bilgiler</h5>
                                <div class="summary-item">
                                    <span class="label">Ana Ürün:</span>
                                    <span class="value" id="productInfo_mainProduct">-</span>
                                </div>
                                <div class="summary-item">
                                    <span class="label">Toplam Aşama:</span>
                                    <span class="value" id="productInfo_totalStages">-</span>
                                </div>
                                <div class="summary-item">
                                    <span class="label">Tamamlanan:</span>
                                    <span class="value completed" id="productInfo_completedStages">-</span>
                                </div>
                            </div>
                            <div class="summary-panel">
                                <h5>Mevcut Durum</h5>
                                <div class="summary-item">
                                    <span class="label">Aktif Aşama:</span>
                                    <span class="value" id="productInfo_activeStage">-</span>
                                </div>
                                <div class="summary-item">
                                    <span class="label">İlerleme:</span>
                                    <span class="value" id="productInfo_overallProgress">-</span>
                                </div>
                                <div class="summary-item">
                                    <span class="label">Tamamlanan:</span>
                                    <span class="value" id="productInfo_completedUnits">-</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tabular Tracking Tab -->
                    <div id="productInfo_tabularTrackingTab" class="tab-content">
                        <div class="table-section">
                            <h4>Detaylı Aşama Tablosu</h4>
                            <p class="table-subtitle">Tüm aşamaların detaylı bilgileri</p>
                            
                            <div class="stages-table-container">
                                <table class="stages-table">
                                    <thead>
                                        <tr>
                                            <th>Aşama</th>
                                            <th>Ürün Kodu</th>
                                            <th>Durum</th>
                                            <th>İş Merkezi</th>
                                            <th>Planlanan Miktar</th>
                                            <th>Başlangıç</th>
                                            <th>Bitiş</th>
                                            <th>İlerleme</th>
                                        </tr>
                                    </thead>
                                    <tbody id="productInfo_stagesTableBody">
                                        <!-- Table rows will be generated here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Gantt Chart Tab -->
                    <div id="productInfo_ganttTrackingTab" class="tab-content">
                        <div class="gantt-section">
                            <div class="gantt-header">
                                <h4>Gantt Chart - Zaman Çizelgesi</h4>
                            </div>
                            <p class="gantt-subtitle">Aşamaların zaman bazlı görsel gösterimi</p>
                            
                            <div class="gantt-container-wrapper">
                                <div id="productInfo_ganttContainer" class="gantt-container">
                                    <!-- Gantt chart will be generated here -->
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                content.innerHTML = html;
                
                // Populate fonksiyonunu çağır
                this.populateProductionTrackingModalInProductInfoCard(result.data);
            } else {
                content.innerHTML = `<div style="padding: 20px; text-align: center; color: #dc3545;">${result.message || 'Üretim aşamaları yüklenemedi'}</div>`;
            }
        } catch (error) {
            console.error('Üretim süreci yükleme hatası:', error);
            content.innerHTML = `<div style="padding: 20px; text-align: center; color: #dc3545;">Hata: ${error.message}</div>`;
        }
    }

    /**
     * Üretim süreci izleme modalını ürün bilgi kartında doldurur (ID'ler güncellenmiş)
     */
    populateProductionTrackingModalInProductInfoCard(data) {
        // Veriyi global olarak sakla (tab değişimlerinde kullanmak için)
        window.currentProductionStages = data.stages;
        
        // Summary bilgilerini güncelle (ID'ler güncellenmiş)
        const mainProductEl = document.getElementById('productInfo_mainProduct');
        const totalStagesEl = document.getElementById('productInfo_totalStages');
        const completedStagesEl = document.getElementById('productInfo_completedStages');
        const activeStageEl = document.getElementById('productInfo_activeStage');
        const overallProgressEl = document.getElementById('productInfo_overallProgress');
        const completedUnitsEl = document.getElementById('productInfo_completedUnits');
        
        if (mainProductEl) mainProductEl.textContent = data.mainProduct;
        if (totalStagesEl) totalStagesEl.textContent = data.totalStages;
        if (completedStagesEl) completedStagesEl.textContent = data.completedStages;
        if (activeStageEl) activeStageEl.textContent = data.activeStage;
        if (overallProgressEl) overallProgressEl.textContent = `${data.overallProgress}%`;
        if (completedUnitsEl) completedUnitsEl.textContent = data.completedUnits;
        
        // Workflow subtitle'ı güncelle
        const workflowSubtitleEl = document.getElementById('productInfo_workflowSubtitle');
        if (workflowSubtitleEl) {
            workflowSubtitleEl.textContent = `${data.mainProduct} ürününün tüm üretim aşamaları`;
        }
        
        // Görsel izleme kartlarını oluştur
        const workflowCardsEl = document.getElementById('productInfo_workflowCards');
        if (workflowCardsEl) {
            this.createWorkflowCardsInProductInfoCard(data.stages);
        }
        
        // Tablosal izleme tablosunu oluştur
        const stagesTableBodyEl = document.getElementById('productInfo_stagesTableBody');
        if (stagesTableBodyEl) {
            this.createStagesTableInProductInfoCard(data.stages);
        }
        
        // Timeline indicator'ı güncelle
        this.updateTimelineIndicatorInProductInfoCard(data.stages);
        
        // Gantt chart'ı oluştur (sadece görsel tab aktifse)
        const ganttContainerEl = document.getElementById('productInfo_ganttContainer');
        if (ganttContainerEl) {
            // Gantt chart'ı sadece gantt tab'ına tıklandığında oluştur
            // Şimdilik boş bırak, tab değiştiğinde oluşturulacak
        }
    }

    /**
     * Workflow kartlarını ürün bilgi kartında oluşturur
     */
    createWorkflowCardsInProductInfoCard(stages) {
        const workflowCards = document.getElementById('productInfo_workflowCards');
        if (!workflowCards) return;
        
        workflowCards.innerHTML = '';
        
        stages.forEach((stage, index) => {
            const card = document.createElement('div');
            card.className = `workflow-card ${stage.status}`;
            
            const statusIcon = this.getStatusIcon(stage.status);
            const statusText = this.getStatusText(stage.status);
            
            const stageTitle = stage.productCode || stage.stageName || `Aşama ${index + 1}`;
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-stage">${stageTitle}</div>
                    <div class="card-status ${stage.status}">
                        <span>${statusIcon}</span>
                        <span>${statusText}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <div class="info-row">
                            <span class="info-label">Makine:</span>
                            <span class="info-value">${stage.workCenter || '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Planlanan:</span>
                            <span class="info-value">${stage.planMiktar || 0}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Gerçekleşen:</span>
                            <span class="info-value">${stage.gercekMiktar || 0}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">İlerleme:</span>
                            <span class="info-value">${stage.progress || 0}%</span>
                        </div>
                    </div>
                </div>
            `;
            workflowCards.appendChild(card);
        });
    }

    /**
     * Tablosal izleme tablosunu ürün bilgi kartında oluşturur
     */
    createStagesTableInProductInfoCard(stages) {
        const tableBody = document.getElementById('productInfo_stagesTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        stages.forEach(stage => {
            const row = document.createElement('tr');
            const statusText = this.getStatusText(stage.status);
            const stageTitle = stage.stageName || stage.productCode || '';
            row.innerHTML = `
                <td>${stageTitle}</td>
                <td>${stage.productCode || '-'}</td>
                <td><span class="stage-status ${stage.status}">${statusText}</span></td>
                <td>${stage.workCenter || '-'}</td>
                <td>${stage.planMiktar || 0}</td>
                <td>${stage.startDateFormatted ? `${stage.startDateFormatted} ${stage.startTime || ''}` : '-'}</td>
                <td>${stage.endDateFormatted ? `${stage.endDateFormatted} ${stage.endTime || ''}` : '-'}</td>
                <td>
                    <div class="stage-progress">
                        <div class="stage-progress-bar">
                            <div class="stage-progress-fill ${stage.status}" style="width: ${stage.progress || 0}%"></div>
                        </div>
                        <div class="stage-progress-text">${stage.progress || 0}%</div>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * Timeline indicator'ı ürün bilgi kartında günceller
     */
    updateTimelineIndicatorInProductInfoCard(stages) {
        const indicator = document.getElementById('productInfo_timelineIndicator');
        if (!indicator) return;
        
        const inProgressIndex = stages.findIndex(s => s.status === 'in-progress');
        
        if (inProgressIndex >= 0 && stages.length > 1) {
            const percentage = (inProgressIndex / (stages.length - 1)) * 100;
            indicator.style.left = `${percentage}%`;
        } else {
            indicator.style.left = '0%';
        }
    }

    /**
     * Gantt chart'ı ürün bilgi kartında oluşturur
     */
    createGanttChartInProductInfoCard(stages) {
        const ganttContainer = document.getElementById('productInfo_ganttContainer');
        if (!ganttContainer) return;
        
        ganttContainer.innerHTML = '';
        
        // Planlanmış aşamaları filtrele ve tarihleri Date objesine dönüştür
        const plannedStages = stages
            .filter(s => s.startDate && s.endDate)
            .map(s => {
                // Tarihleri Date objesine dönüştür (eğer string ise)
                const startDate = s.startDate instanceof Date ? s.startDate : new Date(s.startDate);
                const endDate = s.endDate instanceof Date ? s.endDate : new Date(s.endDate);
                
                // Geçerli tarih kontrolü
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    return null;
                }
                
                return {
                    ...s,
                    startDate: startDate,
                    endDate: endDate
                };
            })
            .filter(s => s !== null); // Geçersiz tarihleri filtrele
        
        if (plannedStages.length === 0) {
            ganttContainer.innerHTML = '<div class="gantt-empty">Planlanmış aşama bulunamadı</div>';
            return;
        }
        
        // Tarih aralığını hesapla - gün bazlı (saat bilgisi yok)
        const allDates = plannedStages.flatMap(s => [s.startDate, s.endDate]);
        const validDates = allDates.filter(d => d instanceof Date && !isNaN(d.getTime()));
        
        if (validDates.length === 0) {
            ganttContainer.innerHTML = '<div class="gantt-empty">Geçerli tarih bulunamadı</div>';
            return;
        }
        
        // Tarihleri gün bazlı yuvarla (saat bilgisini kaldır)
        const roundToDayStart = (date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
        };
        
        const roundToDayEnd = (date) => {
            const d = new Date(date);
            d.setHours(23, 59, 59, 999);
            return d;
        };
        
        const minDate = roundToDayStart(new Date(Math.min(...validDates.map(d => d.getTime()))));
        const maxDate = roundToDayEnd(new Date(Math.max(...validDates.map(d => d.getTime()))));
        
        // Tarih aralığını genişlet (kenarlarda minimal boşluk için) - gün bazlı
        const dateRange = maxDate.getTime() - minDate.getTime();
        // Padding'i azalt - sadece 1 gün ekle (son tarihin kaymaması için)
        const chartStartDate = new Date(minDate);
        chartStartDate.setDate(chartStartDate.getDate() - 1);
        chartStartDate.setHours(0, 0, 0, 0);
        
        const chartEndDate = new Date(maxDate);
        chartEndDate.setDate(chartEndDate.getDate() + 1);
        chartEndDate.setHours(23, 59, 59, 999);
        
        const totalRange = chartEndDate.getTime() - chartStartDate.getTime();
        
        // Gantt chart yapısını oluştur
        const ganttChart = document.createElement('div');
        ganttChart.className = 'gantt-chart';
        
        // Timeline header (tarih ekseni)
        const timelineHeader = document.createElement('div');
        timelineHeader.className = 'gantt-timeline-header';
        
        // Gün bazlı timeline oluştur
        const days = Math.ceil(totalRange / (1000 * 60 * 60 * 24));
        
        // Tüm tarih aralığının ekrana sığması için gün genişliğini hesapla
        // Yüzde bazlı genişlik kullan - her zaman %100
        const dayWidth = 100 / days; // Yüzde bazlı genişlik
        const timelineTotalWidth = '100%'; // Her zaman %100 kullan
        
        // Timeline grid oluştur - sabit genişlik için data attribute ekle
        const timelineGrid = document.createElement('div');
        timelineGrid.className = 'gantt-timeline-grid';
        timelineGrid.setAttribute('data-days', days);
        timelineGrid.setAttribute('data-day-width', dayWidth);
        if (timelineTotalWidth !== '100%') {
            timelineGrid.style.width = timelineTotalWidth;
        }
        
        // Her gün için etiket oluştur - günün ortasına hizala
        for (let i = 0; i <= days; i++) {
            const date = new Date(chartStartDate.getTime() + (i * 24 * 60 * 60 * 1000));
            const dayLabel = document.createElement('div');
            dayLabel.className = 'gantt-day-label';
            // Günün ortasına hizala (gün genişliğinin yarısı kadar ekle)
            dayLabel.style.left = `${(i * dayWidth + dayWidth / 2)}%`;
            dayLabel.textContent = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
            timelineGrid.appendChild(dayLabel);
        }
        
        // Her gün için dikey çizgi ekle (hizalama için)
        for (let i = 0; i <= days; i++) {
            const gridLine = document.createElement('div');
            gridLine.className = 'gantt-grid-line';
            gridLine.style.left = `${(i * dayWidth)}%`;
            timelineGrid.appendChild(gridLine);
        }
        
        timelineHeader.appendChild(timelineGrid);
        ganttChart.appendChild(timelineHeader);
        
        // Responsive yükseklik hesaplama - aşama sayısına göre dinamik
        const containerWrapper = ganttContainer.closest('.gantt-container-wrapper');
        const modal = ganttContainer.closest('.modal') || ganttContainer.closest('#productInfoCardModal');
        
        // Modal ve container yüksekliklerini hesapla
        let availableHeight = 500; // Varsayılan
        if (modal) {
            const modalHeight = modal.clientHeight || window.innerHeight * 0.95;
            const modalHeader = modal.querySelector('.modal-header');
            const modalFooter = modal.querySelector('.modal-footer');
            const modalBody = modal.querySelector('.modal-body');
            const ganttHeader = modal.querySelector('.gantt-header');
            
            const headerHeight = (modalHeader ? modalHeader.offsetHeight : 60) + 
                                (ganttHeader ? ganttHeader.offsetHeight : 80) + 40;
            const footerHeight = modalFooter ? modalFooter.offsetHeight : 60;
            const padding = 48; // Modal body padding
            
            availableHeight = modalHeight - headerHeight - footerHeight - padding;
        } else if (containerWrapper) {
            availableHeight = containerWrapper.clientHeight - 160; // Header + footer + padding
        }
        
        // Minimum ve maksimum satır yüksekliği
        const minRowHeight = 36;
        const maxRowHeight = 70;
        const calculatedRowHeight = Math.max(minRowHeight, Math.min(maxRowHeight, Math.floor(availableHeight / plannedStages.length)));
        
        // Timeline bar ve gantt bar yüksekliklerini de orantılı ayarla
        const timelineBarHeight = Math.max(32, calculatedRowHeight - 16);
        const ganttBarHeight = Math.max(24, timelineBarHeight - 8);
        
        // Aşamalar için satırlar oluştur
        const ganttRows = document.createElement('div');
        ganttRows.className = 'gantt-rows';
        ganttRows.style.setProperty('--row-height', `${calculatedRowHeight}px`);
        ganttRows.style.setProperty('--timeline-height', `${timelineBarHeight}px`);
        ganttRows.style.setProperty('--bar-height', `${ganttBarHeight}px`);
        
        plannedStages.forEach((stage, index) => {
            const row = document.createElement('div');
            row.className = 'gantt-row';
            row.style.minHeight = `${calculatedRowHeight}px`;
            
            // Aşama bilgisi (sol taraf)
            const stageInfo = document.createElement('div');
            stageInfo.className = 'gantt-stage-info';
            
            // Miktar bilgisi
            const planMiktar = stage.planMiktar || stage.planlananMiktar || 0;
            const gercekMiktar = stage.gercekMiktar || 0;
            const miktarText = gercekMiktar > 0 
                ? `${gercekMiktar} / ${planMiktar}` 
                : `${planMiktar}`;
            
            stageInfo.innerHTML = `
                <div class="gantt-stage-name">${stage.stageName || stage.productCode}</div>
                <div class="gantt-stage-details">${stage.workCenter || ''}</div>
                <div class="gantt-stage-quantity">
                    <span class="quantity-label">Miktar:</span>
                    <span class="quantity-value">${miktarText}</span>
                </div>
            `;
            row.appendChild(stageInfo);
            
            // Timeline bar alanı - timeline ile aynı genişlikte olmalı
            const timelineBar = document.createElement('div');
            timelineBar.className = 'gantt-timeline-bar';
            timelineBar.setAttribute('data-days', days);
            timelineBar.setAttribute('data-day-width', dayWidth);
            timelineBar.style.height = `${timelineBarHeight}px`;
            if (timelineTotalWidth !== '100%') {
                timelineBar.style.width = timelineTotalWidth;
            }
            
            // Grid çizgileri ekle (hizalama için)
            for (let i = 0; i <= days; i++) {
                const barGridLine = document.createElement('div');
                barGridLine.className = 'gantt-bar-grid-line';
                barGridLine.style.left = `${(i * dayWidth)}%`;
                timelineBar.appendChild(barGridLine);
            }
            
            // Gantt bar oluştur
            const startTime = roundToDayStart(stage.startDate).getTime();
            const endTime = roundToDayEnd(stage.endDate).getTime();
            const chartStartTime = chartStartDate.getTime();
            const chartEndTime = chartEndDate.getTime();
            
            // Pozisyon ve genişlik hesapla (yüzde bazlı)
            const leftPercent = ((startTime - chartStartTime) / totalRange) * 100;
            const widthPercent = ((endTime - startTime) / totalRange) * 100;
            
            // Durum rengini belirle
            let barColor = '#2196F3'; // Varsayılan mavi
            if (stage.status === 'completed') {
                barColor = '#4CAF50'; // Yeşil
            } else if (stage.status === 'in-progress') {
                barColor = '#FF9800'; // Turuncu
            } else if (stage.status === 'planned') {
                barColor = '#2196F3'; // Mavi
            }
            
            const ganttBar = document.createElement('div');
            ganttBar.className = 'gantt-bar';
            ganttBar.style.left = `${leftPercent}%`;
            ganttBar.style.width = `${widthPercent}%`;
            ganttBar.style.height = `${ganttBarHeight}px`;
            ganttBar.style.backgroundColor = barColor;
            ganttBar.style.borderRadius = '4px';
            ganttBar.title = `${stage.stageName || stage.productCode}: ${stage.startDateFormatted || stage.startDate.toLocaleDateString('tr-TR')} - ${stage.endDateFormatted || stage.endDate.toLocaleDateString('tr-TR')}`;
            
            timelineBar.appendChild(ganttBar);
            row.appendChild(timelineBar);
            ganttRows.appendChild(row);
        });
        
        ganttChart.appendChild(ganttRows);
        ganttContainer.appendChild(ganttChart);
    }

    /**
     * Sipariş izleme içeriğini ürün bilgi kartına yükler
     */
    async loadOrderTrackingInProductInfoCard() {
        if (!this.selectedItem) return;

        const loading = document.getElementById('productInfoOrderLoading');
        const content = document.getElementById('productInfoOrderTrackingContent');
        
        if (!loading || !content) return;

        loading.style.display = 'block';
        content.style.display = 'none';

        try {
            const response = await fetch(`/api/order-tracking/${this.selectedItem.isemriNo}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Sipariş bilgileri alınamadı');
            }

            // Sipariş izleme içeriğini oluştur
            this.populateOrderTrackingInProductInfoCard(result.data);
            
            loading.style.display = 'none';
            content.style.display = 'block';

        } catch (error) {
            console.error('Sipariş izleme hatası:', error);
            loading.innerHTML = `
                <div class="error-message">
                    <span class="icon">❌</span>
                    <p>Sipariş bilgileri yüklenirken hata oluştu: ${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Sipariş izleme içeriğini ürün bilgi kartında doldurur
     */
    populateOrderTrackingInProductInfoCard(orderData) {
        const content = document.getElementById('productInfoOrderTrackingContent');
        if (!content) return;

        let html = `
            <div class="order-summary" style="margin-bottom: 20px;">
                <div class="summary-card">
                    <h3>📋 Sipariş Bilgileri</h3>
                    <div class="summary-info">
                        <div class="info-item">
                            <span class="label">Sipariş No:</span>
                            <span class="value">${orderData.sipKod || orderData.sipId || '-'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Müşteri:</span>
                            <span class="value">${orderData.musteriAdi || '-'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Önerilen Teslim:</span>
                            <span class="value">${orderData.onerilenTeslimTarihi || '-'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Sipariş Termini:</span>
                            <span class="value">${orderData.siparisTermini || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="products-section">
                <h3>📦 Sipariş İçeriği</h3>
                <div class="products-list">
        `;

        Object.values(orderData.urunler).forEach(urun => {
            const productCard = this.createProductCard(urun);
            html += productCard.outerHTML;
        });

        html += '</div></div>';
        content.innerHTML = html;
    }

    /**
     * İş emri yazdırma fonksiyonu - Tarih seçimi modalını açar
     */
    printWorkOrder() {
        const modal = document.getElementById('printWorkOrderModal');
        if (!modal) {
            window.planningApp.showError('Yazdırma modalı bulunamadı');
            return;
        }
        
        // Bugünün tarihini varsayılan olarak ayarla
        const today = new Date().toISOString().split('T')[0];
        const startDateInput = document.getElementById('printStartDate');
        const endDateInput = document.getElementById('printEndDate');
        if (startDateInput) {
            startDateInput.value = today;
        }
        if (endDateInput) {
            endDateInput.value = today;
        }
        
        // Form submit event'ini ekle
        const form = document.getElementById('printWorkOrderForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const startDate = startDateInput.value;
                const endDate = endDateInput.value;
                if (!startDate || !endDate) {
                    window.planningApp.showWarning('Lütfen başlangıç ve bitiş tarihlerini seçin');
                    return;
                }
                if (new Date(startDate) > new Date(endDate)) {
                    window.planningApp.showWarning('Başlangıç tarihi bitiş tarihinden büyük olamaz');
                    return;
                }
                this.generateWorkOrderPDF(startDate, endDate);
                modal.style.display = 'none';
            };
        }
        
        modal.style.display = 'block';
    }

    /**
     * İş emri PDF'i oluşturur
     * @param {string} startDate - Başlangıç tarihi (YYYY-MM-DD formatında)
     * @param {string} endDate - Bitiş tarihi (YYYY-MM-DD formatında)
     */
    async generateWorkOrderPDF(startDate, endDate) {
        try {
            // jsPDF ve QRCode kütüphanelerinin yüklendiğini kontrol et
            if (typeof window.jspdf === 'undefined') {
                window.planningApp.showError('PDF kütüphanesi yüklenemedi. Lütfen sayfayı yenileyin.');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape (yatay) A4
            
            // Türkçe karakter desteği için encoding ayarı
            doc.setLanguage('tr');
            
            // Tarihleri formatla
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            const formattedStartDate = startDateObj.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const formattedEndDate = endDateObj.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const dateRangeText = startDate === endDate ? formattedStartDate : `${formattedStartDate} - ${formattedEndDate}`;
            
            // Kolon genişliklerini düzelt (toplam 240mm olmalı)
            const colWidths = [22, 32, 38, 32, 20, 20, 20, 28, 28]; // Toplam 240mm
            const headers = ['Is Emri No', 'Malzeme Kodu', 'Malzeme', 'Firma', 'Miktar', 'Planlanan', 'Gerceklesen', 'Makine', 'QR Kod'];
            
            // Tüm verileri al (tablodan bağımsız, tüm aşamaları getir)
            const allData = window.planningApp?.data || this.data || [];
            
            // Seçilen tarih aralığına göre filtrele (ana kayıtlar ve breakdown'lar dahil)
            const filteredData = [];
            
            allData.forEach(item => {
                // Ana kayıt kontrolü
                if (item.planlananTarih) {
                    const itemDate = new Date(item.planlananTarih).toISOString().split('T')[0];
                    if (itemDate >= startDate && itemDate <= endDate) {
                        filteredData.push(item);
                    }
                }
                
                // Breakdown'ları kontrol et (her breakdown bir aşama olabilir)
                // Breakdown'lar için backend'den aşama bilgilerini çekmemiz gerekiyor
                if (item.breakdowns && Array.isArray(item.breakdowns)) {
                    item.breakdowns.forEach(breakdown => {
                        if (breakdown.planTarihi) {
                            const breakdownDate = new Date(breakdown.planTarihi).toISOString().split('T')[0];
                            if (breakdownDate >= startDate && breakdownDate <= endDate) {
                                // Breakdown için aşama bilgisini almak için isemriId ve parcaNo kullan
                                // Backend'den gelen breakdown'larda bolumAdi yok, bu yüzden
                                // ana kayıttan veya breakdown'dan makAd kullanarak aşama bilgisini bulmaya çalış
                                // Eğer breakdown'da makAd varsa, o makineye ait aşamayı bul
                                const breakdownMakAd = breakdown.makAd || item.makAd;
                                
                                // Breakdown'ı ayrı bir kayıt olarak ekle
                                // bolumAdi artık backend'den geliyor
                                filteredData.push({
                                    ...item,
                                    bolumAdi: breakdown.bolumAdi || item.bolumAdi || 'TANIMSIZ',
                                    makAd: breakdownMakAd || item.makAd,
                                    planlananTarih: breakdown.planTarihi,
                                    planlananMiktar: breakdown.planlananMiktar || item.planlananMiktar,
                                    isemriId: breakdown.isemriId || item.isemriId,
                                    isemriNo: item.isemriNo,
                                    malhizKodu: breakdown.malhizKodu || item.malhizKodu,
                                    malhizAdi: breakdown.malhizAdi || item.malhizAdi,
                                    imalatTuru: item.imalatTuru, // PDF için imalatTuru bilgisini koru
                                    firmaAdi: item.firmaAdi,
                                    planMiktar: item.planMiktar || item.siparisMiktar,
                                    gercekMiktar: breakdown.gercekMiktar !== undefined ? breakdown.gercekMiktar : item.gercekMiktar,
                                    selectedMachine: breakdown.selectedMachine || item.selectedMachine,
                                    parcaNo: breakdown.parcaNo
                                });
                            }
                        }
                    });
                }
            });
            
            if (filteredData.length === 0) {
                window.planningApp.showWarning(`Seçilen tarih aralığı (${dateRangeText}) için planlama verisi bulunamadı.`);
                return;
            }
            
            // Verileri aşamalara (bölümlere) göre grupla
            const dataByStage = {};
            filteredData.forEach(item => {
                const stageKey = item.bolumAdi || item.department || 'TANIMSIZ';
                if (!dataByStage[stageKey]) {
                    dataByStage[stageKey] = [];
                }
                dataByStage[stageKey].push(item);
            });
            
            // Aşamaları sırala (alfabetik)
            const stages = Object.keys(dataByStage).sort();
            
            // Türkçe karakterleri koruma fonksiyonu
            const fixTurkishChars = (text) => {
                if (!text) return '-';
                return String(text)
                    .replace(/İ/g, 'I')
                    .replace(/ı/g, 'i')
                    .replace(/Ş/g, 'S')
                    .replace(/ş/g, 's')
                    .replace(/Ğ/g, 'G')
                    .replace(/ğ/g, 'g')
                    .replace(/Ü/g, 'U')
                    .replace(/ü/g, 'u')
                    .replace(/Ö/g, 'O')
                    .replace(/ö/g, 'o')
                    .replace(/Ç/g, 'C')
                    .replace(/ç/g, 'c');
            };
            
            // Her aşama için ayrı sayfa oluştur
            for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
                const stageName = stages[stageIndex];
                const stageData = dataByStage[stageName];
                
                // Her aşama için yeni sayfa (ilk sayfa hariç)
                if (stageIndex > 0) {
                    doc.addPage();
                }
                
                // Aşama başlığı
                doc.setFontSize(16);
                doc.setTextColor(30, 60, 114);
                doc.setFont(undefined, 'bold');
                const stageTitle = fixTurkishChars(stageName);
                doc.text(`ASAMA: ${stageTitle}`, 148, 20, { align: 'center' });
                
                // Tarih bilgisi (her sayfada)
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'normal');
                doc.text(`Planlama Tarihi: ${dateRangeText}`, 148, 28, { align: 'center' });
                
                // Tablo başlıkları (her sayfada)
                const pageStartY = 38;
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                let xPos = 10;
                
                headers.forEach((header, index) => {
                    const centerX = xPos + colWidths[index] / 2;
                    doc.text(header, centerX, pageStartY, { align: 'center', maxWidth: colWidths[index] - 2 });
                    xPos += colWidths[index];
                });
                
                // Tablo çizgileri (başlık altı)
                doc.setLineWidth(0.5);
                doc.line(10, pageStartY + 5, 250, pageStartY + 5);
                
                // Satırları oluştur
                let currentY = pageStartY + 12;
                const rowHeight = 20;
                const pageHeight = 190; // A4 landscape yüksekliği (margins dahil)
                
                // Bu aşamadaki işleri yazdır
                for (let index = 0; index < stageData.length; index++) {
                    const item = stageData[index];
                
                    // Sayfa sonu kontrolü (aynı aşama içinde sayfa taşması durumunda)
                    if (currentY + rowHeight > pageHeight) {
                        doc.addPage();
                        // Yeni sayfada başlıkları tekrar yaz
                        doc.setFontSize(16);
                        doc.setTextColor(30, 60, 114);
                        doc.setFont(undefined, 'bold');
                        doc.text(`ASAMA: ${stageTitle}`, 148, 20, { align: 'center' });
                        doc.setFontSize(10);
                        doc.setTextColor(0, 0, 0);
                        doc.setFont(undefined, 'normal');
                        doc.text(`Planlama Tarihi: ${dateRangeText}`, 148, 28, { align: 'center' });
                        doc.setFontSize(9);
                        doc.setFont(undefined, 'bold');
                        let headerXPos = 10;
                        headers.forEach((header, hIndex) => {
                            const centerX = headerXPos + colWidths[hIndex] / 2;
                            doc.text(header, centerX, pageStartY, { align: 'center', maxWidth: colWidths[hIndex] - 2 });
                            headerXPos += colWidths[hIndex];
                        });
                        doc.setLineWidth(0.5);
                        doc.line(10, pageStartY + 5, 250, pageStartY + 5);
                        currentY = pageStartY + 12;
                    }
                    
                    // Satır çizgisi
                    doc.setLineWidth(0.2);
                    doc.line(10, currentY - 5, 250, currentY - 5);
                    
                    // Verileri yaz
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(8);
                    let rowXPos = 10; // Her satır için xPos'u sıfırla
                
                    // İş Emri No
                    const isemriNo = String(item.isemriNo || '-');
                    doc.text(isemriNo, rowXPos + colWidths[0] / 2, currentY, { align: 'center', maxWidth: colWidths[0] - 2 });
                    rowXPos += colWidths[0];
                    
                    // Malzeme Kodu
                    const malhizKodu = String(item.malhizKodu || '-');
                    doc.text(malhizKodu, rowXPos + colWidths[1] / 2, currentY, { align: 'center', maxWidth: colWidths[1] - 2 });
                    rowXPos += colWidths[1];
                    
                    // Malzeme (tablodaki gibi imalatTuru kullan)
                    const malzeme = fixTurkishChars(item.imalatTuru || item.malhizAdi || '-');
                    const malzemeShort = malzeme.length > 18 ? malzeme.substring(0, 15) + '...' : malzeme;
                    doc.text(malzemeShort, rowXPos + colWidths[2] / 2, currentY, { align: 'center', maxWidth: colWidths[2] - 2 });
                    rowXPos += colWidths[2];
                    
                    // Firma
                    const firma = fixTurkishChars(item.firmaAdi || '-');
                    const firmaShort = firma.length > 15 ? firma.substring(0, 12) + '...' : firma;
                    doc.text(firmaShort, rowXPos + colWidths[3] / 2, currentY, { align: 'center', maxWidth: colWidths[3] - 2 });
                    rowXPos += colWidths[3];
                    
                    // Miktar
                    const miktar = String(item.planMiktar || item.siparisMiktar || 0);
                    doc.text(miktar, rowXPos + colWidths[4] / 2, currentY, { align: 'center' });
                    rowXPos += colWidths[4];
                    
                    // Planlanan
                    const planlanan = String(item.planlananMiktar || 0);
                    doc.text(planlanan, rowXPos + colWidths[5] / 2, currentY, { align: 'center' });
                    rowXPos += colWidths[5];
                    
                    // Gerçekleşen
                    const gerceklestirilen = String(item.gercekMiktar || 0);
                    doc.text(gerceklestirilen, rowXPos + colWidths[6] / 2, currentY, { align: 'center' });
                    rowXPos += colWidths[6];
                    
                    // Makine
                    const makine = fixTurkishChars(item.makAd || item.selectedMachine || '-');
                    const makineShort = makine.length > 12 ? makine.substring(0, 9) + '...' : makine;
                    doc.text(makineShort, rowXPos + colWidths[7] / 2, currentY, { align: 'center', maxWidth: colWidths[7] - 2 });
                    rowXPos += colWidths[7];
                
                // QR Kod oluştur (iş emri ID ile)
                try {
                    const qrData = String(item.isemriId || item.isemriNo || '');
                    if (qrData && typeof QRCode !== 'undefined') {
                        // QR kod için data URL oluştur
                        const qrDataUrl = await QRCode.toDataURL(qrData, {
                            width: 80,
                            margin: 1,
                            color: {
                                dark: '#000000',
                                light: '#FFFFFF'
                            }
                        });
                        
                        // QR kod görselini PDF'e ekle (hizalama düzeltildi)
                        const qrSize = 20;
                        const qrX = rowXPos + (colWidths[8] - qrSize) / 2;
                        const qrY = currentY - 10;
                        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
                    } else {
                        doc.text('QR', rowXPos + colWidths[8] / 2, currentY, { align: 'center' });
                    }
                } catch (qrError) {
                    console.error('QR kod ekleme hatası:', qrError);
                    doc.text('QR', rowXPos + colWidths[8] / 2, currentY, { align: 'center' });
                    }
                    
                    currentY += rowHeight;
                }
                
                // Aşama sonu alt çizgi
                doc.setLineWidth(0.5);
                doc.line(10, currentY - 5, 250, currentY - 5);
            }
            
            // Sayfa numarası ve tarih (tüm sayfalara ekle)
            const totalPages = doc.internal.pages.length - 1;
            const creationDate = new Date().toLocaleString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(`Sayfa ${i} / ${totalPages}`, 148, 200, { align: 'center' });
                doc.text(`Olusturulma: ${creationDate}`, 148, 205, { align: 'center' });
            }
            
            // PDF'i indir
            const dateRange = startDate === endDate 
                ? startDate.replace(/-/g, '_')
                : `${startDate.replace(/-/g, '_')}_${endDate.replace(/-/g, '_')}`;
            const fileName = `Is_Emri_Plani_${dateRange}.pdf`;
            doc.save(fileName);
            
            window.planningApp.showSuccess(`PDF başarıyla oluşturuldu: ${fileName}`);
            
        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            window.planningApp.showError('PDF oluşturulurken hata oluştu: ' + error.message);
        }
    }

    /**
     * Sevkiyat planı yazdırma fonksiyonu - Tarih aralığı seçimi modalını açar
     */
    printShippingPlan() {
        const modal = document.getElementById('printShippingPlanModal');
        if (!modal) {
            window.planningApp.showError('Sevkiyat planı modalı bulunamadı');
            return;
        }
        
        // Bugünün tarihini varsayılan başlangıç, 7 gün sonrasını varsayılan bitiş olarak ayarla
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        
        const startDateInput = document.getElementById('shippingStartDate');
        const endDateInput = document.getElementById('shippingEndDate');
        
        if (startDateInput) {
            startDateInput.value = today.toISOString().split('T')[0];
        }
        if (endDateInput) {
            endDateInput.value = endDate.toISOString().split('T')[0];
        }
        
        // Form submit event'ini ekle
        const form = document.getElementById('printShippingPlanForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const startDate = startDateInput.value;
                const endDate = endDateInput.value;
                
                if (!startDate || !endDate) {
                    window.planningApp.showWarning('Lütfen başlangıç ve bitiş tarihlerini seçin');
                    return;
                }
                
                if (new Date(startDate) > new Date(endDate)) {
                    window.planningApp.showWarning('Başlangıç tarihi bitiş tarihinden sonra olamaz');
                    return;
                }
                
                this.generateShippingPlanPDF(startDate, endDate);
                modal.style.display = 'none';
            };
        }
        
        modal.style.display = 'block';
    }

    /**
     * Sevkiyat planı Excel export fonksiyonu
     */
    async generateShippingPlanExcel() {
        const startDateInput = document.getElementById('shippingStartDate');
        const endDateInput = document.getElementById('shippingEndDate');
        
        if (!startDateInput || !endDateInput) {
            window.planningApp.showError('Tarih alanları bulunamadı');
            return;
        }
        
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        if (!startDate || !endDate) {
            window.planningApp.showWarning('Lütfen başlangıç ve bitiş tarihlerini seçin');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            window.planningApp.showWarning('Başlangıç tarihi bitiş tarihinden sonra olamaz');
            return;
        }
        
        try {
            // SheetJS kütüphanesinin yüklendiğini kontrol et
            if (typeof XLSX === 'undefined') {
                window.planningApp.showError('Excel kütüphanesi yüklenemedi. Lütfen sayfayı yenileyin.');
                return;
            }
            
            // Backend'den sevkiyat planı verilerini çek
            window.planningApp.showInfo('Sevkiyat planı verileri yükleniyor...');
            const response = await fetch(`/api/shipping-plan?startDate=${startDate}&endDate=${endDate}`);
            const result = await response.json();
            
            if (!result.success) {
                window.planningApp.showError(result.message || 'Sevkiyat planı verileri yüklenemedi');
                return;
            }
            
            if (!result.data || result.data.length === 0) {
                window.planningApp.showWarning('Seçilen tarih aralığında sevkiyat planı bulunamadı');
                return;
            }
            
            // Excel workbook oluştur
            const wb = XLSX.utils.book_new();
            
            // Tarih formatlama fonksiyonu
            const formatDate = (dateStr) => {
                if (!dateStr) return '-';
                const date = new Date(dateStr);
                return date.toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            };
            
            // Her gün için ayrı sheet oluştur
            result.data.forEach((dayData, dayIndex) => {
                const wsData = [];
                
                // Başlık satırı
                wsData.push(['SEVKIYAT PLANI', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
                wsData.push(['Tarih:', formatDate(dayData.tarih), '', '', '', '', '', '', '', '', '', '', '', '', '']);
                wsData.push(['Tarih Aralığı:', `${formatDate(startDate)} - ${formatDate(endDate)}`, '', '', '', '', '', '', '', '', '', '', '', '', '']);
                wsData.push([]); // Boş satır
                
                // Ana başlık satırı
                wsData.push([
                    'İş Emri No',
                    'Malzeme Kodu',
                    'Firma',
                    'Miktar',
                    'Ağırlık (KG)',
                    'Durum',
                    'Plan Tarihi',
                    'Önerilen Teslim',
                    'Aşama',
                    'Aşama Durum',
                    'İş Merkezi',
                    'Planlanan',
                    'Gerçekleşen',
                    'Kalan',
                    'Aşama Plan Tarihi'
                ]);
                
                // Ürün verileri
                dayData.urunler.forEach(urun => {
                    // Ana ürün satırı
                    const toplamAgirlik = (urun.agirlik || 0) * (urun.paketlemeMiktar || 0);
                    const asamalar = urun.asamalar || [];
                    
                    // En ileri aşama durumu
                    let enIleriDurum = 'BEKLEMEDE';
                    if (asamalar.some(a => a.durum === 'TAMAMLANDI')) {
                        enIleriDurum = 'TAMAMLANDI';
                    } else if (asamalar.some(a => a.durum === 'DEVAM_EDIYOR')) {
                        enIleriDurum = 'DEVAM EDİYOR';
                    } else if (asamalar.some(a => a.durum === 'PLANLANDI')) {
                        enIleriDurum = 'PLANLANDI';
                    }
                    
                    // Ana ürün satırı (aşama bilgileri boş)
                    wsData.push([
                        urun.isemriNo || '-',
                        urun.malhizKodu || '-',
                        urun.firmaAdi || '-',
                        urun.paketlemeMiktar || 0,
                        toplamAgirlik > 0 ? toplamAgirlik.toFixed(1) : '-',
                        enIleriDurum,
                        formatDate(urun.planTarihi),
                        formatDate(urun.onerilenTeslimTarihi),
                        '', // Aşama
                        '', // Aşama Durum
                        '', // İş Merkezi
                        '', // Planlanan
                        '', // Gerçekleşen
                        '', // Kalan
                        ''  // Aşama Plan Tarihi
                    ]);
                    
                    // Alt kırılım: Her aşama için ayrı satır (maça, kalıp vb.)
                    if (asamalar.length > 0) {
                        asamalar
                            .sort((a, b) => a.isemriSira - b.isemriSira)
                            .forEach(asama => {
                                const planlananMiktar = asama.planlananMiktar || asama.planMiktar || 0;
                                const gercekMiktar = asama.gercekMiktar || 0;
                                const kalanMiktar = Math.max(0, planlananMiktar - gercekMiktar);
                                
                                // Durum metnini düzelt
                                let durumText = asama.durum || 'BEKLEMEDE';
                                if (durumText === 'DEVAM_EDIYOR') {
                                    durumText = 'DEVAM EDİYOR';
                                } else if (durumText === 'TAMAMLANDI') {
                                    durumText = 'TAMAMLANDI';
                                } else if (durumText === 'PLANLANDI') {
                                    durumText = 'PLANLANDI';
                                }
                                
                                // Alt kırılım satırı - ilk 8 kolon boş, aşama bilgileri dolu
                                wsData.push([
                                    '', // İş Emri No (boş - üst satırdan devam)
                                    '', // Malzeme Kodu (boş - üst satırdan devam)
                                    '', // Firma (boş - üst satırdan devam)
                                    '', // Miktar (boş - üst satırdan devam)
                                    '', // Ağırlık (boş - üst satırdan devam)
                                    '', // Durum (boş - üst satırdan devam)
                                    '', // Plan Tarihi (boş - üst satırdan devam)
                                    '', // Önerilen Teslim (boş - üst satırdan devam)
                                    `  → ${asama.bolumAdi || '-'}`, // Aşama (girintili)
                                    durumText, // Aşama Durum
                                    asama.makAd || '-', // İş Merkezi
                                    planlananMiktar, // Planlanan
                                    gercekMiktar, // Gerçekleşen
                                    kalanMiktar, // Kalan
                                    formatDate(asama.planTarihi) // Aşama Plan Tarihi
                                ]);
                            });
                        
                        // Aşamalar sonrası boş satır
                        wsData.push([]);
                    }
                });
                
                // Worksheet oluştur
                const ws = XLSX.utils.aoa_to_sheet(wsData);
                
                // Kolon genişliklerini ayarla
                ws['!cols'] = [
                    { wch: 12 }, // İş Emri No
                    { wch: 20 }, // Malzeme Kodu
                    { wch: 25 }, // Firma
                    { wch: 10 }, // Miktar
                    { wch: 12 }, // Ağırlık
                    { wch: 15 }, // Durum
                    { wch: 12 }, // Plan Tarihi
                    { wch: 15 }, // Önerilen Teslim
                    { wch: 20 }, // Aşama
                    { wch: 15 }, // Aşama Durum
                    { wch: 20 }, // İş Merkezi
                    { wch: 12 }, // Planlanan
                    { wch: 12 }, // Gerçekleşen
                    { wch: 12 }, // Kalan
                    { wch: 15 }  // Aşama Plan Tarihi
                ];
                
                // Başlık satırlarını kalın yap
                const headerRange = XLSX.utils.decode_range(ws['!ref']);
                for (let R = 0; R <= 3; R++) {
                    for (let C = 0; C <= 14; C++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws[cellAddress]) continue;
                        ws[cellAddress].s = {
                            font: { bold: true },
                            fill: { fgColor: { rgb: "E0E0E0" } }
                        };
                    }
                }
                
                // Ana başlık satırını (satır 4) özel formatla
                for (let C = 0; C <= 14; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 4, c: C });
                    if (!ws[cellAddress]) continue;
                    ws[cellAddress].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" } },
                        fill: { fgColor: { rgb: "1E3C72" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
                
                // Sheet adı (tarih)
                const sheetName = formatDate(dayData.tarih).replace(/\//g, '-');
                XLSX.utils.book_append_sheet(wb, ws, sheetName.length > 31 ? sheetName.substring(0, 31) : sheetName);
            });
            
            // Excel dosyasını indir
            const fileName = `Sevkiyat_Plani_${startDate.replace(/-/g, '_')}_${endDate.replace(/-/g, '_')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            window.planningApp.showSuccess(`Excel dosyası başarıyla oluşturuldu: ${fileName}`);
            
            // Modal'ı kapat
            const modal = document.getElementById('printShippingPlanModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Excel oluşturma hatası:', error);
            window.planningApp.showError('Excel oluşturulurken hata oluştu: ' + error.message);
        }
    }

    /**
     * Sevkiyat planı PDF'i oluşturur
     * @param {string} startDate - Başlangıç tarihi (YYYY-MM-DD formatında)
     * @param {string} endDate - Bitiş tarihi (YYYY-MM-DD formatında)
     */
    async generateShippingPlanPDF(startDate, endDate) {
        try {
            // jsPDF kütüphanesinin yüklendiğini kontrol et
            if (typeof window.jspdf === 'undefined') {
                window.planningApp.showError('PDF kütüphanesi yüklenemedi. Lütfen sayfayı yenileyin.');
                return;
            }
            
            // Backend'den sevkiyat planı verilerini çek
            window.planningApp.showInfo('Sevkiyat planı verileri yükleniyor...');
            const response = await fetch(`/api/shipping-plan?startDate=${startDate}&endDate=${endDate}`);
            const result = await response.json();
            
            if (!result.success) {
                window.planningApp.showError(result.message || 'Sevkiyat planı verileri yüklenemedi');
                return;
            }
            
            if (!result.data || result.data.length === 0) {
                window.planningApp.showWarning('Seçilen tarih aralığında sevkiyat planı bulunamadı');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape (yatay) A4
            
            // Türkçe karakter desteği için encoding ayarı
            doc.setLanguage('tr');
            
            // Tarih formatlama fonksiyonu
            const formatDate = (dateStr) => {
                if (!dateStr) return '-';
                const date = new Date(dateStr);
                return date.toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            };
            
            // Türkçe karakterleri koruma fonksiyonu
            const fixTurkishChars = (text) => {
                if (!text) return '-';
                return String(text)
                    .replace(/İ/g, 'I')
                    .replace(/ı/g, 'i')
                    .replace(/Ş/g, 'S')
                    .replace(/ş/g, 's')
                    .replace(/Ğ/g, 'G')
                    .replace(/ğ/g, 'g')
                    .replace(/Ü/g, 'U')
                    .replace(/ü/g, 'u')
                    .replace(/Ö/g, 'O')
                    .replace(/ö/g, 'o')
                    .replace(/Ç/g, 'C')
                    .replace(/ç/g, 'c');
            };
            
            // Durum renkleri
            const getStatusColor = (durum) => {
                switch (durum) {
                    case 'TAMAMLANDI': return [34, 139, 34]; // Yeşil
                    case 'DEVAM_EDIYOR': return [255, 165, 0]; // Turuncu
                    case 'PLANLANDI': return [30, 144, 255]; // Mavi
                    case 'BEKLEMEDE': return [128, 128, 128]; // Gri
                    default: return [0, 0, 0]; // Siyah
                }
            };
            
            // Her gün için ayrı sayfa oluştur
            for (let dayIndex = 0; dayIndex < result.data.length; dayIndex++) {
                const dayData = result.data[dayIndex];
                
                // Her gün için yeni sayfa (ilk sayfa hariç)
                if (dayIndex > 0) {
                    doc.addPage();
                }
                
                // Gün başlığı
                doc.setFontSize(18);
                doc.setTextColor(30, 60, 114);
                doc.setFont(undefined, 'bold');
                const dayTitle = `SEVKIYAT PLANI - ${formatDate(dayData.tarih)}`;
                doc.text(dayTitle, 148, 20, { align: 'center' });
                
                // Tarih aralığı bilgisi
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'normal');
                doc.text(`Tarih Araligi: ${formatDate(startDate)} - ${formatDate(endDate)}`, 148, 28, { align: 'center' });
                
                if (dayData.urunler.length === 0) {
                    doc.setFontSize(12);
                    doc.setTextColor(128, 128, 128);
                    doc.text('Bu tarih icin sevkiyat plani bulunmadi.', 148, 50, { align: 'center' });
                    continue;
                }
                
                // Tablo başlıkları
                const pageStartY = 38;
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                let xPos = 10;
                
                const colWidths = [20, 30, 35, 25, 20, 20, 20, 30, 30]; // Toplam 230mm
                const headers = ['Is Emri', 'Malzeme Kodu', 'Firma', 'Miktar', 'Agirlik', 'Durum', 'Asamalar', 'Plan Tarihi', 'Teslim'];
                
                headers.forEach((header, index) => {
                    const centerX = xPos + colWidths[index] / 2;
                    doc.text(header, centerX, pageStartY, { align: 'center', maxWidth: colWidths[index] - 2 });
                    xPos += colWidths[index];
                });
                
                // Tablo çizgileri (başlık altı)
                doc.setLineWidth(0.5);
                doc.line(10, pageStartY + 5, 240, pageStartY + 5);
                
                // Satırları oluştur
                let currentY = pageStartY + 12;
                const rowHeight = 25;
                const pageHeight = 190; // A4 landscape yüksekliği (margins dahil)
                
                // Bu gündeki ürünleri yazdır
                for (let urunIndex = 0; urunIndex < dayData.urunler.length; urunIndex++) {
                    const urun = dayData.urunler[urunIndex];
                    
                    // Sayfa sonu kontrolü
                    if (currentY + rowHeight > pageHeight) {
                        doc.addPage();
                        // Yeni sayfada başlıkları tekrar yaz
                        doc.setFontSize(18);
                        doc.setTextColor(30, 60, 114);
                        doc.setFont(undefined, 'bold');
                        doc.text(dayTitle, 148, 20, { align: 'center' });
                        doc.setFontSize(10);
                        doc.setTextColor(0, 0, 0);
                        doc.setFont(undefined, 'normal');
                        doc.text(`Tarih Araligi: ${formatDate(startDate)} - ${formatDate(endDate)}`, 148, 28, { align: 'center' });
                        doc.setFontSize(9);
                        doc.setFont(undefined, 'bold');
                        let headerXPos = 10;
                        headers.forEach((header, hIndex) => {
                            const centerX = headerXPos + colWidths[hIndex] / 2;
                            doc.text(header, centerX, pageStartY, { align: 'center', maxWidth: colWidths[hIndex] - 2 });
                            headerXPos += colWidths[hIndex];
                        });
                        doc.setLineWidth(0.5);
                        doc.line(10, pageStartY + 5, 240, pageStartY + 5);
                        currentY = pageStartY + 12;
                    }
                    
                    // Satır çizgisi
                    doc.setLineWidth(0.2);
                    doc.line(10, currentY - 5, 240, currentY - 5);
                    
                    // Verileri yaz
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(7);
                    let rowXPos = 10;
                    
                    // İş Emri No
                    const isemriNo = String(urun.isemriNo || '-');
                    doc.text(isemriNo, rowXPos + colWidths[0] / 2, currentY, { align: 'center', maxWidth: colWidths[0] - 2 });
                    rowXPos += colWidths[0];
                    
                    // Malzeme Kodu
                    const malzemeKodu = fixTurkishChars(urun.malhizKodu || '-');
                    const malzemeKoduShort = malzemeKodu.length > 20 ? malzemeKodu.substring(0, 17) + '...' : malzemeKodu;
                    doc.text(malzemeKoduShort, rowXPos + colWidths[1] / 2, currentY, { align: 'center', maxWidth: colWidths[1] - 2 });
                    rowXPos += colWidths[1];
                    
                    // Firma
                    const firma = fixTurkishChars(urun.firmaAdi || '-');
                    const firmaShort = firma.length > 15 ? firma.substring(0, 12) + '...' : firma;
                    doc.text(firmaShort, rowXPos + colWidths[2] / 2, currentY, { align: 'center', maxWidth: colWidths[2] - 2 });
                    rowXPos += colWidths[2];
                    
                    // Miktar
                    const miktar = String(urun.paketlemeMiktar || 0);
                    doc.text(miktar, rowXPos + colWidths[3] / 2, currentY, { align: 'center' });
                    rowXPos += colWidths[3];
                    
                    // Ağırlık (toplam)
                    const toplamAgirlik = (urun.agirlik || 0) * (urun.paketlemeMiktar || 0);
                    const agirlikText = toplamAgirlik > 0 ? `${toplamAgirlik.toFixed(1)} KG` : '-';
                    doc.text(agirlikText, rowXPos + colWidths[4] / 2, currentY, { align: 'center' });
                    rowXPos += colWidths[4];
                    
                    // Durum (en ileri aşama durumu)
                    const asamalar = urun.asamalar || [];
                    let enIleriDurum = 'BEKLEMEDE';
                    if (asamalar.some(a => a.durum === 'TAMAMLANDI')) {
                        enIleriDurum = 'TAMAMLANDI';
                    } else if (asamalar.some(a => a.durum === 'DEVAM_EDIYOR')) {
                        enIleriDurum = 'DEVAM_EDIYOR';
                    } else if (asamalar.some(a => a.durum === 'PLANLANDI')) {
                        enIleriDurum = 'PLANLANDI';
                    }
                    
                    const durumColor = getStatusColor(enIleriDurum);
                    doc.setTextColor(durumColor[0], durumColor[1], durumColor[2]);
                    doc.setFont(undefined, 'bold');
                    const durumText = enIleriDurum.replace('_', ' ');
                    doc.text(durumText, rowXPos + colWidths[5] / 2, currentY, { align: 'center', maxWidth: colWidths[5] - 2 });
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'normal');
                    rowXPos += colWidths[5];
                    
                    // Aşamalar (kısaltılmış)
                    const asamaTexts = asamalar
                        .sort((a, b) => a.isemriSira - b.isemriSira)
                        .slice(0, 3) // İlk 3 aşama
                        .map(a => {
                            const durumKisa = a.durum === 'TAMAMLANDI' ? '✓' : 
                                            a.durum === 'DEVAM_EDIYOR' ? '→' : 
                                            a.durum === 'PLANLANDI' ? '○' : '◯';
                            // Bölüm adını düzgün formatla
                            let bolumAdi = a.bolumAdi || '';
                            if (bolumAdi) {
                                // Türkçe karakterleri düzelt
                                bolumAdi = fixTurkishChars(bolumAdi);
                                // Eğer "08.PAKETLEME" gibi bir format varsa, sadece "08.PAK" gibi göster
                                // Veya sadece bölüm adının ilk anlamlı kısmını al
                                if (bolumAdi.includes('.')) {
                                    // "08.PAKETLEME" -> "08.PAK"
                                    const parts = bolumAdi.split('.');
                                    if (parts.length > 1) {
                                        bolumAdi = parts[0] + '.' + parts[1].substring(0, 3);
                                    } else {
                                        bolumAdi = bolumAdi.substring(0, 6);
                                    }
                                } else {
                                    bolumAdi = bolumAdi.substring(0, 6);
                                }
                            } else {
                                bolumAdi = '-';
                            }
                            return `${durumKisa}${bolumAdi}`;
                        })
                        .join(' ');
                    const asamaText = asamalar.length > 3 ? asamaTexts + '...' : asamaTexts;
                    doc.text(asamaText || '-', rowXPos + colWidths[6] / 2, currentY, { align: 'center', maxWidth: colWidths[6] - 2 });
                    rowXPos += colWidths[6];
                    
                    // Plan Tarihi
                    const planTarihi = formatDate(urun.planTarihi);
                    doc.text(planTarihi, rowXPos + colWidths[7] / 2, currentY, { align: 'center' });
                    rowXPos += colWidths[7];
                    
                    // Önerilen Teslim
                    const teslimTarihi = formatDate(urun.onerilenTeslimTarihi);
                    doc.text(teslimTarihi, rowXPos + colWidths[8] / 2, currentY, { align: 'center' });
                    
                    currentY += rowHeight;
                }
                
                // Gün sonu alt çizgi
                doc.setLineWidth(0.5);
                doc.line(10, currentY - 5, 240, currentY - 5);
            }
            
            // Sayfa numarası ve tarih (tüm sayfalara ekle)
            const totalPages = doc.internal.pages.length - 1;
            const creationDate = new Date().toLocaleString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(`Sayfa ${i} / ${totalPages}`, 148, 200, { align: 'center' });
                doc.text(`Olusturulma: ${creationDate}`, 148, 205, { align: 'center' });
            }
            
            // PDF'i indir
            const fileName = `Sevkiyat_Plani_${startDate.replace(/-/g, '_')}_${endDate.replace(/-/g, '_')}.pdf`;
            doc.save(fileName);
            
            window.planningApp.showSuccess(`PDF başarıyla oluşturuldu: ${fileName}`);
            
        } catch (error) {
            console.error('Sevkiyat planı PDF oluşturma hatası:', error);
            window.planningApp.showError('PDF oluşturulurken hata oluştu: ' + error.message);
        }
    }

    /**
     * Üretim süreci izleme modalını açar
     * @param {Object} item - Seçilen iş emri verisi
     */
    async openProductionTrackingModal(item) {
        try {
            const modal = document.getElementById('productionTrackingModal');
            const title = document.getElementById('productionTrackingTitle');
            
            // Modal başlığını güncelle
            title.textContent = `Üretim Süreci İzleme - ${item.isemriNo}`;
            
            // Loading göster
            this.showProductionTrackingLoading();
            
            // Backend'den aşama verilerini çek
            const response = await fetch(`/api/production-stages/${item.isemriNo}`);
            const result = await response.json();
            
            if (result.success) {
                this.populateProductionTrackingModal(result.data);
            } else {
                window.planningApp.showError(result.message || 'Üretim aşamaları yüklenemedi');
                return;
            }
            
            // Modal'ı göster
            modal.style.display = 'block';
            
        } catch (error) {
            console.error('Üretim süreci izleme modal hatası:', error);
            window.planningApp.showError('Üretim süreci izleme modalı açılırken hata oluştu');
        }
    }

    /**
     * Üretim süreci izleme modalında loading gösterir
     */
    showProductionTrackingLoading() {
        const workflowCards = document.getElementById('workflowCards');
        const stagesTableBody = document.getElementById('stagesTableBody');
        
        workflowCards.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Yükleniyor...</div>';
        stagesTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #666;">Yükleniyor...</td></tr>';
        
        // Summary bilgilerini sıfırla
        document.getElementById('mainProduct').textContent = '-';
        document.getElementById('totalStages').textContent = '-';
        document.getElementById('completedStages').textContent = '-';
        document.getElementById('activeStage').textContent = '-';
        document.getElementById('overallProgress').textContent = '-';
        document.getElementById('completedUnits').textContent = '-';
    }

    /**
     * Üretim süreci izleme modalını verilerle doldurur
     * @param {Object} data - Backend'den gelen aşama verileri
     */
    populateProductionTrackingModal(data) {
        // Summary bilgilerini güncelle
        document.getElementById('mainProduct').textContent = data.mainProduct;
        document.getElementById('totalStages').textContent = data.totalStages;
        document.getElementById('completedStages').textContent = data.completedStages;
        document.getElementById('activeStage').textContent = data.activeStage;
        document.getElementById('overallProgress').textContent = `${data.overallProgress}%`;
        document.getElementById('completedUnits').textContent = data.completedUnits;
        
        // Workflow subtitle'ı güncelle
        document.getElementById('workflowSubtitle').textContent = `${data.mainProduct} ürününün tüm üretim aşamaları`;
        
        // Görsel izleme kartlarını oluştur
        this.createWorkflowCards(data.stages);
        
        // Tablosal izleme tablosunu oluştur
        this.createStagesTable(data.stages);
        
        // Timeline indicator'ı güncelle
        this.updateTimelineIndicator(data.stages);
        
        // Gantt chart'ı oluştur
        this.createGanttChart(data.stages);
        
        // Veriyi global olarak sakla (tab değişimlerinde kullanmak için)
        window.currentProductionStages = data.stages;
    }

    /**
     * Workflow kartlarını oluşturur
     * @param {Array} stages - Aşama verileri
     */
    createWorkflowCards(stages) {
        const workflowCards = document.getElementById('workflowCards');
        workflowCards.innerHTML = '';
        
        stages.forEach((stage, index) => {
            const card = document.createElement('div');
            card.className = `workflow-card ${stage.status}`;
            
            const statusIcon = this.getStatusIcon(stage.status);
            const statusText = this.getStatusText(stage.status);
            
            const stageTitle = stage.productCode || stage.stageName || `Aşama ${index + 1}`;
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-stage">${stageTitle}</div>
                    <div class="card-status ${stage.status}">
                        <span>${statusIcon}</span>
                        <span>${statusText}</span>
                    </div>
                </div>
                <div class="card-product-code">${stage.productCode}</div>
                <div class="card-progress">
                    <div class="progress-label">İlerleme: ${stage.progress}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill ${stage.status}" style="width: ${stage.progress}%"></div>
                    </div>
                    <div class="progress-text">${stage.progress}%</div>
                </div>
                <div class="card-work-center">İş Merkezi: ${stage.workCenter}</div>
                <div class="card-schedule">
                    ${stage.startDateFormatted ? `
                        <div class="schedule-item">Başlangıç: ${stage.startDateFormatted}</div>
                        <div class="schedule-item">Bitiş: ${stage.endDateFormatted}</div>
                        <div class="schedule-item">Saat: ${stage.startTime}-${stage.endTime}</div>
                    ` : '<div class="schedule-item">Planlanmamış</div>'}
                </div>
            `;
            
            workflowCards.appendChild(card);
        });
    }

    /**
     * Aşamalar tablosunu oluşturur
     * @param {Array} stages - Aşama verileri
     */
    createStagesTable(stages) {
        const stagesTableBody = document.getElementById('stagesTableBody');
        stagesTableBody.innerHTML = '';
        
        stages.forEach(stage => {
            const row = document.createElement('tr');
            
            const statusText = this.getStatusText(stage.status);
            
            // Aşama sütununda bölüm adını göster
            const stageTitle = stage.stageName || stage.productCode || '';
            row.innerHTML = `
                <td>${stageTitle}</td>
                <td>${stage.productCode}</td>
                <td><span class="stage-status ${stage.status}">${statusText}</span></td>
                <td>${stage.workCenter}</td>
                <td>${stage.planMiktar || 0}</td>
                <td>${stage.startDateFormatted ? `${stage.startDateFormatted} ${stage.startTime}` : '-'}</td>
                <td>${stage.endDateFormatted ? `${stage.endDateFormatted} ${stage.endTime}` : '-'}</td>
                <td>
                    <div class="stage-progress">
                        <div class="stage-progress-bar">
                            <div class="stage-progress-fill ${stage.status}" style="width: ${stage.progress}%"></div>
                        </div>
                        <div class="stage-progress-text">${stage.progress}%</div>
                    </div>
                </td>
            `;
            
            stagesTableBody.appendChild(row);
        });
    }

    /**
     * Timeline indicator'ı günceller
     * @param {Array} stages - Aşama verileri
     */
    updateTimelineIndicator(stages) {
        const indicator = document.getElementById('timelineIndicator');
        const inProgressIndex = stages.findIndex(s => s.status === 'in-progress');
        
        if (inProgressIndex >= 0) {
            const percentage = (inProgressIndex / (stages.length - 1)) * 100;
            indicator.style.left = `${percentage}%`;
        } else {
            indicator.style.left = '0%';
        }
    }

    /**
     * Durum ikonunu döndürür
     * @param {string} status - Aşama durumu
     * @returns {string} İkon
     */
    getStatusIcon(status) {
        switch (status) {
            case 'in-progress': return '▶️';
            case 'planned': return '⏰';
            case 'completed': return '✅';
            case 'skipped': return '⏭️';
            case 'waiting': return '⏳';
            default: return '❓';
        }
    }

    /**
     * Durum metnini döndürür
     * @param {string} status - Aşama durumu
     * @returns {string} Durum metni
     */
    getStatusText(status) {
        switch (status) {
            case 'in-progress': return 'Devam Ediyor';
            case 'planned': return 'Planlandı';
            case 'completed': return 'Tamamlandı';
            case 'skipped': return 'Atlandı';
            case 'waiting': return 'Beklemede';
            default: return 'Bilinmeyen';
        }
    }

    /**
     * Gantt chart oluşturur
     * @param {Array} stages - Aşama verileri
     */
    createGanttChart(stages) {
        const ganttContainer = document.getElementById('ganttContainer');
        if (!ganttContainer) return;
        
        ganttContainer.innerHTML = '';
        
        // Planlanmış aşamaları filtrele ve tarihleri Date objesine dönüştür
        const plannedStages = stages
            .filter(s => s.startDate && s.endDate)
            .map(s => {
                // Tarihleri Date objesine dönüştür (eğer string ise)
                const startDate = s.startDate instanceof Date ? s.startDate : new Date(s.startDate);
                const endDate = s.endDate instanceof Date ? s.endDate : new Date(s.endDate);
                
                // Geçerli tarih kontrolü
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    return null;
                }
                
                return {
                    ...s,
                    startDate: startDate,
                    endDate: endDate
                };
            })
            .filter(s => s !== null); // Geçersiz tarihleri filtrele
        
        if (plannedStages.length === 0) {
            ganttContainer.innerHTML = '<div class="gantt-empty">Planlanmış aşama bulunamadı</div>';
            return;
        }
        
        // Tarih aralığını hesapla - gün bazlı (saat bilgisi yok)
        const allDates = plannedStages.flatMap(s => [s.startDate, s.endDate]);
        const validDates = allDates.filter(d => d instanceof Date && !isNaN(d.getTime()));
        
        if (validDates.length === 0) {
            ganttContainer.innerHTML = '<div class="gantt-empty">Geçerli tarih bulunamadı</div>';
            return;
        }
        
        // Tarihleri gün bazlı yuvarla (saat bilgisini kaldır)
        const roundToDayStart = (date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
        };
        
        const roundToDayEnd = (date) => {
            const d = new Date(date);
            d.setHours(23, 59, 59, 999);
            return d;
        };
        
        const minDate = roundToDayStart(new Date(Math.min(...validDates.map(d => d.getTime()))));
        const maxDate = roundToDayEnd(new Date(Math.max(...validDates.map(d => d.getTime()))));
        
        // Tarih aralığını genişlet (kenarlarda minimal boşluk için) - gün bazlı
        const dateRange = maxDate.getTime() - minDate.getTime();
        // Padding'i azalt - sadece 1 gün ekle (son tarihin kaymaması için)
        const chartStartDate = new Date(minDate);
        chartStartDate.setDate(chartStartDate.getDate() - 1);
        chartStartDate.setHours(0, 0, 0, 0);
        
        const chartEndDate = new Date(maxDate);
        chartEndDate.setDate(chartEndDate.getDate() + 1);
        chartEndDate.setHours(23, 59, 59, 999);
        
        const totalRange = chartEndDate.getTime() - chartStartDate.getTime();
        
        // Gantt chart yapısını oluştur
        const ganttChart = document.createElement('div');
        ganttChart.className = 'gantt-chart';
        
        // Timeline header (tarih ekseni)
        const timelineHeader = document.createElement('div');
        timelineHeader.className = 'gantt-timeline-header';
        
        // Gün bazlı timeline oluştur
        const days = Math.ceil(totalRange / (1000 * 60 * 60 * 24));
        
        // Tüm tarih aralığının ekrana sığması için gün genişliğini hesapla
        // Yüzde bazlı genişlik kullan - her zaman %100
        const dayWidth = 100 / days; // Yüzde bazlı genişlik
        const timelineTotalWidth = '100%'; // Her zaman %100 kullan
        
        // Timeline grid oluştur - sabit genişlik için data attribute ekle
        const timelineGrid = document.createElement('div');
        timelineGrid.className = 'gantt-timeline-grid';
        timelineGrid.setAttribute('data-days', days);
        timelineGrid.setAttribute('data-day-width', dayWidth);
        if (timelineTotalWidth !== '100%') {
            timelineGrid.style.width = timelineTotalWidth;
        }
        
        // Her gün için etiket oluştur - günün ortasına hizala
        for (let i = 0; i <= days; i++) {
            const date = new Date(chartStartDate.getTime() + (i * 24 * 60 * 60 * 1000));
            const dayLabel = document.createElement('div');
            dayLabel.className = 'gantt-day-label';
            // Günün ortasına hizala (gün genişliğinin yarısı kadar ekle)
            dayLabel.style.left = `${(i * dayWidth + dayWidth / 2)}%`;
            dayLabel.textContent = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
            timelineGrid.appendChild(dayLabel);
        }
        
        // Her gün için dikey çizgi ekle (hizalama için)
        for (let i = 0; i <= days; i++) {
            const gridLine = document.createElement('div');
            gridLine.className = 'gantt-grid-line';
            gridLine.style.left = `${(i * dayWidth)}%`;
            timelineGrid.appendChild(gridLine);
        }
        
        timelineHeader.appendChild(timelineGrid);
        ganttChart.appendChild(timelineHeader);
        
        // Responsive yükseklik hesaplama - aşama sayısına göre dinamik
        const containerWrapper = ganttContainer.closest('.gantt-container-wrapper');
        const modal = ganttContainer.closest('.production-tracking-modal');
        
        // Modal ve container yüksekliklerini hesapla
        let availableHeight = 500; // Varsayılan
        if (modal) {
            const modalHeight = modal.clientHeight || window.innerHeight * 0.95;
            const modalHeader = modal.querySelector('.modal-header');
            const modalFooter = modal.querySelector('.modal-footer');
            const modalBody = modal.querySelector('.modal-body');
            const ganttHeader = modal.querySelector('.gantt-header');
            
            const headerHeight = (modalHeader ? modalHeader.offsetHeight : 60) + 
                                (ganttHeader ? ganttHeader.offsetHeight : 80) + 40;
            const footerHeight = modalFooter ? modalFooter.offsetHeight : 60;
            const padding = 48; // Modal body padding
            
            availableHeight = modalHeight - headerHeight - footerHeight - padding;
        } else if (containerWrapper) {
            availableHeight = containerWrapper.clientHeight - 160; // Header + footer + padding
        }
        
        // Minimum ve maksimum satır yüksekliği
        const minRowHeight = 36;
        const maxRowHeight = 70;
        const calculatedRowHeight = Math.max(minRowHeight, Math.min(maxRowHeight, Math.floor(availableHeight / plannedStages.length)));
        
        // Timeline bar ve gantt bar yüksekliklerini de orantılı ayarla
        const timelineBarHeight = Math.max(32, calculatedRowHeight - 16);
        const ganttBarHeight = Math.max(24, timelineBarHeight - 8);
        
        // Aşamalar için satırlar oluştur
        const ganttRows = document.createElement('div');
        ganttRows.className = 'gantt-rows';
        ganttRows.style.setProperty('--row-height', `${calculatedRowHeight}px`);
        ganttRows.style.setProperty('--timeline-height', `${timelineBarHeight}px`);
        ganttRows.style.setProperty('--bar-height', `${ganttBarHeight}px`);
        
        plannedStages.forEach((stage, index) => {
            const row = document.createElement('div');
            row.className = 'gantt-row';
            row.style.minHeight = `${calculatedRowHeight}px`;
            
            // Aşama bilgisi (sol taraf)
            const stageInfo = document.createElement('div');
            stageInfo.className = 'gantt-stage-info';
            
            // Miktar bilgisi
            const planMiktar = stage.planMiktar || stage.planlananMiktar || 0;
            const gercekMiktar = stage.gercekMiktar || 0;
            const miktarText = gercekMiktar > 0 
                ? `${gercekMiktar} / ${planMiktar}` 
                : `${planMiktar}`;
            
            stageInfo.innerHTML = `
                <div class="gantt-stage-name">${stage.stageName || stage.productCode}</div>
                <div class="gantt-stage-details">${stage.workCenter || ''}</div>
                <div class="gantt-stage-quantity">
                    <span class="quantity-label">Miktar:</span>
                    <span class="quantity-value">${miktarText}</span>
                </div>
            `;
            row.appendChild(stageInfo);
            
            // Timeline bar alanı - timeline ile aynı genişlikte olmalı
            const timelineBar = document.createElement('div');
            timelineBar.className = 'gantt-timeline-bar';
            timelineBar.setAttribute('data-days', days);
            timelineBar.setAttribute('data-day-width', dayWidth);
            timelineBar.style.height = `${timelineBarHeight}px`;
            if (timelineTotalWidth !== '100%') {
                timelineBar.style.width = timelineTotalWidth;
            }
            
            // Grid çizgileri ekle (hizalama için)
            for (let i = 0; i <= days; i++) {
                const barGridLine = document.createElement('div');
                barGridLine.className = 'gantt-bar-grid-line';
                barGridLine.style.left = `${(i * dayWidth)}%`;
                timelineBar.appendChild(barGridLine);
            }
            
            // Aşama çubuğu - tarihleri gün bazlı yuvarla (saat bilgisi yok)
            let startDate = stage.startDate instanceof Date ? stage.startDate : new Date(stage.startDate);
            let endDate = stage.endDate instanceof Date ? stage.endDate : new Date(stage.endDate);
            
            // Geçerli tarih kontrolü
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return; // Bu aşamayı atla
            }
            
            // Tarihleri gün bazlı yuvarla - günün başlangıcı ve sonu
            const dayStart = new Date(startDate);
            dayStart.setHours(0, 0, 0, 0);
            
            const dayEnd = new Date(endDate);
            dayEnd.setHours(23, 59, 59, 999);
            
            // Gün sayısını hesapla (başlangıç ve bitiş günleri dahil)
            const startDay = Math.floor((dayStart.getTime() - chartStartDate.getTime()) / (1000 * 60 * 60 * 24));
            const endDay = Math.floor((dayEnd.getTime() - chartStartDate.getTime()) / (1000 * 60 * 60 * 24));
            const dayCount = endDay - startDay + 1; // Başlangıç ve bitiş günleri dahil
            
            // Gün bazlı pozisyon hesaplama - days zaten dış scope'ta tanımlı
            // days değişkeni timeline oluşturulurken tanımlandı, burada sadece kullanıyoruz
            
            const startOffset = (startDay * dayWidth);
            const duration = (dayCount * dayWidth);
            
            // Tarih formatlaması
            const startFormatted = stage.startDateFormatted || dayStart.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
            const endFormatted = stage.endDateFormatted || dayEnd.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
            
            // Durum kontrolü - eğer status yoksa veya geçersizse 'planned' yap
            const status = stage.status || 'planned';
            
            // Durum renklerini belirle - gradient'ler ile
            const statusColors = {
                'planned': { 
                    gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 50%, #2196F3 100%)',
                    bg: '#2196F3',
                    border: '#1565C0'
                },
                'in-progress': { 
                    gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 50%, #FF9800 100%)',
                    bg: '#FF9800',
                    border: '#E65100'
                },
                'completed': { 
                    gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 50%, #4CAF50 100%)',
                    bg: '#4CAF50',
                    border: '#2E7D32'
                },
                'waiting': { 
                    gradient: 'linear-gradient(135deg, #9E9E9E 0%, #757575 50%, #9E9E9E 100%)',
                    bg: '#9E9E9E',
                    border: '#616161'
                },
                'skipped': { 
                    gradient: 'linear-gradient(135deg, #BDBDBD 0%, #9E9E9E 50%, #BDBDBD 100%)',
                    bg: '#BDBDBD',
                    border: '#757575'
                }
            };
            
            const color = statusColors[status] || statusColors['planned'];
            
            const bar = document.createElement('div');
            bar.className = `gantt-bar gantt-bar-${status}`;
            bar.style.left = `${Math.max(0, startOffset)}%`;
            bar.style.width = `${Math.max(1, duration)}%`;
            bar.style.height = `${ganttBarHeight}px`;
            // Renkleri inline style ile zorla set et
            bar.style.background = color.gradient;
            bar.style.backgroundColor = color.bg; // Fallback
            bar.style.borderColor = color.border;
            
            // İlerleme çubuğu (eğer devam ediyorsa veya tamamlandıysa)
            if (stage.progress > 0) {
                const progressBar = document.createElement('div');
                progressBar.className = 'gantt-progress-bar';
                progressBar.style.width = `${Math.min(100, Math.max(0, stage.progress))}%`;
                bar.appendChild(progressBar);
            }
            
            // Tooltip için bilgi - eğer aynı günse sadece bir tarih göster
            const dateRangeText = startFormatted === endFormatted ? startFormatted : `${startFormatted} - ${endFormatted}`;
            bar.title = `${stage.stageName || stage.productCode}\n${dateRangeText}\nİlerleme: ${stage.progress || 0}%`;
            
            // Aşama metni
            const barText = document.createElement('div');
            barText.className = 'gantt-bar-text';
            barText.textContent = dateRangeText;
            bar.appendChild(barText);
            
            timelineBar.appendChild(bar);
            row.appendChild(timelineBar);
            
            ganttRows.appendChild(row);
        });
        
        ganttChart.appendChild(ganttRows);
        ganttContainer.appendChild(ganttChart);
    }

    /**
     * Güncelleme modal'ını açar
     * @param {Object} item - Seçilen iş emri verisi
     */
    openUpdateModal(item) {
        const modal = document.getElementById('planningModal');
        if (!modal) return;
        
        // Önce modal içeriğini temizle
        this.resetModalContent();
        
        // Breakdown item kontrolü: Eğer breakdown ise ana kayıt bilgilerini al
        let mainItem = item;
        if (item.isemriParcaNo) {
            // Bu bir breakdown item - ana kaydı bul
            // ÖNEMLİ: Breakdown'ın ait olduğu kaydı bulmak için isemriId kullanmalıyız
            // Çünkü breakdown'ın isemriId'si zaten doğru kaydı gösterir
            if (item.isemriId && window.planningApp && window.planningApp.data) {
                // Breakdown'ın ait olduğu kaydı bul (isemriId ile)
                const mainRecord = window.planningApp.data.find(rec => rec.isemriId === item.isemriId);
                if (mainRecord) {
                    // Ana kayıt bilgilerini kullan, ama breakdown'ın planlama bilgilerini koru
                    mainItem = {
                        ...mainRecord,
                        // Breakdown'ın planlama bilgileri
                        planlananTarih: item.planlananTarih || item.planTarihi,
                        planlananMiktar: item.planlananMiktar,
                        planId: item.planId,
                        breakdownPlanId: item.planId, // submitUpdate için
                        isemriParcaNo: item.isemriParcaNo
                    };
                }
            }
        }
        
        // Modal başlığını güncelle
        const modalTitle = modal.querySelector('.modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = 'Planlama Güncelle';
        }
        
        // Buton metnini güncelle
        const submitButtons = modal.querySelectorAll('button[type="submit"]');
        submitButtons.forEach(btn => {
            btn.textContent = 'Güncelle';
        });
        
        // Bilgi alanlarını doldur (modal.querySelector ile güvenli erişim)
        const planningIsemriNo = modal.querySelector('#planningIsemriNo') || document.getElementById('planningIsemriNo');
        if (planningIsemriNo) planningIsemriNo.value = mainItem.isemriNo || '';
        
        const planningMalhizKodu = modal.querySelector('#planningMalhizKodu') || document.getElementById('planningMalhizKodu');
        if (planningMalhizKodu) planningMalhizKodu.value = mainItem.malhizKodu || '';
        
        const planningMalzeme = modal.querySelector('#planningMalzeme') || document.getElementById('planningMalzeme');
        if (planningMalzeme) planningMalzeme.value = mainItem.imalatTuru || '';
        
        const planningOnerilenTeslim = modal.querySelector('#planningOnerilenTeslim') || document.getElementById('planningOnerilenTeslim');
        if (planningOnerilenTeslim) {
            planningOnerilenTeslim.value = mainItem.onerilenTeslimTarih ? 
                new Date(mainItem.onerilenTeslimTarih).toLocaleDateString('tr-TR') : '';
        }
        
        // Mevcut planlama bilgilerini doldur
        const planningTarih = modal.querySelector('#planningTarih') || document.getElementById('planningTarih');
        if (planningTarih) {
            planningTarih.value = mainItem.planlananTarih ? 
                new Date(mainItem.planlananTarih).toISOString().split('T')[0] : '';
        }
        
        const planningMiktar = modal.querySelector('#planningMiktar') || document.getElementById('planningMiktar');
        if (planningMiktar) planningMiktar.value = mainItem.planlananMiktar || '';
        
        // Kuyruk planlama tab'ını gizle (güncelleme modal'ında gerekli değil)
        const queueTab = modal.querySelector('#queuePlanningTab');
        const queueTabButton = modal.querySelector('.planning-tab-button[data-tab="queue"]');
        if (queueTab) queueTab.style.display = 'none';
        if (queueTabButton) queueTabButton.style.display = 'none';
        
        // Normal planlama tab'ını da gizle (güncelleme modal'ında gerekli değil)
        const normalTab = modal.querySelector('#planningTab');
        const normalTabButton = modal.querySelector('.planning-tab-button[data-tab="normal"]');
        if (normalTab) normalTab.style.display = 'none';
        if (normalTabButton) normalTabButton.style.display = 'none';
        
        // Tab container'ı gizle (eğer tüm tab'lar gizliyse)
        const tabContainer = modal.querySelector('.planning-tabs');
        if (tabContainer) {
            const visibleTabs = Array.from(modal.querySelectorAll('.planning-tab-button')).filter(btn => btn.style.display !== 'none');
            if (visibleTabs.length === 0) {
                tabContainer.style.display = 'none';
            }
        }

        // Tüm bölümler için makine seçimi ekle
            this.checkMachineAndOpenUpdateModal(mainItem, modal);
    }
    
    /**
     * Güncelleme için makine kontrolü yapar ve modal'ı açar
     * @param {Object} item - İş emri verisi
     * @param {HTMLElement} modal - Modal elementi
     */
    async checkMachineAndOpenUpdateModal(item, modal) {
        try {
            const makineAdi = item.makAd || item.makinaAdi;
            
            if (!makineAdi) {
                await this.openNormalUpdateModal(item, modal);
                return;
            }
            
            // Tüm bölümler için normal modal'ı aç (makine seçimi içinde gösterilecek)
            // Maça bölümü için üst makine kontrolü yap
            const isMaca = this.isMacaBolumu({ bolumAdi: item.bolumAdi, makAd: makineAdi });
            
            if (isMaca) {
                // Makine tipini kontrol et
                const machineInfo = await window.planningApp.checkMachineType(makineAdi);
                
                if (machineInfo.isUpperMachine) {
                    // Üst makine - alt makineleri göster
                    await this.openUpperMachineUpdateModal(item, modal, machineInfo);
                } else {
                    // Normal makine
                    await this.openNormalUpdateModal(item, modal);
                }
            } else {
                // Diğer bölümler için normal modal
                await this.openNormalUpdateModal(item, modal);
            }
            
        } catch (error) {
            console.error('Makine kontrolü hatası:', error);
            // Hata durumunda normal modal'ı aç
            await this.openNormalUpdateModal(item, modal);
        }
    }
    
    /**
     * Normal güncelleme modal'ını açar
     * @param {Object} item - İş emri verisi
     * @param {HTMLElement} modal - Modal elementi
     */
    async openNormalUpdateModal(item, modal) {
        // Önce makine seçim alanını temizle
        const existingMachineField = modal.querySelector('#machineSelectionField');
        if (existingMachineField) {
            existingMachineField.remove();
        }
        
        // Tüm bölümler için makine seçimi ekle (planlama modalındaki mantıkla aynı)
        await this.addMachineSelectionForAllDepartments(modal, item);
        
        modal.style.display = 'block';
        const form = document.getElementById('planningForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.submitUpdate(item);
        };
    }
    
    /**
     * Üst makine için güncelleme modal'ını açar
     * @param {Object} item - İş emri verisi
     * @param {HTMLElement} modal - Modal elementi
     * @param {Object} machineInfo - Makine bilgileri
     */
    async openUpperMachineUpdateModal(item, modal, machineInfo) {
        // Alt makinelerin boşluk durumunu kontrol et
        const subMachineNames = machineInfo.subMachines.map(sub => sub.makAd);
        
        try {
            // Seçilen tarihi al
            const tarihField = modal.querySelector('#planningTarih');
            const selectedDate = tarihField ? tarihField.value : null;
            
            const availabilityData = await window.planningApp.checkMultipleMachineAvailability(subMachineNames, selectedDate);
            console.log('✅ Boşluk durumu verileri alındı:', availabilityData);
            
            // Default makineyi belirle (veritabanından gelen makine varsa onu seç)
            const defaultMachine = this.getDefaultMachineForItem(item, machineInfo.subMachines);
            
            // Makine seçim alanını ekle
            await this.addMachineSelectionField(modal, machineInfo, availabilityData, defaultMachine, selectedDate);
            
        } catch (error) {
            console.error('Boşluk durumu kontrolü hatası:', error);
            // Hata durumunda da makine seçim alanını ekle (boş verilerle)
            const tarihField = modal.querySelector('#planningTarih');
            const selectedDate = tarihField ? tarihField.value : null;
            const defaultMachine = this.getDefaultMachineForItem(item, machineInfo.subMachines);
            await this.addMachineSelectionField(modal, machineInfo, [], defaultMachine, selectedDate);
        }
        
        // Modal'ı göster
        modal.style.display = 'block';
        
        // Form submit event'ini ekle
        const form = document.getElementById('planningForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.submitUpdate(item);
        };
    }
    
    /**
     * Makine seçimi ile güncelleme submit eder
     * @param {Object} item - İş emri verisi
     */
    async submitUpdateWithMachineSelection(item) {
        // Radio button veya select'ten makine seçimini al
        const selectedMachineRadio = document.querySelector('input[name="selectedMachine"]:checked');
        const selectedMachineSelect = document.querySelector('select[name="selectedMachine"]');
        const machineSelection = document.getElementById('machineSelection');
        const selectedMachine = selectedMachineRadio ? selectedMachineRadio.value : 
                               (selectedMachineSelect ? selectedMachineSelect.value : 
                               (machineSelection ? machineSelection.value : null));
        if (selectedMachine) {
            item.selectedMachine = selectedMachine;
            console.log('🎯 Güncelleme için seçilen makine:', selectedMachine);
        }
        await this.submitUpdate(item);
    }
    
    /**
     * Planlama güncellemesini submit eder
     * @param {Object} item - İş emri verisi
     */
    async submitUpdate(item) {
        const planTarihi = document.getElementById('planningTarih').value;
        const planlananMiktarInput = document.getElementById('planningMiktar').value;
        
        // Makine seçimini al (dropdown veya radio button)
        const machineSelection = document.getElementById('machineSelection');
        const selectedMachineRadio = document.querySelector('input[name="selectedMachine"]:checked');
        const selectedMachine = machineSelection ? machineSelection.value : 
                               (selectedMachineRadio ? selectedMachineRadio.value : null);
        
        // Değer doğrulama
        if (!planTarihi || !planlananMiktarInput) {
            window.planningApp.showWarning('Lütfen tüm alanları doldurun.');
            return;
        }
        
        // planId kontrolü - breakdown'larda breakdownPlanId kullanılabilir
        let planId = item.planId;
        if (!planId && item.breakdownPlanId) {
            planId = item.breakdownPlanId;
        }
        if (!planId && item.isemriParcaNo) {
            // Breakdown'larda breakdowns array'inden planId bul
            if (item.breakdowns && Array.isArray(item.breakdowns)) {
                const breakdown = item.breakdowns.find(brk => brk.parcaNo === item.isemriParcaNo);
                if (breakdown && breakdown.planId) {
                    planId = breakdown.planId;
                }
            }
        }
        
        // ÖNEMLİ: "queue-" ile başlayan geçici planId'leri filtrele (kuyruk planlama için oluşturulan geçici ID'ler)
        if (planId && typeof planId === 'string' && planId.startsWith('queue-')) {
            // Kuyruk planlama geçici ID'si - gerçek planId'yi breakdowns'tan bul
            if (item.breakdowns && Array.isArray(item.breakdowns)) {
                // Önce isemriParcaNo ile eşleşen breakdown'ı bul
                const matchingBreakdown = item.breakdowns.find(brk => 
                    brk.parcaNo === item.isemriParcaNo && 
                    brk.planId && 
                    !brk.planId.toString().startsWith('queue-') &&
                    !isNaN(Number(brk.planId))
                );
                if (matchingBreakdown && matchingBreakdown.planId) {
                    planId = matchingBreakdown.planId;
                } else {
                    // Eğer eşleşen yoksa, herhangi bir geçerli planId'li breakdown'ı bul
                    const validBreakdown = item.breakdowns.find(brk => 
                        brk.planId && 
                        !brk.planId.toString().startsWith('queue-') &&
                        !isNaN(Number(brk.planId))
                    );
                    if (validBreakdown && validBreakdown.planId) {
                        planId = validBreakdown.planId;
                    } else {
                        window.planningApp.showError('Geçerli Plan ID bulunamadı. Bu kayıt kuyruk planlamadan geliyor olabilir. Lütfen sayfayı yenileyip tekrar deneyin.');
                        console.error('Geçersiz planId (queue-):', item);
                        return;
                    }
                }
            } else {
                window.planningApp.showError('Geçerli Plan ID bulunamadı. Bu kayıt kuyruk planlamadan geliyor olabilir. Lütfen sayfayı yenileyip tekrar deneyin.');
                console.error('Geçersiz planId (queue-) ve breakdowns yok:', item);
                return;
            }
        }
        
        if (!planId || planId === null || planId === undefined) {
            window.planningApp.showError('Plan ID bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
            console.error('PlanId bulunamadı:', item);
            return;
        }
        
        // planId'nin sayısal olduğundan emin ol
        const numericPlanId = Number(planId);
        if (isNaN(numericPlanId) || numericPlanId <= 0) {
            window.planningApp.showError(`Geçersiz planId değeri: "${planId}". Plan ID bir sayı olmalıdır. Lütfen sayfayı yenileyip tekrar deneyin.`);
            console.error('Geçersiz planId (sayı değil):', { planId, item });
            return;
        }
        
        // planlananMiktar sayısal kontrolü
        const planlananMiktar = parseInt(planlananMiktarInput);
        if (isNaN(planlananMiktar) || planlananMiktar <= 0) {
            window.planningApp.showError('Planlanan miktar geçersiz. Lütfen geçerli bir sayı girin.');
            return;
        }
        
        // Tarih kontrolü
        const planDate = new Date(planTarihi);
        if (isNaN(planDate.getTime())) {
            window.planningApp.showError('Plan tarihi geçersiz. Lütfen geçerli bir tarih seçin.');
            return;
        }
        
        // Eski tarih ve miktarı bul - GÜNCEL VERİDEN AL (veritabanından gelen güncel değerler)
        let eskiTarih = null;
        let eskiMiktar = null;
        const isBreakdownUpdate = item.isemriParcaNo || item.breakdownPlanId;
        
        // Mevcut breakdown'ı tespit et (parcaNo ve planId ile) - GÜNCEL VERİDEN
        let currentParcaNo = item.isemriParcaNo;
        
        // Önce güncel veriden bul (window.planningApp.data içinden)
        if (window.planningApp && window.planningApp.data) {
            let mainRecord = null;
            if (item.isemriId) {
                mainRecord = window.planningApp.data.find(rec => rec.isemriId === item.isemriId);
            } else if (item.isemriNo) {
                // isemriNo ile bul, ama breakdown ise doğru kaydı bul
                mainRecord = window.planningApp.data.find(rec => {
                    if (rec.isemriNo === item.isemriNo) {
                        // Breakdown ise, bu breakdown'ı içeren kaydı bul
                        if (isBreakdownUpdate && rec.breakdowns) {
                            return rec.breakdowns.some(brk => 
                                Number(brk.planId) === numericPlanId || brk.planId === planId
                            );
                        }
                        return true;
                    }
                    return false;
                });
            }
            
            if (mainRecord && mainRecord.breakdowns) {
                const currentBreakdown = mainRecord.breakdowns.find(brk => 
                    Number(brk.planId) === numericPlanId || brk.planId === planId
                );
                if (currentBreakdown) {
                    currentParcaNo = currentBreakdown.parcaNo;
                    eskiTarih = currentBreakdown.planTarihi;
                    eskiMiktar = currentBreakdown.planlananMiktar;
                }
            }
        }
        
        // Eğer hala bulunamadıysa item'dan al (fallback)
        if (!eskiTarih && !eskiMiktar) {
            if (isBreakdownUpdate && item.breakdowns && item.breakdowns.length > 0) {
                const currentBreakdown = item.breakdowns.find(brk => 
                    Number(brk.planId) === numericPlanId || brk.planId === planId || brk.parcaNo === item.isemriParcaNo
                );
                if (currentBreakdown) {
                    currentParcaNo = currentBreakdown.parcaNo;
                    eskiTarih = currentBreakdown.planTarihi;
                    eskiMiktar = currentBreakdown.planlananMiktar;
                }
            } else {
                eskiTarih = item.planlananTarih;
                eskiMiktar = item.planlananMiktar;
            }
        }
        
        // Tarih ve miktar değişikliği kontrolü
        // Tarih formatlarını normalize et (sadece tarih kısmını karşılaştır)
        let tarihDegisti = false;
        if (planTarihi) {
            if (eskiTarih) {
                const eskiTarihNormalized = new Date(eskiTarih).toISOString().split('T')[0];
                const yeniTarihNormalized = new Date(planTarihi).toISOString().split('T')[0];
                tarihDegisti = eskiTarihNormalized !== yeniTarihNormalized;
            } else {
                // Eski tarih yok ama yeni tarih var = değişiklik var
                tarihDegisti = true;
            }
        }
        // Miktar değişikliği: eskiMiktar varsa ve farklı ise değişiklik var
        // ÖNEMLİ: eskiMiktar null/undefined ise değişiklik yok sayılır (yeni planlama)
        const miktarDegisti = (eskiMiktar !== null && eskiMiktar !== undefined) && (planlananMiktar !== eskiMiktar);
        
        console.log('Miktar değişikliği kontrolü:', {
            eskiMiktar,
            planlananMiktar,
            miktarDegisti,
            isBreakdownUpdate
        });
        
        // Bağlı kuyruk işlerini bul (aynı isemriNo'ya sahip farklı isemriId'ler)
        // ÖNEMLİ: Kendi kaydının breakdown'larını kontrol etmiyoruz, sadece bağlı iş emirlerini kontrol ediyoruz
        let relatedBreakdowns = [];
        let waitingBreakdowns = []; // Bekleyen breakdown'lar
        
        // isemriNo'yu garanti et - eğer yoksa veriden bul
        let isemriNo = item.isemriNo;
        let currentIsemriId = item.isemriId;
        if (!isemriNo && item.isemriId && window.planningApp && window.planningApp.data) {
            const foundRecord = window.planningApp.data.find(rec => rec.isemriId === item.isemriId);
            if (foundRecord) {
                isemriNo = foundRecord.isemriNo;
                currentIsemriId = foundRecord.isemriId;
            }
        }
        
        // Eğer item bir breakdown ise, ana kaydın isemriId'sini bul
        if (item.isemriParcaNo && !currentIsemriId && window.planningApp && window.planningApp.data) {
            const mainRecord = window.planningApp.data.find(rec => 
                rec.isemriNo === isemriNo && 
                rec.breakdowns && 
                rec.breakdowns.some(brk => brk.planId === numericPlanId || brk.parcaNo === item.isemriParcaNo)
            );
            if (mainRecord) {
                currentIsemriId = mainRecord.isemriId;
            }
        }
        
        if (isemriNo && window.planningApp && window.planningApp.data) {
            window.planningApp.data.forEach(record => {
                // Aynı isemriNo'ya sahip ama farklı isemriId'ye sahip kayıtları bul (bağlı kuyruk işleri)
                // Kendi kaydının breakdown'larını kontrol etmiyoruz
                if (record.isemriNo === isemriNo && 
                    record.isemriId !== currentIsemriId && // Farklı isemriId (bağlı kuyruk işi)
                    record.breakdowns && 
                    Array.isArray(record.breakdowns)) {
                    
                    // Planlanmış breakdown'ları bul
                    const plannedBreakdowns = record.breakdowns.filter(brk => {
                        return brk.durum === 'Planlandı' && 
                               brk.planId && 
                               !brk.planId.toString().startsWith('queue-') && // Kuyruk planlama geçici ID'lerini hariç tut
                               !isNaN(Number(brk.planId)); // Sayısal olmalı
                    });
                    relatedBreakdowns = relatedBreakdowns.concat(plannedBreakdowns.map(brk => ({
                        ...brk,
                        isemriId: record.isemriId,
                        isemriNo: record.isemriNo,
                        malhizKodu: brk.malhizKodu || record.malhizKodu,
                        bolumAdi: brk.bolumAdi || record.bolumAdi,
                        makAd: brk.makAd || record.makAd
                    })));
                    
                    // Bekleyen breakdown'ları da bul
                    const waiting = record.breakdowns.filter(brk => {
                        return (brk.durum === 'Beklemede' || !brk.durum || brk.durum === '') &&
                               (!brk.planId || !brk.planId.toString().startsWith('queue-')) && // Kuyruk planlama geçici ID'lerini hariç tut
                               true; // Tüm bekleyen breakdown'ları al
                    });
                    waitingBreakdowns = waitingBreakdowns.concat(waiting.map(brk => ({
                        ...brk,
                        isemriId: record.isemriId,
                        isemriNo: record.isemriNo,
                        malhizKodu: brk.malhizKodu || record.malhizKodu,
                        bolumAdi: brk.bolumAdi || record.bolumAdi,
                        makAd: brk.makAd || record.makAd
                    })));
                }
            });
        }
        
        console.log('Bağlı kuyruk işleri kontrolü:', {
            isemriNo,
            currentIsemriId,
            numericPlanId,
            currentParcaNo,
            itemIsemriParcaNo: item.isemriParcaNo,
            relatedBreakdownsCount: relatedBreakdowns.length,
            waitingBreakdownsCount: waitingBreakdowns.length,
            relatedBreakdowns: relatedBreakdowns.map(brk => ({
                isemriId: brk.isemriId,
                isemriNo: brk.isemriNo,
                planId: brk.planId,
                parcaNo: brk.parcaNo
            })),
            waitingBreakdowns: waitingBreakdowns.map(brk => ({
                isemriId: brk.isemriId,
                isemriNo: brk.isemriNo,
                planId: brk.planId,
                parcaNo: brk.parcaNo
            }))
        });
        
        // Bağlı işler varsa modal'ı göster
        const hasRelatedJobs = (tarihDegisti && relatedBreakdowns.length > 0) || 
                              (miktarDegisti && (relatedBreakdowns.length > 0 || waitingBreakdowns.length > 0));
        
        if (hasRelatedJobs) {
            // Modal'ı göster ve güncelleme işlemini modal'dan yapılacak şekilde ayarla
            await this.showRelatedJobsUpdateModal(item, {
                planTarihi,
                planlananMiktar,
                eskiTarih,
                eskiMiktar,
                tarihDegisti,
                miktarDegisti,
                relatedBreakdowns,
                waitingBreakdowns,
                numericPlanId
            });
            return; // Modal'dan onaylandığında devam edecek
        }
        
        // Bağlı iş yoksa direkt güncelleme yap
        await this.performUpdate(item, {
            planTarihi,
            planlananMiktar,
            eskiTarih,
            eskiMiktar,
            tarihDegisti,
            miktarDegisti,
            relatedBreakdowns: [],
            waitingBreakdowns: [],
            numericPlanId,
            updateRelatedAmounts: false,
            updateTarget: 'waiting'
        });
    }

    /**
     * Bağlı işler güncelleme modal'ını gösterir
     */
    async showRelatedJobsUpdateModal(item, updateData) {
        const modal = document.getElementById('relatedJobsUpdateModal');
        if (!modal) {
            // Modal yoksa direkt güncelleme yap
            await this.performUpdate(item, {
                ...updateData,
                updateRelatedAmounts: false,
                updateTarget: 'waiting'
            });
            return;
        }
        
        const loadingDiv = modal.querySelector('#relatedJobsUpdateLoading');
        const contentDiv = modal.querySelector('#relatedJobsUpdateContent');
        
        // Loading göster
        loadingDiv.style.display = 'block';
        contentDiv.style.display = 'none';
        modal.style.display = 'block';
        
        // Güncelleme verilerini sakla (onaylandığında kullanılacak)
        this.relatedJobsUpdateData = {
            item,
            ...updateData
        };
        
        // Modal içeriğini doldur
        this.populateRelatedJobsUpdateModal(modal, item, updateData);
        
        // Loading gizle, içeriği göster
        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
    }

    /**
     * Bağlı işler güncelleme modal içeriğini doldurur
     */
    populateRelatedJobsUpdateModal(modal, item, updateData) {
        const { planTarihi, planlananMiktar, eskiTarih, eskiMiktar, tarihDegisti, miktarDegisti, relatedBreakdowns, waitingBreakdowns } = updateData;
        
        // Bilgileri göster
        const isemriNoSpan = modal.querySelector('#relatedJobsIsemriNo');
        if (isemriNoSpan) isemriNoSpan.textContent = item.isemriNo || '-';
        
        const eskiTarihSpan = modal.querySelector('#relatedJobsEskiTarih');
        if (eskiTarihSpan) {
            eskiTarihSpan.textContent = eskiTarih ? new Date(eskiTarih).toLocaleDateString('tr-TR') : '-';
        }
        
        const yeniTarihSpan = modal.querySelector('#relatedJobsYeniTarih');
        if (yeniTarihSpan) {
            yeniTarihSpan.textContent = planTarihi ? new Date(planTarihi).toLocaleDateString('tr-TR') : '-';
        }
        
        const eskiMiktarSpan = modal.querySelector('#relatedJobsEskiMiktar');
        if (eskiMiktarSpan) {
            eskiMiktarSpan.textContent = eskiMiktar !== null && eskiMiktar !== undefined ? eskiMiktar : '-';
        }
        
        const yeniMiktarSpan = modal.querySelector('#relatedJobsYeniMiktar');
        if (yeniMiktarSpan) {
            yeniMiktarSpan.textContent = planlananMiktar || '-';
        }
        
        // Bağlı işleri listele
        const jobsList = modal.querySelector('#relatedJobsList');
        if (!jobsList) return;
        
        const allBreakdowns = [...relatedBreakdowns, ...waitingBreakdowns];
        
        if (allBreakdowns.length === 0) {
            jobsList.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">Bağlı iş bulunamadı</p>';
            return;
        }
        
        let html = '<table style="width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px;">';
        html += '<thead><tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-bottom: 2px solid #5a67d8;">';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px; width: 50px;"><input type="checkbox" id="selectAllRelatedJobs" checked style="width: 18px; height: 18px; cursor: pointer;" /></th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Aşama</th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Bölüm</th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Makine</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Mevcut Tarih</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Yeni Tarih</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Mevcut Miktar</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Yeni Miktar</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Durum</th>';
        html += '</tr></thead><tbody>';
        
        allBreakdowns.forEach((brk, index) => {
            const rowBgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            const isPlanned = brk.durum === 'Planlandı';
            
            // Tarih hesaplama
            let yeniTarih = brk.planTarihi;
            if (tarihDegisti && isPlanned && eskiTarih) {
                const eskiTarihObj = new Date(eskiTarih);
                const yeniTarihObj = new Date(planTarihi);
                const offsetGun = Math.round((yeniTarihObj - eskiTarihObj) / (1000 * 60 * 60 * 24));
                const relatedTarihObj = new Date(brk.planTarihi);
                relatedTarihObj.setDate(relatedTarihObj.getDate() + offsetGun);
                yeniTarih = relatedTarihObj.toISOString().split('T')[0];
            }
            
            // Miktar hesaplama
            let yeniMiktar = brk.planlananMiktar;
            if (miktarDegisti && eskiMiktar !== null && eskiMiktar !== undefined) {
                const miktarArtisi = planlananMiktar - eskiMiktar;
                yeniMiktar = (brk.planlananMiktar || 0) + miktarArtisi;
            }
            
            const statusBadge = isPlanned 
                ? '<span style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3); display: inline-block;">Planlandı</span>'
                : '<span style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3); display: inline-block;">Beklemede</span>';
            
            // Plan ID'yi unique identifier olarak kullan
            const uniqueId = `relatedJob_${brk.planId || brk.isemriId}_${index}`;
            
            html += `<tr style="background-color: ${rowBgColor}; border-bottom: 1px solid #e0e0e0;" data-plan-id="${brk.planId || ''}" data-isemri-id="${brk.isemriId || ''}">`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <input type="checkbox" 
                       class="related-job-checkbox" 
                       data-plan-id="${brk.planId || ''}"
                       data-isemri-id="${brk.isemriId || ''}"
                       data-index="${index}"
                       checked
                       style="width: 18px; height: 18px; cursor: pointer;" />
            </td>`;
            html += `<td style="padding: 12px 15px; color: #2d3748; font-size: 13px; vertical-align: middle;">${brk.malhizKodu || '-'}</td>`;
            html += `<td style="padding: 12px 15px; color: #4a5568; font-size: 13px; vertical-align: middle;">${brk.bolumAdi || '-'}</td>`;
            html += `<td style="padding: 12px 15px; color: #4a5568; font-size: 13px; vertical-align: middle;">${brk.makAd || '-'}</td>`;
            html += `<td style="padding: 12px 15px; text-align: center; color: #4a5568; font-size: 13px; vertical-align: middle;">${brk.planTarihi ? new Date(brk.planTarihi).toLocaleDateString('tr-TR') : '-'}</td>`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <input type="date" 
                       class="related-job-new-date" 
                       data-plan-id="${brk.planId || ''}"
                       data-index="${index}"
                       value="${yeniTarih || ''}" 
                       style="padding: 6px 8px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 13px; width: 140px; ${tarihDegisti && isPlanned ? 'font-weight: 600; border-color: #667eea;' : ''}" />
            </td>`;
            html += `<td style="padding: 12px 15px; text-align: center; color: #4a5568; font-size: 13px; vertical-align: middle;">${brk.planlananMiktar || '-'}</td>`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <input type="number" 
                       class="related-job-new-amount" 
                       data-plan-id="${brk.planId || ''}"
                       data-index="${index}"
                       value="${yeniMiktar || ''}" 
                       min="1"
                       style="padding: 6px 8px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 13px; width: 100px; text-align: center; ${miktarDegisti ? 'font-weight: 600; border-color: #667eea;' : ''}" />
            </td>`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">${statusBadge}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        jobsList.innerHTML = html;
        
        // Tümünü seç/seçimi kaldır checkbox'ı için event listener ekle
        const selectAllCheckbox = modal.querySelector('#selectAllRelatedJobs');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = modal.querySelectorAll('.related-job-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                });
            });
        }
    }

    /**
     * Bağlı işler güncelleme modal'ından onaylandığında çağrılır
     */
    async confirmRelatedJobsUpdate() {
        if (!this.relatedJobsUpdateData) {
            window.planningApp.showError('Güncelleme verileri bulunamadı');
            return;
        }
        
        const modal = document.getElementById('relatedJobsUpdateModal');
        if (!modal) {
            window.planningApp.showError('Modal bulunamadı');
            return;
        }
        
        // Seçili checkbox'ları ve input değerlerini topla
        const selectedCheckboxes = modal.querySelectorAll('.related-job-checkbox:checked');
        const selectedJobs = [];
        
        selectedCheckboxes.forEach(checkbox => {
            const planId = checkbox.dataset.planId;
            const isemriId = checkbox.dataset.isemriId;
            const index = parseInt(checkbox.dataset.index);
            
            // Aynı satırdaki input'ları bul
            const row = checkbox.closest('tr');
            if (!row) return;
            
            const dateInput = row.querySelector('.related-job-new-date');
            const amountInput = row.querySelector('.related-job-new-amount');
            
            if (dateInput && amountInput) {
                const newDate = dateInput.value;
                const newAmount = parseInt(amountInput.value);
                
                if (newDate && !isNaN(newAmount) && newAmount > 0) {
                    // Orijinal breakdown bilgisini bul
                    const allBreakdowns = [...this.relatedJobsUpdateData.relatedBreakdowns, ...this.relatedJobsUpdateData.waitingBreakdowns];
                    const originalBrk = allBreakdowns[index];
                    
                    if (originalBrk) {
                        selectedJobs.push({
                            ...originalBrk,
                            newPlanTarihi: newDate,
                            newPlanlananMiktar: newAmount
                        });
                    }
                }
            }
        });
        
        if (selectedJobs.length === 0) {
            window.planningApp.showWarning('Güncellenecek kayıt seçilmedi. Lütfen en az bir kayıt seçin.');
            return;
        }
        
        const { item } = this.relatedJobsUpdateData;
        
        // Modal'ı kapat
        modal.style.display = 'none';
        
        // Güncelleme işlemini gerçekleştir
        await this.performUpdate(item, {
            ...this.relatedJobsUpdateData,
            selectedJobs: selectedJobs // Seçili ve düzenlenmiş kayıtlar
        });
        
        // Veriyi temizle
        this.relatedJobsUpdateData = null;
    }

    /**
     * Güncelleme işlemini gerçekleştirir
     */
    async performUpdate(item, updateData) {
        const { planTarihi, planlananMiktar, eskiTarih, eskiMiktar, tarihDegisti, miktarDegisti, relatedBreakdowns, waitingBreakdowns, numericPlanId, updateRelatedAmounts, updateTarget, selectedJobs } = updateData;
        
        try {
            // Ana güncelleme
            const response = await fetch('/api/planning/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId: numericPlanId,
                    planTarihi: planTarihi,
                    planlananMiktar: planlananMiktar,
                    selectedMachine: item.selectedMachine || selectedMachine || item.makAd || null
                })
            });
            const result = await response.json();
            if (result.success) {
                console.log('Planlama güncelleme başarılı:', result);
                
                // Bağlı breakdown'ları güncelle
                const updatedRecords = [];
                
                // Eğer selectedJobs varsa (modal'dan seçili kayıtlar), sadece onları güncelle
                if (selectedJobs && selectedJobs.length > 0) {
                    console.log('Modal\'dan seçili kayıtlar güncelleniyor:', selectedJobs.length);
                    
                    const updatePromises = selectedJobs.map(async (selectedJob) => {
                        if (!selectedJob.planId) return null;
                        
                        const relatedNumericPlanId = Number(selectedJob.planId);
                        if (isNaN(relatedNumericPlanId) || relatedNumericPlanId <= 0) {
                            console.warn('Geçersiz planId atlandı:', selectedJob.planId);
                            return null;
                        }
                        
                        try {
                            const relatedResponse = await fetch('/api/planning/update', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    planId: relatedNumericPlanId,
                                    planTarihi: selectedJob.newPlanTarihi,
                                    planlananMiktar: selectedJob.newPlanlananMiktar,
                                    selectedMachine: selectedJob.makAd || null
                                })
                            });
                            const relatedResult = await relatedResponse.json();
                            if (relatedResult.success) {
                                console.log(`Bağlı breakdown güncellendi: planId=${relatedNumericPlanId}, tarih=${selectedJob.newPlanTarihi}, miktar=${selectedJob.newPlanlananMiktar}`);
                                return {
                                    isemriId: selectedJob.isemriId,
                                    planTarihi: selectedJob.newPlanTarihi,
                                    planlananMiktar: selectedJob.newPlanlananMiktar,
                                    planId: selectedJob.planId,
                                    isBreakdown: true
                                };
                            } else {
                                console.error(`Bağlı breakdown güncelleme başarısız: planId=${relatedNumericPlanId}`, relatedResult);
                            }
                        } catch (error) {
                            console.error(`Bağlı breakdown güncelleme hatası (${selectedJob.planId}):`, error);
                        }
                        return null;
                    });
                    
                    const results = await Promise.all(updatePromises);
                    const successfulUpdates = results.filter(r => r !== null);
                    updatedRecords.push(...successfulUpdates);
                    console.log(`Başarılı güncellemeler: ${successfulUpdates.length}/${selectedJobs.length}`);
                } else if (tarihDegisti && relatedBreakdowns.length > 0 && eskiTarih) {
                    // Eski mantık: Otomatik tarih güncelleme (geriye dönük uyumluluk için)
                    // ÖNEMLİ: Sadece planlanmış breakdown'ların tarihlerini güncelle
                    // Planlama yapılmamış (tarihi olmayan) işlere dokunmuyoruz
                    const eskiTarihObj = new Date(eskiTarih);
                    const yeniTarihObj = new Date(planTarihi);
                    const offsetGun = Math.round((yeniTarihObj - eskiTarihObj) / (1000 * 60 * 60 * 24));
                    
                    console.log(`Tarih offset: ${offsetGun} gün (${eskiTarih} → ${planTarihi})`);
                    console.log(`Güncellenecek breakdown sayısı: ${relatedBreakdowns.length}`);
                    
                    // Sadece planlanmış breakdown'ları filtrele (tarihi olan ve durumu 'Planlandı' olan)
                    const plannedBreakdowns = relatedBreakdowns.filter(brk => 
                        brk.durum === 'Planlandı' && 
                        brk.planTarihi && 
                        brk.planId && 
                        !brk.planId.toString().startsWith('queue-') &&
                        !isNaN(Number(brk.planId))
                    );
                    
                    console.log(`Planlanmış breakdown sayısı (tarih güncelleme için): ${plannedBreakdowns.length}`);
                    
                    // Tüm planlanmış breakdown'ları paralel olarak güncelle (performans için)
                    const dateUpdatePromises = plannedBreakdowns.map(async (relatedBrk) => {
                        try {
                            // Mevcut tarih varsa, offset ekle
                            const relatedTarihObj = new Date(relatedBrk.planTarihi);
                            relatedTarihObj.setDate(relatedTarihObj.getDate() + offsetGun);
                            const yeniRelatedTarih = relatedTarihObj.toISOString().split('T')[0];
                            
                            const relatedNumericPlanId = Number(relatedBrk.planId);
                            
                            console.log(`Bağlı breakdown güncelleniyor: planId=${relatedNumericPlanId}, eskiTarih=${relatedBrk.planTarihi}, yeniTarih=${yeniRelatedTarih}`);
                            
                            const relatedResponse = await fetch('/api/planning/update', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    planId: relatedNumericPlanId,
                                    planTarihi: yeniRelatedTarih,
                                    planlananMiktar: relatedBrk.planlananMiktar,
                                    selectedMachine: relatedBrk.makAd || null
                                })
                            });
                            const relatedResult = await relatedResponse.json();
                            if (relatedResult.success) {
                                console.log(`Bağlı breakdown güncellendi: planId=${relatedNumericPlanId}`);
                                return {
                                    isemriId: relatedBrk.isemriId,
                                    planTarihi: yeniRelatedTarih,
                                    planlananMiktar: relatedBrk.planlananMiktar,
                                    planId: relatedBrk.planId,
                                    isBreakdown: true
                                };
                            } else {
                                console.error(`Bağlı breakdown güncelleme başarısız: planId=${relatedNumericPlanId}`, relatedResult);
                            }
                        } catch (error) {
                            console.error(`Bağlı breakdown güncelleme hatası (${relatedBrk.planId}):`, error);
                        }
                        return null;
                    });
                    
                    // Tüm tarih güncellemelerini bekle
                    const dateUpdateResults = await Promise.all(dateUpdatePromises);
                    const successfulDateUpdates = dateUpdateResults.filter(r => r !== null);
                    console.log(`Başarılı tarih güncellemeleri: ${successfulDateUpdates.length}/${plannedBreakdowns.length}`);
                    updatedRecords.push(...successfulDateUpdates);
                }
                
                // Miktar değişikliği varsa ve onay verildiyse bağlı breakdown'ların miktarını güncelle
                // NOT: selectedJobs varsa bu kısım atlanır çünkü zaten modal'dan güncellenmiştir
                if (!selectedJobs && updateRelatedAmounts && updateTarget === 'all' && eskiMiktar !== null && eskiMiktar !== undefined) {
                    // Miktar artışını hesapla (güncel miktardan)
                    const miktarArtisi = planlananMiktar - eskiMiktar;
                    console.log(`Miktar güncelleme: eskiMiktar=${eskiMiktar}, yeniMiktar=${planlananMiktar}, artış=${miktarArtisi}`);
                    
                    // Tüm breakdown'ları birleştir (bekleyen ve planlı)
                    const allBreakdowns = [...waitingBreakdowns, ...relatedBreakdowns];
                    
                    if (allBreakdowns.length > 0) {
                        // Tüm güncellemeleri paralel olarak yap (performans için)
                        const updatePromises = allBreakdowns.map(async (relatedBrk) => {
                            if (!relatedBrk.planId) return null;
                            
                            // planId kontrolü - "queue-" ile başlayan geçici ID'leri atla
                            if (!relatedBrk.planId || 
                                (typeof relatedBrk.planId === 'string' && relatedBrk.planId.startsWith('queue-')) ||
                                isNaN(Number(relatedBrk.planId))) {
                                console.warn('Geçersiz planId atlandı (miktar güncelleme):', relatedBrk.planId);
                                return null;
                            }
                            
                            try {
                                // Her breakdown'a artış miktarını ekle
                                const yeniMiktar = (relatedBrk.planlananMiktar || 0) + miktarArtisi;
                                
                                const relatedNumericPlanId = Number(relatedBrk.planId);
                                
                                const relatedResponse = await fetch('/api/planning/update', {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        planId: relatedNumericPlanId,
                                        planTarihi: relatedBrk.planTarihi || item.planlananTarih || planTarihi,
                                        planlananMiktar: yeniMiktar,
                                        selectedMachine: relatedBrk.makAd || null
                                    })
                                });
                                const relatedResult = await relatedResponse.json();
                                if (relatedResult.success) {
                                    return {
                                        isemriId: relatedBrk.isemriId,
                                        planTarihi: relatedBrk.planTarihi || item.planlananTarih || planTarihi,
                                        planlananMiktar: yeniMiktar,
                                        planId: relatedBrk.planId,
                                        durum: relatedBrk.durum || 'Planlandı',
                                        isBreakdown: true
                                    };
                                }
                            } catch (error) {
                                console.error(`Breakdown güncelleme hatası (${relatedBrk.planId}):`, error);
                            }
                            return null;
                        });
                        
                        // Tüm güncellemeleri bekle
                        const results = await Promise.all(updatePromises);
                        const successfulUpdates = results.filter(r => r !== null);
                        updatedRecords.push(...successfulUpdates);
                    }
                }
                
                // Ultra hızlı güncelleme - sadece değişen kayıtları güncelle
                // Not: ultraFastUpdate zaten chart'ları ve grid'i güncelliyor, restoreFilters'a gerek yok
                if (window.planningApp) {
                    // Kırılım işlemlerinde planId kontrolü - yukarıda belirlenen planId'yi kullan
                    const targetPlanId = numericPlanId; // Yukarıda doğrulanmış planId
                    
                    // Kırılım verilerini güncelle (planId parametresi ile)
                    const updatedPlanningData = this.updatePlanningDataForItem(item, planTarihi, planlananMiktar, targetPlanId);
                    
                    const updatedRecord = {
                        isemriId: item.isemriId,
                        planTarihi: planTarihi,
                        planlananMiktar: planlananMiktar,
                        planId: targetPlanId,
                        planningData: updatedPlanningData,
                        isBreakdown: item.isemriParcaNo ? true : false
                    };
                    
                    // Tüm güncellenen kayıtları birleştir
                    const allUpdatedRecords = [updatedRecord, ...updatedRecords];
                    
                    // ultraFastUpdate zaten grid, chart ve filtreleri koruyarak güncelliyor
                    await window.planningApp.ultraFastUpdate(allUpdatedRecords);
                }
                
                // Modal'ı hemen kapat (animasyonları beklemeden)
                const modal = document.getElementById('planningModal');
                if (modal) {
                    modal.style.display = 'none';
                    // resetModalContent'ı async olarak yap (UI thread'i bloke etmemek için)
                    setTimeout(() => {
                        this.resetModalContent();
                    }, 0);
                }
                
                // Başarı mesajını async göster (UI thread'i bloke etmemek için)
                setTimeout(() => {
                    window.planningApp.showSuccess('Planlama başarıyla güncellendi!');
                }, 0);
            } else {
                window.planningApp.showError('Planlama güncellenirken hata oluştu: ' + result.message);
            }
        } catch (error) {
            console.error('Güncelleme hatası:', error);
            window.planningApp.showError('Güncelleme sırasında bir hata oluştu: ' + error.message);
        }
    }
    /**
     * Planlamayı geri çeker
     * @param {Object} item - İş emri verisi
     */
    async revertPlanning(item) {
        // Özel onay modal'ı kullan
        const confirmed = await this.showConfirmDialog(
            'Planlama Geri Çekme',
            `${item.isemriNo} numaralı iş emrinin planlamasını geri çekmek istediğinizden emin misiniz?`,
            'Bu işlem geri alınamaz!'
        );
        
        if (!confirmed) {
            return;
        }
        
        // ÖNEMLİ: item referansı eski olabilir, güncel data array'inden yeniden al
        // planId: "new" sorununu çözmek için güncel veriyi kullanmalıyız
        // ANCAK: breakdownPlanId ve parcaNo context menu'den geldiği için item'dan korunmalı
        const originalBreakdownPlanId = item.breakdownPlanId; // Context menu'den gelen breakdownPlanId'yi koru
        const originalIsemriParcaNo = item.isemriParcaNo; // Context menu'den gelen isemriParcaNo'yu koru
        const originalParcaNo = item.parcaNo; // Context menu'den gelen parcaNo'yu koru
        
        console.log('Geri çekme başlangıç - context menu\'den gelen değerler:', {
            breakdownPlanId: originalBreakdownPlanId,
            breakdownPlanIdType: typeof originalBreakdownPlanId,
            isemriParcaNo: originalIsemriParcaNo,
            parcaNo: originalParcaNo,
            isemriId: item.isemriId,
            isemriNo: item.isemriNo
        });
        
        let currentItem = item;
        if (window.planningApp && window.planningApp.data) {
            const freshItem = window.planningApp.data.find(rec => rec.isemriId === item.isemriId);
            if (freshItem) {
                currentItem = freshItem;
                // Context menu'den gelen breakdownPlanId, isemriParcaNo ve parcaNo'yu geri yükle
                if (originalBreakdownPlanId !== undefined) {
                    currentItem.breakdownPlanId = originalBreakdownPlanId;
                }
                if (originalIsemriParcaNo !== undefined && originalIsemriParcaNo !== null) {
                    currentItem.isemriParcaNo = originalIsemriParcaNo;
                }
                if (originalParcaNo !== undefined && originalParcaNo !== null) {
                    currentItem.parcaNo = originalParcaNo;
                }
                console.log('Geri çekme için güncel item bulundu:', {
                    eskiPlanId: item.planId,
                    yeniPlanId: freshItem.planId,
                    breakdownPlanId: originalBreakdownPlanId,
                    breakdownPlanIdType: typeof originalBreakdownPlanId,
                    isemriParcaNo: originalIsemriParcaNo,
                    parcaNo: originalParcaNo,
                    breakdownsVar: Array.isArray(freshItem.breakdowns) && freshItem.breakdowns.length > 0,
                    breakdowns: freshItem.breakdowns ? freshItem.breakdowns.map(brk => ({
                        parcaNo: brk.parcaNo,
                        planId: brk.planId,
                        planIdType: typeof brk.planId,
                        planlananMiktar: brk.planlananMiktar,
                        durum: brk.durum
                    })) : []
                });
            }
        }
        
        // planId kontrolü - breakdown'larda breakdownPlanId kullanılabilir
        // ÖNEMLİ: Plan ID benzersiz olduğu için öncelikle breakdownPlanId kullanılmalı
        let planId = null;
        
        // 1. Öncelik: breakdownPlanId (context menu'den gelen, en güvenilir)
        // ÖNEMLİ: Eğer breakdownPlanId varsa, bu kırılım satırına tıklandığı anlamına gelir
        // Bu durumda sadece bu planId kullanılmalı, ana item'ın planId'si kullanılmamalı
        if (currentItem.breakdownPlanId && 
            currentItem.breakdownPlanId !== 'new' && 
            currentItem.breakdownPlanId !== null && 
            currentItem.breakdownPlanId !== undefined &&
            !(typeof currentItem.breakdownPlanId === 'string' && currentItem.breakdownPlanId.startsWith('queue-'))) {
            planId = currentItem.breakdownPlanId;
            console.log('planId breakdownPlanId\'den bulundu (öncelikli - kırılım satırı):', planId, 'isemriParcaNo:', currentItem.isemriParcaNo);
        }
        
        // 2. İkinci öncelik: Ana item'ın planId'si (geçici ID'ler hariç)
        // ÖNEMLİ: Eğer breakdownPlanId yoksa (ana satıra tıklandıysa), ana item'ın planId'sini kullan
        if (!planId || planId === 'new') {
            // Eğer isemriParcaNo varsa, bu bir kırılım satırıdır ve breakdownPlanId olmalıydı
            // Bu durumda ana item'ın planId'sini kullanma, breakdowns array'inde ara
            if (currentItem.isemriParcaNo === undefined || currentItem.isemriParcaNo === null) {
                // Ana satıra tıklandıysa, ana item'ın planId'sini kullan
                planId = currentItem.planId;
                // ÖNEMLİ: "queue-" ile başlayan geçici planId'leri filtrele (kuyruk planlama için oluşturulan geçici ID'ler)
                if (planId && typeof planId === 'string' && planId.startsWith('queue-')) {
                    console.log('Geçici planId tespit edildi, gerçek planId aranıyor:', planId);
                    planId = null; // Geçici planId'yi temizle, gerçek planId'yi bul
                }
            } else {
                // Kırılım satırına tıklandı ama breakdownPlanId bulunamadı, breakdowns array'inde ara
                console.log('Kırılım satırına tıklandı ama breakdownPlanId bulunamadı, breakdowns array\'inde aranıyor...');
            }
        }
        
        // 3. Üçüncü öncelik: breakdowns array'inde plan ID ile eşleşen breakdown'ı bul
        if (!planId || planId === 'new' || planId === null || planId === undefined) {
            if (currentItem.breakdowns && Array.isArray(currentItem.breakdowns) && currentItem.breakdowns.length > 0) {
                console.log('breakdowns array\'inde planId aranıyor, toplam breakdown sayısı:', currentItem.breakdowns.length);
                console.log('Mevcut item bilgileri:', {
                    isemriParcaNo: currentItem.isemriParcaNo,
                    planId: currentItem.planId,
                    breakdownPlanId: currentItem.breakdownPlanId,
                    breakdowns: currentItem.breakdowns.map(brk => ({
                        parcaNo: brk.parcaNo,
                        planId: brk.planId,
                        durum: brk.durum
                    }))
                });
                
                // Önce isemriParcaNo ile eşleşen breakdown'ı bul (planId !== 'new' kontrolü ile)
                // ÖNEMLİ: isemriParcaNo karşılaştırmasında hem null hem de sayısal değerleri kontrol et
                if (currentItem.isemriParcaNo !== undefined && currentItem.isemriParcaNo !== null) {
                    const matchingBreakdown = currentItem.breakdowns.find(brk => {
                        // parcaNo karşılaştırması: hem null hem de sayısal değerleri kontrol et
                        const parcaNoMatch = (brk.parcaNo === currentItem.isemriParcaNo) || 
                                             (brk.parcaNo === null && currentItem.isemriParcaNo === null) ||
                                             (Number(brk.parcaNo) === Number(currentItem.isemriParcaNo));
                        
                        return parcaNoMatch && 
                               brk.planId && 
                               brk.planId !== 'new' &&
                               brk.planId !== null &&
                               brk.planId !== undefined &&
                               !(typeof brk.planId === 'string' && brk.planId.startsWith('queue-'));
                    });
                    if (matchingBreakdown && matchingBreakdown.planId) {
                        planId = matchingBreakdown.planId;
                        console.log('planId isemriParcaNo ile eşleşen breakdown\'dan bulundu:', {
                            planId: planId,
                            isemriParcaNo: currentItem.isemriParcaNo,
                            breakdownParcaNo: matchingBreakdown.parcaNo,
                            breakdownPlanId: matchingBreakdown.planId
                        });
                    } else {
                        console.log('isemriParcaNo ile eşleşen breakdown bulunamadı:', {
                            isemriParcaNo: currentItem.isemriParcaNo,
                            availableBreakdowns: currentItem.breakdowns.map(brk => ({
                                parcaNo: brk.parcaNo,
                                planId: brk.planId,
                                durum: brk.durum
                            }))
                        });
                    }
                }
                
                // Eğer hala bulunamadıysa, herhangi bir planlı breakdown'ı bul (geçici "queue-" ID'lerini hariç tut)
                if (!planId || planId === 'new') {
                    const plannedBreakdown = currentItem.breakdowns.find(brk => 
                        brk.durum === 'Planlandı' && 
                        brk.planId && 
                        brk.planId !== 'new' &&
                        brk.planId !== null &&
                        brk.planId !== undefined &&
                        !(typeof brk.planId === 'string' && brk.planId.startsWith('queue-'))
                    );
                    if (plannedBreakdown && plannedBreakdown.planId) {
                        planId = plannedBreakdown.planId;
                        console.log('planId planlı breakdown\'dan bulundu:', planId);
                    }
                }
                
                // Eğer hala bulunamadıysa, herhangi bir geçerli planId'li breakdown'ı bul (geçici "queue-" ID'lerini hariç tut)
                if (!planId || planId === 'new') {
                    const anyBreakdown = currentItem.breakdowns.find(brk => 
                        brk.planId && 
                        brk.planId !== 'new' &&
                        brk.planId !== null &&
                        brk.planId !== undefined &&
                        !(typeof brk.planId === 'string' && brk.planId.startsWith('queue-'))
                    );
                    if (anyBreakdown && anyBreakdown.planId) {
                        planId = anyBreakdown.planId;
                        console.log('planId herhangi bir breakdown\'dan bulundu:', planId);
                    }
                }
                
                if (!planId || planId === 'new') {
                    console.warn('breakdowns içindeki planId\'ler:', currentItem.breakdowns.map(brk => ({
                        parcaNo: brk.parcaNo,
                        planId: brk.planId,
                        durum: brk.durum
                    })));
                }
            }
        }
        
        // planId'nin sayısal olduğundan emin ol (geçici "queue-" ID'leri reddet)
        if (!planId || planId === 'new' || planId === null || planId === undefined || 
            (typeof planId === 'string' && planId.startsWith('queue-'))) {
            window.planningApp.showError('Geçerli Plan ID bulunamadı. Bu kayıt kuyruk planlamadan geliyor olabilir veya henüz veritabanına kaydedilmemiş. Lütfen sayfayı yenileyip tekrar deneyin.');
            console.error('PlanId bulunamadı - geri çekme için geçerli plan gerekli:', {
                item: currentItem,
                planId: currentItem.planId,
                breakdowns: currentItem.breakdowns,
                breakdownPlanId: currentItem.breakdownPlanId,
                planIdType: typeof planId,
                planIdParsed: planId ? Number(planId) : null
            });
            return;
        }
        
        // planId'nin sayısal olduğundan emin ol veya obje/null ise alternatif yöntem kullan
        let numericPlanId = null;
        let useAlternativeMethod = false;
        
        // Plan ID obje ise veya geçersizse, alternatif yöntem kullan
        if (planId && typeof planId === 'object') {
            console.warn('Plan ID bir obje, alternatif yöntem kullanılacak:', planId);
            useAlternativeMethod = true;
        } else {
            numericPlanId = Number(planId);
            if (isNaN(numericPlanId) || numericPlanId <= 0) {
                console.warn('Plan ID sayısal değil, alternatif yöntem kullanılacak:', planId);
                useAlternativeMethod = true;
            }
        }
        
        // Alternatif yöntem: isemriId ve parcaNo kullan
        if (useAlternativeMethod) {
            // parcaNo'yu belirle: önce isemriParcaNo, sonra parcaNo
            const parcaNoToUse = currentItem.isemriParcaNo !== undefined && currentItem.isemriParcaNo !== null
                ? currentItem.isemriParcaNo
                : (currentItem.parcaNo !== undefined && currentItem.parcaNo !== null ? currentItem.parcaNo : null);
            
            if (!currentItem.isemriId || parcaNoToUse === undefined || parcaNoToUse === null) {
                window.planningApp.showError(`Plan ID geçersiz ve alternatif yöntem için gerekli bilgiler eksik. Lütfen sayfayı yenileyip tekrar deneyin.`);
                console.error('Alternatif yöntem için gerekli bilgiler eksik:', {
                    isemriId: currentItem.isemriId,
                    isemriParcaNo: currentItem.isemriParcaNo,
                    parcaNo: currentItem.parcaNo,
                    parcaNoToUse: parcaNoToUse,
                    item: currentItem
                });
                return;
            }
        }
        
        try {
            const requestBody = useAlternativeMethod ? {
                isemriId: currentItem.isemriId,
                parcaNo: currentItem.isemriParcaNo !== undefined && currentItem.isemriParcaNo !== null
                    ? currentItem.isemriParcaNo
                    : (currentItem.parcaNo !== undefined && currentItem.parcaNo !== null ? currentItem.parcaNo : null),
                planId: null // Geçersiz planId gönder
            } : {
                planId: numericPlanId,
                isemriParcaNo: currentItem.isemriParcaNo || null // Doğrulama için gönder
            };
            
            console.log('Geri çekme için gönderilen veri:', {
                method: useAlternativeMethod ? 'isemriId+parcaNo' : 'planId',
                ...requestBody,
                isemriNo: currentItem.isemriNo,
                breakdownPlanId: currentItem.breakdownPlanId,
                durum: currentItem.durum,
                breakdowns: currentItem.breakdowns ? currentItem.breakdowns.map(brk => ({
                    parcaNo: brk.parcaNo,
                    planId: brk.planId,
                    planIdType: typeof brk.planId,
                    durum: brk.durum
                })) : []
            });
            
            const response = await fetch('/api/planning/revert', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            const result = await response.json();
            if (result.success) {
                console.log('Planlama geri çekme başarılı:', result);
                
                // Mevcut filtre durumlarını koru
                const currentFilters = this.preserveFilters();
                console.log('Filtreler korundu:', currentFilters);
                
                // Ultra hızlı güncelleme - sadece silinen planı kaldır, diğerlerini koru
                if (window.planningApp) {
                    console.log('Silme işlemi için ultra hızlı güncelleme...');
                    
                    // Güncel item'ı al (breakdown'lar dahil)
                    let freshItem = currentItem;
                    if (window.planningApp.data) {
                        const foundItem = window.planningApp.data.find(rec => rec.isemriId === currentItem.isemriId);
                        if (foundItem) {
                            freshItem = foundItem;
                        }
                    }
                    
                    // Silinen breakdown'ı kaldır, diğerlerini koru
                    // ÖNEMLİ: Alternatif yöntem kullanıldıysa parcaNo ile filtrele, yoksa planId ile
                    let remainingBreakdowns;
                    if (useAlternativeMethod) {
                        // Alternatif yöntem: parcaNo ile filtrele
                        const silinenParcaNo = currentItem.isemriParcaNo !== undefined && currentItem.isemriParcaNo !== null
                            ? currentItem.isemriParcaNo
                            : (currentItem.parcaNo !== undefined && currentItem.parcaNo !== null ? currentItem.parcaNo : null);
                        
                        console.log('Alternatif yöntem - silinen breakdown parcaNo ile filtreleniyor:', {
                            silinenParcaNo: silinenParcaNo,
                            breakdowns: freshItem.breakdowns ? freshItem.breakdowns.map(brk => ({
                                parcaNo: brk.parcaNo,
                                planId: brk.planId,
                                planlananMiktar: brk.planlananMiktar,
                                durum: brk.durum
                            })) : []
                        });
                        
                        remainingBreakdowns = (freshItem.breakdowns || []).filter(brk => {
                            // parcaNo karşılaştırması: hem null hem de sayısal değerleri kontrol et
                            const parcaNoMatch = (brk.parcaNo === silinenParcaNo) || 
                                                 (brk.parcaNo === null && silinenParcaNo === null) ||
                                                 (Number(brk.parcaNo) === Number(silinenParcaNo));
                            // Eşleşen breakdown'ı hariç tut (silinecek)
                            return !parcaNoMatch;
                        });
                    } else {
                        // Normal yöntem: planId ile filtrele
                        remainingBreakdowns = (freshItem.breakdowns || []).filter(brk => {
                            // planId karşılaştırması: hem sayısal hem de string karşılaştırması
                            const planIdMatch = (brk.planId === numericPlanId) || 
                                               (brk.planId === planId) ||
                                               (Number(brk.planId) === Number(numericPlanId)) ||
                                               (Number(brk.planId) === Number(planId));
                            // Eşleşen breakdown'ı hariç tut (silinecek)
                            return !planIdMatch;
                        });
                    }
                    
                    console.log('Filtreleme sonrası kalan breakdown\'lar:', {
                        kalanBreakdownSayisi: remainingBreakdowns.length,
                        kalanBreakdowns: remainingBreakdowns.map(brk => ({
                            parcaNo: brk.parcaNo,
                            planId: brk.planId,
                            planlananMiktar: brk.planlananMiktar,
                            durum: brk.durum
                        }))
                    });
                    
                    // Kalan breakdown'lara göre toplam planlanan miktarı hesapla
                    const remainingPlanned = remainingBreakdowns
                        .filter(b => (b.durum || '').toLowerCase() === 'planlandı')
                        .reduce((sum, b) => sum + (b.planlananMiktar || 0), 0);
                    
                    // Sipariş miktarı
                    const siparisMiktar = freshItem.siparisMiktar || freshItem.planMiktar || 0;
                    
                    // Durum hesapla
                    let newDurum = 'Beklemede';
                    if (remainingPlanned > 0) {
                        if (remainingPlanned >= siparisMiktar) {
                            newDurum = 'Planlandı';
                        } else {
                            newDurum = 'Kısmi Planlandı';
                        }
                    }
                    
                    // Planlanan tarih - kalan breakdown'lardan en son tarih
                    const planDates = remainingBreakdowns
                        .map(b => b.planTarihi)
                        .filter(Boolean)
                        .sort((a, b) => new Date(a) - new Date(b));
                    const newPlanTarihi = planDates.length > 0 ? planDates[planDates.length - 1] : null;
                    
                    // İlk planlı breakdown'dan planId ve selectedMachine al
                    const firstPlannedBreakdown = remainingBreakdowns.find(b => 
                        (b.durum || '').toLowerCase() === 'planlandı'
                    );
                    const newPlanId = firstPlannedBreakdown?.planId || null;
                    const newSelectedMachine = firstPlannedBreakdown?.makAd || firstPlannedBreakdown?.selectedMachine || null;
                    
                    const updatedRecord = {
                        isemriId: freshItem.isemriId,
                        isemriNo: freshItem.isemriNo,
                        planTarihi: newPlanTarihi,
                        planlananMiktar: remainingPlanned,
                        planId: newPlanId,
                        planlamaDurumu: newDurum,
                        durum: newDurum,
                        planningData: {
                            breakdowns: remainingBreakdowns,
                            totalPlanned: remainingPlanned,
                            totalWaiting: Math.max(0, siparisMiktar - remainingPlanned),
                            status: newDurum
                        },
                        isBreakdown: currentItem.isemriParcaNo ? true : false,
                        action: currentItem.isemriParcaNo ? 'deleteBreakdown' : 'deleteMain',
                        selectedMachine: newSelectedMachine
                    };
                    
                    console.log('Geri çekme sonrası güncelleme:', {
                        silinenPlanId: numericPlanId,
                        kalanBreakdownSayisi: remainingBreakdowns.length,
                        kalanPlanlananMiktar: remainingPlanned,
                        yeniDurum: newDurum,
                        yeniPlanId: newPlanId,
                        action: updatedRecord.action
                    });
                    
                    await window.planningApp.ultraFastUpdate([updatedRecord]);
                    console.log('Ultra hızlı güncelleme tamamlandı');
                    
                    // Grid'i manuel olarak güncelle (ultraFastUpdate içinde güncelleniyor ama emin olmak için)
                    if (this.updateGridRows) {
                        this.updateGridRows([freshItem.isemriId]);
                    }
                }
                
                // Not: restoreFilters() çağrısı kaldırıldı - ultraFastUpdate zaten chart'ları güncelliyor
                // restoreFilters() gereksiz chart güncellemesi yapıyordu ve UI thread'i bloke ediyordu
                
                // Başarı mesajını async göster (UI thread'i bloke etmemek için)
                setTimeout(() => {
                    window.planningApp.showSuccess('Planlama başarıyla geri çekildi!');
                }, 0);
            } else {
                window.planningApp.showError('Planlama geri çekilirken hata oluştu: ' + result.message);
            }
        } catch (error) {
            console.error('Planlama geri çekme hatası:', error);
            window.planningApp.showError('Planlama geri çekilirken hata oluştu.');
        }
    }
    /**
     * Planlama modal'ını kapatır
     */
    closePlanningModal() {
        const modal = document.getElementById('planningModal');
        if (modal) {
            modal.style.display = 'none';
            // Modal içeriğini temizle
            this.resetModalContent();
        }
    }
    
    /**
     * Özel onay dialog'u gösterir
     * @param {string} title - Başlık
     * @param {string} message - Mesaj
     * @param {string} warning - Uyarı mesajı (opsiyonel)
     * @returns {Promise<boolean>} - Kullanıcı onayladıysa true
     */
    showConfirmDialog(title, message, warning = '') {
        return new Promise((resolve) => {
            // Eğer zaten bir confirm dialog varsa kaldır
            const existingDialog = document.getElementById('confirmDialog');
            if (existingDialog) {
                existingDialog.remove();
            }
            
            // Dialog oluştur
            const dialog = document.createElement('div');
            dialog.id = 'confirmDialog';
            dialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease;
            `;
            
            dialog.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 8px;
                    padding: 30px;
                    max-width: 450px;
                    width: 90%;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    animation: slideIn 0.3s ease;
                ">
                    <div style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        margin: -30px -30px 20px -30px;
                        border-radius: 8px 8px 0 0;
                        font-size: 20px;
                        font-weight: bold;
                    ">${title}</div>
                    
                    <div style="padding: 15px 0; line-height: 1.6; color: #555; font-size: 15px;">
                        ${message}
                    </div>
                    
                    ${warning ? `
                        <div style="
                            background: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 12px;
                            margin: 15px 0;
                            border-radius: 4px;
                            color: #856404;
                        ">
                            <strong>⚠️ Uyarı:</strong> ${warning}
                        </div>
                    ` : ''}
                    
                    <div style="
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                        margin-top: 25px;
                    ">
                        <button id="confirmCancelBtn" style="
                            padding: 10px 25px;
                            border: 2px solid #ddd;
                            background: white;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            transition: all 0.2s;
                        ">İptal</button>
                        <button id="confirmOkBtn" style="
                            padding: 10px 25px;
                            border: none;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                            transition: all 0.2s;
                        ">Onayla</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            // Event listener'lar
            document.getElementById('confirmCancelBtn').addEventListener('click', () => {
                dialog.remove();
                resolve(false);
            });
            
            document.getElementById('confirmOkBtn').addEventListener('click', () => {
                dialog.remove();
                resolve(true);
            });
            
            // ESC tuşu ile kapat
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    dialog.remove();
                    document.removeEventListener('keydown', handleEsc);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
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
                    ">⏳ Kuyruk Tam Planlama</div>
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
        if (progressMessage) {
            progressMessage.textContent = message;
        }
    }
    
    /**
     * Progress bar'ı kaldırır
     */
    hideProgressBar() {
        const progressBar = document.getElementById('queueProgressBar');
        if (progressBar) {
            progressBar.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                progressBar.remove();
            }, 300);
        }
    }
    
    /**
     * Progress'i batch'ler halinde günceller (Chrome'un "yanıt vermiyor" uyarısını önlemek için)
     * @param {Array} plannedStages - Planlanan aşamalar
     * @param {number} planlananMiktar - Planlanan miktar
     */
    // Bu fonksiyon artık kullanılmıyor - tüm güncellemeler tek seferde yapılıyor
    // Deprecated: updateProgressInBatches - Kaldırıldı
    
    /**
     * Mevcut filtre durumlarını korur
     * @returns {Object} Filtre durumları
     */
    preserveFilters() {
        return {
            bolum: this.filters.bolum,
            makina: this.filters.makina,
            firma: this.filters.firma,
            malzeme: this.filters.malzeme,
            durum: this.filters.durum,
            search: this.filters.search,
            startDate: document.getElementById('startDate')?.value || '',
            endDate: document.getElementById('endDate')?.value || ''
        };
    }
    
    /**
     * Filtre durumlarını geri yükler
     * @param {Object} filters - Korunan filtre durumları
     */
    async restoreFilters(filters) {
        if (!filters) return;
        
        console.log('Filtreler geri yükleniyor:', filters);
        
        // DOM elementlerini al
        const bolumFilter = document.getElementById('bolumFilter');
        const makinaFilter = document.getElementById('makinaFilter');
        const firmaFilter = document.getElementById('firmaFilter');
		const malzemeList = document.getElementById('malzemeList');
        const searchInput = document.getElementById('searchInput');
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        // 1. Önce bölüm filtresini ayarla (makina filtresini etkiler)
        if (bolumFilter && filters.bolum) {
            bolumFilter.value = filters.bolum;
            this.filters.bolum = filters.bolum;
        }
        
        // 2. Makina filtresini ayarla (bölüm ayarlandıktan sonra)
        if (makinaFilter && filters.makina) {
            // Önce makina seçeneklerini güncelle (varsayılan seçim yapma, skipDefaultSelection=true)
            // Ancak await kullanmadan async yap (donmayı önlemek için)
            this.updateMakinaFilter(true).then(() => {
                // Makina filtresini ayarla
                makinaFilter.value = filters.makina;
                this.filters.makina = filters.makina;
                
                // ChartManager'ı da güncelle
                if (window.chartManager) {
                    window.chartManager.updateMachineFilter(filters.makina);
                }
                
                console.log('Makina filtresi geri yüklendi:', filters.makina);
            }).catch(err => {
                console.warn('Makina filtresi geri yükleme hatası:', err);
                // Hata durumunda bile filtreyi ayarla
                makinaFilter.value = filters.makina;
                this.filters.makina = filters.makina;
            });
        } else if (makinaFilter && !filters.makina) {
            // Makina filtresi boşsa, seçimi temizle
            makinaFilter.value = '';
            this.filters.makina = '';
        }
        
        // 3. Diğer filtreleri ayarla
        if (firmaFilter && filters.firma) {
            firmaFilter.value = filters.firma;
            this.filters.firma = filters.firma;
        }
        
		if (malzemeList && Array.isArray(filters.malzeme)) {
			Array.from(malzemeList.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
				cb.checked = filters.malzeme.includes(cb.value);
			});
			this.filters.malzeme = [...filters.malzeme];
			this.updateMalzemeControlDisplay();
        }
        
        // Durum filtresi - çoklu seçim
        const durumList = document.getElementById('durumList');
        if (durumList && filters.durum) {
            // Seçili durumları checkbox'lara uygula
            const checkboxes = durumList.querySelectorAll('input[type="checkbox"]');
            const selectedDurumlar = Array.isArray(filters.durum) ? filters.durum : [filters.durum];
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectedDurumlar.includes(checkbox.value);
            });
            this.filters.durum = Array.isArray(filters.durum) ? filters.durum : [filters.durum];
            this.updateDurumControlDisplay();
        }
        
        if (searchInput && filters.search) {
            searchInput.value = filters.search;
            this.filters.search = filters.search;
        }
        
        if (startDate && filters.startDate) {
            startDate.value = filters.startDate;
        }
        
        if (endDate && filters.endDate) {
            endDate.value = filters.endDate;
        }
        
        // 4. Filtreleri uygula (makina filtresinin ayarlanmasını bekle)
        console.log('Filtreler uygulanıyor...');
        
        // Önce filteredData'yı güncel veri ile senkronize et
        this.filteredData = [...this.data];
        console.log('filteredData güncellendi:', {
            dataLength: this.data.length,
            filteredDataLength: this.filteredData.length
        });
        
        this.applyFilters();
        console.log('Filtreler uygulandı, tablo güncellendi');
        
        // Chart'ları da güncelle
        if (window.chartManager) {
            console.log('Chart\'lar güncelleniyor...');
            await window.chartManager.updateCharts();
            console.log('Chart\'lar güncellendi');
        }
        
        console.log('Filtreler başarıyla geri yüklendi:', {
            bolum: this.filters.bolum,
            makina: this.filters.makina,
            firma: this.filters.firma,
            malzeme: this.filters.malzeme,
            durum: this.filters.durum,
            search: this.filters.search
        });
    }

    /**
     * İş emri parçalama modal'ını açar
     * @param {Object} item - Seçilen iş emri verisi
     */
    openSplitModal(item) {
        const modal = document.getElementById('planningModal');
        if (!modal) return;

        // Önce modal içeriğini temizle
        this.resetModalContent();

        // Modal başlığını güncelle
        const modalTitle = modal.querySelector('.modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = 'İş Emri Parçala';
        }

        // Tüm bölümler için makine dropdown'ı ekle
        this.populateMachineDropdown(modal, item, 'splitMakine').then(() => {
            // Maça bölümü için özel kontrol (artık sadece alt makineleri göstermek için)
        if (this.isMacaBolumu(item)) {
            this.checkMachineAndOpenSplitModal(item, modal);
        } else {
            // Normal parçalama modal'ı
            this.openNormalSplitModal(item, modal);
        }
        });
    }
    
    /**
     * Normal parçalama modal'ını açar
     * @param {Object} item - İş emri verisi
     * @param {HTMLElement} modal - Modal elementi
     */
    openNormalSplitModal(item, modal) {
        // Önce makine seçim alanını temizle (varsa)
        const existingMachineField = modal.querySelector('#machineSelectionField');
        if (existingMachineField) {
            existingMachineField.remove();
        }

        // Modal içeriğini güncelle
        const modalContent = modal.querySelector('.modal-body');
        if (modalContent) {
            // Orijinal içeriği kaydet (eğer henüz kaydedilmemişse)
            if (!modalContent.getAttribute('data-original-content')) {
                const originalHTML = modalContent.innerHTML;
                if (originalHTML.includes('planningForm') || originalHTML.includes('planning-tabs')) {
                    modalContent.setAttribute('data-original-content', originalHTML);
                }
            }
            
            // Split modal içeriğini ayarla
            modalContent.innerHTML = `
                <div class="form-group">
                    <label>İş Emri:</label>
                    <input type="text" value="${item.isemriNo} (${item.planMiktar} adet)" readonly>
                </div>
                <div class="form-group">
                    <label>Mevcut Tarih:</label>
                    <input type="text" value="${item.planlananTarih || 'Tarih Yok'}" readonly>
                </div>
                <div class="form-group">
                    <label>Bölünecek Miktar:</label>
                    <input type="number" id="splitMiktar" min="1" max="${item.planlananMiktar - 1}" value="1">
                </div>
                <div class="form-group">
                    <label>Yeni Tarih:</label>
                    <input type="date" id="yeniTarih" required>
                </div>
                <div class="form-group">
                    <label>Makine:</label>
                    <select id="splitMakine" style="padding: 10px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 14px; width: 100%;">
                        <option value="">Yükleniyor...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Sonuç:</label>
                    <div id="splitResult" class="split-result">
                        <div>• <span id="kalanMiktar">${item.planlananMiktar - 1}</span> adet → <span id="mevcutTarih">${item.planlananTarih || 'Tarih Yok'}</span> (mevcut tarih)</div>
                        <div>• <span id="bolunenMiktar">1</span> adet → <span id="yeniTarihDisplay">Yeni Tarih</span> (yeni tarih)</div>
                    </div>
                </div>
            `;
        }

        // Makine dropdown'ını doldur
        this.populateMachineDropdown(modal, item, 'splitMakine');

        // Modal butonunu güncelle (mutlaka modal-content içinde olsun)
        const modalContentContainer = modal.querySelector('.modal-content') || modal;
        let footer = modalContentContainer.querySelector('.modal-footer');
        if (!footer) {
            footer = document.createElement('div');
            footer.className = 'modal-footer';
            modalContentContainer.appendChild(footer);
        }
        footer.innerHTML = `
            <button type="button" class="btn-cancel-red" onclick="dataGrid.closeModal()">İptal</button>
            <button type="button" class="btn-split-green" onclick="dataGrid.submitSplit(window.dataGrid.selectedItem)">Parçala</button>
        `;

        // Modal'ı göster
        modal.style.display = 'block';
        
        // Event listener'ları ekle
        this.addSplitEventListeners(item);
    }
    
    /**
     * Parçalama modal'ı için event listener'ları ekler
     * @param {Object} item - İş emri verisi
     */
    addSplitEventListeners(item) {
        const splitMiktarInput = document.getElementById('splitMiktar');
        const yeniTarihInput = document.getElementById('yeniTarih');
        
        if (splitMiktarInput) {
            splitMiktarInput.addEventListener('input', () => {
                this.updateSplitResult(item);
            });
        }
        
        if (yeniTarihInput) {
            yeniTarihInput.addEventListener('change', () => {
                this.updateSplitResult(item);
            });
        }

        // İlk yükleme için sonuç alanını güncelle
        this.updateSplitResult(item);
        
        // Seçili item'ı sakla
        window.dataGrid.selectedItem = item;
    }
    
    /**
     * Parçalama için makine kontrolü yapar ve modal'ı açar
     * @param {Object} item - İş emri verisi
     * @param {HTMLElement} modal - Modal elementi
     */
    async checkMachineAndOpenSplitModal(item, modal) {
        // Makine dropdown'ını doldur (maça için alt makineler)
        await this.populateMachineDropdown(modal, item, 'splitMakine');
        
        try {
            const makineAdi = item.makAd || item.makinaAdi;
            
            if (!makineAdi) {
                this.openNormalSplitModal(item, modal);
                return;
            }
            
            // Sadece maça bölümü için makine kontrolü yap
            if (!this.isMacaBolumu({ bolumAdi: item.bolumAdi, makAd: makineAdi })) {
                this.openNormalSplitModal(item, modal);
                return;
            }
            
            // Makine tipini kontrol et
            const machineInfo = await window.planningApp.checkMachineType(makineAdi);
            
            if (machineInfo.isUpperMachine) {
                // Üst makine - alt makineleri göster
                await this.openUpperMachineSplitModal(item, modal, machineInfo);
            } else {
                // Normal makine
                this.openNormalSplitModal(item, modal);
            }
            
        } catch (error) {
            console.error('Makine kontrolü hatası:', error);
            // Hata durumunda normal modal'ı aç
            this.openNormalSplitModal(item, modal);
        }
    }
    
    /**
     * Üst makine için parçalama modal'ını açar
     * @param {Object} item - İş emri verisi
     * @param {HTMLElement} modal - Modal elementi
     * @param {Object} machineInfo - Makine bilgileri
     */
    async openUpperMachineSplitModal(item, modal, machineInfo) {
        // Alt makinelerin availability'sini kontrol et
        const availabilityData = await window.planningApp.checkMultipleMachineAvailability(
            machineInfo.subMachines.map(sub => sub.makAd)
        );
        
        // Default makineyi belirle (mevcut makine)
        const defaultMachine = item.selectedMachine || item.makAd;
        console.log('🎯 Parçalama için default makine belirlendi:', defaultMachine);
        
        // Modal içeriğini güncelle
        const modalContent = modal.querySelector('.modal-body');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="form-group">
                    <label>İş Emri:</label>
                    <input type="text" value="${item.isemriNo} (${item.planMiktar} adet)" readonly>
                </div>
                <div class="form-group">
                    <label>Mevcut Tarih:</label>
                    <input type="text" value="${item.planlananTarih || 'Tarih Yok'}" readonly>
                </div>
                <div class="form-group">
                    <label>Bölünecek Miktar:</label>
                    <input type="number" id="splitMiktar" min="1" max="${item.planlananMiktar - 1}" value="1">
                </div>
                <div class="form-group">
                    <label>Yeni Tarih:</label>
                    <input type="date" id="yeniTarih" required>
                </div>
                <div class="form-group">
                    <label>Makine:</label>
                    <select id="splitMakine" style="padding: 10px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 14px; width: 100%;">
                        <option value="">Yükleniyor...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Sonuç:</label>
                    <div id="splitResult" class="split-result">
                        <div>• <span id="kalanMiktar">${item.planlananMiktar - 1}</span> adet → <span id="mevcutTarih">${item.planlananTarih || 'Tarih Yok'}</span> (mevcut tarih)</div>
                        <div>• <span id="bolunenMiktar">1</span> adet → <span id="yeniTarihDisplay">Yeni Tarih</span> (yeni tarih)</div>
                    </div>
                </div>
            `;
        }
        
        // Alt makineleri dropdown olarak ekle (card yerine)
        const machines = machineInfo.subMachines.map(sub => sub.makAd);
        // defaultMachine zaten yukarıda tanımlanmış
        
        // splitMakine dropdown'ını doldur
        const splitMakine = modal.querySelector('#splitMakine');
        if (splitMakine) {
            splitMakine.innerHTML = '';
            machines.forEach(machine => {
                const option = document.createElement('option');
                option.value = machine;
                option.textContent = machine;
                if (machine === defaultMachine) {
                    option.selected = true;
                }
                splitMakine.appendChild(option);
            });
        }
        
        // Modal butonunu güncelle
        const modalContentContainer = modal.querySelector('.modal-content') || modal;
        let footer = modalContentContainer.querySelector('.modal-footer');
        if (!footer) {
            footer = document.createElement('div');
            footer.className = 'modal-footer';
            modalContentContainer.appendChild(footer);
        }
        footer.innerHTML = `
            <button type="button" class="btn-cancel-red" onclick="dataGrid.closeModal()">İptal</button>
            <button type="button" class="btn-primary" onclick="dataGrid.submitSplit(dataGrid.selectedItem)">Parçala</button>
        `;

        // Modal'ı göster
        modal.style.display = 'block';
        
        // Event listener'ları ekle
        this.addSplitEventListeners(item);
    }
    
    /**
     * Makine seçimi ile parçalama submit eder
     * @param {Object} item - İş emri verisi
     */
    async submitSplitWithMachineSelection(item) {
        // Radio button veya select'ten makine seçimini al
        const selectedMachineRadio = document.querySelector('input[name="selectedMachine"]:checked');
        const splitMakine = document.getElementById('splitMakine');
        const selectedMachine = selectedMachineRadio ? selectedMachineRadio.value : 
                               (splitMakine ? splitMakine.value : null);
        if (selectedMachine) {
            item.selectedMachine = selectedMachine;
            console.log('🎯 Parçalama için seçilen makine:', selectedMachine);
        }
        await this.submitSplit(item);
    }

    /**
     * Modal'ı kapatır
     */
    closeModal() {
        const modal = document.getElementById('planningModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Parçalama sonucunu günceller
     * @param {Object} item - Seçilen iş emri verisi
     */
    updateSplitResult(item) {
        const splitMiktarInput = document.getElementById('splitMiktar');
        const yeniTarihInput = document.getElementById('yeniTarih');
        
        if (!splitMiktarInput || !yeniTarihInput) return;
        
        const splitMiktar = parseInt(splitMiktarInput.value) || 0;
        const kalanMiktar = item.planlananMiktar - splitMiktar;
        const yeniTarih = yeniTarihInput.value;
        
        // Sonuç alanını güncelle
        const kalanMiktarSpan = document.getElementById('kalanMiktar');
        const bolunenMiktarSpan = document.getElementById('bolunenMiktar');
        const mevcutTarihSpan = document.getElementById('mevcutTarih');
        const yeniTarihDisplaySpan = document.getElementById('yeniTarihDisplay');
        
        if (kalanMiktarSpan) kalanMiktarSpan.textContent = kalanMiktar;
        if (bolunenMiktarSpan) bolunenMiktarSpan.textContent = splitMiktar;
        if (mevcutTarihSpan) mevcutTarihSpan.textContent = item.planlananTarih || 'Tarih Yok';
        if (yeniTarihDisplaySpan) yeniTarihDisplaySpan.textContent = yeniTarih || 'Yeni Tarih';
    }

    /**
     * İş emri parçalama işlemini gerçekleştirir
     * @param {Object} item - Seçilen iş emri verisi
     */
    async submitSplit(item = null) {
        // Eğer item parametresi yoksa, window'dan al
        if (!item) {
            item = window.dataGrid.selectedItem;
        }
        
        if (!item) {
            window.planningApp.showError('Seçili iş emri bulunamadı');
            return;
        }
        const splitMiktarInput = document.getElementById('splitMiktar');
        const yeniTarihInput = document.getElementById('yeniTarih');
        
        if (!splitMiktarInput || !yeniTarihInput) return;
        
        const splitMiktar = parseInt(splitMiktarInput.value);
        const yeniTarih = yeniTarihInput.value;
        
        if (!splitMiktar || splitMiktar <= 0) {
            window.planningApp.showWarning('Geçerli bir miktar giriniz');
            return;
        }
        
        if (!yeniTarih) {
            window.planningApp.showWarning('Yeni tarih seçiniz');
            return;
        }
        
        if (splitMiktar >= item.planlananMiktar) {
            window.planningApp.showWarning('Bölünecek miktar toplam miktardan küçük olmalı');
            return;
        }
        
        // planId kontrolü - breakdown'larda breakdownPlanId kullanılabilir
        let planId = item.planId;
        
        // ÖNEMLİ: "queue-" ile başlayan geçici planId'leri filtrele (kuyruk planlama için oluşturulan geçici ID'ler)
        if (planId && typeof planId === 'string' && planId.startsWith('queue-')) {
            console.log('Geçici planId tespit edildi, gerçek planId aranıyor:', planId);
            planId = null; // Geçici planId'yi temizle, gerçek planId'yi bul
        }
        
        if (!planId || planId === 'new' || planId === null || planId === undefined) {
            // Breakdown işleminde breakdownPlanId kullan
            if (item.breakdownPlanId && item.breakdownPlanId !== 'new' && 
                !(typeof item.breakdownPlanId === 'string' && item.breakdownPlanId.startsWith('queue-'))) {
                planId = item.breakdownPlanId;
            } else if (item.isemriParcaNo && item.breakdowns && Array.isArray(item.breakdowns)) {
                // Breakdown'larda breakdowns array'inden planId bul (geçici "queue-" ID'lerini hariç tut)
                const breakdown = item.breakdowns.find(brk => 
                    brk.parcaNo === item.isemriParcaNo && 
                    brk.planId && 
                    brk.planId !== 'new' &&
                    !(typeof brk.planId === 'string' && brk.planId.startsWith('queue-'))
                );
                if (breakdown && breakdown.planId) {
                    planId = breakdown.planId;
                }
            } else if (item.breakdowns && Array.isArray(item.breakdowns)) {
                // Ana kayıtta ilk planlı breakdown'ı bul (geçici "queue-" ID'lerini hariç tut)
                const plannedBreakdown = item.breakdowns.find(brk => 
                    brk.durum === 'Planlandı' && 
                    brk.planId && 
                    brk.planId !== 'new' &&
                    !(typeof brk.planId === 'string' && brk.planId.startsWith('queue-'))
                );
                if (plannedBreakdown && plannedBreakdown.planId) {
                    planId = plannedBreakdown.planId;
                }
            }
        }
        
        // planId'nin sayısal olduğundan emin ol (geçici "queue-" ID'leri reddet)
        if (!planId || planId === 'new' || planId === null || planId === undefined || 
            (typeof planId === 'string' && planId.startsWith('queue-'))) {
            window.planningApp.showError('Geçerli Plan ID bulunamadı. Bu kayıt kuyruk planlamadan geliyor olabilir veya henüz veritabanına kaydedilmemiş. Lütfen sayfayı yenileyip tekrar deneyin.');
            console.error('PlanId bulunamadı - parçalama için geçerli plan gerekli:', {
                item,
                planId: item.planId,
                breakdownPlanId: item.breakdownPlanId,
                breakdowns: item.breakdowns
            });
            return;
        }
        
        // planId'nin sayısal olduğundan emin ol
        const numericPlanId = Number(planId);
        if (isNaN(numericPlanId) || numericPlanId <= 0) {
            window.planningApp.showError(`Geçersiz planId değeri: "${planId}". Plan ID bir sayı olmalıdır. Lütfen sayfayı yenileyip tekrar deneyin.`);
            console.error('Geçersiz planId (sayı değil):', { planId, item });
            return;
        }
        
        // Makine seçimini al
        const splitMakine = document.getElementById('splitMakine');
        const machineSelection = document.getElementById('machineSelection');
        const selectedMachineRadio = document.querySelector('input[name="selectedMachine"]:checked');
        const selectedMachine = splitMakine ? splitMakine.value : 
                               (machineSelection ? machineSelection.value : 
                               (selectedMachineRadio ? selectedMachineRadio.value : null));
        
        try {
            console.log('İş emri parçalanıyor:', {
                planId: numericPlanId,
                planIdOriginal: planId,
                splitMiktar,
                yeniTarih,
                selectedMachine
            });
            
            const response = await fetch('/api/planning/split', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    planId: numericPlanId,
                    splitMiktar: splitMiktar,
                    yeniTarih: yeniTarih,
                    selectedMachine: selectedMachine || item.selectedMachine || item.makAd || null
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('İş emri başarıyla parçalandı:', result.data);
                
                // Modal'ı al (fonksiyonun başında bir kez tanımla, sonra tekrar kullan)
                const modal = document.getElementById('planningModal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Ultra hızlı güncelleme - parçalama işlemi için
                const currentFilters = this.preserveFilters();
                console.log('Filtreler korundu:', currentFilters);
                
                if (window.planningApp) {
                    console.log('Parçalama işlemi için ultra hızlı güncelleme...');
                    
                    // Backend'den dönen yeni plan ID'sini al
                    let newPlanId = null;
                    if (result.data?.newPlanId) {
                        // Oracle outBinds formatını kontrol et
                        if (result.data.newPlanId.outBinds && Array.isArray(result.data.newPlanId.outBinds)) {
                            newPlanId = result.data.newPlanId.outBinds[0];
                        } else if (typeof result.data.newPlanId === 'number') {
                            newPlanId = result.data.newPlanId;
                        } else if (typeof result.data.newPlanId === 'object' && result.data.newPlanId[0] !== undefined) {
                            newPlanId = result.data.newPlanId[0];
                        } else {
                            newPlanId = result.data.newPlanId;
                        }
                    }
                    
                    const nextParcaNo = result.data?.nextParcaNo || null;
                    
                    console.log('Parçalama için yeni plan ID:', newPlanId, 'Parça No:', nextParcaNo);
                    
                    // Parçalama sonrası kırılım verilerini güncelle (yeni planId ile)
                    const updatedPlanningData = this.updatePlanningDataForSplit(
                        item, 
                        splitMiktar, 
                        yeniTarih, 
                        newPlanId, 
                        nextParcaNo
                    );
                    
                    const updatedRecord = {
                        isemriId: item.isemriId,
                        planTarihi: item.planTarihi,
                        planlananMiktar: item.planlananMiktar, // Toplam miktar (iki breakdown'ın toplamı)
                        planId: planId, // Düzeltilmiş plan ID kullan
                        planningData: updatedPlanningData,
                        isBreakdown: false // Ana kayıt seviyesinde güncelleme
                    };
                    
                    console.log('Parçalama için ultra hızlı güncelleme kaydı:', updatedRecord);
                    await window.planningApp.ultraFastUpdate([updatedRecord]);
                    console.log('Ultra hızlı güncelleme tamamlandı');
                }
                
                // Not: restoreFilters() çağrısı kaldırıldı - ultraFastUpdate zaten chart'ları güncelliyor
                // restoreFilters() gereksiz chart güncellemesi yapıyordu ve UI thread'i bloke ediyordu
                
                // Modal'ı hemen kapat (animasyonları beklemeden)
                // Not: modal zaten yukarıda tanımlı, tekrar tanımlamaya gerek yok
                if (modal) {
                    modal.style.display = 'none';
                    // resetModalContent'ı async olarak yap (UI thread'i bloke etmemek için)
                    setTimeout(() => {
                        this.resetModalContent();
                    }, 0);
                }
                
                // Başarı mesajını async göster (UI thread'i bloke etmemek için)
                setTimeout(() => {
                    window.planningApp.showSuccess('İş emri başarıyla parçalandı!');
                }, 0);
            } else {
                console.error('Parçalama hatası:', result.message);
                window.planningApp.showError('Parçalama işlemi başarısız: ' + result.message);
            }
        } catch (error) {
            console.error('Parçalama işlemi hatası:', error);
            window.planningApp.showError('Parçalama işlemi sırasında hata oluştu');
        }
    }

    /**
     * Verileri yeniler (drag & drop sonrası)
     */
    async refreshData() {
        try {
            // Mevcut filtreleri koru
            const currentFilters = {
                searchTerm: this.searchTerm,
                statusFilter: this.statusFilter,
                machineFilter: this.machineFilter,
                departmentFilter: this.departmentFilter,
                dateRange: this.dateRange
            };

            // Sadece grid'i yenile, Oracle'dan veri çekme
            this.updateGrid();
            
            // Filtreleri geri yükle
            this.searchTerm = currentFilters.searchTerm;
            this.statusFilter = currentFilters.statusFilter;
            this.machineFilter = currentFilters.machineFilter;
            this.departmentFilter = currentFilters.departmentFilter;
            this.dateRange = currentFilters.dateRange;
            
        } catch (error) {
            console.error('Veri yenileme hatası:', error);
        }
    }

    /**
     * Oracle'dan verileri yeniden yükler
     */
    async refreshFromOracle() {
        try {
            if (window.planningApp && typeof window.planningApp.showSuccess === 'function') {
                window.planningApp.showSuccess('Veriler Oracle veritabanından yeniden yükleniyor...');
            }
            
            // PlanningApp'in refreshData fonksiyonunu çağır
            if (window.planningApp && typeof window.planningApp.refreshData === 'function') {
                await window.planningApp.refreshData(true);
                if (window.planningApp && typeof window.planningApp.showSuccess === 'function') {
                    window.planningApp.showSuccess('Veriler başarıyla yenilendi!');
                }
            } else {
                if (window.planningApp && typeof window.planningApp.showError === 'function') {
                    window.planningApp.showError('Veri yenileme servisi bulunamadı.');
                }
            }
        } catch (error) {
            console.error('Oracle veri yenileme hatası:', error);
            if (window.planningApp && typeof window.planningApp.showError === 'function') {
                window.planningApp.showError('Veri yenileme sırasında bir hata oluştu: ' + error.message);
            }
        }
    }

    /**
     * Belirli bir plan ID'nin plan tarihini cache'de günceller
     */
    updatePlanDateInCache(planId, newDate) {
        try {
            console.log('updatePlanDateInCache çağrıldı:', { planId, newDate });
            
            let updatedCount = 0;
            
            // Ana veri dizisinde ilgili kayıtları bul ve güncelle
            this.data.forEach(item => {
                if (item.planId == planId) {
                    item.planlananTarih = newDate;
                    updatedCount++;
                    console.log('Ana veri güncellendi:', item);
                    
                    // Kırılımları da güncelle
                    if (item.breakdowns && item.breakdowns.length > 0) {
                        item.breakdowns.forEach(breakdown => {
                            if (breakdown.planId == planId) {
                                breakdown.planTarihi = newDate; // planlananTarih değil, planTarihi
                                console.log('Kırılım güncellendi:', breakdown);
                            }
                        });
                    }
                }
            });

            // Filtrelenmiş veri dizisinde de güncelle
            this.filteredData.forEach(item => {
                if (item.planId == planId) {
                    item.planlananTarih = newDate;
                    
                    // Kırılımları da güncelle
                    if (item.breakdowns && item.breakdowns.length > 0) {
                        item.breakdowns.forEach(breakdown => {
                            if (breakdown.planId == planId) {
                                breakdown.planTarihi = newDate; // planlananTarih değil, planTarihi
                            }
                        });
                    }
                }
            });

            console.log(`Cache güncellendi: ${updatedCount} kayıt etkilendi`);

            // Grid'i yenile
            this.updateGrid();
            
        } catch (error) {
            console.error('Cache güncelleme hatası:', error);
        }
    }

    /**
     * Tüm aşamaların planlanmış olup olmadığını kontrol eder
     * Mevcut veriyi kullanarak tüm bölümlerdeki aşamaları kontrol eder
     * @param {Object} item - İş emri verisi
     * @returns {boolean} - Tüm aşamalar planlanmışsa true
     */
    checkAllStagesPlanned(item) {
        try {
            console.log('checkAllStagesPlanned çağrıldı:', {
                isemriNo: item.isemriNo,
                durum: item.durum
            });

            // Mevcut veriden aynı isemriNo'ya sahip tüm aşamaları bul
            const allStagesForThisOrder = this.data.filter(dataItem => 
                dataItem.isemriNo === item.isemriNo
            );

            console.log(`${item.isemriNo} için bulunan aşamalar:`, allStagesForThisOrder.map(s => ({
                isemriSira: s.isemriSira,
                bolumAdi: s.bolumAdi,
                durum: s.durum,
                planlananMiktar: s.planlananMiktar
            })));

            // Tüm aşamaların planlanmış olup olmadığını kontrol et
            const allStagesPlanned = allStagesForThisOrder.every(stage => {
                const isPlanned = stage.durum === 'Planlandı' && stage.planlananMiktar > 0;
                console.log(`Aşama ${stage.bolumAdi} (Sıra: ${stage.isemriSira}): ${stage.durum} -> ${isPlanned ? 'Planlı' : 'Beklemede'}`);
                return isPlanned;
            });

            console.log('Sonuç:', {
                totalStages: allStagesForThisOrder.length,
                allStagesPlanned,
                plannedStages: allStagesForThisOrder.filter(s => s.durum === 'Planlandı' && s.planlananMiktar > 0).length,
                waitingStages: allStagesForThisOrder.filter(s => s.durum !== 'Planlandı' || s.planlananMiktar === 0).length
            });

            return allStagesPlanned;
        } catch (error) {
            console.error('Tüm aşamalar kontrolü hatası:', error);
            return false;
        }
    }

    /**
     * Açıklama düzenleme fonksiyonu
     * @param {number} isemriId - İş emri ID
     * @param {string} currentAciklama - Mevcut açıklama
     */
    editAciklama(isemriId, currentAciklama) {
        // Modal'ı aç ve mevcut açıklamayı doldur
        const modal = document.getElementById('aciklamaEditModal');
        if (!modal) {
            window.planningApp?.showError('Açıklama düzenleme modalı bulunamadı');
            return;
        }
        
        const textarea = document.getElementById('aciklamaEditTextarea');
        if (textarea) {
            textarea.value = currentAciklama || '';
        }
        
        // İş emri ID'sini sakla (kaydetme için)
        this.editingAciklamaIsemriId = isemriId;
        
        // Modal'ı göster
        modal.style.display = 'block';
        
        // Textarea'ya focus ver
        if (textarea) {
            setTimeout(() => textarea.focus(), 100);
        }
    }

    /**
     * Açıklama kaydetme fonksiyonu
     */
    async saveAciklama() {
        const isemriId = this.editingAciklamaIsemriId;
        if (!isemriId) {
            window.planningApp?.showError('İş emri ID bulunamadı');
            return;
        }
        
        const textarea = document.getElementById('aciklamaEditTextarea');
        const newAciklama = textarea?.value || '';
        
        try {
            // İş emrinin plan ID'sini bul
            const item = window.planningApp?.data?.find(rec => rec.isemriId === isemriId);
            if (!item) {
                window.planningApp?.showError('İş emri bulunamadı');
                closeAciklamaEditModal();
                return;
            }
            
            // Planlanmış iş emri için plan ID bul
            let planId = item.planId;
            if (!planId && item.breakdowns && item.breakdowns.length > 0) {
                const plannedBreakdown = item.breakdowns.find(b => b.durum === 'Planlandı');
                if (plannedBreakdown) {
                    planId = plannedBreakdown.planId;
                }
            }
            
            if (!planId) {
                window.planningApp?.showWarning('Bu iş emri için plan bulunamadı. Önce planlama yapın.');
                closeAciklamaEditModal();
                return;
            }
            
            const response = await fetch('/api/planning/update-aciklama', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: planId,
                    aciklama: newAciklama
                })
            });
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Açıklama güncellenemedi');
            }
            
            // Cache'i güncelle
            if (window.planningApp && window.planningApp.data) {
                const dataItem = window.planningApp.data.find(rec => rec.isemriId === isemriId);
                if (dataItem) {
                    dataItem.aciklama = newAciklama;
                    if (dataItem.breakdowns) {
                        const breakdown = dataItem.breakdowns.find(b => b.planId === planId);
                        if (breakdown) {
                            breakdown.aciklama = newAciklama;
                        }
                    }
                }
            }
            
            // Tabloyu güncelle
            this.updateGridRows([isemriId]);
            
            // Modal'ı kapat
            closeAciklamaEditModal();
            
            window.planningApp?.showSuccess('Açıklama başarıyla güncellendi');
        } catch (error) {
            console.error('Açıklama güncelleme hatası:', error);
            window.planningApp?.showError('Açıklama güncellenirken hata oluştu: ' + error.message);
        }
    }
    
    /**
     * Sütun görünürlüğü ayarlarını localStorage'dan yükler
     */
    loadColumnVisibility() {
        const saved = localStorage.getItem('columnVisibility');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Sütun görünürlüğü ayarları yüklenirken hata:', e);
            }
        }
        // Varsayılan: Tüm sütunlar görünür
        return {
            'durum': true,
            'isemriNo': true,
            'malhizKodu': true,
            'imalatTuru': true,
            'tarih': true,
            'agirlik': true,
            'brutAgirlik': true,
            'toplamSure': true,
            'planMiktar': true,
            'gercekMiktar': true,
            'planlananMiktar': true,
            'planlananTarih': true,
            'onerilenTeslimTarih': true,
            'firmaAdi': true,
            'aciklama': true
        };
    }
    
    /**
     * Sütun görünürlüğü ayarlarını localStorage'a kaydeder
     */
    saveColumnVisibility() {
        try {
            localStorage.setItem('columnVisibility', JSON.stringify(this.columnVisibility));
        } catch (e) {
            console.error('Sütun görünürlüğü ayarları kaydedilirken hata:', e);
        }
    }
    
    /**
     * Sütun başlıklarına sağ tıklama event'lerini ekler
     */
    setupColumnVisibility() {
        const thead = this.container.querySelector('thead');
        if (!thead) return;
        
        const thElements = thead.querySelectorAll('th.sortable');
        thElements.forEach((th, index) => {
            th.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.openColumnVisibilityModal();
            });
        });
    }
    
    /**
     * Sütun görünürlüğü modal'ını açar
     */
    openColumnVisibilityModal() {
        const modal = document.getElementById('columnVisibilityModal');
        if (!modal) return;
        
        const listContainer = document.getElementById('columnVisibilityList');
        if (!listContainer) return;
        
        // Sütun listesini columnOrder sırasına göre oluştur
        const columnLabels = {
            'durum': 'Durum',
            'isemriNo': 'İş Emri No',
            'malhizKodu': 'Malzeme Kodu',
            'imalatTuru': 'Malzeme',
            'makAd': 'Makina Adı',
            'tarih': 'Sipariş Tarihi',
            'agirlik': 'Net Ağırlık',
            'brutAgirlik': 'Brüt Ağırlık',
            'toplamSure': 'Toplam Süre',
            'planMiktar': 'Sipariş Miktar (Kalıp)',
            'sevkMiktari': 'Sevk Miktarı',
            'bakiyeMiktar': 'Bakiye Miktar',
            'figurSayisi': 'Figür Sayısı',
            'siparisMiktarHesaplanan': 'Sipariş Miktar (Adet)',
            'gercekMiktar': 'Gerçekleşen Miktar',
            'planlananMiktar': 'Planlanan Miktar',
            'planlananTarih': 'Planlanan Tarih',
            'onerilenTeslimTarih': 'Önerilen Teslim',
            'firmaAdi': 'Firma',
            'aciklama': 'Açıklama'
        };
        
        const columns = this.columnOrder.map(key => ({
            key,
            label: columnLabels[key] || key
        }));
        
        listContainer.innerHTML = columns.map((col, index) => `
            <div class="column-item" data-column="${col.key}" draggable="true" 
                 style="padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center; cursor: move; background: white; transition: background-color 0.2s;">
                <span style="margin-right: 10px; color: #999; font-size: 14px; user-select: none;">☰</span>
                <input type="checkbox" id="col_${col.key}" data-column="${col.key}" 
                       ${this.columnVisibility[col.key] !== false ? 'checked' : ''} 
                       style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;"
                       onclick="event.stopPropagation();">
                <label for="col_${col.key}" style="cursor: pointer; flex: 1; user-select: none;">${col.label}</label>
            </div>
        `).join('');
        
        // Sürükle-bırak event'lerini ekle
        this.setupColumnDragDropInModal();
        
        modal.style.display = 'block';
    }
    
    /**
     * Modal içinde sütun sürükle-bırak özelliğini kurar
     */
    setupColumnDragDropInModal() {
        const listContainer = document.getElementById('columnVisibilityList');
        if (!listContainer) return;
        
        const columnItems = listContainer.querySelectorAll('.column-item');
        let draggedElement = null;
        
        columnItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedElement = item;
                item.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
            });
            
            item.addEventListener('dragend', (e) => {
                item.style.opacity = '';
                draggedElement = null;
                // Tüm item'ların border'larını temizle
                columnItems.forEach(i => {
                    i.style.borderTop = '';
                    i.style.borderBottom = '';
                    i.style.backgroundColor = '';
                });
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                if (draggedElement && item !== draggedElement) {
                    const rect = item.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    const mouseY = e.clientY;
                    
                    if (mouseY < midpoint) {
                        item.style.borderTop = '2px solid #2196F3';
                        item.style.borderBottom = '';
                        item.style.backgroundColor = '#e3f2fd';
                    } else {
                        item.style.borderBottom = '2px solid #2196F3';
                        item.style.borderTop = '';
                        item.style.backgroundColor = '#e3f2fd';
                    }
                }
            });
            
            item.addEventListener('dragleave', (e) => {
                item.style.borderTop = '';
                item.style.borderBottom = '';
                item.style.backgroundColor = '';
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (!draggedElement || item === draggedElement) return;
                
                const rect = item.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const mouseY = e.clientY;
                
                // Sıralamayı güncelle
                const draggedKey = draggedElement.getAttribute('data-column');
                const targetKey = item.getAttribute('data-column');
                
                const draggedIndex = this.columnOrder.indexOf(draggedKey);
                const targetIndex = this.columnOrder.indexOf(targetKey);
                
                if (draggedIndex !== -1 && targetIndex !== -1) {
                    // Sıralamayı güncelle
                    this.columnOrder.splice(draggedIndex, 1);
                    const newIndex = mouseY < midpoint ? targetIndex : targetIndex + 1;
                    this.columnOrder.splice(newIndex, 0, draggedKey);
                    
                    // Modal'ı yeniden oluştur
                    this.openColumnVisibilityModal();
                }
                
                // Border'ları temizle
                columnItems.forEach(i => {
                    i.style.borderTop = '';
                    i.style.borderBottom = '';
                    i.style.backgroundColor = '';
                });
            });
        });
    }
    
    /**
     * Tüm sütunları seçer
     */
    selectAllColumns() {
        const checkboxes = document.querySelectorAll('#columnVisibilityList input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
    }
    
    /**
     * Tüm sütunları kaldırır
     */
    deselectAllColumns() {
        const checkboxes = document.querySelectorAll('#columnVisibilityList input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
    }
    
    /**
     * Sütun görünürlüğü ayarlarını uygular
     */
    applyColumnVisibility() {
        // Checkbox'lardan görünürlük ayarlarını al
        const checkboxes = document.querySelectorAll('#columnVisibilityList input[type="checkbox"]');
        checkboxes.forEach(cb => {
            const columnKey = cb.getAttribute('data-column');
            this.columnVisibility[columnKey] = cb.checked;
        });
        
        // Sıralamayı kaydet (modal içinde sürükle-bırak ile değiştirilmiş olabilir)
        this.saveColumnOrder();
        
        // Ayarları kaydet
        this.saveColumnVisibility();
        
        // Tabloyu yeniden oluştur (satırlar columnOrder'a göre doğru sırada oluşturulacak)
        this.updateGrid();
        
        // Modal'ı kapat
        closeColumnVisibilityModal();
    }
    
    /**
     * Sütun görünürlüğü ayarlarını tabloya uygular
     */
    applyColumnVisibilitySettings() {
        const thead = this.container.querySelector('thead');
        const tbody = this.container.querySelector('tbody');
        if (!thead || !tbody) return;
        
        const thElements = thead.querySelectorAll('th');
        const trElements = tbody.querySelectorAll('tr');
        
        thElements.forEach((th) => {
            const columnKey = th.getAttribute('data-column');
            if (!columnKey) return;
            
            const isVisible = this.columnVisibility[columnKey] !== false; // Varsayılan true
            
            // Başlık görünürlüğü
            th.style.display = isVisible ? '' : 'none';
            
            // Satırlardaki hücrelerin görünürlüğü - data-column attribute'una göre
            trElements.forEach(tr => {
                const td = tr.querySelector(`td[data-column="${columnKey}"]`);
                if (td) {
                    td.style.display = isVisible ? '' : 'none';
                }
            });
        });
    }
    
    /**
     * Sütun sıralamasını localStorage'dan yükler
     */
    loadColumnOrder() {
        const defaultOrder = [
            'durum',
            'isemriNo',
            'malhizKodu',
            'imalatTuru',
            'makAd',
            'tarih',
            'agirlik',
            'brutAgirlik',
            'toplamSure',
            'planMiktar',
            'figurSayisi',
            'siparisMiktarHesaplanan',
            'sevkMiktari',
            'bakiyeMiktar',
            'gercekMiktar',
            'planlananMiktar',
            'planlananTarih',
            'onerilenTeslimTarih',
            'firmaAdi',
            'aciklama'
        ];
        
        const saved = localStorage.getItem('columnOrder');
        if (saved) {
            try {
                const loadedOrder = JSON.parse(saved);
                // Eğer figurSayisi eksikse veya yanlış yerdeyse, planMiktar'dan sonra taşı
                const figurSayisiIndex = loadedOrder.indexOf('figurSayisi');
                const planMiktarIndex = loadedOrder.indexOf('planMiktar');
                
                if (figurSayisiIndex === -1) {
                    // figurSayisi yoksa, planMiktar'dan sonra ekle
                    if (planMiktarIndex !== -1) {
                        loadedOrder.splice(planMiktarIndex + 1, 0, 'figurSayisi');
                    } else {
                        // planMiktar da yoksa, varsayılan konuma ekle
                        const defaultIndex = defaultOrder.indexOf('figurSayisi');
                        const insertAfter = defaultOrder[defaultIndex - 1];
                        const insertIndex = loadedOrder.indexOf(insertAfter);
                        if (insertIndex !== -1) {
                            loadedOrder.splice(insertIndex + 1, 0, 'figurSayisi');
                        } else {
                            loadedOrder.push('figurSayisi');
                        }
                    }
                    // Güncellenmiş sıralamayı kaydet
                    localStorage.setItem('columnOrder', JSON.stringify(loadedOrder));
                } else if (planMiktarIndex !== -1 && figurSayisiIndex !== planMiktarIndex + 1) {
                    // figurSayisi var ama planMiktar'ın hemen yanında değilse, taşı
                    loadedOrder.splice(figurSayisiIndex, 1); // Önce mevcut konumdan çıkar
                    const newPlanMiktarIndex = loadedOrder.indexOf('planMiktar');
                    if (newPlanMiktarIndex !== -1) {
                        loadedOrder.splice(newPlanMiktarIndex + 1, 0, 'figurSayisi');
                    } else {
                        // planMiktar silinmişse, varsayılan konuma ekle
                        const defaultIndex = defaultOrder.indexOf('figurSayisi');
                        const insertAfter = defaultOrder[defaultIndex - 1];
                        const insertIndex = loadedOrder.indexOf(insertAfter);
                        if (insertIndex !== -1) {
                            loadedOrder.splice(insertIndex + 1, 0, 'figurSayisi');
                        } else {
                            loadedOrder.push('figurSayisi');
                        }
                    }
                    // Güncellenmiş sıralamayı kaydet
                    localStorage.setItem('columnOrder', JSON.stringify(loadedOrder));
                }
                // Eğer siparisMiktarHesaplanan eksikse veya yanlış yerdeyse, figurSayisi'den sonra taşı
                const siparisMiktarHesaplananIndex = loadedOrder.indexOf('siparisMiktarHesaplanan');
                const finalFigurSayisiIndex = loadedOrder.indexOf('figurSayisi');
                
                if (siparisMiktarHesaplananIndex === -1) {
                    // siparisMiktarHesaplanan yoksa, figurSayisi'den sonra ekle
                    if (finalFigurSayisiIndex !== -1) {
                        loadedOrder.splice(finalFigurSayisiIndex + 1, 0, 'siparisMiktarHesaplanan');
                    } else {
                        // figurSayisi da yoksa, planMiktar'dan sonra ekle
                        if (planMiktarIndex !== -1) {
                            loadedOrder.splice(planMiktarIndex + 1, 0, 'siparisMiktarHesaplanan');
                        } else {
                            // planMiktar da yoksa, varsayılan konuma ekle
                            const defaultIndex = defaultOrder.indexOf('siparisMiktarHesaplanan');
                            const insertAfter = defaultOrder[defaultIndex - 1];
                            const insertIndex = loadedOrder.indexOf(insertAfter);
                            if (insertIndex !== -1) {
                                loadedOrder.splice(insertIndex + 1, 0, 'siparisMiktarHesaplanan');
                            } else {
                                loadedOrder.push('siparisMiktarHesaplanan');
                            }
                        }
                    }
                    // Güncellenmiş sıralamayı kaydet
                    localStorage.setItem('columnOrder', JSON.stringify(loadedOrder));
                } else if (finalFigurSayisiIndex !== -1 && siparisMiktarHesaplananIndex !== finalFigurSayisiIndex + 1) {
                    // siparisMiktarHesaplanan var ama figurSayisi'nin hemen yanında değilse, taşı
                    loadedOrder.splice(siparisMiktarHesaplananIndex, 1); // Önce mevcut konumdan çıkar
                    const updatedFigurSayisiIndex = loadedOrder.indexOf('figurSayisi');
                    if (updatedFigurSayisiIndex !== -1) {
                        loadedOrder.splice(updatedFigurSayisiIndex + 1, 0, 'siparisMiktarHesaplanan');
                    } else {
                        // figurSayisi silinmişse, varsayılan konuma ekle
                        const defaultIndex = defaultOrder.indexOf('siparisMiktarHesaplanan');
                        const insertAfter = defaultOrder[defaultIndex - 1];
                        const insertIndex = loadedOrder.indexOf(insertAfter);
                        if (insertIndex !== -1) {
                            loadedOrder.splice(insertIndex + 1, 0, 'siparisMiktarHesaplanan');
                        } else {
                            loadedOrder.push('siparisMiktarHesaplanan');
                        }
                    }
                    // Güncellenmiş sıralamayı kaydet
                    localStorage.setItem('columnOrder', JSON.stringify(loadedOrder));
                }
                // Eğer sevkMiktari eksikse veya yanlış yerdeyse, siparisMiktarHesaplanan'dan sonra taşı
                const sevkMiktariIndex = loadedOrder.indexOf('sevkMiktari');
                const newSiparisMiktarHesaplananIndex = loadedOrder.indexOf('siparisMiktarHesaplanan');
                
                if (sevkMiktariIndex === -1) {
                    // sevkMiktari yoksa, siparisMiktarHesaplanan'dan sonra ekle
                    if (newSiparisMiktarHesaplananIndex !== -1) {
                        loadedOrder.splice(newSiparisMiktarHesaplananIndex + 1, 0, 'sevkMiktari');
                    } else {
                        // siparisMiktarHesaplanan da yoksa, figurSayisi'den sonra ekle
                        if (finalFigurSayisiIndex !== -1) {
                            loadedOrder.splice(finalFigurSayisiIndex + 1, 0, 'sevkMiktari');
                        } else {
                            // figurSayisi da yoksa, planMiktar'dan sonra ekle
                            if (planMiktarIndex !== -1) {
                                loadedOrder.splice(planMiktarIndex + 1, 0, 'sevkMiktari');
                            } else {
                                // planMiktar da yoksa, varsayılan konuma ekle
                                const defaultIndex = defaultOrder.indexOf('sevkMiktari');
                                const insertAfter = defaultOrder[defaultIndex - 1];
                                const insertIndex = loadedOrder.indexOf(insertAfter);
                                if (insertIndex !== -1) {
                                    loadedOrder.splice(insertIndex + 1, 0, 'sevkMiktari');
                                } else {
                                    loadedOrder.push('sevkMiktari');
                                }
                            }
                        }
                    }
                    // Güncellenmiş sıralamayı kaydet
                    localStorage.setItem('columnOrder', JSON.stringify(loadedOrder));
                } else if (newSiparisMiktarHesaplananIndex !== -1 && sevkMiktariIndex !== newSiparisMiktarHesaplananIndex + 1) {
                    // sevkMiktari var ama siparisMiktarHesaplanan'ın hemen yanında değilse, taşı
                    loadedOrder.splice(sevkMiktariIndex, 1); // Önce mevcut konumdan çıkar
                    const updatedSiparisMiktarHesaplananIndex = loadedOrder.indexOf('siparisMiktarHesaplanan');
                    if (updatedSiparisMiktarHesaplananIndex !== -1) {
                        loadedOrder.splice(updatedSiparisMiktarHesaplananIndex + 1, 0, 'sevkMiktari');
                    } else {
                        // siparisMiktarHesaplanan silinmişse, varsayılan konuma ekle
                        const defaultIndex = defaultOrder.indexOf('sevkMiktari');
                        const insertAfter = defaultOrder[defaultIndex - 1];
                        const insertIndex = loadedOrder.indexOf(insertAfter);
                        if (insertIndex !== -1) {
                            loadedOrder.splice(insertIndex + 1, 0, 'sevkMiktari');
                        } else {
                            loadedOrder.push('sevkMiktari');
                        }
                    }
                    // Güncellenmiş sıralamayı kaydet
                    localStorage.setItem('columnOrder', JSON.stringify(loadedOrder));
                }
                // Eğer bakiyeMiktar eksikse veya yanlış yerdeyse, sevkMiktari'den sonra taşı
                const bakiyeMiktarIndex = loadedOrder.indexOf('bakiyeMiktar');
                const finalSevkMiktariIndex = loadedOrder.indexOf('sevkMiktari');
                
                if (bakiyeMiktarIndex === -1) {
                    // bakiyeMiktar yoksa, sevkMiktari'den sonra ekle
                    if (finalSevkMiktariIndex !== -1) {
                        loadedOrder.splice(finalSevkMiktariIndex + 1, 0, 'bakiyeMiktar');
                    } else {
                        // sevkMiktari da yoksa, siparisMiktarHesaplanan'dan sonra ekle
                        const siparisMiktarHesaplananIndex = loadedOrder.indexOf('siparisMiktarHesaplanan');
                        if (siparisMiktarHesaplananIndex !== -1) {
                            loadedOrder.splice(siparisMiktarHesaplananIndex + 1, 0, 'bakiyeMiktar');
                        } else {
                            // siparisMiktarHesaplanan da yoksa, varsayılan konuma ekle
                            const defaultIndex = defaultOrder.indexOf('bakiyeMiktar');
                            const insertAfter = defaultOrder[defaultIndex - 1];
                            const insertIndex = loadedOrder.indexOf(insertAfter);
                            if (insertIndex !== -1) {
                                loadedOrder.splice(insertIndex + 1, 0, 'bakiyeMiktar');
                            } else {
                                loadedOrder.push('bakiyeMiktar');
                            }
                        }
                    }
                    // Güncellenmiş sıralamayı kaydet
                    localStorage.setItem('columnOrder', JSON.stringify(loadedOrder));
                } else if (finalSevkMiktariIndex !== -1 && bakiyeMiktarIndex !== finalSevkMiktariIndex + 1) {
                    // bakiyeMiktar var ama sevkMiktari'nin hemen yanında değilse, taşı
                    loadedOrder.splice(bakiyeMiktarIndex, 1); // Önce mevcut konumdan çıkar
                    const updatedSevkMiktariIndex = loadedOrder.indexOf('sevkMiktari');
                    if (updatedSevkMiktariIndex !== -1) {
                        loadedOrder.splice(updatedSevkMiktariIndex + 1, 0, 'bakiyeMiktar');
                    } else {
                        // sevkMiktari silinmişse, varsayılan konuma ekle
                        const defaultIndex = defaultOrder.indexOf('bakiyeMiktar');
                        const insertAfter = defaultOrder[defaultIndex - 1];
                        const insertIndex = loadedOrder.indexOf(insertAfter);
                        if (insertIndex !== -1) {
                            loadedOrder.splice(insertIndex + 1, 0, 'bakiyeMiktar');
                        } else {
                            loadedOrder.push('bakiyeMiktar');
                        }
                    }
                    // Güncellenmiş sıralamayı kaydet
                    localStorage.setItem('columnOrder', JSON.stringify(loadedOrder));
                }
                return loadedOrder;
            } catch (e) {
                console.error('Sütun sıralaması yüklenirken hata:', e);
            }
        }
        // Varsayılan sıralama
        return defaultOrder;
    }
    
    /**
     * Sütun sıralamasını localStorage'a kaydeder
     */
    saveColumnOrder() {
        try {
            localStorage.setItem('columnOrder', JSON.stringify(this.columnOrder));
        } catch (e) {
            console.error('Sütun sıralaması kaydedilirken hata:', e);
        }
    }
    
    /**
     * Sütun başlıklarını sıralamaya göre yeniden düzenler
     */
    reorderTableHeaders() {
        const thead = this.container.querySelector('thead tr');
        if (!thead) return;
        
        // Mevcut th elementlerini topla
        const thMap = new Map();
        thead.querySelectorAll('th').forEach(th => {
            const columnKey = th.getAttribute('data-column');
            if (columnKey) {
                thMap.set(columnKey, th);
            }
        });
        
        // Sıralamaya göre th'leri yeniden ekle
        this.columnOrder.forEach(columnKey => {
            const th = thMap.get(columnKey);
            if (th) {
                thead.appendChild(th);
            }
        });
    }
    
    /**
     * Tüm td'lere data-column attribute'u ekler
     * Th'lerin DOM sırasına göre çalışır (reorderTableHeaders sonrası doğru sırada olmalı)
     */
    addDataColumnAttributes() {
        const thead = this.container.querySelector('thead tr');
        const tbody = this.container.querySelector('tbody');
        if (!thead || !tbody) return;
        
        // Th'leri DOM sırasına göre al (reorderTableHeaders sonrası doğru sırada olmalı)
        const thElements = Array.from(thead.querySelectorAll('th'));
        
        tbody.querySelectorAll('tr').forEach(tr => {
            const tdElements = Array.from(tr.querySelectorAll('td'));
            
            // Th'lerin DOM sırasına göre td'lere data-column ekle
            thElements.forEach((th, index) => {
                if (index < tdElements.length) {
                    const columnKey = th.getAttribute('data-column');
                    const td = tdElements[index];
                    if (td && columnKey) {
                        td.setAttribute('data-column', columnKey);
                    }
                }
            });
        });
    }
    
    /**
     * Sütun başlıklarını sıralamaya göre yeniden düzenler
     */
    reorderTableColumns() {
        const thead = this.container.querySelector('thead tr');
        const tbody = this.container.querySelector('tbody');
        if (!thead || !tbody) return;
        
        // Th'leri DOM sırasına göre al (reorderTableHeaders sonrası doğru sırada olmalı)
        const thElements = Array.from(thead.querySelectorAll('th'));
        
        // Tüm satırlardaki td'leri data-column'a göre yeniden sırala
        tbody.querySelectorAll('tr').forEach(tr => {
            const tdMap = new Map();
            tr.querySelectorAll('td').forEach(td => {
                const columnKey = td.getAttribute('data-column');
                if (columnKey) {
                    tdMap.set(columnKey, td);
                }
            });
            
            // Th'lerin DOM sırasına göre td'leri yeniden ekle
            thElements.forEach(th => {
                const columnKey = th.getAttribute('data-column');
                if (columnKey) {
                    const td = tdMap.get(columnKey);
                    if (td) {
                        tr.appendChild(td);
                    }
                }
            });
        });
    }
    
    /**
     * Sütun sürükle-bırak özelliğini kurar (KALDIRILDI - Artık modal içinde yapılıyor)
     * Bu fonksiyon artık kullanılmıyor, sadece geriye dönük uyumluluk için bırakıldı
     */
    setupColumnDragDrop() {
        // Sütun başlıklarındaki sürükle-bırak özelliği kaldırıldı
        // Artık sütun görünürlüğü modal'ında sürükle-bırak yapılıyor
        return;
    }
    
    /**
     * Chart tarih filtresinin aktif/pasif durumunu ayarlar
     * @param {boolean} enabled - Filtre aktif mi?
     */
    setChartDateFilterEnabled(enabled) {
        this.chartDateFilter.enabled = enabled;
        if (!enabled) {
            this.clearChartDateFilter();
        }
    }
    
    /**
     * Chart tarih filtresini temizler
     */
    clearChartDateFilter() {
        this.chartDateFilter.startDate = '';
        this.chartDateFilter.endDate = '';
        this.applyFilters();
    }
    
    /**
     * Hafta filtresini uygular
     * @param {string} week - Hafta string'i (örn: "2025-W47")
     */
    applyWeekFilter(week) {
        if (!this.chartDateFilter.enabled || !week) return;
        
        // Eğer bir gün seçiliyse, hafta filtresini uygulama (gün filtresi öncelikli)
        if (window.chartManager && 
            window.chartManager.selectedDayIndex !== undefined && 
            window.chartManager.selectedDayIndex !== -1) {
            console.log('applyWeekFilter: Gün seçili olduğu için hafta filtresi uygulanmıyor', {
                selectedDayIndex: window.chartManager.selectedDayIndex
            });
            return;
        }
        
        // ChartManager'dan hafta başlangıç ve bitiş tarihlerini al
        if (window.chartManager && typeof window.chartManager.getWeekStartDate === 'function') {
            const weekStartDate = window.chartManager.getWeekStartDate(week);
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekStartDate.getDate() + 6); // Haftanın son günü (Pazar)
            
            // Tarihleri YYYY-MM-DD formatına çevir
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            console.log('applyWeekFilter:', {
                week,
                weekStartDate: formatDate(weekStartDate),
                weekEndDate: formatDate(weekEndDate)
            });
            
            this.chartDateFilter.startDate = formatDate(weekStartDate);
            this.chartDateFilter.endDate = formatDate(weekEndDate);
            this.applyFilters();
        }
    }
    
    /**
     * Gün filtresini uygular
     * @param {number} dayIndex - Gün indeksi (0-6, Pazartesi'den başlar)
     * @param {string} week - Hafta string'i (örn: "2025-W47")
     */
    applyDayFilter(dayIndex, week) {
        if (!this.chartDateFilter.enabled || dayIndex === undefined || dayIndex < 0 || dayIndex > 6 || !week) {
            console.warn('applyDayFilter: Geçersiz parametreler', { dayIndex, week, enabled: this.chartDateFilter.enabled });
            return;
        }
        
        // ChartManager'dan hafta başlangıç tarihini al
        if (window.chartManager && typeof window.chartManager.getWeekStartDate === 'function') {
            const weekStartDate = window.chartManager.getWeekStartDate(week);
            if (!weekStartDate) {
                console.error('applyDayFilter: Hafta başlangıç tarihi alınamadı', week);
                return;
            }
            
            // Hafta başlangıç tarihini kopyala ve dayIndex gün ekle
            const dayDate = new Date(weekStartDate);
            dayDate.setDate(weekStartDate.getDate() + dayIndex);
            
            // Tarihi YYYY-MM-DD formatına çevir (timezone sorunlarını önlemek için)
            const year = dayDate.getFullYear();
            const month = String(dayDate.getMonth() + 1).padStart(2, '0');
            const day = String(dayDate.getDate()).padStart(2, '0');
            const dayDateStr = `${year}-${month}-${day}`;
            
            console.log('applyDayFilter: Gün filtresi uygulanıyor (hafta filtresini eziyor)', {
                dayIndex,
                week,
                weekStartDate: weekStartDate.toISOString().split('T')[0],
                dayDate: dayDateStr
            });
            
            // Gün filtresini uygula (hafta filtresini ezer)
            this.chartDateFilter.startDate = dayDateStr;
            this.chartDateFilter.endDate = dayDateStr; // Aynı gün
            this.applyFilters();
        } else {
            console.error('applyDayFilter: ChartManager veya getWeekStartDate bulunamadı');
        }
    }
    
    /**
     * Satır seçimini toggle eder
     * @param {number} isemriId - İş emri ID
     * @param {number|string|null} planId - Plan ID
     * @param {boolean} checked - Checkbox durumu
     */
    toggleRowSelection(isemriId, planId, checked) {
        // PlanId'yi normalize et (string veya number olabilir)
        let normalizedPlanId = planId;
        if (planId === 'null' || planId === null || planId === undefined || planId === '') {
            // PlanId yoksa, breakdown'lardan planId bul
            const item = this.filteredData.find(i => i.isemriId === isemriId);
            if (item && item.breakdowns && item.breakdowns.length > 0) {
                const plannedBreakdown = item.breakdowns.find(b => b.durum === 'Planlandı' && b.planId);
                if (plannedBreakdown) {
                    normalizedPlanId = plannedBreakdown.planId;
                }
            } else if (item && item.planId) {
                normalizedPlanId = item.planId;
            }
        }
        
        // PlanId'yi string'e çevir (Set karşılaştırması için)
        const planIdStr = normalizedPlanId ? String(normalizedPlanId) : null;
        
        if (!planIdStr) {
            window.planningApp?.showWarning('Bu satır için plan ID bulunamadı. Lütfen planlanmış bir kayıt seçin.');
            return;
        }
        
        if (checked) {
            this.selectedRows.add(planIdStr);
        } else {
            this.selectedRows.delete(planIdStr);
        }
        
        // Tümünü seç checkbox'ını güncelle
        this.updateSelectAllCheckbox();
    }
    
    /**
     * Tüm satırları seçer/seçimi kaldırır
     * @param {boolean} checked - Seçim durumu
     */
    toggleSelectAllRows(checked) {
        this.selectedRows.clear();
        
        if (checked) {
            // Tüm planlanmış ve planlanmamış satırları seç
            this.filteredData.forEach(item => {
                if (item.durum === 'Beklemede') {
                    // Planlanmamış işler için
                    const key = `unplanned_${item.isemriId}`;
                    this.selectedRows.add(key);
                } else {
                    // Planlanmış işler için
                    let planId = null;
                    if (item.breakdowns && item.breakdowns.length > 0) {
                        const plannedBreakdown = item.breakdowns.find(b => b.durum === 'Planlandı' && b.planId);
                        if (plannedBreakdown) {
                            planId = plannedBreakdown.planId;
                        }
                    } else if (item.planId) {
                        planId = item.planId;
                    }
                    
                    if (planId) {
                        // PlanId'yi string'e çevir
                        this.selectedRows.add(String(planId));
                    }
                }
            });
        }
        
        // Tüm checkbox'ları güncelle
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            const isUnplanned = checkbox.hasAttribute('data-unplanned');
            if (isUnplanned) {
                const isemriId = parseInt(checkbox.getAttribute('data-isemri-id'));
                const key = `unplanned_${isemriId}`;
                checkbox.checked = checked && this.selectedRows.has(key);
            } else {
                const planId = checkbox.getAttribute('data-plan-id');
                if (planId) {
                    checkbox.checked = checked && this.selectedRows.has(String(planId));
                }
            }
        });
    }
    
    /**
     * Tümünü seç checkbox'ını günceller
     */
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllRows');
        if (!selectAllCheckbox) return;
        
        // Tüm planlanmış planId'leri ve planlanmamış işleri topla
        const allSelectableIds = new Set();
        this.filteredData.forEach(item => {
            if (item.durum === 'Beklemede') {
                // Planlanmamış işler için
                allSelectableIds.add(`unplanned_${item.isemriId}`);
            } else {
                // Planlanmış işler için
                if (item.breakdowns && item.breakdowns.length > 0) {
                    item.breakdowns.forEach(b => {
                        if (b.durum === 'Planlandı' && b.planId) {
                            allSelectableIds.add(String(b.planId));
                        }
                    });
                } else if (item.planId) {
                    allSelectableIds.add(String(item.planId));
                }
            }
        });
        
        const totalSelectableIds = allSelectableIds.size;
        selectAllCheckbox.checked = totalSelectableIds > 0 && this.selectedRows.size === totalSelectableIds;
        selectAllCheckbox.indeterminate = this.selectedRows.size > 0 && this.selectedRows.size < totalSelectableIds;
    }
    
    /**
     * Seçili satırları taşıma dialog'unu gösterir
     */
    showMoveSelectedRowsDialog() {
        if (this.selectedRows.size === 0) {
            window.planningApp?.showWarning('Lütfen taşımak için en az bir satır seçin');
            return;
        }
        
        // Chart manager'daki modal'ı kullan
        if (window.chartManager && typeof window.chartManager.showMoveSelectedSegmentsDialog === 'function') {
            // Chart manager'ın selectedSegments'ini geçici olarak tablodaki seçimlerle değiştir
            // Chart manager number kullanıyor, biz string kullanıyoruz, dönüştür
            const originalSelectedSegments = new Set(window.chartManager.selectedSegments);
            const convertedSelectedSegments = new Set();
            this.selectedRows.forEach(planIdStr => {
                const planIdNum = parseInt(planIdStr);
                if (!isNaN(planIdNum)) {
                    convertedSelectedSegments.add(planIdNum);
                }
            });
            window.chartManager.selectedSegments = convertedSelectedSegments;
            
            // Modal'ı göster
            window.chartManager.showMoveSelectedSegmentsDialog();
            
            // Modal kapandığında orijinal seçimi geri yükle (ama taşıma işlemi yapıldıysa temizlenecek)
            const modal = document.getElementById('moveSelectedSegmentsModal');
            if (modal) {
                const restoreSelection = () => {
                    if (window.chartManager.selectedSegments.size === 0) {
                        // Taşıma yapıldı, seçimi temizle
                        this.selectedRows.clear();
                        this.updateSelectAllCheckbox();
                        document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
                    } else {
                        // İptal edildi, orijinal seçimi geri yükle
                        window.chartManager.selectedSegments = originalSelectedSegments;
                    }
                };
                
                // Modal kapanma event'lerini dinle
                const closeBtn = modal.querySelector('.close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', restoreSelection, { once: true });
                }
                
                // Modal dışına tıklandığında
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        restoreSelection();
                    }
                }, { once: true });
            }
        } else {
            window.planningApp?.showError('Chart manager bulunamadı');
        }
    }
    
    /**
     * Seçili satırları taşıma işlemini onaylar (Chart manager'dan çağrılır)
     */
    async confirmMoveSelectedRows(dateChanges, machineChanges = {}) {
        if (this.selectedRows.size === 0) {
            return;
        }
        
        // Chart manager'ın moveSelectedSegments fonksiyonunu kullan
        if (window.chartManager && typeof window.chartManager.moveSelectedSegments === 'function') {
            // Chart manager'ın selectedSegments'ini geçici olarak tablodaki seçimlerle değiştir
            // Chart manager number kullanıyor, biz string kullanıyoruz, dönüştür
            const originalSelectedSegments = new Set(window.chartManager.selectedSegments);
            const convertedSelectedSegments = new Set();
            this.selectedRows.forEach(planIdStr => {
                const planIdNum = parseInt(planIdStr);
                if (!isNaN(planIdNum)) {
                    convertedSelectedSegments.add(planIdNum);
                }
            });
            window.chartManager.selectedSegments = convertedSelectedSegments;
            
            try {
                await window.chartManager.moveSelectedSegments(dateChanges, machineChanges);
                
                // Başarılı olduysa seçimi temizle
                this.selectedRows.clear();
                this.updateSelectAllCheckbox();
                document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
                
                // Tabloyu yenile
                this.updateGrid();
            } catch (error) {
                console.error('Seçili satırları taşıma hatası:', error);
                // Hata durumunda orijinal seçimi geri yükle
                window.chartManager.selectedSegments = originalSelectedSegments;
            }
        }
    }
    
    /**
     * Planlanmamış satır seçimini toggle eder
     * @param {number} isemriId - İş emri ID
     * @param {boolean} checked - Checkbox durumu
     */
    toggleUnplannedRowSelection(isemriId, checked) {
        const key = `unplanned_${isemriId}`;
        if (checked) {
            this.selectedRows.add(key);
        } else {
            this.selectedRows.delete(key);
        }
        
        // Tümünü seç checkbox'ını güncelle
        this.updateSelectAllCheckbox();
    }
    
    /**
     * Toplu planlama dialog'unu gösterir (planlanmamış işler için)
     */
    showBulkPlanningDialog() {
        // Seçili planlanmamış işleri bul
        const unplannedItems = [];
        this.filteredData.forEach(item => {
            // Sadece "Beklemede" durumundaki işleri al
            if (item.durum === 'Beklemede') {
                // Checkbox ile seçilmiş mi kontrol et
                const key = `unplanned_${item.isemriId}`;
                if (this.selectedRows.has(key)) {
                    unplannedItems.push(item);
                }
            }
        });
        
        if (unplannedItems.length === 0) {
            window.planningApp?.showWarning('Lütfen planlanmamış (Beklemede) işlerden en az birini seçin');
            return;
        }
        
        const modal = document.getElementById('bulkPlanningModal');
        if (!modal) return;
        
        // Modal'ı göster
        modal.style.display = 'block';
        
        // Açıklama alanını temizle
        const aciklamaInput = document.getElementById('bulkPlanningAciklama');
        if (aciklamaInput) {
            aciklamaInput.value = '';
        }
        
        // Seçili işleri listele
        this.populateBulkPlanningList(unplannedItems);
        
        // Seçim sayısını güncelle
        const countSpan = document.getElementById('bulkPlanningCount');
        if (countSpan) {
            countSpan.textContent = unplannedItems.length;
        }
    }
    
    /**
     * Toplu planlama listesini doldurur
     * @param {Array} items - Planlanmamış işler
     */
    populateBulkPlanningList(items) {
        const ordersList = document.getElementById('bulkPlanningOrdersList');
        if (!ordersList) return;
        
        if (items.length === 0) {
            ordersList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">Seçili planlanmamış iş bulunamadı</p>';
            return;
        }
        
        let html = '<table style="width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px;">';
        html += '<thead><tr style="background: linear-gradient(135deg, #40916c 0%, #2d6a4f 100%); color: white; border-bottom: 2px solid #1a4d2e;">';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">İş Emri No</th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Malzeme</th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Malzeme Kodu</th>';
        html += '<th style="padding: 12px 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Firma</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Sipariş Miktar (Adet)</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Planlanan Tarih</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Makine</th>';
        html += '<th style="padding: 12px 15px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">Planlanan Miktar</th>';
        html += '</tr></thead><tbody>';
        
        // Bugünün tarihini varsayılan olarak kullan
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        items.forEach((item, index) => {
            const rowBgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            const siparisMiktar = item.siparisMiktarHesaplanan || 0;
            const waitingMiktar = item.breakdowns && item.breakdowns.length > 0
                ? item.breakdowns.find(b => b.durum === 'Beklemede')?.planlananMiktar || siparisMiktar
                : siparisMiktar;
            
            // Önerilen teslim tarihini varsayılan olarak kullan, yoksa bugünün tarihini kullan
            let defaultDate = todayStr;
            if (item.onerilenTeslimTarih) {
                try {
                    const teslimTarih = new Date(item.onerilenTeslimTarih);
                    defaultDate = teslimTarih.toISOString().split('T')[0];
                } catch (e) {
                    // Tarih parse edilemezse bugünün tarihini kullan
                }
            }
            
            html += `<tr style="background-color: ${rowBgColor}; border-bottom: 1px solid #e0e0e0;" data-isemri-id="${item.isemriId}">`;
            html += `<td style="padding: 12px 15px; color: #2d3748; font-size: 13px; vertical-align: middle; font-weight: 500;">${item.isemriNo || '-'}</td>`;
            html += `<td style="padding: 12px 15px; color: #4a5568; font-size: 13px; vertical-align: middle;">${item.imalatTuru || item.malhizAdi || '-'}</td>`;
            html += `<td style="padding: 12px 15px; color: #4a5568; font-size: 13px; vertical-align: middle;">${item.malhizKodu || '-'}</td>`;
            html += `<td style="padding: 12px 15px; color: #4a5568; font-size: 13px; vertical-align: middle;">${item.firmaAdi || '-'}</td>`;
            html += `<td style="padding: 12px 15px; text-align: center; color: #2d3748; font-size: 13px; vertical-align: middle;">${siparisMiktar}</td>`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <input type="date" 
                       class="bulk-planning-date-input" 
                       data-isemri-id="${item.isemriId}"
                       value="${defaultDate}" 
                       required
                       style="width: 150px; padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; color: #2d3748; font-family: inherit; transition: border-color 0.2s ease; box-sizing: border-box;"
                       onfocus="this.style.borderColor='#40916c'; this.style.boxShadow='0 0 0 3px rgba(64, 145, 108, 0.1)';" 
                       onblur="this.style.borderColor='#cbd5e0'; this.style.boxShadow='none';" />
            </td>`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <select class="bulk-planning-machine-input" 
                        data-isemri-id="${item.isemriId}"
                        data-bolum-adi="${item.bolumAdi || ''}"
                        data-mak-ad="${item.makAd || ''}"
                        style="width: 150px; padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; color: #2d3748; font-family: inherit; transition: border-color 0.2s ease; box-sizing: border-box;">
                    <option value="">Yükleniyor...</option>
                </select>
            </td>`;
            html += `<td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                <input type="number" 
                       class="bulk-planning-quantity-input" 
                       data-isemri-id="${item.isemriId}"
                       value="${waitingMiktar}" 
                       min="1"
                       max="${siparisMiktar}"
                       style="width: 90px; padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; color: #2d3748; font-family: inherit; text-align: center; transition: border-color 0.2s ease; box-sizing: border-box;"
                       onfocus="this.style.borderColor='#40916c'; this.style.boxShadow='0 0 0 3px rgba(64, 145, 108, 0.1)';" 
                       onblur="this.style.borderColor='#cbd5e0'; this.style.boxShadow='none';" />
            </td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        ordersList.innerHTML = html;
        
        // Makine dropdown'larını doldur
        this.populateBulkPlanningMachineDropdowns(items);
    }
    
    /**
     * Toplu planlama için makine dropdown'larını doldurur
     * @param {Array} items - İş emri listesi
     */
    async populateBulkPlanningMachineDropdowns(items) {
        const machineInputs = document.querySelectorAll('.bulk-planning-machine-input');
        
        for (const select of machineInputs) {
            const isemriId = parseInt(select.dataset.isemriId);
            const bolumAdi = select.dataset.bolumAdi || '';
            const makAd = select.dataset.makAd || '';
            
            // İlgili item'ı bul
            const item = items.find(i => i.isemriId === isemriId);
            if (!item) continue;
            
            try {
                // Maça bölümü kontrolü
                const isMaca = this.isMacaBolumu({ bolumAdi, makAd });
                
                let machines = [];
                
                if (isMaca && makAd) {
                    // Maça bölümü için alt makineleri al
                    const machineInfo = await window.planningApp.checkMachineType(makAd);
                    if (machineInfo && machineInfo.subMachines && machineInfo.subMachines.length > 0) {
                        machines = machineInfo.subMachines.map(sub => sub.makAd);
                    } else {
                        machines = [makAd]; // Alt makine yoksa kendisini göster
                    }
                } else if (bolumAdi) {
                    // Diğer bölümler için bölüm makinelerini al
                    machines = await this.getMachinesForBolum(bolumAdi);
                } else {
                    machines = [makAd].filter(Boolean); // Sadece mevcut makineyi göster
                }
                
                // Dropdown'ı doldur
                select.innerHTML = '';
                if (machines.length === 0) {
                    select.innerHTML = '<option value="">Makine bulunamadı</option>';
                } else {
                    // Default makineyi seç
                    const defaultMachine = item.selectedMachine || item.makAd || machines[0];
                    machines.forEach(machine => {
                        const isSelected = machine === defaultMachine;
                        select.innerHTML += `<option value="${machine}" ${isSelected ? 'selected' : ''}>${machine}</option>`;
                    });
                }
            } catch (error) {
                console.error(`Makine dropdown doldurma hatası (isemriId: ${isemriId}):`, error);
                select.innerHTML = '<option value="">Hata</option>';
            }
        }
    }
    
    /**
     * Toplu planlama işlemini onaylar
     */
    async confirmBulkPlanning() {
        const modal = document.getElementById('bulkPlanningModal');
        if (!modal) return;
        
        const aciklamaInput = document.getElementById('bulkPlanningAciklama');
        const aciklama = aciklamaInput ? aciklamaInput.value.trim() : '';
        
        // Seçili işlerin verilerini topla
        const ordersToPlan = [];
        const quantityInputs = modal.querySelectorAll('.bulk-planning-quantity-input');
        
        quantityInputs.forEach(input => {
            const isemriId = parseInt(input.dataset.isemriId);
            const planlananMiktar = parseInt(input.value) || 0;
            
            if (planlananMiktar > 0) {
                // İş emri bilgilerini bul
                const item = this.filteredData.find(i => i.isemriId === isemriId);
                if (item) {
                    // Her bir iş emri için tarih seçimini al
                    const dateInput = modal.querySelector(`.bulk-planning-date-input[data-isemri-id="${isemriId}"]`);
                    const planTarihi = dateInput && dateInput.value ? dateInput.value : null;
                    
                    if (!planTarihi) {
                        window.planningApp?.showWarning(`${item.isemriNo || isemriId} iş emri için planlanan tarih seçilmedi`);
                        return;
                    }
                    
                    // Makine seçimini al
                    const machineSelect = modal.querySelector(`.bulk-planning-machine-input[data-isemri-id="${isemriId}"]`);
                    const selectedMachine = machineSelect ? machineSelect.value : (item.selectedMachine || item.makAd || null);
                    
                    ordersToPlan.push({
                        isemriId: isemriId,
                        isemriNo: item.isemriNo,
                        planTarihi: planTarihi,
                        planlananMiktar: planlananMiktar,
                        selectedMachine: selectedMachine,
                        aciklama: aciklama || null
                    });
                }
            }
        });
        
        if (ordersToPlan.length === 0) {
            window.planningApp?.showWarning('Geçerli planlama verisi bulunamadı');
            return;
        }
        
        // Modal'ı kapat
        modal.style.display = 'none';
        
        // Planlama işlemini başlat
        window.planningApp.showLoading('İş emirleri planlanıyor...');
        
        try {
            const response = await fetch('/api/product-based-planning/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders: ordersToPlan })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Planlama yapılamadı');
            }
            
            // Başarı mesajı
            window.planningApp.showSuccess(`${result.message}`);
            
            // Seçimleri temizle (planlanmamış işler için de)
            this.selectedRows.clear();
            this.updateSelectAllCheckbox();
            document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
            
            // Verileri yenile
            await this.refreshFromOracle();
            
        } catch (error) {
            console.error('Toplu planlama hatası:', error);
            window.planningApp.showError('Toplu planlama hatası: ' + error.message);
        } finally {
            window.planningApp.hideLoading();
        }
    }
}
