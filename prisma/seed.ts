import { PrismaClient } from '../apps/server/src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import argon2 from 'argon2'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development seed is disabled in production')
  }

  // 1 — District
  let district = await prisma.district.findFirst({
    where: { name: 'Yunusobod tumani' },
  })
  if (!district) {
    district = await prisma.district.create({
      data: { name: 'Yunusobod tumani' },
    })
  }

  // 2 — Mahallas (fake BigInt chat IDs for local dev)
  const mahallas: Array<{ name: string; chatId: bigint }> = [
    { name: 'Навбаҳор маҳалласи', chatId: -1001000000001n },
    { name: 'Олмазор маҳалласи',  chatId: -1001000000002n },
    { name: 'Боғистон маҳалласи', chatId: -1001000000003n },
  ]
  for (const { name, chatId } of mahallas) {
    await prisma.mahalla.upsert({
      where:  { telegram_chat_id: chatId },
      update: {},
      create: {
        district_id:      district.id,
        name,
        telegram_chat_id: chatId,
        bot_status:       'active',
      },
    })
  }

  // 3 — Operator and Utility users (devpassword only — rotate before pilot)
  const password_hash = await argon2.hash('devpassword')
  
  // Hokim / Operator user
  await prisma.user.upsert({
    where:  { username: 'operator' },
    update: { role: 'hokim' },
    create: {
      username:      'operator',
      password_hash,
      district_id:   district.id,
      role:          'hokim',
    },
  })

  // Utility company users
  const utilityUsers = [
    { username: 'water_user', role: 'water' },
    { username: 'gas_user', role: 'gas' },
    { username: 'electricity_user', role: 'electricity' },
    { username: 'waste_user', role: 'waste' },
  ]

  for (const uu of utilityUsers) {
    await prisma.user.upsert({
      where:  { username: uu.username },
      update: { role: uu.role },
      create: {
        username:      uu.username,
        password_hash,
        district_id:   district.id,
        role:          uu.role,
      },
    })
  }

  // 4 — Core Keywords (Latin and Cyrillic pairs)
  const defaultKeywords = [
    'gaz', 'газ',
    'svet', 'свет',
    'elektr', 'электр',
    'suv', 'сув',
    'hokim', 'ҳоким', 'хоким',
    'musr', 'муср',
    'musor', 'мусор',
    'chiqindi', 'чиқинди', 'чикинди',
    'musir', 'мусир',
    'rais', 'раис',
    'rayis', 'райис',
    'rais buva', 'раис бува',
    'rayis buva', 'райис бува',
    'rais bobo', 'раис бобо',
    'rayis bobo', 'райис бобо'
  ]

  for (const phrase of defaultKeywords) {
    await prisma.keyword.upsert({
      where: {
        district_id_phrase: {
          district_id: district.id,
          phrase,
        },
      },
      update: {},
      create: {
        district_id: district.id,
        phrase,
        is_active: true,
      },
    })
  }

  // 5 — Mock Historical Signal Messages (for past days)
  const dbMahallas = await prisma.mahalla.findMany({
    where: { district_id: district.id },
  })

  if (dbMahallas.length === 0) {
    throw new Error('No mahallas found to link signals to')
  }

  // Delete existing mock historical signals to avoid duplicates or invalid text_sources
  await prisma.signalMessage.deleteMany({
    where: {
      telegram_update_id: {
        gte: 500000,
        lt: 600000,
      },
    },
  })

  const mockSignals = [
    // === WATER ===
    {
      category: 'water',
      raw_text: 'Сув босими жуда паст, жўмракдан ипдек оқяпти.',
      short_label: 'Ичимлик суви таъминотида сув босими пастлиги кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'water',
      raw_text: "Suv bosimi juda past, jo'mrakdan ipdek oqyapti.",
      short_label: 'Ичимлик суви таъминотида сув босими пастлиги айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'water',
      raw_text: 'Ичимлик суви таъминотида узилишлар бўляпти.',
      short_label: 'Сув таъминотида тез-тез узилишлар кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'water',
      raw_text: "Ichimlik suvi ta'minotida uzilishlar bo'lyapti.",
      short_label: 'Сув таъминотида узилишлар бўлаётгани айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'water',
      raw_text: 'Сув қувури ёрилибди, кўчада сув оқиб ётибди.',
      short_label: 'Сув қувури ёрилиши натижасима авария ҳолати айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'water',
      raw_text: "Suv quvuri yorilibdi, ko'chada suv oqib yotibdi.",
      short_label: 'Сув қувури шикастлангани ва сув оқаётгани хабар қилинмоқда.',
      hokim_related: false,
    },
    {
      category: 'water',
      raw_text: 'Сувимиз лойқа бўлиб оқмоқда, ичиб бўлмайди.',
      short_label: 'Ичимлик суви ифлосланганлиги юзасидан норозиликлар кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'water',
      raw_text: "Suvimiz loyqa bo'lib oqmoqda, ichib bo'lmaydi.",
      short_label: 'Оқар сув сифати ёмонлашгани кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'water',
      raw_text: 'Икки кундан бери сув йўқ, қачон беришади?',
      short_label: 'Кўп кунлик сувсизлик бўйича шикоятлар кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'water',
      raw_text: "Ikki kundan beri suv yo'q, qachon berishadi?",
      short_label: 'Аҳоли ичимлик суви йўқлигидан шикоят қилмоқда.',
      hokim_related: false,
    },
    {
      category: 'water',
      raw_text: 'Раис бобо, сув таъминоти корхонасига қўнғироқ қилинг, сув йўқ.',
      short_label: 'Маҳалла раисидан сувсизлик муаммосини ҳал қилиш сўралмоқда.',
      hokim_related: true,
    },
    {
      category: 'water',
      raw_text: "Rais buva, suv yo'qligi bo'yicha yordam bering.",
      short_label: 'Раисга сув таъминотидаги узилиш бўйича мурожаат қилинмоқда.',
      hokim_related: true,
    },

    // === ELECTRICITY ===
    {
      category: 'electricity',
      raw_text: 'Свет яна ўчди, кунига 3-4 марта ўчяпти.',
      short_label: 'Электр таъминотидаги тез-тез ўчишлар кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'electricity',
      raw_text: "Svet yana o'chdi, kuniga 3-4 marta o'chyapti.",
      short_label: 'Электр энергиясида мунтазам узилишлар шикоят қилинмоқда.',
      hokim_related: false,
    },
    {
      category: 'electricity',
      raw_text: 'Кучланиш жуда паст, музлатгич ишламаяпти.',
      short_label: 'Электр тармоғида кучланиш жуда пастлиги кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'electricity',
      raw_text: "Kuchlanish juda past, muzlatgich ishlamayapti.",
      short_label: 'Электр кучланиши пастлигидан маиший техника бузилаётгани айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'electricity',
      raw_text: 'Трансформатордан тутун чиқмоқда, хавфли ҳолат.',
      short_label: 'Трансформатордаги авариявий ҳолат ва тутун чиқиши айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'electricity',
      raw_text: "Transformatordan tutun chiqmoqda, xavfli holat.",
      short_label: 'Электр трансформаторида носозлик ва хавф кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'electricity',
      raw_text: 'Электр симлари осилиб қолган, тегиб кетиши мумкин.',
      short_label: 'Осиб қолган симлар туфайли хавфли ҳолат юзага келгани айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'electricity',
      raw_text: "Elektr simlari osilib qolgan, tegib ketishi mumkin.",
      short_label: 'Хавфли осилган электр симлари бўйича шикоят қилинмоқда.',
      hokim_related: false,
    },
    {
      category: 'electricity',
      raw_text: 'Свет ўчганига 5 соат бўлди, ҳеч ким келмади.',
      short_label: 'Электр ўчганидан бери узоқ вақт давомида таъмирланмагани айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'electricity',
      raw_text: "Svet o'chganiga 5 soat bo'ldi, hech kim kelmadi.",
      short_label: 'Кўп соатлик электр ўчиши бўйича норозиликлар кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'electricity',
      raw_text: 'Ҳоким бобо, электр тармоғидаги муаммони ҳал қилиб беринг.',
      short_label: 'Туман ҳокимидан электр таъминотини яхшилаш сўралмоқда.',
      hokim_related: true,
    },
    {
      category: 'electricity',
      raw_text: "Hokim buva, ko'chamizda elektr tarmog'ida muammo bor, svet yo'q.",
      short_label: 'Ҳокимга кўчадаги электр муаммолари бўйича мурожаат қилинмоқда.',
      hokim_related: true,
    },

    // === GAS ===
    {
      category: 'gas',
      raw_text: 'Газ босими жуда паст, овқат пишириб бўлмаяпти.',
      short_label: 'Табиий газ босими пастлиги бўйича шикоятлар кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'gas',
      raw_text: "Gaz bosimi juda past, ovqat pishirib bo'lmayapti.",
      short_label: 'Газ босими пастлиги туфайли қийинчиликлар айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'gas',
      raw_text: 'Газ ҳисоблагичдан газ ҳиди келяпти, хавфли.',
      short_label: 'Газ сизиб чиқиши ва хавфли ҳолат юзага келгани хабар қилинмоқда.',
      hokim_related: false,
    },
    {
      category: 'gas',
      raw_text: "Gaz hisoblagichdan gaz hidi kelyapti, xavfli.",
      short_label: 'Газ қувурлари ёки ҳисоблагичдаги газ сизиши айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'gas',
      raw_text: 'Газ таъминотида носозликлар бор, иситиш тизими ўчди.',
      short_label: 'Иситиш тизими ишламаётгани ва газ носозлиги кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'gas',
      raw_text: "Gaz ta'minotida nosozliklar bor, isitish tizimi o'chdi.",
      short_label: 'Газ таъминотидаги носозлик сабабли уй совуб кетгани айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'gas',
      raw_text: 'Қишга яқин газ босими тушиб кетди.',
      short_label: 'Мавсумий газ босими тушиб кетиши кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'gas',
      raw_text: "Qishga yaqin gaz bosimi tushib ketdi.",
      short_label: 'Совуқ тушиши билан газ босими пасайгани айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'gas',
      raw_text: 'Газ мутлақо йўқ, уй совуб кетди.',
      short_label: 'Уйларда газ таъминоти тўлиқ тўхтатилгани айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'gas',
      raw_text: "Gaz mutlaqo yo'q, uy sovub ketdi.",
      short_label: 'Газ йўқлиги туфайли хонадонлар иситилмаётгани айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'gas',
      raw_text: 'Раис бува, газ идорасига мурожаат қилайлик, газ паст.',
      short_label: 'Раисдан газ босими пастлиги бўйича ёрдам сўралмоқда.',
      hokim_related: true,
    },
    {
      category: 'gas',
      raw_text: "Rais buva, ko'chamizda gaz bosimi juda past bo'lib ketdi.",
      short_label: 'Маҳалла раисига газ босими пастлиги бўйича мурожаат кузатилмоқда.',
      hokim_related: true,
    },

    // === WASTE ===
    {
      category: 'waste',
      raw_text: 'Чиқинди контейнерлари тўлиб кетди, ҳид чиқяпти.',
      short_label: 'Маиший чиқиндилар ва тўлган контейнерлардан норозилик кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'waste',
      raw_text: "Chiqindi konteynerlari to'lib ketdi, hid chiqyapti.",
      short_label: 'Тозаланмаган чиқинди қутилари ва ёқимсиз ҳид шикоят қилинмоқда.',
      hokim_related: false,
    },
    {
      category: 'waste',
      raw_text: 'Мусор машинаси охирги бир ҳафтадан бери келмади.',
      short_label: 'Чиқинди ташиш графиги бир ҳафта давомида бузилгани айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'waste',
      raw_text: "Musor mashinasi oxirgi bir haftadan beri kelmadi.",
      short_label: 'Чиқинди машинаси келмаётгани бўйича шикоят кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'waste',
      raw_text: 'Чиқиндиларни кўчага ташлаб кетишяпти.',
      short_label: 'Ноқонуний чиқинди ташлаш ҳолатлари кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'waste',
      raw_text: "Chiqindilarni ko'chaga tashlab ketishyapti.",
      short_label: 'Кўчаларда чиқинди уюмлари пайдо бўлаётгани айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'waste',
      raw_text: 'Мусорхона атрофи жуда ифлос бўлиб ётибди.',
      short_label: 'Чиқинди йиғиш шохобчасидаги санитария ҳолати ёмонлиги айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'waste',
      raw_text: "Musorxona atrofi juda iflos bo'lib yotibdi.",
      short_label: 'Чиқинди майдони атрофи ифлослангани кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'waste',
      raw_text: 'Кўчамиздан чиқиндиларни олиб кетишмаяпти.',
      short_label: 'Чиқиндиларни олиб кетиш хизмати ишламаётгани айтилмоқда.',
      hokim_related: false,
    },
    {
      category: 'waste',
      raw_text: "Ko'chamizdan chiqindilarni olib ketishmayapti.",
      short_label: 'Кўчадаги ахлатлар ўз вақтида олиб кетилмаётгани кузатилмоқда.',
      hokim_related: false,
    },
    {
      category: 'waste',
      raw_text: 'Раис бобо, чиқинди ташиш машинаси нега келмаяпти?',
      short_label: 'Маҳалла раисидан чиқинди машинаси кечикиши сабабини сўрашмоқда.',
      hokim_related: true,
    },
    {
      category: 'waste',
      raw_text: "Rais buva, chiqindi to'planib qoldi, tozalash kerak.",
      short_label: 'Раисга чиқиндиларни йиғиш ва тозалаш бўйича мурожаат қилинмоқда.',
      hokim_related: true,
    },
  ]

  let updateIdSeq = 500000
  let messageIdSeq = 1000

  for (const mock of mockSignals) {
    const mahalla = dbMahallas[Math.floor(Math.random() * dbMahallas.length)]!
    
    // Spread randomly between 24 and 72 hours ago
    const hoursAgo = 24 + Math.random() * 48
    const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
    const classifiedAt = new Date(timestamp.getTime() + 10 * 60 * 1000)

    const updateId = updateIdSeq++
    const messageId = messageIdSeq++

    await prisma.signalMessage.upsert({
      where: {
        telegram_update_id_category: {
          telegram_update_id: updateId,
          category: mock.category,
        },
      },
      update: {},
      create: {
        telegram_update_id:  updateId,
        telegram_message_id: messageId,
        district_id:         district.id,
        mahalla_id:          mahalla.id,
        sender_display_name: Math.random() > 0.3 ? (Math.random() > 0.5 ? 'Али Валиев' : 'Ali Valiyev') : null,
        sender_username:     Math.random() > 0.5 ? 'resident_user' : null,
        telegram_timestamp:  timestamp,
        raw_text:            mock.raw_text,
        text_source:         'text',
        category:            mock.category,
        hokim_related:       mock.hokim_related,
        keyword_matched:     true,
        matched_keyword:     mock.category === 'waste' ? 'chiqindi' : mock.category,
        short_label:         mock.short_label,
        status:              'yangi',
        classified_at:       classifiedAt,
        created_at:          classifiedAt,
      },
    })
  }

  console.log('Seed complete')
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
