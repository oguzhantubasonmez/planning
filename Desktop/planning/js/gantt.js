/**
 * Gantt Chart Yönetim Sınıfı
 * Profesyonel Gantt görünümü için yapı
 */
class GanttChart {
    constructor() {
        this.container = null;
        this.machineMapping = {};
        this.machineMappingLoaded = false;
        this.selectedDateRange = { start: null, end: null };
        this.selectedBolum = null;
        this.selectedMachines = [];
        this.planningData = []; // Planlı işler verisi
        this.viewType = 'daily'; // 'daily', 'weekly', 'monthly'
        this.viewRange = 1; // Görünüm aralığı çarpanı (default: 1)
        
        this.init();
    }

    /**
     * Gantt yapısını başlatır
     */
    async init() {
        try {
            console.log('🔧 Gantt init başlatılıyor...');
            
            // Makine mapping'ini yükle
            await this.loadMachineMapping();
            
            // Gantt container'ını oluştur
            this.createGanttContainer();
            
            // Container'ın DOM'a eklendiğinden emin ol
            if (!this.container || !document.body.contains(this.container)) {
                console.error('❌ Gantt container DOM\'a eklenemedi');
                return;
            }
            
            // Event listener'ları bağla
            this.bindEvents();
            
            console.log('✅ Gantt init tamamlandı');
        } catch (error) {
            console.error('❌ Gantt init hatası:', error);
            throw error;
        }
    }

    /**
     * Makine mapping'ini veritabanından yükler
     */
    async loadMachineMapping() {
        try {
            const response = await fetch('/api/machines/mapping');
            const result = await response.json();
            
            if (result.success && result.mapping) {
                this.machineMapping = result.mapping;
                this.machineMappingLoaded = true;
                console.log('✅ Gantt - Makine mapping yüklendi:', Object.keys(this.machineMapping).length, 'bölüm');
                
                // Detaylı veri kontrolü
                console.group('📊 Makine Mapping Detayları');
                Object.keys(this.machineMapping).sort().forEach(bolum => {
                    const bolumMapping = this.machineMapping[bolum];
                    const groups = Object.keys(bolumMapping);
                    console.log(`\n📁 Bölüm: "${bolum}"`);
                    console.log(`   Toplam grup sayısı: ${groups.length}`);
                    
                    groups.sort().forEach(ustMakine => {
                        const subMachines = bolumMapping[ustMakine] || [];
                        console.log(`   🔹 Grup: "${ustMakine}"`);
                        console.log(`      Alt makine sayısı: ${subMachines.length}`);
                        if (subMachines.length > 0) {
                            console.log(`      İlk 5 makine:`, subMachines.slice(0, 5));
                        } else {
                            console.warn(`      ⚠️ Bu grubun altında makine YOK!`);
                        }
                        
                        // "İşleme Grupları" özel kontrolü
                        if (ustMakine.includes('İşleme') || ustMakine.includes('işleme') || ustMakine.includes('İŞLEME')) {
                            console.group(`      🔴 İŞLEME GRUPLARI BULUNDU: "${ustMakine}"`);
                            console.log(`         Alt makine sayısı: ${subMachines.length}`);
                            console.log(`         Tüm makineler:`, subMachines);
                            console.groupEnd();
                        }
                    });
                });
                console.groupEnd();
            } else {
                console.warn('⚠️ Gantt - Makine mapping yüklenemedi');
                this.machineMapping = {};
            }
        } catch (error) {
            console.error('❌ Gantt - Makine mapping yükleme hatası:', error);
            this.machineMapping = {};
        }
    }

    /**
     * Gantt container'ını oluşturur
     */
    createGanttContainer() {
        try {
            // Eğer container zaten varsa, mevcut olanı kullan
            let ganttContainer = document.getElementById('gantt-container');
            
            if (!ganttContainer) {
                // Ana container
                ganttContainer = document.createElement('div');
                ganttContainer.id = 'gantt-container';
                ganttContainer.className = 'gantt-container';
                ganttContainer.style.display = 'none'; // Başlangıçta gizli
                
                // Header - Filtreler ve kapatma butonu
                const header = this.createHeader();
                ganttContainer.appendChild(header);
                
                // Ana içerik alanı
                const content = document.createElement('div');
                content.className = 'gantt-content';
                
                // Sol panel - Makine listesi
                const leftPanel = this.createMachinePanel();
                content.appendChild(leftPanel);
                
                // Sağ panel - Gantt chart alanı
                const rightPanel = this.createGanttPanel();
                content.appendChild(rightPanel);
                
                ganttContainer.appendChild(content);
                
                // Body'ye ekle (başlangıçta gizli)
                document.body.appendChild(ganttContainer);
                console.log('✅ Gantt container DOM\'a eklendi');
            } else {
                console.log('ℹ️ Gantt container zaten mevcut');
            }
            
            this.container = ganttContainer;
        } catch (error) {
            console.error('❌ Gantt container oluşturma hatası:', error);
            throw error;
        }
    }

    /**
     * Header bölümünü oluşturur (filtreler)
     */
    createHeader() {
        const header = document.createElement('div');
        header.className = 'gantt-header';
        
        // Sol taraf - Görünüm tipi ve Tarih aralığı filtresi
        const leftFilters = document.createElement('div');
        leftFilters.className = 'gantt-filters-left';
        
        // Görünüm tipi seçici
        const viewTypeLabel = document.createElement('label');
        viewTypeLabel.className = 'gantt-filter-label';
        viewTypeLabel.textContent = 'Görünüm:';
        
        const viewTypeSelect = document.createElement('select');
        viewTypeSelect.id = 'gantt-view-type';
        viewTypeSelect.className = 'gantt-select';
        viewTypeSelect.innerHTML = `
            <option value="daily">Günlük</option>
            <option value="weekly">Haftalık</option>
            <option value="monthly">Aylık</option>
        `;
        viewTypeSelect.value = this.viewType;
        
        // Görünüm aralığı kontrolü
        const viewRangeContainer = document.createElement('div');
        viewRangeContainer.className = 'gantt-view-range';
        viewRangeContainer.style.display = 'flex';
        viewRangeContainer.style.alignItems = 'center';
        viewRangeContainer.style.gap = '10px';
        viewRangeContainer.style.marginLeft = '10px';
        
        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'gantt-range-btn';
        decreaseBtn.textContent = '−';
        decreaseBtn.title = 'Aralığı Azalt';
        decreaseBtn.onclick = () => {
            if (this.viewRange > 1) {
                this.viewRange--;
                this.updateDateRangeByViewType();
                this.updateRangeDisplay();
                // Timeline'ı yeniden oluştur
                this.onFiltersChanged();
            }
        };
        
        const rangeDisplay = document.createElement('span');
        rangeDisplay.id = 'gantt-range-display';
        rangeDisplay.className = 'gantt-range-display';
        rangeDisplay.textContent = this.getRangeDisplayText();
        
        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'gantt-range-btn';
        increaseBtn.textContent = '+';
        increaseBtn.title = 'Aralığı Artır';
        increaseBtn.onclick = () => {
            this.viewRange++;
            this.updateDateRangeByViewType();
            this.updateRangeDisplay();
            // Timeline'ı yeniden oluştur
            this.onFiltersChanged();
        };
        
        viewRangeContainer.appendChild(decreaseBtn);
        viewRangeContainer.appendChild(rangeDisplay);
        viewRangeContainer.appendChild(increaseBtn);
        
        // Tarih aralığı filtresi
        const dateRangeLabel = document.createElement('label');
        dateRangeLabel.className = 'gantt-filter-label';
        dateRangeLabel.textContent = '📅 Tarih Aralığı:';
        
        const dateRangeContainer = document.createElement('div');
        dateRangeContainer.className = 'gantt-date-range';
        
        const startDateInput = document.createElement('input');
        startDateInput.type = 'date';
        startDateInput.id = 'gantt-start-date';
        startDateInput.className = 'gantt-date-input';
        
        // Varsayılan başlangıç tarihi: bugün
        const today = new Date();
        startDateInput.value = today.toISOString().split('T')[0];
        this.selectedDateRange.start = startDateInput.value;
        
        const dateSeparator = document.createElement('span');
        dateSeparator.className = 'gantt-date-separator';
        dateSeparator.textContent = '→';
        
        const endDateInput = document.createElement('input');
        endDateInput.type = 'date';
        endDateInput.id = 'gantt-end-date';
        endDateInput.className = 'gantt-date-input';
        
        // Varsayılan bitiş tarihi: görünüm tipine göre ayarla
        this.updateDateRangeByViewType();
        endDateInput.value = this.selectedDateRange.end;
        
        dateRangeContainer.appendChild(startDateInput);
        dateRangeContainer.appendChild(dateSeparator);
        dateRangeContainer.appendChild(endDateInput);
        
        leftFilters.appendChild(viewTypeLabel);
        leftFilters.appendChild(viewTypeSelect);
        leftFilters.appendChild(viewRangeContainer);
        leftFilters.appendChild(dateRangeLabel);
        leftFilters.appendChild(dateRangeContainer);
        
        // Sağ taraf - Bölüm filtresi ve kapatma butonu
        const rightFilters = document.createElement('div');
        rightFilters.className = 'gantt-filters-right';
        
        const bolumLabel = document.createElement('label');
        bolumLabel.className = 'gantt-filter-label';
        bolumLabel.textContent = '🏭 Bölüm:';
        
        const bolumSelect = document.createElement('select');
        bolumSelect.id = 'gantt-bolum-filter';
        bolumSelect.className = 'gantt-select';
        
        // Bölüm seçeneklerini ekle
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Tüm Bölümler';
        bolumSelect.appendChild(defaultOption);
        
        Object.keys(this.machineMapping).sort().forEach(bolum => {
            const option = document.createElement('option');
            option.value = bolum;
            option.textContent = bolum;
            bolumSelect.appendChild(option);
        });
        
        rightFilters.appendChild(bolumLabel);
        rightFilters.appendChild(bolumSelect);
        
        // Kapatma butonu
        const closeButton = document.createElement('button');
        closeButton.className = 'gantt-close-btn';
        closeButton.innerHTML = '✕';
        closeButton.title = 'Kapat';
        closeButton.onclick = () => this.hide();
        rightFilters.appendChild(closeButton);
        
        // Header'a ekle
        header.appendChild(leftFilters);
        header.appendChild(rightFilters);
        
        return header;
    }

    /**
     * Sol panel - Makine listesini oluşturur
     */
    createMachinePanel() {
        const panel = document.createElement('div');
        panel.className = 'gantt-machine-panel';
        
        const panelHeader = document.createElement('div');
        panelHeader.className = 'gantt-machine-panel-header';
        panelHeader.innerHTML = '<h3>⚙️ Makineler</h3>';
        
        const machineList = document.createElement('div');
        machineList.id = 'gantt-machine-list';
        machineList.className = 'gantt-machine-list';
        
        panel.appendChild(panelHeader);
        panel.appendChild(machineList);
        
        return panel;
    }

