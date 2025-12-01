/**
 * Grafik yönetim sınıfı - Chart işlemlerini yönetir
 */
class ChartManager {
    constructor() {
        this.selectedWeek = null;
        this.selectedDayIndex = -1;
        this.selectedSegmentIndex = -1;
        this.valueType = 'planlananMiktar'; // planlananMiktar, agirlik, brutAgirlik, toplamSure
        this.data = [];
        this.selectedMachine = ''; // Seçili makina filtresi
        this.selectedDepartment = ''; // Seçili bölüm filtresi
        this.weekRange = { start: 1, end: 4 }; // Varsayılan hafta aralığı
        this.weekRangeSize = 4; // Seçilen aralık boyutu
        
        this.breakdownSelection = null; // seçili kırılım bağlamı (agirlik, toplamSure, planlananMiktar, tarih)
        
        // Toplu seçim için özellikler
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectedSegments = new Set(); // Seçili segment planId'leri
        this.selectionBox = null; // Seçim kutusu elementi
        
        this.init();
    }

    /**
     * Chart manager'ı başlatır
     */
    init() {
        this.bindEvents();
        this.initDragAndDrop();
        this.initMultiSelect();
    }

    /**
     * Günlük veriler başlığını günceller
     */
    updateDailyChartTitle() {
        const dailyChartTitle = document.getElementById('dailyChartTitle');
        if (!dailyChartTitle) return;
        
        let title = 'Günlük Veriler';
        
        // Eğer kırılım seçimi varsa ve makine bilgisi varsa (öncelik)
        if (this.breakdownSelection?.selectedMachine) {
            title += ` - ${this.breakdownSelection.selectedMachine}`;
        }
        // Eğer makine filtresi varsa ve kırılım seçimi yoksa
        else if (this.selectedMachine && !this.breakdownSelection) {
            title += ` - ${this.selectedMachine}`;
        }
        
        dailyChartTitle.textContent = title;
    }

    /**
     * Kırılım seçimi bağlamını alır (tabloda kırılım satırına tıklanınca set edilir)
     */
    setBreakdownSelection(payload) {
        this.breakdownSelection = payload; // { isemriId, isemriNo, planId, parcaNo, planlananMiktar, agirlik, toplamSure, planlananTarih, selectedMachine }
        // Seçili tarih/hafta ile senkronize et
        if (payload?.planlananTarih) {
            const week = this.getWeekString(new Date(payload.planlananTarih));
            this.selectedWeek = week;
        }
        this.updateCharts();
        this.updateDailyChartTitle();
    }

    /**
     * Event listener'ları bağlar
     */
    bindEvents() {
        const chartValueType = document.getElementById('chartValueType');
        if (chartValueType) {
            chartValueType.addEventListener('change', async (e) => {
                this.valueType = e.target.value;
                await this.updateCharts();
            });
        }
    }

    /**
     * Veriyi yükler
     * @param {Array} data - Chart verisi
     */
    async loadData(data) {
        this.data = data;
        await this.updateCharts();
        this.updateDailyChartTitle();
    }

    /**
     * Makina filtresini günceller
     * @param {string} machine - Seçili makina
     */
    async updateMachineFilter(machine) {
        this.selectedMachine = machine;
        await this.updateCharts();
        this.updateDailyChartTitle();
    }

    /**
     * Bölüm filtresini günceller
     * @param {string} department - Seçili bölüm
     */
    async updateDepartmentFilter(department) {
        this.selectedDepartment = department;
        await this.updateCharts();
        this.updateDailyChartTitle();
    }

    /**
     * Tüm chart'ları günceller
     */
    async updateCharts() {
        await this.updateWeeksChart();
        if (this.selectedWeek) {
            await this.updateDaysChart(this.selectedWeek);
        }
        this.updateDailyChartTitle();
    }

