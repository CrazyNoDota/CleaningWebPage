import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/SiteHeader';

const CONTENT: Record<string, {
  title: string;
  updated: string;
  appName: string;
  intro: string;
  sections: { h: string; p?: string; list?: string[] }[];
}> = {
  ru: {
    title: 'Удаление аккаунта',
    updated: 'Последнее обновление: 29 мая 2026 г.',
    appName: 'Shinex',
    intro: 'Вы можете удалить свой аккаунт и связанные с ним данные прямо в приложении Shinex или обратившись к нам по e-mail.',
    sections: [
      {
        h: 'Как удалить аккаунт в приложении',
        list: [
          'Откройте приложение Shinex.',
          'Перейдите на вкладку «Профиль» (иконка в правом нижнем углу).',
          'Прокрутите вниз и нажмите «Удалить аккаунт».',
          'Подтвердите действие в двух диалоговых окнах.',
          'Аккаунт будет удалён немедленно, и вы выйдете из системы.',
        ],
      },
      {
        h: 'Удаление через e-mail',
        p: 'Если вы не можете получить доступ к приложению, отправьте запрос на адрес support@shinex.kz с темой письма «Удаление аккаунта» и укажите номер телефона, привязанный к аккаунту. Мы обработаем запрос в течение 3 рабочих дней.',
      },
      {
        h: 'Какие данные удаляются',
        list: [
          'Имя и номер телефона.',
          'Адреса уборки.',
          'Push-токены устройства.',
          'Активные сессии (вы будете разлогинены на всех устройствах).',
        ],
      },
      {
        h: 'Какие данные сохраняются',
        p: 'Записи о заказах и платежах хранятся в обезличенном виде в течение 5 лет в соответствии с требованиями законодательства Республики Казахстан о бухгалтерском учёте. Личные данные (имя, телефон) из этих записей удаляются немедленно при удалении аккаунта.',
      },
      {
        h: 'Вопросы',
        p: 'По всем вопросам обращайтесь: support@shinex.kz',
      },
    ],
  },
  en: {
    title: 'Account Deletion',
    updated: 'Last updated: May 29, 2026',
    appName: 'Shinex',
    intro: 'You can delete your Shinex account and associated data directly in the app or by contacting us via email.',
    sections: [
      {
        h: 'How to delete your account in the app',
        list: [
          'Open the Shinex app.',
          'Go to the Profile tab (icon in the bottom-right corner).',
          'Scroll down and tap "Delete Account".',
          'Confirm the action in the two confirmation dialogs.',
          'Your account will be deleted immediately and you will be signed out.',
        ],
      },
      {
        h: 'Deletion via email',
        p: 'If you cannot access the app, send a request to support@shinex.kz with the subject "Account Deletion" and include the phone number linked to your account. We will process your request within 3 business days.',
      },
      {
        h: 'What data is deleted',
        list: [
          'Name and phone number.',
          'Cleaning addresses.',
          'Device push tokens.',
          'Active sessions (you will be signed out on all devices).',
        ],
      },
      {
        h: 'What data is retained',
        p: 'Order and payment records are retained in anonymised form for 5 years as required by the accounting laws of the Republic of Kazakhstan. Personal data (name, phone number) is removed from these records immediately upon account deletion.',
      },
      {
        h: 'Questions',
        p: 'For any questions contact us: support@shinex.kz',
      },
    ],
  },
  kk: {
    title: 'Аккаунтты жою',
    updated: 'Соңғы жаңарту: 2026 жылғы 29 мамыр',
    appName: 'Shinex',
    intro: 'Shinex аккаунтыңызды және онымен байланысты деректерді тікелей қосымшадан немесе бізге электрондық пошта арқылы хабарласу арқылы жоюға болады.',
    sections: [
      {
        h: 'Қосымшада аккаунтты жою жолы',
        list: [
          'Shinex қосымшасын ашыңыз.',
          '«Профиль» қойындысына өтіңіз (төменгі оң жақ бұрыштағы белгіше).',
          'Төмен айналдырып, «Аккаунтты жою» батырмасын басыңыз.',
          'Екі диалогтік терезеде әрекетті растаңыз.',
          'Аккаунт дереу жойылады және жүйеден шығасыз.',
        ],
      },
      {
        h: 'Электрондық пошта арқылы жою',
        p: 'Қосымшаға кіре алмасаңыз, support@shinex.kz мекенжайына «Аккаунтты жою» тақырыбымен хат жіберіп, аккаунтқа байланысты телефон нөмірін көрсетіңіз. Сұранысты 3 жұмыс күні ішінде өңдейміз.',
      },
      {
        h: 'Қандай деректер жойылады',
        list: [
          'Аты-жөні мен телефон нөмірі.',
          'Тазалау мекенжайлары.',
          'Құрылғының push-токендері.',
          'Белсенді сессиялар (барлық құрылғылардан шығасыз).',
        ],
      },
      {
        h: 'Қандай деректер сақталады',
        p: 'Тапсырыс пен төлем жазбалары Қазақстан Республикасының бухгалтерлік есеп заңнамасына сәйкес 5 жыл бойы жасырын түрде сақталады. Жеке деректер (аты, телефон) аккаунт жойылған сәтте осы жазбалардан дереу жойылады.',
      },
      {
        h: 'Сұрақтар',
        p: 'Барлық сұрақтар бойынша: support@shinex.kz',
      },
    ],
  },
};

export default async function DeleteAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const c = CONTENT[locale] ?? CONTENT['ru'];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl px-4 md:px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900">{c.title}</h1>
          <p className="mt-1 text-sm text-ink-400">{c.updated}</p>
          <p className="mt-4 text-lg leading-8 text-ink-700">{c.intro}</p>
        </div>

        {c.sections.map((s) => (
          <section key={s.h} className="space-y-3">
            <h2 className="text-xl font-bold text-ink-900">{s.h}</h2>
            {s.p && <p className="text-ink-700 leading-7">{s.p}</p>}
            {s.list && (
              <ol className="list-decimal list-inside space-y-1 text-ink-700">
                {s.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
