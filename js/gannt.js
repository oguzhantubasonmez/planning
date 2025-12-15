/**
 * Profesyonel Gantt Chart Bileşeni
 * İşlerin ve bağlı işlerin yatay zaman çizelgesi üzerinde görüntülenmesi
 */
class GanttChart {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container bulunamadı: ${containerId}`);
            return;
        }

        // Varsayılan ayarlar
        this.options = {
            rowHeight: 40,
            headerHeight: 80,
            sidebarWidth: 300,
            minColumnWidth: 60,
            hourWidth: 4, // 1 saat = 4px
            dayWidth: 96, // 1 gün = 96px (24 saat * 4px)
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
            showWeekends: true,
            showToday: true,
            ...options
        };

        // Veri ve durum
        this.data = [];
        this.filteredData = [];
        this.selectedTask = null;
        this.expandedTasks = new Set(); // Genişletilmiş görevler (kuyruk işleri görünür)
        this.draggedTask = null;
        this.dragOffset = { x: 0, y: 0 };

        // Zaman çizelgesi
        this.timeScale = 'day'; // 'day', 'week', 'month'
        this.zoomLevel = 1; // Zoom seviyesi

        // Event callbacks
        this.onTaskClick = null;
        this.onTaskUpdate = null;
        this.onTaskMove = null;
        this.onDateRangeChange = null;

        this.init();
    }

    /**
     * Gantt chart'ı başlatır
     */
    init() {
        this.render();
        this.bindEvents();
    }

    /**
     * Gantt chart'ı render eder
     */
    render() {
        if (!this.container) return;

        // Container'ı temizle
        this.container.innerHTML = '';

        // Ana yapıyı oluştur
        this.container.innerHTML = `
            <div class="gantt-container">
                <!-- Toolbar -->
                <div class="gantt-toolbar">
                    <div class="gantt-toolbar-left">
                        <button class="gantt-btn" id="gantt-zoom-in" title="Yakınlaştır">
                            <span>+</span>
                        </button>
                        <button class="gantt-btn" id="gantt-zoom-out" title="Uzaklaştır">
                            <span>-</span>
                        </button>
                        <button class="gantt-btn" id="gantt-zoom-fit" title="Sığdır">
                            <span>⌂</span>
                        </button>
                        <div class="gantt-separator"></div>
                        <select class="gantt-select" id="gantt-time-scale">
                            <option value="day">Günlük</option>
                            <option value="week">Haftalık</option>
                            <option value="month">Aylık</option>
                        </select>
                    </div>
                    <div class="gantt-toolbar-center">
                        <input type="date" class="gantt-date-input" id="gantt-start-date" />
                        <span class="gantt-date-separator">-</span>
                        <input type="date" class="gantt-date-input" id="gantt-end-date" />
                        <button class="gantt-btn" id="gantt-apply-date-range">Uygula</button>
                    </div>
                    <div class="gantt-toolbar-right">
                        <button class="gantt-btn" id="gantt-expand-all" title="Tümünü Genişlet">
                            <span>⇅</span>
                        </button>
                        <button class="gantt-btn" id="gantt-collapse-all" title="Tümünü Daralt">
                            <span>⇅</span>
                        </button>
                    </div>
                </div>

                <!-- Gantt Chart Area -->
                <div class="gantt-chart-area" id="gantt-chart-area">
                    <!-- Sidebar (İş Listesi) -->
                    <div class="gantt-sidebar" id="gantt-sidebar">
                        <div class="gantt-sidebar-header">
                            <div class="gantt-sidebar-col" style="width: 100%;">İş Emri</div>
                        </div>
                        <div class="gantt-sidebar-body" id="gantt-sidebar-body"></div>
                    </div>

                    <!-- Timeline Area -->
                    <div class="gantt-timeline-area" id="gantt-timeline-area">
                        <!-- Timeline Header -->
                        <div class="gantt-timeline-header" id="gantt-timeline-header"></div>
                        
                        <!-- Timeline Body -->
                        <div class="gantt-timeline-body" id="gantt-timeline-body"></div>
                    </div>
                </div>