    /**
     * Haftalık chart'ı günceller
     */
    async updateWeeksChart() {
        const weeksChart = document.getElementById('weeksChart');
        if (!weeksChart) return;

        try {
            // PLANLAMA_VERI verilerini tek noktadan cache'leyerek al
            const planningData = await this.getPlanningDataCached();
            
            // Planlama verilerini haftalara göre grupla (makina ve bölüm filtresi ile)
            const weekGroups = {};
            let filteredCount = 0;
            const initialPlanningDataLength = planningData.length; // Debug için
            planningData.forEach(item => {
                if (!item.planTarihi) return;
                
                // Bölüm filtresi uygula
                if (this.selectedDepartment && item.bolumAdi !== this.selectedDepartment) {
                    return;
                }
                
                // Makina filtresi uygula
                if (this.selectedMachine && item.makAd !== this.selectedMachine) {
                    return;
                }
                
                filteredCount++;
                const date = new Date(item.planTarihi);
                const weekString = this.getWeekString(date);
                
                if (!weekGroups[weekString]) {
                    weekGroups[weekString] = [];
                }
                weekGroups[weekString].push(item);
            });
            
            const weeks = Object.keys(weekGroups).sort();
            
            // Seçilen hafta aralığına göre haftaları oluştur
            let allWeeks = [];

            // Güvenli yıl/hafta tespiti: selectedWeek yoksa bugünün haftasını baz al
            const safeWeek = this.selectedWeek || this.getWeekString(new Date());
            const baseYear = parseInt((safeWeek || '').split('-W')[0] || new Date().getFullYear());
            
            // Hafta aralığından haftaları oluştur (yıl değişimlerini destekle)
            const startYear = this.weekRangeYears ? this.weekRangeYears.start : baseYear;
            const startWeek = this.weekRange.start;
            const endYear = this.weekRangeYears ? this.weekRangeYears.end : baseYear;
            const endWeek = this.weekRange.end;
            
            // Yıl değişimini destekle - ancak makul sınırlar içinde
            // startWeek ve endWeek değerlerini kontrol et
            const maxWeeks = 20; // Maksimum hafta sayısı
            
            if (startYear === endYear) {
                // Aynı yıl içinde - hafta sayısını kontrol et
                const weekCount = endWeek - startWeek + 1;
                
                // Yılın son haftasını al (53 hafta olabilir)
                const getWeeksInYear = (year) => {
                    const dec31 = new Date(year, 11, 31);
                    const weekString = this.getWeekString(dec31);
                    if (weekString) {
                        const weekYear = parseInt(weekString.split('-W')[0]);
                        const weekNum = parseInt(weekString.split('-W')[1]);
                        // Eğer hafta yılı farklıysa (31 Aralık bir sonraki yılın ilk haftasında), 
                        // bir önceki haftaya bak
                        if (weekYear !== year) {
                            const dec28 = new Date(year, 11, 28);
                            const weekString28 = this.getWeekString(dec28);
                            if (weekString28) {
                                return parseInt(weekString28.split('-W')[1]);
                            }
                        }
                        return weekNum;
                    }
                    return 52;
                };
                const yearLastWeek = getWeeksInYear(startYear);
                
                console.log('updateWeeksChart - Hafta aralığı kontrolü:', {
                    startYear,
                    startWeek,
                    endWeek,
                    weekCount,
                    yearLastWeek,
                    maxWeeks,
                    isValid: weekCount > 0 && weekCount <= maxWeeks && startWeek >= 1 && startWeek <= yearLastWeek && endWeek >= 1 && endWeek <= yearLastWeek
                });
                
                if (weekCount > 0 && weekCount <= maxWeeks && startWeek >= 1 && startWeek <= yearLastWeek && endWeek >= 1 && endWeek <= yearLastWeek) {
                    for (let i = startWeek; i <= endWeek; i++) {
                        const weekString = `${startYear}-W${String(i).padStart(2, '0')}`;
                        allWeeks.push(weekString);
                    }
                    console.log('updateWeeksChart - Haftalar üretildi:', allWeeks.length, 'hafta');
                } else {
                    // Geçersiz değerler - varsayılan aralığı kullan
                    console.warn('Geçersiz hafta aralığı, varsayılan değerler kullanılıyor:', { 
                        startYear, startWeek, endWeek, weekCount, yearLastWeek, maxWeeks 
                    });
                    const currentWeek = this.getWeekString(new Date());
                    const currentWeekNum = parseInt(currentWeek.split('-W')[1]);
                    const currentYear = parseInt(currentWeek.split('-W')[0]);
                    // Yılın gerçek hafta sayısını hesapla (52 veya 53)
                    const getWeeksInYear = (year) => {
                        const dec31 = new Date(year, 11, 31);
                        const weekString = this.getWeekString(dec31);
                        if (weekString) {
                            const weekYear = parseInt(weekString.split('-W')[0]);
                            const weekNum = parseInt(weekString.split('-W')[1]);
                            if (weekYear !== year) {
                                const dec28 = new Date(year, 11, 28);
                                const weekString28 = this.getWeekString(dec28);
                                if (weekString28) {
                                    return parseInt(weekString28.split('-W')[1]);
                                }
                            }
                            return weekNum;
                        }
                        return 52;
                    };
                    const currentYearLastWeek = getWeeksInYear(currentYear);
                    for (let i = Math.max(1, currentWeekNum - 2); i <= Math.min(currentYearLastWeek, currentWeekNum + 2); i++) {
                        const weekString = `${currentYear}-W${String(i).padStart(2, '0')}`;
                        allWeeks.push(weekString);
                    }
                }
            } else {
                // Farklı yıllar arasında - bu durum artık olmamalı çünkü focusOnWeek her zaman aynı yıl içinde kalıyor
                // Ama yine de güvenlik için kontrol edelim
                console.warn('Beklenmeyen yıl değişimi tespit edildi, varsayılan aralık kullanılıyor:', {
                    startYear, startWeek, endYear, endWeek
                });
                const currentWeek = this.getWeekString(new Date());
                const currentWeekNum = parseInt(currentWeek.split('-W')[1]);
                const currentYear = parseInt(currentWeek.split('-W')[0]);
                // Yılın gerçek hafta sayısını hesapla (52 veya 53)
                const getWeeksInYear = (year) => {
                    const dec31 = new Date(year, 11, 31);
                    const weekString = this.getWeekString(dec31);
                    if (weekString) {
                        const weekYear = parseInt(weekString.split('-W')[0]);
                        const weekNum = parseInt(weekString.split('-W')[1]);
                        if (weekYear !== year) {
                            const dec28 = new Date(year, 11, 28);
                            const weekString28 = this.getWeekString(dec28);
                            if (weekString28) {
                                return parseInt(weekString28.split('-W')[1]);
                            }
                        }
                        return weekNum;
                    }
                    return 52;
                };
                const currentYearLastWeek = getWeeksInYear(currentYear);
                for (let i = Math.max(1, currentWeekNum - 2); i <= Math.min(currentYearLastWeek, currentWeekNum + 2); i++) {
                    const weekString = `${currentYear}-W${String(i).padStart(2, '0')}`;
                    allWeeks.push(weekString);
                }
            }
            
            // Seçili hafta yoksa ilk haftayı seç
            if (!this.selectedWeek && allWeeks.length > 0) {
                this.selectedWeek = allWeeks[0];
            }
            
            const weekData = allWeeks.map(week => {
                const weekItems = weekGroups[week] || []; // Boş haftalar için boş array
                return {
                    week: week,
                    total: weekItems.reduce((sum, item) => {
                        let value = Number(item[this.valueType]) || 0;
                        // Plan miktar seçildiğinde planlananMiktar/figurSayisi göster
                        if (this.valueType === 'planlananMiktar') {
                            const figurSayisi = Number(item.figurSayisi) || 1;
                            value = figurSayisi > 0 ? (value / figurSayisi) : value;
                        }
                        return sum + value;
                    }, 0)
                };
            });

            // Maksimum değeri hesapla - hafta toplamlarından (en yüksek hafta toplamı)
            const weekTotals = weekData.map(d => d.total).filter(total => total > 0);
            const maxValue = weekTotals.length > 0 ? Math.max(...weekTotals) : 1;
            
            // Bar container yüksekliği: CSS'de 180px, padding 20px üst-alt = 140px kullanılabilir
            // Günlük chart ile aynı maksimum yüksekliği kullan: 150px (ama container 180px olduğu için 150px kullanılabilir)
            const maxBarHeight = 150; // Maksimum bar yüksekliği (günlük chart ile aynı)
            
            // Debug: Maksimum değeri ve hafta toplamlarını logla
            console.log('Haftalık Chart Debug:', {
                maxValue: maxValue,
                maxBarHeight: maxBarHeight,
                weekTotals: weekData.map(d => ({ week: d.week, total: d.total }))
            });
        
        weeksChart.innerHTML = `
            <div class="chart-wrapper">
                <div class="bar-chart">
                    ${weekData.map(data => {
                        const isSelected = data.week === this.selectedWeek;
                        const roundedTotal = data.total; // Gerçek değeri göster
                        
                        // Bu haftadaki planlama verilerini topla
                        const weekItems = weekGroups[data.week] || [];
                        const uniqueItems = weekItems.length;
                        const totalWeight = weekItems.reduce((sum, item) => sum + (item.agirlik || 0), 0);
                        const totalBrutAgirlik = weekItems.reduce((sum, item) => sum + (item.brutAgirlik || 0), 0);
                        const totalDuration = weekItems.reduce((sum, item) => sum + (item.toplamSure || 0), 0);
                        const totalQuantity = weekItems.reduce((sum, item) => sum + (item.planlananMiktar || 0), 0);
                        
                        // Formatlanmış değerler
                        const formattedWeight = totalWeight.toFixed(1);
                        const formattedBrutAgirlik = totalBrutAgirlik.toFixed(1);
                        const formattedDuration = totalDuration.toFixed(2);
                        const formattedQuantity = totalQuantity.toFixed(1);
                        
                        // Yükseklik hesapla - değerlerle tam orantılı (günlük chart ile birebir aynı mantık)
                        let barHeight = 0; // Boş haftalar için 0
                        if (data.total > 0 && maxValue > 0) {
                            // Doğrudan orantılı hesaplama: minimum yükseklik kısıtlaması yok
                            const ratio = data.total / maxValue;
                            barHeight = ratio * maxBarHeight; // Tam orantılı
                        }
                        
                        return `
                            <div class="chart-column">
                                <div class="bar ${isSelected ? 'selected-week' : ''} ${data.total === 0 ? 'empty-week' : ''}" 
                                     style="height: ${barHeight}px !important; min-height: ${barHeight}px !important; max-height: ${barHeight}px !important; box-sizing: border-box; padding: 0;" 
                                     onclick="chartManager.selectWeek('${data.week}')" 
                                     data-tooltip='${JSON.stringify({
                                        header: "📊 Haftalık Planlama Özeti",
                                        rows: [
                                            { label: "Hafta", value: data.week },
                                            { label: "Planlanan İş Emri", value: uniqueItems },
                                            { label: "Toplam Ağırlık", value: `${formattedWeight} KG` },
                                            { label: "Toplam Brüt Ağırlık", value: `${formattedBrutAgirlik} KG` },
                                            { label: "Toplam Süre", value: `${formattedDuration} SAAT` },
                                            { label: "Planlanan Miktar", value: `${formattedQuantity} ADET` },
                                            { label: "Seçilen Değer", value: roundedTotal }
                                        ]
                                     })}'>
                                </div>
                                <div class="bar-value">${roundedTotal > 0 ? roundedTotal.toFixed(1) : ''}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="chart-labels">
                    ${weekData.map(data => {
                        // Hafta string'inden yılın kaçıncı haftası olduğunu çıkar
                        const weekNumber = data.week.split('-W')[1];
                        return `<span>${data.week}<br><small>Hafta ${weekNumber}</small></span>`;
                    }).join('')}
                </div>
            </div>
        `;
        
        } catch (error) {
            console.error('Haftalık chart güncelleme hatası:', error);
            weeksChart.innerHTML = '<div class="error">Haftalık veriler yüklenirken hata oluştu</div>';
        }
    }

    /**
     * Günlük chart'ı günceller
     * @param {string} week - Hafta bilgisi
     */
    async updateDaysChart(week) {
        const daysChart = document.getElementById('daysChart');
        if (!daysChart) return;

        // Week parametresi kontrolü
        if (!week || typeof week !== 'string') {
            console.error('updateDaysChart: Geçersiz week parametresi:', week);
            return;
        }

        try {
            // PLANLAMA_VERI verilerini tek noktadan cache'leyerek al
            const planningData = await this.getPlanningDataCached();
            
            // Hafta başlangıcını hesapla (Pazartesi)
            const weekStartDate = this.getWeekStartDate(week);
            console.log('🔍 Hafta başlangıç tarihi:', {
                week: week,
                weekStartDate: weekStartDate.toISOString().split('T')[0],
                weekStartDay: weekStartDate.getDay(), // 0=Pazar, 1=Pazartesi
                weekStartDayName: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][weekStartDate.getDay()]
            });
            
            const weekDays = [];
            const weekDateStrings = [];
            
            // Önce haftanın günlerini belirle (Pazartesi'den başlayarak)
            // Timezone sorunlarını önlemek için yerel tarih string'i kullan
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStartDate);
                date.setDate(date.getDate() + i);
                // Timezone sorunlarını önlemek için toISOString yerine yerel tarih kullan
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;
                weekDateStrings.push(dateString);
                console.log(`  Gün ${i}: ${dateString} - ${['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][date.getDay()]}`);
            }
            
            // Planlama verilerini planlanan tarihe göre grupla (makina ve bölüm filtresi ile)
            const groupedByDate = {};
            let filteredCount = 0;
            planningData.forEach(item => {
                let dateKey = item.planTarihi;
                if (!dateKey) return;
                
                // Tarihi normalize et (YYYY-MM-DD formatına çevir) - timezone sorunlarını önlemek için
                if (dateKey instanceof Date) {
                    // Date objesi ise, sadece tarih kısmını al (timezone'dan bağımsız)
                    const year = dateKey.getFullYear();
                    const month = String(dateKey.getMonth() + 1).padStart(2, '0');
                    const day = String(dateKey.getDate()).padStart(2, '0');
                    dateKey = `${year}-${month}-${day}`;
                } else if (typeof dateKey === 'string') {
                    // Eğer tarih string ise, formatı kontrol et
                    // Önce 'T' veya boşluk ile ayrılmış tarih kısmını al
                    if (dateKey.includes('T')) {
                        dateKey = dateKey.split('T')[0];
                    } else if (dateKey.includes(' ')) {
                        dateKey = dateKey.split(' ')[0];
                    }
                    // Eğer tarih farklı bir formatta ise (örn: DD.MM.YYYY), parse et
                    if (dateKey.includes('.')) {
                        const parts = dateKey.split('.');
                        if (parts.length === 3) {
                            dateKey = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                    }
                }
                
                // Sadece seçilen haftanın günlerini dahil et
                if (!weekDateStrings.includes(dateKey)) {
                    return;
                }
                
                // Bölüm filtresi uygula
                if (this.selectedDepartment && item.bolumAdi !== this.selectedDepartment) {
                    return;
                }
                
                // Makina filtresi uygula
                if (this.selectedMachine && item.makAd !== this.selectedMachine) {
                    return;
                }
                
                filteredCount++;
                if (!groupedByDate[dateKey]) {
                    groupedByDate[dateKey] = [];
                }
                groupedByDate[dateKey].push(item);
            });
            
            // Hafta günlerini oluştur (weekDateStrings ile aynı sırada)
            weekDateStrings.forEach((dateString, dayIndex) => {
                weekDays.push({
                    date: dateString,
                    items: groupedByDate[dateString] || [],
                    dayIndex: dayIndex // Gün indeksini de ekle
                });
            });
        
            // Eğer kırılım seçimi varsa, sadece hafta odaklanması yap (değerleri değiştirme)
            if (this.breakdownSelection?.planlananTarih) {
                const selDate = new Date(this.breakdownSelection.planlananTarih).toISOString().split('T')[0];
                // Kırılım seçimi sadece hafta odaklanması için, değerleri değiştirmiyoruz
            }

            // Maksimum değeri hesapla - günlük toplamlarından (en yüksek günlük toplam)
        // Önce tüm günlerin toplam değerlerini hesapla
        const dayTotals = weekDays.map((dayData) => {
            const dayItems = dayData.items || [];
            return dayItems.reduce((sum, item) => {
                let value = Number(item[this.valueType]) || 0;
                // Plan miktar seçildiğinde planlananMiktar/figurSayisi göster
                if (this.valueType === 'planlananMiktar') {
                    const figurSayisi = Number(item.figurSayisi) || 1;
                    value = figurSayisi > 0 ? (value / figurSayisi) : value;
                }
                return sum + value;
            }, 0);
        });
        const dayTotalsFiltered = dayTotals.filter(total => total > 0);
        const maxValue = dayTotalsFiltered.length > 0 ? Math.max(...dayTotalsFiltered) : 1;
        
        daysChart.innerHTML = `
            <div class="chart-wrapper">
                <div class="bar-chart">
                    ${weekDays.map((dayData, dayIndex) => {
                        const isSelected = dayIndex === this.selectedDayIndex;
                        let dayItems = dayData.items || [];
                        // Kırılım seçimi sadece hafta odaklanması için, değerleri değiştirmiyoruz
                        
                        // Toplam yükseklik hesapla - değerlerle tam orantılı
                        const totalValue = dayTotals[dayIndex];
                        let totalHeight = 5; // Minimum yükseklik
                        
                        if (totalValue > 0 && maxValue > 0) {
                            // Doğrudan orantılı hesaplama: minimum yükseklik kısıtlaması yok
                            const ratio = totalValue / maxValue;
                            totalHeight = ratio * 150; // Maksimum 150px, minimum yok (tam orantılı)
                            // Sadece çok küçük değerler için minimum 5px (görünürlük için)
                            if (totalHeight < 5 && totalHeight > 0) {
                                totalHeight = 5;
                            }
                        }
                        
                        return `
                            <div class="chart-column">
                                <div class="stacked-bar drop-zone ${isSelected ? 'selected-day' : ''}" 
                                     style="height: ${totalHeight}px; position: relative;" 
                                     data-date="${dayData.date}"
                                     data-day-index="${dayIndex}">
                                    <div class="day-total-value ${isSelected ? 'selected' : ''}">
                                        ${totalValue > 0 ? totalValue.toFixed(1) : ''}
                                    </div>
                                    ${dayItems.length > 0 ? dayItems.map((item, itemIndex) => {
                                        let itemValue = Number(item[this.valueType]) || 0;
                                        // Plan miktar seçildiğinde planlananMiktar/figurSayisi göster
                                        if (this.valueType === 'planlananMiktar') {
                                            const figurSayisi = Number(item.figurSayisi) || 1;
                                            itemValue = figurSayisi > 0 ? (itemValue / figurSayisi) : itemValue;
                                        }
                                        const segmentHeight = totalValue > 0 ? (itemValue / totalValue) * 100 : 0;
                                        const colorClass = itemIndex === 0 ? 'segment-1' : 
                                                         itemIndex === 1 ? 'segment-2' : 'segment-3';
                                        
                                        // Segment seçimi: breakdownSelection varsa planId ile eşleştir, yoksa normal seçim
                                        let isSegmentSelected = false;
                                        if (this.breakdownSelection?.planId) {
                                            // Plan ID ile tam eşleşme
                                            isSegmentSelected = String(item.planId) === String(this.breakdownSelection.planId);
                                            if (isSegmentSelected) {
                                                // Plan ID eşleştiğinde gün ve segment indekslerini güncelle
                                                this.selectedDayIndex = dayIndex;
                                                this.selectedSegmentIndex = itemIndex;
                                            }
                                        } else {
                                            // Normal seçim (kullanıcı tıklaması)
                                            isSegmentSelected = isSelected && this.selectedSegmentIndex === itemIndex;
                                        }
                                        
                                        return `
                                            <div class="stacked-segment draggable-bar ${colorClass} ${isSegmentSelected ? 'selected' : ''}" 
                                                 style="height: ${segmentHeight}%; cursor: grab;" 
                                                 draggable="true"
                                                 data-isemri-no="${item.isemriNo || ''}"
                                                 data-isemri-id="${item.isemriId || ''}"
                                                 data-plan-id="${item.planId || ''}"
                                                 data-day-index="${dayIndex}"
                                                 data-segment-index="${itemIndex}"
                                                 data-week="${week}"
                                                 onclick="chartManager.handleSegmentClick(event, this);" 
                                                 data-tooltip='${JSON.stringify({
                                                    header: "📋 Planlama Detayları",
                                                    rows: [
                                                        { label: "İş Emri No", value: item.isemriNo || 'N/A' },
                                                        { label: "İş Emri ID", value: item.isemriId || 'N/A' },
                                                        { label: "Plan ID", value: item.planId || 'N/A' },
                                                        { label: "Malzeme Kodu", value: item.malhizKodu || 'N/A' },
                                                        { label: "Malzeme", value: item.imalatTuru || 'N/A' },
                                                        { label: "Plan Tarihi", value: new Date(dayData.date).toLocaleDateString('tr-TR') },
                                                        { label: "Ağırlık", value: `${(Number(item.agirlik) || 0).toFixed(1)} KG` },
                                                        { label: "Brüt Ağırlık", value: `${(Number(item.brutAgirlik) || 0).toFixed(1)} KG` },
                                                        { label: "Toplam Süre", value: `${(Number(item.toplamSure) || 0).toFixed(2)} SAAT` },
                                                        { label: "Planlanan Miktar", value: `${item.planlananMiktar || 0} ADET` },
                                                        { label: "Firma", value: item.firmaAdi || 'N/A' },
                                                        { label: "Makina", value: item.makAd || 'N/A' },
                                                        { label: "Bölüm", value: item.bolumAdi || 'N/A' }
                                                    ]
                                                 })}'>
                                            </div>
                                        `;
                                    }).join('') : `
                                        <div class="stacked-segment segment-1" 
                                             style="height: 100%; opacity: 0.3; cursor: pointer;" 
                                             onclick="chartManager.selectDay(${dayIndex}, '${week}')" 
                                             title="Önerilen Teslim: ${new Date(dayData.date).toLocaleDateString('tr-TR')} - Veri yok">
                                        </div>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="chart-labels">
                    ${weekDays.map((dayData, index) => {
                        // Tarih string'ini parse et (YYYY-MM-DD formatı)
                        const [year, month, day] = dayData.date.split('-');
                        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        date.setHours(0, 0, 0, 0);
                        
                        const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
                        const dayIndex = date.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
                        const dayNameIndex = (dayIndex + 6) % 7; // Pazartesi=0, Pazar=6
                        const dayName = dayNames[dayNameIndex];
                        const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
                        
                        console.log(`  Chart label ${index}: ${dayData.date} -> ${dayName} ${dateStr} (getDay: ${dayIndex})`);
                        
                        return `<span title="Önerilen Teslim: ${dateStr}/${date.getFullYear()}">${dayName}<br>${dateStr}</span>`;
                    }).join('')}
                </div>
            </div>
        `;
        
        } catch (error) {
            console.error('Günlük chart güncelleme hatası:', error);
            daysChart.innerHTML = '<div class="error">Günlük veriler yüklenirken hata oluştu</div>';
        }
    }

    // Basit bellek cache: planning-data 30sn sakla
    async getPlanningDataCached() {
        const now = Date.now();
        if (this._planningDataCache && (now - this._planningDataCache.ts < 30000)) {
            return this._planningDataCache.data;
        }
        const resp = await fetch('/api/planning-data');
        const json = await resp.json();
        const data = json.success ? json.data : [];
        this._planningDataCache = { ts: now, data };
        return data;
    }

    /**
     * Planning data cache'ini temizler
     */
    clearPlanningDataCache() {
        this._planningDataCache = null;
    }

    /**
     * Hafta seçer
     * @param {string} week - Hafta bilgisi
     */
    async selectWeek(week) {
        this.selectedWeek = week;
        this.selectedDayIndex = -1;
        this.selectedSegmentIndex = -1;
        
        await this.updateDaysChart(week);
        await this.updateWeeksChart(); // Haftalık chart'ı güncelle ki seçili hafta vurgulansın
        
        this.onWeekSelected(week);
    }

    /**
     * Gün seçer
     * @param {number} dayIndex - Gün indeksi
     * @param {string} week - Hafta bilgisi
     * @param {boolean} skipCallback - Callback'i atla mı? (focusOnWeek'ten çağrıldığında true)
     */
    async selectDay(dayIndex, week, skipCallback = false) {
        this.selectedDayIndex = dayIndex;
        this.selectedSegmentIndex = -1;
        
        // Günlük chart'ı güncelle ki seçili gün vurgulansın
        await this.updateDaysChart(week);
        
        // Sadece chart'tan tıklandığında callback'i çağır (focusOnWeek'ten değil)
        if (!skipCallback) {
            this.onDaySelected(dayIndex, week);
        }
    }

    /**
     * Segment tıklama event handler'ı
     * @param {Event} event - Mouse event
     * @param {HTMLElement} element - Tıklanan element
     */
    handleSegmentClick(event, element) {
        // Eğer Ctrl/Cmd tuşu basılıysa, çoklu seçim yapılacak, normal seçim yapma
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            event.stopPropagation();
            return; // Çoklu seçim initMultiSelect'teki mousedown event'i ile yapılacak
        }
        
        // Normal seçim yap
        this.selectSegmentFromElement(element);
    }
    
    /**
     * Element'ten segment seçer (güvenli yöntem)
     * @param {HTMLElement} element - Tıklanan element
     */
    async selectSegmentFromElement(element) {
        const dayIndex = parseInt(element.dataset.dayIndex);
        const segmentIndex = parseInt(element.dataset.segmentIndex);
        const week = element.dataset.week;
        const isemriNo = element.dataset.isemriNo;
        
        // Önce günü seç (gün filtresi için)
        this.selectedDayIndex = dayIndex;
        this.selectedSegmentIndex = -1; // Segment seçimini geçici olarak sıfırla
        await this.updateDaysChart(week);
        // Eğer skipDaySelectedCallback flag'i set edilmişse, callback'i atla (tablodan tıklandığında)
        if (!this._skipDaySelectedCallback) {
            this.onDaySelected(dayIndex, week); // Gün filtresini uygula
        }
        
        // Sonra segment'i seç
        this.selectedSegmentIndex = segmentIndex;
        await this.updateDaysChart(week);
        this.onSegmentSelected(isemriNo, dayIndex, segmentIndex);
    }

    /**
     * Segment seçer
     * @param {number} dayIndex - Gün indeksi
     * @param {number} segmentIndex - Segment indeksi
     * @param {string} week - Hafta bilgisi
     * @param {string} isemriNo - İş emri numarası
     */
    async selectSegment(dayIndex, segmentIndex, week, isemriNo) {
        // Önce günü seç (gün filtresi için)
        this.selectedDayIndex = dayIndex;
        this.selectedSegmentIndex = -1; // Segment seçimini geçici olarak sıfırla
        await this.updateDaysChart(week);
        // Eğer skipDaySelectedCallback flag'i set edilmişse, callback'i atla (tablodan tıklandığında)
        if (!this._skipDaySelectedCallback) {
            this.onDaySelected(dayIndex, week); // Gün filtresini uygula
        }
        
        // Sonra segment'i seç
        this.selectedSegmentIndex = segmentIndex;
        await this.updateDaysChart(week);
        this.onSegmentSelected(isemriNo, dayIndex, segmentIndex);
    }

    /**
     * Tarihten hafta string'i oluşturur
     * @param {Date} date - Tarih
     * @returns {string} Hafta string'i (örn: "2024-W41")
     */
    getWeekString(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
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
     * Tarihten hafta numarasını hesaplar (ISO standardı)
     * @param {Date} date - Tarih
     * @returns {number} Hafta numarası
     */
    getWeekNumber(date) {
        const weekString = this.getWeekString(date);
        return parseInt(weekString.split('-W')[1]);
    }

    /**
     * Hafta başlangıç tarihini hesaplar
     * @param {string} weekString - Hafta string'i
     * @returns {Date} Hafta başlangıç tarihi
     */
    getWeekStartDate(weekString) {
        if (!weekString || typeof weekString !== 'string') {
            console.error('getWeekStartDate: Geçersiz weekString:', weekString);
            return new Date(); // Varsayılan olarak bugünün tarihi
        }
        
        const [year, weekNum] = weekString.split('-W');
        if (!year || !weekNum) {
            console.error('getWeekStartDate: Hafta string formatı hatalı:', weekString);
            return new Date(); // Varsayılan olarak bugünün tarihi
        }
        
        // ISO hafta standardı: Hafta Pazartesi'den başlar
        // ISO 8601: 1. hafta, yılın en az 4 gününü içeren ilk haftadır
        // Bu genellikle 4 Ocak'ı içeren haftadır
        
        // 4 Ocak'ı al (ISO standardına göre 1. hafta her zaman 4 Ocak'ı içerir)
        const jan4 = new Date(parseInt(year), 0, 4);
        jan4.setHours(0, 0, 0, 0);
        
        // 4 Ocak'ın hangi gün olduğunu bul (0=Pazar, 1=Pazartesi, ..., 6=Cumartesi)
        const jan4Day = jan4.getDay();
        
        // 4 Ocak'ın bulunduğu haftanın Pazartesi'sini bul
        // Eğer 4 Ocak Pazartesi ise (1), 0 gün geriye git
        // Eğer 4 Ocak Pazar ise (0), 6 gün geriye git (önceki Pazartesi)
        // Eğer 4 Ocak Salı ise (2), 1 gün geriye git
        // Genel formül: (jan4Day + 6) % 7 gün geriye git
        const daysToSubtract = (jan4Day + 6) % 7;
        const week1Monday = new Date(jan4);
        week1Monday.setDate(jan4.getDate() - daysToSubtract);
        week1Monday.setHours(0, 0, 0, 0);
        
        // İstenen haftanın Pazartesi'sini hesapla
        const weekStartDate = new Date(week1Monday);
        weekStartDate.setDate(week1Monday.getDate() + (parseInt(weekNum) - 1) * 7);
        weekStartDate.setHours(0, 0, 0, 0);
        
        // Yerel tarih string'i oluştur (timezone sorunlarını önlemek için)
        const localDateStr = `${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}`;
        
        // Test: 11/01/2026'nın hangi gün olduğunu kontrol et
        const testDate = new Date(2026, 0, 11);
        testDate.setHours(0, 0, 0, 0);
        const testDay = testDate.getDay();
        
        console.log('🔍 getWeekStartDate hesaplama:', {
            weekString,
            year,
            weekNum,
            jan4: `${jan4.getFullYear()}-${String(jan4.getMonth() + 1).padStart(2, '0')}-${String(jan4.getDate()).padStart(2, '0')}`,
            jan4Day,
            daysToSubtract,
            week1Monday: `${week1Monday.getFullYear()}-${String(week1Monday.getMonth() + 1).padStart(2, '0')}-${String(week1Monday.getDate()).padStart(2, '0')}`,
            weekStartDate: localDateStr,
            weekStartDay: weekStartDate.getDay(),
            weekStartDayName: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][weekStartDate.getDay()],
            test_11_01_2026: {
                date: '2026-01-11',
                day: testDay,
                dayName: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][testDay]
            }
        });
        
        return weekStartDate;
    }

    /**
     * Hafta aralığını ayarlar
     * @param {number} startWeek - Başlangıç haftası
     * @param {number} endWeek - Bitiş haftası
     */
    /**
     * Yıl ile birlikte hafta aralığını ayarlar
     * @param {number} startYear - Başlangıç yılı
     * @param {number} startWeek - Başlangıç haftası
     * @param {number} endYear - Bitiş yılı
     * @param {number} endWeek - Bitiş haftası
     * @param {boolean} skipUpdate - Chart güncellemesini atla (varsayılan: false)
     * @param {string|null} selectedWeek - Seçili hafta (opsiyonel, verilmezse ilk hafta seçilir)
     */
    setWeekRangeWithYear(startYear, startWeek, endYear, endWeek, skipUpdate = false, selectedWeek = null) {
        this.weekRange = { start: startWeek, end: endWeek };
        this.weekRangeYears = { start: startYear, end: endYear }; // Yıl bilgilerini sakla
        this.weekRangeSize = this.calculateWeekRangeSize(startYear, startWeek, endYear, endWeek);
        
        // Seçili haftayı ayarla: eğer selectedWeek parametresi verilmişse onu kullan,
        // yoksa ilk haftayı seçili yap
        if (selectedWeek !== null) {
            this.selectedWeek = selectedWeek;
        } else {
            this.selectedWeek = `${startYear}-W${String(startWeek).padStart(2, '0')}`;
        }
        
        // Chart'ları güncelle (skipUpdate true ise atla)
        if (!skipUpdate) {
            this.updateCharts();
        }
    }
    
    /**
     * Hafta aralığı boyutunu hesaplar (yıl değişimlerini dikkate alarak)
     * @param {number} startYear - Başlangıç yılı
     * @param {number} startWeek - Başlangıç haftası
     * @param {number} endYear - Bitiş yılı
     * @param {number} endWeek - Bitiş haftası
     * @returns {number} Toplam hafta sayısı
     */
    calculateWeekRangeSize(startYear, startWeek, endYear, endWeek) {
        if (startYear === endYear) {
            return endWeek - startWeek + 1;
        } else {
            // Yıl değişimi varsa, başlangıç yılının kalan haftaları + ara yıllar + bitiş yılının haftaları
            const startYearWeeks = 52 - startWeek + 1; // Başlangıç yılının kalan haftaları
            const middleYears = endYear - startYear - 1; // Ara yıllar
            const endYearWeeks = endWeek; // Bitiş yılının haftaları
            
            return startYearWeeks + (middleYears * 52) + endYearWeeks;
        }
    }
    
    /**
     * Belirli bir haftaya odaklanır (tablodan seçim yapıldığında)
     * @param {string} weekString - Odaklanılacak hafta
     * @param {string} targetDate - Hedef tarih (opsiyonel, gün seçimi için)
     * @param {string} isemriNo - İş emri numarası (opsiyonel, segment seçimi için)
     */
    async focusOnWeek(weekString, targetDate = null, isemriNo = null) {
        // Tablodan tıklandığında tarih filtresinin uygulanmaması için flag
        this._skipWeekSelectedCallback = true;
        this._skipDaySelectedCallback = true;
        this.selectedWeek = weekString;
        
        // Seçilen haftayı merkeze alarak hafta aralığı oluştur
        const weekNumber = parseInt(weekString.split('-W')[1]);
        const weekYear = parseInt(weekString.split('-W')[0]);
        
        // weekRangeSize'ı kontrol et ve gerekirse varsayılan değeri kullan
        // Eğer weekRangeSize yoksa veya geçersizse, varsayılan değeri kullan
        if (!this.weekRangeSize || this.weekRangeSize < 1 || this.weekRangeSize > 20) {
            this.weekRangeSize = 4; // Varsayılan 4 hafta
        }
        
        // Bir yıldaki hafta sayısını hesapla (ISO 8601 standardına göre)
        const getWeeksInYear = (year) => {
            // O yılın 28 Aralık'ının hafta numarasını bul (31 Aralık bir sonraki yılın ilk haftasında olabilir)
            const dec28 = new Date(year, 11, 28);
            const weekString = this.getWeekString(dec28);
            if (weekString) {
                const weekYear = parseInt(weekString.split('-W')[0]);
                const weekNum = parseInt(weekString.split('-W')[1]);
                // Eğer hafta yılı farklıysa, o yılın son haftasına bak
                if (weekYear !== year) {
                    // Bir önceki haftaya bak
                    const dec21 = new Date(year, 11, 21);
                    const weekString21 = this.getWeekString(dec21);
                    if (weekString21) {
                        const weekNum21 = parseInt(weekString21.split('-W')[1]);
                        return weekNum21;
                    }
                }
                // Eğer hafta numarası 52 veya daha küçükse, o yıl 52 hafta
                // Eğer 53 ise, o yıl 53 hafta
                return weekNum;
            }
            // Fallback: Genellikle 52 hafta
            return 52;
        };
        
        // BASİT MANTIK: Seçilen haftayı merkeze al, tam weekRangeSize kadar hafta göster
        const halfRange = Math.floor(this.weekRangeSize / 2);
        
        // Başlangıç haftasını hesapla (seçilen haftanın öncesinde halfRange kadar)
        let startWeek = weekNumber - halfRange;
        // Bitiş haftasını hesapla (başlangıçtan itibaren weekRangeSize kadar)
        let endWeek = startWeek + this.weekRangeSize - 1;
        
        // Yılın son haftasını al
        const currentYearLastWeek = getWeeksInYear(weekYear);
        
        console.log('focusOnWeek - İlk hesaplama:', {
            weekNumber,
            halfRange,
            startWeek: weekNumber - halfRange,
            endWeek: (weekNumber - halfRange) + this.weekRangeSize - 1,
            currentYearLastWeek,
            weekYear
        });
        
        // Sınırları kontrol et ve ayarla
        if (startWeek < 1) {
            startWeek = 1;
            endWeek = Math.min(currentYearLastWeek, startWeek + this.weekRangeSize - 1);
        }
        if (endWeek > currentYearLastWeek) {
            // Eğer currentYearLastWeek geçersizse (1 veya çok küçükse), varsayılan değer kullan
            if (currentYearLastWeek < 10) {
                console.warn('getWeeksInYear geçersiz değer döndürdü:', currentYearLastWeek, 'Varsayılan 52 kullanılıyor');
                endWeek = weekNumber + halfRange;
                startWeek = weekNumber - halfRange;
            } else {
                endWeek = currentYearLastWeek;
                startWeek = Math.max(1, endWeek - this.weekRangeSize + 1);
            }
        }
        
        // Hafta aralığını ve yıl bilgilerini güncelle
        this.weekRange = { start: startWeek, end: endWeek };
        this.weekRangeYears = { start: weekYear, end: weekYear };
        
        console.log('focusOnWeek - Hafta aralığı:', {
            weekString,
            weekNumber,
            weekRangeSize: this.weekRangeSize,
            halfRange,
            startWeek,
            endWeek,
            totalWeeks: endWeek - startWeek + 1
        });
        
        // Dropdown'ları güncelle (DataGrid'deki populateWeekRangeSelectors fonksiyonunu çağır)
        // Not: populateWeekRangeSelectors setWeekRangeWithYear'i skipUpdate=true ile çağırır,
        // bu yüzden updateCharts sadece bir kez aşağıda çağrılacak
        // Ayrıca selectedWeek parametresini geçiyoruz ki doğru hafta seçili kalsın
        if (window.dataGrid && typeof window.dataGrid.populateWeekRangeSelectors === 'function') {
            window.dataGrid.populateWeekRangeSelectors(weekYear, startWeek, endWeek, weekString);
        }
        
        // Chart'ları güncelle (populateWeekRangeSelectors'tan gelen setWeekRangeWithYear çağrısı
        // skipUpdate=true ile yapıldığı için burada tek bir updateCharts çağrısı yeterli)
        await this.updateCharts();
        
        // Eğer hedef tarih verilmişse, o günü ve segment'i seç
        if (targetDate) {
            // Tarihi normalize et (YYYY-MM-DD formatına çevir)
            let targetDateStr = targetDate;
            if (targetDate instanceof Date) {
                targetDateStr = targetDate.toISOString().split('T')[0];
            } else if (typeof targetDate === 'string') {
                // Eğer tarih string ise, formatı kontrol et
                if (targetDate.includes('T')) {
                    targetDateStr = targetDate.split('T')[0];
                } else if (targetDate.includes(' ')) {
                    targetDateStr = targetDate.split(' ')[0];
                } else if (targetDate.includes('.')) {
                    // DD.MM.YYYY formatından YYYY-MM-DD formatına çevir
                    const parts = targetDate.split('.');
                    if (parts.length === 3) {
                        targetDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }
            }
            
            console.log('focusOnWeek - Tarih normalleştirme:', {
                original: targetDate,
                normalized: targetDateStr,
                weekString: weekString
            });
            
            // Hafta başlangıcından gün indeksini hesapla (DOM'a bağımlı olmadan)
            const weekStartDate = this.getWeekStartDate(weekString);
            const weekStartNormalized = new Date(weekStartDate);
            weekStartNormalized.setHours(0, 0, 0, 0);
            
            const targetDateObj = new Date(targetDateStr);
            if (isNaN(targetDateObj.getTime())) {
                console.error('focusOnWeek - Geçersiz tarih:', targetDateStr);
            } else {
                targetDateObj.setHours(0, 0, 0, 0);
                
                const dayDiff = Math.floor((targetDateObj - weekStartNormalized) / (1000 * 60 * 60 * 24));
                let dayIndex = Math.max(0, Math.min(6, dayDiff));
                
                console.log('focusOnWeek - Gün hesaplama:', {
                    targetDate: targetDateStr,
                    weekStartDate: weekStartDate,
                    dayDiff: dayDiff,
                    dayIndex: dayIndex
                });
                
                // Günü seç (updateDaysChart tekrar çağrılacak ama selectedDayIndex set edilecek)
                // skipCallback=true: Tablodan tıklandığında filtre uygulanmaması için
                await this.selectDay(dayIndex, weekString, true);
                
                // Eğer isemriNo verilmişse, o günde ilgili segment'i bul ve seç
                if (isemriNo) {
                    // Günlük chart güncellendiğinde segment'i bulmak için kısa bir gecikme
                    setTimeout(() => {
                        // Önce doğru gün indeksine sahip segment'i bul
                        const segmentElement = document.querySelector(
                            `.stacked-segment[data-isemri-no="${isemriNo}"][data-day-index="${dayIndex}"]`
                        );
                        if (segmentElement) {
                            const segmentIndex = parseInt(segmentElement.dataset.segmentIndex);
                            console.log('Segment bulundu:', { isemriNo, dayIndex, segmentIndex });
                            this.selectSegment(dayIndex, segmentIndex, weekString, isemriNo);
                        } else {
                            // Eğer bulunamazsa, tüm günlerde ara (fallback)
                            const allSegments = document.querySelectorAll(
                                `.stacked-segment[data-isemri-no="${isemriNo}"]`
                            );
                            if (allSegments.length > 0) {
                                const firstSegment = allSegments[0];
                                const foundDayIndex = parseInt(firstSegment.dataset.dayIndex);
                                const foundSegmentIndex = parseInt(firstSegment.dataset.segmentIndex);
                                console.log('Segment farklı günde bulundu:', { 
                                    isemriNo, 
                                    expectedDayIndex: dayIndex, 
                                    foundDayIndex, 
                                    foundSegmentIndex 
                                });
                                this.selectSegment(foundDayIndex, foundSegmentIndex, weekString, isemriNo);
                            } else {
                                console.warn('Segment bulunamadı:', { isemriNo, dayIndex, targetDate: targetDateStr });
                            }
                        }
                    }, 300);
                }
            }
        }
        
        // Flag'leri temizle
        this._skipWeekSelectedCallback = false;
        this._skipDaySelectedCallback = false;
    }
    onWeekSelected(week) {
        // Bu metod alt sınıflarda override edilebilir
    }

    /**
     * Gün seçildiğinde çağrılan callback
     * @param {number} dayIndex - Gün indeksi
     * @param {string} week - Hafta bilgisi
     */
    onDaySelected(dayIndex, week) {
        // Bu metod alt sınıflarda override edilebilir
    }

    /**
     * Segment seçildiğinde çağrılan callback
     * @param {string} isemriNo - İş emri numarası
     * @param {number} dayIndex - Gün indeksi
     * @param {number} segmentIndex - Segment indeksi
     */
    onSegmentSelected(isemriNo, dayIndex, segmentIndex) {
        // Bu metod alt sınıflarda override edilebilir
        
        // Tablodaki ilgili satırı seç
        if (window.dataGrid && isemriNo) {
            window.dataGrid.selectRowByIsemriNo(isemriNo);
        }
    }

    /**
     * Drag & Drop özelliğini başlatır
     */
    initDragAndDrop() {
        // Drag & Drop event listener'ları document'e eklenir
        // Çünkü chart'lar dinamik olarak yeniden oluşturuluyor
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('dragenter', this.handleDragEnter.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));
    }

    /**
     * Drag başladığında çalışır
     */
    handleDragStart(e) {
        const segment = e.target.closest('.draggable-bar');
        if (!segment) return;
        
        // Eğer Ctrl tuşu basılıysa drag işlemini engelle (sadece seçim yapılacak)
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            return;
        }
        
        // Eğer seçili segment'ler varsa, çoklu taşıma için hazırla
        if (this.selectedSegments.size > 0) {
            // Seçili segment'lerin planId'lerini sakla
            const selectedPlanIds = Array.from(this.selectedSegments);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify({
                isMultiSelect: true,
                selectedPlanIds: selectedPlanIds,
                draggedSegment: {
                    isemriNo: segment.dataset.isemriNo,
                    isemriId: segment.dataset.isemriId,
                    planId: segment.dataset.planId,
                    dayIndex: segment.dataset.dayIndex,
                    segmentIndex: segment.dataset.segmentIndex,
                    week: segment.dataset.week
                }
            }));
            
            // Tüm seçili segment'leri dragging olarak işaretle
            selectedPlanIds.forEach(planId => {
                const selectedSegment = document.querySelector(`.draggable-bar[data-plan-id="${planId}"]`);
                if (selectedSegment) {
                    selectedSegment.classList.add('dragging');
                }
            });
        } else {
            // Tek segment taşıma (eski davranış)
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify({
                isMultiSelect: false,
                isemriNo: segment.dataset.isemriNo,
                isemriId: segment.dataset.isemriId,
                planId: segment.dataset.planId,
                dayIndex: segment.dataset.dayIndex,
                segmentIndex: segment.dataset.segmentIndex,
                week: segment.dataset.week
            }));

            segment.classList.add('dragging');
        }
        
        // Tüm drop zone'ları aktif hale getir
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.style.pointerEvents = 'auto';
        });
    }

    /**
     * Drag over event'i
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    /**
     * Drag enter event'i
     */
    handleDragEnter(e) {
        const dropZone = e.target.closest('.drop-zone');
        if (!dropZone) return;

        dropZone.classList.add('drag-over');
    }

    /**
     * Drag leave event'i
     */
    handleDragLeave(e) {
        const dropZone = e.target.closest('.drop-zone');
        if (!dropZone) return;

        // Eğer mouse hala drop zone içindeyse çıkarma
        if (dropZone.contains(e.relatedTarget)) return;
        
        dropZone.classList.remove('drag-over');
    }

    /**
     * Drop event'i
     */
    async handleDrop(e) {
        e.preventDefault();
        
        const dropZone = e.target.closest('.drop-zone');
        if (!dropZone) return;

        try {
            let dragData;
            try {
                dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            } catch (error) {
                console.error('Drag data parse hatası:', error);
                dragData = {};
            }
            
            const targetDate = dropZone.dataset.date;
            
            // Eğer çoklu seçim varsa veya seçili segment'ler varsa, toplu taşıma yap
            if ((dragData.isMultiSelect && dragData.selectedPlanIds && dragData.selectedPlanIds.length > 0) || 
                this.selectedSegments.size > 0) {
                if (targetDate) {
                    await this.moveSelectedSegments(targetDate);
                    // Seçimi temizle
                    this.clearSelection();
                    return;
                }
            }
            
            // Tek segment taşıma (eski davranış)
            console.log('Drop işlemi başladı:', { dragData, targetDate });
            
            if (!dragData.planId || !targetDate) {
                throw new Error('Eksik veri: planId veya targetDate');
            }

            console.log('Backend\'e istek gönderiliyor:', { planId: dragData.planId, newDate: targetDate });

            // Plan tarihini güncelle
            const result = await this.updatePlanDate(dragData.planId, targetDate);
            console.log('Backend\'den gelen sonuç:', result);
            
            // Cache'i güncelle (Oracle'dan veri çekme)
            if (window.dataGrid && typeof window.dataGrid.updatePlanDateInCache === 'function') {
                window.dataGrid.updatePlanDateInCache(dragData.planId, targetDate);
            }
            
            // Chart'ları yenile
            await this.refreshCharts();
            
            // Başarı mesajı
            this.showSuccessMessage(`Plan tarihi ${new Date(targetDate).toLocaleDateString('tr-TR')} olarak güncellendi`);
            
        } catch (error) {
            console.error('Drop işlemi hatası:', error);
            this.showErrorMessage('Plan tarihi güncellenirken hata oluştu');
        }
    }

    /**
     * Drag bittiğinde çalışır
     */
    handleDragEnd(e) {
        // Tüm dragging class'larını kaldır
        document.querySelectorAll('.dragging').forEach(el => {
            el.classList.remove('dragging');
        });
        
        // Drop zone'ları tekrar pasif hale getir
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.style.pointerEvents = '';
        });
        
        // Tüm drag-over class'larını kaldır
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        
        // Drop zone'ları tekrar pasif hale getir
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.style.pointerEvents = 'none';
        });
    }

    /**
     * Plan tarihini günceller
     */
    async updatePlanDate(planId, newDate, selectedMachine = null) {
        try {
            console.log('updatePlanDate çağrıldı:', { planId, newDate, selectedMachine });
            
            const requestBody = {
                planId: planId,
                newDate: newDate
            };
            
            // Eğer makine değişikliği varsa ekle
            if (selectedMachine) {
                requestBody.selectedMachine = selectedMachine;
            }
            
            const response = await fetch('/api/planning/update-date', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Response result:', result);
            return result;
            
        } catch (error) {
            console.error('Plan tarihi güncelleme hatası:', error);
            throw error;
        }
    }
    
    /**
     * Makine değiştirme fonksiyonu
     */
    async updateMachine(planId, isemriId, newMachine) {
        try {
            console.log('updateMachine çağrıldı:', { planId, isemriId, newMachine });
            
            if (!isemriId || !newMachine) {
                console.warn('isemriId veya newMachine eksik, makine güncelleme atlanıyor');
                return;
            }
            
            const response = await fetch('/api/planning/update-machine', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    isemriId: isemriId,
                    newMachine: newMachine
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Makine güncelleme sonucu:', result);
            return result;
            
        } catch (error) {
            console.error('Makine güncelleme hatası:', error);
            throw error;
        }
    }

    /**
     * Toplu seçim özelliğini başlatır
     */
    initMultiSelect() {
        // Chart wrapper'a context menu event listener'ı ekle
        document.addEventListener('contextmenu', (e) => {
            const chartWrapper = e.target.closest('.chart-wrapper');
            const segment = e.target.closest('.draggable-bar');
            
            // Eğer chart wrapper içindeyse ve seçili segment'ler varsa, chart context menu'yu göster
            if (chartWrapper && this.selectedSegments.size > 0) {
                e.preventDefault();
                this.showChartContextMenu(e);
                return;
            }
        });
        
        // Chart wrapper'a event listener'ları ekle
        document.addEventListener('mousedown', (e) => {
            const chartWrapper = e.target.closest('.chart-wrapper');
            const segment = e.target.closest('.draggable-bar');
            const dropZone = e.target.closest('.drop-zone');
            
            // Eğer bir drop zone'a tıklandıysa ve seçili segmentler varsa, toplu taşıma yap
            if (dropZone && this.selectedSegments.size > 0 && !segment) {
                const targetDate = dropZone.dataset.date;
                if (targetDate) {
                    e.preventDefault();
                    this.moveSelectedSegments(targetDate);
                    return;
                }
            }
            
            // Eğer bir segment'e tıklandıysa ve Ctrl/Cmd tuşu basılıysa, çoklu seçim yap
            if (segment && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // Diğer event listener'ları da durdur
                
                // Drag işlemini engelle (sadece seçim yapılacak)
                segment.draggable = false;
                
                // Tıklanan noktadaki tüm segment'leri bul (üst üste gelen segment'ler için)
                const allSegmentsAtPoint = this.getSegmentsAtPoint(e.clientX, e.clientY);
                
                if (allSegmentsAtPoint.length > 1) {
                    // Birden fazla segment varsa, döngüsel olarak bir sonraki segment'i seç
                    const currentIndex = allSegmentsAtPoint.findIndex(s => s === segment);
                    const nextIndex = (currentIndex + 1) % allSegmentsAtPoint.length;
                    const nextSegment = allSegmentsAtPoint[nextIndex];
                    
                    // Önceki segment'in seçimini kaldır (görsel geri bildirim için)
                    segment.classList.remove('multi-selected');
                    
                    // Yeni segment'i seç
                    const planId = nextSegment.dataset.planId;
                    if (planId) {
                        if (this.selectedSegments.has(planId)) {
                            this.selectedSegments.delete(planId);
                            nextSegment.classList.remove('multi-selected');
                        } else {
                            this.selectedSegments.add(planId);
                            nextSegment.classList.add('multi-selected');
                        }
                    }
                } else {
                    // Tek segment varsa normal seçim yap
                    const planId = segment.dataset.planId;
                    if (planId) {
                        if (this.selectedSegments.has(planId)) {
                            this.selectedSegments.delete(planId);
                            segment.classList.remove('multi-selected');
                        } else {
                            this.selectedSegments.add(planId);
                            segment.classList.add('multi-selected');
                        }
                    }
                }
                
                // Drag'ı tekrar aktif et (kısa bir gecikme ile)
                setTimeout(() => {
                    segment.draggable = true;
                }, 100);
                
                return false; // Event'in devam etmesini engelle
            }
            
            // Ctrl tuşu basılı değilse ve segment'e tıklandıysa, seçimi temizle
            if (segment && !(e.ctrlKey || e.metaKey) && !e.shiftKey) {
                // Eğer seçili segment'ler varsa ve bu segment seçili değilse, seçimi temizle
                if (this.selectedSegments.size > 0) {
                    const planId = segment.dataset.planId;
                    if (!this.selectedSegments.has(planId)) {
                        this.clearSelection();
                    }
                }
            }
            
            // Eğer chart wrapper içinde ama segment dışındaysa, seçim kutusu başlat
            if (chartWrapper && !segment && e.button === 0 && !dropZone) {
                // Shift tuşu basılı değilse, mevcut seçimi temizle
                if (!e.shiftKey) {
                    this.clearSelection();
                }
                
                this.isSelecting = true;
                const rect = chartWrapper.getBoundingClientRect();
                this.selectionStart = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                
                // Seçim kutusunu oluştur
                this.createSelectionBox(chartWrapper, this.selectionStart.x, this.selectionStart.y);
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isSelecting) return;
            
            const chartWrapper = document.querySelector('.chart-wrapper');
            if (!chartWrapper) return;
            
            const rect = chartWrapper.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            // Seçim kutusunu güncelle
            this.updateSelectionBox(currentX, currentY);
            
            // Seçim kutusu içindeki segmentleri seç
            this.selectSegmentsInBox();
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.isSelecting) {
                this.isSelecting = false;
                this.removeSelectionBox();
            }
        });
    }
    
    /**
     * Seçim kutusunu oluşturur
     */
    createSelectionBox(container, startX, startY) {
        this.removeSelectionBox(); // Önceki kutu varsa kaldır
        
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'selection-box';
        this.selectionBox.style.cssText = `
            position: absolute;
            left: ${startX}px;
            top: ${startY}px;
            width: 0;
            height: 0;
            border: 2px dashed #3498db;
            background: rgba(52, 152, 219, 0.1);
            pointer-events: none;
            z-index: 1000;
        `;
        
        container.style.position = 'relative';
        container.appendChild(this.selectionBox);
    }
    
    /**
     * Seçim kutusunu günceller
     */
    updateSelectionBox(currentX, currentY) {
        if (!this.selectionBox) return;
        
        const left = Math.min(this.selectionStart.x, currentX);
        const top = Math.min(this.selectionStart.y, currentY);
        const width = Math.abs(currentX - this.selectionStart.x);
        const height = Math.abs(currentY - this.selectionStart.y);
        
        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
    }
    
    /**
     * Seçim kutusu içindeki segmentleri seçer
     */
    selectSegmentsInBox() {
        if (!this.selectionBox) return;
        
        const boxRect = this.selectionBox.getBoundingClientRect();
        const segments = document.querySelectorAll('.draggable-bar');
        
        segments.forEach(segment => {
            const segmentRect = segment.getBoundingClientRect();
            const planId = segment.dataset.planId;
            
            if (!planId) return;
            
            // Segment seçim kutusu içinde mi kontrol et
            const isInside = !(
                segmentRect.right < boxRect.left ||
                segmentRect.left > boxRect.right ||
                segmentRect.bottom < boxRect.top ||
                segmentRect.top > boxRect.bottom
            );
            
            if (isInside) {
                this.selectedSegments.add(planId);
                segment.classList.add('multi-selected');
            }
        });
    }
    
    /**
     * Seçimi temizler
     */
    clearSelection() {
        this.selectedSegments.clear();
        document.querySelectorAll('.multi-selected').forEach(el => {
            el.classList.remove('multi-selected');
        });
    }
    
    /**
     * Seçim kutusunu kaldırır
     */
    removeSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
    }
    
    /**
     * Belirli bir noktadaki tüm segment'leri bulur (üst üste gelen segment'ler için)
     * @param {number} clientX - Mouse X koordinatı
     * @param {number} clientY - Mouse Y koordinatı
     * @returns {Array} Tıklanan noktadaki tüm segment'ler (z-index'e göre sıralı)
     */
    getSegmentsAtPoint(clientX, clientY) {
        const segments = document.querySelectorAll('.draggable-bar');
        const segmentsAtPoint = [];
        
        segments.forEach(segment => {
            const rect = segment.getBoundingClientRect();
            // Tıklanan nokta segment'in içinde mi kontrol et
            if (clientX >= rect.left && clientX <= rect.right &&
                clientY >= rect.top && clientY <= rect.bottom) {
                segmentsAtPoint.push(segment);
            }
        });
        
        // Z-index'e göre sırala (en üstteki en son)
        segmentsAtPoint.sort((a, b) => {
            const aZ = parseInt(window.getComputedStyle(a).zIndex) || 0;
            const bZ = parseInt(window.getComputedStyle(b).zIndex) || 0;
            return bZ - aZ; // Yüksek z-index önce
        });
        
        return segmentsAtPoint;
    }
    
    /**
     * Chart context menu'yu gösterir
     * @param {Event} e - Mouse event
     */
    showChartContextMenu(e) {
        const contextMenu = document.getElementById('chartContextMenu');
        if (!contextMenu) return;
        
        // Seçili segment sayısını kontrol et
        if (this.selectedSegments.size === 0) {
            return; // Seçili segment yoksa menüyü gösterme
        }
        
        // Pozisyon hesapla
        let left = e.pageX;
        let top = e.pageY;
        
        // Ekran sınırlarını kontrol et
        const menuWidth = contextMenu.offsetWidth || 220;
        const menuHeight = contextMenu.offsetHeight || 150;
        
        if (left + menuWidth > window.innerWidth) {
            left = window.innerWidth - menuWidth - 10;
        }
        if (top + menuHeight > window.innerHeight) {
            top = window.innerHeight - menuHeight - 10;
        }
        
        // Menüyü göster
        contextMenu.style.left = left + 'px';
        contextMenu.style.top = top + 'px';
        contextMenu.style.display = 'block';
        
        // Animasyon için class ekle
        setTimeout(() => {
            contextMenu.classList.add('show');
        }, 10);
        
        // Dışarı tıklandığında menüyü kapat
        const closeMenu = (event) => {
            if (!contextMenu.contains(event.target)) {
                contextMenu.classList.remove('show');
                setTimeout(() => {
                    contextMenu.style.display = 'none';
                }, 200);
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu, { once: true });
        }, 100);
    }
    
    /**
     * Seçili segment'leri taşıma dialog'unu gösterir
     */
    showMoveSelectedSegmentsDialog() {
        const modal = document.getElementById('moveSelectedSegmentsModal');
        if (!modal) return;
        
        // Chart context menu'yu kapat
        const chartContextMenu = document.getElementById('chartContextMenu');
        if (chartContextMenu) {
            chartContextMenu.classList.remove('show');
            chartContextMenu.style.display = 'none';
        }
        
        // Seçili segment sayısını göster
        const countSpan = document.getElementById('selectedSegmentsCount');
        if (countSpan) {
            countSpan.textContent = this.selectedSegments.size;
        }
        
        // Seçili segment'lerin bilgilerini göster
        this.populateSelectedSegmentsList();
        
        // Tarih input'unu bugünün tarihine ayarla
        const dateInput = document.getElementById('moveSelectedSegmentsDate');
        if (dateInput) {
            const today = new Date();
            dateInput.value = today.toISOString().split('T')[0];
            dateInput.min = today.toISOString().split('T')[0]; // Geçmiş tarih seçilemez
        }
        
        // Seçili segment'lerin bilgilerini göster (tarih input'u ayarlandıktan sonra)
        this.populateSelectedSegmentsList();
        
        // Üstteki tarih değiştiğinde tüm işlerin tarihlerini güncelle
        if (dateInput) {
            const updateAllDates = () => {
                const defaultDate = dateInput.value;
                if (defaultDate) {
                    const dateInputs = document.querySelectorAll('.segment-date-input');
                    dateInputs.forEach(input => {
                        // Sadece boş olanları veya kullanıcı tarafından değiştirilmemiş olanları güncelle
                        // Kullanıcı manuel değiştirdiyse, o tarihi koru
                        if (!input.dataset.userChanged || input.dataset.userChanged === 'false') {
                            input.value = defaultDate;
                        }
                    });
                }
            };
            
            // Event listener ekle
            dateInput.addEventListener('change', updateAllDates);
        }
        
        // Modal'ı göster
        modal.style.display = 'block';
        
        // Modal dışına tıklandığında kapat
        const closeOnOutsideClick = (e) => {
            if (e.target === modal) {
                closeMoveSelectedSegmentsModal();
                modal.removeEventListener('click', closeOnOutsideClick);
            }
        };
        modal.addEventListener('click', closeOnOutsideClick);
    }
    
    /**
     * Seçili segment'lerin listesini doldurur
     */
    populateSelectedSegmentsList() {
        const listContainer = document.getElementById('selectedSegmentsList');
        if (!listContainer) return;
        
        if (this.selectedSegments.size === 0) {
            listContainer.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">Seçili segment bulunamadı</p>';
            return;
        }
        
        // Seçili segment'lerin bilgilerini topla
        const selectedSegmentsInfo = [];
        const planIds = Array.from(this.selectedSegments);
        
        planIds.forEach(planId => {
            // Önce DOM'dan segment elementini bul
            let segmentElement = document.querySelector(`.draggable-bar[data-plan-id="${planId}"]`);
            
            // Eğer chart'ta bulunamazsa, tablodan bilgi al
            if (!segmentElement && window.dataGrid && window.dataGrid.filteredData) {
                // Tablodan planId'ye göre bilgi bul
                for (const item of window.dataGrid.filteredData) {
                    let foundPlanId = null;
                    if (item.breakdowns && item.breakdowns.length > 0) {
                        const breakdown = item.breakdowns.find(b => 
                            b.planId === planId || 
                            b.planId === parseInt(planId) || 
                            String(b.planId) === String(planId)
                        );
                        if (breakdown) {
                            foundPlanId = breakdown.planId;
                            // Tablodan gelen bilgiyi kullan
                            selectedSegmentsInfo.push({
                                planId: planId,
                                isemriNo: item.isemriNo || '-',
                                isemriId: item.isemriId || null,
                                malhizKodu: item.malhizKodu || '-',
                                imalatTuru: item.imalatTuru || '-',
                                planlananMiktar: breakdown.planlananMiktar || '-',
                                planTarihi: breakdown.planTarihi ? new Date(breakdown.planTarihi).toLocaleDateString('tr-TR') : '-',
                                bolumAdi: item.bolumAdi || '-',
                                makAd: breakdown.makAd || item.makAd || '-'
                            });
                            break; // Bulundu, döngüden çık
                        }
                    } else if (item.planId && (item.planId === planId || item.planId === parseInt(planId) || String(item.planId) === String(planId))) {
                        // Ana satır planlanmış
                        selectedSegmentsInfo.push({
                            planId: planId,
                            isemriNo: item.isemriNo || '-',
                            isemriId: item.isemriId || null,
                            malhizKodu: item.malhizKodu || '-',
                            imalatTuru: item.imalatTuru || '-',
                            planlananMiktar: item.planlananMiktar || item.totalPlanned || '-',
                            planTarihi: item.planlananTarih ? new Date(item.planlananTarih).toLocaleDateString('tr-TR') : '-',
                            bolumAdi: item.bolumAdi || '-',
                            makAd: item.makAd || '-'
                        });
                        break; // Bulundu, döngüden çık
                    }
                }
                return; // Tablodan bulundu, chart'tan arama yapma (forEach içinde continue yerine return kullanılır)
            }
            
            if (segmentElement) {
                const isemriNo = segmentElement.dataset.isemriNo;
                const isemriId = segmentElement.dataset.isemriId;
                
                // PlanId'den tarih bilgisini bul
                let planTarihi = '-';
                
                // Cache'den planId ile eşleştirerek tarih bul
                if (window.planningApp && window.planningApp.data) {
                    // Tüm data'yı dolaş ve breakdown'larda planId'yi ara
                    for (const item of window.planningApp.data) {
                        if (item.breakdowns && Array.isArray(item.breakdowns)) {
                            const breakdown = item.breakdowns.find(brk => {
                                // PlanId eşleştirmesi - farklı formatları kontrol et
                                const brkPlanId = brk.planId;
                                const searchPlanId = planId;
                                
                                return brkPlanId === searchPlanId || 
                                       brkPlanId === parseInt(searchPlanId) || 
                                       parseInt(brkPlanId) === parseInt(searchPlanId) ||
                                       String(brkPlanId) === String(searchPlanId);
                            });
                            
                            if (breakdown && breakdown.planTarihi) {
                                try {
                                    const date = new Date(breakdown.planTarihi);
                                    if (!isNaN(date.getTime())) {
                                        planTarihi = date.toLocaleDateString('tr-TR');
                                        break; // Bulundu, döngüden çık
                                    }
                                } catch (e) {
                                    // Hata durumunda devam et
                                }
                            }
                        }
                    }
                }
                
                // Tooltip'ten bilgileri al (en güvenilir yöntem)
                let tooltipData = null;
                try {
                    const tooltipAttr = segmentElement.getAttribute('data-tooltip');
                    if (tooltipAttr) {
                        tooltipData = JSON.parse(tooltipAttr);
                    }
                } catch (e) {
                    console.warn('Tooltip parse hatası:', e);
                }
                
                // Tooltip'ten bilgileri çıkar
                let malhizKodu = '-';
                let imalatTuru = '-';
                let planlananMiktar = '-';
                let bolumAdi = '-';
                let makAd = '-';
                
                if (tooltipData && tooltipData.rows) {
                    tooltipData.rows.forEach(row => {
                        switch(row.label) {
                            case 'Malzeme Kodu':
                                malhizKodu = row.value !== 'N/A' ? row.value : '-';
                                break;
                            case 'Malzeme':
                                imalatTuru = row.value !== 'N/A' ? row.value : '-';
                                break;
                            case 'Planlanan Miktar':
                                planlananMiktar = row.value !== 'N/A' ? row.value.replace(' ADET', '') : '-';
                                break;
                            case 'Bölüm':
                                bolumAdi = row.value !== 'N/A' ? row.value : '-';
                                break;
                            case 'Makina':
                                makAd = row.value !== 'N/A' ? row.value : '-';
                                break;
                        }
                    });
                }
                
                // Eğer tooltip'te bilgi yoksa, cache'den dene
                if (malhizKodu === '-' && window.planningApp && window.planningApp.data) {
                    let itemInfo = null;
                    if (isemriId) {
                        itemInfo = window.planningApp.data.find(item => item.isemriId === isemriId);
                    }
                    if (!itemInfo && isemriNo) {
                        itemInfo = window.planningApp.data.find(item => item.isemriNo === isemriNo);
                    }
                    
                        if (itemInfo) {
                        if (malhizKodu === '-') malhizKodu = itemInfo.malhizKodu || '-';
                        if (imalatTuru === '-') imalatTuru = itemInfo.imalatTuru || '-';
                        if (planlananMiktar === '-') planlananMiktar = itemInfo.planlananMiktar || itemInfo.totalPlanned || '-';
                        if (bolumAdi === '-') bolumAdi = itemInfo.bolumAdi || '-';
                        if (makAd === '-') makAd = itemInfo.makAd || '-';
                        
                        // Breakdown kontrolü
                        if (itemInfo.breakdowns) {
                            const breakdownInfo = itemInfo.breakdowns.find(brk => 
                                brk.planId === planId || 
                                brk.planId === parseInt(planId) || 
                                brk.planId?.toString() === planId.toString()
                            );
                            
                            if (breakdownInfo) {
                                if (malhizKodu === '-') malhizKodu = breakdownInfo.malhizKodu || '-';
                                if (imalatTuru === '-') imalatTuru = breakdownInfo.imalatTuru || '-';
                                if (planlananMiktar === '-') planlananMiktar = breakdownInfo.planlananMiktar || '-';
                                if (bolumAdi === '-') bolumAdi = breakdownInfo.bolumAdi || '-';
                                if (makAd === '-') makAd = breakdownInfo.makAd || '-';
                            }
                        }
                    }
                }
                
                selectedSegmentsInfo.push({
                    planId: planId,
                    isemriNo: isemriNo || '-',
                    isemriId: isemriId || null,
                    malhizKodu: malhizKodu,
                    imalatTuru: imalatTuru,
                    planlananMiktar: planlananMiktar,
                    planTarihi: planTarihi,
                    bolumAdi: bolumAdi,
                    makAd: makAd
                });
                
                console.log('Segment info eklendi:', {
                    planId: planId,
                    isemriNo: isemriNo,
                    planTarihi: planTarihi
                });
            }
        });
        
        console.log('Tüm selectedSegmentsInfo:', selectedSegmentsInfo);
        
        // Liste HTML'ini oluştur
        if (selectedSegmentsInfo.length === 0) {
            listContainer.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">Seçili segment bilgileri bulunamadı</p>';
            return;
        }
        
        let html = '<table style="width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 13px;">';
        html += '<thead><tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-bottom: 2px solid #5a67d8;">';
        html += '<th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; letter-spacing: 0.5px;">İş Emri No</th>';
        html += '<th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; letter-spacing: 0.5px;">Malzeme</th>';
        html += '<th style="padding: 10px 12px; text-align: center; font-weight: 600; font-size: 12px; letter-spacing: 0.5px;">Miktar</th>';
        html += '<th style="padding: 10px 12px; text-align: center; font-weight: 600; font-size: 12px; letter-spacing: 0.5px;">Mevcut Tarih</th>';
        html += '<th style="padding: 10px 12px; text-align: center; font-weight: 600; font-size: 12px; letter-spacing: 0.5px;">Planlanan Tarih</th>';
        html += '<th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; letter-spacing: 0.5px;">Makine</th>';
        html += '</tr></thead><tbody>';
        
        // Bölümlere göre makine listelerini hazırla
        const machinesByBolum = {};
        selectedSegmentsInfo.forEach(info => {
            if (info.bolumAdi && info.bolumAdi !== '-') {
                if (!machinesByBolum[info.bolumAdi]) {
                    machinesByBolum[info.bolumAdi] = new Set();
                }
            }
        });
        
        // Mevcut data'dan bölümlere göre makine listelerini doldur
        if (window.planningApp && window.planningApp.data) {
            window.planningApp.data.forEach(item => {
                if (item.bolumAdi && machinesByBolum[item.bolumAdi] && item.makAd) {
                    machinesByBolum[item.bolumAdi].add(item.makAd);
                }
            });
        }
        
        selectedSegmentsInfo.forEach((info, index) => {
            const rowBgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            
            // Bu bölüm için makine listesini al
            const bolumMachines = info.bolumAdi && info.bolumAdi !== '-' && machinesByBolum[info.bolumAdi] 
                ? Array.from(machinesByBolum[info.bolumAdi]).sort() 
                : [];
            
            html += `<tr style="background-color: ${rowBgColor}; border-bottom: 1px solid #e0e0e0;">`;
            html += `<td style="padding: 10px 12px; color: #2d3748; font-size: 12px; vertical-align: middle;">${info.isemriNo || '-'}</td>`;
            html += `<td style="padding: 10px 12px; color: #4a5568; font-size: 12px; vertical-align: middle; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${info.imalatTuru || '-'}">${info.malhizKodu || '-'}</td>`;
            html += `<td style="padding: 10px 12px; text-align: center; color: #4a5568; font-size: 12px; vertical-align: middle;">${info.planlananMiktar || '-'}</td>`;
            // Tarih - zaten formatlanmış olarak geliyor, direkt kullan
            const formattedDate = info.planTarihi && info.planTarihi !== '-' ? info.planTarihi : '-';
            console.log('HTML için tarih:', { planId: info.planId, planTarihi: info.planTarihi, formattedDate });
            html += `<td style="padding: 10px 12px; text-align: center; color: #4a5568; font-size: 12px; vertical-align: middle;">${formattedDate}</td>`;
            
            // Planlanan Tarih input'u - üstteki tarih varsayılan olarak kullanılacak
            const defaultDateInput = document.getElementById('moveSelectedSegmentsDate');
            let defaultDate = '';
            if (defaultDateInput && defaultDateInput.value) {
                defaultDate = defaultDateInput.value;
            } else {
                // Eğer üstteki tarih yoksa, mevcut tarihi kullan
                if (info.planTarihi && info.planTarihi !== '-') {
                    try {
                        // TR formatından (DD.MM.YYYY) ISO formatına (YYYY-MM-DD) çevir
                        const dateParts = info.planTarihi.split('.');
                        if (dateParts.length === 3) {
                            defaultDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                        } else {
                            // Eğer parse edilemezse bugünün tarihini kullan
                            const today = new Date();
                            defaultDate = today.toISOString().split('T')[0];
                        }
                    } catch (e) {
                        const today = new Date();
                        defaultDate = today.toISOString().split('T')[0];
                    }
                } else {
                    const today = new Date();
                    defaultDate = today.toISOString().split('T')[0];
                }
            }
            
            html += `<td style="padding: 10px 12px; text-align: center; vertical-align: middle;">`;
            html += `<input type="date" 
                           class="segment-date-input" 
                           data-plan-id="${info.planId}" 
                           data-isemri-id="${info.isemriId || ''}"
                           value="${defaultDate}"
                           style="width: 150px; padding: 6px 8px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 12px; text-align: center; transition: border-color 0.2s ease; box-sizing: border-box;"
                           onfocus="this.style.borderColor='#40916c'; this.style.boxShadow='0 0 0 3px rgba(64, 145, 108, 0.1)'; this.dataset.userChanged='true';"
                           onblur="this.style.borderColor='#cbd5e0'; this.style.boxShadow='none';" />`;
            html += `</td>`;
            
            // Makine dropdown'ı
            html += `<td style="padding: 10px 12px; color: #4a5568; font-size: 12px; vertical-align: middle;">`;
            if (bolumMachines.length > 0) {
                html += `<select class="machine-select" data-plan-id="${info.planId}" data-isemri-id="${info.isemriId || ''}" style="width: 100%; padding: 6px 8px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 12px; background-color: white; cursor: pointer;">`;
                const currentMakAd = info.makAd && info.makAd !== '-' ? info.makAd : '';
                // Mevcut makine listede yoksa ekle
                if (currentMakAd && !bolumMachines.includes(currentMakAd)) {
                    html += `<option value="${currentMakAd}" selected>${currentMakAd}</option>`;
                }
                bolumMachines.forEach(makine => {
                    const selected = makine === currentMakAd ? 'selected' : '';
                    html += `<option value="${makine}" ${selected}>${makine}</option>`;
                });
                html += `</select>`;
            } else {
                html += `<span style="color: #999;">${info.makAd || '-'}</span>`;
            }
            html += `</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        listContainer.innerHTML = html;
    }
    
    /**
     * Seçili segment'leri taşıma işlemini onaylar
     */
    async confirmMoveSelectedSegments() {
        // Her bir iş için tarih kontrolü yap
        const dateInputs = document.querySelectorAll('.segment-date-input');
        const dateChanges = {};
        let hasInvalidDate = false;
        
        dateInputs.forEach(input => {
            const planId = input.dataset.planId;
            const dateValue = input.value;
            if (!dateValue) {
                hasInvalidDate = true;
            } else {
                dateChanges[planId] = dateValue;
            }
        });
        
        if (hasInvalidDate) {
            this.showErrorMessage('Lütfen tüm işler için tarih seçin');
            return;
        }
        
        // Makine değişikliklerini topla
        const machineChanges = {};
        const machineSelects = document.querySelectorAll('.machine-select');
        machineSelects.forEach(select => {
            const planId = select.dataset.planId;
            const isemriId = select.dataset.isemriId;
            const selectedMachine = select.value;
            if (selectedMachine && selectedMachine.trim() !== '') {
                machineChanges[planId] = {
                    planId: planId,
                    isemriId: isemriId,
                    newMachine: selectedMachine
                };
            }
        });
        
        // Modal'ı kapat
        const modal = document.getElementById('moveSelectedSegmentsModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Eğer tablodan çağrıldıysa, DataGrid'in confirmMoveSelectedRows fonksiyonunu kullan
        if (window.dataGrid && window.dataGrid.selectedRows && window.dataGrid.selectedRows.size > 0) {
            await window.dataGrid.confirmMoveSelectedRows(dateChanges, machineChanges);
        } else {
            // Chart'tan çağrıldıysa, normal işlemi yap
            await this.moveSelectedSegments(dateChanges, machineChanges);
        }
        
        // Seçimi temizle (moveSelectedSegments içinde zaten temizleniyor ama emin olmak için)
        // this.clearSelection();
    }
    
    /**
     * Seçili segmentleri toplu olarak taşır
     */
    async moveSelectedSegments(dateChanges, machineChanges = {}) {
        if (this.selectedSegments.size === 0) {
            this.showErrorMessage('Lütfen taşımak için segment seçin');
            return;
        }
        
        try {
            const planIds = Array.from(this.selectedSegments);
            const promises = planIds.map(planId => {
                const targetDate = dateChanges[planId];
                if (!targetDate) {
                    console.warn(`PlanId ${planId} için tarih bulunamadı`);
                    return Promise.resolve();
                }
                const machineChange = machineChanges[planId];
                return this.updatePlanDate(planId, targetDate, machineChange?.newMachine);
            });
            
            await Promise.all(promises);
            
            // Makine değişiklikleri varsa, bunları da güncelle
            if (Object.keys(machineChanges).length > 0) {
                const machineUpdatePromises = Object.values(machineChanges).map(change => {
                    return this.updateMachine(change.planId, change.isemriId, change.newMachine);
                });
                await Promise.all(machineUpdatePromises);
            }
            
            // Cache'i güncelle
            if (window.dataGrid && typeof window.dataGrid.updatePlanDateInCache === 'function') {
                planIds.forEach(planId => {
                    const targetDate = dateChanges[planId];
                    if (targetDate) {
                        window.dataGrid.updatePlanDateInCache(planId, targetDate);
                    }
                });
            }
            
            // Chart'ları yenile
            await this.refreshCharts();
            
            // Seçimi temizle
            this.clearSelection();
            
            // Başarı mesajı
            const machineMsg = Object.keys(machineChanges).length > 0 
                ? ` ve ${Object.keys(machineChanges).length} makine güncellendi` 
                : '';
            const uniqueDates = new Set(Object.values(dateChanges));
            const dateMsg = uniqueDates.size === 1 
                ? `${new Date(Array.from(uniqueDates)[0]).toLocaleDateString('tr-TR')}`
                : `${uniqueDates.size} farklı tarih`;
            this.showSuccessMessage(`${planIds.length} plan tarihi ${dateMsg} olarak güncellendi${machineMsg}`);
            
        } catch (error) {
            console.error('Toplu taşıma hatası:', error);
            this.showErrorMessage('Plan tarihleri güncellenirken hata oluştu');
        }
    }

    /**
     * Chart'ları yeniler
     */
    async refreshCharts() {
        try {
            console.log('Chart\'lar yenileniyor...');
            
            // Cache'i temizle ki yeni veriler çekilsin
            this.clearPlanningDataCache();
            console.log('Planning data cache temizlendi');
            
            // Mevcut seçimleri koru
            const currentWeek = this.selectedWeek;
            const currentDayIndex = this.selectedDayIndex;
            const currentSegmentIndex = this.selectedSegmentIndex;
            
            // Chart'ları yenile (mevcut data ile)
            await this.updateWeeksChart();
            console.log('Weeks chart yenilendi');
            
            if (currentWeek) {
                await this.updateDaysChart(currentWeek);
                console.log('Days chart yenilendi');
                
                // Seçimleri geri yükle
                this.selectedWeek = currentWeek;
                this.selectedDayIndex = currentDayIndex;
                this.selectedSegmentIndex = currentSegmentIndex;
            } else if (this.data && this.data.length > 0) {
                // Eğer hafta seçili değilse, ilk haftayı seç ve güncelle
                const firstDate = this.data[0].chartDate || this.data[0].tarih || this.data[0].planlananTarih || new Date();
                const firstWeek = this.getWeekString(new Date(firstDate));
                if (firstWeek) {
                    await this.updateDaysChart(firstWeek);
                    this.selectedWeek = firstWeek;
                }
            }
            
            console.log('Chart\'lar başarıyla yenilendi');
            
        } catch (error) {
            console.error('Chart yenileme hatası:', error);
        }
    }

    /**
     * Başarı mesajı gösterir
     */
    showSuccessMessage(message) {
        // Basit toast mesajı
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Hata mesajı gösterir
     */
    showErrorMessage(message) {
        // Basit toast mesajı
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

