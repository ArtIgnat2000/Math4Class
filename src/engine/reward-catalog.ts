// ── Каталог наград «Числа»: скины и вещи ────────────────────────────────────
//
// Источник каталога — витрина проекта «СЛОВО 2.0» (github.com/ArtIgnat2000/slovo2,
// коммит 112febfff2ec344ba9accf7ecd1465580dd93390 от 1 ноября 2026):
// src/engine/shop.ts, полки «Наряды» и «Техника». Перенесены ВСЕ 102 вещи
// (38 нарядов-скинов и 64 техники, питомцев, спорта, вкусняшек и школьных
// предметов), названия сохранены. Картинки — public/rewards/<id>.webp
// (исходные public/products/<id>.webp, уменьшены до 480×360).
//
// В «Слове» вещи покупались за кристаллы. Здесь валюты нет: вещь открывается
// за пройденные занятия, и чем больше занятий — тем больше наград. Порядок
// выдачи — по цене исходной витрины (дешёвые и обычные раньше, дорогие и
// ТОПОВЫЕ позже). `price` оставлена для сверки с источником и для проверки
// порядка; в интерфейсе она не показывается.
//
// Лестница (need → сколько вещей открывается на этом занятии) задана в
// REWARD_TIERS и проверяется тестами: сумма = числу вещей, пороги возрастают,
// ни один порог не пропускает вещь без награды.

/** Полка коллекции: наряды на маскота и отдельные полки техники. */
export type RewardShelf =
  'outfits' | 'car' | 'plane' | 'ship' | 'tech' | 'pet' | 'sport' | 'food' | 'school';

/** Наряд (скин) или вещь. */
export type RewardKind = 'outfit' | 'toy';

export interface RewardItem {
  /** id из витрины «Слова»: по нему лежит картинка public/rewards/<id>.webp */
  id: string;
  title: string;
  shelf: RewardShelf;
  kind: RewardKind;
  /** Цена в кристаллах в исходной витрине — только для сверки порядка. */
  price: number;
  /** На каком по счёту пройденном занятии открывается награда. */
  need: number;
}

export interface RewardShelfInfo {
  id: RewardShelf;
  title: string;
}

/** Полки витрины в порядке показа: сначала наряды, потом техника. */
export const REWARD_SHELVES: RewardShelfInfo[] = [
  { id: 'outfits', title: 'Наряды' },
  { id: 'car', title: 'Авто' },
  { id: 'plane', title: 'Самолёты' },
  { id: 'ship', title: 'Корабли' },
  { id: 'tech', title: 'Техника' },
  { id: 'pet', title: 'Питомцы' },
  { id: 'sport', title: 'Спорт' },
  { id: 'food', title: 'Вкусняшки' },
  { id: 'school', title: 'Школа' },
];

/**
 * Лестница наград: порог в пройденных занятиях и сколько вещей он открывает.
 * Первые двадцать занятий дают по одной награде — ребёнок видит бонус сразу
 * и без пропусков. Дальше наборы растут: 200-е занятие закрывает коллекцию.
 */
export const REWARD_TIERS: { need: number; count: number }[] = [
  { need: 1, count: 1 },
  { need: 2, count: 1 },
  { need: 3, count: 1 },
  { need: 4, count: 1 },
  { need: 5, count: 1 },
  { need: 6, count: 1 },
  { need: 7, count: 1 },
  { need: 8, count: 1 },
  { need: 9, count: 1 },
  { need: 10, count: 1 },
  { need: 11, count: 1 },
  { need: 12, count: 1 },
  { need: 13, count: 1 },
  { need: 14, count: 1 },
  { need: 15, count: 1 },
  { need: 16, count: 1 },
  { need: 17, count: 1 },
  { need: 18, count: 1 },
  { need: 19, count: 1 },
  { need: 20, count: 1 },
  { need: 23, count: 3 },
  { need: 26, count: 3 },
  { need: 30, count: 3 },
  { need: 34, count: 3 },
  { need: 40, count: 3 },
  { need: 46, count: 4 },
  { need: 52, count: 4 },
  { need: 58, count: 4 },
  { need: 66, count: 4 },
  { need: 75, count: 4 },
  { need: 85, count: 5 },
  { need: 95, count: 5 },
  { need: 105, count: 5 },
  { need: 118, count: 5 },
  { need: 132, count: 5 },
  { need: 150, count: 7 },
  { need: 170, count: 7 },
  { need: 200, count: 8 },
];

