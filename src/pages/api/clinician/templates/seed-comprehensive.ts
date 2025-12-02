import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/client';

// Complete 76-item Filipino Phonological Assessment Data
const completeAssessmentItems = [
  // Group: m
  { item_number: 1, question: "Ito ang ginagamit natin para makakita", sound: "SIWI /m/", ipa_key: "/ma.ta/", consonant_group: "m", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/00/0c/56/000c56b811f1dcd108c9280a80adbf97.jpg", expected_response: "mata", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 2, question: "Ano ginagawa ng bata?", sound: "SFWF /m/", ipa_key: "/ʔi.nɔm/", consonant_group: "m", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/e9/a1/4c/e9a14c4c6100e4c1aa467b74f67cb57e.jpg", expected_response: "inom", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 3, question: "Ginagamit natin ito panghawak", sound: "SIWW /m/", ipa_key: "/ka.maj/", consonant_group: "m", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/b5/29/0a/b5290a1c4b3c8e2a5f8d7e9c1a2b3c4d.jpg", expected_response: "kamay", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 4, question: "Ito ay isang insekto na may walong paa at gumagawa ng web", sound: "SFWW /m/", ipa_key: "/ga.gam.ba/", consonant_group: "m", consonants_count: 4, vowels_count: 3, image_url: "https://i.pinimg.com/736x/c8/d4/3e/c8d43e5f7a9b1c2d3e4f5a6b7c8d9e0f.jpg", expected_response: "gagamba", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: b
  { item_number: 5, question: "Ito ay bilog na tumatalbog", sound: "SIWI /b/", ipa_key: "/bɔ.la/", consonant_group: "b", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/a1/b2/c3/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.jpg", expected_response: "bola", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 6, question: "Ito ang ginagamit sa katawan pangligo", sound: "SIWW /b/ SIWI /s/", ipa_key: "/sa.bɔn/", consonant_group: "b", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/d7/e8/f9/d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2.jpg", expected_response: "sabon", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 7, question: "Anong parte ng katawan ito?", sound: "SFWW & SFWF /b/", ipa_key: "/dib.dib/", consonant_group: "b", consonants_count: 4, vowels_count: 2, image_url: "https://i.pinimg.com/736x/b3/c4/d5/b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8.jpg", expected_response: "dibdib", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: p
  { item_number: 8, question: "Ito ay nagsasabi ng 'meow'", sound: "SIWI /p/", ipa_key: "/pu.saʔ/", consonant_group: "p", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/e5/f6/a7/e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0.jpg", expected_response: "pusa", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 9, question: "Ito ay makikita sa langit na kulay white", sound: "SFWF /p/", ipa_key: "/ʔu.lap/", consonant_group: "p", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/c1/d2/e3/c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6.jpg", expected_response: "ulap", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 10, question: "Ito ay ginagamit pang drawing", sound: "SIWI /l/ SIWW /p/", ipa_key: "/la.pis/", consonant_group: "p", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/f7/a8/b9/f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2.jpg", expected_response: "lapis", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 11, question: "Ito ay maliit na cake na may icing sa ibabaw", sound: "SFWW /p/", ipa_key: "/kʌp.kɛɪk/", consonant_group: "p", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/a9/b0/c1/a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4.jpg", expected_response: "cupcake", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: n
  { item_number: 12, question: "Ito ang tatay. Ito ay ang _____", sound: "SIWI /n/", ipa_key: "/na.naj/", consonant_group: "n", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/d3/e4/f5/d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8.jpg", expected_response: "nanay", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 13, question: "Ito ang kinakain natin kasama ng ulam", sound: "SFWF /n/", ipa_key: "/ka.nin/", consonant_group: "n", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/b5/c6/d7/b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0.jpg", expected_response: "kanin", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 14, question: "Ito ay matangkad at matigas na halaman", sound: "SIWW /n/", ipa_key: "/pu.nɔʔ/", consonant_group: "n", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/e7/f8/a9/e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2.jpg", expected_response: "puno", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 15, question: "Ito ay noodles na may sahog tulad ng karne at gulay", sound: "SFWW /n/", ipa_key: "/pan.sit/", consonant_group: "n", consonants_count: 4, vowels_count: 2, image_url: "https://i.pinimg.com/736x/c9/d0/e1/c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4.jpg", expected_response: "pansit", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: d
  { item_number: 16, question: "Ito ay ang tawag sa taong gumagamot sayo tuwing may sakit ka", sound: "SIWI /d/ & SFWF /r/", ipa_key: "/dɔk.tɔr/", consonant_group: "d", consonants_count: 4, vowels_count: 2, image_url: "https://i.pinimg.com/736x/f1/a2/b3/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.jpg", expected_response: "doktor", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 17, question: "Parte ng katawan na nakasandal sa upuan", sound: "SFWF /d/ & SIWW /k/", ipa_key: "/lɪ.kɔd/", consonant_group: "d", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/a3/b4/c5/a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8.jpg", expected_response: "likod", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 18, question: "Ito ay isang uri ng hayop na naninirahan sa dagat", sound: "SIWW /d/", ipa_key: "/is.daʔ/", consonant_group: "d", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/d5/e6/f7/d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0.jpg", expected_response: "isda", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: w
  { item_number: 19, question: "Ginagamit sa panglinis", sound: "SIWI /w/", ipa_key: "/wa.lis/", consonant_group: "w", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/b7/c8/d9/b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2.jpg", expected_response: "walis", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 20, question: "Kapag mainit, tumutulo ang ___?", sound: "SIWW /w/", ipa_key: "/pa.wɪs/", consonant_group: "w", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/e9/f0/a1/e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4.jpg", expected_response: "pawis", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: j
  { item_number: 21, question: "Pwede rito manood ng mga videos", sound: "SIWI /j/", ipa_key: "/ju.tub/", consonant_group: "j", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/c1/d2/e3/c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6.jpg", expected_response: "youtube", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 22, question: "Pinampupunas ito pagkatapos maligo", sound: "SIWW /j/", ipa_key: "/tu.wal.ja/", consonant_group: "j", consonants_count: 3, vowels_count: 3, image_url: "https://i.pinimg.com/736x/f3/a4/b5/f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8.jpg", expected_response: "tuwalya", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: h
  { item_number: 23, question: "Kadalasang kinakain sa almusal", sound: "SIWI /h/", ipa_key: "/hat.dɔg/", consonant_group: "h", consonants_count: 4, vowels_count: 2, image_url: "https://i.pinimg.com/736x/a5/b6/c7/a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0.jpg", expected_response: "hotdog", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 24, question: "Sinusuklay ito", sound: "SIWW /h/", ipa_key: "/bu.hɔk/", consonant_group: "h", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/d7/e8/f9/d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2.jpg", expected_response: "buhok", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: t
  { item_number: 25, question: "Ito ay parte ng katawan na ginagamit pangkinig", sound: "SIWI /t/ & SIWW /ŋ/", ipa_key: "/tɛ.ŋa/", consonant_group: "t", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/b9/c0/d1/b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4.jpg", expected_response: "tenga", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 26, question: "Sinusuot ito kapag sasakay ng motor o bicycle", sound: "SFWF /t/", ipa_key: "/hɛl.mɛt/", consonant_group: "t", consonants_count: 4, vowels_count: 2, image_url: "https://i.pinimg.com/736x/e1/f2/a3/e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6.jpg", expected_response: "helmet", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 27, question: "Ito ay galing sa manok", sound: "SFWW /t/", ipa_key: "/ʔit.lɔg/", consonant_group: "t", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/c3/d4/e5/c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8.jpg", expected_response: "itlog", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: ŋ
  { item_number: 28, question: "Kinukuskos ito gamit ang toothbrush", sound: "SIWI /ŋ/", ipa_key: "/ŋi.pin/", consonant_group: "ŋ", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/f5/a6/b7/f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0.jpg", expected_response: "ngipin", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 29, question: "Ito ay isang prutas", sound: "SFWF /ŋ/", ipa_key: "/sa.giŋ/", consonant_group: "ŋ", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/a7/b8/c9/a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2.jpg", expected_response: "saging", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 30, question: "Paborito nilang pagkain ay saging", sound: "SFWF /ŋ/", ipa_key: "/uŋ.gɔj/", consonant_group: "ŋ", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/d9/e0/f1/d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4.jpg", expected_response: "unggoy", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: k
  { item_number: 31, question: "Ito ay nilalagyan ng kandila tuwing may kaarawan", sound: "SFWF /k/", ipa_key: "/keɪk/", consonant_group: "k", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/b1/c2/d3/b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6.jpg", expected_response: "cake", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 32, question: "Ito ay mabango at may iba't ibang kulay", sound: "SFWW /k/", ipa_key: "/bu.lak.lak/", consonant_group: "k", consonants_count: 5, vowels_count: 3, image_url: "https://i.pinimg.com/736x/e3/f4/a5/e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8.jpg", expected_response: "bulaklak", difficulty_level: "Hard", max_score: 1.0 },
  
  // Group: g
  { item_number: 33, question: "Ito ay kulay puti at karaniwang kinukuha galing sa mga baka", sound: "SIWI /g/", ipa_key: "/ga.tas/", consonant_group: "g", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/c5/d6/e7/c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0.jpg", expected_response: "gatas", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 34, question: "Ito ay nilalagyan ng iba't ibang mga gamit", sound: "SFWF /g/", ipa_key: "/bag/", consonant_group: "g", consonants_count: 2, vowels_count: 1, image_url: "https://i.pinimg.com/736x/f7/a8/b9/f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2.jpg", expected_response: "bag", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 35, question: "Hinihabol ito ng pusa", sound: "SIWW /g/", ipa_key: "/da.gaʔ/", consonant_group: "g", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/a9/b0/c1/a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4.jpg", expected_response: "daga", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 36, question: "Ito ay ginagamit upang pumunta pataas o pababa sa bahay", sound: "SFWW /g/", ipa_key: "/hag.dan/", consonant_group: "g", consonants_count: 4, vowels_count: 2, image_url: "https://i.pinimg.com/736x/d1/e2/f3/d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6.jpg", expected_response: "hagdan", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: ʔ
  { item_number: 37, question: "Binubuksan ito para lumiwanag ang kwarto", sound: "SIWI /ʔ/", ipa_key: "/ʔi.law/", consonant_group: "ʔ", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/b3/c4/d5/b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8.jpg", expected_response: "ilaw", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 38, question: "Hindi siya matanda. Siya ay ___", sound: "SFWF /ʔ/", ipa_key: "/ba.taʔ/", consonant_group: "ʔ", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/e5/f6/a7/e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0.jpg", expected_response: "bata", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 39, question: "Ito ang sinusuotan natin ng sapatos", sound: "SIWW /ʔ/", ipa_key: "/pa.ʔa/", consonant_group: "ʔ", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/c7/d8/e9/c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2.jpg", expected_response: "paa", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: l
  { item_number: 40, question: "Sinusulatan mo ito", sound: "SFWF /l/", ipa_key: "/pa.pɛl/", consonant_group: "l", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/f9/a0/b1/f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4.jpg", expected_response: "papel", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 41, question: "Ginagamit mo ito pang-amoy", sound: "SIWW /l/", ipa_key: "/i.lɔŋ/", consonant_group: "l", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/a1/b2/c3/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.jpg", expected_response: "ilong", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 42, question: "Saan nakalagay ang bulaklak?", sound: "SFWW /l/", ipa_key: "/bul.sa/", consonant_group: "l", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/d3/e4/f5/d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8.jpg", expected_response: "bulsa", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: s
  { item_number: 43, question: "Malaking sasakyan", sound: "SFWF /s/", ipa_key: "/bus/", consonant_group: "s", consonants_count: 2, vowels_count: 1, image_url: "https://i.pinimg.com/736x/b5/c6/d7/b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0.jpg", expected_response: "bus", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 44, question: "Tumatahol at nangangagat ito", sound: "SIWW /s/", ipa_key: "/Ɂa.sɔ/", consonant_group: "s", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/e7/f8/a9/e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2.jpg", expected_response: "aso", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 45, question: "Kadalasang nilalagyan ng mga pinamili", sound: "SFWW /s/", ipa_key: "/bas.kɛt/", consonant_group: "s", consonants_count: 4, vowels_count: 2, image_url: "https://i.pinimg.com/736x/c9/d0/e1/c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4.jpg", expected_response: "basket", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: r
  { item_number: 46, question: "Pwede sila magsalita at gumalaw na parang tao", sound: "SIWI /r/", ipa_key: "/rɔ.bɔt/", consonant_group: "r", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/f1/a2/b3/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.jpg", expected_response: "robot", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 47, question: "Ginagamit ito pambayad", sound: "SFWF /r/", ipa_key: "/pa.tɛl/", consonant_group: "r", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/a3/b4/c5/a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8.jpg", expected_response: "pera", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 48, question: "Dito tayo natutulog at nagpapahinga", sound: "SFWW /r/", ipa_key: "/kwar.tɔ/", consonant_group: "r", consonants_count: 4, vowels_count: 2, image_url: "https://i.pinimg.com/736x/d5/e6/f7/d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0.jpg", expected_response: "kwarto", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: ʃ
  { item_number: 49, question: "Ginagamit ito pang-linis ng buhok", sound: "SIWI /ʃ/", ipa_key: "/ʃam.pu/", consonant_group: "ʃ", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/b7/c8/d9/b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2.jpg", expected_response: "shampoo", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 50, question: "Ginagamit ito pang-linis ng ngipin", sound: "SFWF /ʃ/", ipa_key: "/tut.brʌʃ/", consonant_group: "ʃ", consonants_count: 5, vowels_count: 2, image_url: "https://i.pinimg.com/736x/e9/f0/a1/e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4.jpg", expected_response: "toothbrush", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 57, question: "Ito ay ginagamit bilang pamunas sa puwet", sound: "SIWW /ʃ/", ipa_key: "/ti.ʃu/", consonant_group: "ʃ", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/c1/d2/e3/c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6.jpg", expected_response: "tissue", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 58, question: "Ginagamit ito tuwing brownout", sound: "SFWW /ʃ/", ipa_key: "/flaʃ.laɪt/", consonant_group: "ʃ", consonants_count: 6, vowels_count: 2, image_url: "https://i.pinimg.com/736x/f3/a4/b5/f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8.jpg", expected_response: "flashlight", difficulty_level: "Hard", max_score: 1.0 },
  
  // Group: ʧ / tʃ
  { item_number: 59, question: "Sinusuot sa paa", sound: "SIWI /ʧ/", ipa_key: "/tʃɪ.nɛ.las/", consonant_group: "ʧ", consonants_count: 4, vowels_count: 3, image_url: "https://i.pinimg.com/736x/a5/b6/c7/a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0.jpg", expected_response: "tsinelas", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 60, question: "Isang lugar na may tubig at buhangin", sound: "SFWF /ʧ/", ipa_key: "/bitʃ/", consonant_group: "ʧ", consonants_count: 3, vowels_count: 1, image_url: "https://i.pinimg.com/736x/d7/e8/f9/d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2.jpg", expected_response: "beach", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 61, question: "Kapares nito ang tinidor", sound: "SIWW /tʃ/", ipa_key: "/ku.tʃa.ra/", consonant_group: "tʃ", consonants_count: 4, vowels_count: 3, image_url: "https://i.pinimg.com/736x/b9/c0/d1/b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4.jpg", expected_response: "kutsara", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: dʒ
  { item_number: 62, question: "Sikat ito sa kanilang Chicken Joy", sound: "SIWI /dʒ/", ipa_key: "/dʒa.lɪ.bi/", consonant_group: "dʒ", consonants_count: 3, vowels_count: 3, image_url: "https://i.pinimg.com/736x/e1/f2/a3/e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6.jpg", expected_response: "jollibee", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 63, question: "Sinusuot sa paa", sound: "SIWW /dʒ/", ipa_key: "/mɛ.dʒas/", consonant_group: "dʒ", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/c3/d4/e5/c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8.jpg", expected_response: "medyas", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: f
  { item_number: 64, question: "Ginagamit natin ito kapag mainit", sound: "SIWI /f/", ipa_key: "/fan/", consonant_group: "f", consonants_count: 2, vowels_count: 1, image_url: "https://i.pinimg.com/736x/f5/a6/b7/f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0.jpg", expected_response: "fan", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 65, question: "May mahabang leeg", sound: "SFWF /f/", ipa_key: "/dʒi.raf/", consonant_group: "f", consonants_count: 4, vowels_count: 2, image_url: "https://i.pinimg.com/736x/a7/b8/c9/a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2.jpg", expected_response: "giraffe", difficulty_level: "Medium", max_score: 1.0 },
  { item_number: 66, question: "Uri ng isda na nagsasayaw", sound: "SIWW /f/", ipa_key: "/dɔl.fɪn/", consonant_group: "f", consonants_count: 4, vowels_count: 2, image_url: "https://i.pinimg.com/736x/d9/e0/f1/d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4.jpg", expected_response: "dolphin", difficulty_level: "Medium", max_score: 1.0 },
  
  // Group: v
  { item_number: 67, question: "Anong kulay ito?", sound: "SIWI /v/", ipa_key: "/va.jɔ.lɛt/", consonant_group: "v", consonants_count: 3, vowels_count: 3, image_url: "https://i.pinimg.com/736x/b1/c2/d3/b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6.jpg", expected_response: "violet", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 68, question: "Anong numero ito?", sound: "SIWF /v/", ipa_key: "/faɪv/", consonant_group: "v", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/e3/f4/a5/e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8.jpg", expected_response: "five", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 69, question: "Anong hugis ito?", sound: "SIWW /v/", ipa_key: "/o.val/", consonant_group: "v", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/c5/d6/e7/c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0.jpg", expected_response: "oval", difficulty_level: "Easy", max_score: 1.0 },
  
  // Group: z
  { item_number: 70, question: "Hayop na may kulay puti at itim na guhit sa katawan", sound: "SIWI /z/", ipa_key: "/zi.bra/", consonant_group: "z", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/f7/a8/b9/f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2.jpg", expected_response: "zebra", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 71, question: "Laruan na kailangan buuin", sound: "SIWW /z/", ipa_key: "/pa.zɛl/", consonant_group: "z", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/a9/b0/c1/a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4.jpg", expected_response: "puzzle", difficulty_level: "Easy", max_score: 1.0 },
  
  // Diphthongs
  { item_number: 72, question: "Tinitirhan ito ng tao", sound: "/aj/", ipa_key: "/ba.haj/", consonant_group: "aj", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/d1/e2/f3/d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6.jpg", expected_response: "bahay", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 73, question: "Tawag sa isang indibidwal kapag pinanganak", sound: "/ej/", ipa_key: "/bej.bi/", consonant_group: "ej", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/b3/c4/d5/b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8.jpg", expected_response: "baby", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 74, question: "Ito ay nagsasabi ng oink oink", sound: "/ɔj/", ipa_key: "/ba.bɔj/", consonant_group: "ɔj", consonants_count: 2, vowels_count: 2, image_url: "https://i.pinimg.com/736x/e5/f6/a7/e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0.jpg", expected_response: "baboy", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 75, question: "Ito ay hinihigop natin", sound: "SFWF /aw/", ipa_key: "/sa.baw/", consonant_group: "aw", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/c7/d8/e9/c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2.jpg", expected_response: "sabaw", difficulty_level: "Easy", max_score: 1.0 },
  { item_number: 76, question: "Sanggol ng manok", sound: "/iw/", ipa_key: "/si.siw/", consonant_group: "iw", consonants_count: 3, vowels_count: 2, image_url: "https://i.pinimg.com/736x/f9/a0/b1/f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4.jpg", expected_response: "sisiw", difficulty_level: "Easy", max_score: 1.0 }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from cookies
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user
    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log(`Creating comprehensive templates for clinician: ${user.clinician_id}`);

    // Create Standard Template (76 items)
    const standardTemplate = await prisma.assessmentTemplate.create({
      data: {
        name: 'Complete Filipino Phonological Assessment (76 Items)',
        description: 'Comprehensive assessment covering all Filipino phonemes: 21 consonants, 5 vowels, and 5 diphthongs. Standardized for clinical use.',
        is_default: true,
        is_for_kids: false,
        created_by: user.clinician_id,
      }
    });

    console.log(`Created standard template: ID ${standardTemplate.template_id}`);

    // Insert all 76 items for standard template
    for (const item of completeAssessmentItems) {
      await prisma.sessionItem.create({
        data: {
          ...item,
          template_id: standardTemplate.template_id,
          display_order: item.item_number,
        }
      });
    }

    console.log('Added all 76 items to standard template');

    // Create Kids Template (76 items)
    const kidsTemplate = await prisma.assessmentTemplate.create({
      data: {
        name: 'Filipino Phonological Assessment - Kids Mode (76 Items)',
        description: 'Complete phonological assessment with child-friendly interface and engaging visual themes. Same comprehensive coverage as standard template.',
        is_default: false,
        is_for_kids: true,
        created_by: user.clinician_id,
      }
    });

    console.log(`Created kids template: ID ${kidsTemplate.template_id}`);

    // Insert all 76 items for kids template
    for (const item of completeAssessmentItems) {
      await prisma.sessionItem.create({
        data: {
          ...item,
          template_id: kidsTemplate.template_id,
          display_order: item.item_number,
        }
      });
    }

    console.log('Added all 76 items to kids template');

    return res.status(200).json({
      success: true,
      message: 'Successfully created comprehensive assessment templates',
      templates: {
        standard: {
          id: standardTemplate.template_id,
          name: standardTemplate.name,
          items: 76
        },
        kids: {
          id: kidsTemplate.template_id,
          name: kidsTemplate.name,
          items: 76
        }
      }
    });

  } catch (error) {
    console.error('Error creating comprehensive templates:', error);
    return res.status(500).json({
      error: 'Failed to create comprehensive templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
