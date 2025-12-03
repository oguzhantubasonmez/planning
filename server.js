const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Oracle veritabanı bağlantı bilgileri
const dbConfig = {
    user: 'ERPREADONLY',
    password: 'ERPREADONLY',
    connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=172.16.34.8)(PORT=1521))(CONNECT_DATA=(SID=ORCL)))',
    // Performans optimizasyonları
    poolMin: 2,        // Minimum bağlantı sayısı
    poolMax: 10,       // Maksimum bağlantı sayısı
    poolIncrement: 1,  // Bağlantı artış miktarı
    poolTimeout: 60,   // Bağlantı havuzu timeout (saniye)
    stmtCacheSize: 30, // SQL statement cache boyutu
    poolPingInterval: 60, // Bağlantı ping aralığı (saniye)
    // Bağlantı optimizasyonları
    externalAuth: false,
    homogeneous: true,
    events: false,
    // Performans ayarları
    fetchAsString: [oracledb.CLOB, oracledb.BLOB],
    maxRows: 0, // Tüm satırları getir
    outFormat: oracledb.OUT_FORMAT_OBJECT
};

// Global pool değişkeni
let pool;

// Oracle bağlantı havuzu oluştur
async function initializeDatabase() {
    try {
        // Oracle Instant Client ayarları - mevcut kurulumu kullan
        try {
            oracledb.initOracleClient({
                libDir: 'C:\\oracle\\instantclient_21_x\\instantclient_21_12'
            });
            console.log('Oracle Instant Client başlatıldı: C:\\oracle\\instantclient_21_x\\instantclient_21_12');
        } catch (initErr) {
            console.log('Oracle Instant Client zaten başlatılmış veya alternatif yol kullanılıyor');
        }
        
        pool = await oracledb.createPool({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString,
            // Optimize edilmiş havuz ayarları
            poolMin: dbConfig.poolMin,
            poolMax: dbConfig.poolMax,
            poolIncrement: dbConfig.poolIncrement,
            poolTimeout: dbConfig.poolTimeout,
            poolPingInterval: dbConfig.poolPingInterval,
            stmtCacheSize: dbConfig.stmtCacheSize,
            // Bağlantı timeout ayarları
            queueTimeout: 60000,        // 1 dakika (daha hızlı)
            transportConnectTimeout: 30, // 30 saniye
            connectTimeout: 30,         // 30 saniye
            // Performans ayarları
            externalAuth: dbConfig.externalAuth,
            homogeneous: dbConfig.homogeneous,
            events: dbConfig.events,
            fetchAsString: dbConfig.fetchAsString,
            maxRows: dbConfig.maxRows,
            outFormat: dbConfig.outFormat,
            enableStatistics: true
        });
        
        console.log('Oracle veritabanı bağlantı havuzu oluşturuldu');
        console.log('Pool istatistikleri:', pool.getStatistics());
        
        // Bağlantı testi
        const testConnection = await oracledb.getConnection();
        const result = await testConnection.execute('SELECT SYSDATE FROM DUAL');
        console.log('Oracle bağlantı testi başarılı:', result.rows[0][0]);
        await testConnection.close();
        
    } catch (err) {
        console.error('Oracle bağlantı hatası:', err);
        console.error('Hata detayları:', {
            message: err.message,
            code: err.code,
            offset: err.offset
        });
        
        // Alternatif bağlantı string'leri dene
        console.log('Alternatif bağlantı string\'leri deneniyor...');
        try {
            const altDbConfig = {
                user: dbConfig.user,
                password: dbConfig.password,
                connectString: '172.16.34.8:1521:ORCL'  // SID format
            };
            
            pool = await oracledb.createPool(altDbConfig);
            console.log('Alternatif bağlantı string ile başarılı!');
            console.log('Pool istatistikleri:', pool.getStatistics());
            
        } catch (altErr) {
            console.error('Alternatif bağlantı da başarısız:', altErr.message);
        }
    }
}

