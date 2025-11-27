SELECT Z."SIP_KARSI_KOD",



    Z."STKCIKNO",

           Z."CIKES_BLGTRH",

           Z."KAYIT_GIR_TAR",

           Z."FIRMA_ADI",

           Z."MALHIZ_KODU",

           Z."MALHIZ_ADI",

           Z."CIKIS_MIKTAR",

           Z."UZLAS_ISTENEN_TARIH",

           Z."FIYAT",

           Z."CIKIS_TUTAR",

           Z."SIP_PARA_BIRIM",

           Z."YURTDISIMI",

           Z."ISEMRI_BRUT_AGIRLIK",

           Z."BRUT_AGIRLIK",

           Z."AGIRLIK",

           Z."SEVK_NET_AGIRLIK",

           Z."AGIRLIK_BIRIM",

           Z."FATURA_FIYAT",

           Z."FATURA_TUTAR",

           Z."FIRMA_ID",

           Z."FIRMA_KODU",

           Z."SIP_KOD_SIRA",

           Z."MIKTAR",

           Z."FABRIKA_KOD",

           Z."FATURA_NO",

           Z."IRSALIYE_NO",

           Z."FATURA_TARIHI",

           Z."ISEMRI_NET_AGIRLIK",

           Z."GECIKTIREN_BOLUM_KOD",

           Z."GECIKME_NEDENI",

           Z."SERI",

           Z."CIKIS_ISTENEN_FARK_GUN",

           Z."ULKE",

           Z."ULKE_ADI",

           Z."TOP_SEVK_BRUT_AGIRLIK",

           Z."TOP_SEVK_NET_AGIRLIK",

           Z."TOP_SEVK_SON_AGIRLIK",

           Z."ALASIM_KOD",

           Z."DOVIZ_KODU",

           Z."SEVK_TUTAR_TL",

           Z."ULKE_ING_ADI",

           (SELECT MAX (kur)

              FROM v_ort_dovizkur vd

             WHERE     vd.doviz_id = Z.sip_para_birim

                   AND vd.fabrika_kod = Z.fabrika_kod

                   AND TO_CHAR (TARIH, 'DD/MM/YYYY') =

                       (erpkullanici.blsm_to_char (Z.fatura_tarihi,

                                                   'DD/MM/YYYY'))

                   AND KURTUR_ID = 1201

                   AND KURYER_ID = 1211)    kur

      FROM (  SELECT g.SIP_KARSI_KOD,

      a.stkcikno,

                     a.cikes_blgtrh,

                     a.kayit_gir_tar,

                     f.firma_adi,

                     c.malhiz_kodu,

                     c.malhiz_adi,

                     b.cikis_miktar * b.cikis_katsayi

                         cikis_miktar,

                     COALESCE (e.uzlasilan_teslim_tarih, e.istenen_tarih_min)

                         uzlas_istenen_tarih,

                     e.fiyat,

                     b.cikis_miktar * b.cikis_katsayi * e.fiyat

                         cikis_tutar,

                     g.sip_para_birim,

                     (CASE

                          WHEN COALESCE (f.yurt_disi, 0) = 1 THEN 'YURTDISI'

                          ELSE 'YURTIÇI'

                      END)

                         yurtdisimi,

                     (SELECT   SUM (issx.brut_agirlik * f.cikis_miktar)

                             / b.cikis_miktar

                        FROM t_stk_stok_cikis_mlz_detay f

                             LEFT OUTER JOIN t_stk_stok_giris_mlz z

                                 ON f.stkgir_mlz_id = z.stkgir_mlz_id

                             LEFT OUTER JOIN t_urt_isemri issx

                                 ON issx.isemri_id = z.is_emri_no

                       WHERE f.stkcik_mlz_id = b.stkcik_mlz_id)

                         isemri_brut_agirlik,

                     o.brut_agirlik,

                     o.agirlik,

                     o.ozgul_agirlik

                         sevk_net_agirlik,

                     o.agirlik_birim

                         agirlik_birim,

                     SUM (COALESCE (sfk.birim_fiyat, 0))

                         fatura_fiyat,

                     SUM (COALESCE (sfk.top_tutar, 0))

                         fatura_tutar,

                     f.firma_id,

                     f.firma_kodu,

                     g.sip_kod || '-' || e.sip_sira

                         sip_kod_sira,

                     e.miktar,

                     a.fabrika_kod,

                     MIN (sf.fatura_no)

                         fatura_no,

                     a.cikes_blgno

                         irsaliye_no,

                     MIN (

                         erpkullanici.blsm_to_char (sf.fatura_tarihi,

                                                    'DD/MM/YYYY'))

                         fatura_tarihi,

                     (SELECT   SUM (issx.agirlik * f.cikis_miktar)

                             / b.cikis_miktar

                        FROM t_stk_stok_cikis_mlz_detay f

                             LEFT OUTER JOIN t_stk_stok_giris_mlz z

                                 ON f.stkgir_mlz_id = z.stkgir_mlz_id

                             LEFT OUTER JOIN t_urt_isemri issx

                                 ON issx.isemri_id = z.is_emri_no

                       WHERE f.stkcik_mlz_id = b.stkcik_mlz_id)

                         isemri_net_agirlik,

                     g1.bolum_kod

                         geciktiren_bolum_kod,

                     k1.kodack

                         gecikme_nedeni,

                     c.seri,

                     (  a.cikes_blgtrh

                      - COALESCE (e.uzlasilan_teslim_tarih,

                                  e.istenen_tarih_min))

                         cikis_istenen_fark_gun,

                     f.ulke,

                     u.ulke_adi,

                     b.cikis_miktar * b.cikis_katsayi * o.brut_agirlik

                         top_sevk_brut_agirlik,

                     b.cikis_miktar * b.cikis_katsayi * o.agirlik

                         top_sevk_net_agirlik,

                     b.cikis_miktar * b.cikis_katsayi * o.ozgul_agirlik

                         top_sevk_son_agirlik,

                     k.kodack

                         alasim_kod,

                     DO.doviz_kodu,

                     COALESCE (

                         (SUM (COALESCE (sfk.top_tutar, 0))),

                         (  b.cikis_miktar

                          * b.cikis_katsayi

                          * e.fiyat

                          * (SELECT kur_fiyat

                               FROM v_ort_dovizkur_son vd

                              WHERE     vd.doviz_id = g.sip_para_birim

                                    AND vd.fabrika_kod = a.fabrika_kod)))

                         sevk_tutar_tl,

                     u.ulke_ing_adi

                FROM t_stk_stok_cikis    a

                     LEFT OUTER JOIN erp_firma f ON f.firma_id = a.firma_id

                     LEFT OUTER JOIN t_ort_ulke u ON f.ulke = u.ulke,

                     t_stk_stok_cikis_mlz b

                     LEFT OUTER JOIN t_mky_satisfatkl sfk

                         ON b.stkcik_mlz_id = sfk.stkcik_mlz_id

                     LEFT JOIN t_mky_satisfat sf

                         ON sfk.sat_fatura_id = sf.sat_fatura_id

                     LEFT OUTER JOIN t_urt_bolum g1

                         ON g1.bolum_id = b.gecik_bolum_id

                     LEFT OUTER JOIN t_stk_kod k1

                         ON     b.gec_sevkiyat_tur = k1.kod

                            AND b.fabrika_kod = k1.fabrika_kod

                            AND k1.tablo = 'GECSEVKTUR'

                     LEFT OUTER JOIN t_sip_siparis_urun e

                         ON e.sipurun_id = b.sipurun_id

                     LEFT OUTER JOIN t_sip_siparis g ON g.sip_id = e.sip_id

                     LEFT OUTER JOIN t_ort_doviz DO

                         ON g.sip_para_birim = DO.doviz_id,

                     t_stk_mlz           c,

                     t_stk_mlz_ozeltanim o

                     LEFT OUTER JOIN t_stk_kod k

                         ON     k.kod = o.imalat_turu

                            AND k.fabrika_kod = o.fabrika_kod

                            AND k.tablo = 'MLZIMLTUR'

               WHERE     a.fabrika_kod = 120

                     AND a.stkciktur = '3'

                     AND c.mlz_id = b.mlz_id

                     AND o.mlz_id = b.mlz_id

                     AND b.stkcik_id = a.stkcik_id

            GROUP BY a.stkcikno,

                     a.cikes_blgtrh,

                     f.firma_adi,

                     c.malhiz_kodu,

                     c.malhiz_adi,

                     b.cikis_miktar,

                     b.cikis_katsayi,

                     b.cikis_miktar * b.cikis_katsayi,

                     COALESCE (e.uzlasilan_teslim_tarih, e.istenen_tarih_min),

                     e.fiyat,

                     b.cikis_miktar * b.cikis_katsayi * e.fiyat,

                     g.sip_para_birim,

                     COALESCE (f.yurt_disi, 0),

                     o.brut_agirlik,

                     o.agirlik,

                     o.ozgul_agirlik,

                     b.cikis_miktar * b.cikis_katsayi * o.brut_agirlik,

                     b.cikis_miktar * b.cikis_katsayi * o.agirlik,

                     b.cikis_miktar * b.cikis_katsayi * o.ozgul_agirlik,

                     o.agirlik_birim,

                     f.firma_id,

                     f.firma_kodu,

                     g.sip_kod || '-' || e.sip_sira,

                     e.miktar,

                     a.fabrika_kod,

                     a.cikes_blgno,

                     b.stkcik_mlz_id,

                     b.mlz_id,

                     g1.bolum_kod,

                     k1.kodack,

                     c.seri,

                     f.ulke,

                     u.ulke_adi,

                     u.ulke_ing_adi,

                     a.kayit_gir_tar,

                     k.kodack,

                     DO.doviz_kodu,

                     g.SIP_KARSI_KOD

            ORDER BY a.cikes_blgtrh DESC) Z;

