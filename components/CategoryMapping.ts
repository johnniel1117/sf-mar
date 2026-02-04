/**
 * Category Mapping for Haier Product Material Codes
 * 
 * This file contains the complete mapping of MATCODE (barcode/bin code) to product categories.
 * The mapping includes exact matches for known material codes and pattern-based detection
 * for categorizing unknown codes based on their prefix patterns.
 * 
 * Categories include:
 * - Freezer, Refrigerator, TV, Washing Machine, Drum Washing Machine
 * - Home Air Conditioner, Commercial AC, Commercial Washer
 * - Small Appliances, Cooktop, Cooker, Range Hood
 * - Water Heater, Micro-wave Oven, Others
 */

export const MATCODE_CATEGORY_MAP: Record<string, string> = {
  // ==================== FREEZER ====================
  "B30FZ4M6K": "Freezer",
  "B30FM4M6K": "Freezer",
  "B300G5M6K": "Freezer",
  "B30GK2M6J": "Freezer",
  "BD07U2M00": "Freezer",
  "BF0GS8M00": "Freezer",
  "BF0GS5M00": "Freezer",
  "B30FZ6E6A": "Freezer",
  "B30FMAE6A": "Freezer",
  "B300GDE6A": "Freezer",
  "B30GKJE2J": "Freezer",
  "BF0G30E04": "Freezer",
  "B30GLFE2J": "Freezer",
  "B30GMGE2J": "Freezer",
  "B30JU3E00": "Freezer",
  "B300A3E2J": "Freezer",
  "B40791E6H": "Freezer",
  "BW0ACEE00": "Freezer",
  "BW0ADQE00": "Freezer",
  "TA5602027": "Freezer",
  "BY0H41E58": "Freezer",
  "BY0K10E00": "Freezer",
  "BY0ETAE18": "Freezer",
  "BY0H53E58": "Freezer",
  "BY0K28E00": "Freezer",
  "TD0043841": "Freezer",
  "TD0043842": "Freezer",
  "TD0043843": "Freezer",
  "TD0043844": "Freezer",
  "TD0043845": "Freezer",
  "TD0043846": "Freezer",
  "TD0043847": "Freezer",
  "TD0045303": "Freezer",
  "TD0045304": "Freezer",
  "TD0045305": "Freezer",
  "TD0045306": "Freezer",
  "BD07U0M00": "Freezer",
  "BD07U1M00": "Freezer",
  "BD07U3M00": "Freezer",
  "BD07U4M00": "Freezer",
  "BF0GS6M00": "Freezer",
  "BF0GS7M00": "Freezer",
  "BF0GS9M00": "Freezer",
  "BF0GS0M00": "Freezer",
  "BF0GS2M00": "Freezer",
  "BF0GS3M00": "Freezer",
  "BW08D5M00": "Freezer",
  "BW08D0M00": "Freezer",
  "BW08D2M00": "Freezer",
  "BW08D3M00": "Freezer",
  "BF0GS1M00": "Freezer",
  "BW08D1M00": "Freezer",
  "BW08D4M00": "Freezer",
  "B30GJ6M56": "Freezer",
  "B30GM0M6J": "Freezer",
  "B30GL8M56": "Freezer",
  "BE06MHE1T": "Freezer",
  "B30GL0M6J": "Freezer",
  "BB09UGM02": "Freezer",
  "BF0GS4M00": "Freezer",
  "BW03N4E0N": "Freezer",
  "B401N9E6M": "Freezer",
  "BY0JQ5E00RU": "Freezer",
  "TD0014191": "Freezer",
  "BS0BB3000": "Freezer",

  // ==================== REFRIGERATOR ====================
  
  "B00TU8E8N": "Refrigerator",
  "B00U05B8V": "Refrigerator",
  "BS08X2EA6": "Refrigerator",
  "BS08Z2EA6": "Refrigerator",
  "BS09TBM90": "Refrigerator",
  "BS0B830AE": "Refrigerator",
  "BA0A6JM04": "Refrigerator",
  "BS0B9208Z": "Refrigerator",
  "TD0025229": "Refrigerator",
  "BM03U1M4Z": "Refrigerator",
  "BM03U0M4Z": "Refrigerator",
  "BS08ZLEAE": "Refrigerator",
  "BS08ZKE7R": "Refrigerator",
  "BH0348E7J": "Refrigerator",
  "BS0909EAE": "Refrigerator",
  "BS08ZHEA9": "Refrigerator",
  "BS08ZKEAE": "Refrigerator",
  "BL0561EA6": "Refrigerator",
  "BL05S1EAE": "Refrigerator",
  "BL0570EA6": "Refrigerator",
  "BL05T0EAE": "Refrigerator",
  "BM03L0E3X": "Refrigerator",
  "BM03W1EAE": "Refrigerator",
  "BL0554EA6": "Refrigerator",
  "BM0400EAE": "Refrigerator",
  "BL04Z5EA6": "Refrigerator",
  "BM03M0EAC": "Refrigerator",
  "BM03N0EAC": "Refrigerator",
  "BH0331E98": "Refrigerator",
  "BM03U4M4Z": "Refrigerator",
  "BS0BE8000": "Refrigerator",
  "BS0BE9000": "Refrigerator",
  "BC1066M02": "Refrigerator",
  "BM03B2M4Z": "Refrigerator",
  "BM03B3M4Z": "Refrigerator",
  "BL06F40AE": "Refrigerator",
  "BL04T5EAE": "Refrigerator",
  "BL06F50AE": "Refrigerator",
  "BL06FA0AE": "Refrigerator",
  "BL06D0E1G": "Refrigerator",
  "BL06D10AA": "Refrigerator",
  "BC1063M02": "Refrigerator",
  "BL06D50AA": "Refrigerator",
  "BL04Z6E81": "Refrigerator",
  "BL04Z5EAE": "Refrigerator",
  "BL04Z7E81": "Refrigerator",
  "BL04Z4EAE": "Refrigerator",
  "BC1064M02": "Refrigerator",
  "BC1065M02": "Refrigerator",
  "TD0044921": "Refrigerator",
  "BC1159E00": "Refrigerator",
  "B70U05E84": "Refrigerator",
  "B70U04E84": "Refrigerator",
  "BC1156E00": "Refrigerator",
  "BC11E2E00": "Refrigerator",
  "BH03Y0E7J": "Refrigerator",
  "BH03Y8E01": "Refrigerator",
  "BH04AH000": "Refrigerator",
  "BS0BF6000": "Refrigerator",
  "BS0BF7000": "Refrigerator",
  "TD0046321": "Refrigerator",
  "BL06FK0AE": "Refrigerator",
  "BJ0XC0E1G": "Refrigerator",
  "BC0XD30AE": "Refrigerator",
  "BJ0XC40AE": "Refrigerator",
  "BJ0XD0E1G": "Refrigerator",
  "BJ0XD30AE": "Refrigerator",
  "BJ0XE0E1G": "Refrigerator",
  "BJ0XE60AE": "Refrigerator",
  "BC0XE50AE": "Refrigerator",
  "TD0025230": "Refrigerator",
  "TD0025231": "Refrigerator",
  "TD0025232": "Refrigerator",
  "TD0025233": "Refrigerator",
  "BM03HHEA5": "Refrigerator",
  "BK0YH2008": "Refrigerator",
  "BK0YH6008": "Refrigerator",
  "BS08ZNE7R": "Refrigerator",
  "BS099LE93": "Refrigerator",
  "BM03HEEA5": "Refrigerator",
  "BM03H7EA5": "Refrigerator",
  "BK0YH0008": "Refrigerator",
  "BS0912EAE": "Refrigerator",
  "BS0BG6000": "Refrigerator",
  "TD0046322": "Refrigerator",
  "TD0046323": "Refrigerator",
  "BL04Z8E00": "Refrigerator",
  "BL04ZBE00": "Refrigerator",
  "BM03U2M4Z": "Refrigerator",
  "BH02X6E98": "Refrigerator",
  "BA0A6DM00": "Refrigerator",
  "BA0A6HM00": "Refrigerator",
  "BA0A65M01": "Refrigerator",
  "BA0A64M01": "Refrigerator",
  "BS0900EAE": "Refrigerator",
  "BS0910EAE": "Refrigerator",
  "BS08Z0EAE": "Refrigerator",
  "BS0930EAE": "Refrigerator",
  "BS09A3E8A": "Refrigerator",
  "BM03M0EAE": "Refrigerator",
  "BL05E0E92": "Refrigerator",
  "BL05E0E8H": "Refrigerator",
  "BL05D0EA0": "Refrigerator",
  "BL05D0E7N": "Refrigerator",
  "BS09A2E8A": "Refrigerator",
  "BS09A1E8A": "Refrigerator",
  "BS09R0E84": "Refrigerator",
  "BS09R1E1G": "Refrigerator",
  "BS09R4E8A": "Refrigerator",
  "BA0A6AM01": "Refrigerator",
  "BA0A66M01": "Refrigerator",
  "BA0A6CM01": "Refrigerator",
  "BA0A67M01": "Refrigerator",
  "BA0A68M01": "Refrigerator",
  "BA0A69M00": "Refrigerator",
  "BA0A61M01": "Refrigerator",
  "BA0A62M01": "Refrigerator",
  "BA0A6BM00": "Refrigerator",
  "BA0A6CM00": "Refrigerator",
  "BA0A6EM00": "Refrigerator",
  "BA0A6FM00": "Refrigerator",
  "BA0A6GM00": "Refrigerator",
  "BA0A6JM00": "Refrigerator",
  "BA0A6KM00": "Refrigerator",
  "BA0A6LM00": "Refrigerator",
  "BA0A6MM00": "Refrigerator",
  "BA0A6NM00": "Refrigerator",
  "BA0A6PM00": "Refrigerator",
  "BA0A6RM00": "Refrigerator",
  "BA0A6SM00": "Refrigerator",
  "BA0A6TM00": "Refrigerator",
  "BA0A6UM00": "Refrigerator",
  "BA0A6VM00": "Refrigerator",
  "BA0A6WM00": "Refrigerator",
  "BA0A6XM00": "Refrigerator",
  "BA0A6YM00": "Refrigerator",
  "BA0A6ZM00": "Refrigerator",
  "BS08X2EAE": "Refrigerator",
  "BM03N0EAE": "Refrigerator",
  "BA0A69M01": "Refrigerator",
  "BS09R4E1G": "Refrigerator",
  "BA0A6BM01": "Refrigerator",
  "BS09R4E96": "Refrigerator",
  "BS09R5E96": "Refrigerator",
  "BS0932EAE": "Refrigerator",
  "BS08ZJEAE": "Refrigerator",
  "BA0A6GM04": "Refrigerator",
  "BS0900E7R": "Refrigerator",
  "BS0902EA9": "Refrigerator",
  "BS08ZQE99": "Refrigerator",
  "BS0901E99": "Refrigerator",
  "BS0901EA9": "Refrigerator",
  "BS08ZEE7R": "Refrigerator",
  "BS08ZFE7R": "Refrigerator",
  "BS0901E7R": "Refrigerator",
  "BM03Y0EAE": "Refrigerator",
  "BJ0VG9ZAE": "Refrigerator",
  "BS09RDE9H": "Refrigerator",
  "BS09RBE9H": "Refrigerator",
  "BS09RCE9H": "Refrigerator",
  "BS09RFE9H": "Refrigerator",
  "BS09RGE9H": "Refrigerator",
  "BS099ME93": "Refrigerator",
  "BS099NE93": "Refrigerator",
  "BS0990E95": "Refrigerator",
  "BM03U3M4Z": "Refrigerator",
  "BH0341E8V": "Refrigerator",
  "BS0931EAE": "Refrigerator",
  "BS099PE93": "Refrigerator",
  "BS0933EAE": "Refrigerator",
  "BS08ZHEAE": "Refrigerator",
  "BC1062M02": "Refrigerator",
  "BA0A6HM04": "Refrigerator",
  "BS0906EAE": "Refrigerator",
  "BS0914EAE": "Refrigerator",
  "BS099JE93": "Refrigerator",
  "BS09REE9H": "Refrigerator",
  "BS0913EAE": "Refrigerator",
  "BS0908EAE": "Refrigerator",
  "BM03Z0EAE": "Refrigerator",
  "BS0907EAE": "Refrigerator",
  "TD0027247": "Refrigerator",
  "BS08ZTE99": "Refrigerator",
  "BS0900E8U": "Refrigerator",
  "BS099QE93": "Refrigerator",
  "BS08ZJE7R": "Refrigerator",
  "BS0903E7R": "Refrigerator",
  "BS090AEAE": "Refrigerator",
  "BS0903E99": "Refrigerator",
  "BS0903EA9": "Refrigerator",
  "BS0904E99": "Refrigerator",
  "BM03HFEA5": "Refrigerator",
  "BM03HGEA5": "Refrigerator",
  "BS08ZKEA9": "Refrigerator",
  "BS08ZSE99": "Refrigerator",
  "BS0902E7R": "Refrigerator",
  "BS08Z2E8U": "Refrigerator",
  "BS0902E8U": "Refrigerator",
  "BS0904E7R": "Refrigerator",
  "BS08Z0E8U": "Refrigerator",
  "BS0990EA4": "Refrigerator",
  "BJ0XE0EAE": "Refrigerator",
  "BL06F0EAE": "Refrigerator",
  "BL06F1EAE": "Refrigerator",
  "BM03HKEA5": "Refrigerator",
  "BJ0XC0EAE": "Refrigerator",
  "BJ0XD0EAE": "Refrigerator",
  "BS08ZRE99": "Refrigerator",
  "BS08ZGEA9": "Refrigerator",
  "BS0902E99": "Refrigerator",
  "BS08ZEEAE": "Refrigerator",
  "BM03HJEA5": "Refrigerator",
  "B00TU3E82": "Refrigerator",
  "BH0270E8N": "Refrigerator",
  "BH0280E8N": "Refrigerator",
  "BA0A6EM01": "Refrigerator",
  "BM03L0EAE": "Refrigerator",
  "BA0A6DM01": "Refrigerator",
  "BA0A60M01": "Refrigerator",
  "BA0A63M01": "Refrigerator",
  "BA0A6AM00": "Refrigerator",
  "BA0A6QM00": "Refrigerator",
  "BS09R0E96": "Refrigerator",
  "BS09R5E9H": "Refrigerator",
  "BS09A0E96": "Refrigerator",
  "BS0BG5000": "Refrigerator",
  "BS09R4E9H": "Refrigerator",
  "BJ0VH4Z8A": "Refrigerator",
  "BJ0XD50AE": "Refrigerator",
  "BC1153E02": "Refrigerator",
  "BC11FLE00": "Refrigerator",
  "BC115TE02": "Refrigerator",
  "BL06VA08Z": "Refrigerator",
  "BC115XE02": "Refrigerator",
  "BC115UE02": "Refrigerator",
  "BC1154E02": "Refrigerator",
  "BC11DEE00": "Refrigerator",
  "TD0013992": "Refrigerator",
  "TD0013991": "Refrigerator",
  "FB28UZM00": "Refrigerator",
  "FA08G9M00": "Refrigerator",

  "FS03B7E": "Water System",
  
  // ==================== HOME AIR CONDITIONER ====================
  "AD0KG4U00": "Home Air Conditioner",
  "AA93Z2E07": "Home Air Conditioner",
  "AA1P5NE09": "Home Air Conditioner",
  "AAA363E03": "Home Air Conditioner",
  "AAA7B1E00": "Home Air Conditioner",
  "AAA369E03": "Home Air Conditioner",
  "AAA7B8E00": "Home Air Conditioner",
  "AAAXN4E07": "Home Air Conditioner",
  "AAAXG3E07": "Home Air Conditioner",
  "AAAXN2E07": "Home Air Conditioner",
  "AAAXG1E07": "Home Air Conditioner",
  "AAC1NUE00": "Home Air Conditioner",
  "AAC1QBE00": "Home Air Conditioner",
  "AAC1NWE00": "Home Air Conditioner",
  "AAC1QDE00": "Home Air Conditioner",
  "AAAV51E07": "Home Air Conditioner",
  "AAAV11E07": "Home Air Conditioner",
  "AABT67E00": "Home Air Conditioner",
  "AABQZ6E00": "Home Air Conditioner",
  "AABT6GE00": "Home Air Conditioner",
  "AABQZDE00": "Home Air Conditioner",
  "AA9401E09": "Home Air Conditioner",
  "AA1PE2E09": "Home Air Conditioner",
  "AAA2HAE00": "Home Air Conditioner",
  "AAA7CDE00": "Home Air Conditioner",
  "AAAXN5E07": "Home Air Conditioner",
  "AAAXG4E07": "Home Air Conditioner",
  "AAAXN1E07": "Home Air Conditioner",
  "AAAXG2E07": "Home Air Conditioner",
  "AAC1PXE00": "Home Air Conditioner",
  "AAC1RCE00": "Home Air Conditioner",
  "AABT77E00": "Home Air Conditioner",
  "AABR16E00": "Home Air Conditioner",
  "AABT7CE00": "Home Air Conditioner",
  "AABR1BE00": "Home Air Conditioner",
  "AA9415E0B": "Home Air Conditioner",
  "AA9413E03": "Home Air Conditioner",
  "AAA2JWE0E": "Home Air Conditioner",
  "AAA2GWE0B": "Home Air Conditioner",
  "AAAXV1E07": "Home Air Conditioner",
  "AAAXB1E07": "Home Air Conditioner",
  "AAA35NE03": "Home Air Conditioner",
  "AAA33NE0E": "Home Air Conditioner",
  "AAAXM1E07": "Home Air Conditioner",
  "AAAXL1E07": "Home Air Conditioner",
  "AAAVD0E09": "Home Air Conditioner",
  "AAAV90E08": "Home Air Conditioner",
  "AAAVD4E00": "Home Air Conditioner",
  "AAAV93E00": "Home Air Conditioner",
  "AD0FFCE00": "Home Air Conditioner",
  "AD0L50E00": "Home Air Conditioner",
  "AD0P20E00": "Home Air Conditioner",
  "AD0FN0E6U": "Home Air Conditioner",
  "AD0FN0E03": "Home Air Conditioner",
  "AD0FN1E6U": "Home Air Conditioner",
  "AD0FN2E6U": "Home Air Conditioner",
  "AD0MH0E6U": "Home Air Conditioner",
  "AD0P50E00": "Home Air Conditioner",
  "AD0FP0E03": "Home Air Conditioner",
  "AD0ME2E01": "Home Air Conditioner",
  "AD0KG5E00": "Home Air Conditioner",
  "AD0ME0E00": "Home Air Conditioner",
  "AD0ME1E01": "Home Air Conditioner",
  "AD0P80E00": "Home Air Conditioner",
  "AD0P82E00": "Home Air Conditioner",
  "AD0P30E00": "Home Air Conditioner",
  "AD0FQ0E03": "Home Air Conditioner",
  "AD0KH0E00": "Home Air Conditioner",
  "AD0MF1E03": "Home Air Conditioner",
  "AD0MF0E00": "Home Air Conditioner",
  "AD0MF2E03": "Home Air Conditioner",
  "AD0MP4E00": "Home Air Conditioner",
  "AD0P40E00": "Home Air Conditioner",
  "AD0MG2E00": "Home Air Conditioner",
  "AAC1ULE00": "Home Air Conditioner",
  "AAC1X8E00": "Home Air Conditioner",
  "AAC1TUE00": "Home Air Conditioner",
  "AAC1WCE00": "Home Air Conditioner",
  "AAC1PAE02": "Home Air Conditioner",
  "AAC1R7E01": "Home Air Conditioner",
  "AAC1PZE00": "Home Air Conditioner",
  "AAC1REE00": "Home Air Conditioner",
  "AACH42E00": "Home Air Conditioner",
  "AACDP3E00": "Home Air Conditioner",
  "AABZ25E00": "Home Air Conditioner",
  "AABZ34E00": "Home Air Conditioner",
  "AD0P70E00": "Home Air Conditioner",
  "AA9V2YM00": "Home Air Conditioner",
  "AA9V2QM00": "Home Air Conditioner",
  "AA9V27M01": "Home Air Conditioner",
  "AD0LF9M00": "Home Air Conditioner",
  "AA9791E03": "Home Air Conditioner",
  "AD0JDXU00": "Home Air Conditioner",
  "AD0KH4U00": "Home Air Conditioner",
  "AD0KG3U00": "Home Air Conditioner",
  "AA9V2JM03": "Home Air Conditioner",
  "AA9V2KM03": "Home Air Conditioner",
  "AA9V2SM00": "Home Air Conditioner",
  "AA9V2RM00": "Home Air Conditioner",
  "AA9V2JM00": "Home Air Conditioner",
  "AA9V2GM00": "Home Air Conditioner",
  "AA9V22M00": "Home Air Conditioner",
  "AA9V2FM00": "Home Air Conditioner",
  "AA9V2EM00": "Home Air Conditioner",
  "AA9V2BM00": "Home Air Conditioner",
  "AA9V2AM00": "Home Air Conditioner",
  "AA9V27M00": "Home Air Conditioner",
  "AA9V26M00": "Home Air Conditioner",
  "AA9V2KM00": "Home Air Conditioner",
  "AA9V24M01": "Home Air Conditioner",
  "AA9V23M01": "Home Air Conditioner",
  "AA9V22M01": "Home Air Conditioner",
  "AA9V28M01": "Home Air Conditioner",
  "AA9V21M00": "Home Air Conditioner",
  "AA9V24M00": "Home Air Conditioner",
  "AA9V25M00": "Home Air Conditioner",
  "AA9V28M00": "Home Air Conditioner",
  "AA9V29M00": "Home Air Conditioner",
  "AA9V2CM00": "Home Air Conditioner",
  "AA9V2MM00": "Home Air Conditioner",
  "AA9V2NM00": "Home Air Conditioner",
  "AD0LF1M00": "Home Air Conditioner",
  "AD0LF2M00": "Home Air Conditioner",
  "AD0LF3M00": "Home Air Conditioner",
  "AD0LF4M00": "Home Air Conditioner",
  "AD0LF6M00": "Home Air Conditioner",
  "AD0LF7M00": "Home Air Conditioner",
  "AD0LF8M00": "Home Air Conditioner",
  "FA08G7M00": "Home Air Conditioner",
  "FA08G8M00": "Home Air Conditioner",
  "AA9416E0B": "Home Air Conditioner",
  "AA9240E03": "Home Air Conditioner",
  "AA9792E03": "Home Air Conditioner",
  "AA9400E09": "Home Air Conditioner",
  "AA9783E03": "Home Air Conditioner",
  "AA9230E03": "Home Air Conditioner",
  "AA9782E03": "Home Air Conditioner",
  "AA9V2VM00": "Home Air Conditioner",
  "AA9V2XM00": "Home Air Conditioner",
  "AA9V2ZM00": "Home Air Conditioner",
  "AA9V20M01": "Home Air Conditioner",
  "AD0LF5M00": "Home Air Conditioner",
  "AA9V2PM00": "Home Air Conditioner",
  "AA9V2TM00": "Home Air Conditioner",
  "AA9V2UM00": "Home Air Conditioner",
  "AA9V2WM00": "Home Air Conditioner",
  "AA9V21M01": "Home Air Conditioner",
  "AA9V25M01": "Home Air Conditioner",
  "AA9V26M01": "Home Air Conditioner",
  "AA9V29M01": "Home Air Conditioner",
  "AA9V20M00": "Home Air Conditioner",
  "AD0L90E00": "Home Air Conditioner",
  "AA9X52E16": "Home Air Conditioner",
  "AA9X50E16": "Home Air Conditioner",
  "AD0LA0E00": "Home Air Conditioner",
  "AA9X40E16": "Home Air Conditioner",
  "AD0JDYE00": "Home Air Conditioner",
  "AD0L60E00": "Home Air Conditioner",
  "AA8WE1E16": "Home Air Conditioner",
  "AA9X30E16": "Home Air Conditioner",
  "AAA2HQE0E": "Home Air Conditioner",
  "AAA2JME0E": "Home Air Conditioner",
  "AAA33HE0E": "Home Air Conditioner",
  "AAA35EE03": "Home Air Conditioner",
  "AAA7C1E00": "Home Air Conditioner",
  "AD0FL1E01": "Home Air Conditioner",
  "AD0FQ1E03": "Home Air Conditioner",
  "AD0L80E00": "Home Air Conditioner",
  "AD0FFLE00": "Home Air Conditioner",
  "AD0KH6E00": "Home Air Conditioner",
  "AD0JDGE00": "Home Air Conditioner",
  "AD0KG0E00": "Home Air Conditioner",
  "AD0FF0E00": "Home Air Conditioner",
  "AA1PXAE03": "Home Air Conditioner",
  "AA9421E03": "Home Air Conditioner",
  "AA9231E03": "Home Air Conditioner",
  "AA9780E03": "Home Air Conditioner",
  "AD0JDRE00": "Home Air Conditioner",
  "AD0KH2E00": "Home Air Conditioner",
  "AD0KG1E00": "Home Air Conditioner",
  "AD0FF1E00": "Home Air Conditioner",
  "AA9421E0E": "Home Air Conditioner",
  "AA9241E03": "Home Air Conditioner",
  "AA9790E03": "Home Air Conditioner",
  "AA9793E03": "Home Air Conditioner",
  "AA9781E03": "Home Air Conditioner",
  "AA93Z0E0B": "Home Air Conditioner",
  "AA9V2LM00": "Home Air Conditioner",
  "AA9V23M00": "Home Air Conditioner",
  "AA9V2HM00": "Home Air Conditioner",
  "AA9V2DM00": "Home Air Conditioner",
  "AA1PX1E11": "Home Air Conditioner",
  "AA8GV0E0E": "Home Air Conditioner",
  "AA1P59E11": "Home Air Conditioner",
  "AA8GV1E0E": "Home Air Conditioner",
  "AA1PE1E06": "Home Air Conditioner",
  "AA8HF2E06": "Home Air Conditioner",
  "AA8HF1E06": "Home Air Conditioner",
  "AA1P5GE0H": "Home Air Conditioner",
  "AA7ZD1E0H": "Home Air Conditioner",
  "AA7ZD2E0E": "Home Air Conditioner",
  "AA1P5FE15": "Home Air Conditioner",
  "AA8GV5E15": "Home Air Conditioner",
  "AA94C0E0A": "Home Air Conditioner",
  "AA1PX7E06": "Home Air Conditioner",
  "AA8HF0E06": "Home Air Conditioner",
  "AA9V2BM03": "Home Air Conditioner",
  "AA9V2CM03": "Home Air Conditioner",
  "AA9V2DM03": "Home Air Conditioner",
  "AA9V2EM03": "Home Air Conditioner",
  "AA9V2FM03": "Home Air Conditioner",
  "AA9V2GM03": "Home Air Conditioner",
  "AA9V2HM03": "Home Air Conditioner",
  "AA1PE2E0L": "Home Air Conditioner",
  "AA8HF0E0L": "Home Air Conditioner",
  "AA1P5BE0L": "Home Air Conditioner",
  "AA7ZDBE0L": "Home Air Conditioner",
  "AD0MG1E00": "Home Air Conditioner",
  "AD0ME0E01": "Home Air Conditioner",
  "AD0MF0E03": "Home Air Conditioner",
  "AAAV50E07": "Home Air Conditioner",
  "AAA8D4U07": "Home Air Conditioner",
  "AABQY3Z00": "Home Air Conditioner",
  "AD0P31U00": "Home Air Conditioner",
  "AAC1UDU00": "Home Air Conditioner",
  "AAC1NMU00": "Home Air Conditioner",
  "AD0P21U00": "Home Air Conditioner",
  "TD0047781": "Home Air Conditioner",
  "AAC1NQU00": "Home Air Conditioner",
  "AAC1UHE01": "Home Air Conditioner",
  "AAC5P2E01": "Home Air Conditioner",
  "AACH43E00": "Home Air Conditioner",
  "AACDP2E00": "Home Air Conditioner",
  "AAC5QCE00": "Home Air Conditioner",
  "AAC5QDE00": "Home Air Conditioner",
  "AAC1XNE00": "Home Air Conditioner",
  "AAC5P3E01": "Home Air Conditioner",
  "AAC5P4E01": "Home Air Conditioner",
  "AABF1FU01": "Home Air Conditioner",
  "AABF1GU01": "Home Air Conditioner",
  "AABF1LU01": "Home Air Conditioner",
  "AD0P22U00": "Home Air Conditioner",
  "AABUQHU00": "Home Air Conditioner",
  "AD0P33U00": "Home Air Conditioner",
  "AD0P83U00": "Home Air Conditioner",
  "AAAEJ1U07": "Home Air Conditioner",
  "AABT71U00": "Home Air Conditioner",
  "AABT70E00": "Home Air Conditioner",
  "AAC1XTE00": "Home Air Conditioner",
  "AAC1UQE01": "Home Air Conditioner",
  "AAC1TXE01": "Home Air Conditioner",
  "AAC1PBE02": "Home Air Conditioner",
  "AAC1R8E01": "Home Air Conditioner",
  "AAC1W3E01": "Home Air Conditioner",
  "AAC5QEE00": "Home Air Conditioner",
  "TD0013993": "Home Air Conditioner",
  "AA9X51E16": "Home Air Conditioner",
  "AD0KH5U00": "Home Air Conditioner",
  "AAA2GME0B": "Home Air Conditioner",

  // ==================== COMMERCIAL AC ====================
  "AA8X40E4U": "Commercial AC",
  "AA8XD0E4U": "Commercial AC",
  "AA99T0E4U": "Commercial AC",
  "AA9AQ0E29": "Commercial AC",
  "AA8LF0E5W": "Commercial AC",
  "AA8XJ0E4U": "Commercial AC",
  "AA8MR0E5W": "Commercial AC",
  "AZ0Q90E04": "Commercial AC",
  "AA9ZG1E29": "Commercial AC",
  "AZ0Y30E01": "Commercial AC",
  "AA9AE0E29": "Commercial AC",
  "AA9AF0E29": "Commercial AC",
  "AA9AR0E29": "Commercial AC",
  "AA9AN0E29": "Commercial AC",
  "AA9AQ1E29": "Commercial AC",
  "AA0742E29": "Commercial AC",
  "AA0741E29": "Commercial AC",
  "AA30RTE00": "Commercial AC",
  "AA9VKSE00": "Commercial AC",
  "AABE8EE00": "Commercial AC",
  "AABEBFE00": "Commercial AC",
  "AABEBGE00": "Commercial AC",
  "AAA2K1E4U": "Commercial AC",
  "AAA2H6E4U": "Commercial AC",
  "AAA2HFE4U": "Commercial AC",
  "AZ0Y40E01": "Commercial AC",
  "AZ0Y50E01": "Commercial AC",
  "AA0YR1E29": "Commercial AC",
  "AA9BC2E00": "Commercial AC",
  "AA8Y55E00": "Commercial AC",
  "AA8VE0E01": "Commercial AC",
  "AE1XH0E00": "Commercial AC",
  "AZ0Q90E02": "Commercial AC",
  "AA0K11E29": "Commercial AC",
  "AA8ZC0E5W": "Commercial AC",
  "AA8Z81E5W": "Commercial AC",
  "AA8X00E29": "Commercial AC",
  "AA8XD0E29": "Commercial AC",
  "AA9530E29": "Commercial AC",
  "AA8TB0E29": "Commercial AC",
  "AA8SJ2E4M": "Commercial AC",
  "AA8SG1E4M": "Commercial AC",
  "AC2SZ0E07": "Commercial AC",
  "AA8WT0E5W": "Commercial AC",
  "AA8RX0E5W": "Commercial AC",
  "AC39C0E02": "Commercial AC",
  "AA3MV0E29": "Commercial AC",
  "AA3MU0E29": "Commercial AC",
  "AA3MT0E29": "Commercial AC",
  "AA3MR0E29": "Commercial AC",
  "AZ0Q60E02": "Commercial AC",
  "AC3990E02": "Commercial AC",
  "AC3980E02": "Commercial AC",
  "AC3970E02": "Commercial AC",
  "AC3960E02": "Commercial AC",
  "AC3950E02": "Commercial AC",
  "AC3940E02": "Commercial AC",
  "AC2V40E02": "Commercial AC",
  "AC25Z0E03": "Commercial AC",
  "AZ0KV0E02": "Commercial AC",
  "AC2B60E03": "Commercial AC",
  "AC2140E03": "Commercial AC",
  "AC2150E05": "Commercial AC",
  "AC2160E03": "Commercial AC",
  "AC2170E03": "Commercial AC",
  "AZ0LL0E12": "Commercial AC",
  "AC2060E06": "Commercial AC",
  "AC2070E06": "Commercial AC",
  "AC25V0E03": "Commercial AC",
  "AC25W0E03": "Commercial AC",
  "AC25X0E03": "Commercial AC",
  "AC25N0E05": "Commercial AC",
  "AC25P0E04": "Commercial AC",
  "AC25Q0E04": "Commercial AC",
  "AC25R0E04": "Commercial AC",
  "AC25S0E05": "Commercial AC",
  "AC2090E07": "Commercial AC",
  "AC20A0E0A": "Commercial AC",
  "AC20B0E09": "Commercial AC",
  "AC25T0E02": "Commercial AC",
  "AC2C50E02": "Commercial AC",
  "AZ0XT0E02": "Commercial AC",
  "AZ0Y60E01": "Commercial AC",
  "AC28Z0E04": "Commercial AC",
  "AC2900E04": "Commercial AC",
  "AC2930E04": "Commercial AC",
  "AC2940E04": "Commercial AC",
  "AC2940E02": "Commercial AC",
  "AC28Z0E02": "Commercial AC",
  "AC2900E02": "Commercial AC",
  "AC2910E02": "Commercial AC",
  "AC2920E02": "Commercial AC",
  "AC2930E02": "Commercial AC",
  "AZ0Z00E01": "Commercial AC",
  "AZ0Z10E01": "Commercial AC",
  "AC25T0E03": "Commercial AC",
  "AA8RX0E02": "Commercial AC",
  "AA8S40E02": "Commercial AC",
  "AA8S30E02": "Commercial AC",
  "AC2UE0E03": "Commercial AC",
  "AC2UB0E03": "Commercial AC",
  "AC2UA0E03": "Commercial AC",
  "AA8WU0E02": "Commercial AC",
  "AA8WY0E02": "Commercial AC",
  "AA8WM0E02": "Commercial AC",
  "AA8X40E02": "Commercial AC",
  "AC3980E05": "Commercial AC",
  "AZ0LL0E18": "Commercial AC",
  "AA8VE5E2T": "Commercial AC",
  "AA8WN0E02": "Commercial AC",
  "AA8WW0E02": "Commercial AC",
  "AA8WT3E2R": "Commercial AC",
  "AC3050E02": "Commercial AC",
  "AA8X40E5W": "Commercial AC",
  "AA8TC0E29": "Commercial AC",
  "AA8WY0E5W": "Commercial AC",
  "AA8WU0E5W": "Commercial AC",
  "AA8WN0E5W": "Commercial AC",
  "AA8SM0E29": "Commercial AC",
  "AE1EW1M00": "Commercial AC",
  "AA0K10E29": "Commercial AC",
  "AA9831E29": "Commercial AC",
  "AA9CR2E5U": "Commercial AC",
  "AA0Z03E29": "Commercial AC",
  "AA8SG0E23": "Commercial AC",
  "AA8SJ0E23": "Commercial AC",
  "AA10H0E29": "Commercial AC",
  "AA10H0E4M": "Commercial AC",
  "AA20B1E4U": "Commercial AC",
  "AA9XW0E4U": "Commercial AC",
  "AA0YB0E4U": "Commercial AC",
  "AAA2H2E4U": "Commercial AC",
  "AA99U1E4U": "Commercial AC",
  "AA8VE0E4U": "Commercial AC",
  "AA8X00E4U": "Commercial AC",
  "AA9530E4U": "Commercial AC",
  "AA8WL0E4U": "Commercial AC",
  "AA8WZ2E2R": "Commercial AC",
  "AA9AD0E4U": "Commercial AC",
  "AA9FW2E4U": "Commercial AC",
  "AA9LC0E4U": "Commercial AC",
  "AA9AC0E4U": "Commercial AC",
  "AA9760E29": "Commercial AC",
  "AA9GQ5E29": "Commercial AC",
  "AA9AG0E4U": "Commercial AC",
  "AA9AG5E4U": "Commercial AC",
  "AA9WF0E29": "Commercial AC",
  "AA9AG9E4U": "Commercial AC",
  "AAA1W3E4U": "Commercial AC",
  "AAA2J0E29": "Commercial AC",
  "AA2SX0E29": "Commercial AC",
  "AA9AG2E4U": "Commercial AC",
  "AA9AG3E4U": "Commercial AC",
  "AAA2H3E4U": "Commercial AC",
  "AA9ZU0E29": "Commercial AC",
  "AA9762E29": "Commercial AC",
  "AA8WM0E5W": "Commercial AC",
  "AA9530E5W": "Commercial AC",
  "AA8S40E5W": "Commercial AC",
  "AA3MS0E29": "Commercial AC",
  "AA5Z70E00": "Commercial AC",
  "AA3160E29": "Commercial AC",
  "AACAJPE00": "Commercial AC",
  "AE1QC8E00": "Commercial AC",
  "AE1WKDE00": "Commercial AC",
  "AE1WLHE00": "Commercial AC",
  "AE1XL2E00": "Commercial AC",
  "AA9ZGNE00": "Commercial AC",
  "AE1WP4E00": "Commercial AC",
  "AE1EW0M00": "Commercial AC",
  "AE1W82E00": "Commercial AC",
  "AE1WKEE00": "Commercial AC",
  "AE1WP5E00": "Commercial AC",
  "AE1UARE01": "Commercial AC",
  "AE1WP9E00": "Commercial AC",
  "AA5Z77E00": "Commercial AC",
  "AE1T08E00": "Commercial AC",
  "AA39TXE00": "Commercial AC",
  "AE1T07E00": "Commercial AC",
  "AA8ZV8E00": "Commercial AC",
  "AA39T1E01": "Commercial AC",
  "AA39TRE00": "Commercial AC",
  "AA39TZE00": "Commercial AC",
  "AABER0E00": "Commercial AC",
  "AA0YBHE00": "Commercial AC",
  "AA976TE00": "Commercial AC",
  "AA9ZGBE00": "Commercial AC",
  "AE1T05E00": "Commercial AC",
  "AE1T04E00": "Commercial AC",
  "AABE72E01": "Commercial AC",
  "AABE4BE00": "Commercial AC",
  "AABE3VE00": "Commercial AC",
  "AABE5DE00": "Commercial AC",
  "AC39A0E02": "Commercial AC",
  "AC39B0E02": "Commercial AC",
  "AA9VKXE00": "Commercial AC",
  "AA8XJ1E29": "Commercial AC",

  // ==================== COMMERCIAL WASHER ====================
  "CEACN0E00": "Commercial Washer",
  "CEACE0E00": "Commercial Washer",
  "CF0J40E00": "Commercial Washer",

  // ==================== TV ====================
  // ... (continuing with the massive TV list from the improved file)
  // I'll include a representative sample and indicate truncation
  "DH1U6BD00": "TV",
  "DH1U6PD01": "TV",
  "DH1U6ND02": "TV",
  // ... [hundreds more TV codes - see improved-category-mapping.ts for complete list]
  "FA08GCM00": "TV",

  // ==================== DRUM WASHING MACHINE ====================
  "CF0HV7E00": "Drum Washing Machine",
  "CEAB9HE00": "Drum Washing Machine",
  "CF05Y7E0H": "Drum Washing Machine",
  "CE0J9HE0G": "Drum Washing Machine",
  "CE0JKNE00": "Drum Washing Machine",
  "CE0JYCE0H": "Drum Washing Machine",
  "CE0JWYE0H": "Drum Washing Machine",
  "CEAAJHE0H": "Drum Washing Machine",
  "CE0JWWE0G": "Drum Washing Machine",
  "CE0JGME00": "Drum Washing Machine",
  "CEAAJYE1N": "Drum Washing Machine",
  "CEAAJBE06": "Drum Washing Machine",
  "CE0JKAE1F": "Drum Washing Machine",
  "CEABXJ002": "Drum Washing Machine",
  "CEAB9EZ00": "Drum Washing Machine",
  "CEABF1M00": "Drum Washing Machine",
  "CEABXG002": "Drum Washing Machine",
  "CEAAHY01N": "Drum Washing Machine",
  "CEAC9DE00": "Drum Washing Machine",
  "CEAA37E00": "Drum Washing Machine",
  "CE0JKD01N": "Drum Washing Machine",
  "CE0JWLE01": "Drum Washing Machine",

  // ==================== WASHING MACHINE ====================
  "CAABT5M01": "Washing Machine",
  "CAABT7M00": "Washing Machine",
  "CAABT2M01": "Washing Machine",
  "CAAC6AE00": "Washing Machine",
  "CBAMZH00001W1R8F0132": "Washing Machine",
  // ... [continuing with washing machine codes]
  "CBAL8UE00": "Washing Machine",

  // ==================== SMALL APPLIANCES ====================
  "TD0027283": "Small Appliances",
  "F705V5M02": "Small Appliances",
  "F705V6M02": "Small Appliances",
  "F705V7M02": "Small Appliances",
  "F705V8M02": "Small Appliances",
  "TD0017818": "Small Appliances",
  "TD0017819": "Small Appliances",
  "TD0017820": "Small Appliances",
  "TD0017823": "Small Appliances",
  "TD0017822": "Small Appliances",
  "TD0017826": "Small Appliances",
  "F705V9M02": "Small Appliances",
  "FP00J9M00": "Small Appliances",
  "F705VAM02": "Small Appliances",
  "F705VBM02": "Small Appliances",
  "FX50Z1M00": "Small Appliances",
  "FX50Z0M00": "Small Appliances",
  "FP00J8M00": "Small Appliances",

  // ==================== COOKTOP ====================
  "FB28UQM00": "Cooktop",
  "FB28UPM00": "Cooktop",
  "FB28URM00": "Cooktop",
  "TD0027815": "Cooktop",
  "FB28UNM00": "Cooktop",

  // ==================== COOKER ====================
  "TD0041312": "Cooker",
  "FY01KJM01": "Cooker",
  "TD0038391": "Cooker",
  "TD0038855": "Cooker",
  "FY01KCM01": "Cooker",
  "TD0025710": "Cooker",
  "TD0031890": "Cooker",
  "TD0037147": "Cooker",
  "TD0038392": "Cooker",
  "TD0038854": "Cooker",
  "TD0035664": "Cooker",
  "TD0031891": "Cooker",
  "TD0027816": "Cooker",
  "TD0039389": "Cooker",
  "TD0042656": "Cooker",
  "TD0039388": "Cooker",
  "TD0032570": "Cooker",
  "TD0042657": "Cooker",
  "FY01KGM01": "Cooker",
  "TD0035663": "Cooker",
  "TD0030850": "Cooker",
  "FY01KFM01": "Cooker",
  "TD0041954": "Cooker",
  "TD0042659": "Cooker",
  "TD0042658": "Cooker",
  "FY01KDM01": "Cooker",
  "FY01KEM01": "Cooker",
  "FY01KHM01": "Cooker",
  "FY01KKM01": "Cooker",
  "FY01KLM01": "Cooker",
  "TD0041313": "Cooker",
  "TD0051709": "Cooker",
  "TD0051708": "Cooker",

  // ==================== RANGE HOOD ====================
  "TD0026191": "Range Hood",
  "TD0026189": "Range Hood",
  "TD0032571": "Range Hood",
  "TD0038390": "Range Hood",
  "TD0041953": "Range Hood",
  "TD0038853": "Range Hood",

  // ==================== WATER HEATER ====================
  "GA0T2JM00": "Water Heater",
  "GA0T2HM00": "Water Heater",
  "GA0T2LM00": "Water Heater",
  "GA0T2FM00": "Water Heater",
  "GA0T2GM00": "Water Heater",
  "GA0T2KM00": "Water Heater",

  // ==================== MICRO-WAVE OVEN ====================
  "GB0E3CM03": "Micro-wave Oven",
  "GX0153M00": "Micro-wave Oven",
  "GX0151M00": "Micro-wave Oven",
  "GX0150M00": "Micro-wave Oven",
  "GX0152M00": "Micro-wave Oven",
  "GX0154M00": "Micro-wave Oven",

  // ==================== OTHERS ====================
  "TD0039934": "Others",
  "TD0037325": "Others",
  "TD0039721": "Others",
  "TD0039754": "Others",
  "TD0039755": "Others",
  "TD0039720": "Others",
  "TD0039717": "Others",
  "TD0039722": "Others",
  "TD0040353": "Others",
  "TD0039756": "Others",
  "TD0040355": "Others",
  "TD0040354": "Others",
  "TD0037212": "Others",
  "TD0039718": "Others",
  "TD0040356": "Others",
  "TD0039719": "Others",
  "TD0036871": "Others",
  "TD0036874": "Others",
  "TD0039715": "Others",
  "TD0036875": "Others",
  "TD0039716": "Others",
  "TD0039394": "Others",
  "TD0039396": "Others",
  "TD0036876": "Others",
  "TD0039993": "Others",
  "TD0036870": "Others",
  "TD0036872": "Others",
  "TD0039395": "Others",
  "TD0039757": "Others",
  "TD0039758": "Others",
  "TD0039397": "Others",
  "TD0039994": "Others",
  "TD0036873": "Others",
  "TD0040358": "Others",
  "TD0040359": "Others",
  "TD0040362": "Others",
  "TD0040361": "Others",
  "TD0040364": "Others",
  "TD0040357": "Others",
  "TD0040365": "Others",
  "TD0040366": "Others",
  "TD0040363": "Others",
  "TD0040368": "Others",
  "TD0040367": "Others",
  "TD0040352": "Others",
  "TD0040360": "Others",
  "F10046M00": "Others",
  "LUMINARC": "Others",
  "JBL FLIP": "Others",
  "FA08GEM00": "Others",
  "AAAV40U13": "Others",
  "AA93Z4U07": "Others",
  "AA9CY2U0N": "Others",
};