// Planlama verisi kaydetme endpoint'i (kısmi planlama desteği ile)
app.post('/api/planning', async (req, res) => {
    let connection;
    try {
        const { isemriId, planTarihi, planlananMiktar, selectedMachine, aciklama } = req.body;
        
        console.log('Planlama verisi kaydediliyor:', {
            isemriId,
            planTarihi,
            planlananMiktar,
            selectedMachine
        });
        
        connection = await pool.getConnection();
        
        // Maça aşaması kontrolü için BOLUM_ADI, MAK_AD ve MAK_ID'yi al
        const stageInfoQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT MAK_AD, BOLUM_ADI, MAK_ID
            FROM ERPREADONLY.V_ISEMRI_DETAY 
            WHERE ISEMRI_ID = :isemriId
        `;
        const stageInfoResult = await connection.execute(stageInfoQuery, { isemriId });
        if (stageInfoResult.rows.length === 0) {
            throw new Error('İş emri bulunamadı');
        }
        
        const originalMakAd = stageInfoResult.rows[0][0];
        const bolumAdi = stageInfoResult.rows[0][1] || '';
        const originalMakId = stageInfoResult.rows[0][2] || null;
        
        // Maça aşaması kontrolü (statik mapping kullanarak)
        const macaKeywords = ['maça', 'maca'];
        const isMacaStage = macaKeywords.some(k => 
            (bolumAdi || '').toLowerCase().includes(k) || 
            (originalMakAd || '').toLowerCase().includes(k)
        );
        
        // Makine seçimi sadece maça aşaması için gerekli
        let targetMachine = originalMakAd;
        let targetMakId = originalMakId;
        // Tüm aşamalar için makine seçimine izin ver
            if (selectedMachine) {
            targetMachine = selectedMachine;
            console.log('✅ Seçilen makine:', selectedMachine);
                // Seçilen makine için MAK_ID'yi al
                if (selectedMachine !== originalMakAd) {
                    const makIdQuery = `
                        WITH ISEMRI_FILTERED AS (
                            SELECT * 
                            FROM ERPURT.T_URT_ISEMRI 
                            WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                        )
                        SELECT DISTINCT MAK_ID
                        FROM ERPREADONLY.V_ISEMRI_DETAY 
                        WHERE ISEMRI_ID = :isemriId AND MAK_AD = :selectedMachine
                    `;
                    const makIdResult = await connection.execute(makIdQuery, { isemriId, selectedMachine });
                    if (makIdResult.rows.length > 0 && makIdResult.rows[0][0]) {
                        targetMakId = makIdResult.rows[0][0];
                }
            }
        } else {
            // Seçilen makine yoksa orijinal makineyi kullan
            targetMachine = originalMakAd;
            targetMakId = originalMakId;
        }
        
        // İş emrinin sipariş miktarını kontrol et
        const siparisQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT VD.PLAN_MIKTAR 
            FROM ERPREADONLY.V_ISEMRI_DETAY VD
            INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
            WHERE VD.ISEMRI_ID = :isemriId
        `;
        const siparisResult = await connection.execute(siparisQuery, { isemriId });
        
        if (siparisResult.rows.length === 0) {
            throw new Error('İş emri bulunamadı');
        }
        
        const siparisMiktar = siparisResult.rows[0][0];
        console.log('Sipariş miktarı:', siparisMiktar);
        
        // Mevcut BEKLEMEDE kırılımları kontrolü (yeniden split oluşmasını engelle)
        // Senaryo: Önce 60 PLANLANDI, kalan 4 BEKLEMEDE. Sonra 4 planlandığında yeni 60/4 yaratılmasın, BEKLEMEDE kayıt(lar) PLANLANDI'ya güncellensin.
        try {
            const waitingQuery = `
                WITH ISEMRI_FILTERED AS (
                    SELECT * 
                    FROM ERPURT.T_URT_ISEMRI 
                    WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                )
                SELECT PV.PLAN_ID, NVL(PV.PLANLANAN_MIKTAR,0) AS PLANLANAN_MIKTAR
                FROM ERPREADONLY.PLANLAMA_VERI PV
                INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
                WHERE PV.ISEMRI_ID = :isemriId
                  AND PV.PLANLAMA_DURUMU = 'BEKLEMEDE'
                  AND PV.PLAN_TARIHI IS NULL
                ORDER BY PV.ISEMRI_PARCA_NO
            `;
            const waitingRes = await connection.execute(waitingQuery, { isemriId });
            const waitingRows = waitingRes.rows.map(r => ({ PLAN_ID: r[0], PLANLANAN_MIKTAR: r[1] }));
            const totalWaiting = waitingRows.reduce((acc, r) => acc + (r.PLANLANAN_MIKTAR || 0), 0);

            if (waitingRows.length > 0 && parseInt(planlananMiktar) === parseInt(totalWaiting)) {
                console.log('✅ Beklemede kırılımlar toplamı planlanan miktara eşit. INSERT yerine UPDATE yapılacak.');
                const planDateObj = new Date(planTarihi);
                for (const wr of waitingRows) {
                    // MAK_ID'yi almak için sorgu
                    let updateMakId = null;
                    if (selectedMachine) {
                        const makIdQuery = `
                            WITH ISEMRI_FILTERED AS (
                                SELECT * 
                                FROM ERPURT.T_URT_ISEMRI 
                                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                            )
                            SELECT DISTINCT MAK_ID
                            FROM ERPREADONLY.V_ISEMRI_DETAY 
                            WHERE ISEMRI_ID = :isemriId AND MAK_AD = :selectedMachine
                        `;
                        const makIdResult = await connection.execute(makIdQuery, { isemriId, selectedMachine });
                        if (makIdResult.rows.length > 0 && makIdResult.rows[0][0]) {
                            updateMakId = makIdResult.rows[0][0];
                        }
                    }
                    
                    const upd = `
                        UPDATE ERPREADONLY.PLANLAMA_VERI
                        SET PLAN_TARIHI = :planTarihi,
                            PLANLAMA_DURUMU = 'PLANLANDI',
                            MAK_AD = :targetMachine,
                            MAK_ID = :targetMakId
                        WHERE PLAN_ID = :planId
                    `;
                    await connection.execute(upd, {
                        planTarihi: planDateObj,
                        targetMachine: selectedMachine || null,
                        targetMakId: updateMakId,
                        planId: wr.PLAN_ID
                    });
                }
                await connection.commit();
                return res.json({
                    success: true,
                    message: 'Beklemede kırılımlar PLANLANDI olarak güncellendi',
                    data: { updatedPlanIds: waitingRows.map(w => w.PLAN_ID) }
                });
            }
        } catch (waitingErr) {
            console.warn('BEKLEMEDE kontrolü sırasında uyarı:', waitingErr?.message || waitingErr);
        }
        
        // Kısmi planlama kontrolü
        const isPartialPlanning = planlananMiktar < siparisMiktar;
        
        let createdPlanIdOut = null;
        if (isPartialPlanning) {
            console.log('Kısmi planlama tespit edildi:', {
                planlananMiktar,
                siparisMiktar,
                kalanMiktar: siparisMiktar - planlananMiktar
            });
            
            // 1. Planlanan kısmı kaydet
            const insertQuery = `
                INSERT INTO ERPREADONLY.PLANLAMA_VERI 
                (ISEMRI_ID, PLAN_TARIHI, ISEMRI_PARCA_NO, PLANLANAN_MIKTAR, PLANLAMA_DURUMU, MAK_AD, MAK_ID, ACIKLAMA)
                VALUES (:isemriId, :planTarihi, 1, :planlananMiktar, 'PLANLANDI', :targetMachine, :targetMakId, :aciklama)
                RETURNING PLAN_ID INTO :planId
            `;
            
            const bindVars = {
                isemriId: isemriId,
                planTarihi: new Date(planTarihi),
                planlananMiktar: parseInt(planlananMiktar),
                targetMachine: targetMachine,
                targetMakId: targetMakId,
                aciklama: aciklama || null,
                planId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            };
            
            console.log('INSERT PLANLANDI (kısmi) bindVars:', { ...bindVars, planTarihi: bindVars.planTarihi.toISOString() });
            const insertRes = await connection.execute(insertQuery, bindVars);
            // planId out bind
            try { createdPlanIdOut = insertRes?.outBinds?.planId?.[0] ?? null; } catch (_) { createdPlanIdOut = null; }
            
            // NOT: Kalan kısmı "Beklemede" olarak veritabanına kaydetmiyoruz
            // Bekleyen miktar frontend'de dinamik olarak hesaplanacak (sipariş miktarı - toplam planlanan)
            const kalanMiktar = siparisMiktar - planlananMiktar;
            
            console.log('Kısmi planlama başarıyla kaydedildi (bekleyen miktar frontend\'de hesaplanacak):', {
                planlananMiktar,
                kalanMiktar,
                planId: createdPlanIdOut
            });
            
        } else {
            // Tam planlama - mevcut mantık
            const insertQuery = `
                INSERT INTO ERPREADONLY.PLANLAMA_VERI 
                (ISEMRI_ID, PLAN_TARIHI, ISEMRI_PARCA_NO, PLANLANAN_MIKTAR, PLANLAMA_DURUMU, MAK_AD, MAK_ID, ACIKLAMA)
                VALUES (:isemriId, :planTarihi, 1, :planlananMiktar, 'PLANLANDI', :targetMachine, :targetMakId, :aciklama)
                RETURNING PLAN_ID INTO :planId
            `;
            
            const bindVars = {
                isemriId: isemriId,
                planTarihi: new Date(planTarihi),
                planlananMiktar: parseInt(planlananMiktar),
                targetMachine: targetMachine,
                targetMakId: targetMakId,
                aciklama: aciklama || null,
                planId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            };
            
            console.log('INSERT PLANLANDI (tam) bindVars:', { ...bindVars, planTarihi: bindVars.planTarihi.toISOString() });
            const insertRes = await connection.execute(insertQuery, bindVars);
            try { createdPlanIdOut = insertRes?.outBinds?.planId?.[0] ?? null; } catch (_) { createdPlanIdOut = null; }
            console.log('Tam planlama başarıyla kaydedildi:', { createdPlanId: createdPlanIdOut });
        }
        
        await connection.commit();
        
        res.json({
            success: true,
            message: isPartialPlanning ? 'Kısmi planlama başarıyla kaydedildi' : 'Planlama başarıyla kaydedildi',
            data: {
                isemriId,
                planTarihi,
                planlananMiktar,
                siparisMiktar,
                isPartialPlanning,
                kalanMiktar: isPartialPlanning ? siparisMiktar - planlananMiktar : 0,
                createdPlanId: createdPlanIdOut
            }
        });
        
    } catch (error) {
        console.error('Planlama verisi kaydetme hatası:', error);
        try { console.error('Hata sırasında gelen body:', req.body); } catch(_) {}
        if (connection) {
            await connection.rollback();
        }
        res.status(500).json({
            success: false,
            message: 'Planlama verisi kaydedilemedi',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// İş emri parçalama endpoint'i
app.post('/api/planning/split', async (req, res) => {
    let connection;
    try {
        const { planId, splitMiktar, yeniTarih, selectedMachine } = req.body;
        
        console.log('İş emri parçalanıyor:', {
            planId,
            splitMiktar,
            yeniTarih,
            selectedMachine
        });
        
        connection = await pool.getConnection();
        
        // Mevcut planı bul
        const currentPlanQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT PV.PLAN_ID, PV.ISEMRI_ID, PV.PLAN_TARIHI, PV.PLANLANAN_MIKTAR, PV.ISEMRI_PARCA_NO
            FROM ERPREADONLY.PLANLAMA_VERI PV
            INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
            WHERE PV.PLAN_ID = :planId
        `;
        const currentPlanResult = await connection.execute(currentPlanQuery, { planId });
        
        if (currentPlanResult.rows.length === 0) {
            throw new Error('Plan bulunamadı');
        }
        
        const currentPlan = {};
        currentPlanResult.metaData.forEach((col, i) => {
            currentPlan[col.name] = currentPlanResult.rows[0][i];
        });
        
        console.log('Mevcut plan:', currentPlan);
        
        // Miktar kontrolü
        if (splitMiktar >= currentPlan.PLANLANAN_MIKTAR) {
            throw new Error('Bölünecek miktar toplam miktardan küçük olmalı');
        }
        
        const kalanMiktar = currentPlan.PLANLANAN_MIKTAR - splitMiktar;
        
        // 1. Mevcut kaydı güncelle (kalan miktar)
        const updateQuery = `
            UPDATE ERPREADONLY.PLANLAMA_VERI 
            SET PLANLANAN_MIKTAR = :kalanMiktar
            WHERE PLAN_ID = :planId
        `;
        
        await connection.execute(updateQuery, {
            planId: parseInt(planId),
            kalanMiktar: kalanMiktar
        });
        
        // 2. Sonraki parça numarasını bul
        const nextParcaQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT NVL(MAX(PV.ISEMRI_PARCA_NO), 0) + 1 as NEXT_PARCA_NO
            FROM ERPREADONLY.PLANLAMA_VERI PV
            INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
            WHERE PV.ISEMRI_ID = :isemriId
        `;
        const nextParcaResult = await connection.execute(nextParcaQuery, { isemriId: currentPlan.ISEMRI_ID });
        const nextParcaNo = nextParcaResult.rows[0][0];
        
        // MAK_ID'yi al
        let splitMakId = null;
        if (selectedMachine) {
            const makIdQuery = `
                WITH ISEMRI_FILTERED AS (
                    SELECT * 
                    FROM ERPURT.T_URT_ISEMRI 
                    WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                )
                SELECT DISTINCT MAK_ID
                FROM ERPREADONLY.V_ISEMRI_DETAY 
                WHERE ISEMRI_ID = :isemriId AND MAK_AD = :selectedMachine
            `;
            const makIdResult = await connection.execute(makIdQuery, { isemriId: currentPlan.ISEMRI_ID, selectedMachine });
            if (makIdResult.rows.length > 0 && makIdResult.rows[0][0]) {
                splitMakId = makIdResult.rows[0][0];
            }
        }
        
        // 3. Yeni kayıt oluştur (bölünen miktar)
        const insertQuery = `
            INSERT INTO ERPREADONLY.PLANLAMA_VERI 
            (ISEMRI_ID, PLAN_TARIHI, ISEMRI_PARCA_NO, PLANLANAN_MIKTAR, PLANLAMA_DURUMU, MAK_AD, MAK_ID)
            VALUES (:isemriId, :planTarihi, :parcaNo, :splitMiktar, 'PLANLANDI', :selectedMachine, :splitMakId)
            RETURNING PLAN_ID INTO :newPlanId
        `;
        const splitBind = {
            isemriId: currentPlan.ISEMRI_ID,
            planTarihi: new Date(yeniTarih),
            parcaNo: nextParcaNo,
            splitMiktar: parseInt(splitMiktar),
            selectedMachine: selectedMachine,
            splitMakId: splitMakId,
            newPlanId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        };
        await connection.execute(insertQuery, splitBind);
        
        await connection.commit();
        
        console.log('İş emri başarıyla parçalandı:', {
            planId,
            kalanMiktar,
            splitMiktar,
            yeniTarih,
            nextParcaNo,
            newPlanId: splitBind.newPlanId
        });
        
        res.json({
            success: true,
            message: 'İş emri başarıyla parçalandı',
            data: {
                planId,
                kalanMiktar,
                splitMiktar,
                yeniTarih,
                nextParcaNo,
                newPlanId: splitBind.newPlanId
            }
        });
        
    } catch (error) {
        console.error('İş emri parçalama hatası:', error);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).json({
            success: false,
            message: 'İş emri parçalanamadı',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// Kuyruk planlama özet endpoint'i (planlamayı yapmadan sadece özet döndürür)
app.post('/api/planning/queue-plan-preview', async (req, res) => {
    let connection;
    try {
        const { isemriNo, anchorIsemriId, planTarihi, planlananMiktar, selectedMachines } = req.body;

        if (!isemriNo || !anchorIsemriId || !planTarihi || !planlananMiktar) {
            return res.status(400).json({ success: false, message: 'isemriNo, anchorIsemriId, planTarihi, planlananMiktar zorunlu' });
        }

        connection = await pool.getConnection();

        // Tüm aşamaları getir (ISEMRI_SIRA'ya göre DESC sıralı)
        const stagesQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT *
                FROM ERPURT.T_URT_ISEMRI
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT 
                VD.ISEMRI_ID,
                VD.ISEMRI_NO,
                VD.ISEMRI_SIRA,
                VD.MAK_AD,
                VD.BOLUM_ADI,
                VD.MALHIZ_KODU,
                VD.MALHIZ_ADI,
                NVL(VD.TOPLAM_HAZIRLIK_SURE,0) + NVL(VD.TOPLAM_SURE,0) AS TOTAL_SECONDS,
                NVL(VD.FIGUR_SAYISI, 1) AS FIGUR_SAYISI,
                NVL(VD.PLAN_MIKTAR, 0) AS PLAN_MIKTAR
            FROM ERPREADONLY.V_ISEMRI_DETAY VD
            INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
            WHERE VD.ISEMRI_NO = :isemriNo
            ORDER BY VD.ISEMRI_SIRA DESC
        `;
        const stagesResult = await connection.execute(stagesQuery, { isemriNo });
        if (stagesResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'İş emri aşaması bulunamadı' });
        }

        // Satırları nesne haline getir
        const meta = stagesResult.metaData.map(c => c.name);
        const stages = stagesResult.rows.map(r => {
            const o = {}; meta.forEach((c, i) => o[c] = r[i]); return o;
        });
        
        // Tanımsız aşamaları filtrele (makine ve bölüm tanımlı olmayan)
        const filteredStages = stages.filter(s => {
            const hasMachine = s.MAK_AD && s.MAK_AD.trim() !== '';
            const hasDepartment = s.BOLUM_ADI && s.BOLUM_ADI.trim() !== '';
            return hasMachine || hasDepartment; // En az biri tanımlı olmalı
        });
        
        if (filteredStages.length === 0) {
            return res.status(404).json({ success: false, message: 'Tanımlı aşama bulunamadı' });
        }
        
        // Tüm aşamalar için mevcut planları tek sorguda çek (detaylı bilgilerle)
        const allIsemriIds = filteredStages.map(s => s.ISEMRI_ID);
        const existingPlansQuery = `
            SELECT ISEMRI_ID, PLAN_ID, TRUNC(PLAN_TARIHI) AS PLAN_TARIHI, ISEMRI_PARCA_NO, PLANLANAN_MIKTAR, MAK_AD
            FROM ERPREADONLY.PLANLAMA_VERI
            WHERE ISEMRI_ID IN (${allIsemriIds.map((_, i) => `:id${i}`).join(',')})
            AND PLANLAMA_DURUMU = 'PLANLANDI'
            ORDER BY ISEMRI_ID, PLAN_TARIHI DESC
        `;
        const planBindParams = {};
        allIsemriIds.forEach((id, i) => { planBindParams[`id${i}`] = id; });
        const existingPlansResult = await connection.execute(existingPlansQuery, planBindParams);
        const existingPlansMeta = existingPlansResult.metaData.map(c => c.name);
        const existingPlans = existingPlansResult.rows.map(r => {
            const o = {}; existingPlansMeta.forEach((c, i) => {
                o[c] = r[i];
                // Tarih alanlarını Date nesnesine çevir
                if (c === 'PLAN_TARIHI' && r[i]) {
                    o[c] = r[i] instanceof Date ? r[i] : new Date(r[i]);
                }
            }); 
            return o;
        });
        
        // Her ISEMRI_ID ve ISEMRI_PARCA_NO kombinasyonu için planları grupla
        const plansByIsemriIdAndParca = {};
        existingPlans.forEach(plan => {
            const isemriId = plan.ISEMRI_ID;
            const parcaNo = plan.ISEMRI_PARCA_NO || 0;
            const key = `${isemriId}_${parcaNo}`;
            if (!plansByIsemriIdAndParca[key]) {
                plansByIsemriIdAndParca[key] = [];
            }
            plansByIsemriIdAndParca[key].push(plan);
        });
        
        // Her ISEMRI_ID için en son planı bul (en yeni tarihli) - geriye uyumluluk için
        const latestPlansByIsemriId = {};
        existingPlans.forEach(plan => {
            const isemriId = plan.ISEMRI_ID;
            if (!latestPlansByIsemriId[isemriId] || 
                new Date(plan.PLAN_TARIHI) > new Date(latestPlansByIsemriId[isemriId].PLAN_TARIHI)) {
                latestPlansByIsemriId[isemriId] = plan;
            }
        });
        
        const anchorIndex = filteredStages.findIndex(s => s.ISEMRI_ID === anchorIsemriId);
        if (anchorIndex === -1) {
            return res.status(404).json({ success: false, message: 'Anchor aşama bulunamadı veya tanımsız kategorisinde' });
        }

        // Yardımcılar
        const toDateOnly = (d) => {
            const date = new Date(d);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return new Date(`${year}-${month}-${day}T03:00:00`);
        };
        const formatDate = (date) => {
            if (!date) return null;
            const d = date instanceof Date ? date : new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
        const subDays = (d, n) => addDays(d, -n);
        const durationToDays = (seconds) => Math.max(1, Math.ceil(seconds / (8 * 3600)));

        function isBusyDate(isemriId, date) {
            const dateStr = formatDate(date);
            return existingPlans.some(p => p.ISEMRI_ID === isemriId && formatDate(p.PLAN_TARIHI) === dateStr);
        }

        function nextFreeDate(isemriId, date, direction) {
            let cur = toDateOnly(date);
            for (let i = 0; i < 365; i++) {
                const busy = isBusyDate(isemriId, cur);
                if (!busy) {
                    return cur;
                }
                cur = direction === -1 ? subDays(cur, 1) : addDays(cur, 1);
            }
            return cur;
        }

        const plannedStages = [];
        const planDateObj = new Date(planTarihi);
        
        // 1) Anchor aşamayı yerleştir ve tarihini hesapla
        const anchor = filteredStages[anchorIndex];
        const anchorFigurSayisi = anchor.FIGUR_SAYISI || 1;
        const anchorPlans = [];
        Object.keys(plansByIsemriIdAndParca).forEach(key => {
            const [isemriId, parcaNo] = key.split('_');
            if (parseInt(isemriId) === anchor.ISEMRI_ID) {
                const plans = plansByIsemriIdAndParca[key];
                plans.forEach(plan => {
                    anchorPlans.push({
                        ...plan,
                        parcaNo: parseInt(parcaNo)
                    });
                });
            }
        });
        
        // Anchor için gerçek adet hesapla (figür sayısına göre)
        // Eğer anchor figürlü ise, planlananMiktar zaten figürlü adet
        // Eğer anchor figürlü değilse, planlananMiktar gerçek adet
        const anchorGercekMiktar = anchorFigurSayisi > 1 
            ? planlananMiktar * anchorFigurSayisi 
            : planlananMiktar;
        
        let anchorDate;
        let anchorDateForForward; // İleri yön için en son tarih
        let anchorDateForBackward; // Geri yön için en erken tarih
        if (anchorPlans.length > 0) {
            // Mevcut planlar varsa, en son ve en erken tarihleri bul
            anchorDateForForward = anchorPlans.reduce((latest, p) => 
                new Date(p.PLAN_TARIHI) > new Date(latest.PLAN_TARIHI) ? p.PLAN_TARIHI : latest.PLAN_TARIHI
            , anchorPlans[0].PLAN_TARIHI);
            anchorDateForBackward = anchorPlans.reduce((earliest, p) => 
                new Date(p.PLAN_TARIHI) < new Date(earliest.PLAN_TARIHI) ? p.PLAN_TARIHI : earliest.PLAN_TARIHI
            , anchorPlans[0].PLAN_TARIHI);
            anchorDate = anchorDateForForward; // Genel referans için en son tarihi kullan
        } else {
            // Mevcut plan yoksa, yeni tarih hesapla
            anchorDate = nextFreeDate(anchor.ISEMRI_ID, planDateObj, +1);
            anchorDateForForward = anchorDate;
            anchorDateForBackward = anchorDate;
        }
        
        // Önceki aşamaların planlı tarihlerini takip et (çakışma kontrolü için)
        const plannedDatesByStage = new Map(); // ISEMRI_SIRA -> [tarihler]
        
        // Anchor için satırlar oluştur
        if (anchorPlans.length > 0) {
            // Parça numarasına göre sırala
            anchorPlans.sort((a, b) => (a.parcaNo || 0) - (b.parcaNo || 0));
            // Anchor'ın planlı tarihlerini kaydet
            const anchorDates = [];
            // Her parça için ayrı satır oluştur
            anchorPlans.forEach(plan => {
                const planDate = formatDate(plan.PLAN_TARIHI);
                anchorDates.push(planDate);
                plannedStages.push({ 
                    isemriId: anchor.ISEMRI_ID, 
                    isemriSira: anchor.ISEMRI_SIRA, 
                    planTarihi: planDate, 
                    planlananMiktar: Math.ceil(plan.PLANLANAN_MIKTAR), // View'dan gelen değeri yukarı yuvarla
                    makAd: plan.MAK_AD || (selectedMachines && selectedMachines[anchor.ISEMRI_ID] ? selectedMachines[anchor.ISEMRI_ID] : anchor.MAK_AD),
                    malhizKodu: anchor.MALHIZ_KODU,
                    malhizAdi: anchor.MALHIZ_ADI,
                    bolumAdi: anchor.BOLUM_ADI,
                    isAnchor: true,
                    isAlreadyPlanned: true,
                    planId: plan.PLAN_ID,
                    parcaNo: plan.parcaNo,
                    figurSayisi: anchorFigurSayisi
                });
            });
            plannedDatesByStage.set(anchor.ISEMRI_SIRA, anchorDates);
        } else {
            // Planlanmamış anchor için tek satır
            // Anchor aşaması için veritabanındaki PLAN_MIKTAR değerini kullan (yukarı yuvarla)
            const anchorMiktar = Math.ceil(anchor.PLAN_MIKTAR || planlananMiktar);
            const anchorMakAd = selectedMachines && selectedMachines[anchor.ISEMRI_ID] ? selectedMachines[anchor.ISEMRI_ID] : anchor.MAK_AD;
            const anchorDateStr = formatDate(anchorDate);
            plannedDatesByStage.set(anchor.ISEMRI_SIRA, [anchorDateStr]);
            plannedStages.push({ 
                isemriId: anchor.ISEMRI_ID, 
                isemriSira: anchor.ISEMRI_SIRA, 
                planTarihi: anchorDateStr, 
                planlananMiktar: anchorMiktar, 
                makAd: anchorMakAd,
                malhizKodu: anchor.MALHIZ_KODU,
                malhizAdi: anchor.MALHIZ_ADI,
                bolumAdi: anchor.BOLUM_ADI,
                isAnchor: true,
                isAlreadyPlanned: false,
                planId: null,
                parcaNo: null,
                figurSayisi: anchorFigurSayisi
            });
        }

        // 2) İleri yön: Anchor'dan sonraki aşamalar (daha küçük ISEMRI_SIRA)
        
        let forwardDate = new Date(anchorDateForForward);
        for (let i = anchorIndex + 1; i < filteredStages.length; i++) {
            const st = filteredStages[i];
            const stagePlans = [];
            Object.keys(plansByIsemriIdAndParca).forEach(key => {
                const [isemriId, parcaNo] = key.split('_');
                if (parseInt(isemriId) === st.ISEMRI_ID) {
                    const plans = plansByIsemriIdAndParca[key];
                    plans.forEach(plan => {
                        stagePlans.push({
                            ...plan,
                            parcaNo: parseInt(parcaNo)
                        });
                    });
                }
            });
            
            let freeDate;
            const stageFigurSayisi = st.FIGUR_SAYISI || 1;
            let makAd = selectedMachines && selectedMachines[st.ISEMRI_ID] ? selectedMachines[st.ISEMRI_ID] : st.MAK_AD;
            let stagePlanId = null;
            let isAlreadyPlanned = false;
            
            if (stagePlans.length > 0) {
                // Parça numarasına göre sırala
                stagePlans.sort((a, b) => (a.parcaNo || 0) - (b.parcaNo || 0));
                // Mevcut planlar varsa, onları kullan
                const stageDates = [];
                stagePlans.forEach(plan => {
                    const planDate = formatDate(plan.PLAN_TARIHI);
                    stageDates.push(planDate);
                    plannedStages.push({ 
                        isemriId: st.ISEMRI_ID, 
                        isemriSira: st.ISEMRI_SIRA, 
                        planTarihi: planDate, 
                        planlananMiktar: Math.ceil(plan.PLANLANAN_MIKTAR), // View'dan gelen değeri yukarı yuvarla
                        makAd: plan.MAK_AD || makAd,
                        malhizKodu: st.MALHIZ_KODU,
                        malhizAdi: st.MALHIZ_ADI,
                        bolumAdi: st.BOLUM_ADI,
                        isAnchor: false,
                        isAlreadyPlanned: true,
                        planId: plan.PLAN_ID,
                        parcaNo: plan.parcaNo,
                        figurSayisi: stageFigurSayisi
                    });
                });
                // Bu aşamanın planlı tarihlerini kaydet
                plannedDatesByStage.set(st.ISEMRI_SIRA, stageDates);
                // En son tarihi forwardDate olarak kullan, ama sonraki aşama için 1 gün sonrasına ayarla
                const latestPlan = stagePlans.reduce((latest, p) => 
                    new Date(p.PLAN_TARIHI) > new Date(latest.PLAN_TARIHI) ? p : latest
                );
                // Planlı aşama bitmeden sonraki aşama başlayamaz, bu yüzden 1 gün sonrasına ayarla
                forwardDate = addDays(latestPlan.PLAN_TARIHI, 1);
            } else {
                // Mevcut plan yoksa, yeni tarih hesapla
                const days = durationToDays(st.TOTAL_SECONDS || 0);
                forwardDate = addDays(forwardDate, days);
                
                // Önceki aşamaların planlı tarihleri ile çakışma kontrolü yap
                let candidateDate = forwardDate;
                let conflictFound = true;
                let attempts = 0;
                
                while (conflictFound && attempts < 365) {
                    conflictFound = false;
                    // Önceki tüm aşamaların planlı tarihlerini kontrol et
                    for (let prevIdx = anchorIndex; prevIdx < i; prevIdx++) {
                        const prevStage = filteredStages[prevIdx];
                        const prevDates = plannedDatesByStage.get(prevStage.ISEMRI_SIRA);
                        if (prevDates && prevDates.includes(formatDate(candidateDate))) {
                            conflictFound = true;
                            candidateDate = addDays(candidateDate, 1);
                            break;
                        }
                    }
                    attempts++;
                }
                
                freeDate = nextFreeDate(st.ISEMRI_ID, candidateDate, +1);
                forwardDate = freeDate;
                
                // Yeni plan için bu aşamanın veritabanındaki PLAN_MIKTAR değerini kullan (yukarı yuvarla)
                const stageMiktar = Math.ceil(st.PLAN_MIKTAR || planlananMiktar);
                
                // Bu aşamanın planlı tarihini kaydet
                plannedDatesByStage.set(st.ISEMRI_SIRA, [formatDate(freeDate)]);
                
                plannedStages.push({ 
                    isemriId: st.ISEMRI_ID, 
                    isemriSira: st.ISEMRI_SIRA, 
                    planTarihi: formatDate(freeDate), 
                    planlananMiktar: stageMiktar, 
                    makAd,
                    malhizKodu: st.MALHIZ_KODU,
                    malhizAdi: st.MALHIZ_ADI,
                    bolumAdi: st.BOLUM_ADI,
                    isAnchor: false,
                    isAlreadyPlanned,
                    planId: stagePlanId,
                    parcaNo: null,
                    figurSayisi: stageFigurSayisi
                });
            }
        }

        // 3) Geri yön: Anchor'dan önceki aşamalar (daha büyük ISEMRI_SIRA)
        let backwardDate = new Date(anchorDateForBackward);
        for (let i = anchorIndex - 1; i >= 0; i--) {
            const st = filteredStages[i];
            const stagePlans = [];
            Object.keys(plansByIsemriIdAndParca).forEach(key => {
                const [isemriId, parcaNo] = key.split('_');
                if (parseInt(isemriId) === st.ISEMRI_ID) {
                    const plans = plansByIsemriIdAndParca[key];
                    plans.forEach(plan => {
                        stagePlans.push({
                            ...plan,
                            parcaNo: parseInt(parcaNo)
                        });
                    });
                }
            });
            
            let freeDate;
            const stageFigurSayisi = st.FIGUR_SAYISI || 1;
            let makAd = selectedMachines && selectedMachines[st.ISEMRI_ID] ? selectedMachines[st.ISEMRI_ID] : st.MAK_AD;
            let stagePlanId = null;
            let isAlreadyPlanned = false;
            
            if (stagePlans.length > 0) {
                // Parça numarasına göre sırala
                stagePlans.sort((a, b) => (a.parcaNo || 0) - (b.parcaNo || 0));
                // Mevcut planlar varsa, view'dan gelen değerleri direkt kullan (tekrar hesaplama yapma)
                const stageDates = [];
                stagePlans.forEach(plan => {
                    const planDate = formatDate(plan.PLAN_TARIHI);
                    stageDates.push(planDate);
                    plannedStages.push({ 
                        isemriId: st.ISEMRI_ID, 
                        isemriSira: st.ISEMRI_SIRA, 
                        planTarihi: planDate, 
                        planlananMiktar: Math.ceil(plan.PLANLANAN_MIKTAR), // View'dan gelen değeri yukarı yuvarla
                        makAd: plan.MAK_AD || makAd,
                        malhizKodu: st.MALHIZ_KODU,
                        malhizAdi: st.MALHIZ_ADI,
                        bolumAdi: st.BOLUM_ADI,
                        isAnchor: false,
                        isAlreadyPlanned: true,
                        planId: plan.PLAN_ID,
                        parcaNo: plan.parcaNo,
                        figurSayisi: stageFigurSayisi
                    });
                });
                // Bu aşamanın planlı tarihlerini kaydet
                plannedDatesByStage.set(st.ISEMRI_SIRA, stageDates);
                // En eski tarihi backwardDate olarak kullan, ama önceki aşama için 1 gün öncesine ayarla
                const earliestPlan = stagePlans.reduce((earliest, p) => 
                    new Date(p.PLAN_TARIHI) < new Date(earliest.PLAN_TARIHI) ? p : earliest
                );
                // Planlı aşama başlamadan önceki aşama bitmeli, bu yüzden 1 gün öncesine ayarla
                backwardDate = subDays(earliestPlan.PLAN_TARIHI, 1);
            } else {
                // Mevcut plan yoksa, yeni tarih hesapla
                const days = durationToDays(st.TOTAL_SECONDS || 0);
                backwardDate = subDays(backwardDate, days);
                freeDate = nextFreeDate(st.ISEMRI_ID, backwardDate, -1);
                backwardDate = freeDate;
                
                // Yeni plan için bu aşamanın veritabanındaki PLAN_MIKTAR değerini kullan (yukarı yuvarla)
                const stageMiktar = Math.ceil(st.PLAN_MIKTAR || planlananMiktar);
                
                // Bu aşamanın planlı tarihini kaydet
                plannedDatesByStage.set(st.ISEMRI_SIRA, [formatDate(freeDate)]);
                
                plannedStages.push({ 
                    isemriId: st.ISEMRI_ID, 
                    isemriSira: st.ISEMRI_SIRA, 
                    planTarihi: formatDate(freeDate), 
                    planlananMiktar: stageMiktar, 
                    makAd,
                    malhizKodu: st.MALHIZ_KODU,
                    malhizAdi: st.MALHIZ_ADI,
                    bolumAdi: st.BOLUM_ADI,
                    isAnchor: false,
                    isAlreadyPlanned,
                    planId: stagePlanId,
                    parcaNo: null,
                    figurSayisi: stageFigurSayisi
                });
            }
        }

        // ISEMRI_SIRA ve PARCA_NO'ya göre sırala (küçükten büyüğe)
        plannedStages.sort((a, b) => {
            if (a.isemriSira !== b.isemriSira) {
                return a.isemriSira - b.isemriSira;
            }
            const parcaNoA = a.parcaNo || 0;
            const parcaNoB = b.parcaNo || 0;
            return parcaNoA - parcaNoB;
        });

        res.json({ success: true, message: 'Kuyruk planlama özeti hazırlandı', data: { plannedStages } });

    } catch (error) {
        console.error('❌ Kuyruk planlama özeti hatası:', error);
        if (connection) {
            try { await connection.close(); } catch (err) { }
        }
        res.status(500).json({ 
            success: false, 
            message: 'Kuyruk planlama özeti başarısız: ' + error.message 
        });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { }
        }
    }
});

// Kuyruk tam planlama endpoint'i
// Kurallar:
// - Aynı ISEMRI_NO altındaki tüm aşamaları (ISEMRI_SIRA) bulur
// - Seçilen (çapa) aşama verilen tarihe sabitlenir
// - Sonraki aşamalar ileri yönde, önceki aşamalar geri yönde zincirlenir
// - Süre: (TOPLAM_HAZIRLIK_SURE + TOPLAM_SURE) saniye => gün = ceil(saniye / (8*3600)), min 1 gün
// - Aynı gün plan varsa, ileri yönde +1 gün, geri yönde -1 gün iterlenir (overwrite yok)
// - Maça aşamaları için isteğe bağlı makine override kabul edilir (selectedMachines: { [isemriId]: makAd })
app.post('/api/planning/queue-plan', async (req, res) => {
    let connection;
    try {
        const { isemriNo, anchorIsemriId, planTarihi, selectedMachines, stageDates, stagePlanIds, stageChangedFlags, selectedIsemriIds, aciklama } = req.body;
        let planlananMiktar = req.body.planlananMiktar;
        let stageQuantities = req.body.stageQuantities;

        if (!isemriNo || !anchorIsemriId || !planTarihi) {
            return res.status(400).json({ success: false, message: 'isemriNo, anchorIsemriId, planTarihi zorunlu' });
        }

        // NaN kontrolü - planlananMiktar
        if (planlananMiktar !== null && planlananMiktar !== undefined && (isNaN(planlananMiktar) || planlananMiktar <= 0)) {
            planlananMiktar = null;
        }
        
        // stageQuantities'deki NaN değerleri temizle
        let cleanedStageQuantities = {};
        if (stageQuantities && typeof stageQuantities === 'object') {
            Object.keys(stageQuantities).forEach(key => {
                const value = stageQuantities[key];
                if (value !== null && value !== undefined && !isNaN(value) && value > 0) {
                    cleanedStageQuantities[key] = parseInt(value);
                }
            });
        }
        
        // Eğer stageQuantities yoksa planlananMiktar zorunlu
        if (!cleanedStageQuantities || Object.keys(cleanedStageQuantities).length === 0) {
            if (!planlananMiktar || planlananMiktar <= 0) {
                return res.status(400).json({ success: false, message: 'planlananMiktar veya stageQuantities zorunlu ve geçerli bir sayı olmalıdır' });
            }
        }
        
        // stageQuantities'i temizlenmiş versiyonla değiştir
        stageQuantities = cleanedStageQuantities;

        connection = await pool.getConnection();

        // Tüm aşamaları getir (ISEMRI_SIRA'ya göre DESC sıralı). Amaç: ISEMRI_SIRA=0 (Paketleme) en sonda kalsın (en GEÇ tarih)
        const stagesQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT *
                FROM ERPURT.T_URT_ISEMRI
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT 
                VD.ISEMRI_ID,
                VD.ISEMRI_NO,
                VD.ISEMRI_SIRA,
                VD.MAK_AD,
                VD.BOLUM_ADI,
                NVL(VD.TOPLAM_HAZIRLIK_SURE,0) + NVL(VD.TOPLAM_SURE,0) AS TOTAL_SECONDS
            FROM ERPREADONLY.V_ISEMRI_DETAY VD
            INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
            WHERE VD.ISEMRI_NO = :isemriNo
            ORDER BY VD.ISEMRI_SIRA DESC
        `;
        const stagesResult = await connection.execute(stagesQuery, { isemriNo });
        if (stagesResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'İş emri aşaması bulunamadı' });
        }

        // Satırları nesne haline getir
        const meta = stagesResult.metaData.map(c => c.name);
        const stages = stagesResult.rows.map(r => {
            const o = {}; meta.forEach((c, i) => o[c] = r[i]); return o;
        });
        
        // Tanımsız aşamaları filtrele (makine ve bölüm tanımlı olmayan)
        let filteredStages = stages.filter(s => {
            const hasMachine = s.MAK_AD && s.MAK_AD.trim() !== '';
            const hasDepartment = s.BOLUM_ADI && s.BOLUM_ADI.trim() !== '';
            return hasMachine || hasDepartment; // En az biri tanımlı olmalı
        });
        
        // Eğer seçili aşamalar listesi varsa, sadece seçili aşamaları planla
        if (selectedIsemriIds && Array.isArray(selectedIsemriIds) && selectedIsemriIds.length > 0) {
            const selectedIdsSet = new Set(selectedIsemriIds.map(id => parseInt(id)));
            filteredStages = filteredStages.filter(s => selectedIdsSet.has(s.ISEMRI_ID));
            console.log(`✅ Sadece seçili aşamalar planlanacak: ${filteredStages.length} aşama`);
        }
        
        if (filteredStages.length === 0) {
            return res.status(404).json({ success: false, message: 'Tanımlı aşama bulunamadı veya seçili aşama yok' });
        }
        
        // Tüm aşamalar için mevcut planları tek sorguda çek (performans optimizasyonu) - PLAN_ID ile
        const allIsemriIds = filteredStages.map(s => s.ISEMRI_ID);
        const existingPlansQuery = `
            SELECT ISEMRI_ID, PLAN_ID, TRUNC(PLAN_TARIHI) AS PLAN_TARIHI, ISEMRI_PARCA_NO, PLANLANAN_MIKTAR, MAK_AD
            FROM ERPREADONLY.PLANLAMA_VERI
            WHERE ISEMRI_ID IN (${allIsemriIds.map((_, i) => `:id${i}`).join(',')})
            AND PLANLAMA_DURUMU = 'PLANLANDI'
        `;
        const planBindParams = {};
        allIsemriIds.forEach((id, i) => { planBindParams[`id${i}`] = id; });
        const existingPlansResult = await connection.execute(existingPlansQuery, planBindParams);
        const existingPlansMeta = existingPlansResult.metaData.map(c => c.name);
        const existingPlans = existingPlansResult.rows.map(r => {
            const o = {}; existingPlansMeta.forEach((c, i) => o[c] = r[i]); return o;
        });
        console.log(`📊 Mevcut planlar çekildi: ${existingPlans.length} kayıt`);
        
        // PLAN_ID'ye göre planları grupla
        const plansByPlanId = {};
        existingPlans.forEach(plan => {
            if (plan.PLAN_ID) {
                plansByPlanId[plan.PLAN_ID] = plan;
            }
        });

        const anchorIndex = filteredStages.findIndex(s => s.ISEMRI_ID === anchorIsemriId);
        if (anchorIndex === -1) {
            // Anchor seçili değilse veya filtrelenmişse, hata ver
            if (selectedIsemriIds && Array.isArray(selectedIsemriIds) && selectedIsemriIds.length > 0) {
                const anchorSelected = selectedIsemriIds.some(id => parseInt(id) === anchorIsemriId);
                if (!anchorSelected) {
                    return res.status(400).json({ success: false, message: 'Anchor aşama seçili değil. Lütfen anchor aşamasını da seçin.' });
                }
            }
            return res.status(404).json({ success: false, message: 'Anchor aşama bulunamadı veya tanımsız kategorisinde' });
        }

        // Yardımcılar
        const toDateOnly = (d) => {
            const date = new Date(d);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return new Date(`${year}-${month}-${day}T03:00:00`);
        };
        const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
        const subDays = (d, n) => addDays(d, -n);
        const durationToDays = (seconds) => Math.max(1, Math.ceil(seconds / (8 * 3600)));

        // Bellekteki mevcut planlardan kontrol et (performans optimizasyonu)
        function isBusyDate(isemriId, date) {
            const dateStr = date.toISOString().split('T')[0];
            const busy = existingPlans.some(p => p.ISEMRI_ID === isemriId && p.PLAN_TARIHI.toISOString().split('T')[0] === dateStr);
            return busy;
        }

        function nextFreeDate(isemriId, date, direction) {
            // direction: +1 ileri, -1 geri
            let cur = toDateOnly(date);
            // Eğer aynı güne plan varsa boş güne kadar iterle
            // En fazla 365 iterasyon koruma
            for (let i = 0; i < 365; i++) {
                const busy = isBusyDate(isemriId, cur);
                if (!busy) {
                    return cur;
                }
                cur = direction === -1 ? subDays(cur, 1) : addDays(cur, 1);
            }
            return cur;
        }

        function getNextParcaNo(isemriId) {
            const existing = existingPlans.filter(p => p.ISEMRI_ID === isemriId);
            if (existing.length === 0) return 1;
            const maxParcaNo = Math.max(...existing.map(p => p.ISEMRI_PARCA_NO || 0));
            return maxParcaNo + 1;
        }

        const plannedStages = [];
        const insertBatch = []; // Batch INSERT için
        const updateBatch = []; // Batch UPDATE için

        // 1) Anchor aşamayı yerleştir
        const anchor = filteredStages[anchorIndex];
        const anchorPlanId = stagePlanIds && stagePlanIds[anchor.ISEMRI_ID] ? parseInt(stagePlanIds[anchor.ISEMRI_ID]) : null;
        const existingAnchorPlan = anchorPlanId ? plansByPlanId[anchorPlanId] : null;
        
        // planTarihi'yi Date nesnesine çevir
        const planDateObj = new Date(planTarihi);
        
        // Eğer stageDates'te anchor için özel tarih varsa onu kullan, yoksa mevcut planı veya otomatik hesapla
        let anchorDate;
        let anchorMiktar;
        let anchorMakAd = selectedMachines && selectedMachines[anchor.ISEMRI_ID] ? selectedMachines[anchor.ISEMRI_ID] : anchor.MAK_AD;
        let anchorParcaNo;
        const anchorChanged = stageChangedFlags && stageChangedFlags[anchor.ISEMRI_ID];
        
        if (stageDates && stageDates[anchor.ISEMRI_ID] && anchorChanged) {
            // Kullanıcı tarafından değiştirilen tarihi direkt kullan
            anchorDate = toDateOnly(new Date(stageDates[anchor.ISEMRI_ID]));
        } else if (existingAnchorPlan) {
            // Mevcut plan varsa ve kullanıcı değiştirmemişse, mevcut tarihi kullan
            anchorDate = existingAnchorPlan.PLAN_TARIHI;
        } else {
            // Yeni plan, otomatik hesapla
            anchorDate = nextFreeDate(anchor.ISEMRI_ID, planDateObj, +1);
        }
        
        // Miktarı belirle
        const anchorQuantityChanged = stageChangedFlags && stageChangedFlags[anchor.ISEMRI_ID];
        if (stageQuantities && stageQuantities[anchor.ISEMRI_ID]) {
            const qty = parseInt(stageQuantities[anchor.ISEMRI_ID]);
            if (!isNaN(qty) && qty > 0) {
                anchorMiktar = qty;
            } else {
                anchorMiktar = existingAnchorPlan ? existingAnchorPlan.PLANLANAN_MIKTAR : (planlananMiktar ? parseInt(planlananMiktar) : 0);
            }
        } else if (existingAnchorPlan && !anchorQuantityChanged) {
            // Mevcut plan varsa ve kullanıcı miktarı değiştirmemişse, mevcut miktarı kullan
            anchorMiktar = existingAnchorPlan.PLANLANAN_MIKTAR || (planlananMiktar ? parseInt(planlananMiktar) : 0);
        } else {
            anchorMiktar = planlananMiktar ? parseInt(planlananMiktar) : 0;
        }
        // NaN kontrolü
        if (isNaN(anchorMiktar) || anchorMiktar <= 0) {
            return res.status(400).json({ success: false, message: 'Geçerli bir planlanan miktar değeri gerekli' });
        }
        
        anchorParcaNo = existingAnchorPlan ? existingAnchorPlan.ISEMRI_PARCA_NO : getNextParcaNo(anchor.ISEMRI_ID);
        
        // UPDATE veya INSERT kararı
        if (existingAnchorPlan && anchorPlanId) {
            // Mevcut planı güncelle
            updateBatch.push({
                planId: anchorPlanId,
                isemriId: anchor.ISEMRI_ID,
                tarih: anchorDate,
                miktar: anchorMiktar,
                makAd: anchorMakAd
            });
        } else {
            // Yeni plan oluştur
            insertBatch.push({
                id: anchor.ISEMRI_ID,
                tarih: anchorDate,
                parca: anchorParcaNo,
                miktar: anchorMiktar,
                makAd: anchorMakAd
            });
        }
        plannedStages.push({ isemriId: anchor.ISEMRI_ID, isemriSira: anchor.ISEMRI_SIRA, planTarihi: anchorDate.toISOString().split('T')[0], planlananMiktar: anchorMiktar, makAd: anchorMakAd });

        // DESC sıralamaya göre (Paketleme=0 en sonda olacak şekilde):
        // Anchor'dan sonraki index'ler (i > anchorIndex) → Daha KÜÇÜK ISEMRI_SIRA → İleri yön (gelecek tarihler)
        // Anchor'dan önceki index'ler (i < anchorIndex) → Daha BÜYÜK ISEMRI_SIRA → Geri yön (geçmiş tarihler)
        
        // 2) İleri yön: Anchor'dan SONRA gelen aşamalar (daha küçük sira; paketleme 0 dâhil) → GELECEK TARİHLERE
        let forwardDate = new Date(anchorDate);
        for (let i = anchorIndex + 1; i < filteredStages.length; i++) {
            const st = filteredStages[i];
            const stagePlanId = stagePlanIds && stagePlanIds[st.ISEMRI_ID] ? parseInt(stagePlanIds[st.ISEMRI_ID]) : null;
            const existingPlan = stagePlanId ? plansByPlanId[stagePlanId] : null;
            
            // Eğer stageDates'te bu aşama için özel tarih varsa onu kullan, yoksa mevcut planı veya otomatik hesapla
            let freeDate;
            let stageMiktar;
            let makAd = selectedMachines && selectedMachines[st.ISEMRI_ID] ? selectedMachines[st.ISEMRI_ID] : st.MAK_AD;
            let parcaNo;
            const stageChanged = stageChangedFlags && stageChangedFlags[st.ISEMRI_ID];
            
            if (stageDates && stageDates[st.ISEMRI_ID] && stageChanged) {
                // Kullanıcı tarafından değiştirilen tarihi direkt kullan
                freeDate = toDateOnly(new Date(stageDates[st.ISEMRI_ID]));
            } else if (existingPlan) {
                // Mevcut plan varsa ve kullanıcı değiştirmemişse, mevcut tarihi kullan
                freeDate = existingPlan.PLAN_TARIHI;
            } else {
                // Yeni plan, otomatik hesapla
                const days = durationToDays(st.TOTAL_SECONDS || 0);
                forwardDate = addDays(forwardDate, days);
                freeDate = nextFreeDate(st.ISEMRI_ID, forwardDate, +1);
            }
            
            // Miktarı belirle
            const stageQuantityChanged = stageChangedFlags && stageChangedFlags[st.ISEMRI_ID];
            if (stageQuantities && stageQuantities[st.ISEMRI_ID]) {
                const qty = parseInt(stageQuantities[st.ISEMRI_ID]);
                if (!isNaN(qty) && qty > 0) {
                    stageMiktar = qty;
                } else {
                    stageMiktar = existingPlan ? existingPlan.PLANLANAN_MIKTAR : (planlananMiktar ? parseInt(planlananMiktar) : anchorMiktar);
                }
            } else if (existingPlan && !stageQuantityChanged) {
                // Mevcut plan varsa ve kullanıcı miktarı değiştirmemişse, mevcut miktarı kullan
                stageMiktar = existingPlan.PLANLANAN_MIKTAR || (planlananMiktar ? parseInt(planlananMiktar) : anchorMiktar);
            } else {
                stageMiktar = planlananMiktar ? parseInt(planlananMiktar) : anchorMiktar;
            }
            // NaN kontrolü
            if (isNaN(stageMiktar) || stageMiktar <= 0) {
                stageMiktar = anchorMiktar; // Fallback olarak anchor miktarını kullan
            }
            
            parcaNo = existingPlan ? existingPlan.ISEMRI_PARCA_NO : getNextParcaNo(st.ISEMRI_ID);
            
            // UPDATE veya INSERT kararı
            if (existingPlan && stagePlanId) {
                // Mevcut planı güncelle
                updateBatch.push({
                    planId: stagePlanId,
                    isemriId: st.ISEMRI_ID,
                    tarih: freeDate,
                    miktar: stageMiktar,
                    makAd
                });
            } else {
                // Yeni plan oluştur
                insertBatch.push({
                    id: st.ISEMRI_ID,
                    tarih: freeDate,
                    parca: parcaNo,
                    miktar: stageMiktar,
                    makAd
                });
            }
            plannedStages.push({ isemriId: st.ISEMRI_ID, isemriSira: st.ISEMRI_SIRA, planTarihi: freeDate.toISOString().split('T')[0], planlananMiktar: stageMiktar, makAd });
            forwardDate = freeDate;
        }

        // 3) Geri yön: Anchor'dan ÖNCE gelen aşamalar (daha büyük sira; kalıp, maça, vb.) → GEÇMİŞ TARİHLERE
        let backwardDate = new Date(anchorDate);
        for (let i = anchorIndex - 1; i >= 0; i--) {
            const st = filteredStages[i];
            const stagePlanId = stagePlanIds && stagePlanIds[st.ISEMRI_ID] ? parseInt(stagePlanIds[st.ISEMRI_ID]) : null;
            const existingPlan = stagePlanId ? plansByPlanId[stagePlanId] : null;
            
            // Eğer stageDates'te bu aşama için özel tarih varsa onu kullan, yoksa mevcut planı veya otomatik hesapla
            let freeDate;
            let stageMiktar;
            let makAd = selectedMachines && selectedMachines[st.ISEMRI_ID] ? selectedMachines[st.ISEMRI_ID] : st.MAK_AD;
            let parcaNo;
            const stageChanged = stageChangedFlags && stageChangedFlags[st.ISEMRI_ID];
            
            if (stageDates && stageDates[st.ISEMRI_ID] && stageChanged) {
                // Kullanıcı tarafından değiştirilen tarihi direkt kullan
                freeDate = toDateOnly(new Date(stageDates[st.ISEMRI_ID]));
            } else if (existingPlan) {
                // Mevcut plan varsa ve kullanıcı değiştirmemişse, mevcut tarihi kullan
                freeDate = existingPlan.PLAN_TARIHI;
            } else {
                // Yeni plan, otomatik hesapla
                const days = durationToDays(st.TOTAL_SECONDS || 0);
                backwardDate = subDays(backwardDate, days);
                freeDate = nextFreeDate(st.ISEMRI_ID, backwardDate, -1);
            }
            
            // Miktarı belirle
            const stageQuantityChanged = stageChangedFlags && stageChangedFlags[st.ISEMRI_ID];
            if (stageQuantities && stageQuantities[st.ISEMRI_ID]) {
                const qty = parseInt(stageQuantities[st.ISEMRI_ID]);
                if (!isNaN(qty) && qty > 0) {
                    stageMiktar = qty;
                } else {
                    stageMiktar = existingPlan ? existingPlan.PLANLANAN_MIKTAR : (planlananMiktar ? parseInt(planlananMiktar) : anchorMiktar);
                }
            } else if (existingPlan && !stageQuantityChanged) {
                // Mevcut plan varsa ve kullanıcı miktarı değiştirmemişse, mevcut miktarı kullan
                stageMiktar = existingPlan.PLANLANAN_MIKTAR || (planlananMiktar ? parseInt(planlananMiktar) : anchorMiktar);
            } else {
                stageMiktar = planlananMiktar ? parseInt(planlananMiktar) : anchorMiktar;
            }
            // NaN kontrolü
            if (isNaN(stageMiktar) || stageMiktar <= 0) {
                stageMiktar = anchorMiktar; // Fallback olarak anchor miktarını kullan
            }
            
            parcaNo = existingPlan ? existingPlan.ISEMRI_PARCA_NO : getNextParcaNo(st.ISEMRI_ID);
            
            // UPDATE veya INSERT kararı
            if (existingPlan && stagePlanId) {
                // Mevcut planı güncelle
                updateBatch.push({
                    planId: stagePlanId,
                    isemriId: st.ISEMRI_ID,
                    tarih: freeDate,
                    miktar: stageMiktar,
                    makAd
                });
            } else {
                // Yeni plan oluştur
                insertBatch.push({
                    id: st.ISEMRI_ID,
                    tarih: freeDate,
                    parca: parcaNo,
                    miktar: stageMiktar,
                    makAd
                });
            }
            plannedStages.push({ isemriId: st.ISEMRI_ID, isemriSira: st.ISEMRI_SIRA, planTarihi: freeDate.toISOString().split('T')[0], planlananMiktar: stageMiktar, makAd });
            backwardDate = freeDate;
        }

        // Tüm UPDATE'leri toplu olarak yap
        if (updateBatch.length > 0) {
            const updateSQL = `UPDATE ERPREADONLY.PLANLAMA_VERI 
                              SET PLAN_TARIHI = :tarih, 
                                  PLANLANAN_MIKTAR = :miktar, 
                                  MAK_AD = :makAd,
                                  MAK_ID = :makId,
                                  ACIKLAMA = :aciklama
                              WHERE PLAN_ID = :planId`;
            
            // Tüm UPDATE'leri sırayla yap
            for (const item of updateBatch) {
                // MAK_ID'yi al
                let makId = null;
                if (item.makAd) {
                    const makIdQuery = `
                        WITH ISEMRI_FILTERED AS (
                            SELECT * 
                            FROM ERPURT.T_URT_ISEMRI 
                            WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                        )
                        SELECT DISTINCT MAK_ID
                        FROM ERPREADONLY.V_ISEMRI_DETAY 
                        WHERE ISEMRI_ID = :isemriId AND MAK_AD = :makAd
                    `;
                    const makIdResult = await connection.execute(makIdQuery, { isemriId: item.isemriId, makAd: item.makAd });
                    if (makIdResult.rows.length > 0 && makIdResult.rows[0][0]) {
                        makId = makIdResult.rows[0][0];
                    }
                }
                
                await connection.execute(updateSQL, {
                    planId: item.planId,
                    tarih: item.tarih,
                    miktar: item.miktar,
                    makAd: item.makAd,
                    makId: makId,
                    aciklama: aciklama || null
                });
            }
        }
        
        // Tüm INSERT'leri toplu olarak yap (autocommit kapalı, tek commit)
        if (insertBatch.length > 0) {
            const insertSQL = `INSERT INTO ERPREADONLY.PLANLAMA_VERI (ISEMRI_ID, PLAN_TARIHI, ISEMRI_PARCA_NO, PLANLANAN_MIKTAR, PLANLAMA_DURUMU, MAK_AD, MAK_ID, ACIKLAMA)
                              VALUES (:id, :tarih, :parca, :miktar, 'PLANLANDI', :makAd, :makId, :aciklama)`;
            
            // Tüm INSERT'leri sırayla yap (commit yok, sadece execute)
            for (const item of insertBatch) {
                // MAK_ID'yi al
                let makId = null;
                if (item.makAd) {
                    const makIdQuery = `
                        WITH ISEMRI_FILTERED AS (
                            SELECT * 
                            FROM ERPURT.T_URT_ISEMRI 
                            WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                        )
                        SELECT DISTINCT MAK_ID
                        FROM ERPREADONLY.V_ISEMRI_DETAY 
                        WHERE ISEMRI_ID = :isemriId AND MAK_AD = :makAd
                    `;
                    const makIdResult = await connection.execute(makIdQuery, { isemriId: item.id, makAd: item.makAd });
                    if (makIdResult.rows.length > 0 && makIdResult.rows[0][0]) {
                        makId = makIdResult.rows[0][0];
                    }
                }
                
                await connection.execute(insertSQL, {
                    ...item,
                    makId: makId,
                    aciklama: aciklama || null
                });
            }
        }

        await connection.commit();

        res.json({ success: true, message: 'Kuyruk tam planlama yapıldı', data: { plannedStages } });

    } catch (error) {
        console.error('❌ Kuyruk tam planlama hatası:', error);
        console.error('Stack:', error.stack);
        if (connection) {
            try { await connection.rollback(); } catch (err) { 
                console.error('Rollback hatası:', err);
            }
        }
        res.status(500).json({ 
            success: false, 
            message: 'Kuyruk tam planlama başarısız: ' + error.message 
        });
    } finally {
        if (connection) {
            try { 
                await connection.close(); 
            } catch (err) { 
                console.error('Connection close hatası:', err);
            }
        }
    }
});

// Üretim süreci aşamalarını getir
app.get('/api/production-stages/:isemriNo', async (req, res) => {
let connection;
try {
    const { isemriNo } = req.params;
    
    connection = await pool.getConnection();
    
    // Tüm aşamaları ve kırılımlarını çek (ISEMRI_SIRA'ya göre sıralı)
    const stagesQuery = `
        WITH ISEMRI_FILTERED AS (
            SELECT *
            FROM ERPURT.T_URT_ISEMRI
            WHERE FABRIKA_KOD = 120 AND DURUMU = 1
        )
        SELECT
            VD.ISEMRI_ID,
            VD.ISEMRI_NO,
            VD.ISEMRI_SIRA,
            VD.MALHIZ_KODU,
            VD.MALHIZ_ADI,
            VD.MAK_AD,
            VD.BOLUM_ADI,
            VD.TOPLAM_SURE,
            VD.TOPLAM_HAZIRLIK_SURE,
            VD.ONERILEN_TESLIM_TARIH,
            VD.PLAN_MIKTAR,
            VD.GERCEK_MIKTAR,
            VD.HURDA_MIKTAR,
            VD.AGIRLIK,
            VD.FIGUR_SAYISI,
            VD.IMALAT_TURU,
            VD.FIRMA_ADI,
            VD.ISEMRI_AC_TAR,
            -- Planlama durumu (kırılımlar dahil)
            PV.PLAN_ID,
            PV.PLAN_TARIHI,
            PV.PLANLANAN_MIKTAR,
            PV.PLANLAMA_DURUMU,
            PV.MAK_AD as SELECTED_MACHINE,
            PV.ISEMRI_PARCA_NO
        FROM ERPREADONLY.V_ISEMRI_DETAY VD
        INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
        LEFT JOIN ERPREADONLY.PLANLAMA_VERI PV ON VD.ISEMRI_ID = PV.ISEMRI_ID
        WHERE VD.ISEMRI_NO = :isemriNo
        ORDER BY VD.ISEMRI_SIRA ASC, PV.ISEMRI_PARCA_NO ASC NULLS LAST
    `;
    
    const stagesResult = await connection.execute(stagesQuery, { isemriNo });
    
    if (stagesResult.rows.length === 0) {
        return res.json({ success: false, message: 'Bu iş emri numarasına ait aşama bulunamadı' });
    }
    
    // Aşamaları işle ve durumlarını belirle
    const meta = stagesResult.metaData.map(c => c.name);
    const stages = stagesResult.rows.map(row => {
        const rowObj = {};
        meta.forEach((col, i) => {
            rowObj[col] = row[i];
        });
        
        const isPlanned = rowObj.PLAN_ID !== null;
        const isCompleted = rowObj.GERCEK_MIKTAR && rowObj.GERCEK_MIKTAR >= (rowObj.PLANLANAN_MIKTAR || rowObj.PLAN_MIKTAR);
        const isInProgress = isPlanned && rowObj.GERCEK_MIKTAR > 0 && !isCompleted;
        const isSkipped = rowObj.IMALAT_TURU === 'ATLANDI' || rowObj.BOLUM_ADI === 'ATLANDI';
        
        let status = 'planned';
        let progress = 0;
        
        if (isSkipped) {
            status = 'skipped';
        } else if (isCompleted) {
            status = 'completed';
            progress = 100;
        } else if (isInProgress) {
            status = 'in-progress';
            if (rowObj.GERCEK_MIKTAR && (rowObj.PLANLANAN_MIKTAR || rowObj.PLAN_MIKTAR)) {
                progress = Math.min(100, Math.round((rowObj.GERCEK_MIKTAR / (rowObj.PLANLANAN_MIKTAR || rowObj.PLAN_MIKTAR)) * 100));
            }
        } else if (isPlanned) {
            status = 'planned';
            progress = 0;
        } else {
            status = 'waiting';
            progress = 0;
        }
        
        const startDate = rowObj.PLAN_TARIHI ? new Date(rowObj.PLAN_TARIHI) : null;
        const endDate = startDate ? new Date(startDate.getTime() + (rowObj.TOPLAM_SURE * 1000)) : null;
        
        return {
            isemriId: rowObj.ISEMRI_ID,
            isemriNo: rowObj.ISEMRI_NO,
            isemriSira: rowObj.ISEMRI_SIRA,
            stageName: rowObj.BOLUM_ADI || 'Bilinmeyen Aşama',
            productCode: rowObj.MALHIZ_KODU || 'Bilinmeyen Kod',
            malhizKodu: rowObj.MALHIZ_KODU,
            malhizAdi: rowObj.MALHIZ_ADI,
            makAd: rowObj.SELECTED_MACHINE || rowObj.MAK_AD,
            workCenter: rowObj.MAK_AD,
            status: status,
            progress: progress,
            planMiktar: rowObj.PLANLANAN_MIKTAR || rowObj.PLAN_MIKTAR || 0, // Kırılım miktarı varsa onu, yoksa ana miktarı
            gercekMiktar: rowObj.GERCEK_MIKTAR || 0,
            hurdaMiktar: rowObj.HURDA_MIKTAR || 0,
            agirlik: rowObj.AGIRLIK || 0,
            toplamSure: rowObj.TOPLAM_SURE || 0,
            toplamHazirlikSure: rowObj.TOPLAM_HAZIRLIK_SURE || 0,
            onerilenTeslim: rowObj.ONERILEN_TESLIM_TARIH,
            firmaAdi: rowObj.FIRMA_ADI,
            isemriAcTar: rowObj.ISEMRI_AC_TAR,
            planId: rowObj.PLAN_ID,
            planTarihi: rowObj.PLAN_TARIHI,
            planlananMiktar: rowObj.PLANLANAN_MIKTAR,
            parcaNo: rowObj.ISEMRI_PARCA_NO,
            startDate: startDate,
            endDate: endDate,
            startTime: startDate ? startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : null,
            endTime: endDate ? endDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : null,
            startDateFormatted: startDate ? startDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) : null,
            endDateFormatted: endDate ? endDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) : null
        };
    });
    
    // Genel bilgileri hesapla
    const totalStages = stages.length;
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const inProgressStages = stages.filter(s => s.status === 'in-progress');
    const activeStage = inProgressStages.length > 0 ? inProgressStages[0] : stages.find(s => s.status === 'planned');
    
    const overallProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
    
    res.json({
        success: true,
        data: {
            isemriNo: isemriNo,
            mainProduct: stages[0]?.malhizAdi || 'Bilinmeyen Ürün',
            totalStages: totalStages,
            completedStages: completedStages,
            activeStage: activeStage?.stageName || 'Yok',
            overallProgress: overallProgress,
            completedUnits: activeStage ? `${activeStage.gercekMiktar}/${activeStage.planMiktar}` : '0/0',
            stages: stages
        }
    });
    
} catch (error) {
    console.error('Üretim aşamaları getirme hatası:', error);
    res.status(500).json({ success: false, message: 'Üretim aşamaları getirilirken hata oluştu: ' + error.message });
} finally {
    if (connection) {
        try {
            await connection.close();
        } catch (closeError) {
            console.error('Bağlantı kapatma hatası:', closeError);
        }
        }
    }
});

// Planlama verisi güncelleme endpoint'i
app.put('/api/planning/update', async (req, res) => {
    let connection;
    try {
        const { planId, planTarihi, planlananMiktar, selectedMachine, aciklama } = req.body;
        
        // planId kontrolü - "queue-" ile başlayan geçici ID'leri reddet
        if (!planId || (typeof planId === 'string' && planId.startsWith('queue-'))) {
            return res.status(400).json({
                success: false,
                message: `Geçersiz planId değeri: "${planId}" sayıya dönüştürülemiyor`
            });
        }
        
        // planId'yi sayıya dönüştür
        const numericPlanId = parseInt(planId);
        if (isNaN(numericPlanId) || numericPlanId <= 0) {
            return res.status(400).json({
                success: false,
                message: `Geçersiz planId değeri: "${planId}" sayıya dönüştürülemiyor`
            });
        }
        
        // Değer doğrulama - planlananMiktar ve planTarihi
        if (!planlananMiktar || planlananMiktar === null || planlananMiktar === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz planlananMiktar değeri: planlananMiktar gerekli ve sayısal olmalı'
            });
        }
        
        if (!planTarihi || planTarihi === null || planTarihi === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz planTarihi değeri: planTarihi gerekli'
            });
        }
        
        // Sayısal değerleri parse et ve kontrol et
        const parsedPlanlananMiktar = parseInt(planlananMiktar);
        
        if (isNaN(parsedPlanlananMiktar)) {
            return res.status(400).json({
                success: false,
                message: `Geçersiz planlananMiktar değeri: "${planlananMiktar}" sayıya dönüştürülemiyor`
            });
        }
        
        console.log('Planlama verisi güncelleniyor:', {
            planId: numericPlanId,
            planTarihi,
            planlananMiktar: parsedPlanlananMiktar,
            selectedMachine
        });
        
        connection = await pool.getConnection();
        
        // Mevcut planın bilgilerini al (MAK_AD için)
        const currentPlanQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT PV.ISEMRI_ID, PV.MAK_AD
            FROM ERPREADONLY.PLANLAMA_VERI PV
            INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
            WHERE PV.PLAN_ID = :planId
        `;
        const currentPlanResult = await connection.execute(currentPlanQuery, { planId: numericPlanId });
        
        let targetMachine = null;
        if (currentPlanResult.rows.length > 0) {
            const currentMakAd = currentPlanResult.rows[0][1];
            const isemriId = currentPlanResult.rows[0][0];
            
            // Maça aşaması kontrolü
            const stageInfoQuery = `
                WITH ISEMRI_FILTERED AS (
                    SELECT * 
                    FROM ERPURT.T_URT_ISEMRI 
                    WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                )
                SELECT MAK_AD, BOLUM_ADI
                FROM ERPREADONLY.V_ISEMRI_DETAY 
                WHERE ISEMRI_ID = :isemriId
            `;
            const stageInfoResult = await connection.execute(stageInfoQuery, { isemriId });
            if (stageInfoResult.rows.length > 0) {
                const originalMakAd = stageInfoResult.rows[0][0];
                const bolumAdi = stageInfoResult.rows[0][1] || '';
                
                // Maça aşaması kontrolü
                const macaKeywords = ['maça', 'maca'];
                const isMacaStage = macaKeywords.some(k => 
                    (bolumAdi || '').toLowerCase().includes(k) || 
                    (originalMakAd || '').toLowerCase().includes(k)
                );
                
                if (isMacaStage) {
                    // Maça aşaması: Seçilen makine varsa onu kullan, yoksa mevcut makineyi kullan
                    targetMachine = selectedMachine || currentMakAd || originalMakAd;
                    if (selectedMachine) {
                        console.log('✅ Maça aşaması için seçilen makine (UPDATE):', selectedMachine);
                    }
                } else {
                    // Maça dışı aşamalar: Seçilen makine varsa onu kullan, yoksa mevcut makineyi koru
                    // Bu sayede tüm aşamalar için makine değiştirme mümkün olur
                    targetMachine = selectedMachine || currentMakAd || originalMakAd;
                    if (selectedMachine) {
                        console.log('✅ Maça dışı aşama için seçilen makine (UPDATE):', selectedMachine);
                    }
                }
            } else {
                // Stage info bulunamazsa mevcut makineyi kullan
                targetMachine = currentMakAd;
            }
        } else {
            // Plan bulunamazsa selectedMachine'i kullan
            targetMachine = selectedMachine || null;
        }
        
        // MAK_ID'yi al
        let updateMakIdForSplit = null;
        if (targetMachine && currentPlanResult.rows.length > 0) {
            const isemriId = currentPlanResult.rows[0][0];
            const makIdQuery = `
                WITH ISEMRI_FILTERED AS (
                    SELECT * 
                    FROM ERPURT.T_URT_ISEMRI 
                    WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                )
                SELECT DISTINCT MAK_ID
                FROM ERPREADONLY.V_ISEMRI_DETAY 
                WHERE ISEMRI_ID = :isemriId AND MAK_AD = :targetMachine
            `;
            const makIdResult = await connection.execute(makIdQuery, { isemriId: isemriId, targetMachine });
            if (makIdResult.rows.length > 0 && makIdResult.rows[0][0]) {
                updateMakIdForSplit = makIdResult.rows[0][0];
            }
        }
        
        // PLANLAMA_VERI tablosunda güncelleme yap
        const updateQuery = `
            UPDATE ERPREADONLY.PLANLAMA_VERI 
            SET PLAN_TARIHI = TO_DATE(:planTarihi, 'YYYY-MM-DD"T"HH24:MI:SS'), 
                PLANLANAN_MIKTAR = :planlananMiktar,
                PLANLAMA_DURUMU = 'PLANLANDI',
                MAK_AD = :targetMachine,
                MAK_ID = :targetMakId,
                ACIKLAMA = :aciklama
            WHERE PLAN_ID = :planId
        `;
        
        // planTarihi'yi Oracle uyumlu formata çevir
        const planDate = new Date(planTarihi);
        if (isNaN(planDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: `Geçersiz planTarihi değeri: "${planTarihi}" tarihe dönüştürülemiyor`
            });
        }
        
        const year = planDate.getFullYear();
        const month = String(planDate.getMonth() + 1).padStart(2, '0');
        const day = String(planDate.getDate()).padStart(2, '0');
        const planTarihiOracle = `${year}-${month}-${day}T03:00:00`;
        
        const bindVars = {
            planId: numericPlanId,
            planTarihi: planTarihiOracle,
            planlananMiktar: parsedPlanlananMiktar,
            targetMachine: targetMachine,
            targetMakId: updateMakIdForSplit,
            aciklama: aciklama || null
        };
        
        const result = await connection.execute(updateQuery, bindVars);
        await connection.commit();
        
        console.log('Planlama verisi başarıyla güncellendi:', bindVars);
        console.log('Etkilenen satır sayısı:', result.rowsAffected);
        
        res.json({
            success: true,
            message: 'Planlama verisi başarıyla güncellendi',
            data: bindVars,
            rowsAffected: result.rowsAffected
        });
        
    } catch (error) {
        console.error('❌ Planlama verisi güncelleme hatası:', error);
        console.error('Stack:', error.stack);
        if (connection) {
            try { 
            await connection.rollback();
            } catch (rollbackErr) {
                console.error('Rollback hatası:', rollbackErr);
            }
        }
        res.status(500).json({
            success: false,
            message: 'Planlama verisi güncellenemedi: ' + error.message
        });
    } finally {
        if (connection) {
            try { 
            await connection.close();
            } catch (closeErr) {
                console.error('Connection close hatası:', closeErr);
            }
        }
    }
});

// Makine değiştirme endpoint'i (planlama verisi olmayan işler için)
app.put('/api/planning/update-machine', async (req, res) => {
    let connection;
    try {
        const { isemriId, isemriParcaNo, newMachine } = req.body;
        
        if (!isemriId || !newMachine) {
            return res.status(400).json({
                success: false,
                message: 'isemriId ve newMachine parametreleri gerekli'
            });
        }
        
        console.log('Makine değiştiriliyor:', {
            isemriId,
            isemriParcaNo,
            newMachine
        });
        
        connection = await pool.getConnection();
        
        // Önce mevcut planlama verisini kontrol et
        let checkPlanQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT PLAN_ID, ISEMRI_PARCA_NO, MAK_AD
            FROM ERPREADONLY.PLANLAMA_VERI PV
            INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
            WHERE PV.ISEMRI_ID = :isemriId
        `;
        
        const bindVars = { isemriId };
        if (isemriParcaNo !== undefined) {
            checkPlanQuery += ' AND PV.ISEMRI_PARCA_NO = :isemriParcaNo';
            bindVars.isemriParcaNo = isemriParcaNo;
        }
        checkPlanQuery += ' ORDER BY PV.PLAN_ID DESC';
        
        const planResult = await connection.execute(checkPlanQuery, bindVars);
        
        if (planResult.rows.length > 0) {
            // MAK_ID'yi al
            let updateMakId = null;
            if (newMachine) {
                const makIdQuery = `
                    WITH ISEMRI_FILTERED AS (
                        SELECT * 
                        FROM ERPURT.T_URT_ISEMRI 
                        WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                    )
                    SELECT DISTINCT MAK_ID
                    FROM ERPREADONLY.V_ISEMRI_DETAY 
                    WHERE ISEMRI_ID = :isemriId AND MAK_AD = :newMachine
                `;
                const makIdResult = await connection.execute(makIdQuery, { isemriId, newMachine });
                if (makIdResult.rows.length > 0 && makIdResult.rows[0][0]) {
                    updateMakId = makIdResult.rows[0][0];
                }
            }
            
            // Planlama verisi varsa, tüm planlama kayıtlarının makinesini güncelle
            let updateQuery = `
                UPDATE ERPREADONLY.PLANLAMA_VERI 
                SET MAK_AD = :newMachine,
                    MAK_ID = :newMachineMakId
                WHERE ISEMRI_ID = :isemriId
            `;
            
            const updateBindVars = { isemriId, newMachine, newMachineMakId: updateMakId };
            if (isemriParcaNo !== undefined) {
                updateQuery += ' AND ISEMRI_PARCA_NO = :isemriParcaNo';
                updateBindVars.isemriParcaNo = isemriParcaNo;
            }
            
            const updateResult = await connection.execute(updateQuery, updateBindVars);
            await connection.commit();
            
            console.log('Makine başarıyla güncellendi (planlama verisi mevcuttu):', {
                rowsAffected: updateResult.rowsAffected,
                isemriId,
                newMachine
            });
            
            res.json({
                success: true,
                message: 'Makine başarıyla güncellendi',
                data: {
                    isemriId,
                    isemriParcaNo,
                    newMachine,
                    rowsAffected: updateResult.rowsAffected
                }
            });
        } else {
            // Planlama verisi yoksa, yeni bir planlama kaydı oluştur (sadece makine bilgisi ile)
            // Önce iş emri bilgilerini al
            let isemriInfoQuery = `
                WITH ISEMRI_FILTERED AS (
                    SELECT * 
                    FROM ERPURT.T_URT_ISEMRI 
                    WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                )
                SELECT VD.ISEMRI_ID, VD.ISEMRI_SIRA, VD.MAK_AD, VD.BOLUM_ADI
                FROM ERPREADONLY.V_ISEMRI_DETAY VD
                INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
                WHERE VD.ISEMRI_ID = :isemriId
            `;
            
            if (isemriParcaNo !== undefined) {
                isemriInfoQuery += ' AND VD.ISEMRI_SIRA = :isemriParcaNo';
            } else {
                isemriInfoQuery += ' AND VD.ISEMRI_SIRA = 0';
            }
            
            const isemriInfoResult = await connection.execute(isemriInfoQuery, bindVars);
            
            if (isemriInfoResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'İş emri bulunamadı'
                });
            }
            
            const parcaNo = isemriParcaNo !== undefined ? isemriParcaNo : 0;
            
            // MAK_ID'yi al
            let newMachineMakId = null;
            if (newMachine) {
                const makIdQuery = `
                    WITH ISEMRI_FILTERED AS (
                        SELECT * 
                        FROM ERPURT.T_URT_ISEMRI 
                        WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                    )
                    SELECT DISTINCT MAK_ID
                    FROM ERPREADONLY.V_ISEMRI_DETAY 
                    WHERE ISEMRI_ID = :isemriId AND MAK_AD = :newMachine
                `;
                const makIdResult = await connection.execute(makIdQuery, { isemriId, newMachine });
                if (makIdResult.rows.length > 0 && makIdResult.rows[0][0]) {
                    newMachineMakId = makIdResult.rows[0][0];
                }
            }
            
            // Yeni planlama kaydı oluştur (makine bilgisi ile, planlanmamış durumda)
            const insertQuery = `
                INSERT INTO ERPREADONLY.PLANLAMA_VERI 
                (ISEMRI_ID, PLAN_TARIHI, ISEMRI_PARCA_NO, PLANLANAN_MIKTAR, PLANLAMA_DURUMU, MAK_AD, MAK_ID, ACIKLAMA)
                VALUES (:isemriId, NULL, :parcaNo, 0, 'BEKLEMEDE', :newMachine, :newMachineMakId, 'Makine değiştirildi')
            `;
            
            await connection.execute(insertQuery, {
                isemriId,
                parcaNo,
                newMachine,
                newMachineMakId
            });
            await connection.commit();
            
            console.log('Yeni planlama kaydı oluşturuldu (makine bilgisi ile):', {
                isemriId,
                parcaNo,
                newMachine
            });
            
            res.json({
                success: true,
                message: 'Makine bilgisi planlama verisine eklendi',
                data: {
                    isemriId,
                    isemriParcaNo: parcaNo,
                    newMachine
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Makine değiştirme hatası:', error);
        if (connection) {
            try { 
                await connection.rollback();
            } catch (rollbackErr) {
                console.error('Rollback hatası:', rollbackErr);
            }
        }
        res.status(500).json({
            success: false,
            message: 'Makine değiştirilemedi: ' + error.message
        });
    } finally {
        if (connection) {
            try { 
                await connection.close();
            } catch (closeErr) {
                console.error('Connection close hatası:', closeErr);
            }
        }
    }
});

// Planlama verisi geri çekme endpoint'i
app.delete('/api/planning/revert', async (req, res) => {
    let connection;
    try {
        const { planId, isemriParcaNo, isemriId, parcaNo } = req.body;
        
        console.log('Planlama verisi geri çekiliyor:', {
            planId,
            planIdType: typeof planId,
            planIdParsed: planId ? (typeof planId === 'object' ? 'object (geçersiz)' : parseInt(planId)) : null,
            isemriParcaNo: isemriParcaNo !== undefined ? isemriParcaNo : 'gönderilmedi',
            isemriId: isemriId !== undefined ? isemriId : 'gönderilmedi',
            parcaNo: parcaNo !== undefined ? parcaNo : 'gönderilmedi'
        });
        
        connection = await pool.getConnection();
        
        let selectQuery, bindVars, usePlanId = false;
        
        // Plan ID geçerliyse (sayısal ve obje değilse) planId ile sil
        if (planId && typeof planId !== 'object' && !isNaN(parseInt(planId))) {
            usePlanId = true;
            selectQuery = `
                SELECT PV.PLAN_ID, PV.ISEMRI_ID, PV.ISEMRI_PARCA_NO, PV.PLAN_TARIHI, PV.PLANLANAN_MIKTAR, PV.MAK_AD
                FROM ERPREADONLY.PLANLAMA_VERI PV
                WHERE PV.PLAN_ID = :planId
            `;
            bindVars = { planId: parseInt(planId) };
        } 
        // Plan ID geçersizse veya yoksa, isemriId ve parcaNo ile sil
        else if (isemriId && (parcaNo !== undefined && parcaNo !== null)) {
            console.log('Plan ID geçersiz, isemriId ve parcaNo ile silme yapılıyor:', { isemriId, parcaNo });
            selectQuery = `
                SELECT PV.PLAN_ID, PV.ISEMRI_ID, PV.ISEMRI_PARCA_NO, PV.PLAN_TARIHI, PV.PLANLANAN_MIKTAR, PV.MAK_AD
                FROM ERPREADONLY.PLANLAMA_VERI PV
                WHERE PV.ISEMRI_ID = :isemriId 
                AND (PV.ISEMRI_PARCA_NO = :parcaNo OR (PV.ISEMRI_PARCA_NO IS NULL AND :parcaNo IS NULL))
                AND PV.PLANLAMA_DURUMU = 'PLANLANDI'
                ORDER BY PV.PLAN_TARIHI DESC
                FETCH FIRST 1 ROW ONLY
            `;
            bindVars = { 
                isemriId: parseInt(isemriId),
                parcaNo: parcaNo !== null ? parseInt(parcaNo) : null
            };
        } else {
            console.error('Geçersiz parametreler:', { planId, isemriId, parcaNo });
            return res.status(400).json({
                success: false,
                message: 'Geçersiz parametreler',
                error: 'planId (sayısal) veya (isemriId ve parcaNo) gerekli'
            });
        }
        
        const selectResult = await connection.execute(selectQuery, bindVars);
        
        if (selectResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plan bulunamadı',
                error: `Plan ID ${planId} bulunamadı`
            });
        }
        
        const planToDelete = {};
        selectResult.metaData.forEach((col, i) => {
            planToDelete[col.name] = selectResult.rows[0][i];
        });
        
        console.log('Silinecek plan kaydı:', {
            PLAN_ID: planToDelete.PLAN_ID,
            ISEMRI_ID: planToDelete.ISEMRI_ID,
            ISEMRI_PARCA_NO: planToDelete.ISEMRI_PARCA_NO,
            PLAN_TARIHI: planToDelete.PLAN_TARIHI,
            PLANLANAN_MIKTAR: planToDelete.PLANLANAN_MIKTAR,
            MAK_AD: planToDelete.MAK_AD
        });
        
        // Frontend'den gelen isemriParcaNo ile doğrulama (eğer gönderilmişse)
        if (isemriParcaNo !== undefined && isemriParcaNo !== null) {
            const frontendParcaNo = Number(isemriParcaNo);
            const backendParcaNo = planToDelete.ISEMRI_PARCA_NO !== null && planToDelete.ISEMRI_PARCA_NO !== undefined 
                ? Number(planToDelete.ISEMRI_PARCA_NO) 
                : null;
            
            if (frontendParcaNo !== backendParcaNo) {
                console.warn('⚠️ UYARI: Frontend ve backend parça numaraları eşleşmiyor!', {
                    frontendParcaNo: frontendParcaNo,
                    backendParcaNo: backendParcaNo,
                    planId: planId
                });
            } else {
                console.log('✓ Parça numarası doğrulandı:', {
                    frontendParcaNo: frontendParcaNo,
                    backendParcaNo: backendParcaNo
                });
            }
        }
        
        // PLANLAMA_VERI tablosundan kaydı sil
        let deleteQuery, deleteBindVars;
        
        if (usePlanId) {
            deleteQuery = `
            DELETE FROM ERPREADONLY.PLANLAMA_VERI 
            WHERE PLAN_ID = :planId
        `;
            deleteBindVars = {
            planId: parseInt(planId)
        };
        } else {
            // isemriId ve parcaNo ile sil
            // ÖNEMLİ: Aynı isemriId ve parcaNo için birden fazla plan olabilir (farklı tarihlerde)
            // En son tarihli planı silmek için ROWID kullanarak tek kayıt sil
            deleteQuery = `
                DELETE FROM ERPREADONLY.PLANLAMA_VERI 
                WHERE ROWID = (
                    SELECT ROWID FROM (
                        SELECT PV.ROWID
                        FROM ERPREADONLY.PLANLAMA_VERI PV
                        WHERE PV.ISEMRI_ID = :isemriId 
                        AND (PV.ISEMRI_PARCA_NO = :parcaNo OR (PV.ISEMRI_PARCA_NO IS NULL AND :parcaNo IS NULL))
                        AND PV.PLANLAMA_DURUMU = 'PLANLANDI'
                        ORDER BY PV.PLAN_TARIHI DESC NULLS LAST
                        FETCH FIRST 1 ROW ONLY
                    )
                )
            `;
            deleteBindVars = {
                isemriId: parseInt(isemriId),
                parcaNo: parcaNo !== null ? parseInt(parcaNo) : null
            };
        }
        
        const result = await connection.execute(deleteQuery, deleteBindVars);
        await connection.commit();
        
        console.log('Planlama verisi başarıyla geri çekildi:', {
            ...deleteBindVars,
            ISEMRI_PARCA_NO: planToDelete.ISEMRI_PARCA_NO,
            ISEMRI_ID: planToDelete.ISEMRI_ID,
            PLAN_ID: planToDelete.PLAN_ID,
            method: usePlanId ? 'planId' : 'isemriId+parcaNo'
        });
        console.log('Silinen satır sayısı:', result.rowsAffected);
        
        res.json({
            success: true,
            message: 'Planlama verisi başarıyla geri çekildi',
            data: {
                ...deleteBindVars,
                PLAN_ID: planToDelete.PLAN_ID,
                method: usePlanId ? 'planId' : 'isemriId+parcaNo'
            },
            rowsAffected: result.rowsAffected
        });
        
    } catch (error) {
        console.error('Planlama verisi geri çekme hatası:', error);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).json({
            success: false,
            message: 'Planlama verisi geri çekilemedi',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// Planlama verilerini getirme endpoint'i
app.get('/api/planning-data', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // PLANLAMA_VERI tablosundan verileri çek ve V_ISEMRI_DETAY ile join yap
        const query = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT 
                PV.PLAN_ID,
                PV.ISEMRI_ID,
                PV.PLAN_TARIHI,
                PV.PLANLANAN_MIKTAR,
                PV.PLANLAMA_DURUMU,
                VD.ISEMRI_NO,
                VD.MALHIZ_KODU,
                VD.MALHIZ_ADI,
                VD.AGIRLIK,
                VD.BRUT_AGIRLIK,
                VD.TOPLAM_SURE,
                VD.TOPLAM_HAZIRLIK_SURE,
                VD.PLAN_MIKTAR,
                VD.FIGUR_SAYISI,
                VD.IMALAT_TURU,
                NVL(PV.MAK_AD, VD.MAK_AD) AS MAK_AD,
                VD.BOLUM_ADI,
                VD.FIRMA_ADI
            FROM ERPREADONLY.PLANLAMA_VERI PV
            INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
            LEFT JOIN ERPREADONLY.V_ISEMRI_DETAY VD ON PV.ISEMRI_ID = VD.ISEMRI_ID
            WHERE PV.PLANLAMA_DURUMU = 'PLANLANDI'
            ORDER BY PV.PLAN_TARIHI ASC
`;
        
        const result = await connection.execute(query);
        
        const planningData = result.rows.map((row, index) => {
            const item = {};
            result.metaData.forEach((col, i) => {
                item[col.name] = row[i];
            });
            
            return {
                id: index + 1,
                planId: item.PLAN_ID,
                isemriId: item.ISEMRI_ID,
                isemriNo: item.ISEMRI_NO,
                planTarihi: item.PLAN_TARIHI ? new Date(item.PLAN_TARIHI).toISOString().split('T')[0] : null,
                planlananMiktar: item.PLANLANAN_MIKTAR,
                planlamaDurumu: item.PLANLAMA_DURUMU,
                malhizKodu: item.MALHIZ_KODU,
                malhizAdi: item.MALHIZ_ADI,
                agirlik: (() => {
                    const birimAgirlik = item.AGIRLIK || 0;
                    const planlananMiktar = item.PLANLANAN_MIKTAR || 0;
                    
                    // Planlama verilerinde her zaman planlanan miktar × birim ağırlık
                    return Math.round((planlananMiktar * birimAgirlik) * 10) / 10; // Virgülden sonra 1 basamak
                })(),
                brutAgirlik: (() => {
                    const birimBrutAgirlik = item.BRUT_AGIRLIK || 0;
                    const planlananMiktar = item.PLANLANAN_MIKTAR || 0;
                    
                    // Planlama verilerinde her zaman planlanan miktar × birim brüt ağırlık
                    return Math.round((planlananMiktar * birimBrutAgirlik) * 10) / 10; // Virgülden sonra 1 basamak
                })(),
                toplamSure: (() => {
                    const toplamHazirlikSure = item.TOPLAM_HAZIRLIK_SURE || 0;
                    const toplamSure = item.TOPLAM_SURE || 0;
                    const planlananMiktar = item.PLANLANAN_MIKTAR || 0;
                    const planMiktar = item.PLAN_MIKTAR || 0;
                    
                    let sonucSaniye;
                    // Ana ürünün toplam süresi: TOPLAM_HAZIRLIK_SURE + TOPLAM_SURE
                    const anaUrunToplamSure = toplamHazirlikSure + toplamSure;
                    
                    // Kırılımlar için oranlama hesabı
                    if (planlananMiktar > 0 && planMiktar > 0) {
                        // Oran: (planlanan miktar / plan miktar) * ana ürün toplam süresi
                        const oran = planlananMiktar / planMiktar;
                        sonucSaniye = oran * anaUrunToplamSure;
                    } else {
                        // Beklemede durumunda: Ana ürünün toplam süresi
                        sonucSaniye = anaUrunToplamSure;
                    }
                    
                    // Saniyeyi saate çevir ve virgülden sonra 2 basamak formatla
                    const sonucSaat = sonucSaniye / 3600;
                    const finalResult = Math.round(sonucSaat * 100) / 100; // Virgülden sonra 2 basamak
                    return finalResult;
                })(),
                imalatTuru: item.IMALAT_TURU,
                makAd: item.MAK_AD,
                bolumAdi: item.BOLUM_ADI,
                firmaAdi: item.FIRMA_ADI,
                figurSayisi: item.FIGUR_SAYISI || 1
            };
        });
        
        res.json({
            success: true,
            data: planningData,
            count: planningData.length
        });
        
    } catch (error) {
        console.error('Planlama verileri çekme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Planlama verileri çekilemedi',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// Üst makine kontrolü endpoint'i
app.get('/api/machine/check-upper', async (req, res) => {
    let connection;
    try {
        const { makineAdi } = req.query;
        
        if (!makineAdi) {
            return res.status(400).json({ 
                success: false, 
                message: 'Makine adı parametresi gerekli' 
            });
        }
        
        connection = await pool.getConnection();
        
        // Önce üst makine kontrolü (bu makine bir üst makine grubu mu?)
        const upperMachineQuery = `
            SELECT MAK_AD, UST_MAK_AD
            FROM ERPREADONLY.V_URT_UST_MAKINA 
            WHERE UST_MAK_AD = :makineAdi
        `;
        
        const upperResult = await connection.execute(upperMachineQuery, { makineAdi });
        
        if (upperResult.rows.length > 0) {
            // Üst makine - alt makineleri döndür
            res.json({
                success: true,
                isUpperMachine: true,
                upperMachineName: makineAdi,
                subMachines: upperResult.rows.map(row => ({
                    makAd: row[0], // MAK_AD
                    ustMakAd: row[1] // UST_MAK_AD
                }))
            });
        } else {
            // Alt makine kontrolü (bu makine bir alt makine mi? Üst makinesi var mı?)
            const lowerMachineQuery = `
                SELECT MAK_AD, UST_MAK_AD
                FROM ERPREADONLY.V_URT_UST_MAKINA 
                WHERE MAK_AD = :makineAdi
            `;
            
            const lowerResult = await connection.execute(lowerMachineQuery, { makineAdi });
            
            if (lowerResult.rows.length > 0) {
                // Alt makine - üst makinesini döndür
                const upperMachineName = lowerResult.rows[0][1]; // UST_MAK_AD
                res.json({
                    success: true,
                    isUpperMachine: false,
                    machineName: makineAdi,
                    upperMachineName: upperMachineName
                });
            } else {
                // Direkt makine (ne üst ne alt)
            res.json({
                success: true,
                isUpperMachine: false,
                machineName: makineAdi
            });
            }
        }
        
    } catch (error) {
        console.error('Üst makine kontrolü hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Üst makine kontrolü sırasında hata oluştu: ' + error.message 
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Connection kapatma hatası:', err);
            }
        }
    }
});

// Makine mapping endpoint'i - Bölüm bazında üst makine grupları ve alt makineleri döndürür
app.get('/api/machines/mapping', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Bölüm-makine ilişkisini ve üst makine gruplarını çek
        // 1. V_ISEMRI_DETAY'dan bölüm-makine ilişkisini al (distinct)
        // 2. V_URT_UST_MAKINA'dan üst makine-alt makine ilişkisini al
        // 3. Bu ikisini birleştirerek bölüm -> üst makine grubu -> alt makineler yapısını oluştur
        
        // Önce test sorguları çalıştır
        // 1. ISEMRI_FILTERED kontrolü
        const testISEMRI = `
            SELECT COUNT(*) as CNT
            FROM ERPURT.T_URT_ISEMRI 
            WHERE FABRIKA_KOD = 120 AND DURUMU = 1
        `;
        const testISEMRIResult = await connection.execute(testISEMRI);
        console.log('T_URT_ISEMRI kayıt sayısı (FABRIKA_KOD=120, DURUMU=1):', testISEMRIResult.rows[0][0]);
        
        // 2. V_ISEMRI_DETAY toplam kayıt sayısı (filtre olmadan)
        const testQuery0 = `
            SELECT COUNT(*) as CNT
            FROM ERPREADONLY.V_ISEMRI_DETAY VD
        `;
        const testResult0 = await connection.execute(testQuery0);
        console.log('V_ISEMRI_DETAY toplam kayıt sayısı (filtre olmadan):', testResult0.rows[0][0]);
        
        // 3. V_ISEMRI_DETAY BOLUM_ADI ve MAK_AD kontrolü
        const testQuery0a = `
            SELECT 
                COUNT(*) as TOTAL,
                COUNT(VD.BOLUM_ADI) as BOLUM_ADI_NOT_NULL,
                COUNT(CASE WHEN TRIM(VD.BOLUM_ADI) IS NOT NULL AND LENGTH(TRIM(VD.BOLUM_ADI)) > 0 THEN 1 END) as BOLUM_ADI_NOT_EMPTY,
                COUNT(VD.MAK_AD) as MAK_AD_NOT_NULL,
                COUNT(CASE WHEN TRIM(VD.MAK_AD) IS NOT NULL AND LENGTH(TRIM(VD.MAK_AD)) > 0 THEN 1 END) as MAK_AD_NOT_EMPTY
            FROM ERPREADONLY.V_ISEMRI_DETAY VD
        `;
        const testResult0a = await connection.execute(testQuery0a);
        console.log('V_ISEMRI_DETAY alan kontrolü:', {
            total: testResult0a.rows[0][0],
            bolumAdiNotNull: testResult0a.rows[0][1],
            bolumAdiNotEmpty: testResult0a.rows[0][2],
            makAdNotNull: testResult0a.rows[0][3],
            makAdNotEmpty: testResult0a.rows[0][4]
        });
        
        // 4. V_ISEMRI_DETAY direkt kontrolü (JOIN olmadan, LENGTH kullanarak)
        const testQuery1 = `
            SELECT COUNT(*) as CNT
            FROM ERPREADONLY.V_ISEMRI_DETAY VD
            WHERE VD.BOLUM_ADI IS NOT NULL 
                AND LENGTH(TRIM(VD.BOLUM_ADI)) > 0
                AND UPPER(TRIM(VD.BOLUM_ADI)) != 'TANIMSIZ'
                AND VD.MAK_AD IS NOT NULL
                AND LENGTH(TRIM(VD.MAK_AD)) > 0
        `;
        const testResult1 = await connection.execute(testQuery1);
        console.log('V_ISEMRI_DETAY kayıt sayısı (filtreli, JOIN olmadan, LENGTH ile):', testResult1.rows[0][0]);
        
        // 5. V_ISEMRI_DETAY ile JOIN kontrolü (LENGTH ile)
        const testQuery1WithJoin = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT COUNT(*) as CNT
            FROM ERPREADONLY.V_ISEMRI_DETAY VD
            INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
            WHERE VD.BOLUM_ADI IS NOT NULL 
                AND LENGTH(TRIM(VD.BOLUM_ADI)) > 0
                AND UPPER(TRIM(VD.BOLUM_ADI)) != 'TANIMSIZ'
                AND VD.MAK_AD IS NOT NULL
                AND LENGTH(TRIM(VD.MAK_AD)) > 0
        `;
        const testResult1WithJoin = await connection.execute(testQuery1WithJoin);
        console.log('V_ISEMRI_DETAY kayıt sayısı (filtreli, JOIN ile, LENGTH ile):', testResult1WithJoin.rows[0][0]);
        
        // 6. V_URT_UST_MAKINA kontrolü
        const testQuery2 = `
            SELECT COUNT(*) as CNT
            FROM ERPREADONLY.V_URT_UST_MAKINA UM
            INNER JOIN ERPURT.T_URT_MAKINA TM ON TRIM(UM.MAK_AD) = TRIM(TM.MAK_AD)
            WHERE UM.UST_MAK_AD IS NOT NULL
                AND LENGTH(TRIM(UM.UST_MAK_AD)) > 0
                AND UM.MAK_AD IS NOT NULL
                AND LENGTH(TRIM(UM.MAK_AD)) > 0
                AND TM.MAK_TIP = 2
                AND TM.ETKGST = 1
        `;
        const testResult2 = await connection.execute(testQuery2);
        console.log('V_URT_UST_MAKINA kayıt sayısı (MAK_TIP=2, ETKGST=1, LENGTH ile):', testResult2.rows[0][0]);
        
        // 7. V_ISEMRI_DETAY'dan örnek veri (filtre olmadan)
        const sampleVDNoFilter = `
            SELECT DISTINCT 
                VD.BOLUM_ADI,
                VD.MAK_AD,
                LENGTH(TRIM(VD.BOLUM_ADI)) as BOLUM_LEN,
                LENGTH(TRIM(VD.MAK_AD)) as MAK_LEN
            FROM ERPREADONLY.V_ISEMRI_DETAY VD
            WHERE ROWNUM <= 10
        `;
        const sampleVDNoFilterResult = await connection.execute(sampleVDNoFilter);
        console.log('V_ISEMRI_DETAY örnek veriler (filtre olmadan, ilk 10):');
        sampleVDNoFilterResult.rows.forEach((row, idx) => {
            console.log(`  ${idx + 1}. Bölüm: "${row[0]}" (len: ${row[2]}), Makine: "${row[1]}" (len: ${row[3]})`);
        });
        
        // 8. V_ISEMRI_DETAY'dan örnek veri (LENGTH ile filtreli)
        const sampleVD = `
            SELECT DISTINCT 
                TRIM(VD.BOLUM_ADI) AS BOLUM_ADI,
                TRIM(VD.MAK_AD) AS MAK_AD
            FROM ERPREADONLY.V_ISEMRI_DETAY VD
            WHERE VD.BOLUM_ADI IS NOT NULL 
                AND LENGTH(TRIM(VD.BOLUM_ADI)) > 0
                AND UPPER(TRIM(VD.BOLUM_ADI)) != 'TANIMSIZ'
                AND VD.MAK_AD IS NOT NULL
                AND LENGTH(TRIM(VD.MAK_AD)) > 0
            AND ROWNUM <= 10
        `;
        const sampleVDResult = await connection.execute(sampleVD);
        console.log('V_ISEMRI_DETAY örnek veriler (LENGTH ile filtreli, ilk 10):');
        sampleVDResult.rows.forEach((row, idx) => {
            console.log(`  ${idx + 1}. Bölüm: "${row[0]}", Makine: "${row[1]}"`);
        });
        
        const mappingQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            ),
            -- Bölüm-makine ilişkisi (iş emirlerinden)
            BOLUM_MAKINE AS (
                SELECT DISTINCT 
                    TRIM(VD.BOLUM_ADI) AS BOLUM_ADI,
                    TRIM(VD.MAK_AD) AS MAK_AD
                FROM ERPREADONLY.V_ISEMRI_DETAY VD
                INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
                WHERE VD.BOLUM_ADI IS NOT NULL 
                    AND LENGTH(TRIM(VD.BOLUM_ADI)) > 0
                    AND UPPER(TRIM(VD.BOLUM_ADI)) != 'TANIMSIZ'
                    AND VD.MAK_AD IS NOT NULL
                    AND LENGTH(TRIM(VD.MAK_AD)) > 0
            ),
            -- Tüm üst makine-alt makine ilişkileri (V_URT_UST_MAKINA'dan)
            -- Sadece Tezgah-İş Merkezi tipindeki makineleri al (MAK_TIP=2) ve ETKGST=1 olanları
            UST_MAKINE_GRUPLARI AS (
                SELECT DISTINCT
                    TRIM(UM.UST_MAK_AD) AS UST_MAK_AD,
                    TRIM(UM.MAK_AD) AS MAK_AD
                FROM ERPREADONLY.V_URT_UST_MAKINA UM
                INNER JOIN ERPURT.T_URT_MAKINA TM ON TRIM(UM.MAK_AD) = TRIM(TM.MAK_AD)
                WHERE UM.UST_MAK_AD IS NOT NULL
                    AND LENGTH(TRIM(UM.UST_MAK_AD)) > 0
                    AND UM.MAK_AD IS NOT NULL
                    AND LENGTH(TRIM(UM.MAK_AD)) > 0
                    AND TM.MAK_TIP = 2  -- Sadece Tezgah-İş Merkezi tipindeki makineler
                    AND TM.ETKGST = 1   -- ETKGST=1 olanlar
                    AND TM.FABRIKA_KOD = 120  -- FABRIKA_KOD=120 olanlar
            ),
            -- Üst makine gruplarının bölümlerini bul (alt makinelerinden)
            UST_MAKINE_BOLUM AS (
                SELECT DISTINCT
                    TRIM(UMG.UST_MAK_AD) AS UST_MAK_AD,
                    TRIM(BM.BOLUM_ADI) AS BOLUM_ADI
                FROM UST_MAKINE_GRUPLARI UMG
                INNER JOIN BOLUM_MAKINE BM ON TRIM(UMG.MAK_AD) = TRIM(BM.MAK_AD)
            ),
            -- Üst makine gruplarının kendilerinin de bölümlerini bul (eğer rota operasyonunda tanımlanmışsa)
            UST_MAKINE_AS_MAKINE_BOLUM AS (
                SELECT DISTINCT
                    TRIM(UMB.UST_MAK_AD) AS UST_MAK_AD,
                    TRIM(BM.BOLUM_ADI) AS BOLUM_ADI
                FROM UST_MAKINE_BOLUM UMB
                INNER JOIN BOLUM_MAKINE BM ON TRIM(UMB.UST_MAK_AD) = TRIM(BM.MAK_AD)
            )
            -- 1. V_ISEMRI_DETAY'dan gelen makineler (üst makine grubu varsa onu kullan, yoksa direkt makine)
            SELECT 
                BM.BOLUM_ADI,
                NVL(UMG.UST_MAK_AD, BM.MAK_AD) AS UST_MAK_AD_OR_MAKINE,
                BM.MAK_AD AS ALT_MAKINE,
                CASE 
                    WHEN UMG.UST_MAK_AD IS NOT NULL THEN 1 
                    ELSE 0 
                END AS IS_UPPER_MACHINE_GROUP
            FROM BOLUM_MAKINE BM
            LEFT JOIN UST_MAKINE_GRUPLARI UMG ON TRIM(BM.MAK_AD) = TRIM(UMG.MAK_AD)
            
            UNION ALL
            
            -- 2. V_URT_UST_MAKINA'dan gelen TÜM üst makine-alt makine ilişkileri
            -- (iş emrinde olmasa bile, planlama için gerekli)
            -- Bölüm bilgisini alt makinelerden veya üst makine grubunun kendisinden al
            SELECT 
                NVL(
                    NVL(UMB.BOLUM_ADI, UMB_AS.BOLUM_ADI),  -- Önce üst makine grubunun bölümü
                    (SELECT DISTINCT BM_ALT.BOLUM_ADI       -- Yoksa aynı üst grubun diğer alt makinelerinden birinin bölümü
                     FROM BOLUM_MAKINE BM_ALT
                     INNER JOIN UST_MAKINE_GRUPLARI UMG_ALT ON TRIM(BM_ALT.MAK_AD) = TRIM(UMG_ALT.MAK_AD)
                     WHERE TRIM(UMG_ALT.UST_MAK_AD) = TRIM(UMG.UST_MAK_AD)
                     AND ROWNUM = 1)
                ) AS BOLUM_ADI,
                UMG.UST_MAK_AD AS UST_MAK_AD_OR_MAKINE,
                UMG.MAK_AD AS ALT_MAKINE,
                1 AS IS_UPPER_MACHINE_GROUP
            FROM UST_MAKINE_GRUPLARI UMG
            LEFT JOIN UST_MAKINE_BOLUM UMB ON TRIM(UMG.UST_MAK_AD) = TRIM(UMB.UST_MAK_AD)
            LEFT JOIN UST_MAKINE_AS_MAKINE_BOLUM UMB_AS ON TRIM(UMG.UST_MAK_AD) = TRIM(UMB_AS.UST_MAK_AD)
            -- Bölüm bilgisi yoksa da ekle (planlama için gerekli)
            -- Zaten ana sorguda eklenmiş olanları tekrar ekleme (sadece bölüm bilgisi varsa kontrol et)
            WHERE (
                -- Bölüm bilgisi varsa, aynı makine-bölüm kombinasyonunun zaten eklenmiş olup olmadığını kontrol et
                (NVL(UMB.BOLUM_ADI, UMB_AS.BOLUM_ADI) IS NOT NULL 
                 AND NOT EXISTS (
                     SELECT 1 FROM BOLUM_MAKINE BM2 
                     INNER JOIN UST_MAKINE_GRUPLARI UMG2 ON TRIM(BM2.MAK_AD) = TRIM(UMG2.MAK_AD)
                     WHERE TRIM(BM2.MAK_AD) = TRIM(UMG.MAK_AD)
                         AND TRIM(BM2.BOLUM_ADI) = NVL(UMB.BOLUM_ADI, UMB_AS.BOLUM_ADI)
                         AND TRIM(UMG2.UST_MAK_AD) = TRIM(UMG.UST_MAK_AD)
                 ))
                OR
                -- Bölüm bilgisi yoksa, aynı makine-üst grup kombinasyonunun zaten eklenmiş olup olmadığını kontrol et
                (NVL(UMB.BOLUM_ADI, UMB_AS.BOLUM_ADI) IS NULL
                 AND NOT EXISTS (
                     SELECT 1 FROM BOLUM_MAKINE BM2 
                     INNER JOIN UST_MAKINE_GRUPLARI UMG2 ON TRIM(BM2.MAK_AD) = TRIM(UMG2.MAK_AD)
                     WHERE TRIM(BM2.MAK_AD) = TRIM(UMG.MAK_AD)
                         AND TRIM(UMG2.UST_MAK_AD) = TRIM(UMG.UST_MAK_AD)
                 ))
            )
            
            UNION ALL
            
            -- 3. Üst makine gruplarını da direkt makine olarak ekle (eğer rota operasyonunda tanımlanmışsa)
            -- Ancak sadece başka bir üst makine grubuna bağlı olmayanları ekle
            SELECT 
                BM.BOLUM_ADI,
                UMG.UST_MAK_AD AS UST_MAK_AD_OR_MAKINE,
                UMG.UST_MAK_AD AS ALT_MAKINE,
                0 AS IS_UPPER_MACHINE_GROUP
            FROM UST_MAKINE_GRUPLARI UMG
            INNER JOIN BOLUM_MAKINE BM ON TRIM(UMG.UST_MAK_AD) = TRIM(BM.MAK_AD)
            WHERE NOT EXISTS (
                -- Bu üst makine grubu başka bir üst makine grubunun alt makinesi olmamalı
                SELECT 1 FROM UST_MAKINE_GRUPLARI UMG_PARENT 
                WHERE TRIM(UMG_PARENT.MAK_AD) = TRIM(UMG.UST_MAK_AD)
                    AND TRIM(UMG_PARENT.UST_MAK_AD) != TRIM(UMG.UST_MAK_AD)
            )
            AND NOT EXISTS (
                -- Zaten ana sorguda eklenmiş olmamalı (üst makine grubu olarak)
                SELECT 1 FROM BOLUM_MAKINE BM2 
                INNER JOIN UST_MAKINE_GRUPLARI UMG2 ON TRIM(BM2.MAK_AD) = TRIM(UMG2.MAK_AD)
                WHERE TRIM(BM2.MAK_AD) = TRIM(UMG.UST_MAK_AD) 
                    AND TRIM(BM2.BOLUM_ADI) = TRIM(BM.BOLUM_ADI)
            )
            
            ORDER BY BOLUM_ADI, UST_MAK_AD_OR_MAKINE, ALT_MAKINE
        `;
        
        const result = await connection.execute(mappingQuery);
        
        console.log('Mapping query sonuç sayısı:', result.rows.length);
        if (result.rows.length > 0) {
            console.log('İlk 5 satır örneği:');
            result.rows.slice(0, 5).forEach((row, idx) => {
                console.log(`  Satır ${idx + 1}:`, {
                    BOLUM_ADI: row[0],
                    UST_MAK_AD_OR_MAKINE: row[1],
                    ALT_MAKINE: row[2],
                    IS_UPPER_MACHINE_GROUP: row[3]
                });
            });
        } else {
            console.log('⚠️ SQL sorgusu hiç sonuç döndürmedi!');
        }
        
        // Sonuçları bölüm -> üst makine grubu -> alt makineler formatına dönüştür
        const mapping = {};
        
        // Önce tüm üst makine gruplarını topla (üst makine grubu olarak tanımlanmış olanlar)
        const upperMachineGroups = new Set();
        result.rows.forEach(row => {
            if (row[3] === 1) { // IS_UPPER_MACHINE_GROUP = 1
                upperMachineGroups.add(row[1]); // UST_MAK_AD_OR_MAKINE
            }
        });
        
        result.rows.forEach(row => {
            let bolumAdi = row[0]; // BOLUM_ADI (NULL olabilir)
            const ustMakAdOrMakine = row[1]; // UST_MAK_AD_OR_MAKINE (üst makine grubu veya direkt makine)
            const altMakine = row[2]; // ALT_MAKINE
            const isUpperMachineGroup = row[3] === 1; // IS_UPPER_MACHINE_GROUP
            
            // Bölüm bilgisi yoksa, üst makine grubunun adından tahmin et
            if (!bolumAdi && ustMakAdOrMakine) {
                // Üst makine grubunun adından bölüm tahmin et
                if (ustMakAdOrMakine.includes('Maça') || ustMakAdOrMakine.includes('maça') || ustMakAdOrMakine.includes('MAÇA')) {
                    bolumAdi = '01.MAÇAHANE';
                } else if (ustMakAdOrMakine.includes('Kalıp') || ustMakAdOrMakine.includes('kalıp') || ustMakAdOrMakine.includes('KALIP')) {
                    bolumAdi = '02.KALIPLAMA';
                } else if (ustMakAdOrMakine.includes('Döküm') || ustMakAdOrMakine.includes('döküm') || ustMakAdOrMakine.includes('DÖKÜM')) {
                    bolumAdi = '04.DÖKÜM';
                } else if (ustMakAdOrMakine.includes('Taşlama') || ustMakAdOrMakine.includes('taşlama') || ustMakAdOrMakine.includes('TAŞLAMA')) {
                    bolumAdi = '05.TAŞLAMA';
                } else if (ustMakAdOrMakine.includes('Boya') || ustMakAdOrMakine.includes('boya') || ustMakAdOrMakine.includes('BOYA')) {
                    bolumAdi = '06.BOYAHANE';
                } else if (ustMakAdOrMakine.includes('İşlem') || ustMakAdOrMakine.includes('işlem') || ustMakAdOrMakine.includes('İŞLEM')) {
                    bolumAdi = '07.İŞLEME';
                } else if (ustMakAdOrMakine.includes('Paket') || ustMakAdOrMakine.includes('paket') || ustMakAdOrMakine.includes('PAKET')) {
                    bolumAdi = '08.PAKETLEME';
                } else if (ustMakAdOrMakine.includes('Fason') || ustMakAdOrMakine.includes('fason') || ustMakAdOrMakine.includes('FASON')) {
                    bolumAdi = 'FASON İŞLEMLER';
                }
            }
            
            if (!bolumAdi || !ustMakAdOrMakine || !altMakine) {
                return; // Eksik veri varsa atla
            }
            
            // Bölüm yoksa oluştur
            if (!mapping[bolumAdi]) {
                mapping[bolumAdi] = {};
            }
            
            // Üst makine grubu varsa
            if (isUpperMachineGroup) {
                // Üst makine grubu yoksa oluştur
                if (!mapping[bolumAdi][ustMakAdOrMakine]) {
                    mapping[bolumAdi][ustMakAdOrMakine] = [];
                }
                // Alt makineyi ekle (duplicate kontrolü ile)
                // ÖNEMLİ: 
                // 1. Üst makine grubunun kendisini alt makinelerine ekleme
                // 2. Eğer alt makine başka bir üst makine grubu ise, onu da ekleme
                if (altMakine !== ustMakAdOrMakine 
                    && !upperMachineGroups.has(altMakine)  // Alt makine bir üst makine grubu değilse
                    && !mapping[bolumAdi][ustMakAdOrMakine].includes(altMakine)) {
                    mapping[bolumAdi][ustMakAdOrMakine].push(altMakine);
                }
            } else {
                // Direkt makine (üst makine grubu yok) veya üst makine grubunun kendisi de bir makine
                // Eğer üst makine grubu zaten varsa ve alt makine üst makine grubuyla aynıysa, 
                // bu üst makine grubunun kendisinin de bir makine olarak tanımlanmış olması durumudur
                // ANCAK: Eğer bu üst makine grubu zaten bir üst makine grubu olarak tanımlanmışsa,
                // kendisini alt makinelerine ekleme (çünkü zaten üst grup olarak var)
                if (ustMakAdOrMakine === altMakine) {
                    // Üst makine grubunun kendisi de bir makine olarak tanımlanmış
                    // Ama eğer bu bir üst makine grubu ise, kendisini alt makinelerine ekleme
                    if (!upperMachineGroups.has(ustMakAdOrMakine)) {
                        // Bu gerçekten direkt bir makine (üst makine grubu değil)
                        if (!mapping[bolumAdi][altMakine]) {
                            mapping[bolumAdi][altMakine] = [];
                        }
                        // Kendisini ekle (duplicate kontrolü ile)
                        if (!mapping[bolumAdi][altMakine].includes(altMakine)) {
                            mapping[bolumAdi][altMakine].push(altMakine);
                        }
                    }
                    // Eğer üst makine grubu ise, hiçbir şey yapma (zaten üst grup olarak var)
                } else {
                    // Direkt makine (üst makine grubu yok)
                    // Bu durumda makineyi kendi adıyla bir grup olarak ekle
                    // Ancak eğer bu makine bir üst makine grubu ise, ekleme (zaten üst grup olarak var)
                    if (!upperMachineGroups.has(altMakine)) {
                        if (!mapping[bolumAdi][altMakine]) {
                            mapping[bolumAdi][altMakine] = [altMakine];
                        }
                    }
                }
            }
        });
        
        // Temizleme: Her üst makine grubunun alt makinelerinden kendisini kaldır
        Object.keys(mapping).forEach(bolumAdi => {
            Object.keys(mapping[bolumAdi]).forEach(ustMakineGrubu => {
                const altMakineler = mapping[bolumAdi][ustMakineGrubu];
                if (Array.isArray(altMakineler)) {
                    // Üst makine grubunun kendisini alt makinelerinden kaldır
                    const filtered = altMakineler.filter(makine => makine !== ustMakineGrubu);
                    mapping[bolumAdi][ustMakineGrubu] = filtered;
                }
            });
        });
        
        // Mapping özeti
        console.log('Mapping özeti:');
        const bolumKeys = Object.keys(mapping);
        console.log(`Toplam bölüm sayısı: ${bolumKeys.length}`);
        bolumKeys.forEach(bolum => {
            const groups = Object.keys(mapping[bolum]);
            const totalMachines = Object.values(mapping[bolum]).reduce((sum, arr) => sum + arr.length, 0);
            console.log(`  ${bolum}: ${groups.length} grup, ${totalMachines} toplam makine`);
            // İlk bölümün ilk grubunu örnek olarak göster
            if (bolum === bolumKeys[0] && groups.length > 0) {
                const firstGroup = groups[0];
                console.log(`    Örnek grup "${firstGroup}":`, mapping[bolum][firstGroup].slice(0, 5));
            }
        });
        
        res.json({
            success: true,
            mapping: mapping
        });
        
    } catch (error) {
        console.error('Makine mapping hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Makine mapping yüklenirken hata oluştu: ' + error.message 
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Connection kapatma hatası:', err);
            }
        }
    }
});

// Makine boşluk durumu endpoint'i
app.get('/api/machine/availability', async (req, res) => {
    let connection;
    try {
        const { makineAdi, startDate } = req.query;
        
        if (!makineAdi) {
            return res.status(400).json({ 
                success: false, 
                message: 'Makine adı parametresi gerekli' 
            });
        }
        
        connection = await pool.getConnection();
        
        // Tarih filtresi varsa o tarihteki planlamaları kontrol et (TRUNC ile sadece tarih kısmını karşılaştır)
        const dateFilter = startDate ? `AND TRUNC(PV.PLAN_TARIHI) = TO_DATE(:startDate, 'YYYY-MM-DD')` : '';
        
        // Makine boşluk durumu sorgusu - seçilen tarihe göre
        const availabilityQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT 
                PV.ISEMRI_ID,
                MIN(PV.PLAN_TARIHI) as firstAvailableDate,
                COUNT(PV.PLAN_ID) as plannedJobsCount,
                SUM(PV.PLANLANAN_MIKTAR) as totalPlannedQuantity
            FROM ERPREADONLY.PLANLAMA_VERI PV
            INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
            INNER JOIN ERPREADONLY.V_ISEMRI_DETAY VD ON PV.ISEMRI_ID = VD.ISEMRI_ID
            WHERE PV.MAK_AD = :makineAdi
            AND PV.PLANLAMA_DURUMU = 'PLANLANDI'
            ${dateFilter}
            GROUP BY PV.ISEMRI_ID
        `;
        
        // Ayrıca o makineye ait seçilen tarihteki toplam planlanmış miktarı da hesapla
        const totalQuantityQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT SUM(PV.PLANLANAN_MIKTAR) as totalQuantity
            FROM ERPREADONLY.PLANLAMA_VERI PV
            INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
            INNER JOIN ERPREADONLY.V_ISEMRI_DETAY VD ON PV.ISEMRI_ID = VD.ISEMRI_ID
            WHERE PV.MAK_AD = :makineAdi
            AND PV.PLANLAMA_DURUMU = 'PLANLANDI'
            ${dateFilter}
        `;
        
        const queryParams = { makineAdi };
        if (startDate) {
            queryParams.startDate = startDate;
        }
        
        const result = await connection.execute(availabilityQuery, queryParams);
        const totalResult = await connection.execute(totalQuantityQuery, queryParams);
        
        const totalPlannedQuantity = totalResult.rows.length > 0 ? (totalResult.rows[0][0] || 0) : 0;
        
        if (result.rows.length > 0) {
            // Makineye ait planlanmış işler var (seçilen tarihte)
            const firstAvailableDate = result.rows[0][1]; // MIN(PV.PLAN_TARIHI)
            const plannedJobsCount = result.rows.length; // COUNT(PV.PLAN_ID)
            
            res.json({
                success: true,
                machineName: makineAdi,
                firstAvailableDate: firstAvailableDate,
                plannedJobsCount: plannedJobsCount,
                totalPlannedQuantity: totalPlannedQuantity,
                isAvailable: false // Planlanmış işler var
            });
        } else {
            // Makine seçilen tarihte boş
            res.json({
                success: true,
                machineName: makineAdi,
                firstAvailableDate: startDate || new Date().toISOString().split('T')[0],
                plannedJobsCount: 0,
                totalPlannedQuantity: 0,
                isAvailable: true
            });
        }
        
    } catch (error) {
        console.error('Makine boşluk durumu hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Makine boşluk durumu kontrolü sırasında hata oluştu: ' + error.message 
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Connection kapatma hatası:', err);
            }
        }
    }
});

// Veri çekme endpoint'i - tarih filtreleri ile
app.get('/api/data', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Tarih parametrelerini al
        const { startDate, endDate, limit, weekCount } = req.query;
        
        // Tarih filtreleri - sadece kullanıcı belirtirse uygula
        let dateCondition = '';
        let bindVars = {};
        
        if (startDate && endDate) {
            // Kullanıcı tarafından belirtilen tarih aralığı
            dateCondition = 'AND ISEMRI_AC_TAR BETWEEN :startDate AND :endDate';
            bindVars.startDate = new Date(startDate);
            bindVars.endDate = new Date(endDate);
        } else if (weekCount) {
            // Hafta sayısına göre tarih hesapla (sadece belirtilirse)
            const weekCountValue = parseInt(weekCount);
            const weeksAgo = new Date();
            weeksAgo.setDate(weeksAgo.getDate() - (weekCountValue * 7));
            dateCondition = 'AND ISEMRI_AC_TAR >= :weeksAgo';
            bindVars.weeksAgo = weeksAgo;
        }
        
        // Limit parametresi - sadece belirtilirse uygula
        const rowLimit = limit ? parseInt(limit) : null;
        
        // Sorguyu limit durumuna göre kur (ROWNUM ORDER BY'dan önce uygulanmalı)
        let query;
        if (rowLimit) {
            query = `
                WITH ISEMRI_FILTERED AS (
                    SELECT * 
                    FROM ERPURT.T_URT_ISEMRI 
                    WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                )
            SELECT * FROM (
                SELECT /*+ FIRST_ROWS(1000) */ 
                    VD.ISEMRI_ID,
                    VD.ISEMRI_NO,
                    VD.ISEMRI_SIRA,
                    VD.MALHIZ_KODU,
                    VD.MALHIZ_ADI,
                    VD.ISEMRI_AC_TAR,
                    VD.PLAN_MIKTAR,
                    VD.SIPARIS_MIKTAR,
                    VD.SEVK_MIKTARI,
                    VD.GERCEK_MIKTAR,
                    VD.HURDA_MIKTAR,
                    VD.AGIRLIK,
                    VD.BRUT_AGIRLIK,
                    VD.FIGUR_SAYISI,
                    VD.IMALAT_TURU,
                    VD.MAK_AD,
                    VD.MAK_ID,
                    VD.BOLUM_ADI,
                    VD.TOPLAM_SURE,
                    VD.TOPLAM_HAZIRLIK_SURE,
                    VD.ONERILEN_TESLIM_TARIH,
                    VD.FIRMA_ADI
                FROM ERPREADONLY.V_ISEMRI_DETAY VD
                INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
                WHERE VD.ISEMRI_AC_TAR IS NOT NULL
                ${dateCondition}
                ORDER BY VD.ISEMRI_AC_TAR DESC, VD.ISEMRI_NO ASC
            ) WHERE ROWNUM <= :rowLimit
        `;
        } else {
            query = `
                WITH ISEMRI_FILTERED AS (
                    SELECT * 
                    FROM ERPURT.T_URT_ISEMRI 
                    WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                )
                SELECT /*+ FIRST_ROWS(1000) */ 
                    VD.ISEMRI_ID,
                    VD.ISEMRI_NO,
                    VD.ISEMRI_SIRA,
                    VD.SIP_KOD,
                    VD.MALHIZ_KODU,
                    VD.MALHIZ_ADI,
                    VD.ISEMRI_AC_TAR,
                    VD.PLAN_MIKTAR,
                    VD.SIPARIS_MIKTAR,
                    VD.SEVK_MIKTARI,
                    VD.GERCEK_MIKTAR,
                    VD.HURDA_MIKTAR,
                    VD.AGIRLIK,
                    VD.BRUT_AGIRLIK,
                    VD.FIGUR_SAYISI,
                    VD.IMALAT_TURU,
                    VD.MAK_AD,
                    VD.MAK_ID,
                    VD.BOLUM_ADI,
                    VD.TOPLAM_SURE,
                    VD.TOPLAM_HAZIRLIK_SURE,
                    VD.ONERILEN_TESLIM_TARIH,
                    VD.FIRMA_ADI
                FROM ERPREADONLY.V_ISEMRI_DETAY VD
                INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
                WHERE VD.ISEMRI_AC_TAR IS NOT NULL
                ${dateCondition}
                ORDER BY VD.ISEMRI_AC_TAR DESC, VD.ISEMRI_NO ASC
            `;
        }
        
        if (rowLimit) {
        bindVars.rowLimit = rowLimit;
        }
        
        
        const result = await connection.execute(query, bindVars);
        
        // Planlama verilerini çek (kırılım desteği ile) - ISEMRI_NO bazlı gruplama için ISEMRI_NO da çek
        const planningQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT 
                PV.PLAN_ID, 
                PV.ISEMRI_ID, 
                VD.ISEMRI_NO,
                PV.PLAN_TARIHI, 
                PV.PLANLANAN_MIKTAR, 
                PV.PLANLAMA_DURUMU,
                PV.ISEMRI_PARCA_NO,
                PV.MAK_AD,
                PV.MAK_ID,
                PV.ACIKLAMA,
                VD.BOLUM_ADI
            FROM ERPREADONLY.PLANLAMA_VERI PV
            INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
            LEFT JOIN ERPREADONLY.V_ISEMRI_DETAY VD ON PV.ISEMRI_ID = VD.ISEMRI_ID AND PV.ISEMRI_PARCA_NO = VD.ISEMRI_SIRA
            WHERE PV.PLANLAMA_DURUMU = 'PLANLANDI'
            ORDER BY VD.ISEMRI_NO, PV.ISEMRI_ID, PV.ISEMRI_PARCA_NO
        `;
        
        const planningResult = await connection.execute(planningQuery);
        const planningDataByIsemriId = {}; // ISEMRI_ID bazlı gruplama (her aşama için ayrı)
        
        // Planlama verilerini ISEMRI_ID'ye göre grupla ve kırılımları organize et
        // Her aşama (ISEMRI_ID) için sadece kendi breakdown'ları olmalı
        planningResult.rows.forEach(row => {
            const item = {};
            planningResult.metaData.forEach((col, i) => {
                item[col.name] = row[i];
            });
            
            const isemriId = item.ISEMRI_ID;
            
            // ISEMRI_ID bazlı gruplama (her aşama için ayrı)
            if (!planningDataByIsemriId[isemriId]) {
                planningDataByIsemriId[isemriId] = {
                    breakdowns: [],
                    totalPlanned: 0,
                    totalWaiting: 0,
                    status: 'Beklemede'
                };
            }
            
            // Açıklama alanını kontrol et ve debug log
            const aciklamaValue = item.ACIKLAMA;
            
            const breakdown = {
                planId: item.PLAN_ID,
                parcaNo: item.ISEMRI_PARCA_NO,
                planTarihi: item.PLAN_TARIHI ? new Date(item.PLAN_TARIHI).toISOString().split('T')[0] : null,
                planlananMiktar: item.PLANLANAN_MIKTAR,
                durum: item.PLANLAMA_DURUMU === 'PLANLANDI' ? 'Planlandı' : 'Beklemede',
                makAd: item.MAK_AD,
                makId: item.MAK_ID || null,
                bolumAdi: item.BOLUM_ADI || null,
                aciklama: aciklamaValue || null
            };
            
            planningDataByIsemriId[isemriId].breakdowns.push(breakdown);
            
            // Toplam planlanan miktarı hesapla
            if (item.PLANLAMA_DURUMU === 'PLANLANDI') {
                planningDataByIsemriId[isemriId].totalPlanned += item.PLANLANAN_MIKTAR;
            }
        });
        
        
        // Veriyi frontend için uygun formata dönüştür (her ISEMRI_ID için ayrı kayıt)
        const data = result.rows.map((row, index) => {
            const columns = result.metaData.map(col => col.name);
            const item = {};
            columns.forEach((col, i) => {
                item[col] = row[i];
            });
            
            // Frontend için gerekli alanları ekle (kırılım desteği ile) - ISEMRI_ID bazlı
            const planningInfo = planningDataByIsemriId[item.ISEMRI_ID] || {
                breakdowns: [],
                totalPlanned: 0,
                totalWaiting: 0,
                status: 'Beklemede'
            };
            
            // Makine bilgisini öncelikle planlama verisinden al, yoksa view'dan al
            // Planlanmış breakdown'lardan makine bilgisini al (en son planlanan)
            let makineAdi = item.MAK_AD; // Varsayılan: view'dan gelen makine
            if (planningInfo.breakdowns && planningInfo.breakdowns.length > 0) {
                // Planlanmış breakdown'lardan makine bilgisini al
                const plannedBreakdowns = planningInfo.breakdowns.filter(b => 
                    b.durum === 'Planlandı' && b.makAd
                );
                if (plannedBreakdowns.length > 0) {
                    // En son planlanan breakdown'un makinesini kullan
                    const sortedByDate = plannedBreakdowns.sort((a, b) => {
                        if (!a.planTarihi && !b.planTarihi) return 0;
                        if (!a.planTarihi) return 1;
                        if (!b.planTarihi) return -1;
                        return new Date(b.planTarihi) - new Date(a.planTarihi);
                    });
                    makineAdi = sortedByDate[0].makAd || item.MAK_AD;
                }
            }
            
            // Sipariş miktarını hesapla (ana kayıttan) - Sipariş Miktar (Adet) kullan
            // Bakiye miktarı hesapla (sipariş miktarı - sevk miktarı)
            const siparisMiktar = item.SIPARIS_MIKTAR || 0;
            const sevkMiktari = item.SEVK_MIKTARI || 0;
            const bakiyeMiktar = Math.max(0, siparisMiktar - sevkMiktari);
            planningInfo.totalWaiting = Math.max(0, bakiyeMiktar - planningInfo.totalPlanned);
            
            // Durumu belirle (bakiye miktarı ile karşılaştırma)
            if (planningInfo.totalPlanned === 0) {
                planningInfo.status = 'Beklemede';
            } else if (planningInfo.totalPlanned < bakiyeMiktar) {
                planningInfo.status = 'Kısmi Planlandı';
            } else {
                planningInfo.status = 'Planlandı';
            }
            // Ana kaydın planlanan tarihini kırılımlar içindeki en büyük tarihe ayarla
            const maxPlanDate = (() => {
                if (!planningInfo.breakdowns || planningInfo.breakdowns.length === 0) return null;
                // Sadece tarihi olan kırılımlar arasında en büyük tarihi bul
                const dates = planningInfo.breakdowns
                    .map(b => b.planTarihi)
                    .filter(Boolean)
                    .sort((a, b) => new Date(a) - new Date(b));
                return dates.length > 0 ? dates[dates.length - 1] : null;
            })();
            
            // Gerçekleşme miktarını kırılımlara dağıt
            const gercekMiktar = item.GERCEK_MIKTAR || 0;
            const breakdownsWithRealized = (() => {
                if (!planningInfo.breakdowns || planningInfo.breakdowns.length === 0) {
                    return [];
                }
                
                // Kırılımları tarih sıralı olarak sırala (erken tarih önce)
                const sortedBreakdowns = [...planningInfo.breakdowns].sort((a, b) => {
                    if (!a.planTarihi && !b.planTarihi) return 0;
                    if (!a.planTarihi) return 1; // Tarihi olmayanlar en sonda
                    if (!b.planTarihi) return -1;
                    return new Date(a.planTarihi) - new Date(b.planTarihi);
                });
                
                // Tek kırılım varsa direkt ata
                if (sortedBreakdowns.length === 1) {
                    return [{
                        ...sortedBreakdowns[0],
                        gercekMiktar: gercekMiktar
                    }];
                }
                
                // Birden fazla kırılım varsa: tarih sıralı doldura doldura git
                let kalanGercek = gercekMiktar;
                const result = sortedBreakdowns.map((breakdown, index) => {
                    const planlananMiktar = breakdown.planlananMiktar || 0;
                    let breakdownGercek = 0;
                    
                    if (kalanGercek > 0) {
                        // İlk kırılımın planlanan miktarı kadar doldur
                        if (kalanGercek >= planlananMiktar) {
                            breakdownGercek = planlananMiktar;
                            kalanGercek -= planlananMiktar;
                        } else {
                            // Kalan gerçekleşme miktarı bu kırılıma sığarsa tamamını ver
                            breakdownGercek = kalanGercek;
                            kalanGercek = 0;
                        }
                    }
                    
                    return {
                        ...breakdown,
                        gercekMiktar: breakdownGercek,
                        // Maça aşaması için makAd'ı selectedMachine olarak da set et
                        selectedMachine: breakdown.makAd || null
                    };
                });
                
                return result;
            })();
            
            // Breakdown'ları güncelle
            planningInfo.breakdowns = breakdownsWithRealized;
            
            return {
                id: index + 1,
                isemriNo: item.ISEMRI_NO,
                siparisNo: item.SIP_KOD || '',
                isemriId: item.ISEMRI_ID,
                isemriSira: item.ISEMRI_SIRA,
                malhizKodu: item.MALHIZ_KODU,
                malhizAdi: item.MALHIZ_ADI,
                tarih: item.ISEMRI_AC_TAR ? new Date(item.ISEMRI_AC_TAR).toISOString().split('T')[0] : null,
                planMiktar: item.PLAN_MIKTAR || 0,
                siparisMiktarHesaplanan: item.SIPARIS_MIKTAR || 0,
                sevkMiktari: item.SEVK_MIKTARI || 0,
                gercekMiktar: item.GERCEK_MIKTAR || 0,
                hurdaMiktar: item.HURDA_MIKTAR || 0,
                agirlik: (() => {
                    const birimAgirlik = item.AGIRLIK || 0;
                    const siparisMiktar = item.PLAN_MIKTAR || 0;
                    
                    // Toplam ağırlık: sipariş miktar × birim ağırlık
                    const toplamAgirlik = siparisMiktar * birimAgirlik;
                    return Math.round(toplamAgirlik * 10) / 10; // Virgülden sonra 1 basamak
                })(),
                brutAgirlik: (() => {
                    const birimBrutAgirlik = item.BRUT_AGIRLIK || 0;
                    const siparisMiktar = item.PLAN_MIKTAR || 0;
                    
                    // Toplam brüt ağırlık: sipariş miktar × birim brüt ağırlık
                    const toplamBrutAgirlik = siparisMiktar * birimBrutAgirlik;
                    return Math.round(toplamBrutAgirlik * 10) / 10; // Virgülden sonra 1 basamak
                })(),
                figurSayisi: item.FIGUR_SAYISI || 0,
                imalatTuru: item.IMALAT_TURU,
                makAd: makineAdi, // Planlama verisinden alınan makine, yoksa view'dan
                bolumAdi: item.BOLUM_ADI,
                toplamSure: (() => {
                    const toplamHazirlikSure = item.TOPLAM_HAZIRLIK_SURE || 0;
                    const toplamSure = item.TOPLAM_SURE || 0;
                    
                    // Toplam süre: hazırlık süresi + işlem süresi
                    const sonucSaniye = toplamHazirlikSure + toplamSure;
                    
                    // Saniyeyi saate çevir ve virgülden sonra 1 basamak formatla
                    const sonucSaat = sonucSaniye / 3600;
                    return Math.round(sonucSaat * 10) / 10; // Virgülden sonra 1 basamak
                })(),
                onerilenTeslimTarih: item.ONERILEN_TESLIM_TARIH ? new Date(item.ONERILEN_TESLIM_TARIH).toISOString().split('T')[0] : null,
                firmaAdi: item.FIRMA_ADI,
                // Frontend için uyumlu alanlar
                degerKk: (() => {
                    const birimAgirlik = item.AGIRLIK || 0;
                    const siparisMiktar = item.PLAN_MIKTAR || 0;
                    
                    // Toplam ağırlık: sipariş miktar × birim ağırlık
                    return Math.round((siparisMiktar * birimAgirlik) * 10) / 10; // Virgülden sonra 1 basamak
                })(),
                degerDk: (() => {
                    const toplamHazirlikSure = item.TOPLAM_HAZIRLIK_SURE || 0;
                    const toplamSure = item.TOPLAM_SURE || 0;
                    
                    // Toplam süre: hazırlık süresi + işlem süresi
                    const sonucSaniye = toplamHazirlikSure + toplamSure;
                    
                    // Saniyeyi saate çevir ve virgülden sonra 2 basamak formatla
                    const sonucSaat = sonucSaniye / 3600;
                    return Math.round(sonucSaat * 100) / 100; // Virgülden sonra 2 basamak
                })(),
                degerAdet: Math.ceil(item.PLAN_MIKTAR || 0),
                // Kırılım bilgileri
                breakdowns: planningInfo.breakdowns,
                totalPlanned: planningInfo.totalPlanned,
                totalWaiting: planningInfo.totalWaiting,
                durum: planningInfo.status,
                // Ana planlama bilgileri
                planId: planningInfo.breakdowns.find(b => b.durum === 'Planlandı')?.planId || null,
                planlananMiktar: planningInfo.totalPlanned,
                planlananTarih: maxPlanDate,
                selectedMachine: planningInfo.breakdowns.find(b => b.durum === 'Planlandı')?.makAd || null,
                // Açıklama: Planlandı breakdown'dan al, yoksa tüm breakdown'lardan ilk açıklamayı al
                aciklama: (() => {
                    const plannedBreakdown = planningInfo.breakdowns.find(b => b.durum === 'Planlandı');
                    if (plannedBreakdown && plannedBreakdown.aciklama) {
                        return plannedBreakdown.aciklama;
                    }
                    const anyBreakdownWithAciklama = planningInfo.breakdowns.find(b => b.aciklama);
                    if (anyBreakdownWithAciklama) {
                        return anyBreakdownWithAciklama.aciklama;
                    }
                    return null;
                })()
            };
        });
        
        res.json({
            success: true,
            data: data,
            total: data.length,
            queryInfo: {
                startDate: bindVars.startDate || bindVars.weeksAgo || 'Tüm tarihler',
                endDate: bindVars.endDate || 'Tüm tarihler',
                limit: rowLimit || 'Limit yok',
                actualCount: data.length
            }
        });
        
    } catch (err) {
        console.error('Veri çekme hatası:', err);
        res.status(500).json({
            success: false,
            error: 'Veritabanından veri çekilemedi',
            details: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Bağlantı kapatma hatası:', err);
            }
        }
    }
});


// Bağlantı test endpoint'i
app.get('/api/oracle/test', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute('SELECT SYSDATE, USER FROM DUAL');
        
        res.json({
            success: true,
            message: 'Oracle bağlantısı başarılı',
            data: {
                serverTime: result.rows[0][0],
                currentUser: result.rows[0][1]
            }
        });
    } catch (err) {
        console.error('Bağlantı test hatası:', err);
        res.status(500).json({
            success: false,
            error: 'Oracle bağlantı testi başarısız',
            details: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Test bağlantısı kapatma hatası:', err);
            }
        }
    }
});

// Pool yeniden başlatma endpoint'i
app.post('/api/oracle/restart-pool', async (req, res) => {
    try {
        await oracledb.getPool().close();
        await initializeDatabase();
        
        res.json({
            success: true,
            message: 'Oracle bağlantı havuzu yeniden başlatıldı'
        });
    } catch (err) {
        console.error('Pool yeniden başlatma hatası:', err);
        res.status(500).json({
            success: false,
            error: 'Pool yeniden başlatılamadı',
            details: err.message
        });
    }
});

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Sipariş izleme endpoint'i
app.get('/api/order-tracking/:isemriNo', async (req, res) => {
    let connection;
    
    try {
        const { isemriNo } = req.params;
        
        console.log(`Sipariş izleme: İş Emri No: ${isemriNo}`);

        connection = await oracledb.getConnection(dbConfig);

        // Önce ISEMRI_NO ile SIP_ID'yi bul
        const sipIdQuery = `
            SELECT DISTINCT SIP_ID 
            FROM ERPREADONLY.V_ISEMRI_DETAY 
            WHERE ISEMRI_NO = :isemriNo
        `;
        
        const sipIdResult = await connection.execute(sipIdQuery, { isemriNo: isemriNo });
        
        if (!sipIdResult.rows || sipIdResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Bu iş emri numarasına ait sipariş bulunamadı' 
            });
        }

        const sipId = sipIdResult.rows[0][0];
        console.log(`İş Emri ${isemriNo} için SIP_ID: ${sipId}`);

        // Şimdi SIP_ID ile siparişe bağlı tüm ISEMRI_NO'ları bul
        const isemriQuery = `
            SELECT DISTINCT ISEMRI_NO 
            FROM ERPREADONLY.V_ISEMRI_DETAY 
            WHERE SIP_ID = :sipId
        `;
        
        const isemriResult = await connection.execute(isemriQuery, { sipId: sipId });
        
        if (!isemriResult.rows || isemriResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Bu sipariş ID\'ye ait iş emri bulunamadı' 
            });
        }

        const isemriNos = isemriResult.rows.map(row => row[0]);
        console.log(`Sipariş ${sipId} için bulunan iş emirleri:`, isemriNos);

        // Her ISEMRI_NO için ürünleri ve aşamaları getir
        const orderQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT *
                FROM ERPURT.T_URT_ISEMRI
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT DISTINCT 
                VD.SIP_ID,
                VD.SIP_KOD,
                VD.FIRMA_ADI,
                VD.ONERILEN_TESLIM_TARIH,
                VD.MALHIZ_KODU,
                VD.MALHIZ_ADI,
                VD.ISEMRI_ID,
                VD.ISEMRI_NO,
                VD.ISEMRI_SIRA,
                VD.PLAN_MIKTAR,
                VD.GERCEK_MIKTAR,
                VD.AGIRLIK,
                VD.TOPLAM_SURE,
                VD.MAK_AD,
                VD.BOLUM_ADI,
                PV.PLAN_ID,
                PV.PLAN_TARIHI as KIRILIM_PLAN_TARIHI,
                PV.PLANLANAN_MIKTAR as KIRILIM_PLANLANAN_MIKTAR,
                NVL(VD.GERCEK_MIKTAR, 0) as KIRILIM_GERCEK_MIKTAR,
                PV.PLANLAMA_DURUMU,
                PV.ISEMRI_PARCA_NO,
                PV.MAK_AD as KIRILIM_MAK_AD
            FROM ERPREADONLY.V_ISEMRI_DETAY VD
            INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
            LEFT JOIN ERPREADONLY.PLANLAMA_VERI PV ON VD.ISEMRI_ID = PV.ISEMRI_ID
            WHERE VD.ISEMRI_NO IN (${isemriNos.map((_, index) => `:isemriNo${index}`).join(',')})
            ORDER BY VD.ISEMRI_SIRA, PV.ISEMRI_PARCA_NO
        `;

        const bindParams = {};
        isemriNos.forEach((isemriNo, index) => {
            bindParams[`isemriNo${index}`] = isemriNo;
        });

        const result = await connection.execute(orderQuery, bindParams);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Sipariş bulunamadı' 
            });
        }

        // Verileri organize et - Paketleme aşaması ana ürün olacak
        const orderData = {
            sipId: null,
            sipKod: null,
            musteriAdi: null,
            onerilenTeslimTarihi: null,
            siparisTermini: null,
            urunler: {}
        };

        // İş emirlerini grupla (paketleme aşaması ana ürün olacak)
        const isemriGroups = {};
        
        result.rows.forEach(row => {
            const item = {};
            result.metaData.forEach((col, i) => {
                item[col.name] = row[i];
            });

            // Sipariş bilgilerini al (ilk satırdan)
            if (!orderData.sipId) {
                orderData.sipId = item.SIP_ID;
                orderData.sipKod = item.SIP_KOD || null;
                orderData.musteriAdi = item.FIRMA_ADI;
                orderData.onerilenTeslimTarihi = item.ONERILEN_TESLIM_TARIH ? 
                    new Date(item.ONERILEN_TESLIM_TARIH).toISOString().split('T')[0] : null;
            }

            // İş emri gruplarını oluştur
            const isemriNo = item.ISEMRI_NO;
            if (!isemriGroups[isemriNo]) {
                isemriGroups[isemriNo] = {
                    isemriNo: isemriNo,
                    malhizKodu: item.MALHIZ_KODU,
                    malhizAdi: item.MALHIZ_ADI,
                    planMiktar: item.PLAN_MIKTAR,
                    gercekMiktar: item.GERCEK_MIKTAR,
                    agirlik: item.AGIRLIK,
                    toplamSure: item.TOPLAM_SURE,
                    asamalar: []
                };
            }

            // Aşama bilgilerini ekle
            if (item.PLAN_ID) {
                const asama = {
                    planId: item.PLAN_ID,
                    parcaNo: item.ISEMRI_PARCA_NO,
                    isemriSira: item.ISEMRI_SIRA,
                    planTarihi: item.KIRILIM_PLAN_TARIHI ? 
                        new Date(item.KIRILIM_PLAN_TARIHI).toISOString().split('T')[0] : null,
                    planlananMiktar: item.KIRILIM_PLANLANAN_MIKTAR,
                    gercekMiktar: item.KIRILIM_GERCEK_MIKTAR || 0, // Gerçekleşen miktar
                    durumu: item.PLANLAMA_DURUMU === 'PLANLANDI' ? 'Planlandı' : 
                           (item.PLANLAMA_DURUMU === 'TAMAMLANDI' ? 'Tamamlandı' : 'Beklemede'),
                    makAd: item.KIRILIM_MAK_AD,
                    bolumAdi: item.BOLUM_ADI,
                    malhizKodu: item.MALHIZ_KODU, // Her aşamanın kendi kodu
                    bitisTarihi: null
                };

                // Planlandı veya tamamlandıysa bitiş tarihini hesapla
                if ((item.PLANLAMA_DURUMU === 'PLANLANDI' || item.PLANLAMA_DURUMU === 'TAMAMLANDI') && item.KIRILIM_PLAN_TARIHI && item.TOPLAM_SURE) {
                    const planTarihi = new Date(item.KIRILIM_PLAN_TARIHI);
                    const bitisTarihi = new Date(planTarihi.getTime() + (item.TOPLAM_SURE * 3600000));
                    asama.bitisTarihi = bitisTarihi.toISOString().split('T')[0];
                }

                isemriGroups[isemriNo].asamalar.push(asama);
            }
        });

        // Paketleme aşamasını ana ürün olarak organize et
        Object.values(isemriGroups).forEach(isemri => {
            // Paketleme aşamasını bul (ISEMRI_SIRA = 0 olan)
            const paketlemeAsamasi = isemri.asamalar.find(a => a.isemriSira === 0);
            
            // Tüm aşamaları al (paketleme dahil)
            const tumAsamalar = isemri.asamalar;
            
            // Planlanan miktarı hesapla: Tüm planlanan aşamaların planlanan miktarlarının toplamı
            // Her aşama için aynı miktar planlanıyor olabilir, bu yüzden maksimum planlanan miktarı al
            let planlananMiktar = 0;
            let planlananTarihi = null;
            const planlananAsamalar = tumAsamalar.filter(a => a.durumu === 'Planlandı' || a.durumu === 'Tamamlandı');
            
            if (planlananAsamalar.length > 0) {
                // Planlanan aşamaların maksimum miktarını al (genelde tüm aşamalar aynı miktarda planlanır)
                planlananMiktar = Math.max(...planlananAsamalar.map(a => a.planlananMiktar || 0));
                
                // Planlanan aşamaların en son tarihini al (en büyük tarih)
                const planTarihleri = planlananAsamalar
                    .map(a => a.planTarihi)
                    .filter(t => t != null)
                    .map(t => new Date(t));
                
                if (planTarihleri.length > 0) {
                    planlananTarihi = new Date(Math.max(...planTarihleri)).toISOString().split('T')[0];
                }
            }
            
            // Eğer paketleme aşaması varsa onu ana ürün olarak kullan
            if (paketlemeAsamasi) {
                // Paketleme aşaması ana ürün
                // Ana ürün için bitiş tarihini hesapla (planlandıysa)
                let anaUrunBitisTarihi = paketlemeAsamasi.bitisTarihi;
                if (!anaUrunBitisTarihi && paketlemeAsamasi.planTarihi && isemri.toplamSure) {
                    const planTarihi = new Date(paketlemeAsamasi.planTarihi);
                    const bitisTarihi = new Date(planTarihi.getTime() + (isemri.toplamSure * 3600000));
                    anaUrunBitisTarihi = bitisTarihi.toISOString().split('T')[0];
                }
                
                // Ana ürün durumunu belirle: Tüm aşamalar planlanmışsa "Planlandı"
                let anaUrunDurumu = 'Beklemede';
                if (planlananAsamalar.length === tumAsamalar.length && planlananAsamalar.length > 0) {
                    anaUrunDurumu = 'Planlandı';
                } else if (planlananAsamalar.length > 0) {
                    anaUrunDurumu = 'Kısmi Planlandı';
                }
                
                const anaUrunKey = `${isemri.isemriNo}_${isemri.malhizKodu}`;
                orderData.urunler[anaUrunKey] = {
                    malhizKodu: isemri.malhizKodu,
                    malhizAdi: isemri.malhizAdi,
                    isemriNo: isemri.isemriNo,
                    planMiktar: isemri.planMiktar,
                    gercekMiktar: isemri.gercekMiktar,
                    planlananMiktar: planlananMiktar,
                    planlananTarihi: planlananTarihi || paketlemeAsamasi.planTarihi,
                    durumu: anaUrunDurumu,
                    agirlik: isemri.agirlik ? (isemri.agirlik * planlananMiktar).toFixed(1) : null, // Toplam ağırlık = birim ağırlık * planlanan miktar
                    toplamSure: isemri.toplamSure,
                    makAd: paketlemeAsamasi.makAd,
                    bolumAdi: paketlemeAsamasi.bolumAdi,
                    bitisTarihi: anaUrunBitisTarihi,
                    asamalar: isemri.asamalar.filter(a => a.isemriSira !== 0) // Diğer aşamalar kırılım
                };
            } else {
                // Paketleme aşaması yoksa ilk aşamayı ana ürün yap
                // Ana ürün durumunu belirle
                let anaUrunDurumu = 'Beklemede';
                if (planlananAsamalar.length === tumAsamalar.length && planlananAsamalar.length > 0) {
                    anaUrunDurumu = 'Planlandı';
                } else if (planlananAsamalar.length > 0) {
                    anaUrunDurumu = 'Kısmi Planlandı';
                }
                
                const anaUrunKey = `${isemri.isemriNo}_${isemri.malhizKodu}`;
                orderData.urunler[anaUrunKey] = {
                    malhizKodu: isemri.malhizKodu,
                    malhizAdi: isemri.malhizAdi,
                    isemriNo: isemri.isemriNo,
                    planMiktar: isemri.planMiktar,
                    gercekMiktar: isemri.gercekMiktar,
                    planlananMiktar: planlananMiktar,
                    planlananTarihi: planlananTarihi,
                    durumu: anaUrunDurumu,
                    agirlik: isemri.agirlik ? (isemri.agirlik * planlananMiktar).toFixed(1) : null, // Toplam ağırlık = birim ağırlık * planlanan miktar
                    toplamSure: isemri.toplamSure,
                    makAd: null,
                    bolumAdi: null,
                    bitisTarihi: null,
                    asamalar: isemri.asamalar // Tüm aşamalar kırılım
                };
            }
        });

        // Sipariş terminini hesapla: Tüm kalemler planlandıysa en son planlama tarihi
        let enSonPlanlamaTarihi = null;
        let tumAsamalarPlanlandi = true;
        
        Object.values(orderData.urunler).forEach(urun => {
            // Ana ürün planlama tarihini kontrol et
            if (urun.planlananTarihi) {
                if (!enSonPlanlamaTarihi || new Date(urun.planlananTarihi) > new Date(enSonPlanlamaTarihi)) {
                    enSonPlanlamaTarihi = urun.planlananTarihi;
                }
            } else if (urun.durumu !== 'Planlandı' && urun.durumu !== 'Tamamlandı') {
                tumAsamalarPlanlandi = false;
            }
            
            // Aşamaların planlama tarihlerini kontrol et
            urun.asamalar.forEach(asama => {
                if (asama.planTarihi) {
                    if (!enSonPlanlamaTarihi || new Date(asama.planTarihi) > new Date(enSonPlanlamaTarihi)) {
                        enSonPlanlamaTarihi = asama.planTarihi;
                    }
                } else if (asama.durumu !== 'Planlandı' && asama.durumu !== 'Tamamlandı') {
                    tumAsamalarPlanlandi = false;
                }
            });
        });

        // Tüm kalemler planlandıysa en son planlama tarihini göster, değilse uyarı
        orderData.siparisTermini = (tumAsamalarPlanlandi && enSonPlanlamaTarihi) ? enSonPlanlamaTarihi : 'Planlama tamamlanmadı';

        res.json({
            success: true,
            data: orderData
        });

    } catch (error) {
        console.error('Sipariş izleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Sipariş izleme sırasında hata oluştu',
            details: error.message 
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Bağlantı kapatma hatası:', err);
            }
        }
    }
});

// Durum belirleme fonksiyonu
function determineStatus(item) {
    const planlananMiktar = item.KIRILIM_PLANLANAN_MIKTAR || 0;
    const planMiktar = item.PLAN_MIKTAR || 0;
    const gercekMiktar = item.GERCEK_MIKTAR || 0;
    
    // Eğer gerçekleşen miktar varsa, devam ediyor veya tamamlandı
    if (gercekMiktar > 0) {
        if (gercekMiktar >= planMiktar) {
            return 'Tamamlandı';
        } else {
            return 'Devam Ediyor';
        }
    }
    
    // Eğer planlanan miktar varsa, planlandı
    if (planlananMiktar > 0) {
        return 'Planlandı';
    }
    
    // Hiçbiri yoksa beklemede
    return 'Beklemede';
}

// Sevkiyat planı endpoint'i
app.get('/api/shipping-plan', async (req, res) => {
    let connection;
    
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Başlangıç ve bitiş tarihi gerekli' 
            });
        }
        
        connection = await pool.getConnection();
        
        // Paketleme aşaması (ISEMRI_SIRA = 0) planlanan işleri çek
        // Tarih aralığına göre filtrele ve her ürün için tüm aşamaların durumunu getir
        // Aynı ISEMRI_NO'ya sahip tüm aşamaları (maça, kalıp vb.) getir
        const shippingPlanQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT *
                FROM ERPURT.T_URT_ISEMRI
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            ),
            PAKETLEME_PLANLARI AS (
                SELECT DISTINCT
                    PV.ISEMRI_ID,
                    VD.ISEMRI_NO,
                    TRUNC(PV.PLAN_TARIHI) AS PLAN_TARIHI,
                    PV.PLANLANAN_MIKTAR AS PAKETLEME_MIKTAR,
                    PV.MAK_AD AS PAKETLEME_MAK_AD,
                    VD.MALHIZ_KODU,
                    VD.MALHIZ_ADI,
                    VD.FIRMA_ADI,
                    VD.AGIRLIK,
                    VD.ONERILEN_TESLIM_TARIH,
                    VD.ISEMRI_AC_TAR
                FROM ERPREADONLY.PLANLAMA_VERI PV
                INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
                INNER JOIN ERPREADONLY.V_ISEMRI_DETAY VD ON PV.ISEMRI_ID = VD.ISEMRI_ID AND VD.ISEMRI_SIRA = 0
                WHERE PV.PLANLAMA_DURUMU = 'PLANLANDI'
                AND TRUNC(PV.PLAN_TARIHI) BETWEEN :startDate AND :endDate
            ),
            ASAMA_PLANLARI AS (
                SELECT 
                    PV.ISEMRI_ID,
                    PV.ISEMRI_PARCA_NO,
                    PV.PLAN_ID,
                    PV.PLAN_TARIHI AS ASAMA_PLAN_TARIHI,
                    PV.PLANLANAN_MIKTAR AS ASAMA_PLANLANAN_MIKTAR,
                    PV.PLANLAMA_DURUMU,
                    VD.ISEMRI_SIRA,
                    VD.ISEMRI_NO
                FROM ERPREADONLY.PLANLAMA_VERI PV
                INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
                INNER JOIN ERPREADONLY.V_ISEMRI_DETAY VD ON PV.ISEMRI_ID = VD.ISEMRI_ID 
                    AND PV.ISEMRI_PARCA_NO = VD.ISEMRI_SIRA
                WHERE PV.PLANLAMA_DURUMU = 'PLANLANDI'
            )
            SELECT 
                PP.ISEMRI_ID,
                PP.ISEMRI_NO,
                PP.PLAN_TARIHI,
                PP.PAKETLEME_MIKTAR,
                PP.PAKETLEME_MAK_AD,
                PP.MALHIZ_KODU,
                PP.MALHIZ_ADI,
                PP.FIRMA_ADI,
                PP.AGIRLIK,
                PP.ONERILEN_TESLIM_TARIH,
                PP.ISEMRI_AC_TAR,
                -- Tüm aşamaların durumunu getir (aynı ISEMRI_NO'ya sahip tüm aşamalar)
                VD.ISEMRI_SIRA,
                VD.BOLUM_ADI,
                VD.MAK_AD,
                NVL(VD.PLAN_MIKTAR, 0) AS PLAN_MIKTAR,
                NVL(VD.GERCEK_MIKTAR, 0) AS GERCEK_MIKTAR,
                AP.PLAN_ID,
                AP.ASAMA_PLAN_TARIHI,
                AP.ASAMA_PLANLANAN_MIKTAR,
                AP.PLANLAMA_DURUMU
            FROM PAKETLEME_PLANLARI PP
            INNER JOIN ERPREADONLY.V_ISEMRI_DETAY VD ON PP.ISEMRI_NO = VD.ISEMRI_NO
            LEFT JOIN ASAMA_PLANLARI AP ON VD.ISEMRI_NO = AP.ISEMRI_NO 
                AND VD.ISEMRI_SIRA = AP.ISEMRI_SIRA
            ORDER BY PP.PLAN_TARIHI ASC, PP.ISEMRI_NO ASC, VD.ISEMRI_SIRA ASC
        `;
        
        const result = await connection.execute(shippingPlanQuery, {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });
        
        if (result.rows.length === 0) {
            return res.json({ 
                success: true, 
                data: [],
                message: 'Seçilen tarih aralığında sevkiyat planı bulunamadı' 
            });
        }
        
        // Verileri organize et: Gün gün, ürün bazlı gruplama
        const meta = result.metaData.map(c => c.name);
        const shippingPlanByDate = {};
        
        result.rows.forEach(row => {
            const item = {};
            meta.forEach((col, i) => {
                item[col] = row[i];
                // Tarih alanlarını Date nesnesine çevir
                if ((col === 'PLAN_TARIHI' || col === 'ASAMA_PLAN_TARIHI' || col === 'ONERILEN_TESLIM_TARIH' || col === 'ISEMRI_AC_TAR') && row[i]) {
                    item[col] = row[i] instanceof Date ? row[i] : new Date(row[i]);
                }
            });
            
            // Tarih anahtarı (YYYY-MM-DD formatında)
            const dateKey = item.PLAN_TARIHI ? item.PLAN_TARIHI.toISOString().split('T')[0] : null;
            if (!dateKey) return;
            
            if (!shippingPlanByDate[dateKey]) {
                shippingPlanByDate[dateKey] = {};
            }
            
            // İş emri bazlı gruplama
            const isemriNo = item.ISEMRI_NO;
            if (!shippingPlanByDate[dateKey][isemriNo]) {
                shippingPlanByDate[dateKey][isemriNo] = {
                    isemriId: item.ISEMRI_ID,
                    isemriNo: item.ISEMRI_NO,
                    planTarihi: dateKey,
                    paketlemeMiktar: item.PAKETLEME_MIKTAR || 0,
                    paketlemeMakAd: item.PAKETLEME_MAK_AD,
                    malhizKodu: item.MALHIZ_KODU,
                    malhizAdi: item.MALHIZ_ADI,
                    firmaAdi: item.FIRMA_ADI,
                    agirlik: item.AGIRLIK || 0,
                    onerilenTeslimTarihi: item.ONERILEN_TESLIM_TARIH ? 
                        item.ONERILEN_TESLIM_TARIH.toISOString().split('T')[0] : null,
                    isemriAcTar: item.ISEMRI_AC_TAR ? 
                        item.ISEMRI_AC_TAR.toISOString().split('T')[0] : null,
                    asamalar: []
                };
            }
            
            // Aşama bilgilerini ekle (tekrar etmemek için kontrol et)
            const asamaKey = `${item.ISEMRI_SIRA}_${item.BOLUM_ADI}`;
            const existingAsama = shippingPlanByDate[dateKey][isemriNo].asamalar.find(
                a => a.isemriSira === item.ISEMRI_SIRA && a.bolumAdi === item.BOLUM_ADI
            );
            
            if (!existingAsama) {
                // Aşama durumunu belirle
                let durum = 'BEKLEMEDE';
                if (item.GERCEK_MIKTAR > 0) {
                    if (item.GERCEK_MIKTAR >= item.PLAN_MIKTAR) {
                        durum = 'TAMAMLANDI';
                    } else {
                        durum = 'DEVAM_EDIYOR';
                    }
                } else if (item.ASAMA_PLANLANAN_MIKTAR > 0 || item.PLAN_ID) {
                    durum = 'PLANLANDI';
                }
                
                shippingPlanByDate[dateKey][isemriNo].asamalar.push({
                    isemriSira: item.ISEMRI_SIRA,
                    bolumAdi: item.BOLUM_ADI || 'TANIMSIZ',
                    makAd: item.MAK_AD || '-',
                    planMiktar: item.PLAN_MIKTAR || 0,
                    gercekMiktar: item.GERCEK_MIKTAR || 0,
                    planTarihi: item.ASAMA_PLAN_TARIHI ? 
                        item.ASAMA_PLAN_TARIHI.toISOString().split('T')[0] : null,
                    planlananMiktar: item.ASAMA_PLANLANAN_MIKTAR || 0,
                    durum: durum
                });
            }
        });
        
        // Son format: Gün gün liste
        const formattedData = Object.keys(shippingPlanByDate).sort().map(date => ({
            tarih: date,
            urunler: Object.values(shippingPlanByDate[date])
        }));
        
        res.json({ 
            success: true, 
            data: formattedData 
        });
        
    } catch (error) {
        console.error('Sevkiyat planı hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sevkiyat planı oluşturulurken hata oluştu: ' + error.message 
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// Açıklama güncelleme endpoint'i
app.put('/api/planning/update-aciklama', async (req, res) => {
    let connection;
    try {
        const { planId, aciklama } = req.body;
        
        if (!planId) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID gerekli'
            });
        }
        
        const numericPlanId = parseInt(planId);
        if (isNaN(numericPlanId) || numericPlanId <= 0) {
            return res.status(400).json({
                success: false,
                message: `Geçersiz planId değeri: "${planId}"`
            });
        }
        
        connection = await pool.getConnection();
        
        const updateQuery = `
            UPDATE ERPREADONLY.PLANLAMA_VERI 
            SET ACIKLAMA = :aciklama
            WHERE PLAN_ID = :planId
        `;
        
        await connection.execute(updateQuery, {
            planId: numericPlanId,
            aciklama: aciklama || null
        });
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Açıklama başarıyla güncellendi'
        });
        
    } catch (error) {
        console.error('Açıklama güncelleme hatası:', error);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).json({
            success: false,
            message: 'Açıklama güncellenirken hata oluştu',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// Plan tarihi güncelleme endpoint'i
app.post('/api/planning/update-date', async (req, res) => {
    let connection;
    
    try {
        const { planId, newDate, selectedMachine } = req.body;
        
        if (!planId || !newDate) {
            return res.status(400).json({ 
                success: false, 
                error: 'Plan ID ve yeni tarih gerekli' 
            });
        }

        console.log(`Plan tarihi güncelleme: Plan ID: ${planId}, Yeni Tarih: ${newDate}, Makine: ${selectedMachine || 'Değişmedi'}`);
        console.log('Request body:', req.body);

        connection = await oracledb.getConnection(dbConfig);
        console.log('Oracle bağlantısı başarılı');

        // PLANLAMA_VERI tablosunda PLAN_ID ile güncelle
        let updateQuery = `
            UPDATE ERPREADONLY.PLANLAMA_VERI 
            SET PLAN_TARIHI = TO_DATE(:newDate || ' 03:00:00', 'YYYY-MM-DD HH24:MI:SS')
        `;
        
        const bindVars = {
            newDate: newDate,
            planId: planId
        };
        
        // Eğer makine değişikliği varsa ekle
        if (selectedMachine) {
            updateQuery += `, MAK_AD = :selectedMachine`;
            bindVars.selectedMachine = selectedMachine;
        }
        
        updateQuery += ` WHERE PLAN_ID = :planId`;

        console.log('SQL Query:', updateQuery);
        console.log('Bind parameters:', bindVars);

        const result = await connection.execute(updateQuery, bindVars, { autoCommit: true });

        console.log(`Plan tarihi güncellendi: ${result.rowsAffected} kayıt etkilendi`);

        res.json({
            success: true,
            message: 'Plan tarihi başarıyla güncellendi',
            rowsAffected: result.rowsAffected,
            planId: planId,
            newDate: newDate,
            machineUpdated: !!selectedMachine
        });

    } catch (error) {
        console.error('Plan tarihi güncelleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Plan tarihi güncellenirken hata oluştu',
            details: error.message 
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Bağlantı kapatma hatası:', err);
            }
        }
    }
});

// Gecikmiş işleri getirme endpoint'i (bölüm bazında)
app.get('/api/planning/delayed-jobs', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Oracle'dan bugünün tarihini string olarak al (timezone sorunlarını önlemek için)
        // Not: SQL sorgusunda zaten TRUNC(SYSDATE) kullanılıyor, burada sadece log için alıyoruz
        const todayResult = await connection.execute("SELECT TO_CHAR(TRUNC(SYSDATE), 'YYYY-MM-DD') as BUGUN FROM DUAL");
        const bugunStr = todayResult.rows[0][0];
        
        // Gecikmiş planları bul: Planlanan tarih bugünden önce, gerçekleşen < planlanan
        // ISEMRI_PARCA_NO varsa ISEMRI_SIRA ile eşleştir, yoksa MAK_AD ile eşleştir
        const delayedQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            )
            SELECT 
                PV.PLAN_ID,
                PV.ISEMRI_ID,
                PV.ISEMRI_PARCA_NO,
                PV.PLAN_TARIHI,
                PV.PLANLANAN_MIKTAR,
                PV.MAK_AD,
                NVL(VD.GERCEK_MIKTAR, 0) as GERCEK_MIKTAR,
                VD.PLAN_MIKTAR as SIPARIS_MIKTAR,
                VD.MAK_AD as ORIGINAL_MAK_AD,
                VD.BOLUM_ADI,
                VD.ISEMRI_NO,
                VD.MALHIZ_KODU,
                VD.MALHIZ_ADI,
                VD.FIRMA_ADI
            FROM ERPREADONLY.PLANLAMA_VERI PV
            INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
            INNER JOIN ERPREADONLY.V_ISEMRI_DETAY VD ON PV.ISEMRI_ID = VD.ISEMRI_ID 
                AND (
                    (PV.ISEMRI_PARCA_NO IS NOT NULL AND PV.ISEMRI_PARCA_NO = VD.ISEMRI_SIRA)
                    OR 
                    (PV.ISEMRI_PARCA_NO IS NULL AND (
                        (PV.MAK_AD IS NOT NULL AND PV.MAK_AD = VD.MAK_AD)
                        OR (PV.MAK_AD IS NULL AND VD.ISEMRI_SIRA = 0)
                    ))
                )
            WHERE PV.PLANLAMA_DURUMU = 'PLANLANDI'
                AND PV.PLAN_TARIHI < TRUNC(SYSDATE)
                AND PV.PLANLANAN_MIKTAR > 0
                AND (VD.GERCEK_MIKTAR IS NULL OR NVL(VD.GERCEK_MIKTAR, 0) < PV.PLANLANAN_MIKTAR)
                AND VD.BOLUM_ADI IS NOT NULL
                AND UPPER(TRIM(VD.BOLUM_ADI)) != 'TANIMSIZ'
            ORDER BY VD.BOLUM_ADI, VD.ISEMRI_NO, PV.ISEMRI_PARCA_NO
        `;
        
        const delayedResult = await connection.execute(delayedQuery);
        const delayedPlans = delayedResult.rows.map(row => {
            const meta = delayedResult.metaData.map(c => c.name);
            const rowObj = {};
            meta.forEach((col, i) => {
                rowObj[col] = row[i];
            });
            return rowObj;
        });
        
        // Bölüm bazında grupla - TANIMSIZ'ı filtrele
        const groupedByBolum = {};
        delayedPlans.forEach(plan => {
            const bolumAdi = plan.BOLUM_ADI;
            // TANIMSIZ veya NULL bölümleri atla
            if (!bolumAdi || bolumAdi.trim().toUpperCase() === 'TANIMSIZ') {
                return;
            }
            
            if (!groupedByBolum[bolumAdi]) {
                groupedByBolum[bolumAdi] = [];
            }
            
            const gercekMiktar = Number(plan.GERCEK_MIKTAR || 0);
            const planlananMiktar = Number(plan.PLANLANAN_MIKTAR || 0);
            const kalanMiktar = planlananMiktar - gercekMiktar;
            
            groupedByBolum[bolumAdi].push({
                planId: plan.PLAN_ID,
                isemriId: plan.ISEMRI_ID,
                isemriNo: plan.ISEMRI_NO,
                isemriParcaNo: plan.ISEMRI_PARCA_NO,
                planTarihi: plan.PLAN_TARIHI ? new Date(plan.PLAN_TARIHI).toISOString().split('T')[0] : null,
                planlananMiktar: planlananMiktar,
                gercekMiktar: gercekMiktar,
                kalanMiktar: kalanMiktar,
                makAd: plan.MAK_AD || plan.ORIGINAL_MAK_AD,
                malhizKodu: plan.MALHIZ_KODU,
                malhizAdi: plan.MALHIZ_ADI,
                firmaAdi: plan.FIRMA_ADI,
                bolumAdi: bolumAdi
            });
        });
        
        res.json({
            success: true,
            data: groupedByBolum,
            totalCount: delayedPlans.length
        });
        
    } catch (error) {
        console.error('Gecikmiş işleri getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Gecikmiş işler getirilirken hata oluştu',
            error: error.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Bağlantı kapatma hatası:', err);
            }
        }
    }
});

// Gecikmiş işleri bugüne aktarma endpoint'i
app.post('/api/planning/transfer-delayed', async (req, res) => {
    let connection;
    try {
        const { selectedJobs } = req.body;
        
        if (!selectedJobs || !Array.isArray(selectedJobs) || selectedJobs.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Seçili iş bilgileri gerekli'
            });
        }
        
        connection = await pool.getConnection();
        
        // Oracle'dan bugünün tarihini string olarak al (timezone sorunlarını önlemek için)
        const todayResult = await connection.execute("SELECT TO_CHAR(TRUNC(SYSDATE), 'YYYY-MM-DD') as BUGUN FROM DUAL");
        const bugunStr = todayResult.rows[0][0];
        
        console.log('=== GECİKMİŞ İŞLER AKTARMA ===');
        console.log('Oracle SYSDATE (bugün):', bugunStr);
        console.log('Seçili iş sayısı:', selectedJobs.length);
        console.log('Cache\'den gelen iş bilgileri:', selectedJobs);
        
        const transferredPlans = [];
        
        // Cache'den gelen bilgileri kullan (veritabanından tekrar sorgu yapmaya gerek yok)
        for (const job of selectedJobs) {
            const gercekMiktar = Number(job.gercekMiktar || 0);
            const planlananMiktar = Number(job.planlananMiktar || 0);
            const kalanMiktar = Number(job.kalanMiktar || 0);
            
            console.log(`Plan ID: ${job.planId}, ISEMRI_ID: ${job.isemriId}, ISEMRI_PARCA_NO: ${job.isemriParcaNo || 'NULL'}`);
            console.log(`  Planlanan: ${planlananMiktar}, Gerçekleşen: ${gercekMiktar}, Kalan: ${kalanMiktar}`);
            
            if (kalanMiktar <= 0) {
                console.log(`  Atlandı: Kalan miktar <= 0`);
                continue; // Gerçekleşen >= planlanan, atla
            }
            
            const makAd = job.makAd || null;
            
            // Mantık:
            // 1. Eğer gerçekleşmiş miktar varsa: Mevcut kaydın planlanan miktarını gerçekleşmiş miktara güncelle,
            //    kalan miktarı yeni kayıt olarak bugüne ekle
            // 2. Eğer gerçekleşmiş miktar yoksa: Mevcut kaydın tarihini bugüne güncelle (yeni kayıt oluşturma)
            
            if (gercekMiktar > 0) {
                console.log(`  İşlem: Gerçekleşmiş miktar var (${gercekMiktar}), mevcut kayıt güncellenecek, kalan (${kalanMiktar}) yeni kayıt olarak eklenecek`);
                // Durum 1: Gerçekleşmiş miktar var
                // Mevcut kaydın planlanan miktarını gerçekleşmiş miktara güncelle
                const updateQuery = `
                    UPDATE ERPREADONLY.PLANLAMA_VERI
                    SET PLANLANAN_MIKTAR = :gercekMiktar
                    WHERE PLAN_ID = :planId
                `;
                const updateResult = await connection.execute(updateQuery, {
                    gercekMiktar: gercekMiktar,
                    planId: job.planId
                });
                console.log(`  UPDATE sonucu: ${updateResult.rowsAffected} satır güncellendi`);
                
                // MAK_ID'yi al
                let transferMakId = null;
                if (makAd) {
                    const makIdQuery = `
                        WITH ISEMRI_FILTERED AS (
                            SELECT * 
                            FROM ERPURT.T_URT_ISEMRI 
                            WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                        )
                        SELECT DISTINCT MAK_ID
                        FROM ERPREADONLY.V_ISEMRI_DETAY 
                        WHERE ISEMRI_ID = :isemriId AND MAK_AD = :makAd
                    `;
                    const makIdResult = await connection.execute(makIdQuery, { isemriId: job.isemriId, makAd });
                    if (makIdResult.rows.length > 0 && makIdResult.rows[0][0]) {
                        transferMakId = makIdResult.rows[0][0];
                    }
                }
                
                // Kalan miktarı bugüne yeni kayıt olarak ekle
                const insertQuery = `
                    INSERT INTO ERPREADONLY.PLANLAMA_VERI (
                        ISEMRI_ID,
                        ISEMRI_PARCA_NO,
                        PLAN_TARIHI,
                        PLANLANAN_MIKTAR,
                        PLANLAMA_DURUMU,
                        MAK_AD,
                        MAK_ID
                    ) VALUES (
                        :isemriId,
                        :isemriParcaNo,
                        TO_DATE(:planTarihi || ' 03:00:00', 'YYYY-MM-DD HH24:MI:SS'),
                        :planlananMiktar,
                        'PLANLANDI',
                        :makAd,
                        :makId
                    )
                `;
                
                // ISEMRI_PARCA_NO: İş emri parçalama mantığına göre hesapla
                // İş emri parçalama endpoint'indeki mantık: Her zaman MAX + 1 hesapla
                // Ama eğer ISEMRI_ID için hiç breakdown yoksa (MAX NULL ise), yeni kayıt için NULL (ana kayıt)
                let isemriParcaNo = null;
                
                console.log(`  Mevcut kayıt bilgileri: ISEMRI_ID=${job.isemriId}, ISEMRI_PARCA_NO=${job.isemriParcaNo !== undefined && job.isemriParcaNo !== null ? job.isemriParcaNo : 'NULL'}`);
                
                // İş emri parçalama mantığı: ISEMRI_ID için MAX(ISEMRI_PARCA_NO) + 1 hesapla
                // Eğer MAX NULL ise (hiç breakdown yoksa), yeni kayıt için NULL (ana kayıt)
                // Eğer MAX > 0 ise (breakdown'lar varsa), yeni kayıt için MAX + 1
                const nextParcaQuery = `
                    WITH ISEMRI_FILTERED AS (
                        SELECT * 
                        FROM ERPURT.T_URT_ISEMRI 
                        WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                    )
                    SELECT NVL(MAX(PV.ISEMRI_PARCA_NO), 0) as MAX_PARCA_NO
                    FROM ERPREADONLY.PLANLAMA_VERI PV
                    INNER JOIN ISEMRI_FILTERED IF ON PV.ISEMRI_ID = IF.ISEMRI_ID
                    WHERE PV.ISEMRI_ID = :isemriId
                `;
                const nextParcaResult = await connection.execute(nextParcaQuery, { isemriId: job.isemriId });
                const maxParcaNoValue = nextParcaResult.rows[0][0];
                const maxParcaNo = maxParcaNoValue !== null && maxParcaNoValue !== undefined ? Number(maxParcaNoValue) : 0;
                
                console.log(`  Sorgu sonucu: MAX(ISEMRI_PARCA_NO) = ${maxParcaNoValue} (dönüştürülmüş: ${maxParcaNo})`);
                
                if (maxParcaNo > 0) {
                    // Breakdown'lar varsa, yeni kayıt için MAX + 1
                    isemriParcaNo = maxParcaNo + 1;
                    console.log(`  Breakdown'lar mevcut, yeni parça numarası: ${isemriParcaNo}`);
                } else {
                    // Breakdown yoksa, yeni kayıt için NULL (ana kayıt olarak kalır)
                    isemriParcaNo = null;
                    console.log(`  Breakdown yok, ISEMRI_PARCA_NO = NULL (ana kayıt)`);
                }
                
                const insertResult = await connection.execute(insertQuery, {
                    isemriId: job.isemriId,
                    isemriParcaNo: isemriParcaNo,
                    planTarihi: bugunStr,
                    planlananMiktar: kalanMiktar,
                    makAd: makAd,
                    makId: transferMakId
                });
                console.log(`  INSERT detay: ISEMRI_PARCA_NO = ${isemriParcaNo !== null ? isemriParcaNo : 'NULL'}`);
                console.log(`  INSERT sonucu: Yeni kayıt eklendi (${kalanMiktar} adet, ${bugunStr})`);
                
                transferredPlans.push({
                    planId: job.planId,
                    isemriId: job.isemriId,
                    kalanMiktar: kalanMiktar,
                    yeniPlanTarihi: bugunStr,
                    makAd: makAd,
                    islemTipi: 'guncelleme_ve_yeni_kayit'
                });
            } else {
                // Durum 2: Gerçekleşmiş miktar yok
                // Mevcut kaydın tarihini bugüne güncelle (yeni kayıt oluşturma)
                const updateQuery = `
                    UPDATE ERPREADONLY.PLANLAMA_VERI
                    SET PLAN_TARIHI = TO_DATE(:planTarihi || ' 03:00:00', 'YYYY-MM-DD HH24:MI:SS')
                    WHERE PLAN_ID = :planId
                `;
                await connection.execute(updateQuery, {
                    planTarihi: bugunStr,
                    planId: job.planId
                });
                
                transferredPlans.push({
                    planId: job.planId,
                    isemriId: job.isemriId,
                    kalanMiktar: planlananMiktar,
                    yeniPlanTarihi: bugunStr,
                    makAd: makAd,
                    islemTipi: 'tarih_guncelleme'
                });
            }
        }
        
        await connection.commit();
        
        console.log(`${transferredPlans.length} gecikmiş plan bugüne aktarıldı`);
        
        res.json({
            success: true,
            message: `${transferredPlans.length} gecikmiş iş bugüne aktarıldı`,
            transferredCount: transferredPlans.length,
            transferredPlans: transferredPlans
        });
        
    } catch (error) {
        console.error('Gecikmiş işleri aktarma hatası:', error);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).json({
            success: false,
            message: 'Gecikmiş işler aktarılırken hata oluştu',
            error: error.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Bağlantı kapatma hatası:', err);
            }
        }
    }
});