    /**
     * Sağ panel - Gantt chart alanını oluşturur
     */
    createGanttPanel() {
        const panel = document.createElement('div');
        panel.className = 'gantt-chart-panel';
        
        // Panel header - zaman çizelgesi buraya eklenecek
        const panelHeader = document.createElement('div');
        panelHeader.className = 'gantt-chart-panel-header';
        panelHeader.id = 'gantt-chart-panel-header';
        // Başlık kaldırıldı, zaman çizelgesi buraya eklenecek
        
        const chartArea = document.createElement('div');
        chartArea.id = 'gantt-chart-area';
        chartArea.className = 'gantt-chart-area';
        
        panel.appendChild(panelHeader);
        panel.appendChild(chartArea);
        
        return panel;
    }

    /**
     * Makine listesini günceller (bölüm filtresine göre) - Üst makineler başlık olarak
     */
    updateMachineList() {
        const machineList = document.getElementById('gantt-machine-list');
        if (!machineList) return;
        
        machineList.innerHTML = '';
        
        let rowIndex = 0;
        
        // Üst makineleri başlık olarak göster
        if (this.selectedBolum && this.machineMapping[this.selectedBolum]) {
            const bolumMapping = this.machineMapping[this.selectedBolum];
            console.log(`\n📋 Seçili bölüm: "${this.selectedBolum}"`);
            console.log(`   Toplam grup sayısı: ${Object.keys(bolumMapping).length}`);
            
            Object.keys(bolumMapping).sort().forEach(ustMakine => {
                const subMachines = bolumMapping[ustMakine] || [];
                console.log(`   🔹 Grup: "${ustMakine}" - Alt makine sayısı: ${subMachines.length}`);
                
                // "İşleme Grupları" özel kontrolü
                if (ustMakine.includes('İşleme') || ustMakine.includes('işleme') || ustMakine.includes('İŞLEME')) {
                    console.group(`   🔴 İŞLEME GRUPLARI İŞLENİYOR: "${ustMakine}"`);
                    console.log(`      Alt makine sayısı: ${subMachines.length}`);
                    console.log(`      Tüm makineler:`, subMachines);
                    console.groupEnd();
                }
                // Üst makine başlığı
                const headerItem = document.createElement('div');
                headerItem.className = 'gantt-machine-header';
                headerItem.dataset.upperMachine = ustMakine;
                headerItem.style.height = '60px';
                headerItem.style.minHeight = '60px';
                headerItem.style.display = 'flex';
                headerItem.style.alignItems = 'center';
                headerItem.style.borderBottom = '2px solid rgba(255, 255, 255, 0.3)';
                headerItem.style.padding = '10px';
                headerItem.style.boxSizing = 'border-box';
                headerItem.style.fontWeight = '700';
                headerItem.style.fontSize = '14px';
                headerItem.style.background = 'rgba(255, 255, 255, 0.1)';
                headerItem.innerHTML = `<span class="gantt-machine-header-label">${ustMakine}</span>`;
                machineList.appendChild(headerItem);
                rowIndex++;
                
                // Alt makineler (subMachines zaten yukarıda tanımlı)
                if (subMachines.length === 0) {
                    console.warn(`      ⚠️ "${ustMakine}" grubunun altında makine YOK!`);
                }
                subMachines.sort().forEach((subMachine, index) => {
                    const machineTrimmed = subMachine.trim();
                    
                    // İlk 3 makineyi logla
                    if (index < 3) {
                        console.log(`      ✅ Makine ekleniyor [${index + 1}/${subMachines.length}]: "${machineTrimmed}"`);
                    }
                    
                    const machineItem = document.createElement('div');
                    machineItem.className = 'gantt-machine-item';
                    machineItem.dataset.machine = machineTrimmed;
                    machineItem.dataset.upperMachine = ustMakine;
                    machineItem.dataset.index = rowIndex;
                    machineItem.style.height = '60px';
                    machineItem.style.minHeight = '60px';
                    machineItem.style.display = 'flex';
                    machineItem.style.alignItems = 'center';
                    machineItem.style.borderBottom = '2px solid rgba(255, 255, 255, 0.3)';
                    machineItem.style.padding = '10px';
                    machineItem.style.boxSizing = 'border-box';
                    machineItem.innerHTML = `
                        <input type="checkbox" class="gantt-machine-checkbox" id="machine-${machineTrimmed.replace(/\s+/g, '-')}">
                        <label for="machine-${machineTrimmed.replace(/\s+/g, '-')}" class="gantt-machine-label">${machineTrimmed}</label>
                    `;
                    machineList.appendChild(machineItem);
                    rowIndex++;
                });
                
                if (subMachines.length > 0) {
                    console.log(`      ✅ "${ustMakine}" grubuna ${subMachines.length} makine eklendi`);
                }
            });
        } else {
            // Tüm bölümlerin makinelerini topla
            console.log(`\n📋 Tüm bölümler gösteriliyor (${Object.keys(this.machineMapping).length} bölüm)`);
            Object.keys(this.machineMapping).sort().forEach(bolum => {
                const bolumMapping = this.machineMapping[bolum];
                console.log(`\n📁 Bölüm: "${bolum}" - ${Object.keys(bolumMapping).length} grup`);
                Object.keys(bolumMapping).sort().forEach(ustMakine => {
                    const subMachines = bolumMapping[ustMakine] || [];
                    
                    // "İşleme Grupları" özel kontrolü
                    if (ustMakine.includes('İşleme') || ustMakine.includes('işleme') || ustMakine.includes('İŞLEME')) {
                        console.group(`   🔴 İŞLEME GRUPLARI BULUNDU: "${ustMakine}"`);
                        console.log(`      Bölüm: "${bolum}"`);
                        console.log(`      Alt makine sayısı: ${subMachines.length}`);
                        if (subMachines.length > 0) {
                            console.log(`      İlk 10 makine:`, subMachines.slice(0, 10));
                        } else {
                            console.warn(`      ⚠️ Bu grubun altında makine YOK!`);
                        }
                        console.groupEnd();
                    }
                    
                    // Üst makine başlığı
                    const headerItem = document.createElement('div');
                    headerItem.className = 'gantt-machine-header';
                    headerItem.dataset.upperMachine = ustMakine;
                    headerItem.style.height = '60px';
                    headerItem.style.minHeight = '60px';
                    headerItem.style.display = 'flex';
                    headerItem.style.alignItems = 'center';
                    headerItem.style.borderBottom = '2px solid rgba(255, 255, 255, 0.3)';
                    headerItem.style.padding = '10px';
                    headerItem.style.boxSizing = 'border-box';
                    headerItem.style.fontWeight = '700';
                    headerItem.style.fontSize = '14px';
                    headerItem.style.background = 'rgba(255, 255, 255, 0.1)';
                    headerItem.innerHTML = `<span class="gantt-machine-header-label">${ustMakine}</span>`;
                    machineList.appendChild(headerItem);
                    rowIndex++;
                    
                    // Alt makineler
                    if (subMachines.length === 0) {
                        console.warn(`      ⚠️ "${ustMakine}" grubunun altında makine YOK!`);
                    }
                    subMachines.sort().forEach((subMachine, index) => {
                        const machineTrimmed = subMachine.trim();
                        
                        // İlk 3 makineyi logla
                        if (index < 3) {
                            console.log(`      ✅ Makine ekleniyor [${index + 1}/${subMachines.length}]: "${machineTrimmed}"`);
                        }
                        
                        const machineItem = document.createElement('div');
                        machineItem.className = 'gantt-machine-item';
                        machineItem.dataset.machine = machineTrimmed;
                        machineItem.dataset.upperMachine = ustMakine;
                        machineItem.dataset.index = rowIndex;
                        machineItem.style.height = '60px';
                        machineItem.style.minHeight = '60px';
                        machineItem.style.display = 'flex';
                        machineItem.style.alignItems = 'center';
                        machineItem.style.borderBottom = '2px solid rgba(255, 255, 255, 0.3)';
                        machineItem.style.padding = '10px';
                        machineItem.style.boxSizing = 'border-box';
                        machineItem.innerHTML = `
                            <input type="checkbox" class="gantt-machine-checkbox" id="machine-${machineTrimmed.replace(/\s+/g, '-')}">
                            <label for="machine-${machineTrimmed.replace(/\s+/g, '-')}" class="gantt-machine-label">${machineTrimmed}</label>
                        `;
                        machineList.appendChild(machineItem);
                        rowIndex++;
                    });
                    
                    if (subMachines.length > 0) {
                        console.log(`      ✅ "${ustMakine}" grubuna ${subMachines.length} makine eklendi`);
                    }
                });
            });
        }
        
        // Scroll'un düzgün çalışması için container'ı güncelle
        if (machineList) {
            // Scroll container'ın yüksekliğini zorla güncelle
            requestAnimationFrame(() => {
                // Scroll'un çalışması için içeriğin tam yüksekliğini kontrol et
                const scrollHeight = machineList.scrollHeight;
                const clientHeight = machineList.clientHeight;
                if (scrollHeight > clientHeight) {
                    // Scroll çalışıyor, her şey tamam
                    console.log(`✅ Makine listesi scroll hazır: ${scrollHeight}px içerik, ${clientHeight}px görünür`);
                } else {
                    console.log(`⚠️ Makine listesi scroll gerekmiyor: ${scrollHeight}px içerik, ${clientHeight}px görünür`);
                }
            });
        }
    }

    /**
     * Grid için gösterilecek makineleri döndürür (createGridRows ile aynı mantık)
     */
    getMachinesForGrid() {
        let machinesToShow = [];
        
        if (this.selectedMachines.length > 0) {
            machinesToShow = this.selectedMachines;
        } else {
            // Tüm makineleri topla
            if (this.selectedBolum && this.machineMapping[this.selectedBolum]) {
                const bolumMapping = this.machineMapping[this.selectedBolum];
                Object.keys(bolumMapping).sort().forEach(ustMakine => {
                    const subMachines = bolumMapping[ustMakine] || [];
                    machinesToShow.push(...subMachines.sort());
                });
            } else {
                // Tüm bölümlerin makinelerini topla
                Object.keys(this.machineMapping).sort().forEach(bolum => {
                    const bolumMapping = this.machineMapping[bolum];
                    Object.keys(bolumMapping).sort().forEach(ustMakine => {
                        const subMachines = bolumMapping[ustMakine] || [];
                        machinesToShow.push(...subMachines.sort());
                    });
                });
            }
        }
        
        return machinesToShow;
    }

