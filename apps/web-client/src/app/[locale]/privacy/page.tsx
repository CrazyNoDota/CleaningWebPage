import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/SiteHeader';

const CONTENT: Record<string, { title: string; updated: string; sections: Section[] }> = {
  ru: {
    title: 'Политика конфиденциальности',
    updated: 'Последнее обновление: 23 мая 2026 г.',
    sections: [
      {
        h: '1. Кто мы',
        p: 'Shinex («мы», «нас», «наш») — сервис уборки в Республике Казахстан. Настоящая политика описывает, какие персональные данные мы собираем при использовании мобильного приложения и сайта shinex.kz, как мы их используем и кому передаём.',
      },
      {
        h: '2. Какие данные мы собираем',
        list: [
          'Номер телефона — для входа в аккаунт и SMS-подтверждения.',
          'Имя и адрес электронной почты — если вы их указываете.',
          'Адрес уборки и контактные данные — для оказания услуги.',
          'Push-токен устройства (FCM/APNs) — для отправки уведомлений о статусе заказа.',
          'Информация о заказах, отзывы, история обращений.',
          'Технические данные: тип устройства, версия ОС, IP-адрес, журналы ошибок.',
        ],
      },
      {
        h: '3. Цели обработки',
        list: [
          'Регистрация и аутентификация (SMS-OTP).',
          'Создание и выполнение заказов, координация с клинерами.',
          'Push- и SMS-уведомления о статусе заказа.',
          'Поддержка пользователей и расследование инцидентов.',
          'Соблюдение законодательства РК (бухгалтерия, налогообложение).',
          'Предотвращение мошенничества и злоупотреблений.',
        ],
      },
      {
        h: '4. Кому мы передаём данные',
        list: [
          'Клинерам (исполнителям) — имя, телефон и адрес заказа, только для выполнения услуги.',
          'Mobizon — провайдер SMS, для доставки кодов подтверждения.',
          'Google Firebase Cloud Messaging — для доставки push-уведомлений.',
          'Платёжному провайдеру (при оплате онлайн) — необходимые реквизиты заказа.',
          'Государственным органам — по требованию закона.',
        ],
      },
      {
        h: '5. Хранение и удаление',
        p: 'Мы храним ваши данные пока активен аккаунт и в течение срока, установленного законодательством РК (в частности, по финансовой документации — 5 лет). Вы можете запросить удаление аккаунта, и мы удалим персональные данные за исключением сведений, которые обязаны сохранять по закону.',
      },
      {
        h: '6. Ваши права',
        list: [
          'Доступ к вашим данным.',
          'Исправление неточных данных.',
          'Удаление аккаунта и связанных данных.',
          'Отзыв согласия на push-уведомления (в настройках устройства или приложения).',
          'Жалоба в уполномоченный орган по защите персональных данных.',
        ],
      },
      {
        h: '7. Безопасность',
        p: 'Соединения шифруются по TLS. Пароли (если задаются) хранятся в виде криптографических хешей. Доступ к серверам ограничен и журналируется.',
      },
      {
        h: '8. Контакты',
        p: 'По вопросам обработки персональных данных пишите на developersdevelopers20@gmail.com. Адрес для официальной переписки указывается в договоре оказания услуг.',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: May 23, 2026.',
    sections: [
      {
        h: '1. Who we are',
        p: 'Shinex ("we", "us", "our") is a cleaning service operating in the Republic of Kazakhstan. This policy describes the personal data we collect when you use the mobile app and the shinex.kz website, how we use it, and with whom we share it.',
      },
      {
        h: '2. Data we collect',
        list: [
          'Phone number — for sign-in and SMS verification.',
          'Name and email — if you provide them.',
          'Cleaning address and contact details — to perform the service.',
          'Device push token (FCM/APNs) — to deliver order-status notifications.',
          'Orders, reviews, support history.',
          'Technical data: device type, OS version, IP address, error logs.',
        ],
      },
      {
        h: '3. Purposes',
        list: [
          'Account registration and SMS-OTP authentication.',
          'Creating and fulfilling orders, coordination with cleaners.',
          'Push and SMS notifications about order status.',
          'Customer support and incident investigation.',
          'Compliance with KZ law (accounting, taxes).',
          'Fraud and abuse prevention.',
        ],
      },
      {
        h: '4. Sharing',
        list: [
          'Cleaners — name, phone and order address, only to perform the service.',
          'Mobizon — SMS provider, for OTP delivery.',
          'Google Firebase Cloud Messaging — for push notification delivery.',
          'Payment provider (when paying online) — order data required for the charge.',
          'Authorities — when required by law.',
        ],
      },
      {
        h: '5. Retention and deletion',
        p: 'We keep your data while your account is active and for periods set by KZ law (financial records — 5 years). You may request account deletion; we will delete personal data except information we are legally required to retain.',
      },
      {
        h: '6. Your rights',
        list: [
          'Access your data.',
          'Correct inaccurate data.',
          'Delete your account and associated data.',
          'Withdraw push-notification consent (via device or app settings).',
          'Complain to the data-protection authority.',
        ],
      },
      {
        h: '7. Security',
        p: 'Connections are TLS-encrypted. Passwords (if set) are stored as cryptographic hashes. Server access is restricted and logged.',
      },
      {
        h: '8. Contact',
        p: 'For data-handling questions write to developersdevelopers20@gmail.com. The legal correspondence address is listed in the service agreement.',
      },
    ],
  },
  kk: {
    title: 'Құпиялылық саясаты',
    updated: 'Соңғы жаңарту: 23 мамыр 2026 ж.',
    sections: [
      {
        h: '1. Біз туралы',
        p: 'Shinex — Қазақстан Республикасындағы тазалау сервисі. Бұл саясат shinex.kz сайтын және мобильді қосымшаны пайдаланған кезде жинайтын дербес деректерді, оларды қалай қолданатынымызды және кіммен бөлісетінімізді сипаттайды.',
      },
      {
        h: '2. Жинайтын деректер',
        list: [
          'Телефон нөмірі — кіру және SMS растау үшін.',
          'Аты және электрондық пошта — өзіңіз көрсетсеңіз.',
          'Тазалау мекенжайы және байланыс мәліметтері — қызметті орындау үшін.',
          'Push-токен (FCM/APNs) — тапсырыс мәртебесі туралы хабарландырулар үшін.',
          'Тапсырыстар, пікірлер, өтініштер тарихы.',
          'Техникалық деректер: құрылғы, ОЖ нұсқасы, IP-мекенжай, қателер журналы.',
        ],
      },
      {
        h: '3. Өңдеу мақсаттары',
        list: [
          'Тіркеу және SMS-OTP аутентификация.',
          'Тапсырыстарды орындау, клинерлермен үйлестіру.',
          'Тапсырыс мәртебесі туралы push және SMS хабарлары.',
          'Қолдау және оқиғаларды тексеру.',
          'ҚР заңнамасын сақтау (бухгалтерия, салық).',
          'Алаяқтық пен теріс пайдалануды болдырмау.',
        ],
      },
      {
        h: '4. Деректерді кіммен бөлісеміз',
        list: [
          'Клинерлермен — қызметті орындау үшін аты, телефон және мекенжай.',
          'Mobizon — SMS жеткізу провайдері.',
          'Google Firebase Cloud Messaging — push хабарламаларын жеткізу.',
          'Онлайн төлеу кезінде — төлем провайдерімен.',
          'Заң бойынша уәкілетті органдармен.',
        ],
      },
      {
        h: '5. Сақтау және жою',
        p: 'Деректер аккаунт белсенді болғанда және ҚР заңнамасында белгіленген мерзімдерде (қаржы құжаттары — 5 жыл) сақталады. Аккаунтты жоюды сұрай аласыз; біз заң бойынша сақтауға міндетті ақпараттан басқа дербес деректерді жоямыз.',
      },
      {
        h: '6. Сіздің құқықтарыңыз',
        list: [
          'Деректеріңізге қол жеткізу.',
          'Дұрыс емес деректерді түзету.',
          'Аккаунт пен онымен байланысты деректерді жою.',
          'Push-хабарламалардан бас тарту (құрылғы немесе қосымша баптауларында).',
          'Дербес деректерді қорғау жөніндегі органға шағымдану.',
        ],
      },
      {
        h: '7. Қауіпсіздік',
        p: 'Қосылымдар TLS арқылы шифрланған. Құпиясөздер (бар болса) криптографиялық хэш ретінде сақталады. Серверлерге кіру шектеулі және журналға жазылады.',
      },
      {
        h: '8. Байланыс',
        p: 'Дербес деректер бойынша сұрақтарды developersdevelopers20@gmail.com мекенжайына жазыңыз.',
      },
    ],
  },
};

type Section = {
  h: string;
  p?: string;
  list?: string[];
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = CONTENT[locale] ?? CONTENT.ru!;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl px-4 md:px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900">{c.title}</h1>
        <p className="mt-2 text-sm text-ink-500">{c.updated}</p>
        <div className="mt-8 space-y-8 text-ink-700 leading-7">
          {c.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-bold text-ink-900">{s.h}</h2>
              {s.p && <p className="mt-2">{s.p}</p>}
              {s.list && (
                <ul className="mt-2 list-disc pl-6 space-y-1">
                  {s.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

export const metadata = {
  title: 'Shinex — Privacy',
};
