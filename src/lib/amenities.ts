/** Free amenities offered as checkboxes in the owner's editor (the most common ones on the old site). */
export const AMENITY_OPTIONS = [
  "Wi-Fi", "Парковка", "Бассейн", "Детская площадка", "Постельное бельё", "Полотенце", "Туалетные принадлежности",
  "Фен", "Утюг", "Сушилка", "Посуда", "Место для приготовления пищи", "Мангал с шампурами", "Обмен валют",
  "Пирс", "Зонтик", "Шезлонги", "Настольный теннис", "Футбольное поле", "Детская комната", "Кондиционер",
  "Холодильник", "Телевизор", "Трансфер",
];

export interface PaidService { name: string; price: number | null; text?: string }
