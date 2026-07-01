// prisma/seed-signals.ts
// Inserts a realistic set of today's signal_messages for dashboard dev/preview.
// Safe to run multiple times — uses unique telegram_update_id with a high base offset.
// Run with: pnpm exec tsx prisma/seed-signals.ts

import { PrismaClient } from '../apps/server/src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// UTC+5 "now" helpers
const now = new Date()
const minutesAgo = (n: number) => new Date(now.getTime() - n * 60_000)

type Category = 'water' | 'electricity' | 'gas' | 'waste'

interface SignalDraft {
  updateIdOffset: number        // unique offset from base
  category:       Category
  hokimRelated:   boolean
  senderName:     string | null
  senderUsername: string | null
  text:           string
  textSource:     'text' | 'caption'
  mahallaIndex:   number        // 0 = Навбаҳор, 1 = Олмазор, 2 = Боғистон
  minsAgo:        number        // how many minutes ago
  keyword:        string | null
  shortLabel:     string | null
}

const signals: SignalDraft[] = [
  // ── Boshqalar (Hokim-related) ──────────────────────────────────────────
  {
    updateIdOffset: 1,
    category: 'electricity', hokimRelated: true,
    senderName: 'Дилноза Юсупова', senderUsername: null,
    text: 'Йўлда ёритгичлари кўп вақтдан бери ишламайди, кечқурун жуда қоронғи. Илтимос, ҳокимият назоратга олсин.',
    textSource: 'text', mahallaIndex: 0, minsAgo: 10, keyword: 'hokim',
    shortLabel: 'Кўча ёритгичлари ишламаслиги туфайли йўллар қоронғи бўлиб қолаётгани кузатилмоқда.',
  },
  {
    updateIdOffset: 2,
    category: 'waste', hokimRelated: true,
    senderName: 'Акбар Рашидов', senderUsername: 'akbar_r',
    text: 'Маҳаллада болалар майдончаси атрофи чиқиндилар билан тўлган. Тозалаш ишлари умуман олиб борилмаяпти.',
    textSource: 'text', mahallaIndex: 1, minsAgo: 28, keyword: 'rais',
    shortLabel: 'Болалар майдончаси атрофи чиқиндига тўлиб, санитария ҳолати ёмонлашгани айтилмоқда.',
  },
  {
    updateIdOffset: 3,
    category: 'waste', hokimRelated: true,
    senderName: 'Малика Каримова', senderUsername: null,
    text: 'Йўл белгиси кўринмай қолган, дарахт шохлари орасида қолган. Бу ҳайдовчиларга катта қийинчилик туғдирмоқда.',
    textSource: 'caption', mahallaIndex: 2, minsAgo: 62, keyword: 'hokim',
    shortLabel: 'Йўл белгисини дарахт шохлари тўсиб қолгани ва ҳаракатга халақит бераётгани айтилмоқда.',
  },
  {
    updateIdOffset: 4,
    category: 'electricity', hokimRelated: true,
    senderName: 'Жамшид Тошматов', senderUsername: 'jamshid_t',
    text: 'Икки йилдан бери йўлда катта чуқурликлар бор. Ёмғир ёғса кўлга айланади, машиналарга зарар етяпти.',
    textSource: 'text', mahallaIndex: 0, minsAgo: 105, keyword: 'hokim',
    shortLabel: 'Йўл қопламаси шикастланиб, чуқурлар пайдо бўлгани бўйича шикоят қилишмоқда.',
  },

  // ── Suv (Water) ────────────────────────────────────────────────────────
  // Group 1: Navbahor MFY (mahallaIndex: 0) - Water (3 signals collapsed)
  {
    updateIdOffset: 5,
    category: 'water', hokimRelated: false,
    senderName: 'Нилуфар Азимова', senderUsername: null,
    text: 'Сув оқими жуда паст, уйимизда 3-қаватга сув умуман кўтарилмаяпти. Муаммони ҳал қилиб беринг.',
    textSource: 'text', mahallaIndex: 0, minsAgo: 5, keyword: 'suv',
    shortLabel: 'Ичимлик суви таъминотида сув босими пастлиги ва узилишлар бўйича норозиликлар кузатилмоқда.',
  },
  {
    updateIdOffset: 6,
    category: 'water', hokimRelated: false,
    senderName: 'Санжар Бекмуродов', senderUsername: 'sanjar_b',
    text: 'Эрталабдан бери ичимлик суви йўқ. Оғиз суви ҳам келмади. Қачон берилади?',
    textSource: 'text', mahallaIndex: 0, minsAgo: 15, keyword: 'suv',
    shortLabel: 'Ичимлик суви таъминотида сув босими пастлиги ва узилишлар бўйича норозиликлар кузатилмоқда.',
  },
  {
    updateIdOffset: 8,
    category: 'water', hokimRelated: false,
    senderName: 'Умид Нишонов', senderUsername: null,
    text: 'Бугун сувнинг таъми ўзгарган, ранги ҳам хирароқ. Ичишга қўрқяпмиз, ҳид бор.',
    textSource: 'text', mahallaIndex: 0, minsAgo: 72, keyword: 'suv',
    shortLabel: 'Ичимлик суви таъминотида сув босими пастлиги ва узилишлар бўйича норозиликлар кузатилмоқда.',
  },
  // Single water signal in Bogiston
  {
    updateIdOffset: 7,
    category: 'water', hokimRelated: false,
    senderName: 'Феруза Мамадалиева', senderUsername: null,
    text: 'Кўчамизда қувурдан сув оқиб кетяпти, жуда катта исроф бўляпти. Авария хизмати чақирилсин.',
    textSource: 'caption', mahallaIndex: 2, minsAgo: 40, keyword: 'suv',
    shortLabel: 'Кўчадаги сув қувуридан катта миқдорда сув сизиб чиқаётгани хабар қилинмоқда.',
  },

  // ── Elektr (Electricity) ────────────────────────────────────────────────
  // Group 2: Olmazor MFY (mahallaIndex: 1) - Electricity (3 signals collapsed)
  {
    updateIdOffset: 9,
    category: 'electricity', hokimRelated: false,
    senderName: 'Зулфия Ҳасанова', senderUsername: 'zulfiya_h',
    text: 'Электр токи тез-тез ўчиб қоляпти. Кундузи ҳам, кечаси ҳам. Техникалар куйиб қолишидан хавотирдамиз.',
    textSource: 'text', mahallaIndex: 1, minsAgo: 12, keyword: 'elektr',
    shortLabel: 'Электр таъминотидаги тез-тез ўчишлар ва кучланишнинг жуда пастлигидан шикоят қилишмоқда.',
  },
  {
    updateIdOffset: 10,
    category: 'electricity', hokimRelated: false,
    senderName: 'Отабек Мирзаев', senderUsername: null,
    text: 'Маҳалламизда кучланиш жуда паст. Кондиционерлар ва музлатгичлар умуман ишламаяпти.',
    textSource: 'text', mahallaIndex: 1, minsAgo: 32, keyword: 'svet',
    shortLabel: 'Электр таъминотидаги тез-тез ўчишлар ва кучланишнинг жуда пастлигидан шикоят қилишмоқда.',
  },
  {
    updateIdOffset: 12,
    category: 'electricity', hokimRelated: false,
    senderName: 'Камола Раҳимова', senderUsername: null,
    text: 'Кечаси соат 22:00 дан кейин узоқ муддатга электр ўчди. Муаммо нимада эканлигини ким билади?',
    textSource: 'text', mahallaIndex: 1, minsAgo: 140, keyword: 'svet',
    shortLabel: 'Электр таъминотидаги тез-тез ўчишлар ва кучланишнинг жуда пастлигидан шикоят қилишмоқда.',
  },
  // Single electricity signal in Navbahor
  {
    updateIdOffset: 11,
    category: 'electricity', hokimRelated: false,
    senderName: 'Барно Содиқова', senderUsername: 'barno_s',
    text: 'Трансформатор яқинида қаттиқ учқун чиқяпти, овоз келяпти. Жуда хавфли ҳолат, тезда келиб кўринг.',
    textSource: 'caption', mahallaIndex: 0, minsAgo: 85, keyword: 'elektr',
    shortLabel: 'Трансформатор яқинида учқун чиқиб, авариявий хавфли ҳолат юзага келгани айтилмоқда.',
  },

  // ── Gaz (Gas) ───────────────────────────────────────────────────────────
  // Group 3: Bogiston MFY (mahallaIndex: 2) - Gas (2 signals collapsed)
  {
    updateIdOffset: 13,
    category: 'gas', hokimRelated: false,
    senderName: 'Дилшод Эргашев', senderUsername: 'dilshod_e',
    text: 'Газ босими жуда паст, овқат пишириш умуман имконсиз бўляпти. Иситиш тизими ҳам ишламаяпти.',
    textSource: 'text', mahallaIndex: 2, minsAgo: 9, keyword: 'gaz',
    shortLabel: 'Табиий газ босими пастлиги туфайли иситиш тизими ишламаётгани айтилмоқда.',
  },
  {
    updateIdOffset: 16,
    category: 'gas', hokimRelated: false,
    senderName: 'Муҳаббат Юлдошева', senderUsername: null,
    text: 'Суюлтирилган газ баллонлари узоқ вақтдан бери маҳаллага олиб келинмади. Таъминот тўхтаб қолган.',
    textSource: 'text', mahallaIndex: 2, minsAgo: 115, keyword: 'gaz',
    shortLabel: 'Табиий газ босими пастлиги туфайли иситиш тизими ишламаётгани айтилмоқда.',
  },
  // Single gas signals in Navbahor and Olmazor
  {
    updateIdOffset: 14,
    category: 'gas', hokimRelated: false,
    senderName: 'Нодира Алимова', senderUsername: null,
    text: 'Подъездимизда кучли газ ҳиди сезиляпти. Жуда хавотирли. Илтимос, тезроқ текшириб беринг.',
    textSource: 'text', mahallaIndex: 0, minsAgo: 22, keyword: 'gaz',
    shortLabel: 'Турар-жой биноси подъездида кучли газ ҳиди сезилаётгани бўйича хавотир билдирилмоқда.',
  },
  {
    updateIdOffset: 15,
    category: 'gas', hokimRelated: false,
    senderName: 'Сардор Раҳмонов', senderUsername: 'sardor_r',
    text: 'Газ плита доимий равишда ўчиб қоляпти. Бу авариявий ҳолатми ёки босим пастлигиданми?',
    textSource: 'caption', mahallaIndex: 1, minsAgo: 50, keyword: 'gaz',
    shortLabel: 'Газ плиталари ва тизимларда босим доимий равишда пасайиб кетаётгани айтилмоқда.',
  },

  // ── Chiqindi (Waste) ────────────────────────────────────────────────────
  {
    updateIdOffset: 17,
    category: 'waste', hokimRelated: false,
    senderName: 'Фарҳод Каримов', senderUsername: 'farhod_k',
    text: 'Маҳалламизда чиқиндилар вақтида олиб кетилмаяпти. Ҳидланиб кетган, санитария ҳолати жуда ёмон.',
    textSource: 'text', mahallaIndex: 0, minsAgo: 18, keyword: 'chiqindi',
    shortLabel: 'Маҳаллада маиший чиқиндиларни ташиб кетиш графиги бузилаётгани кузатилмоқда.',
  },
  {
    updateIdOffset: 18,
    category: 'waste', hokimRelated: false,
    senderName: 'Раъно Усмонова', senderUsername: null,
    text: 'Контейнерлар тўлиб кетган, ахлатлар атрофга сочилиб ётибди. Кўча жуда ифлос аҳволда.',
    textSource: 'caption', mahallaIndex: 1, minsAgo: 48, keyword: 'chiqindi',
    shortLabel: 'Чиқинди контейнерлари тўлиб-тошиб, атрофга сочилиб кетганидан шикоят қилишмоқда.',
  },
  {
    updateIdOffset: 19,
    category: 'waste', hokimRelated: false,
    senderName: 'Элёр Алиев', senderUsername: 'elyor_a',
    text: 'Қурилиш чиқиндилари йўл четига тўкиб кетилган. Кўчани тозалаш чоралари кўрилсин.',
    textSource: 'text', mahallaIndex: 2, minsAgo: 92, keyword: 'chiqindi',
    shortLabel: 'Йўл четига қурилиш чиқиндилари ноқонуний равишда тўкиб кетилгани айтилмоқда.',
  },
  {
    updateIdOffset: 20,
    category: 'waste', hokimRelated: false,
    senderName: 'Гулчеҳра Назарова', senderUsername: null,
    text: 'Чиқинди ташувчи машиналар жуда кам келяпти. Навбат узун, одамлар норози бўлмоқда.',
    textSource: 'text', mahallaIndex: 0, minsAgo: 150, keyword: 'chiqindi',
    shortLabel: 'Ҳудудда маиший чиқинди ташувчи техникалар етишмовчилиги бўйича норозилик кузатилмоқда.',
  },
]

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Signal seed is disabled in production')
  }

  // Load district + mahallas
  const district = await prisma.district.findFirst({
    where: { name: 'Yunusobod tumani' },
    include: { mahallas: { orderBy: { id: 'asc' } } },
  })

  if (!district) {
    throw new Error('District not found. Run `pnpm db:seed` first to create base data.')
  }
  if (district.mahallas.length < 3) {
    throw new Error('Need at least 3 mahallas. Run `pnpm db:seed` first.')
  }

  const mahallas = district.mahallas

  // Base update ID far above the real telegram range for dev purposes
  const BASE_UPDATE_ID = 9_100_000

  // Optional: clear existing dev signals first to start with a fresh, clean set of 20
  await prisma.signalMessage.deleteMany({
    where: {
      telegram_update_id: {
        gte: BASE_UPDATE_ID,
        lte: BASE_UPDATE_ID + 100
      }
    }
  })
  console.log('Cleared existing seeded signals to avoid duplicates.')

  let created = 0
  let skipped = 0

  for (const s of signals) {
    const updateId = BASE_UPDATE_ID + s.updateIdOffset
    const mahalla  = mahallas[s.mahallaIndex]!
    const ts       = minutesAgo(s.minsAgo)

    try {
      await prisma.signalMessage.upsert({
        where: {
          telegram_update_id_category: {
            telegram_update_id: updateId,
            category:           s.category,
          },
        },
        update: {},
        create: {
          telegram_update_id:  updateId,
          telegram_message_id: 10_000 + s.updateIdOffset,
          district_id:         district.id,
          mahalla_id:          mahalla.id,
          sender_display_name: s.senderName,
          sender_username:     s.senderUsername,
          telegram_timestamp:  ts,
          raw_text:            s.text,
          text_source:         s.textSource,
          category:            s.category,
          hokim_related:       s.hokimRelated,
          keyword_matched:     s.keyword !== null,
          matched_keyword:     s.keyword,
          short_label:         s.shortLabel,
          classified_at:       new Date(ts.getTime() + 5_000), // 5s after message
        },
      })
      created++
      console.log(`  ✓ [${s.category.padEnd(11)}] ${s.senderName ?? '@' + (s.senderUsername ?? 'Резидент')} — ${s.text.slice(0, 50)}…`)
    } catch (err) {
      console.warn(`  ⚠ Skipped update_id=${updateId}:`, err)
      skipped++
    }
  }

  console.log(`\n✅ Done — ${created} signals inserted, ${skipped} skipped.`)
  console.log('   Refresh the dashboard to see the cards.')
}

main()
  .catch((err: unknown) => {
    console.error('❌ Seed failed:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