// Aynı ürün kodlu iş emirlerini getir (Ürün Bazlı Planlama için)
// POST request kullanarak ürün kodunu body'den al (URL encode sorununu önlemek için)
app.post('/api/product-based-planning/orders', async (req, res) => {
    let connection;
    try {
        const { malhizKodu } = req.body;
        
        if (!malhizKodu) {
            return res.status(400).json({ success: false, message: 'Malzeme kodu gerekli' });
        }
        
        // Trim yapma - direkt body'den gelen değeri olduğu gibi kullan
        const originalMalhizKodu = String(malhizKodu);
        
        console.log('API\'den gelen malzeme kodu (body - tam):', malhizKodu);
        console.log('Kullanılacak malzeme kodu (tam eşleşme, trim yok):', originalMalhizKodu);
        console.log('Malzeme kodu uzunluğu:', originalMalhizKodu.length);
        
        if (!originalMalhizKodu || originalMalhizKodu.length === 0) {
            return res.status(400).json({ success: false, message: 'Malzeme kodu gerekli' });
        }
        
        connection = await pool.getConnection();
        
        // Önce ISEMRI_SIRA = 0 olanları ara (paketleme aşaması)
        const ordersQuery = `
            WITH ISEMRI_FILTERED AS (
                SELECT * 
                FROM ERPURT.T_URT_ISEMRI 
                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
            ),
            PAKETLEME_ASAMALARI AS (
                SELECT DISTINCT
                    VD.ISEMRI_ID,
                    VD.ISEMRI_NO,
                    VD.MALHIZ_KODU,
                    VD.MALHIZ_ADI,
                    VD.IMALAT_TURU,
                    VD.PLAN_MIKTAR,
                    VD.GERCEK_MIKTAR,
                    VD.AGIRLIK,
                    VD.TOPLAM_SURE,
                    VD.ONERILEN_TESLIM_TARIH,
                    VD.ISEMRI_AC_TAR,
                    VD.FIRMA_ADI,
                    -- Planlama durumunu kontrol et
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM ERPREADONLY.PLANLAMA_VERI PV2
                            INNER JOIN ISEMRI_FILTERED IF2 ON PV2.ISEMRI_ID = IF2.ISEMRI_ID
                            WHERE PV2.ISEMRI_ID = VD.ISEMRI_ID 
                            AND PV2.PLANLAMA_DURUMU = 'PLANLANDI'
                            AND PV2.ISEMRI_PARCA_NO = 1
                        ) THEN 'PLANLANDI'
                        WHEN EXISTS (
                            SELECT 1 FROM ERPREADONLY.PLANLAMA_VERI PV3
                            INNER JOIN ISEMRI_FILTERED IF3 ON PV3.ISEMRI_ID = IF3.ISEMRI_ID
                            WHERE PV3.ISEMRI_ID = VD.ISEMRI_ID 
                            AND PV3.PLANLAMA_DURUMU = 'PLANLANDI'
                        ) THEN 'KISMI_PLANLANDI'
                        ELSE 'BEKLEMEDE'
                    END AS DURUM
                FROM ERPREADONLY.V_ISEMRI_DETAY VD
                INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
                WHERE VD.ISEMRI_SIRA = 0
                AND VD.MALHIZ_KODU = :originalMalhizKodu
            )
            SELECT * FROM PAKETLEME_ASAMALARI
            ORDER BY ISEMRI_AC_TAR ASC, ISEMRI_NO ASC
        `;
        
        const ordersResult = await connection.execute(ordersQuery, { 
            originalMalhizKodu: originalMalhizKodu
        });
        
        console.log('Bulunan iş emri sayısı:', ordersResult.rows.length);
        
        // Eğer sonuç yoksa, debug için alternatif sorgu çalıştır
        if (ordersResult.rows.length === 0) {
            // Debug: Benzer malhizKodu'na sahip kayıtları kontrol et
            // Önce tam eşleşme, sonra LIKE ile benzer olanları göster
            const debugQuery = `
                WITH ISEMRI_FILTERED AS (
                    SELECT * 
                    FROM ERPURT.T_URT_ISEMRI 
                    WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                )
                SELECT 
                    COUNT(*) as TOTAL_COUNT, 
                    COUNT(CASE WHEN VD.ISEMRI_SIRA = 0 THEN 1 END) as SIRA_0_COUNT,
                    LISTAGG(DISTINCT TO_CHAR(VD.ISEMRI_SIRA), ', ') WITHIN GROUP (ORDER BY VD.ISEMRI_SIRA) as SIRA_VALUES,
                    LISTAGG(DISTINCT SUBSTR(VD.MALHIZ_KODU, 1, 100), ' | ') WITHIN GROUP (ORDER BY VD.MALHIZ_KODU) as MALHIZ_KODLARI
                FROM ERPREADONLY.V_ISEMRI_DETAY VD
                INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
                WHERE VD.MALHIZ_KODU = :originalMalhizKodu
            `;
            
            // Benzer kodları bulmak için LIKE sorgusu
            const similarQuery = `
                WITH ISEMRI_FILTERED AS (
                    SELECT * 
                    FROM ERPURT.T_URT_ISEMRI 
                    WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                )
                SELECT DISTINCT
                    VD.MALHIZ_KODU,
                    VD.ISEMRI_SIRA,
                    LENGTH(VD.MALHIZ_KODU) as KOD_UZUNLUGU,
                    DUMP(VD.MALHIZ_KODU) as KOD_DUMP
                FROM ERPREADONLY.V_ISEMRI_DETAY VD
                INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
                WHERE VD.ISEMRI_SIRA = 0
                AND (
                    VD.MALHIZ_KODU LIKE SUBSTR(:originalMalhizKodu, 1, 10) || '%'
                    OR VD.MALHIZ_KODU LIKE '%' || SUBSTR(:originalMalhizKodu, -10) || '%'
                )
                AND ROWNUM <= 10
            `;
            
            try {
                const debugResult = await connection.execute(debugQuery, { 
                    originalMalhizKodu: originalMalhizKodu
                });
                console.log('Debug sorgu sonucu (tam eşleşme):', {
                    totalCount: debugResult.rows[0][0],
                    sira0Count: debugResult.rows[0][1],
                    siraValues: debugResult.rows[0][2],
                    malhizKodlari: debugResult.rows[0][3]
                });
                
                // Benzer kodları da kontrol et
                const similarResult = await connection.execute(similarQuery, { 
                    originalMalhizKodu: originalMalhizKodu
                });
                if (similarResult.rows.length > 0) {
                    console.log('Benzer malzeme kodları bulundu:');
                    similarResult.rows.forEach(row => {
                        const meta = similarResult.metaData.map(c => c.name);
                        const rowObj = {};
                        meta.forEach((col, i) => {
                            rowObj[col] = row[i];
                        });
                        console.log('  -', rowObj.MALHIZ_KODU, '(Uzunluk:', rowObj.KOD_UZUNLUGU, ')');
                    });
                }
            } catch (debugErr) {
                console.error('Debug sorgu hatası:', debugErr);
            }
            
            return res.json({
                success: true,
                data: [],
                message: 'Aynı ürün kodlu iş emri bulunamadı'
            });
        }
        
        // Satırları nesne haline getir
        const meta = ordersResult.metaData.map(c => c.name);
        const orders = ordersResult.rows.map(row => {
            const order = {};
            meta.forEach((col, i) => {
                order[col] = row[i];
            });
            return order;
        });
        
        res.json({
            success: true,
            data: orders
        });
        
    } catch (error) {
        console.error('Aynı ürün kodlu iş emirlerini getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'İş emirleri getirilemedi',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// Ürün bazlı planlama endpoint'i (mevcut /api/planning endpoint'ini kullanarak)
app.post('/api/product-based-planning/plan', async (req, res) => {
    let connection;
    try {
        const { orders } = req.body; // orders: [{ isemriId, planTarihi, planlananMiktar, selectedMachine }]
        
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            return res.status(400).json({ success: false, message: 'En az bir iş emri seçilmelidir' });
        }
        
        connection = await pool.getConnection();
        
        const results = [];
        const errors = [];
        
        // Her iş emri için planlama yap (mevcut /api/planning mantığını kullan)
        for (const order of orders) {
            try {
                const { isemriId, planTarihi, planlananMiktar, selectedMachine, aciklama } = order;
                
                if (!isemriId || !planTarihi || !planlananMiktar) {
                    errors.push({ isemriId, error: 'Eksik parametre' });
                    continue;
                }
                
                // Maça aşaması kontrolü için BOLUM_ADI, MAK_AD ve MAK_ID'yi al
                const stageInfoQuery = `
                    WITH ISEMRI_FILTERED AS (
                        SELECT * 
                        FROM ERPURT.T_URT_ISEMRI 
                        WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                    )
                    SELECT MAK_AD, BOLUM_ADI, MAK_ID
                    FROM ERPREADONLY.V_ISEMRI_DETAY 
                    WHERE ISEMRI_ID = :isemriId
                `;
                const stageInfoResult = await connection.execute(stageInfoQuery, { isemriId });
                if (stageInfoResult.rows.length === 0) {
                    errors.push({ isemriId, error: 'İş emri bulunamadı' });
                    continue;
                }
                
                const originalMakAd = stageInfoResult.rows[0][0];
                const bolumAdi = stageInfoResult.rows[0][1] || '';
                const originalMakId = stageInfoResult.rows[0][2] || null;
                
                // Maça aşaması kontrolü
                const macaKeywords = ['maça', 'maca'];
                const isMacaStage = macaKeywords.some(k => 
                    (bolumAdi || '').toLowerCase().includes(k) || 
                    (originalMakAd || '').toLowerCase().includes(k)
                );
                
                let targetMachine = originalMakAd;
                let targetMakId = originalMakId;
                // Tüm aşamalar için makine seçimine izin ver
                if (selectedMachine) {
                    targetMachine = selectedMachine;
                    if (selectedMachine !== originalMakAd) {
                        // Seçilen makine için MAK_ID'yi al
                        const makIdQuery = `
                            WITH ISEMRI_FILTERED AS (
                                SELECT * 
                                FROM ERPURT.T_URT_ISEMRI 
                                WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                            )
                            SELECT DISTINCT MAK_ID
                            FROM ERPREADONLY.V_ISEMRI_DETAY 
                            WHERE ISEMRI_ID = :isemriId AND MAK_AD = :selectedMachine
                        `;
                        const makIdResult = await connection.execute(makIdQuery, { isemriId, selectedMachine });
                        if (makIdResult.rows.length > 0 && makIdResult.rows[0][0]) {
                            targetMakId = makIdResult.rows[0][0];
                        }
                    }
                }
                
                // İş emrinin sipariş miktarını kontrol et (Sipariş Miktar (Adet) - SIPARIS_MIKTAR)
                const siparisQuery = `
                    WITH ISEMRI_FILTERED AS (
                        SELECT * 
                        FROM ERPURT.T_URT_ISEMRI 
                        WHERE FABRIKA_KOD = 120 AND DURUMU = 1
                    )
                    SELECT NVL(VD.PLAN_MIKTAR, 0) * NVL(VD.FIGUR_SAYISI, 1) AS SIPARIS_MIKTAR
                    FROM ERPREADONLY.V_ISEMRI_DETAY VD
                    INNER JOIN ISEMRI_FILTERED IF ON VD.ISEMRI_ID = IF.ISEMRI_ID
                    WHERE VD.ISEMRI_ID = :isemriId
                `;
                const siparisResult = await connection.execute(siparisQuery, { isemriId });
                if (siparisResult.rows.length === 0) {
                    errors.push({ isemriId, error: 'İş emri bulunamadı' });
                    continue;
                }
                
                const siparisMiktar = siparisResult.rows[0][0] || 0;
                const isPartialPlanning = parseInt(planlananMiktar) < siparisMiktar;
                
                let createdPlanIdOut = null;
                if (isPartialPlanning) {
                    // Kısmi planlama
                    const insertQuery = `
                        INSERT INTO ERPREADONLY.PLANLAMA_VERI 
                        (ISEMRI_ID, PLAN_TARIHI, ISEMRI_PARCA_NO, PLANLANAN_MIKTAR, PLANLAMA_DURUMU, MAK_AD, MAK_ID, ACIKLAMA)
                        VALUES (:isemriId, :planTarihi, 1, :planlananMiktar, 'PLANLANDI', :targetMachine, :targetMakId, :aciklama)
                        RETURNING PLAN_ID INTO :planId
                    `;
                    
                    const bindVars = {
                        isemriId: isemriId,
                        planTarihi: new Date(planTarihi),
                        planlananMiktar: parseInt(planlananMiktar),
                        targetMachine: targetMachine,
                        targetMakId: targetMakId,
                        aciklama: aciklama || null,
                        planId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
                    };
                    
                    const insertRes = await connection.execute(insertQuery, bindVars);
                    try { createdPlanIdOut = insertRes?.outBinds?.planId?.[0] ?? null; } catch (_) { createdPlanIdOut = null; }
                    
                    // NOT: Kalan kısmı "Beklemede" olarak veritabanına kaydetmiyoruz
                    // Bekleyen miktar frontend'de dinamik olarak hesaplanacak (sipariş miktarı - toplam planlanan)
                    const kalanMiktar = siparisMiktar - parseInt(planlananMiktar);
                } else {
                    // Tam planlama
                    const insertQuery = `
                        INSERT INTO ERPREADONLY.PLANLAMA_VERI 
                        (ISEMRI_ID, PLAN_TARIHI, ISEMRI_PARCA_NO, PLANLANAN_MIKTAR, PLANLAMA_DURUMU, MAK_AD, MAK_ID, ACIKLAMA)
                        VALUES (:isemriId, :planTarihi, 1, :planlananMiktar, 'PLANLANDI', :targetMachine, :targetMakId, :aciklama)
                        RETURNING PLAN_ID INTO :planId
                    `;
                    
                    const bindVars = {
                        isemriId: isemriId,
                        planTarihi: new Date(planTarihi),
                        planlananMiktar: parseInt(planlananMiktar),
                        targetMachine: targetMachine,
                        targetMakId: targetMakId,
                        aciklama: aciklama || null,
                        planId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
                    };
                    
                    const insertRes = await connection.execute(insertQuery, bindVars);
                    try { createdPlanIdOut = insertRes?.outBinds?.planId?.[0] ?? null; } catch (_) { createdPlanIdOut = null; }
                }
                
                results.push({
                    isemriId,
                    success: true,
                    createdPlanId: createdPlanIdOut,
                    isPartialPlanning
                });
                
            } catch (orderError) {
                console.error(`İş emri ${order.isemriId} planlama hatası:`, orderError);
                errors.push({ isemriId: order.isemriId, error: orderError.message });
            }
        }
        
        if (results.length > 0) {
            await connection.commit();
        } else {
            await connection.rollback();
        }
        
        res.json({
            success: results.length > 0,
            message: `${results.length} iş emri planlandı${errors.length > 0 ? `, ${errors.length} hata oluştu` : ''}`,
            data: {
                results,
                errors: errors.length > 0 ? errors : undefined
            }
        });
        
    } catch (error) {
        console.error('Ürün bazlı planlama hatası:', error);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).json({
            success: false,
            message: 'Planlama yapılamadı',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// Sunucuyu başlat
async function startServer() {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
        });
    } catch (err) {
        console.error('Sunucu başlatma hatası:', err);
    }
}

startServer();

