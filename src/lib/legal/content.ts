// Privacy policy and terms of use (Uzbek + Russian).
// Describes what the app actually stores and who processes it.
// Not legal advice: have a lawyer review before relying on it.

export interface LegalDoc { title: string; updated: string; intro: string; sections: Array<{ h: string; p: string[] }> }

const CONTACT_UZ = "Telegram: @behruz_sk, email: behryzmamajon@gmail.com";
const CONTACT_RU = CONTACT_UZ;

export const PRIVACY: Record<"uz" | "ru", LegalDoc> = {
  uz: {
    title: "Maxfiylik siyosati",
    updated: "Yangilangan: 13-noyabr, 2026",
    intro: "Ushbu siyosat Idrok Business ilovasi va saytida (idrok-business.onrender.com va Android ilovasi) qanday ma’lumotlar to‘planishi, nima uchun ishlatilishi va qanday himoyalanishini tushuntiradi. Ilova faqat 18 yosh va undan katta foydalanuvchilar uchun.",
    sections: [
      { h: "Qanday ma’lumotlarni saqlaymiz", p: [
        "Hisob: ism, email va parol (parol shifrlangan holda saqlanadi, biz uni ko‘ra olmaymiz).",
        "Siz kiritgan ma’lumotlar: mahsulotlar va ularning narx-xarajatlari, xarajatlar, tasdiqlash so‘rovlari, darslardagi jarayon.",
        "AI yordamchilariga yozgan so‘rovlaringiz va ularning javoblari.",
        "Faoliyat jurnali: mahsulot qo‘shish, o‘zgartirish va shunga o‘xshash harakatlar vaqti.",
        "Qurilmangizda: til, mavzu va boshqa sozlamalar (brauzer xotirasida).",
      ] },
      { h: "Nima uchun ishlatamiz", p: [
        "Ilova ishlashi uchun: hisobingizga kirish, ma’lumotlaringizni saqlash va ko‘rsatish, foyda hisoblari, daraja qoidalari.",
        "AI yordamchilari ishlashi uchun: so‘rovingiz va kerakli ma’lumotlaringiz (mahsulotlar, daraja qoidalari) javob tayyorlash uchun AI xizmatiga yuboriladi.",
        "Xavfsizlik va xatolarni tuzatish uchun.",
        "Biz reklama ko‘rsatmaymiz va ma’lumotlaringizni sotmaymiz.",
      ] },
      { h: "Kimlar ma’lumotlarni qayta ishlaydi", p: [
        "Supabase: ma’lumotlar bazasi va hisoblar (serverlar Hindistonda, Mumbay).",
        "Render: sayt va ilova serveri (Germaniya, Frankfurt).",
        "Anthropic: AI yordamchilari (AQSh). Faqat AI yordamchisidan foydalanganingizda.",
        "Bu xizmatlar ma’lumotlarni faqat ilova ishlashi uchun, o‘z shartlari asosida qayta ishlaydi.",
      ] },
      { h: "Ma’lumotlarni saqlash muddati", p: [
        "Hisobingiz mavjud ekan, ma’lumotlaringiz saqlanadi. Hisobni o‘chirsangiz, barcha ma’lumotlaringiz darhol o‘chiriladi.",
      ] },
      { h: "Sizning huquqlaringiz", p: [
        "Ma’lumotlaringizni ilovada ko‘rish va o‘zgartirish.",
        "Hisobingizni va barcha ma’lumotlaringizni o‘chirish: Sozlamalar → Hisobni o‘chirish yoki /delete-account sahifasi.",
        "Savollar bo‘yicha biz bilan bog‘lanish.",
      ] },
      { h: "Xavfsizlik", p: [
        "Har bir foydalanuvchi faqat o‘z ma’lumotlarini ko‘ra oladi (ma’lumotlar bazasi darajasidagi himoya). Aloqa shifrlangan (HTTPS).",
      ] },
      { h: "O‘zgarishlar", p: ["Siyosat o‘zgarsa, shu sahifada yangilangan sana bilan e’lon qilamiz."] },
      { h: "Aloqa", p: [CONTACT_UZ] },
    ],
  },
  ru: {
    title: "Политика конфиденциальности",
    updated: "Обновлено: 13 ноября 2026",
    intro: "Эта политика объясняет, какие данные собирает приложение и сайт Idrok Business (idrok-business.onrender.com и Android-приложение), зачем они используются и как защищаются. Приложение предназначено только для пользователей от 18 лет.",
    sections: [
      { h: "Какие данные мы храним", p: [
        "Аккаунт: имя, email и пароль (пароль хранится в зашифрованном виде, мы его не видим).",
        "Данные, которые вы вносите: товары и их цены и расходы, расходы, запросы на одобрение, прогресс в уроках.",
        "Ваши запросы к ИИ-помощникам и их ответы.",
        "Журнал действий: время добавления и изменения товаров и подобных действий.",
        "На вашем устройстве: язык, тема и другие настройки (в памяти браузера).",
      ] },
      { h: "Зачем мы их используем", p: [
        "Для работы приложения: вход в аккаунт, хранение и показ ваших данных, расчёт прибыли, правила уровней.",
        "Для работы ИИ-помощников: ваш запрос и нужные данные (товары, правила уровня) отправляются в ИИ-сервис, чтобы подготовить ответ.",
        "Для безопасности и исправления ошибок.",
        "Мы не показываем рекламу и не продаём ваши данные.",
      ] },
      { h: "Кто обрабатывает данные", p: [
        "Supabase: база данных и аккаунты (серверы в Индии, Мумбаи).",
        "Render: сервер сайта и приложения (Германия, Франкфурт).",
        "Anthropic: ИИ-помощники (США). Только когда вы пользуетесь ИИ-помощником.",
        "Эти сервисы обрабатывают данные только для работы приложения, на своих условиях.",
      ] },
      { h: "Срок хранения", p: [
        "Данные хранятся, пока существует ваш аккаунт. При удалении аккаунта все ваши данные удаляются сразу.",
      ] },
      { h: "Ваши права", p: [
        "Просматривать и изменять свои данные в приложении.",
        "Удалить аккаунт и все данные: Настройки → Удалить аккаунт или страница /delete-account.",
        "Связаться с нами по любым вопросам.",
      ] },
      { h: "Безопасность", p: [
        "Каждый пользователь видит только свои данные (защита на уровне базы данных). Соединение зашифровано (HTTPS).",
      ] },
      { h: "Изменения", p: ["Если политика изменится, мы опубликуем её на этой странице с новой датой."] },
      { h: "Контакты", p: [CONTACT_RU] },
    ],
  },
};

