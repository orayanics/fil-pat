/**
 * Script to seed comprehensive Filipino Phonological Assessment Templates
 * This creates templates for a specific clinician (defaults to currently logged in)
 * 
 * Usage:
 *   npx tsx scripts/seedTemplates.ts [clinician_id]
 *   npx tsx scripts/seedTemplates.ts 1
 * 
 * If no clinician_id provided, it will use the first available admin or clinician
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Complete 77-item Filipino Phonological Assessment Data (Fil-PAT)
// Note: Some words repeat but target different consonant groups based on sound position
const completeAssessmentItems = [
  // Group: m
  { item_number: 1, question: "Ito ang ginagamit natin para makakita", sound: "SIWI /m/", ipa_key: "/ma.ta/", consonant_group: "m", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 1 n 27.jpg", expected_response: "mata", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 2, question: "Ano ginagawa ng bata?", sound: "SFWF /m/", ipa_key: "/ʔi.nɔm/", consonant_group: "m", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 2.jpg", expected_response: "inom", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 3, question: "Ginagamit natin ito panghawak", sound: "SIWW /m/", ipa_key: "/ka.maj/", consonant_group: "m", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 3 n 33.jpg", expected_response: "kamay", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 4, question: "Ito ay isang insekto na may walong paa at gumagawa ng web", sound: "SFWW /m/", ipa_key: "/ga.gam.ba/", consonant_group: "m", consonants_count: 4, vowels_count: 3, image_url: "/filpat-pictureplates/Item 4.jpg", expected_response: "gagamba", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: b
  { item_number: 5, question: "Ito ay bilog na tumatalbog", sound: "SIWI /b/", ipa_key: "/bɔ.la/", consonant_group: "b", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 5.jpg", expected_response: "bola", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 6, question: "Ito ang ginagamit sa katawan pangligo", sound: "SIWW /b/ SIWI /s/", ipa_key: "/sa.bɔn/", consonant_group: "b", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 6 n 48.jpg", expected_response: "sabon", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 7, question: "Anong parte ng katawan ito?", sound: "SFWW & SFWF /b/", ipa_key: "/dib.dib/", consonant_group: "b", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 7.jpg", expected_response: "dibdib", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: p
  { item_number: 8, question: "Ito ay nagsasabi ng \"meow\"", sound: "SIWI /p/", ipa_key: "/pu.saʔ/", consonant_group: "p", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 8.jpg", expected_response: "pusa", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 9, question: "Ito ay makikita sa langit na kulay white", sound: "SFWF /p/", ipa_key: "/ʔu.lap/", consonant_group: "p", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 9.jpg", expected_response: "ulap", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 10, question: "Ito ay ginagamit pang drawing", sound: "SIWI /l/ SIWW /p/", ipa_key: "/la.pis/", consonant_group: "p", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 10.jpg", expected_response: "lapis", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 11, question: "Ito ay maliit na cake na may icing sa ibabaw", sound: "SFWW /p/", ipa_key: "/kʌp.kɛɪk/", consonant_group: "p", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 11.jpg", expected_response: "cupcake", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: n
  { item_number: 12, question: "Ito ang tatay. Ito ay ang _____", sound: "SIWI /n/", ipa_key: "/na.naj/", consonant_group: "n", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 12.jpg", expected_response: "nanay", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 13, question: "Ito ang kinakain natin kasama ng ulam", sound: "SFWF /n/", ipa_key: "/ka.nin/", consonant_group: "n", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 13.jpg", expected_response: "kanin", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 14, question: "Ito ay matangkad at matigas na halaman", sound: "SIWW /n/", ipa_key: "/pu.nɔʔ/", consonant_group: "n", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 14.jpg", expected_response: "puno", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 15, question: "Ito ay noodles na may sahog tulad ng karne at gulay", sound: "SFWW /n/", ipa_key: "/pan.sit/", consonant_group: "n", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 15.jpg", expected_response: "pancit", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: d
  { item_number: 16, question: "Ito ay ang tawag sa taong gumagamot sayo tuwing may sakit ka", sound: "SIWI /d/ & SFWF /r/", ipa_key: "/dɔk.tɔr/", consonant_group: "d", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 16 n 53.jpg", expected_response: "doktor", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 17, question: "Parte ng katawan na nakasandal sa upuan", sound: "SFWF /d/ & SIWW /k/", ipa_key: "/lɪ.kɔd/", consonant_group: "d", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 17 n 35.jpg", expected_response: "likod", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 18, question: "Ito ay isang uri ng hayop na naninirahan sa dagat", sound: "SIWW /d/", ipa_key: "/is.daʔ/", consonant_group: "d", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 18.jpg", expected_response: "isda", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: w
  { item_number: 19, question: "Ginagamit sa panglinis", sound: "SIWI /w/", ipa_key: "/wa.lis/", consonant_group: "w", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 19.jpg", expected_response: "walis", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 20, question: "Kapag mainit, tumutulo ang ___?", sound: "SIWW /w/", ipa_key: "/pa.wɪs/", consonant_group: "w", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 20.jpg", expected_response: "pawis", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: j
  { item_number: 21, question: "Pwede rito manood ng mga videos", sound: "SIWI /j/", ipa_key: "/ju.tub/", consonant_group: "j", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 21.jpg", expected_response: "youtube", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 22, question: "Pinampupunas ito pagkatapos maligo", sound: "SIWW /j/", ipa_key: "/tu.wal.ja/", consonant_group: "j", consonants_count: 4, vowels_count: 3, image_url: "/filpat-pictureplates/Item 22.jpg", expected_response: "tuwalya", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: h
  { item_number: 23, question: "Kadalasang kinakain sa almusal", sound: "SIWI /h/", ipa_key: "/hat.dɔg/", consonant_group: "h", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 23.jpg", expected_response: "hotdog", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 24, question: "Sinusuklay ito", sound: "SIWW /h/", ipa_key: "/bu.hɔk/", consonant_group: "h", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 24.jpg", expected_response: "buhok", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: t
  { item_number: 25, question: "Ito ay parte ng katawan na ginagamit pangkinig", sound: "SIWI /t/ & SIWW /ŋ/", ipa_key: "/tɛ.ŋa/", consonant_group: "t", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 25 n 31.jpg", expected_response: "tenga", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 26, question: "Sinusuot ito kapag sasakay ng motor o bicycle", sound: "SFWF /t/", ipa_key: "/hɛl.mɛt/", consonant_group: "t", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 26.jpg", expected_response: "helmet", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 27, question: "Ito ang ginagamit natin para makakita", sound: "SFWW /t/", ipa_key: "/ma.ta/", consonant_group: "t", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 1 n 27.jpg", expected_response: "mata", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 28, question: "Ito ay galing sa manok", sound: "SFWW /t/", ipa_key: "/ʔit.lɔg/", consonant_group: "t", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 28.jpg", expected_response: "itlog", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: ŋ
  { item_number: 29, question: "Kinukuskos ito gamit ang toothbrush", sound: "SIWI /ŋ/", ipa_key: "/ŋi.pin/", consonant_group: "ŋ", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 29.jpg", expected_response: "ngipin", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 30, question: "Ito ay isang prutas", sound: "SFWF /ŋ/", ipa_key: "/sa.giŋ/", consonant_group: "ŋ", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 30.jpg", expected_response: "saging", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 31, question: "Ito ay parte ng katawan na ginagamit pangkinig", sound: "SFWF /ŋ/", ipa_key: "/tɛ.ŋa/", consonant_group: "ŋ", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 25 n 31.jpg", expected_response: "tenga", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 32, question: "Paborito nilang pagkain ay saging", sound: "SFWF /ŋ/", ipa_key: "/ʔuŋ.gɔj/", consonant_group: "ŋ", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 32.jpg", expected_response: "unggoy", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: k
  { item_number: 33, question: "Ginagamit natin ito panghawak", sound: "SIWI /k/", ipa_key: "/ka.maj/", consonant_group: "k", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 3 n 33.jpg", expected_response: "kamay", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 34, question: "Ito ay nilalagyan ng kandila tuwing may kaarawan", sound: "SFWF /k/", ipa_key: "/keɪk/", consonant_group: "k", consonants_count: 2, vowels_count: 1, image_url: "/filpat-pictureplates/Item 34.jpg", expected_response: "cake", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 35, question: "Parte ng katawan na nakasandal sa upuan", sound: "SIWW /k/", ipa_key: "/li.kɔd/", consonant_group: "k", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 17 n 35.jpg", expected_response: "likod", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 36, question: "Ito ay mabango at may iba't ibang kulay", sound: "SFWW /k/", ipa_key: "/bu.lak.lak/", consonant_group: "k", consonants_count: 5, vowels_count: 3, image_url: "/filpat-pictureplates/Item 36.jpg", expected_response: "bulaklak", difficulty_level: "Hard", max_score: 1.0 },
  
  // Group: g
  { item_number: 37, question: "Ito ay kulay puti at karaniwang kinukuha galing sa mga baka", sound: "SIWI /g/", ipa_key: "/ga.tas/", consonant_group: "g", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 37.jpg", expected_response: "gatas", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 38, question: "Ito ay nilalagyan ng iba't ibang mga gamit", sound: "SFWF /g/", ipa_key: "/bag/", consonant_group: "g", consonants_count: 2, vowels_count: 1, image_url: "/filpat-pictureplates/Item 38.jpg", expected_response: "bag", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 39, question: "Hinihabol ito ng pusa", sound: "SIWW /g/", ipa_key: "/da.gaʔ/", consonant_group: "g", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 39.jpg", expected_response: "daga", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 40, question: "Ito ay ginagamit upang pumunta pataas o pababa sa bahay", sound: "SFWW /g/", ipa_key: "/hag.dan/", consonant_group: "g", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 40.jpg", expected_response: "hagdan", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: ʔ (Glottal Stop)
  { item_number: 41, question: "Binubuksan ito para lumiwanag ang kwarto", sound: "SIWI /ʔ/", ipa_key: "/ʔi.law/", consonant_group: "ʔ", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 41.jpg", expected_response: "ilaw", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 42, question: "Hindi siya matanda. Siya ay ___", sound: "SFWF /ʔ/", ipa_key: "/ba.taʔ/", consonant_group: "ʔ", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 42.jpg", expected_response: "bata", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 43, question: "Ito ang sinusuotan natin ng sapatos", sound: "SIWW /ʔ/", ipa_key: "/pa.ʔa/", consonant_group: "ʔ", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 43.jpg", expected_response: "paa", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: l
  { item_number: 44, question: "Ito ay ginagamit pang drawing", sound: "SIWI /l/", ipa_key: "/la.pis/", consonant_group: "l", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 10.jpg", expected_response: "lapis", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 45, question: "Sinusulatan mo ito", sound: "SFWF /l/", ipa_key: "/pa.pɛl/", consonant_group: "l", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 45.jpg", expected_response: "papel", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 46, question: "Ginagamit mo ito pang-amoy", sound: "SIWW /l/", ipa_key: "/ʔɪ.lɔŋ/", consonant_group: "l", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 46.jpg", expected_response: "ilong", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 47, question: "Saan nakalagay ang bulaklak?", sound: "SFWW /l/", ipa_key: "/bul.sa/", consonant_group: "l", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 47.jpg", expected_response: "bulsa", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: s
  { item_number: 48, question: "Ito ang ginagamit sa katawan pangligo", sound: "SIWI /s/", ipa_key: "/sa.bɔn/", consonant_group: "s", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 6 n 48.jpg", expected_response: "sabon", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 49, question: "Malaking sasakyan", sound: "SFWF /s/", ipa_key: "/bus/", consonant_group: "s", consonants_count: 2, vowels_count: 1, image_url: "/filpat-pictureplates/Item 49.jpg", expected_response: "bus", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 50, question: "Tumatahol at nangangagat ito", sound: "SIWW /s/", ipa_key: "/Ɂa.sɔ/", consonant_group: "s", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 50.jpg", expected_response: "aso", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 51, question: "Kadalasang nilalagyan ng mga pinamili", sound: "SFWW /s/", ipa_key: "/bas.kɛt/", consonant_group: "s", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 51.jpg", expected_response: "basket", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: r
  { item_number: 52, question: "Pwede sila magsalita at gumalaw na parang tao", sound: "SIWI /r/", ipa_key: "/rɔ.bɔt/", consonant_group: "r", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 52.jpg", expected_response: "robot", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 53, question: "Ito ay ang tawag sa taong gumagamot sayo tuwing may sakit ka", sound: "SFWF /r/", ipa_key: "/dɔk.tɔr/", consonant_group: "r", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 16 n 53.jpg", expected_response: "doktor", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 54, question: "Ginagamit ito pambayad", sound: "SIWW /r/", ipa_key: "/pɛ.ra/", consonant_group: "r", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 54.jpg", expected_response: "pera", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 55, question: "Dito tayo natutulog at nagpapahinga", sound: "SFWW /r/", ipa_key: "/kwar.tɔ/", consonant_group: "r", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 55.jpg", expected_response: "kwarto", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: ʃ
  { item_number: 56, question: "Ginagamit ito pang-linis ng buhok", sound: "SIWI /ʃ/", ipa_key: "/ʃam.pu/", consonant_group: "ʃ", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 56.jpg", expected_response: "shampoo", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 57, question: "Ginagamit ito pang-linis ng ngipin", sound: "SFWF /ʃ/", ipa_key: "/tut.brʌʃ/", consonant_group: "ʃ", consonants_count: 5, vowels_count: 2, image_url: "/filpat-pictureplates/Item 57.jpg", expected_response: "toothbrush", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 58, question: "Ito ay ginagamit bilang pamunas sa puwet", sound: "SIWW /ʃ/", ipa_key: "/ti.ʃu/", consonant_group: "ʃ", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 58.jpg", expected_response: "tissue", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 59, question: "Ginagamit ito tuwing brownout", sound: "SFWW /ʃ/", ipa_key: "/flaʃ.laɪt/", consonant_group: "ʃ", consonants_count: 5, vowels_count: 2, image_url: "/filpat-pictureplates/Item 59.jpg", expected_response: "flashlight", difficulty_level: "Hard", max_score: 1.0 },
  
  // Group: tʃ
  { item_number: 60, question: "Sinusuot sa paa", sound: "SIWI /tʃ/", ipa_key: "/tʃɪ.nɛ.las/", consonant_group: "tʃ", consonants_count: 4, vowels_count: 3, image_url: "/filpat-pictureplates/Item 60.jpg", expected_response: "tsinelas", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 61, question: "Isang lugar na may tubig at buhangin", sound: "SFWF /tʃ/", ipa_key: "/bitʃ/", consonant_group: "tʃ", consonants_count: 2, vowels_count: 1, image_url: "/filpat-pictureplates/Item 61.jpg", expected_response: "beach", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 62, question: "Kapares nito ang tinidor", sound: "SIWW /tʃ/", ipa_key: "/ku.tʃa.ra/", consonant_group: "tʃ", consonants_count: 3, vowels_count: 3, image_url: "/filpat-pictureplates/Item 62.jpg", expected_response: "kutsara", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: dʒ
  { item_number: 63, question: "Sikat ito sa kanilang Chicken Joy", sound: "SIWI /dʒ/", ipa_key: "/dʒa.lɪ.bi/", consonant_group: "dʒ", consonants_count: 3, vowels_count: 3, image_url: "/filpat-pictureplates/Item 63.jpg", expected_response: "jollibee", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 64, question: "Sinusuot sa paa", sound: "SIWW /dʒ/", ipa_key: "/mɛ.dʒas/", consonant_group: "dʒ", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 64.jpg", expected_response: "medyas", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: f
  { item_number: 65, question: "Ginagamit natin ito kapag mainit", sound: "SIWI /f/", ipa_key: "/fan/", consonant_group: "f", consonants_count: 2, vowels_count: 1, image_url: "/filpat-pictureplates/Item 65.jpg", expected_response: "fan", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 66, question: "May mahabang leeg", sound: "SFWF /f/", ipa_key: "/dʒi.raf/", consonant_group: "f", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 66.jpg", expected_response: "giraffe", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 67, question: "Uri ng isda na nagsasayaw", sound: "SIWW /f/", ipa_key: "/dɔl.fɪn/", consonant_group: "f", consonants_count: 4, vowels_count: 2, image_url: "/filpat-pictureplates/Item 67.jpg", expected_response: "dolphin", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: v
  { item_number: 68, question: "Anong kulay ito?", sound: "SIWI /v/", ipa_key: "/va.jɔ.lɛt/", consonant_group: "v", consonants_count: 4, vowels_count: 3, image_url: "/filpat-pictureplates/Item 68.jpg", expected_response: "violet", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 69, question: "Anong numero ito?", sound: "SIWF /v/", ipa_key: "/faɪv/", consonant_group: "v", consonants_count: 2, vowels_count: 1, image_url: "/filpat-pictureplates/Item 69.jpg", expected_response: "five", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 70, question: "Anong hugis ito?", sound: "SIWW /v/", ipa_key: "/ow.val/", consonant_group: "v", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 70.jpg", expected_response: "oval", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: z
  { item_number: 71, question: "Hayop na may kulay puti at itim na guhit sa katawan", sound: "SIWI /z/", ipa_key: "/zi.bra/", consonant_group: "z", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 71.jpg", expected_response: "zebra", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 72, question: "Laruan na kailangan buuin", sound: "SIWW /z/", ipa_key: "/pa.zɛl/", consonant_group: "z", consonants_count: 3, vowels_count: 2, image_url: "/filpat-pictureplates/Item 72.jpg", expected_response: "puzzle", difficulty_level: "Easy", max_score: 1.0 },
  
  // Diphthongs
  { item_number: 73, question: "Tinitirhan ito ng tao", sound: "/aj/", ipa_key: "/ba.haj/", consonant_group: "aj", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 73.jpg", expected_response: "bahay", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 74, question: "Tawag sa isang indibidwal kapag pinanganak", sound: "/ej/", ipa_key: "/bej.bi/", consonant_group: "ej", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 74.jpg", expected_response: "beybi", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 75, question: "Ito ay nagsasabi ng oink oink", sound: "/ɔj/", ipa_key: "/ba.bɔj/", consonant_group: "ɔj", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 75.jpg", expected_response: "baboy", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 76, question: "Ito ay hinihigop natin", sound: "SFWF /aw/", ipa_key: "/sa.baw/", consonant_group: "aw", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 76.jpg", expected_response: "sabaw", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 77, question: "Sanggol ng manok", sound: "/iw/", ipa_key: "/si.siw/", consonant_group: "iw", consonants_count: 2, vowels_count: 2, image_url: "/filpat-pictureplates/Item 77.jpg", expected_response: "sisiw", difficulty_level: "Easy", max_score: 1.0 }
];

async function main() {
  const args = process.argv.slice(2);
  const clinicianId = args[0] ? parseInt(args[0]) : null;

  console.log('🌱 Seeding Assessment Templates');
  console.log('═══════════════════════════════════════════════════════');

  let targetClinician;

  if (clinicianId) {
    // Use specified clinician ID
    targetClinician = await prisma.clinician.findUnique({
      where: { clinician_id: clinicianId },
    });

    if (!targetClinician) {
      console.error(`❌ Clinician with ID ${clinicianId} not found!`);
      process.exit(1);
    }
  } else {
    // Find first available admin or clinician
    targetClinician = await prisma.clinician.findFirst({
      where: {
        OR: [
          { is_admin: true },
          { is_admin: false }
        ]
      },
      orderBy: { clinician_id: 'asc' }
    });

    if (!targetClinician) {
      console.error('❌ No clinicians found in database!');
      console.log('💡 Please run database seed first: npm run db:seed');
      process.exit(1);
    }
  }

  console.log(`👤 Creating templates for: ${targetClinician.first_name} ${targetClinician.last_name}`);
  console.log(`   Username: ${targetClinician.username}`);
  console.log(`   Clinician ID: ${targetClinician.clinician_id}`);
  console.log('');

  // Create Standard Template (77 items)
  console.log('📚 Creating Standard Filipino Phoneme Assessment Template...');
  const standardTemplate = await prisma.assessmentTemplate.create({
    data: {
      name: 'Complete Filipino Phonological Assessment (77 Items)',
      description: 'Comprehensive assessment covering all Filipino phonemes: 21 consonants, 5 vowels, and 5 diphthongs. Standardized for clinical use.',
      is_default: true,
      is_for_kids: false,
      created_by: targetClinician.clinician_id,
    }
  });

  console.log(`✅ Created template: ${standardTemplate.name}`);
  console.log(`   Template ID: ${standardTemplate.template_id}`);

  // Insert all 77 items
  console.log('   Adding 77 assessment items...');
  for (const item of completeAssessmentItems) {
    await prisma.sessionItem.create({
      data: {
        ...item,
        template_id: standardTemplate.template_id,
        display_order: item.item_number,
      }
    });
  }
  console.log('   ✅ Added all 77 items');

  // Create Kids Template (same 77 items but marked for kids)
  console.log('');
  console.log('🎮 Creating Kids-Friendly Assessment Template...');
  const kidsTemplate = await prisma.assessmentTemplate.create({
    data: {
      name: 'Filipino Phonological Assessment - Kids Mode (77 Items)',
      description: 'Complete phonological assessment with child-friendly interface and engaging visual themes. Same comprehensive coverage as standard template.',
      is_default: false,
      is_for_kids: true,
      created_by: targetClinician.clinician_id,
    }
  });

  console.log(`✅ Created template: ${kidsTemplate.name}`);
  console.log(`   Template ID: ${kidsTemplate.template_id}`);

  // Insert all 77 items for kids template
  console.log('   Adding 77 assessment items...');
  for (const item of completeAssessmentItems) {
    await prisma.sessionItem.create({
      data: {
        ...item,
        template_id: kidsTemplate.template_id,
        display_order: item.item_number,
      }
    });
  }
  console.log('   ✅ Added all 77 items');

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 Template Seeding Complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   • Standard Template: ID ${standardTemplate.template_id} (77 items)`);
  console.log(`   • Kids Template: ID ${kidsTemplate.template_id} (77 items)`);
  console.log(`   • Owner: ${targetClinician.first_name} ${targetClinician.last_name}`);
  console.log(`   • Total Items Created: 154 items`);
  console.log('═══════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