    /**
     * Event listener'ları bağlar
     */
    bindEvents() {
        // Bölüm filtresi değiştiğinde
        const bolumFilter = document.getElementById('gantt-bolum-filter');
        if (bolumFilter) {
            bolumFilter.addEventListener('change', (e) => {
                this.selectedBolum = e.target.value || null;
                this.onBolumFilterChanged();
            });
        }
        
        // Görünüm tipi değiştiğinde
        const viewTypeSelect = document.getElementById('gantt-view-type');
        if (viewTypeSelect) {
            viewTypeSelect.addEventListener('change', (e) => {
                this.viewType = e.target.value;
                this.viewRange = 1; // Görünüm tipi değiştiğinde aralığı sıfırla
                this.updateDateRangeByViewType();
                this.updateRangeDisplay();
                this.onFiltersChanged();
            });
        }
        
        // Tarih aralığı değiştiğinde
        const startDate = document.getElementById('gantt-start-date');
        const endDate = document.getElementById('gantt-end-date');
        
        if (startDate) {
            startDate.addEventListener('change', () => {
                this.selectedDateRange.start = startDate.value;
                // Bitiş tarihi başlangıç tarihinden önceyse, bitiş tarihini güncelle
                if (this.selectedDateRange.end && startDate.value > this.selectedDateRange.end) {
                    this.updateDateRangeByViewType();
                    if (endDate) endDate.value = this.selectedDateRange.end;
                }
                this.onFiltersChanged();
            });
        }
        
        if (endDate) {
            endDate.addEventListener('change', () => {
                this.selectedDateRange.end = endDate.value;
                // Başlangıç tarihi bitiş tarihinden sonraysa, başlangıç tarihini güncelle
                if (this.selectedDateRange.start && endDate.value < this.selectedDateRange.start) {
                    startDate.value = endDate.value;
                    this.selectedDateRange.start = startDate.value;
                }
                this.onFiltersChanged();
            });
        }
        
        // Makine checkbox'ları için event delegation
        const machineList = document.getElementById('gantt-machine-list');
        if (machineList) {
            machineList.addEventListener('change', (e) => {
                if (e.target.classList.contains('gantt-machine-checkbox')) {
                    this.updateSelectedMachines();
                }
            });
            
            // Makine item'larına tıklama - grid satırını vurgula
            machineList.addEventListener('click', (e) => {
                const machineItem = e.target.closest('.gantt-machine-item');
                if (machineItem) {
                    const machine = machineItem.dataset.machine;
                    if (machine) {
                        this.highlightMachineRow(machine);
                    }
                }
            });
        }
        
        // Scroll senkronizasyonu
        this.setupScrollSync();
    }

    /**
     * Makine listesi ve grid alanı scroll senkronizasyonu (dikey ve yatay)
     */
    setupScrollSync() {
        const machineList = document.getElementById('gantt-machine-list');
        const timelineBody = document.getElementById('gantt-timeline-body');
        
        if (!machineList || !timelineBody) return;
        
        let isScrolling = false;
        
        // Makine listesi scroll olduğunda grid'i senkronize et (sadece dikey)
        machineList.addEventListener('scroll', () => {
            if (isScrolling) return;
            isScrolling = true;
            timelineBody.scrollTop = machineList.scrollTop;
            requestAnimationFrame(() => {
                isScrolling = false;
            });
        });
        
        // Grid scroll olduğunda makine listesini senkronize et (sadece dikey)
        timelineBody.addEventListener('scroll', () => {
            if (isScrolling) return;
            isScrolling = true;
            machineList.scrollTop = timelineBody.scrollTop;
            requestAnimationFrame(() => {
                isScrolling = false;
            });
        });
        
        // Yatay scroll senkronizasyonu ayrı fonksiyonda yapılıyor (setupHorizontalScrollSync)
    }

    /**
     * Timeline header ve body yatay scroll senkronizasyonu (ayrı fonksiyon)
     */
    setupHorizontalScrollSync() {
        const timelineBody = document.getElementById('gantt-timeline-body');
        const panelHeader = document.getElementById('gantt-chart-panel-header');
        
        if (!timelineBody || !panelHeader) {
            console.warn('⚠️ Scroll senkronizasyonu için elementler bulunamadı', {
                timelineBody: !!timelineBody,
                panelHeader: !!panelHeader
            });
            return;
        }
        
        console.log('🔍 Scroll senkronizasyonu elementleri:', {
            timelineBody: timelineBody,
            panelHeader: panelHeader,
            timelineBodyScrollWidth: timelineBody.scrollWidth,
            timelineBodyClientWidth: timelineBody.clientWidth,
            panelHeaderScrollWidth: panelHeader.scrollWidth,
            panelHeaderClientWidth: panelHeader.clientWidth
        });
        
        // Eğer zaten bağlanmışsa, önceki listener'ları kaldır
        if (this._horizontalScrollSyncBound) {
            if (this._headerScrollHandler) {
                panelHeader.removeEventListener('scroll', this._headerScrollHandler);
            }
            if (this._bodyScrollHandler) {
                timelineBody.removeEventListener('scroll', this._bodyScrollHandler);
            }
        }
        
        let isHeaderScrolling = false;
        let isBodyScrolling = false;
        
        // Header scroll handler - artık header scroll yapmıyor, sadece body scroll yapıyor
        // Ama header'ı body scroll'una göre kaydırmak için kullanıyoruz
        this._headerScrollHandler = () => {
            // Header scroll yapmıyor artık, bu handler kullanılmıyor
        };
        
        // Body scroll handler - body scroll olduğunda header'ı da kaydır
        this._bodyScrollHandler = () => {
            if (isHeaderScrolling) return;
            isBodyScrolling = true;
            const scrollLeft = timelineBody.scrollLeft;
            // Header'ı body scroll'una göre kaydır (transform ile)
            const timelineHeader = panelHeader.querySelector('.gantt-timeline-header');
            if (timelineHeader) {
                timelineHeader.style.transform = `translateX(-${scrollLeft}px)`;
                timelineHeader.style.willChange = 'transform'; // Performans için
            }
            // Panel header'ı da scroll yap (görünürlük için)
            if (panelHeader.scrollLeft !== scrollLeft) {
                panelHeader.scrollLeft = scrollLeft;
            }
            requestAnimationFrame(() => {
                isBodyScrolling = false;
            });
        };
        
        // Event listener'ları bağla - sadece body scroll için
        timelineBody.addEventListener('scroll', this._bodyScrollHandler, { passive: true });
        
        this._horizontalScrollSyncBound = true;
        console.log('✅ Yatay scroll senkronizasyonu bağlandı');
        
        // Test: Manuel scroll testi
        setTimeout(() => {
            console.log('🧪 Scroll test:', {
                panelHeaderScrollLeft: panelHeader.scrollLeft,
                timelineBodyScrollLeft: timelineBody.scrollLeft,
                panelHeaderScrollable: panelHeader.scrollWidth > panelHeader.clientWidth,
                timelineBodyScrollable: timelineBody.scrollWidth > timelineBody.clientWidth
            });
        }, 500);
    }

    /**
     * Responsive hücre genişliğini hesaplar - gün sayısından bağımsız tüm sayfaya yayılır
     */
    getCellWidth(periodCount) {
        const chartArea = document.getElementById('gantt-chart-area');
        const containerWidth = chartArea ? chartArea.clientWidth : window.innerWidth - 400; // Sol panel genişliği çıkar
        const minCellWidth = this.getMinCellWidth();
        
        // Tüm sayfaya yayılması için: container genişliğini period sayısına böl
        // Minimum genişlik sadece çok fazla gün olduğunda devreye girer
        const calculatedWidth = Math.max(minCellWidth, Math.floor(containerWidth / periodCount));
        
        console.log('📐 Responsive genişlik:', {
            periodCount,
            containerWidth,
            calculatedWidth,
            minCellWidth
        });
        
        return calculatedWidth;
    }

    /**
     * Minimum hücre genişliğini döndürür
     */
    getMinCellWidth() {
        return 60; // Minimum hücre genişliği (daha küçük - daha fazla gün için)
    }

    /**
     * Maksimum hücre genişliğini döndürür (artık kullanılmıyor - tüm sayfaya yayılıyor)
     */
    getMaxCellWidth() {
        return 9999; // Maksimum yok - tüm sayfaya yayılabilir
    }

    /**
     * Seçili makineleri günceller
     */
    updateSelectedMachines() {
        const checkboxes = document.querySelectorAll('.gantt-machine-checkbox:checked');
        this.selectedMachines = Array.from(checkboxes).map(cb => {
            const item = cb.closest('.gantt-machine-item');
            return item ? item.dataset.machine : null;
        }).filter(Boolean);
        
        console.log('Seçili makineler:', this.selectedMachines);
        
        // Makine seçimi değiştiğinde grid'i yeniden oluştur ve verileri yükle
        if (this.selectedDateRange.start && this.selectedDateRange.end) {
            this.createTimeline();
            this.loadPlanningData();
        }
    }

    /**
     * Filtreler değiştiğinde çağrılır
     */
    onFiltersChanged() {
        console.log('Filtreler güncellendi:', {
            dateRange: this.selectedDateRange,
            bolum: this.selectedBolum,
            machines: this.selectedMachines
        });
        
        // Tarih aralığı seçildiyse zaman çizelgesini oluştur
        if (this.selectedDateRange.start && this.selectedDateRange.end) {
            this.createTimeline();
            // Planlı işleri yükle ve grid'e yerleştir
            this.loadPlanningData();
        } else {
            // Tarih aralığı yoksa boş mesaj göster
            this.clearTimeline();
        }
    }

    /**
     * Bölüm filtresi değiştiğinde çağrılır
     */
    onBolumFilterChanged() {
        // Makine listesini güncelle
        this.updateMachineList();
        
        // Eğer tarih aralığı seçiliyse grid'i yeniden oluştur
        if (this.selectedDateRange.start && this.selectedDateRange.end) {
            this.createTimeline();
            // Planlı işleri yeniden yükle
            this.loadPlanningData();
        }
    }
    
    /**
     * Görünüm tipine göre tarih aralığını günceller
     */
    updateDateRangeByViewType() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startDateInput = document.getElementById('gantt-start-date');
        // Eğer başlangıç tarihi yoksa bugünü kullan
        if (!this.selectedDateRange.start) {
            this.selectedDateRange.start = today.toISOString().split('T')[0];
        }
        
        if (startDateInput) {
            startDateInput.value = this.selectedDateRange.start;
        }
        
        const startDate = new Date(this.selectedDateRange.start || today);
        const endDate = new Date(startDate);
        
        if (this.viewType === 'daily') {
            // Günlük: başlangıç tarihinden itibaren 7 gün * viewRange
            endDate.setDate(startDate.getDate() + (7 * this.viewRange) - 1);
        } else if (this.viewType === 'weekly') {
            // Haftalık: bu haftadan itibaren 4 hafta * viewRange
            // Haftanın başlangıcını bul (Pazartesi)
            const dayOfWeek = startDate.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const weekStart = new Date(startDate);
            weekStart.setDate(startDate.getDate() - diff);
            endDate.setTime(weekStart.getTime());
            endDate.setDate(weekStart.getDate() + (4 * 7 * this.viewRange) - 1);
        } else if (this.viewType === 'monthly') {
            // Aylık: bu aydan itibaren 4 ay * viewRange
            endDate.setMonth(startDate.getMonth() + (4 * this.viewRange));
            endDate.setDate(0); // Ayın son günü
        }
        
        this.selectedDateRange.end = endDate.toISOString().split('T')[0];
        
        const endDateInput = document.getElementById('gantt-end-date');
        if (endDateInput) {
            endDateInput.value = this.selectedDateRange.end;
        }
        