export const TERMS: Record<"uz" | "ru", LegalDoc> = {
  uz: {
    title: "Foydalanish shartlari",
    updated: "Yangilangan: 13-noyabr, 2026",
    intro: "Idrok Business’dan foydalanish orqali siz ushbu shartlarga rozilik bildirasiz.",
    sections: [
      { h: "Kim foydalana oladi", p: ["Ilova faqat 18 yosh va undan katta foydalanuvchilar uchun. Ro‘yxatdan o‘tishda bu shartni tasdiqlaysiz."] },
      { h: "Xizmat nima", p: [
        "Idrok Business mahsulot tanlash, foyda va xarajatlarni hisoblash, xarid qarorlarini yozib borish va o‘qish uchun vosita.",
        "Idrok hech narsa sotib olmaydi, to‘lov qilmaydi va siz nomingizdan shartnoma tuzmaydi. Barcha xarid va biznes qarorlarini o‘zingiz qabul qilasiz.",
      ] },
      { h: "Maslahat emas", p: [
        "Ilovadagi hisoblar, darslar va AI javoblari umumiy ma’lumot uchun. Ular moliyaviy, yuridik yoki soliq maslahati emas.",
        "AI xato qilishi mumkin. Muhim raqamlar va qoidalarni rasmiy manbalardan tekshiring.",
      ] },
      { h: "Sizning majburiyatlaringiz", p: [
        "Hisobingiz ma’lumotlarini sir saqlash.",
        "Amazon, Uzum Market va boshqa platformalar qoidalariga, shuningdek amaldagi qonunlarga rioya qilish.",
        "Ilovadan qonunga zid yoki boshqalarga zarar yetkazadigan maqsadda foydalanmaslik.",
      ] },
      { h: "Daraja qoidalari", p: ["Daraja qoidalari (narx, byudjet, og‘irlik va boshqalar) xavfsiz boshlash uchun qo‘yilgan va ilova tomonidan majburiy tekshiriladi. Ularni administrator belgilaydi."] },
      { h: "Hisobni to‘xtatish", p: ["Shartlar buzilsa, hisobni to‘xtatishimiz mumkin. Siz hisobingizni istalgan vaqtda o‘chira olasiz."] },
      { h: "Javobgarlikni cheklash", p: ["Xizmat “boricha” taqdim etiladi. Qonun ruxsat bergan darajada, ilovadan foydalanish natijasidagi biznes yo‘qotishlari uchun javobgar emasmiz."] },
      { h: "O‘zgarishlar", p: ["Shartlar o‘zgarsa, shu sahifada yangilangan sana bilan e’lon qilamiz."] },
      { h: "Aloqa", p: [CONTACT_UZ] },
    ],
  },
  ru: {
    title: "Условия использования",
    updated: "Обновлено: 13 ноября 2026",
    intro: "Пользуясь Idrok Business, вы соглашаетесь с этими условиями.",
    sections: [
      { h: "Кто может пользоваться", p: ["Приложение только для пользователей от 18 лет. При регистрации вы подтверждаете это условие."] },
      { h: "Что это за сервис", p: [
        "Idrok Business — инструмент для выбора товаров, расчёта прибыли и расходов, учёта решений о покупках и обучения.",
        "Idrok ничего не покупает, не платит и не заключает договоры от вашего имени. Все решения о покупках и бизнесе вы принимаете сами.",
      ] },
      { h: "Это не консультация", p: [
        "Расчёты, уроки и ответы ИИ в приложении — общая информация. Это не финансовая, юридическая или налоговая консультация.",
        "ИИ может ошибаться. Проверяйте важные цифры и правила в официальных источниках.",
      ] },
      { h: "Ваши обязанности", p: [
        "Хранить данные своего аккаунта в тайне.",
        "Соблюдать правила Amazon, Uzum Market и других площадок, а также действующие законы.",
        "Не использовать приложение в незаконных целях или во вред другим.",
      ] },
      { h: "Правила уровней", p: ["Правила уровней (цена, бюджет, вес и другие) нужны для безопасного старта и обязательно проверяются приложением. Их устанавливает администратор."] },
      { h: "Блокировка аккаунта", p: ["При нарушении условий мы можем заблокировать аккаунт. Вы можете удалить свой аккаунт в любое время."] },
      { h: "Ограничение ответственности", p: ["Сервис предоставляется «как есть». В пределах, разрешённых законом, мы не отвечаем за деловые убытки от использования приложения."] },
      { h: "Изменения", p: ["Если условия изменятся, мы опубликуем их на этой странице с новой датой."] },
      { h: "Контакты", p: [CONTACT_RU] },
    ],
  },
};