/** Все награды в порядке выдачи: от первой (1 занятие) до последней (200). */
export const REWARD_ITEMS: RewardItem[] = [
  {
    id: 'clips-stars',
    title: 'Заколки-звёздочки',
    shelf: 'outfits',
    kind: 'outfit',
    price: 15,
    need: 1,
  },
  { id: 'food-icecream', title: 'Мороженое', shelf: 'food', kind: 'toy', price: 15, need: 2 },
  { id: 'school-pin', title: 'Значок школы', shelf: 'outfits', kind: 'outfit', price: 15, need: 3 },
  { id: 'food-donut', title: 'Пончик', shelf: 'food', kind: 'toy', price: 18, need: 4 },
  {
    id: 'badge-cat',
    title: 'Значок с котиком',
    shelf: 'outfits',
    kind: 'outfit',
    price: 20,
    need: 5,
  },
  { id: 'bow', title: 'Бантик', shelf: 'outfits', kind: 'outfit', price: 20, need: 6 },
  { id: 'cap', title: 'Кепка', shelf: 'outfits', kind: 'outfit', price: 20, need: 7 },
  { id: 'choker', title: 'Лента на шею', shelf: 'outfits', kind: 'outfit', price: 20, need: 8 },
  { id: 'food-kulich', title: 'Куличик', shelf: 'food', kind: 'toy', price: 20, need: 9 },
  { id: 'school-cap', title: 'Кепка школы', shelf: 'outfits', kind: 'outfit', price: 20, need: 10 },
  {
    id: 'bracelet-beads',
    title: 'Браслет с бусинами',
    shelf: 'outfits',
    kind: 'outfit',
    price: 25,
    need: 11,
  },
  { id: 'hair-ponytail', title: 'Хвостик', shelf: 'outfits', kind: 'outfit', price: 25, need: 12 },
  { id: 'pet-hamster', title: 'Хомяк', shelf: 'pet', kind: 'toy', price: 25, need: 13 },
  { id: 'phone-smart', title: 'iPhone Air', shelf: 'tech', kind: 'toy', price: 25, need: 14 },
  { id: 'sport-ball', title: 'Футбольный мяч', shelf: 'sport', kind: 'toy', price: 25, need: 15 },
  {
    id: 'wreath',
    title: 'Венок из ромашек',
    shelf: 'outfits',
    kind: 'outfit',
    price: 25,
    need: 16,
  },
  {
    id: 'bracelet-heart',
    title: 'Браслет с сердечком',
    shelf: 'outfits',
    kind: 'outfit',
    price: 30,
    need: 17,
  },
  {
    id: 'brooch-flower',
    title: 'Брошь-цветок',
    shelf: 'outfits',
    kind: 'outfit',
    price: 30,
    need: 18,
  },
  { id: 'food-cake', title: 'Тортик', shelf: 'food', kind: 'toy', price: 30, need: 19 },
  {
    id: 'glasses-heart',
    title: 'Очки-сердечки',
    shelf: 'outfits',
    kind: 'outfit',
    price: 30,
    need: 20,
  },
  {
    id: 'hair-buns',
    title: 'Пучки с бантами',
    shelf: 'outfits',
    kind: 'outfit',
    price: 30,
    need: 23,
  },
  {
    id: 'pendant-heart',
    title: 'Кулон-сердечко',
    shelf: 'outfits',
    kind: 'outfit',
    price: 30,
    need: 23,
  },
  { id: 'phone-flip', title: 'iPhone 17', shelf: 'tech', kind: 'toy', price: 30, need: 23 },
  { id: 'scarf', title: 'Шарфик', shelf: 'outfits', kind: 'outfit', price: 30, need: 26 },
  {
    id: 'school-scarf',
    title: 'Шарф в триколоре',
    shelf: 'outfits',
    kind: 'outfit',
    price: 30,
    need: 26,
  },
  { id: 'sport-dumbbell', title: 'Гантели', shelf: 'sport', kind: 'toy', price: 30, need: 26 },
  { id: 'car-racer', title: 'Болид', shelf: 'car', kind: 'toy', price: 35, need: 30 },
  { id: 'glasses', title: 'Умные очки', shelf: 'outfits', kind: 'outfit', price: 35, need: 30 },
  {
    id: 'glasses-round',
    title: 'Круглые очки',
    shelf: 'outfits',
    kind: 'outfit',
    price: 35,
    need: 30,
  },
  {
    id: 'hair-curls',
    title: 'Весёлые кудри',
    shelf: 'outfits',
    kind: 'outfit',
    price: 35,
    need: 34,
  },
  {
    id: 'hat-ribbon',
    title: 'Шляпка с лентой',
    shelf: 'outfits',
    kind: 'outfit',
    price: 35,
    need: 34,
  },
  {
    id: 'pendant-star',
    title: 'Кулон-звёздочка',
    shelf: 'outfits',
    kind: 'outfit',
    price: 35,
    need: 34,
  },
  { id: 'pet-chihuahua', title: 'Чихуахуа', shelf: 'pet', kind: 'toy', price: 35, need: 40 },
  { id: 'school-mug', title: 'Кружка «НААШ»', shelf: 'school', kind: 'toy', price: 35, need: 40 },
  {
    id: 'shoes-pink',
    title: 'Розовые туфельки',
    shelf: 'outfits',
    kind: 'outfit',
    price: 35,
    need: 40,
  },
  {
    id: 'sport-racket',
    title: 'Теннисная ракетка',
    shelf: 'sport',
    kind: 'toy',
    price: 35,
    need: 46,
  },
  { id: 'sport-skate', title: 'Скейт', shelf: 'sport', kind: 'toy', price: 35, need: 46 },
  { id: 'bag', title: 'Сумочка', shelf: 'outfits', kind: 'outfit', price: 40, need: 46 },
  { id: 'car-jeep', title: 'Скалолаз', shelf: 'car', kind: 'toy', price: 40, need: 46 },
  { id: 'pet-bunny', title: 'Кролик', shelf: 'pet', kind: 'toy', price: 40, need: 52 },
  { id: 'skates-ice', title: 'Коньки', shelf: 'outfits', kind: 'outfit', price: 40, need: 52 },
  {
    id: 'bag-pink',
    title: 'Розовая сумочка',
    shelf: 'outfits',
    kind: 'outfit',
    price: 45,
    need: 52,
  },
  { id: 'beads', title: 'Бусы', shelf: 'outfits', kind: 'outfit', price: 45, need: 52 },
  {
    id: 'glasses-sigma',
    title: 'Очки «Сигма»',
    shelf: 'outfits',
    kind: 'outfit',
    price: 45,
    need: 58,
  },
  { id: 'medal', title: 'Медаль', shelf: 'outfits', kind: 'outfit', price: 45, need: 58 },
  { id: 'pet-cat', title: 'Котёнок', shelf: 'pet', kind: 'toy', price: 45, need: 58 },
  {
    id: 'school-hoodie',
    title: 'Худи школы',
    shelf: 'outfits',
    kind: 'outfit',
    price: 45,
    need: 58,
  },
  {
    id: 'shoes-sparkle',
    title: 'Блестящие туфли',
    shelf: 'outfits',
    kind: 'outfit',
    price: 45,
    need: 66,
  },
  { id: 'car-taxi', title: 'Жёлтый кэб', shelf: 'car', kind: 'toy', price: 50, need: 66 },
  {
    id: 'dress-rainbow',
    title: 'Радужное платье',
    shelf: 'outfits',
    kind: 'outfit',
    price: 50,
    need: 66,
  },
  {
    id: 'pet-cat-scottish',
    title: 'Шотландский кот',
    shelf: 'pet',
    kind: 'toy',
    price: 50,
    need: 66,
  },
  { id: 'pet-cat-siamese', title: 'Сиамский кот', shelf: 'pet', kind: 'toy', price: 50, need: 75 },
  { id: 'car-mercedes', title: 'Звезда', shelf: 'car', kind: 'toy', price: 55, need: 75 },
  {
    id: 'dress-pink',
    title: 'Розовое платье',
    shelf: 'outfits',
    kind: 'outfit',
    price: 55,
    need: 75,
  },
  {
    id: 'pet-cat-british',
    title: 'Британский кот',
    shelf: 'pet',
    kind: 'toy',
    price: 55,
    need: 75,
  },
  { id: 'pet-panda', title: 'Панда', shelf: 'pet', kind: 'toy', price: 55, need: 85 },
  { id: 'pet-poodle', title: 'Пудель', shelf: 'pet', kind: 'toy', price: 55, need: 85 },
  {
    id: 'phone-retro',
    title: 'iPhone 17 Pro Max',
    shelf: 'tech',
    kind: 'toy',
    price: 55,
    need: 85,
  },
  {
    id: 'school-backpack',
    title: 'Рюкзак «Школа»',
    shelf: 'school',
    kind: 'toy',
    price: 55,
    need: 85,
  },
  { id: 'ship-paper', title: 'Морская яхта', shelf: 'ship', kind: 'toy', price: 55, need: 85 },
  { id: 'car-bmw', title: 'Стрела', shelf: 'car', kind: 'toy', price: 60, need: 95 },
  {
    id: 'car-pink-cabrio',
    title: 'Розовая машина',
    shelf: 'car',
    kind: 'toy',
    price: 60,
    need: 95,
  },
  { id: 'grad', title: 'Шапочка магистра', shelf: 'outfits', kind: 'outfit', price: 60, need: 95 },
  { id: 'pet-cat-sphynx', title: 'Сфинкс', shelf: 'pet', kind: 'toy', price: 60, need: 95 },
  { id: 'pet-corgi', title: 'Корги', shelf: 'pet', kind: 'toy', price: 60, need: 95 },
  {
    id: 'wings-butterfly',
    title: 'Крылья бабочки',
    shelf: 'outfits',
    kind: 'outfit',
    price: 60,
    need: 105,
  },
  { id: 'car-brabus', title: 'Кубик', shelf: 'car', kind: 'toy', price: 65, need: 105 },
  { id: 'car-pink-star', title: 'Розовая звезда', shelf: 'car', kind: 'toy', price: 65, need: 105 },
  {
    id: 'dress-star',
    title: 'Платье со звёздами',
    shelf: 'outfits',
    kind: 'outfit',
    price: 65,
    need: 105,
  },
  {
    id: 'headphones-max',
    title: 'Серебряный Max',
    shelf: 'tech',
    kind: 'toy',
    price: 65,
    need: 105,
  },
  { id: 'pet-cat-mainecoon', title: 'Мейн-кун', shelf: 'pet', kind: 'toy', price: 65, need: 118 },
  { id: 'car-maybach', title: 'Адмирал', shelf: 'car', kind: 'toy', price: 70, need: 118 },
  { id: 'crown', title: 'Корона', shelf: 'outfits', kind: 'outfit', price: 70, need: 118 },
  { id: 'ship-sail', title: 'Контейнеровоз', shelf: 'ship', kind: 'toy', price: 70, need: 118 },
  { id: 'pet-elephant', title: 'Слонёнок', shelf: 'pet', kind: 'toy', price: 75, need: 118 },
  { id: 'phone-pro', title: 'iPhone 17 Pro', shelf: 'tech', kind: 'toy', price: 75, need: 132 },
  {
    id: 'wings-dragon',
    title: 'Крылья дракона',
    shelf: 'outfits',
    kind: 'outfit',
    price: 75,
    need: 132,
  },
  { id: 'car-rolls', title: 'Лорд', shelf: 'car', kind: 'toy', price: 80, need: 132 },
  { id: 'car-lambo', title: 'Бык', shelf: 'car', kind: 'toy', price: 85, need: 132 },
  { id: 'phone-18', title: 'iPhone 18', shelf: 'tech', kind: 'toy', price: 85, need: 132 },
  { id: 'ship-steam', title: 'Супертанкер', shelf: 'ship', kind: 'toy', price: 85, need: 150 },
  { id: 'car-bugatti', title: 'Молния', shelf: 'car', kind: 'toy', price: 90, need: 150 },
  { id: 'plane-swift', title: 'Стриж', shelf: 'plane', kind: 'toy', price: 90, need: 150 },
  { id: 'car-tesla', title: 'Тесла', shelf: 'car', kind: 'toy', price: 95, need: 150 },
  { id: 'phone-18-air', title: 'iPhone 18 Air', shelf: 'tech', kind: 'toy', price: 95, need: 150 },
  {
    id: 'tv-cinema',
    title: 'Домашний кинотеатр',
    shelf: 'tech',
    kind: 'toy',
    price: 95,
    need: 150,
  },
  { id: 'car-electron-base', title: 'Импульс', shelf: 'car', kind: 'toy', price: 100, need: 150 },
  { id: 'ship-carrier', title: 'Авианосец', shelf: 'ship', kind: 'toy', price: 100, need: 170 },
  { id: 'ship-titanic', title: 'Титаник', shelf: 'ship', kind: 'toy', price: 105, need: 170 },
  { id: 'car-pink-tank', title: 'Розовый танк', shelf: 'car', kind: 'toy', price: 110, need: 170 },
  { id: 'laptop-air', title: 'Невесомый Air', shelf: 'tech', kind: 'toy', price: 110, need: 170 },
  { id: 'car-arctic-base', title: 'Полярник', shelf: 'car', kind: 'toy', price: 115, need: 170 },
  { id: 'car-atomic-base', title: 'Квант', shelf: 'car', kind: 'toy', price: 120, need: 170 },
  { id: 'phone-18-pro', title: 'iPhone 18 Pro', shelf: 'tech', kind: 'toy', price: 120, need: 170 },
  { id: 'car-steam-base', title: 'Огнедышащий', shelf: 'car', kind: 'toy', price: 130, need: 200 },
  { id: 'car-moon-base', title: 'Луноход', shelf: 'car', kind: 'toy', price: 140, need: 200 },
  {
    id: 'phone-18-max',
    title: 'iPhone 18 Pro Max',
    shelf: 'tech',
    kind: 'toy',
    price: 140,
    need: 200,
  },
  {
    id: 'plane-electron-base',
    title: 'Схемолёт',
    shelf: 'plane',
    kind: 'toy',
    price: 160,
    need: 200,
  },
  {
    id: 'plane-arctic-base',
    title: 'Северный ветер',
    shelf: 'plane',
    kind: 'toy',
    price: 175,
    need: 200,
  },
  { id: 'plane-steam-base', title: 'Паролёт', shelf: 'plane', kind: 'toy', price: 190, need: 200 },
  {
    id: 'plane-moon-base',
    title: 'Лунный орёл',
    shelf: 'plane',
    kind: 'toy',
    price: 200,
    need: 200,
  },
  {
    id: 'plane-atomic-base',
    title: 'Атомный дозор',
    shelf: 'plane',
    kind: 'toy',
    price: 230,
    need: 200,
  },
];