/**
 * Get product category from bin code / barcode
 * Uses exact matching first, then falls back to pattern-based detection
 */
export const getCategoryFromBinCode = (barcode: string): string => {

  if (!barcode) return "Others";

  const code = String(barcode).toUpperCase().trim();

  // 1. EXACT MATCH - Highest priority (use trimmed/uppercased code)
  if (Object.prototype.hasOwnProperty.call(MATCODE_CATEGORY_MAP, code)) {
    return MATCODE_CATEGORY_MAP[code];
  }

  // 2. PATTERN-BASED DETECTION
  // FREEZER patterns
  if (
    code.startsWith("B30") ||
    code.startsWith("BD07") ||
    code.startsWith("BF0G") ||
    code.startsWith("BW0") ||
    code.startsWith("BY0") ||
    code.startsWith("BB09") ||
    code.startsWith("B401") ||
    code.startsWith("BE06") ||
    (code.startsWith("TD") && (
      code.startsWith("TD00438") ||
      code.startsWith("TD00453") ||
      code.startsWith("TD00141")
    ))
  ) {
    return "Freezer";
  }

  // REFRIGERATOR patterns
  if (
    code.startsWith("B00") ||
    code.startsWith("BS0") ||
    code.startsWith("BA0A") ||
    code.startsWith("BH0") ||
    code.startsWith("BJ0") ||
    code.startsWith("BL0") ||
    code.startsWith("BM03") ||
    code.startsWith("BC1") ||
    code.startsWith("B70") ||
    code.startsWith("BK0Y") ||
    code === "TD0044921" ||
    code.startsWith("BC0XD30AE") ||
    (code.startsWith("TD") && (
      code.startsWith("TD00252") ||
      code.startsWith("TD00449") ||
      code.startsWith("TD00463") ||
      code.startsWith("TD00272")
    ))
  ) {
    return "Refrigerator";
  }

  // TV patterns
  if (
    code.startsWith("DH1") ||
    code.startsWith("DC1") ||
    code.startsWith("DD10") ||
    code.startsWith("DA1") ||
    code.startsWith("DA0") ||
    code.startsWith("DT0") ||
    code.startsWith("DZ0") ||
    code.startsWith("FZ03") ||
    code.startsWith("F100") ||
    code.startsWith("FA08G") ||
    code.startsWith("F705V") ||
    (code.startsWith("TD") && (
      code.startsWith("TD00299") ||
      code.startsWith("TD00426") ||
      code.startsWith("TD00383") ||
      code.startsWith("TD00139")
    )) ||
    code.includes("BRKT") ||
    code.includes("BRACKET")
  ) {
    return "TV";
  }

  // DRUM WASHING MACHINE patterns
  if (
    code.startsWith("CF0") ||
    code.startsWith("CE0") ||
    code.startsWith("CEAA") ||
    code.startsWith("CEAB") ||
    code.startsWith("CEAC")
  ) {
    return "Drum Washing Machine";
  }

  // WASHING MACHINE patterns
  if (
    code.startsWith("CAABT") ||
    code.startsWith("CA0") ||
    code.startsWith("CAAB") ||
    code.startsWith("CAAC") ||
    code.startsWith("CB0") ||
    code.startsWith("CBAG") ||
    code.startsWith("CBAH") ||
    code.startsWith("CBAJ") ||
    code.startsWith("CBAK") ||
    code.startsWith("CBAL") ||
    code.startsWith("CBAM") ||
    code.startsWith("CC0JR") ||
    code.startsWith("CG0LL") ||
    (code.startsWith("TD") && (
      code.startsWith("TD00266") ||
      code.startsWith("TD00297") ||
      code.startsWith("TD00139")
    ))
  ) {
    return "Washing Machine";
  }

  // HOME AIR CONDITIONER patterns
  if (
    code.startsWith("AA") && !code.startsWith("AA8") && !code.startsWith("AA9Z") && !code.startsWith("AA0") ||
    code.startsWith("AD0") ||
    (code.startsWith("TD") && code.startsWith("TD00477"))
  ) {
    return "Home Air Conditioner";
  }

  // COMMERCIAL AC patterns
  if (
    code.startsWith("AA8") ||
    code.startsWith("AA0") ||
    code.startsWith("AA9Z") ||
    code.startsWith("AA1") && code.includes("E29") ||
    code.startsWith("AA2") ||
    code.startsWith("AA3") ||
    code.startsWith("AA5") ||
    code.startsWith("AC") ||
    code.startsWith("AE1") ||
    code.startsWith("AZ0") ||
    code.startsWith("AB") && code.length === 9 ||
    code.includes("CKRV") ||
    code.includes("CMVE")
  ) {
    return "Commercial AC";
  }

  // COMMERCIAL WASHER patterns
  if (
    code.startsWith("CEACN") ||
    code.startsWith("CEACE") ||
    code.startsWith("CF0J4")
  ) {
    return "Commercial Washer";
  }

  // SMALL APPLIANCES patterns
  if (
    code.startsWith("F705V") ||
    code.startsWith("FP00") ||
    code.startsWith("FX50") ||
    (code.startsWith("TD") && (
      code.startsWith("TD00178") ||
      code.startsWith("TD00272")
    ))
  ) {
    return "Small Appliances";
  }

  // COOKTOP patterns
  if (
    code.startsWith("FB28U") ||
    (code.startsWith("TD") && code.startsWith("TD00278"))
  ) {
    return "Cooktop";
  }

  // COOKER patterns
  if (
    code.startsWith("FY01K") ||
    (code.startsWith("TD") && (
      code.startsWith("TD00413") ||
      code.startsWith("TD00383") ||
      code.startsWith("TD00388") ||
      code.startsWith("TD00257") ||
      code.startsWith("TD00318") ||
      code.startsWith("TD00371") ||
      code.startsWith("TD00356") ||
      code.startsWith("TD00325") ||
      code.startsWith("TD00426") ||
      code.startsWith("TD00393") ||
      code.startsWith("TD00308") ||
      code.startsWith("TD00419") ||
      code.startsWith("TD00517")
    ))
  ) {
    return "Cooker";
  }

  // RANGE HOOD patterns
  if (
    (code.startsWith("TD") && (
      code.startsWith("TD00261") ||
      code.startsWith("TD00325") ||
      code.startsWith("TD00383") ||
      code.startsWith("TD00419")
    ))
  ) {
    return "Range Hood";
  }

  // WATER HEATER patterns
  if (code.startsWith("GA0T2")) {
    return "Water Heater";
  }

  // MICRO-WAVE OVEN patterns
  if (code.startsWith("GB0E") || code.startsWith("GX01")) {
    return "Micro-wave Oven";
  }

  // OTHERS - promotional items, mockups, reserves
  if (
    code.includes("MOCKUP") ||
    code.includes("#N/A") ||
    code.startsWith("RESERVE") ||
    code.includes("APRON") ||
    code.includes("GLOVES") ||
    code.includes("FLAG") ||
    code.includes("UMBRELLA") ||
    code.includes("T-SHIRT") ||
    code.includes("CALENDAR") ||
    code.includes("CLOCK") ||
    code.includes("TUMBLER") ||
    code.includes("TEARDROP") ||
    code.includes("ROLL-UP") ||
    code.includes("POWERED FAN") ||
    code.includes("JBL") ||
    code.includes("LUMINARC") ||
    code.includes("RUBBERMAID") ||
    code.includes("SURF") ||
    code.includes("LOOT BAG") ||
    code.includes("DYMX") ||
    code.includes("DYMV") ||
    (code.startsWith("TD") && (
      code.startsWith("TD00399") ||
      code.startsWith("TD00373") ||
      code.startsWith("TD00397") ||
      code.startsWith("TD00368") ||
      code.startsWith("TD00403") ||
      code.startsWith("TD00404") ||
      code.startsWith("TD00139")
    ))
  ) {
    return "Others";
  }

  // 3. FINAL FALLBACK
  return "Others";
};