        // Tarih aralığı güncellendiğini logla
        console.log('📅 Tarih aralığı güncellendi:', {
            start: this.selectedDateRange.start,
            end: this.selectedDateRange.end,
            viewType: this.viewType,
            viewRange: this.viewRange
        });
    }
    
    /**
     * Aralık görüntüleme metnini döndürür
     */
    getRangeDisplayText() {
        if (this.viewType === 'daily') {
            return `${7 * this.viewRange} Gün`;
        } else if (this.viewType === 'weekly') {
            return `${4 * this.viewRange} Hafta`;
        } else if (this.viewType === 'monthly') {
            return `${4 * this.viewRange} Ay`;
        }
        return '';
    }
    
    /**
     * Aralık görüntüleme metnini günceller
     */
    updateRangeDisplay() {
        const rangeDisplay = document.getElementById('gantt-range-display');
        if (rangeDisplay) {
            rangeDisplay.textContent = this.getRangeDisplayText();
        }
    }
    
    /**
     * Tarih aralığına göre zaman çizelgesini oluşturur (görünüm tipine göre)
     */
    createTimeline() {
        const chartArea = document.getElementById('gantt-chart-area');
        const panelHeader = document.getElementById('gantt-chart-panel-header');
        
        if (!chartArea || !panelHeader) return;

        const startDate = new Date(this.selectedDateRange.start);
        const endDate = new Date(this.selectedDateRange.end);
        
        // Tarih aralığını kontrol et
        if (startDate > endDate) {
            panelHeader.innerHTML = '';
            chartArea.innerHTML = '<div class="gantt-error-message">⚠️ Başlangıç tarihi bitiş tarihinden sonra olamaz!</div>';
            return;
        }

        let periods = []; // Dönemler (günler, haftalar veya aylar)
        let periodCount = 0;
        
        // Görünüm tipine göre dönemleri hesapla
        if (this.viewType === 'daily') {
            // Günlük: Her gün bir dönem
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                periods.push({
                    start: new Date(currentDate),
                    end: new Date(currentDate),
                    type: 'day'
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            periodCount = periods.length;
        } else if (this.viewType === 'weekly') {
            // Haftalık: Her hafta bir dönem
            const currentDate = new Date(startDate);
            // Haftanın başlangıcını bul (Pazartesi)
            const dayOfWeek = currentDate.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            currentDate.setDate(currentDate.getDate() - diff);
            
            while (currentDate <= endDate) {
                const weekEnd = new Date(currentDate);
                weekEnd.setDate(currentDate.getDate() + 6);
                periods.push({
                    start: new Date(currentDate),
                    end: weekEnd > endDate ? endDate : weekEnd,
                    type: 'week'
                });
                currentDate.setDate(currentDate.getDate() + 7);
            }
            periodCount = periods.length;
        } else if (this.viewType === 'monthly') {
            // Aylık: Her ay bir dönem
            const currentDate = new Date(startDate);
            currentDate.setDate(1); // Ayın ilk günü
            
            while (currentDate <= endDate) {
                const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                const actualEnd = monthEnd > endDate ? endDate : monthEnd;
                periods.push({
                    start: new Date(currentDate),
                    end: actualEnd,
                    type: 'month'
                });
                currentDate.setMonth(currentDate.getMonth() + 1);
                currentDate.setDate(1);
            }
            periodCount = periods.length;
        }
        
        // Zaman çizelgesi header - Panel header'a ekle
        panelHeader.innerHTML = '';
        const timelineHeader = document.createElement('div');
        timelineHeader.className = 'gantt-timeline-header';
        
        // Bugünün tarihini al
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Responsive genişlik hesapla - container genişliğine göre
        const cellWidth = this.getCellWidth(periodCount);
        
        console.log('📐 Responsive genişlik hesaplaması:', {
            periodCount,
            cellWidth,
            minCellWidth: this.getMinCellWidth(),
            maxCellWidth: this.getMaxCellWidth()
        });
        
        // Her dönem için header sütunu
        periods.forEach((period, index) => {
            const periodHeader = document.createElement('div');
            periodHeader.className = 'gantt-timeline-day-header';
            periodHeader.dataset.periodIndex = index;
            periodHeader.dataset.periodStart = period.start.toISOString().split('T')[0];
            periodHeader.dataset.periodEnd = period.end.toISOString().split('T')[0];
            // Responsive genişlik kullan
            periodHeader.style.width = `${cellWidth}px`;
            periodHeader.style.minWidth = `${this.getMinCellWidth()}px`;
            periodHeader.style.flex = `0 0 ${cellWidth}px`; // Shrink ve grow yok, responsive genişlik
            
            // Bugün bu dönem içinde mi kontrol et
            const isTodayInPeriod = today >= period.start && today <= period.end;
            
            if (isTodayInPeriod) {
                periodHeader.classList.add('gantt-timeline-day-today');
            }
            
            let headerContent = '';
            if (this.viewType === 'daily') {
                const dayName = period.start.toLocaleDateString('tr-TR', { weekday: 'short' });
                const dayNumber = period.start.getDate();
                const monthName = period.start.toLocaleDateString('tr-TR', { month: 'short' });
                headerContent = `
                    <div class="gantt-timeline-day-name">${dayName}</div>
                    <div class="gantt-timeline-day-number">${dayNumber}</div>
                    <div class="gantt-timeline-day-month">${monthName}</div>
                    ${isTodayInPeriod ? '<div class="gantt-timeline-day-today-badge">Bugün</div>' : ''}
                `;
            } else if (this.viewType === 'weekly') {
                const weekStart = period.start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                const weekEnd = period.end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                headerContent = `
                    <div class="gantt-timeline-day-name">Hafta</div>
                    <div class="gantt-timeline-day-number">${weekStart} - ${weekEnd}</div>
                    ${isTodayInPeriod ? '<div class="gantt-timeline-day-today-badge">Bugün</div>' : ''}
                `;
            } else if (this.viewType === 'monthly') {
                const monthName = period.start.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                headerContent = `
                    <div class="gantt-timeline-day-name">${monthName}</div>
                    ${isTodayInPeriod ? '<div class="gantt-timeline-day-today-badge">Bugün</div>' : ''}
                `;
            }
            
            periodHeader.innerHTML = headerContent;
            timelineHeader.appendChild(periodHeader);
        });
        
        // Zaman çizelgesi body (makine satırları için hazır)
        const timelineBody = document.createElement('div');
        timelineBody.className = 'gantt-timeline-body';
        timelineBody.id = 'gantt-timeline-body';
        
        // Grid yapısını oluştur - önce makine satırlarını oluştur
        this.createGridRows(timelineBody, periods, periodCount);
        
        // Header'ı panel header'a ekle
        panelHeader.appendChild(timelineHeader);
        
        // Zaman çizelgesi container'ı
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'gantt-timeline-container';
        
        timelineContainer.appendChild(timelineBody);
        
        chartArea.innerHTML = '';
        chartArea.appendChild(timelineContainer);
        
        // Scroll senkronizasyonunu yeniden bağla (timeline body oluşturulduktan sonra)
        setTimeout(() => {
            this.setupScrollSync();
            // Yatay scroll senkronizasyonunu manuel olarak bağla
            this.setupHorizontalScrollSync();
        }, 300);
        
        // Ek kontrol - DOM tamamen render edildikten sonra
        setTimeout(() => {
            const timelineBody = document.getElementById('gantt-timeline-body');
            const panelHeader = document.getElementById('gantt-chart-panel-header');
            if (timelineBody && panelHeader) {
                console.log('🔍 Final scroll kontrolü:', {
                    timelineBodyExists: !!timelineBody,
                    panelHeaderExists: !!panelHeader,
                    timelineBodyScrollWidth: timelineBody.scrollWidth,
                    timelineBodyClientWidth: timelineBody.clientWidth,
                    panelHeaderScrollWidth: panelHeader.scrollWidth,
                    panelHeaderClientWidth: panelHeader.clientWidth
                });
            }
        }, 1000);
        
        console.log(`✅ Zaman çizelgesi oluşturuldu: ${periodCount} ${this.viewType === 'daily' ? 'gün' : this.viewType === 'weekly' ? 'hafta' : 'ay'}`);
        
        // Verileri yükle
        this.loadPlanningData();
    }

    /**
     * Grid satırlarını oluşturur (üst makineler başlık, alt makineler normal satır)
     * @param {Array} periods - Dönemler (günler, haftalar veya aylar)
     * @param {Number} periodCount - Dönem sayısı
     */
    createGridRows(timelineBody, periods, periodCount) {
        timelineBody.innerHTML = '';
        
        // Hücre genişliğini hesapla (tüm satırlar için aynı)
        const cellWidth = this.getCellWidth(periodCount);
        const totalRowWidth = cellWidth * periodCount; // Tüm satırın toplam genişliği
        
        // Üst makineleri başlık olarak, alt makineleri normal satır olarak oluştur
        if (this.selectedBolum && this.machineMapping[this.selectedBolum]) {
            const bolumMapping = this.machineMapping[this.selectedBolum];
            Object.keys(bolumMapping).sort().forEach(ustMakine => {
                // Üst makine başlık satırı
                const headerRow = document.createElement('div');
                headerRow.className = 'gantt-machine-row gantt-machine-header-row';
                headerRow.dataset.upperMachine = ustMakine;
                headerRow.style.display = 'flex';
                headerRow.style.height = '60px';
                headerRow.style.minHeight = '60px';
                headerRow.style.width = `${totalRowWidth}px`; // Tüm timeline genişliği
                headerRow.style.minWidth = `${totalRowWidth}px`; // Tüm timeline genişliği
                headerRow.style.borderBottom = '3px solid #4a5568'; // Daha belirgin başlık çizgisi
                headerRow.style.borderTop = '2px solid #3d4153';
                headerRow.style.background = 'rgba(255, 255, 255, 0.1)';
                headerRow.style.fontWeight = '700';
                headerRow.style.fontSize = '14px';
                
                // Başlık için hücre (tüm genişliği kaplar)
                const headerCell = document.createElement('div');
                headerCell.className = 'gantt-day-cell gantt-header-cell';
                headerCell.style.width = `${totalRowWidth}px`; // Tüm timeline genişliği
                headerCell.style.minWidth = `${totalRowWidth}px`;
                headerCell.style.flex = `0 0 ${totalRowWidth}px`; // Sabit genişlik
                headerCell.style.display = 'flex';
                headerCell.style.alignItems = 'center';
                headerCell.style.justifyContent = 'center';
                headerCell.style.padding = '10px';
                headerCell.style.boxSizing = 'border-box';
                headerCell.innerHTML = `<span>${ustMakine}</span>`;
                headerRow.appendChild(headerCell);
                
                timelineBody.appendChild(headerRow);
                
                // Alt makineler için normal satırlar
                const subMachines = bolumMapping[ustMakine] || [];
                subMachines.sort().forEach((subMachine) => {
                    const machineTrimmed = subMachine.trim();
                    const machineNormalized = this.normalizeMachineName(machineTrimmed);
                    const machineRow = document.createElement('div');
                    machineRow.className = 'gantt-machine-row';
                    machineRow.dataset.machine = machineNormalized;
                    machineRow.dataset.machineOriginal = machineTrimmed;
                    machineRow.dataset.upperMachine = ustMakine;
                    machineRow.style.display = 'flex';
                    machineRow.style.height = '60px';
                    machineRow.style.minHeight = '60px';
                    machineRow.style.width = 'max-content'; // İçeriğin tamamını göster - scroll için gerekli
                    machineRow.style.minWidth = 'max-content'; // İçeriğin tamamını göster
                    machineRow.style.borderBottom = '2px solid #3d4153'; // Daha belirgin yatay grid çizgisi
                    machineRow.style.borderTop = '1px solid #2d3142';
                    
                    // Her dönem için bir hücre oluştur
                    periods.forEach((period, periodIndex) => {
                        const periodStartStr = period.start.toISOString().split('T')[0];
                        const periodEndStr = period.end.toISOString().split('T')[0];
                        const periodCell = document.createElement('div');
                        periodCell.className = 'gantt-day-cell';
                        periodCell.dataset.periodIndex = periodIndex;
                        periodCell.dataset.periodStart = periodStartStr;
                        periodCell.dataset.periodEnd = periodEndStr;
                        periodCell.dataset.machine = machineNormalized;
                        periodCell.dataset.machineOriginal = machineTrimmed; // Orijinal makine adını sakla
                        // Responsive genişlik kullan (header ile aynı)
                        const cellWidth = this.getCellWidth(periodCount);
                        periodCell.style.width = `${cellWidth}px`;
                        periodCell.style.minWidth = `${this.getMinCellWidth()}px`;
                        periodCell.style.flex = `0 0 ${cellWidth}px`; // Shrink ve grow yok, responsive genişlik
                        
                        // Bugün bu dönem içinde mi kontrol et
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (today >= period.start && today <= period.end) {
                            periodCell.classList.add('gantt-timeline-day-column-today');
                        }
                        
                        // Drop zone özelliği ekle
                        this.setupCellDropZone(periodCell);
                        
                        machineRow.appendChild(periodCell);
                    });
                    
                    timelineBody.appendChild(machineRow);
                });
            });
        } else {
            // Tüm bölümlerin makinelerini topla
            // Hücre genişliğini hesapla (tüm satırlar için aynı)
            const cellWidth = this.getCellWidth(periodCount);
            const totalRowWidth = cellWidth * periodCount; // Tüm satırın toplam genişliği
            
            Object.keys(this.machineMapping).sort().forEach(bolum => {
                const bolumMapping = this.machineMapping[bolum];
                Object.keys(bolumMapping).sort().forEach(ustMakine => {
                    // Üst makine başlık satırı
                    const headerRow = document.createElement('div');
                    headerRow.className = 'gantt-machine-row gantt-machine-header-row';
                    headerRow.dataset.upperMachine = ustMakine;
                    headerRow.style.display = 'flex';
                    headerRow.style.height = '60px';
                    headerRow.style.minHeight = '60px';
                    headerRow.style.width = `${totalRowWidth}px`; // Tüm timeline genişliği
                    headerRow.style.minWidth = `${totalRowWidth}px`; // Tüm timeline genişliği
                    headerRow.style.borderBottom = '3px solid #4a5568'; // Daha belirgin başlık çizgisi
                    headerRow.style.borderTop = '2px solid #3d4153';
                    headerRow.style.background = 'rgba(255, 255, 255, 0.1)';
                    headerRow.style.fontWeight = '700';
                    headerRow.style.fontSize = '14px';
                    
                    // Başlık için hücre (tüm genişliği kaplar)
                    const headerCell = document.createElement('div');
                    headerCell.className = 'gantt-day-cell gantt-header-cell';
                    headerCell.style.width = `${totalRowWidth}px`; // Tüm timeline genişliği
                    headerCell.style.minWidth = `${totalRowWidth}px`;
                    headerCell.style.flex = `0 0 ${totalRowWidth}px`; // Sabit genişlik
                    headerCell.style.display = 'flex';
                    headerCell.style.alignItems = 'center';
                    headerCell.style.justifyContent = 'center';
                    headerCell.style.padding = '10px';
                    headerCell.style.boxSizing = 'border-box';
                    headerCell.innerHTML = `<span>${ustMakine}</span>`;
                    headerRow.appendChild(headerCell);
                    
                    timelineBody.appendChild(headerRow);
                    
                    // Alt makineler için normal satırlar
                    const subMachines = bolumMapping[ustMakine] || [];
                    subMachines.sort().forEach((subMachine) => {
                        const machineTrimmed = subMachine.trim();
                        const machineNormalized = this.normalizeMachineName(machineTrimmed);
                        const machineRow = document.createElement('div');
                        machineRow.className = 'gantt-machine-row';
                        machineRow.dataset.machine = machineNormalized;
                        machineRow.dataset.machineOriginal = machineTrimmed;
                        machineRow.dataset.upperMachine = ustMakine;
                        machineRow.style.display = 'flex';
                        machineRow.style.height = '60px';
                        machineRow.style.minHeight = '60px';
                        machineRow.style.width = 'max-content'; // İçeriğin tamamını göster - scroll için gerekli
                        machineRow.style.minWidth = 'max-content'; // İçeriğin tamamını göster
                        machineRow.style.borderBottom = '2px solid #3d4153'; // Daha belirgin yatay grid çizgisi
                        machineRow.style.borderTop = '1px solid #2d3142';
                        
                        // Her dönem için bir hücre oluştur
                        periods.forEach((period, periodIndex) => {
                            const periodStartStr = period.start.toISOString().split('T')[0];
                            const periodEndStr = period.end.toISOString().split('T')[0];
                        const periodCell = document.createElement('div');
                        periodCell.className = 'gantt-day-cell';
                        periodCell.dataset.periodIndex = periodIndex;
                        periodCell.dataset.periodStart = periodStartStr;
                        periodCell.dataset.periodEnd = periodEndStr;
                        periodCell.dataset.machine = machineNormalized;
                        periodCell.dataset.machineOriginal = machineTrimmed; // Orijinal makine adını sakla
                        // Günlük görünüm için date de ekle (populateGrid için)
                        if (this.viewType === 'daily') {
                            periodCell.dataset.date = periodStartStr;
                        }
                        // Sabit genişlik kullan (scroll için gerekli)
                        // Responsive genişlik kullan (header ile aynı)
                        const cellWidth = this.getCellWidth(periodCount);
                        periodCell.style.width = `${cellWidth}px`;
                        periodCell.style.minWidth = `${this.getMinCellWidth()}px`;
                        periodCell.style.flex = `0 0 ${cellWidth}px`; // Shrink ve grow yok, responsive genişlik
                        
                        // Bugün bu dönem içinde mi kontrol et
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (today >= period.start && today <= period.end) {
                            periodCell.classList.add('gantt-timeline-day-column-today');
                        }
                        
                        // Drop zone özelliği ekle
                        this.setupCellDropZone(periodCell);
                        
                        machineRow.appendChild(periodCell);
                        });
                        
                        timelineBody.appendChild(machineRow);
                    });
                });
            });
        }
    }

    /**
     * Planlı işleri veritabanından yükler
     */
    async loadPlanningData() {
        if (!this.selectedDateRange.start || !this.selectedDateRange.end) {
            return;
        }
        
        try {
            // Seçili makineleri al
            const machines = this.selectedMachines.length > 0 ? this.selectedMachines : [];
            
            // API'den planlı işleri çek
            const params = new URLSearchParams({
                startDate: this.selectedDateRange.start,
                endDate: this.selectedDateRange.end,
                machines: machines.join(',')
            });
            
            const response = await fetch(`/api/planning-data?${params.toString()}`);
            const result = await response.json();
            
            if (result.success && result.data) {
                this.planningData = result.data;
                console.log('✅ Planlı işler yüklendi:', this.planningData.length, 'kayıt');
                // Grid'e yerleştir
                this.populateGrid();
            } else if (result.success && Array.isArray(result)) {
                // Eğer direkt array dönüyorsa
                this.planningData = result;
                console.log('✅ Planlı işler yüklendi:', this.planningData.length, 'kayıt');
                // Grid'e yerleştir
                this.populateGrid();
            } else {
                console.warn('⚠️ Planlı işler yüklenemedi', result);
                this.planningData = [];
            }
        } catch (error) {
            console.error('❌ Planlı işler yükleme hatası:', error);
            this.planningData = [];
        }
    }

    /**
     * Makine adını normalize eder (eşleştirme için)
     */
    normalizeMachineName(machineName) {
        if (!machineName) return '';
        // Trim, uppercase, ve çoklu boşlukları tek boşluğa çevir
        return machineName
            .trim()
            .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluğa çevir
            .toUpperCase();
    }

    /**
     * Tarihi normalize eder (YYYY-MM-DD formatına)
     */
    normalizeDate(dateValue) {
        if (!dateValue) return null;
        
        try {
            let date;
            if (typeof dateValue === 'string') {
                // String ise parse et
                date = new Date(dateValue);
            } else if (dateValue instanceof Date) {
                date = dateValue;
            } else {
                return null;
            }
            
            // Geçerli tarih mi kontrol et
            if (isNaN(date.getTime())) {
                return null;
            }
            
            // YYYY-MM-DD formatına çevir
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Tarih normalize hatası:', error, dateValue);
            return null;
        }
    }

    /**
     * Planlı işleri grid'e yerleştirir
     */
    populateGrid() {
        const timelineBody = document.getElementById('gantt-timeline-body');
        if (!timelineBody) return;
        
        // Tüm tooltip'leri temizle - grid yeniden oluşturulurken eski tooltip'lerin kalmasını önle
        const allTooltips = document.querySelectorAll('.gantt-job-tooltip');
        allTooltips.forEach(tooltip => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
        
        // Tüm hücreleri temizle
        const cells = timelineBody.querySelectorAll('.gantt-day-cell');
        cells.forEach(cell => {
            cell.innerHTML = '';
        });
        
        if (!this.planningData || this.planningData.length === 0) {
            console.log('⚠️ Planlı iş verisi yok');
            return;
        }
        
        console.log('📊 Grid\'e yerleştiriliyor:', this.planningData.length, 'planlı iş');
        
        // Tüm hücreleri önce topla (daha hızlı arama için)
        const allCells = Array.from(timelineBody.querySelectorAll('.gantt-day-cell'));
        const cellMap = new Map();
        
        // Grid'deki tüm makine adlarını topla (debug için)
        const gridMachines = new Set();
        
        allCells.forEach(cell => {
            // Görünüm tipine göre tarih bilgisini al
            const periodStart = cell.dataset.periodStart;
            const periodEnd = cell.dataset.periodEnd;
            const date = cell.dataset.date || periodStart; // Günlük görünüm için date kullan
            // cell.dataset.machine zaten normalize edilmiş olmalı, ama yine de normalize et (güvenli)
            const machine = cell.dataset.machine ? this.normalizeMachineName(cell.dataset.machine) : '';
            if ((!periodStart && !date) || !machine) return; // Geçersiz hücreyi atla
            
            gridMachines.add(machine);
            
            // Günlük görünüm için date ile eşleştirme ekle
            if (this.viewType === 'daily' && date) {
                const dailyKey = `${date}|${machine}`;
                if (!cellMap.has(dailyKey)) {
                    cellMap.set(dailyKey, []);
                }
                cellMap.get(dailyKey).push(cell);
            }
            
            // Period bazlı eşleştirme (haftalık ve aylık için)
            if (periodStart && periodEnd) {
                const periodKey = `${periodStart}|${periodEnd}|${machine}`;
                if (!cellMap.has(periodKey)) {
                    cellMap.set(periodKey, []);
                }
                cellMap.get(periodKey).push(cell);
            }
        });
        
        console.log(`📋 Toplam ${cellMap.size} benzersiz hücre bulundu (${allCells.length} toplam hücre)`);
        console.log(`📋 Grid'deki makineler (${gridMachines.size} adet):`, Array.from(gridMachines).sort().slice(0, 20));
        
        // API'den gelen tüm makine adlarını topla (debug için)
        const apiMachines = new Set();
        const apiMachinesOriginal = new Map(); // Orijinal -> normalize mapping
        this.planningData.forEach(plan => {
            const machine = plan.makAd || plan.MAK_AD;
            if (machine) {
                const normalized = this.normalizeMachineName(machine);
                apiMachines.add(normalized);
                if (!apiMachinesOriginal.has(normalized)) {
                    apiMachinesOriginal.set(normalized, machine);
                }
            }
        });
        console.log(`📋 API'den gelen makineler (${apiMachines.size} adet):`, Array.from(apiMachines).sort().slice(0, 20));
        
        // Eşleşmeyen makineleri bul ve detaylı logla
        const unmatchedMachines = Array.from(apiMachines).filter(m => !gridMachines.has(m));
        if (unmatchedMachines.length > 0) {
            console.group('⚠️ Grid\'de bulunamayan makineler:');
            unmatchedMachines.slice(0, 10).forEach(machineNorm => {
                const original = apiMachinesOriginal.get(machineNorm);
                console.log(`  - Normalize: "${machineNorm}" | Orijinal: "${original}"`);
            });
            console.groupEnd();
        }
        
        // Eşleşen makineleri de göster (ilk 5)
        const matchedMachines = Array.from(apiMachines).filter(m => gridMachines.has(m));
        if (matchedMachines.length > 0) {
            console.log(`✅ Eşleşen makineler (${matchedMachines.length} adet):`, matchedMachines.sort().slice(0, 5));
        }
        
        // Planlı işleri işle ve yerleştir
        let placedCount = 0;
        let notPlacedCount = 0;
        const notPlacedDetails = [];
        
        this.planningData.forEach(plan => {
            // Tarihi normalize et
            const planDateStr = this.normalizeDate(plan.planTarihi || plan.PLAN_TARIHI);
            if (!planDateStr) {
                notPlacedCount++;
                notPlacedDetails.push({
                    reason: 'Geçersiz tarih',
                    plan: plan
                });
                return;
            }
            
            // Makine adını normalize et
            const machine = plan.makAd || plan.MAK_AD;
            if (!machine) {
                notPlacedCount++;
                notPlacedDetails.push({
                    reason: 'Makine adı yok',
                    plan: plan
                });
                return;
            }
            
            const machineNormalized = this.normalizeMachineName(machine);
            
            // Plan tarihini Date objesine çevir
            const planDate = new Date(planDateStr);
            planDate.setHours(0, 0, 0, 0);
            
            // İlgili hücreyi bul - görünüm tipine göre
            let matchingCells = [];
            
            if (this.viewType === 'daily') {
                // Günlük: Tam tarih eşleşmesi
                const key = `${planDateStr}|${machineNormalized}`;
                matchingCells = cellMap.get(key) || [];
            } else {
                // Haftalık ve Aylık: Period içinde olan hücreleri bul
                cellMap.forEach((cells, key) => {
                    const [periodStart, periodEnd, cellMachine] = key.split('|');
                    if (cellMachine === machineNormalized) {
                        const periodStartDate = new Date(periodStart);
                        const periodEndDate = new Date(periodEnd);
                        periodStartDate.setHours(0, 0, 0, 0);
                        periodEndDate.setHours(23, 59, 59, 999);
                        
                        if (planDate >= periodStartDate && planDate <= periodEndDate) {
                            matchingCells.push(...cells);
                        }
                    }
                });
            }
            
            // Eğer tam eşleşme yoksa, benzer makine adlarını ara (debug için)
            if (!matchingCells || matchingCells.length === 0) {
                // Benzer makine adlarını bul (sadece debug için)
                const similarMachines = Array.from(gridMachines).filter(gm => {
                    // gm zaten normalize edilmiş, tekrar normalize etmeye gerek yok
                    return gm.includes(machineNormalized) || machineNormalized.includes(gm);
                });
                
                if (similarMachines.length > 0 && notPlacedCount < 3) {
                    console.warn(`⚠️ Tam eşleşme yok, benzer makineler bulundu:`, {
                        aranan: machineNormalized,
                        orijinal: machine,
                        benzerler: similarMachines,
                        tarih: planDateStr,
                        isemriNo: plan.isemriNo || plan.ISEMRI_NO
                    });
                }
            }
            
            if (matchingCells && matchingCells.length > 0) {
                // İlk eşleşen hücreye yerleştir
                const cell = matchingCells[0];
                
                // İş genişliğini görünüm tipine göre hesapla
                let jobWidth = '100%'; // Varsayılan: tam genişlik
                let jobLeft = '0%';
                
                if (this.viewType === 'weekly') {
                    // Haftalık: 1 gün = 1/7 = ~14.3% genişlik
                    const periodStart = cell.dataset.periodStart;
                    const periodEnd = cell.dataset.periodEnd;
                    if (periodStart && periodEnd) {
                        const periodStartDate = new Date(periodStart);
                        const periodEndDate = new Date(periodEnd);
                        const periodDays = Math.ceil((periodEndDate - periodStartDate) / (1000 * 60 * 60 * 24)) + 1;
                        jobWidth = `${(1 / periodDays) * 100}%`;
                        // İşin period içindeki pozisyonunu hesapla
                        const dayInPeriod = Math.ceil((planDate - periodStartDate) / (1000 * 60 * 60 * 24));
                        jobLeft = `${(dayInPeriod / periodDays) * 100}%`;
                    }
                } else if (this.viewType === 'monthly') {
                    // Aylık: 1 gün = 1/30 = ~3.3% genişlik (ortalama ay 30 gün)
                    const periodStart = cell.dataset.periodStart;
                    const periodEnd = cell.dataset.periodEnd;
                    if (periodStart && periodEnd) {
                        const periodStartDate = new Date(periodStart);
                        const periodEndDate = new Date(periodEnd);
                        const periodDays = Math.ceil((periodEndDate - periodStartDate) / (1000 * 60 * 60 * 24)) + 1;
                        jobWidth = `${(1 / periodDays) * 100}%`;
                        // İşin period içindeki pozisyonunu hesapla
                        const dayInPeriod = Math.ceil((planDate - periodStartDate) / (1000 * 60 * 60 * 24));
                        jobLeft = `${(dayInPeriod / periodDays) * 100}%`;
                    }
                }
                // Günlük görünümde zaten 100% genişlik
                
                // Planlı iş kartını oluştur
                const jobCard = document.createElement('div');
                jobCard.className = 'gantt-job-card';
                jobCard.draggable = true; // Drag özelliği ekle
                jobCard.dataset.planId = plan.planId || plan.PLAN_ID;
                jobCard.dataset.isemriId = plan.isemriId || plan.ISEMRI_ID;
                jobCard.dataset.machine = machineNormalized;
                jobCard.dataset.date = planDateStr;
                jobCard.dataset.planlananMiktar = plan.planlananMiktar || plan.PLANLANAN_MIKTAR || 0;
                jobCard.dataset.machineOriginal = plan.makAd || plan.MAK_AD || machineNormalized;
                
                // Görünüm tipine göre stil ayarla
                if (this.viewType === 'weekly' || this.viewType === 'monthly') {
                    jobCard.style.width = jobWidth;
                    jobCard.style.left = jobLeft;
                    jobCard.style.position = 'absolute';
                    jobCard.style.top = '5px';
                } else {
                    // Günlük görünümde normal flex davranışı
                    jobCard.style.width = '100%';
                }
                
                // Ürün kodunu al (malhizKodu veya MALHIZ_KODU)
                const urunKodu = plan.malhizKodu || plan.MALHIZ_KODU || '';
                const planlananAdet = plan.planlananMiktar || plan.PLANLANAN_MIKTAR || 0;
                
                jobCard.innerHTML = `
                    <div class="gantt-job-card-header">
                        <span class="gantt-job-isemri">${urunKodu || ''}</span>
                    </div>
                    <div class="gantt-job-card-body">
                        <div class="gantt-job-miktar">${planlananAdet} adet</div>
                    </div>
                `;
                
                // Hover tooltip ekle
                this.setupJobCardTooltip(jobCard, plan);
                
                // Drag and drop event listener'ları ekle
                this.setupJobCardDragAndDrop(jobCard, plan);
                
                cell.appendChild(jobCard);
                placedCount++;
            } else {
                notPlacedCount++;
                notPlacedDetails.push({
                    reason: 'Hücre bulunamadı',
                    date: planDateStr,
                    machine: machineNormalized,
                    viewType: this.viewType,
                    plan: plan
                });
            }
        });
        
        console.log(`✅ Grid yerleştirme tamamlandı: ${placedCount} yerleştirildi, ${notPlacedCount} yerleştirilemedi`);
        
        // Eşleşmeyen işlerin detaylarını göster (ilk 10 tanesi)
        if (notPlacedCount > 0) {
            console.group('⚠️ Yerleştirilemeyen işler (ilk 10):');
            notPlacedDetails.slice(0, 10).forEach((detail, index) => {
                console.log(`${index + 1}. ${detail.reason}:`, {
                    tarih: detail.date || detail.plan?.planTarihi,
                    makine: detail.machine || detail.plan?.makAd,
                    isemriNo: detail.plan?.isemriNo,
                    aramaKey: detail.key
                });
            });
            console.groupEnd();
        }
    }

    /**
     * İş kartı için hover tooltip kurulumu
     */
    setupJobCardTooltip(jobCard, plan) {
        let tooltip = null;
        let hideTimeout = null;
        let showTimeout = null;
        let isHiding = false; // Tooltip gizleniyor mu kontrolü
        
        // Plan bilgilerini al
        const urunKodu = plan.malhizKodu || plan.MALHIZ_KODU || '-';
        const urunAdi = plan.malhizAdi || plan.MALHIZ_ADI || '-';
        const isemriNo = plan.isemriNo || plan.ISEMRI_NO || '-';
        const planlananMiktar = plan.planlananMiktar || plan.PLANLANAN_MIKTAR || 0;
        const makAd = plan.makAd || plan.MAK_AD || '-';
        const planTarihi = plan.planTarihi || plan.PLAN_TARIHI || '-';
        const agirlik = plan.agirlik || plan.AGIRLIK || 0;
        const toplamSure = plan.toplamSure || plan.TOPLAM_SURE || 0;
        
        // Tarih formatla
        let formattedDate = '-';
        if (planTarihi && planTarihi !== '-') {
            try {
                const date = new Date(planTarihi);
                formattedDate = date.toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            } catch (e) {
                formattedDate = planTarihi;
            }
        }
        
        // Tooltip oluştur
        const createTooltip = () => {
            // Eğer tooltip zaten varsa ve DOM'da ise, onu kullan
            if (tooltip && tooltip.parentNode) {
                // Eğer gizleniyorsa, gizleme işlemini iptal et
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                    isHiding = false;
                }
                return tooltip;
            }
            
            // Eğer tooltip varsa ama DOM'da değilse, temizle
            if (tooltip) {
                tooltip = null;
            }
            
            tooltip = document.createElement('div');
            tooltip.className = 'gantt-job-tooltip';
            
            // Tooltip içeriği
            tooltip.innerHTML = `
                <div class="gantt-job-tooltip-title">${urunKodu}</div>
                <div class="gantt-job-tooltip-row">
                    <span class="gantt-job-tooltip-label">Ürün Adı:</span>
                    <span class="gantt-job-tooltip-value">${urunAdi}</span>
                </div>
                <div class="gantt-job-tooltip-row">
                    <span class="gantt-job-tooltip-label">İş Emri No:</span>
                    <span class="gantt-job-tooltip-value">${isemriNo}</span>
                </div>
                <div class="gantt-job-tooltip-row">
                    <span class="gantt-job-tooltip-label">Planlanan Miktar:</span>
                    <span class="gantt-job-tooltip-value">${planlananMiktar} adet</span>
                </div>
                <div class="gantt-job-tooltip-row">
                    <span class="gantt-job-tooltip-label">Makine:</span>
                    <span class="gantt-job-tooltip-value">${makAd}</span>
                </div>
                <div class="gantt-job-tooltip-row">
                    <span class="gantt-job-tooltip-label">Plan Tarihi:</span>
                    <span class="gantt-job-tooltip-value">${formattedDate}</span>
                </div>
                ${agirlik > 0 ? `
                <div class="gantt-job-tooltip-row">
                    <span class="gantt-job-tooltip-label">Ağırlık:</span>
                    <span class="gantt-job-tooltip-value">${agirlik.toFixed(1)} kg</span>
                </div>
                ` : ''}
                ${toplamSure > 0 ? `
                <div class="gantt-job-tooltip-row">
                    <span class="gantt-job-tooltip-label">Toplam Süre:</span>
                    <span class="gantt-job-tooltip-value">${toplamSure.toFixed(2)} saat</span>
                </div>
                ` : ''}
            `;
            
            // Önce görünmez ekle - display: none ile başlat
            tooltip.style.setProperty('left', '-9999px', 'important');
            tooltip.style.setProperty('top', '-9999px', 'important');
            tooltip.style.setProperty('opacity', '0', 'important');
            tooltip.style.setProperty('visibility', 'hidden', 'important');
            tooltip.style.setProperty('display', 'none', 'important');
            document.body.appendChild(tooltip);
            
            return tooltip;
        };
        
        // Tooltip'i göster
        const showTooltip = (e) => {
            // Eğer gizleniyorsa, gizleme işlemini iptal et
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
                isHiding = false;
            }
            
            if (showTimeout) {
                clearTimeout(showTimeout);
            }
            
            showTimeout = setTimeout(() => {
                // Eğer tooltip zaten gizleniyorsa, gösterilmesini iptal et
                if (isHiding || hideTimeout) {
                    return;
                }
                
                const tooltipElement = createTooltip();
                console.log('📦 Tooltip oluşturuldu:', tooltipElement);
                
                // Tooltip pozisyonunu ayarla
                const rect = jobCard.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // DOM'a eklenmesini bekle ve boyutları al
                // Önce pozisyonu ayarla, sonra görünür yap
                requestAnimationFrame(() => {
                    // Eğer tooltip gizleniyorsa veya DOM'da değilse, gösterilmesini iptal et
                    if (isHiding || hideTimeout || !tooltipElement.parentNode) {
                        return;
                    }
                    
                    const tooltipRect = tooltipElement.getBoundingClientRect();
                    console.log('📐 Tooltip boyutları:', {
                        width: tooltipRect.width,
                        height: tooltipRect.height,
                        rect: rect,
                        tooltipRect: tooltipRect
                    });
                    
                    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    let top = rect.bottom + 10;
                    
                    // Sağdan taşmasını önle
                    if (left + tooltipRect.width > viewportWidth - 10) {
                        left = viewportWidth - tooltipRect.width - 10;
                    }
                    
                    // Soldan taşmasını önle
                    if (left < 10) {
                        left = 10;
                    }
                    
                    // Alttan taşmasını önle - yukarı göster
                    if (top + tooltipRect.height > viewportHeight - 10) {
                        top = rect.top - tooltipRect.height - 10;
                    }
                    
                    // Önce pozisyonu ayarla (görünmez durumda)
                    tooltipElement.style.setProperty('left', `${left}px`, 'important');
                    tooltipElement.style.setProperty('top', `${top}px`, 'important');
                    
                    // Sonra görünür yap - !important ile CSS'i override et
                    tooltipElement.classList.add('visible');
                    tooltipElement.style.setProperty('opacity', '1', 'important');
                    tooltipElement.style.setProperty('visibility', 'visible', 'important');
                    tooltipElement.style.setProperty('display', 'block', 'important');
                    
                    console.log('✅ Tooltip pozisyonu ayarlandı:', {
                        left: `${left}px`,
                        top: `${top}px`,
                        computedStyle: window.getComputedStyle(tooltipElement).display,
                        opacity: window.getComputedStyle(tooltipElement).opacity,
                        visibility: window.getComputedStyle(tooltipElement).visibility,
                        zIndex: window.getComputedStyle(tooltipElement).zIndex
                    });
                });
            }, 200);
        };
        
        // Tooltip'i gizle
        const hideTooltip = () => {
            // Zaten gizleniyorsa, tekrar gizleme
            if (isHiding) {
                return;
            }
            
            if (showTimeout) {
                clearTimeout(showTimeout);
                showTimeout = null;
            }
            
            if (tooltip) {
                isHiding = true;
                tooltip.classList.remove('visible');
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
                // Pozisyonu da gizle - sol üstte görünmesini önle
                tooltip.style.setProperty('left', '-9999px', 'important');
                tooltip.style.setProperty('top', '-9999px', 'important');
                tooltip.style.setProperty('display', 'none', 'important');
                hideTimeout = setTimeout(() => {
                    if (tooltip && !tooltip.classList.contains('visible')) {
                        if (tooltip.parentNode) {
                            tooltip.parentNode.removeChild(tooltip);
                        }
                        tooltip = null;
                    }
                    isHiding = false;
                }, 200);
            } else {
                isHiding = false;
            }
        };
        
        // Event listener'ları ekle
        jobCard.addEventListener('mouseenter', (e) => {
            e.stopPropagation();
            console.log('🖱️ Mouse enter - tooltip gösterilecek', { urunKodu, plan });
            showTooltip(e);
        });
        
        jobCard.addEventListener('mouseleave', (e) => {
            e.stopPropagation();
            console.log('🖱️ Mouse leave - tooltip gizlenecek');
            hideTooltip();
        });
        
        jobCard.addEventListener('mousemove', (e) => {
            // Tooltip görünür ve DOM'da ise pozisyonu güncelle
            if (tooltip && tooltip.classList.contains('visible') && tooltip.parentNode) {
                // Pozisyonu güncelle
                const rect = jobCard.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                let top = rect.bottom + 10;
                
                if (left + tooltipRect.width > viewportWidth - 10) {
                    left = viewportWidth - tooltipRect.width - 10;
                }
                if (left < 10) {
                    left = 10;
                }
                if (top + tooltipRect.height > viewportHeight - 10) {
                    top = rect.top - tooltipRect.height - 10;
                }
                
                // Pozisyonu güncelle - sadece görünür durumda
                tooltip.style.setProperty('left', `${left}px`, 'important');
                tooltip.style.setProperty('top', `${top}px`, 'important');
            }
        }, true);
    }

    /**
     * Belirli bir makine satırını vurgular
     */
    highlightMachineRow(machine) {
        const timelineBody = document.getElementById('gantt-timeline-body');
        const machineList = document.getElementById('gantt-machine-list');
        if (!timelineBody || !machineList) return;
        
        const machineTrimmed = machine.trim();
        
        // Tüm satırlardan vurgulamayı kaldır
        const allRows = timelineBody.querySelectorAll('.gantt-machine-row');
        allRows.forEach(row => {
            row.classList.remove('gantt-machine-row-highlighted');
        });
        
        // Sol paneldeki tüm item'lardan vurgulamayı kaldır
        const allItems = machineList.querySelectorAll('.gantt-machine-item');
        allItems.forEach(item => {
            item.classList.remove('gantt-machine-item-highlighted');
        });
        
        // Grid'deki ilgili satırı bul ve vurgula
        const machineRow = timelineBody.querySelector(`.gantt-machine-row[data-machine="${machineTrimmed}"]`);
        if (machineRow) {
            machineRow.classList.add('gantt-machine-row-highlighted');
            // Satırı görünür alana getir
            machineRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Sol paneldeki ilgili item'ı bul ve vurgula
        const machineItem = machineList.querySelector(`.gantt-machine-item[data-machine="${machineTrimmed}"]`);
        if (machineItem) {
            machineItem.classList.add('gantt-machine-item-highlighted');
            // Item'ı görünür alana getir
            machineItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Job card için drag and drop kurulumu
     */
    setupJobCardDragAndDrop(jobCard, plan) {
        let isDragging = false;
        let dragStartCell = null;
        
        // Drag başlangıcı
        jobCard.addEventListener('dragstart', (e) => {
            isDragging = true;
            dragStartCell = jobCard.closest('.gantt-day-cell');
            
            // Drag görselini ayarla
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', ''); // Bazı tarayıcılar için gerekli
            
            // Job card'ı yarı saydam yap
            jobCard.style.opacity = '0.5';
            
            // Tüm hücrelere drop zone görseli ekle
            const allCells = document.querySelectorAll('.gantt-day-cell');
            allCells.forEach(cell => {
                if (cell !== dragStartCell) {
                    cell.classList.add('gantt-drop-zone-active');
                }
            });
        });
        
        // Drag bitişi
        jobCard.addEventListener('dragend', (e) => {
            isDragging = false;
            jobCard.style.opacity = '1';
            
            // Tüm hücrelerden drop zone görselini kaldır
            const allCells = document.querySelectorAll('.gantt-day-cell');
            allCells.forEach(cell => {
                cell.classList.remove('gantt-drop-zone-active', 'gantt-drop-zone-hover');
            });
        });
    }
    
    /**
     * Hücre için drop zone kurulumu
     */
    setupCellDropZone(cell) {
        // Drag over - drop zone'u vurgula
        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            // Hover efekti ekle
            if (!cell.classList.contains('gantt-drop-zone-hover')) {
                cell.classList.add('gantt-drop-zone-hover');
            }
        });
        
        // Drag leave - hover efektini kaldır
        cell.addEventListener('dragleave', (e) => {
            cell.classList.remove('gantt-drop-zone-hover');
        });
        
        // Drop - iş kartını buraya taşı
        cell.addEventListener('drop', async (e) => {
            e.preventDefault();
            cell.classList.remove('gantt-drop-zone-hover', 'gantt-drop-zone-active');
            
            // Sürüklenen job card'ı bul
            const draggedJobCard = document.querySelector('.gantt-job-card[style*="opacity: 0.5"]');
            if (!draggedJobCard) return;
            
            // Eski hücreden job card'ı kaldır
            const oldCell = draggedJobCard.parentElement;
            if (oldCell === cell) {
                // Aynı hücreye bırakıldı, işlem yapma
                draggedJobCard.style.opacity = '1';
                return;
            }
            
            // Yeni tarih ve makine bilgilerini al
            const newDate = cell.dataset.date || cell.dataset.periodStart;
            // Orijinal makine adını kullan (normalize edilmiş değil)
            const newMachine = cell.dataset.machineOriginal || cell.dataset.machine;
            const planId = draggedJobCard.dataset.planId;
            const isemriId = draggedJobCard.dataset.isemriId;
            const planlananMiktar = draggedJobCard.dataset.planlananMiktar;
            const oldMachine = draggedJobCard.dataset.machineOriginal;
            
            if (!newDate || !planId) {
                console.error('Drop işlemi için gerekli veriler eksik:', { newDate, planId });
                draggedJobCard.style.opacity = '1';
                return;
            }
            
            console.log('🔄 Drag and drop işlemi başlatılıyor:', {
                planId,
                isemriId,
                oldDate: draggedJobCard.dataset.date,
                newDate,
                oldMachine,
                newMachine,
                planlananMiktar
            });
            
            try {
                // Loading göster
                draggedJobCard.style.opacity = '0.3';
                draggedJobCard.style.cursor = 'wait';
                
                // API çağrısı - tarih ve makine güncellemesi
                const updateBody = {
                    planId: parseInt(planId),
                    newDate: newDate,
                    selectedMachine: newMachine || oldMachine
                };
                
                const response = await fetch('/api/planning/update-date', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateBody)
                });
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.error || result.message || 'Güncelleme başarısız');
                }
                
                console.log('✅ API güncellemesi başarılı:', result);
                
                // ultraFastUpdate çağır - güncellenmiş kaydı hazırla
                if (window.planningApp && typeof window.planningApp.ultraFastUpdate === 'function') {
                    // Güncellenmiş kayıt bilgilerini hazırla - orijinal makine adını kullan
                    const updatedRecord = {
                        isemriId: parseInt(isemriId),
                        planId: parseInt(planId),
                        planTarihi: newDate,
                        planlananMiktar: parseInt(planlananMiktar),
                        selectedMachine: newMachine || oldMachine, // Orijinal makine adı (normalize edilmiş değil)
                        isBreakdown: false // Ana kayıt seviyesinde güncelleme
                    };
                    
                    // ultraFastUpdate çağır
                    await window.planningApp.ultraFastUpdate([updatedRecord]);
                    console.log('✅ ultraFastUpdate tamamlandı');
                    
                    // Gantt chart'ı yeniden yükle - tooltip ve görünümü güncelle
                    // ultraFastUpdate sonrası veriler güncellendi, grid'i yeniden yükle
                    setTimeout(async () => {
                        // Sadece verileri yeniden yükle (API çağrısı yapmadan, cache'den al)
                        // ultraFastUpdate zaten cache'i güncelledi, sadece grid'i yeniden oluştur
                        await this.loadPlanningData();
                        console.log('✅ Gantt chart verileri yenilendi');
                    }, 100);
                }
                
                // Job card'ı yeni hücreye taşı
                draggedJobCard.style.opacity = '1';
                draggedJobCard.style.cursor = '';
                
                // Eski hücreden kaldır
                if (oldCell) {
                    oldCell.removeChild(draggedJobCard);
                }
                
                // Yeni hücreye ekle
                cell.appendChild(draggedJobCard);
                
                // Dataset'i güncelle - orijinal makine adını kullan
                draggedJobCard.dataset.date = newDate;
                // Normalize edilmiş makine adını dataset.machine'e kaydet (eşleştirme için)
                const newMachineNormalized = this.normalizeMachineName(newMachine || oldMachine);
                draggedJobCard.dataset.machine = newMachineNormalized;
                // Orijinal makine adını dataset.machineOriginal'a kaydet
                draggedJobCard.dataset.machineOriginal = newMachine || oldMachine;
                
                // Görsel geri bildirim
                cell.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                setTimeout(() => {
                    cell.style.backgroundColor = '';
                }, 1000);
                
                console.log('✅ Drag and drop işlemi tamamlandı');
                
            } catch (error) {
                console.error('❌ Drag and drop hatası:', error);
                
                // Hata durumunda job card'ı eski haline getir
                draggedJobCard.style.opacity = '1';
                draggedJobCard.style.cursor = '';
                
                // Hata mesajı göster
                if (window.planningApp && typeof window.planningApp.showError === 'function') {
                    window.planningApp.showError('Sürükleme işlemi başarısız: ' + error.message);
                } else {
                    alert('Sürükleme işlemi başarısız: ' + error.message);
                }
            }
        });
    }

    /**
     * Zaman çizelgesini temizler
     */
    clearTimeline() {
        // Tüm tooltip'leri temizle
        const allTooltips = document.querySelectorAll('.gantt-job-tooltip');
        allTooltips.forEach(tooltip => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
        
        const chartArea = document.getElementById('gantt-chart-area');
        const panelHeader = document.getElementById('gantt-chart-panel-header');
        
        if (panelHeader) {
            panelHeader.innerHTML = '<h3>📊 Gantt Görünümü</h3>';
        }
        
        if (chartArea) {
            chartArea.innerHTML = `
                <div class="gantt-empty-message">
                    <div class="gantt-empty-icon">📊</div>
                    <div class="gantt-empty-text">Tarih aralığı seçin</div>
                    <div class="gantt-empty-hint">Başlangıç ve bitiş tarihlerini seçerek Gantt görünümünü başlatın</div>
                </div>
            `;
        }
    }

    /**
     * Gantt görünümünü gösterir
     */
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
            
            // Ana header ve footer'ı gizle (tam ekran için)
            const mainHeader = document.querySelector('.main-header');
            const footer = document.querySelector('.footer');
            const mainContainer = document.querySelector('.container');
            
            if (mainHeader) {
                mainHeader.style.display = 'none';
            }
            if (footer) {
                footer.style.display = 'none';
            }
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }
            
            // Body scroll'unu kaldır ve transform'u sıfırla
            document.body.style.overflow = 'hidden';
            document.body.style.transform = 'none';
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            
            // HTML'i de temizle
            document.documentElement.style.margin = '0';
            document.documentElement.style.padding = '0';
            document.documentElement.style.overflow = 'hidden';
            
            // Makine listesini güncelle
            this.updateMachineList();
            // Varsayılan tarih aralığı ile zaman çizelgesini oluştur
            if (this.selectedDateRange.start && this.selectedDateRange.end) {
                // Kısa bir gecikme ile timeline oluştur (DOM hazır olsun)
                setTimeout(() => {
                    this.createTimeline();
                }, 100);
            } else {
                this.clearTimeline();
            }
        }
    }

    /**
     * Gantt görünümünü gizler
     */
    hide() {
        if (this.container) {
            // Tüm tooltip'leri temizle - Gantt chart kapatıldığında tooltip'lerin kalmasını önle
            const allTooltips = document.querySelectorAll('.gantt-job-tooltip');
            allTooltips.forEach(tooltip => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            });
            console.log(`✅ ${allTooltips.length} tooltip temizlendi`);
            
            this.container.style.display = 'none';
            
            // Ana header ve footer'ı tekrar göster
            const mainHeader = document.querySelector('.main-header');
            const footer = document.querySelector('.footer');
            const mainContainer = document.querySelector('.container');
            
            if (mainHeader) {
                mainHeader.style.display = '';
            }
            if (footer) {
                footer.style.display = '';
            }
            if (mainContainer) {
                mainContainer.style.display = '';
            }
            
            // Body scroll'unu ve transform'u geri getir
            document.body.style.overflow = '';
            document.body.style.transform = '';
            document.body.style.margin = '';
            document.body.style.padding = '';
            
            // HTML'i de geri getir
            document.documentElement.style.margin = '';
            document.documentElement.style.padding = '';
            document.documentElement.style.overflow = '';
        }
    }

    /**
     * Gantt görünümünü toggle eder
     */
    toggle() {
        if (this.container) {
            if (this.container.style.display === 'none' || !this.container.style.display) {
                this.show();
            } else {
                this.hide();
            }
        }
    }
}

