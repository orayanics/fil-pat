import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = verifyToken(token);
  if (!user || !user.clinician_id) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    const clinicianId = user.clinician_id;

    // Kids Template Data
    const kidsTemplateItems = [
      { item_number: 1, question: "Pusa (Cat)", sound: "/pusa/", ipa_key: "pu.sa", consonant_group: "Stops", consonants_count: 2, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400", difficulty_level: "Easy", expected_response: "pusa", max_score: 4 },
      { item_number: 2, question: "Aso (Dog)", sound: "/aso/", ipa_key: "a.so", consonant_group: "Fricatives", consonants_count: 1, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400", difficulty_level: "Easy", expected_response: "aso", max_score: 3 },
      { item_number: 3, question: "Bola (Ball)", sound: "/bola/", ipa_key: "bo.la", consonant_group: "Stops, Laterals", consonants_count: 2, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400", difficulty_level: "Easy", expected_response: "bola", max_score: 4 },
      { item_number: 4, question: "Mata (Eye)", sound: "/mata/", ipa_key: "ma.ta", consonant_group: "Nasals, Stops", consonants_count: 2, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1585763564955-6ce0f0c2a4f8?w=400", difficulty_level: "Easy", expected_response: "mata", max_score: 4 },
      { item_number: 5, question: "Ngipin (Teeth)", sound: "/ngipin/", ipa_key: "ngi.pin", consonant_group: "Nasals, Stops", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400", difficulty_level: "Medium", expected_response: "ngipin", max_score: 5 },
      { item_number: 6, question: "Ilong (Nose)", sound: "/ilong/", ipa_key: "i.long", consonant_group: "Laterals, Nasals", consonants_count: 2, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1617330527074-50dbfd7fb654?w=400", difficulty_level: "Medium", expected_response: "ilong", max_score: 4 },
      { item_number: 7, question: "Kamay (Hand)", sound: "/kamay/", ipa_key: "ka.may", consonant_group: "Stops, Nasals, Approximants", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=400", difficulty_level: "Medium", expected_response: "kamay", max_score: 5 },
      { item_number: 8, question: "Paa (Foot)", sound: "/paa/", ipa_key: "pa.a", consonant_group: "Stops", consonants_count: 2, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1520338258477-cbaee2e63a1f?w=400", difficulty_level: "Easy", expected_response: "paa", max_score: 4 },
      { item_number: 9, question: "Saging (Banana)", sound: "/saging/", ipa_key: "sa.ging", consonant_group: "Fricatives, Stops, Nasals", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400", difficulty_level: "Medium", expected_response: "saging", max_score: 5 },
      { item_number: 10, question: "Tubig (Water)", sound: "/tubig/", ipa_key: "tu.big", consonant_group: "Stops", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400", difficulty_level: "Medium", expected_response: "tubig", max_score: 5 },
      { item_number: 11, question: "Bahay (House)", sound: "/bahay/", ipa_key: "ba.hay", consonant_group: "Stops, Fricatives, Approximants", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400", difficulty_level: "Medium", expected_response: "bahay", max_score: 5 },
      { item_number: 12, question: "Kotse (Car)", sound: "/kotse/", ipa_key: "kot.se", consonant_group: "Stops, Affricates", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400", difficulty_level: "Medium", expected_response: "kotse", max_score: 5 },
      { item_number: 13, question: "Libro (Book)", sound: "/libro/", ipa_key: "lib.ro", consonant_group: "Laterals, Stops, Flaps", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400", difficulty_level: "Hard", expected_response: "libro", max_score: 5 },
      { item_number: 14, question: "Tren (Train)", sound: "/tren/", ipa_key: "tren", consonant_group: "Stops, Flaps, Nasals", consonants_count: 3, vowels_count: 1, image_url: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400", difficulty_level: "Hard", expected_response: "tren", max_score: 4 },
      { item_number: 15, question: "Prutas (Fruits)", sound: "/prutas/", ipa_key: "pru.tas", consonant_group: "Stops, Flaps, Fricatives", consonants_count: 4, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400", difficulty_level: "Hard", expected_response: "prutas", max_score: 6 },
      { item_number: 16, question: "Eroplano (Airplane)", sound: "/eroplano/", ipa_key: "e.ro.pla.no", consonant_group: "Flaps, Stops, Laterals, Nasals", consonants_count: 5, vowels_count: 4, image_url: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=400", difficulty_level: "Hard", expected_response: "eroplano", max_score: 9 },
      { item_number: 17, question: "Krayola (Crayon)", sound: "/krayola/", ipa_key: "kray.o.la", consonant_group: "Stops, Flaps, Approximants, Laterals", consonants_count: 4, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400", difficulty_level: "Hard", expected_response: "krayola", max_score: 7 },
      { item_number: 18, question: "Palengke (Market)", sound: "/palengke/", ipa_key: "pa.leng.ke", consonant_group: "Stops, Laterals, Nasals", consonants_count: 4, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400", difficulty_level: "Hard", expected_response: "palengke", max_score: 7 },
      { item_number: 19, question: "Tsinelas (Slippers)", sound: "/tsinelas/", ipa_key: "tsi.ne.las", consonant_group: "Affricates, Nasals, Laterals, Fricatives", consonants_count: 5, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400", difficulty_level: "Hard", expected_response: "tsinelas", max_score: 8 },
      { item_number: 20, question: "Tsonggo (Monkey)", sound: "/tsonggo/", ipa_key: "tsong.go", consonant_group: "Affricates, Nasals, Stops", consonants_count: 4, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=400", difficulty_level: "Hard", expected_response: "tsonggo", max_score: 6 },
    ];

    // General Template Data
    const generalTemplateItems = [
      { item_number: 1, question: "Ama (Father)", sound: "/ama/", ipa_key: "a.ma", consonant_group: "Nasals", consonants_count: 2, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=400", difficulty_level: "Easy", expected_response: "ama", max_score: 4 },
      { item_number: 2, question: "Ina (Mother)", sound: "/ina/", ipa_key: "i.na", consonant_group: "Nasals", consonants_count: 1, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400", difficulty_level: "Easy", expected_response: "ina", max_score: 3 },
      { item_number: 3, question: "Bata (Child)", sound: "/bata/", ipa_key: "ba.ta", consonant_group: "Stops", consonants_count: 2, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400", difficulty_level: "Easy", expected_response: "bata", max_score: 4 },
      { item_number: 4, question: "Sapatos (Shoes)", sound: "/sapatos/", ipa_key: "sa.pa.tos", consonant_group: "Fricatives, Stops", consonants_count: 4, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400", difficulty_level: "Medium", expected_response: "sapatos", max_score: 7 },
      { item_number: 5, question: "Damit (Clothes)", sound: "/damit/", ipa_key: "da.mit", consonant_group: "Stops, Nasals", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400", difficulty_level: "Medium", expected_response: "damit", max_score: 5 },
      { item_number: 6, question: "Salamin (Eyeglasses)", sound: "/salamin/", ipa_key: "sa.la.min", consonant_group: "Fricatives, Laterals, Nasals", consonants_count: 4, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400", difficulty_level: "Medium", expected_response: "salamin", max_score: 7 },
      { item_number: 7, question: "Tinapay (Bread)", sound: "/tinapay/", ipa_key: "ti.na.pay", consonant_group: "Stops, Nasals, Approximants", consonants_count: 4, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", difficulty_level: "Medium", expected_response: "tinapay", max_score: 7 },
      { item_number: 8, question: "Gatas (Milk)", sound: "/gatas/", ipa_key: "ga.tas", consonant_group: "Stops, Fricatives", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400", difficulty_level: "Medium", expected_response: "gatas", max_score: 5 },
      { item_number: 9, question: "Kakanin (Rice Cake)", sound: "/kakanin/", ipa_key: "ka.ka.nin", consonant_group: "Stops, Nasals", consonants_count: 4, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400", difficulty_level: "Medium", expected_response: "kakanin", max_score: 7 },
      { item_number: 10, question: "Manok (Chicken)", sound: "/manok/", ipa_key: "ma.nok", consonant_group: "Nasals, Stops", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400", difficulty_level: "Medium", expected_response: "manok", max_score: 5 },
      { item_number: 11, question: "Halamanan (Garden)", sound: "/halamanan/", ipa_key: "ha.la.ma.nan", consonant_group: "Fricatives, Laterals, Nasals", consonants_count: 5, vowels_count: 4, image_url: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400", difficulty_level: "Hard", expected_response: "halamanan", max_score: 9 },
      { item_number: 12, question: "Kalsada (Street)", sound: "/kalsada/", ipa_key: "kal.sa.da", consonant_group: "Stops, Laterals, Fricatives", consonants_count: 4, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400", difficulty_level: "Hard", expected_response: "kalsada", max_score: 7 },
      { item_number: 13, question: "Pagkain (Food)", sound: "/pagkain/", ipa_key: "pag.ka.in", consonant_group: "Stops, Nasals", consonants_count: 4, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400", difficulty_level: "Hard", expected_response: "pagkain", max_score: 7 },
      { item_number: 14, question: "Plantsa (Iron)", sound: "/plantsa/", ipa_key: "plan.tsa", consonant_group: "Stops, Laterals, Nasals, Affricates", consonants_count: 5, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400", difficulty_level: "Hard", expected_response: "plantsa", max_score: 7 },
      { item_number: 15, question: "Baraha (Playing Cards)", sound: "/baraha/", ipa_key: "ba.ra.ha", consonant_group: "Stops, Flaps, Fricatives", consonants_count: 3, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1571289868918-9c4c7d9b42f8?w=400", difficulty_level: "Hard", expected_response: "baraha", max_score: 6 },
      { item_number: 16, question: "Klase (Class)", sound: "/klase/", ipa_key: "kla.se", consonant_group: "Stops, Laterals, Fricatives", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400", difficulty_level: "Hard", expected_response: "klase", max_score: 5 },
      { item_number: 17, question: "Guro (Teacher)", sound: "/guro/", ipa_key: "gu.ro", consonant_group: "Stops, Flaps", consonants_count: 2, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1580982324006-8e0b51a3f48e?w=400", difficulty_level: "Medium", expected_response: "guro", max_score: 4 },
      { item_number: 18, question: "Tindahan (Store)", sound: "/tindahan/", ipa_key: "tin.da.han", consonant_group: "Stops, Nasals, Fricatives", consonants_count: 5, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=400", difficulty_level: "Hard", expected_response: "tindahan", max_score: 8 },
      { item_number: 19, question: "Dyaryo (Newspaper)", sound: "/dyaryo/", ipa_key: "dyar.yo", consonant_group: "Stops, Approximants, Flaps", consonants_count: 3, vowels_count: 2, image_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400", difficulty_level: "Hard", expected_response: "dyaryo", max_score: 5 },
      { item_number: 20, question: "Trabaho (Work)", sound: "/trabaho/", ipa_key: "tra.ba.ho", consonant_group: "Stops, Flaps, Fricatives", consonants_count: 4, vowels_count: 3, image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400", difficulty_level: "Hard", expected_response: "trabaho", max_score: 7 },
    ];

    // Create Kids Template
    const kidsTemplate = await prisma.assessmentTemplate.create({
      data: {
        name: 'Filipino PAT - Kids Edition (20 Items)',
        description: 'Child-friendly Filipino Phonological Assessment with playful images and simple vocabulary. Ideal for ages 3-7.',
        is_default: false,
        is_for_kids: true,
        is_active: true,
        created_by: clinicianId,
        difficulty_level: 'Easy to Hard',
        estimated_duration_minutes: 30,
      },
    });

    // Insert Kids Template Items
    for (const item of kidsTemplateItems) {
      await prisma.sessionItem.create({
        data: {
          ...item,
          template_id: kidsTemplate.template_id,
          is_active: true,
          image_alt_text: item.question,
          background_color: '#FFFFFF',
          text_size: 'Large',
          time_limit_seconds: null,
        },
      });
    }

    // Create General Template
    const generalTemplate = await prisma.assessmentTemplate.create({
      data: {
        name: 'Filipino PAT - Standard Assessment (20 Items)',
        description: 'Comprehensive Filipino Phonological Assessment Tool covering a wide range of phonemes and difficulty levels. Suitable for general population.',
        is_default: true,
        is_for_kids: false,
        is_active: true,
        created_by: clinicianId,
        difficulty_level: 'Standard',
        estimated_duration_minutes: 45,
      },
    });

    // Insert General Template Items
    for (const item of generalTemplateItems) {
      await prisma.sessionItem.create({
        data: {
          ...item,
          template_id: generalTemplate.template_id,
          is_active: true,
          image_alt_text: item.question,
          background_color: '#FFFFFF',
          text_size: 'Medium',
          time_limit_seconds: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Templates created successfully',
      templates: {
        kids: {
          id: kidsTemplate.template_id,
          name: kidsTemplate.name,
          items: 20,
        },
        general: {
          id: generalTemplate.template_id,
          name: generalTemplate.name,
          items: 20,
        },
      },
    });
  } catch (error) {
    console.error('Failed to create templates:', error);
    return res.status(500).json({ error: 'Failed to create templates' });
  }
}