                <!-- Task Details Panel (Sağda) -->
                <div class="gantt-details-panel" id="gantt-details-panel" style="display: none;">
                    <div class="gantt-details-header">
                        <h3>İş Detayları</h3>
                        <button class="gantt-close-btn" id="gantt-close-details">×</button>
                    </div>
                    <div class="gantt-details-body" id="gantt-details-body"></div>
                </div>
            </div>
        `;

        // CSS stillerini ekle
        this.injectStyles();

        // Tarih aralığını ayarla
        this.updateDateInputs();

        // Timeline'ı render et
        this.renderTimeline();

        // Sidebar'ı render et
        this.renderSidebar();

        // Timeline body'yi render et
        this.renderTimelineBody();
    }

    /**
     * CSS stillerini enjekte eder
     */
    injectStyles() {
        if (document.getElementById('gantt-styles')) return;

        const style = document.createElement('style');
        style.id = 'gantt-styles';
        style.textContent = `
            .gantt-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                width: 100%;
                background: #fff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 13px;
            }

            .gantt-toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 15px;
                background: #f8f9fa;
                border-bottom: 1px solid #dee2e6;
                flex-shrink: 0;
            }

            .gantt-toolbar-left,
            .gantt-toolbar-right {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .gantt-toolbar-center {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .gantt-btn {
                padding: 6px 12px;
                border: 1px solid #ced4da;
                background: #fff;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 32px;
                height: 32px;
            }

            .gantt-btn:hover {
                background: #e9ecef;
                border-color: #adb5bd;
            }

            .gantt-btn:active {
                background: #dee2e6;
            }

            .gantt-separator {
                width: 1px;
                height: 24px;
                background: #dee2e6;
                margin: 0 8px;
            }

            .gantt-select,
            .gantt-date-input {
                padding: 6px 10px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 13px;
                height: 32px;
            }

            .gantt-date-separator {
                color: #6c757d;
                font-weight: 500;
            }

            .gantt-chart-area {
                display: flex;
                flex: 1;
                overflow: hidden;
                position: relative;
            }

            .gantt-sidebar {
                width: ${this.options.sidebarWidth}px;
                border-right: 2px solid #dee2e6;
                display: flex;
                flex-direction: column;
                background: #fff;
                flex-shrink: 0;
            }

            .gantt-sidebar-header {
                height: ${this.options.headerHeight}px;
                background: #f8f9fa;
                border-bottom: 2px solid #dee2e6;
                display: flex;
                align-items: center;
                padding: 0 15px;
                font-weight: 600;
                color: #495057;
                position: sticky;
                top: 0;
                z-index: 10;
            }

            .gantt-sidebar-body {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
            }

            .gantt-sidebar-row {
                height: ${this.options.rowHeight}px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                align-items: center;
                padding: 0 15px;
                cursor: pointer;
                transition: background-color 0.2s;
                position: relative;
            }

            .gantt-sidebar-row:hover {
                background: #f8f9fa;
            }

            .gantt-sidebar-row.selected {
                background: #e7f3ff;
                border-left: 3px solid #0d6efd;
            }

            .gantt-sidebar-row.expanded {
                background: #f0f7ff;
            }

            .gantt-expand-icon {
                width: 20px;
                height: 20px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-right: 8px;
                cursor: pointer;
                border-radius: 3px;
                transition: background-color 0.2s;
            }

            .gantt-expand-icon:hover {
                background: #dee2e6;
            }

            .gantt-expand-icon::before {
                content: '▶';
                font-size: 10px;
                color: #6c757d;
                transition: transform 0.2s;
            }

            .gantt-expand-icon.expanded::before {
                transform: rotate(90deg);
            }

            .gantt-task-info {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .gantt-task-name {
                font-weight: 500;
                color: #212529;
                font-size: 13px;
            }

            .gantt-task-meta {
                font-size: 11px;
                color: #6c757d;
            }

            .gantt-timeline-area {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .gantt-timeline-header {
                height: ${this.options.headerHeight}px;
                background: #f8f9fa;
                border-bottom: 2px solid #dee2e6;
                position: sticky;
                top: 0;
                z-index: 10;
                overflow-x: auto;
                overflow-y: hidden;
            }

            .gantt-timeline-body {
                flex: 1;
                overflow: auto;
                position: relative;
            }

            .gantt-timeline-grid {
                position: relative;
                min-height: 100%;
            }

            .gantt-timeline-row {
                height: ${this.options.rowHeight}px;
                border-bottom: 1px solid #e9ecef;
                position: relative;
            }

            .gantt-timeline-row:hover {
                background: #f8f9fa;
            }

            .gantt-timeline-row.selected {
                background: #e7f3ff;
            }

            .gantt-timeline-cell {
                position: absolute;
                height: 100%;
                border-right: 1px solid #e9ecef;
            }

            .gantt-timeline-cell.today {
                background: #fff3cd;
            }

            .gantt-timeline-cell.weekend {
                background: #f8f9fa;
            }

            .gantt-task-bar {
                position: absolute;
                height: ${this.options.rowHeight - 8}px;
                top: 4px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                padding: 0 8px;
                color: #fff;
                font-size: 11px;
                font-weight: 500;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: all 0.2s;
                z-index: 5;
            }

            .gantt-task-bar:hover {
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transform: translateY(-1px);
            }

            .gantt-task-bar.selected {
                box-shadow: 0 0 0 2px #0d6efd, 0 4px 8px rgba(0,0,0,0.2);
                z-index: 6;
            }

            .gantt-task-bar.dragging {
                opacity: 0.7;
                z-index: 10;
            }

            .gantt-task-bar.status-beklemede {
                background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            }

            .gantt-task-bar.status-kısmi-planlandı {
                background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
            }

            .gantt-task-bar.status-planlandı {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            }

            .gantt-task-bar.status-tamamlandı {
                background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
            }

            .gantt-task-bar.status-gecikmiş {
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            }

            .gantt-queue-task {
                margin-left: 20px;
                height: ${this.options.rowHeight - 12}px;
                border-left: 2px solid #0d6efd;
                padding-left: 8px;
            }

            .gantt-details-panel {
                width: 350px;
                border-left: 1px solid #dee2e6;
                background: #fff;
                display: flex;
                flex-direction: column;
                flex-shrink: 0;
            }

            .gantt-details-header {
                padding: 15px;
                border-bottom: 1px solid #dee2e6;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f8f9fa;
            }

            .gantt-details-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #212529;
            }

            .gantt-close-btn {
                width: 28px;
                height: 28px;
                border: none;
                background: transparent;
                font-size: 20px;
                cursor: pointer;
                color: #6c757d;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .gantt-close-btn:hover {
                background: #e9ecef;
                color: #212529;
            }

            .gantt-details-body {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
            }

            .gantt-detail-item {
                margin-bottom: 15px;
            }

            .gantt-detail-label {
                font-size: 11px;
                color: #6c757d;
                text-transform: uppercase;
                font-weight: 600;
                margin-bottom: 5px;
            }

            .gantt-detail-value {
                font-size: 14px;
                color: #212529;
                font-weight: 500;
            }

            .gantt-today-line {
                position: absolute;
                top: 0;
                bottom: 0;
                width: 2px;
                background: #dc3545;
                z-index: 8;
                pointer-events: none;
            }

            .gantt-today-line::before {
                content: 'Bugün';
                position: absolute;
                top: -20px;
                left: -20px;
                background: #dc3545;
                color: #fff;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 600;
                white-space: nowrap;
            }

            /* Scrollbar stilleri */
            .gantt-sidebar-body::-webkit-scrollbar,
            .gantt-timeline-body::-webkit-scrollbar,
            .gantt-timeline-header::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }

            .gantt-sidebar-body::-webkit-scrollbar-track,
            .gantt-timeline-body::-webkit-scrollbar-track,
            .gantt-timeline-header::-webkit-scrollbar-track {
                background: #f1f1f1;
            }

            .gantt-sidebar-body::-webkit-scrollbar-thumb,
            .gantt-timeline-body::-webkit-scrollbar-thumb,
            .gantt-timeline-header::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 4px;
            }

            .gantt-sidebar-body::-webkit-scrollbar-thumb:hover,
            .gantt-timeline-body::-webkit-scrollbar-thumb:hover,
            .gantt-timeline-header::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Timeline header'ı render eder
     */
    renderTimeline() {
        const header = document.getElementById('gantt-timeline-header');
        if (!header) return;

        const startDate = new Date(this.options.startDate);
        const endDate = new Date(this.options.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        header.innerHTML = '';

        const scale = this.getTimeScale();
        const cellWidth = this.getCellWidth();

        // Üst satır (ay/yıl)
        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.height = '40px';
        topRow.style.borderBottom = '1px solid #dee2e6';

        // Alt satır (gün/tarih)
        const bottomRow = document.createElement('div');
        bottomRow.style.display = 'flex';
        bottomRow.style.height = '40px';

        let currentDate = new Date(startDate);
        let currentMonth = null;
        let monthStart = 0;
        let monthWidth = 0;

        while (currentDate <= endDate) {
            const dateStr = this.formatDate(currentDate);
            const isToday = this.isSameDay(currentDate, today);
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

            // Ay değişikliği kontrolü
            const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
            if (monthKey !== currentMonth) {
                if (currentMonth !== null) {
                    // Önceki ayı kapat
                    const monthCell = document.createElement('div');
                    monthCell.style.width = `${monthWidth}px`;
                    monthCell.style.borderRight = '1px solid #dee2e6';
                    monthCell.style.padding = '8px';
                    monthCell.style.fontWeight = '600';
                    monthCell.style.color = '#495057';
                    monthCell.style.textAlign = 'center';
                    monthCell.textContent = this.formatMonth(currentDate);
                    topRow.appendChild(monthCell);
                }
                currentMonth = monthKey;
                monthStart = (currentDate - startDate) / (1000 * 60 * 60 * 24);
                monthWidth = cellWidth;
            } else {
                monthWidth += cellWidth;
            }

            // Gün hücresi
            const dayCell = document.createElement('div');
            dayCell.className = 'gantt-timeline-cell';
            dayCell.style.width = `${cellWidth}px`;
            dayCell.style.position = 'relative';
            if (isToday) dayCell.classList.add('today');
            if (isWeekend && this.options.showWeekends) dayCell.classList.add('weekend');

            const dayLabel = document.createElement('div');
            dayLabel.style.padding = '4px 8px';
            dayLabel.style.fontSize = '11px';
            dayLabel.style.fontWeight = '500';
            dayLabel.style.color = isToday ? '#dc3545' : '#495057';
            dayLabel.textContent = currentDate.getDate();

            const weekDayLabel = document.createElement('div');
            weekDayLabel.style.padding = '0 8px 4px';
            weekDayLabel.style.fontSize = '10px';
            weekDayLabel.style.color = '#6c757d';
            weekDayLabel.textContent = this.getDayName(currentDate.getDay());

            dayCell.appendChild(dayLabel);
            dayCell.appendChild(weekDayLabel);
            bottomRow.appendChild(dayCell);

            // Sonraki güne geç
            currentDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Son ayı kapat
        if (currentMonth !== null) {
            const monthCell = document.createElement('div');
            monthCell.style.width = `${monthWidth}px`;
            monthCell.style.borderRight = '1px solid #dee2e6';
            monthCell.style.padding = '8px';
            monthCell.style.fontWeight = '600';
            monthCell.style.color = '#495057';
            monthCell.style.textAlign = 'center';
            monthCell.textContent = this.formatMonth(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
            topRow.appendChild(monthCell);
        }

        header.appendChild(topRow);
        header.appendChild(bottomRow);

        // Bugün çizgisini ekle
        if (this.options.showToday && today >= startDate && today <= endDate) {
            const todayLine = document.createElement('div');
            todayLine.className = 'gantt-today-line';
            const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            todayLine.style.left = `${daysDiff * cellWidth}px`;
            header.appendChild(todayLine);
        }
    }

    /**
     * Sidebar'ı render eder
     */
    renderSidebar() {
        const sidebarBody = document.getElementById('gantt-sidebar-body');
        if (!sidebarBody) return;

        sidebarBody.innerHTML = '';

        this.filteredData.forEach((task, index) => {
            const row = this.createSidebarRow(task, index);
            sidebarBody.appendChild(row);

            // Kuyruk işleri varsa ve genişletilmişse
            if (task.queueJobs && task.queueJobs.length > 0 && this.expandedTasks.has(task.isemriId)) {
                task.queueJobs.forEach((queueJob, qIndex) => {
                    const queueRow = this.createSidebarRow(queueJob, index, true, qIndex);
                    sidebarBody.appendChild(queueRow);
                });
            }
        });
    }

    /**
     * Sidebar satırı oluşturur
     */
    createSidebarRow(task, index, isQueueJob = false, queueIndex = 0) {
        const row = document.createElement('div');
        row.className = 'gantt-sidebar-row';
        row.dataset.taskId = task.isemriId || task.planId;
        row.dataset.isQueueJob = isQueueJob;
        row.dataset.index = index;

        if (this.selectedTask && this.selectedTask.isemriId === task.isemriId) {
            row.classList.add('selected');
        }

        if (isQueueJob) {
            row.style.paddingLeft = '40px';
            row.style.fontSize = '12px';
            row.style.color = '#6c757d';
        }

        // Genişletme ikonu (kuyruk işleri varsa)
        const hasQueueJobs = task.queueJobs && task.queueJobs.length > 0;
        let expandIcon = '';
        if (hasQueueJobs && !isQueueJob) {
            const isExpanded = this.expandedTasks.has(task.isemriId);
            expandIcon = `<span class="gantt-expand-icon ${isExpanded ? 'expanded' : ''}" 
                              data-task-id="${task.isemriId}"></span>`;
        } else {
            expandIcon = '<span style="width: 20px; display: inline-block;"></span>';
        }

        // İş bilgileri
        const taskName = task.isemriNo || task.planId || 'Bilinmeyen İş';
        const taskMeta = [];
        if (task.makAd) taskMeta.push(`Makine: ${task.makAd}`);
        if (task.bolumAdi) taskMeta.push(`Bölüm: ${task.bolumAdi}`);
        if (task.planlananMiktar) taskMeta.push(`Miktar: ${task.planlananMiktar}`);

        row.innerHTML = `
            ${expandIcon}
            <div class="gantt-task-info">
                <div class="gantt-task-name">${taskName}</div>
                ${taskMeta.length > 0 ? `<div class="gantt-task-meta">${taskMeta.join(' • ')}</div>` : ''}
            </div>
        `;

        // Event listeners
        row.addEventListener('click', (e) => {
            if (e.target.classList.contains('gantt-expand-icon')) {
                e.stopPropagation();
                this.toggleExpandTask(task.isemriId);
            } else {
                this.selectTask(task);
            }
        });

        return row;
    }

    /**
     * Timeline body'yi render eder
     */
    renderTimelineBody() {
        const timelineBody = document.getElementById('gantt-timeline-body');
        if (!timelineBody) return;

        timelineBody.innerHTML = '';

        const grid = document.createElement('div');
        grid.className = 'gantt-timeline-grid';
        grid.style.width = `${this.getTotalWidth()}px`;
        grid.style.minHeight = `${this.filteredData.length * this.options.rowHeight}px`;

        // Grid hücrelerini oluştur
        const startDate = new Date(this.options.startDate);
        const endDate = new Date(this.options.endDate);
        const cellWidth = this.getCellWidth();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const isToday = this.isSameDay(currentDate, today);
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

            const cell = document.createElement('div');
            cell.className = 'gantt-timeline-cell';
            if (isToday) cell.classList.add('today');
            if (isWeekend && this.options.showWeekends) cell.classList.add('weekend');

            const daysDiff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
            cell.style.left = `${daysDiff * cellWidth}px`;
            cell.style.width = `${cellWidth}px`;

            grid.appendChild(cell);

            currentDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Görev çubuklarını ekle
        let rowIndex = 0;
        this.filteredData.forEach((task) => {
            const row = document.createElement('div');
            row.className = 'gantt-timeline-row';
            row.style.top = `${rowIndex * this.options.rowHeight}px`;
            row.style.height = `${this.options.rowHeight}px`;

            if (this.selectedTask && this.selectedTask.isemriId === task.isemriId) {
                row.classList.add('selected');
            }

            // Ana görev çubuğu
            const taskBar = this.createTaskBar(task, rowIndex);
            if (taskBar) {
                row.appendChild(taskBar);
            }

            grid.appendChild(row);
            rowIndex++;

            // Kuyruk işleri
            if (task.queueJobs && task.queueJobs.length > 0 && this.expandedTasks.has(task.isemriId)) {
                task.queueJobs.forEach((queueJob) => {
                    const queueRow = document.createElement('div');
                    queueRow.className = 'gantt-timeline-row gantt-queue-task';
                    queueRow.style.top = `${rowIndex * this.options.rowHeight}px`;
                    queueRow.style.height = `${this.options.rowHeight}px`;

                    const queueTaskBar = this.createTaskBar(queueJob, rowIndex, true);
                    if (queueTaskBar) {
                        queueRow.appendChild(queueTaskBar);
                    }

                    grid.appendChild(queueRow);
                    rowIndex++;
                });
            }
        });

        timelineBody.appendChild(grid);

        // Bugün çizgisini ekle
        if (this.options.showToday && today >= startDate && today <= endDate) {
            const todayLine = document.createElement('div');
            todayLine.className = 'gantt-today-line';
            const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            const cellWidth = this.getCellWidth();
            todayLine.style.left = `${daysDiff * cellWidth}px`;
            grid.appendChild(todayLine);
        }
    }

    /**
     * Görev çubuğu oluşturur
     */
    createTaskBar(task, rowIndex, isQueueJob = false) {
        if (!task.planTarihi) return null;

        const startDate = new Date(this.options.startDate);
        const taskStartDate = new Date(task.planTarihi);
        const cellWidth = this.getCellWidth();

        // Görev süresini hesapla (varsayılan 1 gün, breakdown varsa toplam süre)
        let taskDuration = 1; // gün cinsinden
        if (task.toplamSure) {
            // Saniyeyi güne çevir (8 saatlik çalışma günü varsayımı)
            taskDuration = Math.max(1, Math.ceil(task.toplamSure / (8 * 60 * 60)));
        }

        const daysDiff = Math.floor((taskStartDate - startDate) / (1000 * 60 * 60 * 24));
        const left = daysDiff * cellWidth;
        const width = taskDuration * cellWidth;

        // Eğer görev görünür alanın dışındaysa render etme
        if (left + width < 0 || left > this.getTotalWidth()) {
            return null;
        }

        const bar = document.createElement('div');
        bar.className = 'gantt-task-bar';
        bar.dataset.taskId = task.isemriId || task.planId;
        bar.dataset.isQueueJob = isQueueJob;

        // Durum sınıfı
        const status = this.getTaskStatus(task);
        bar.classList.add(`status-${status.toLowerCase().replace(/\s+/g, '-')}`);

        if (this.selectedTask && this.selectedTask.isemriId === task.isemriId) {
            bar.classList.add('selected');
        }

        // Görev bilgisi
        const taskName = task.isemriNo || task.planId || 'İş';
        const taskInfo = [];
        if (task.planlananMiktar) taskInfo.push(`${task.planlananMiktar}`);
        if (task.makAd) taskInfo.push(task.makAd);

        bar.style.left = `${left}px`;
        bar.style.width = `${width}px`;
        bar.innerHTML = `<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${taskName}</span>`;

        // Drag & drop
        bar.draggable = true;
        bar.addEventListener('dragstart', (e) => {
            this.draggedTask = task;
            this.dragOffset.x = e.offsetX;
            bar.classList.add('dragging');
        });

        bar.addEventListener('dragend', () => {
            bar.classList.remove('dragging');
            this.draggedTask = null;
        });

        // Click event
        bar.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectTask(task);
        });

        return bar;
    }

    /**
     * Event listener'ları bağlar
     */
    bindEvents() {
        // Zoom butonları
        const zoomIn = document.getElementById('gantt-zoom-in');
        const zoomOut = document.getElementById('gantt-zoom-out');
        const zoomFit = document.getElementById('gantt-zoom-fit');

        if (zoomIn) zoomIn.addEventListener('click', () => this.zoom(1.2));
        if (zoomOut) zoomOut.addEventListener('click', () => this.zoom(0.8));
        if (zoomFit) zoomFit.addEventListener('click', () => this.zoomFit());

        // Zaman ölçeği değişikliği
        const timeScale = document.getElementById('gantt-time-scale');
        if (timeScale) {
            timeScale.value = this.timeScale;
            timeScale.addEventListener('change', (e) => {
                this.timeScale = e.target.value;
                this.renderTimeline();
                this.renderTimelineBody();
            });
        }

        // Tarih aralığı değişikliği
        const applyDateRange = document.getElementById('gantt-apply-date-range');
        if (applyDateRange) {
            applyDateRange.addEventListener('click', () => {
                this.applyDateRange();
            });
        }

        // Genişlet/Daralt butonları
        const expandAll = document.getElementById('gantt-expand-all');
        const collapseAll = document.getElementById('gantt-collapse-all');

        if (expandAll) expandAll.addEventListener('click', () => this.expandAll());
        if (collapseAll) collapseAll.addEventListener('click', () => this.collapseAll());

        // Detay paneli kapatma
        const closeDetails = document.getElementById('gantt-close-details');
        if (closeDetails) {
            closeDetails.addEventListener('click', () => {
                this.hideDetailsPanel();
            });
        }

        // Drag & drop için timeline body
        const timelineBody = document.getElementById('gantt-timeline-body');
        if (timelineBody) {
            timelineBody.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.handleDragOver(e);
            });

            timelineBody.addEventListener('drop', (e) => {
                e.preventDefault();
                this.handleDrop(e);
            });
        }
    }

    /**
     * Veri yükler
     */
    loadData(data) {
        this.data = Array.isArray(data) ? data : [];
        this.filteredData = [...this.data];
        this.processData();
        this.renderSidebar();
        this.renderTimelineBody();
    }

    /**
     * Veriyi işler (kuyruk işlerini ekler)
     */
    processData() {
        // Kuyruk işlerini yükle (eğer varsa)
        this.filteredData.forEach(task => {
            if (task.breakdowns && Array.isArray(task.breakdowns)) {
                // Breakdown'ları kuyruk işleri olarak ekle
                task.queueJobs = task.breakdowns.map(breakdown => ({
                    ...breakdown,
                    isemriId: breakdown.isemriId || task.isemriId,
                    isemriNo: breakdown.isemriNo || task.isemriNo,
                    planTarihi: breakdown.planTarihi || breakdown.planlananTarih,
                    planlananMiktar: breakdown.planlananMiktar,
                    makAd: breakdown.makAd || breakdown.selectedMachine || task.makAd,
                    bolumAdi: breakdown.bolumAdi || task.bolumAdi,
                    durum: breakdown.durum || task.durum
                }));
            }
        });
    }

    /**
     * Görev seçer
     */
    selectTask(task) {
        this.selectedTask = task;
        this.renderSidebar();
        this.renderTimelineBody();
        this.showDetailsPanel(task);

        if (this.onTaskClick) {
            this.onTaskClick(task);
        }
    }

    /**
     * Detay panelini gösterir
     */
    showDetailsPanel(task) {
        const panel = document.getElementById('gantt-details-panel');
        const body = document.getElementById('gantt-details-body');
        if (!panel || !body) return;

        panel.style.display = 'flex';

        const details = [
            { label: 'İş Emri No', value: task.isemriNo || '-' },
            { label: 'Plan ID', value: task.planId || '-' },
            { label: 'Makine', value: task.makAd || task.selectedMachine || '-' },
            { label: 'Bölüm', value: task.bolumAdi || '-' },
            { label: 'Malzeme Kodu', value: task.malhizKodu || '-' },
            { label: 'Malzeme Adı', value: task.malhizAdi || '-' },
            { label: 'Planlanan Miktar', value: task.planlananMiktar || 0 },
            { label: 'Planlanan Tarih', value: task.planTarihi ? this.formatDate(new Date(task.planTarihi)) : '-' },
            { label: 'Durum', value: task.durum || '-' },
            { label: 'Ağırlık', value: task.agirlik ? `${task.agirlik} kg` : '-' },
            { label: 'Toplam Süre', value: task.toplamSure ? `${Math.round(task.toplamSure / 3600)} saat` : '-' }
        ];

        body.innerHTML = details.map(detail => `
            <div class="gantt-detail-item">
                <div class="gantt-detail-label">${detail.label}</div>
                <div class="gantt-detail-value">${detail.value}</div>
            </div>
        `).join('');
    }

    /**
     * Detay panelini gizler
     */
    hideDetailsPanel() {
        const panel = document.getElementById('gantt-details-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * Görevi genişletir/daraltır
     */
    toggleExpandTask(taskId) {
        if (this.expandedTasks.has(taskId)) {
            this.expandedTasks.delete(taskId);
        } else {
            this.expandedTasks.add(taskId);
        }
        this.renderSidebar();
        this.renderTimelineBody();
    }

    /**
     * Tümünü genişletir
     */
    expandAll() {
        this.filteredData.forEach(task => {
            if (task.queueJobs && task.queueJobs.length > 0) {
                this.expandedTasks.add(task.isemriId);
            }
        });
        this.renderSidebar();
        this.renderTimelineBody();
    }

    /**
     * Tümünü daraltır
     */
    collapseAll() {
        this.expandedTasks.clear();
        this.renderSidebar();
        this.renderTimelineBody();
    }

    /**
     * Zoom yapar
     */
    zoom(factor) {
        this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel * factor));
        this.options.dayWidth = 96 * this.zoomLevel;
        this.renderTimeline();
        this.renderTimelineBody();
    }

    /**
     * Zoom'u sığdırır
     */
    zoomFit() {
        if (this.filteredData.length === 0) return;

        const startDate = new Date(this.options.startDate);
        const endDate = new Date(this.options.endDate);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const containerWidth = this.container.offsetWidth - this.options.sidebarWidth - 50;
        const optimalWidth = containerWidth / days;

        this.zoomLevel = Math.max(0.5, Math.min(3, optimalWidth / 96));
        this.options.dayWidth = 96 * this.zoomLevel;
        this.renderTimeline();
        this.renderTimelineBody();
    }

    /**
     * Tarih aralığını uygular
     */
    applyDateRange() {
        const startInput = document.getElementById('gantt-start-date');
        const endInput = document.getElementById('gantt-end-date');

        if (startInput && endInput) {
            const startDate = new Date(startInput.value);
            const endDate = new Date(endInput.value);

            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate) {
                this.options.startDate = startDate;
                this.options.endDate = endDate;
                this.renderTimeline();
                this.renderTimelineBody();

                if (this.onDateRangeChange) {
                    this.onDateRangeChange({ startDate, endDate });
                }
            }
        }
    }

    /**
     * Tarih inputlarını günceller
     */
    updateDateInputs() {
        const startInput = document.getElementById('gantt-start-date');
        const endInput = document.getElementById('gantt-end-date');

        if (startInput && endInput) {
            startInput.value = this.formatDateInput(this.options.startDate);
            endInput.value = this.formatDateInput(this.options.endDate);
        }
    }

    /**
     * Drag over handler
     */
    handleDragOver(e) {
        if (!this.draggedTask) return;

        e.preventDefault();
        const timelineBody = document.getElementById('gantt-timeline-body');
        if (!timelineBody) return;

        const rect = timelineBody.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const startDate = new Date(this.options.startDate);
        const cellWidth = this.getCellWidth();
        const days = Math.floor(x / cellWidth);
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + days);

        // Görsel geri bildirim (isteğe bağlı)
    }

    /**
     * Drop handler
     */
    handleDrop(e) {
        if (!this.draggedTask) return;

        e.preventDefault();
        const timelineBody = document.getElementById('gantt-timeline-body');
        if (!timelineBody) return;

        const rect = timelineBody.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const startDate = new Date(this.options.startDate);
        const cellWidth = this.getCellWidth();
        const days = Math.floor(x / cellWidth);
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + days);

        // Görevi güncelle
        this.draggedTask.planTarihi = newDate.toISOString().split('T')[0];

        if (this.onTaskMove) {
            this.onTaskMove(this.draggedTask, newDate);
        }

        if (this.onTaskUpdate) {
            this.onTaskUpdate(this.draggedTask);
        }

        // UI'ı güncelle
        this.renderTimelineBody();
    }

    /**
     * Yardımcı fonksiyonlar
     */
    getTimeScale() {
        return this.timeScale;
    }

    getCellWidth() {
        return this.options.dayWidth * this.zoomLevel;
    }

    getTotalWidth() {
        const startDate = new Date(this.options.startDate);
        const endDate = new Date(this.options.endDate);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        return days * this.getCellWidth();
    }

    getTaskStatus(task) {
        if (task.durum) return task.durum;
        
        // Tarih kontrolü
        if (task.planTarihi) {
            const planDate = new Date(task.planTarihi);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (planDate < today) {
                return 'Gecikmiş';
            }
        }

        return 'Beklemede';
    }

    formatDate(date) {
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    formatDateInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatMonth(date) {
        return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    }

    getDayName(dayIndex) {
        const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        return days[dayIndex];
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    /**
     * Tarih aralığına göre filtreleme
     */
    filterByDateRange(startDate, endDate) {
        this.filteredData = this.data.filter(task => {
            if (!task.planTarihi) return false;
            const taskDate = new Date(task.planTarihi);
            return taskDate >= startDate && taskDate <= endDate;
        });
        this.renderSidebar();
        this.renderTimelineBody();
    }

    /**
     * Güncelleme yapar
     */
    update() {
        this.renderTimeline();
        this.renderSidebar();
        this.renderTimelineBody();
    }
}