// Global instance
let ganttChart = null;
let ganttChartInitializing = false;

/**
 * Gantt görünümünü açar
 */
async function openGanttView() {
    try {
        // Eğer henüz oluşturulmadıysa oluştur
        if (!ganttChart) {
            if (ganttChartInitializing) {
                // Zaten başlatılıyorsa bekle
                console.log('⏳ Gantt zaten başlatılıyor, bekleniyor...');
                // Başlatma tamamlanana kadar bekle
                while (ganttChartInitializing) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                // Başlatma tamamlandıktan sonra tekrar kontrol et
                if (!ganttChart || !ganttChart.container) {
                    console.error('❌ Gantt başlatılamadı');
                    return;
                }
            } else {
                console.log('🚀 Gantt başlatılıyor...');
                ganttChartInitializing = true;
                ganttChart = new GanttChart();
                // init() tamamlanana kadar bekle
                await ganttChart.init();
                ganttChartInitializing = false;
                console.log('✅ Gantt başlatıldı');
            }
        }
        
        // Container hazır olduğundan emin ol
        if (ganttChart && ganttChart.container) {
            console.log('📊 Gantt gösteriliyor...');
            ganttChart.show();
        } else {
            console.warn('⚠️ Gantt container hazır değil, bekleniyor...');
            // Container henüz hazır değilse kısa bir süre bekle
            let retries = 0;
            const maxRetries = 10;
            const checkContainer = setInterval(() => {
                retries++;
                if (ganttChart && ganttChart.container) {
                    clearInterval(checkContainer);
                    console.log('✅ Gantt container hazır, gösteriliyor...');
                    ganttChart.show();
                } else if (retries >= maxRetries) {
                    clearInterval(checkContainer);
                    console.error('❌ Gantt container hazırlanamadı');
                }
            }, 100);
        }
    } catch (error) {
        console.error('❌ Gantt açılırken hata:', error);
        ganttChartInitializing = false;
    }
}

/**
 * Gantt görünümünü kapatır
 */
function closeGanttView() {
    if (ganttChart) {
        ganttChart.hide();
    }
}

// Global scope'a ekle (window objesine)
if (typeof window !== 'undefined') {
    window.openGanttView = openGanttView;
    window.closeGanttView = closeGanttView;
}

