import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/SiteHeader';

type Section = { h: string; p?: string; list?: string[] };

const CONTENT: Record<string, { title: string; updated: string; sections: Section[] }> = {
  ru: {
    title: 'Условия использования',
    updated: 'Последнее обновление: 23 мая 2026 г.',
    sections: [
      {
        h: '1. Стороны',
        p: 'Использование сайта shinex.kz и мобильного приложения Shinex означает согласие с настоящими Условиями. Оператор сервиса — Shinex (далее «Сервис»), пользователь — физическое или юридическое лицо, заказывающее услуги уборки.',
      },
      {
        h: '2. Предмет',
        p: 'Сервис предоставляет платформу для заказа клининговых услуг и связывает клиента с клинером-исполнителем. Сервис не является работодателем клинера и не оказывает услуги уборки самостоятельно, кроме случаев, прямо указанных в договоре.',
      },
      {
        h: '3. Заказы и оплата',
        list: [
          'Стоимость рассчитывается по тарифам на момент оформления заказа.',
          'Оплата производится онлайн через подключённого провайдера или иным способом, указанным в приложении.',
          'Клиент обязан обеспечить доступ исполнителя к объекту в указанное время.',
        ],
      },
      {
        h: '4. Отмена и возврат',
        p: 'Клиент может отменить заказ до начала выполнения. Условия возврата средств при онлайн-оплате — в соответствии с правилами провайдера и применимым законодательством. Возврат осуществляется на ту же платёжную карту/счёт, с которой был произведён платёж.',
      },
      {
        h: '5. Ответственность',
        p: 'Сервис принимает все разумные меры для качественного оказания услуг. Сервис не несёт ответственности за косвенные убытки. Споры с клинерами рассматриваются Сервисом в порядке внутренней процедуры; в случае подтверждённого ущерба возможна частичная или полная компенсация.',
      },
      {
        h: '6. Запрещённое использование',
        list: [
          'Передача аккаунта третьим лицам.',
          'Заказы с целью причинить вред клинеру или Сервису.',
          'Использование сервиса для незаконной деятельности.',
        ],
      },
      {
        h: '7. Изменения',
        p: 'Сервис может изменять настоящие Условия. Существенные изменения публикуются на сайте и в приложении не менее чем за 7 дней до вступления в силу.',
      },
      {
        h: '8. Применимое право',
        p: 'К настоящим Условиям применяется законодательство Республики Казахстан.',
      },
      {
        h: '9. Контакты',
        p: 'support@shinex.kz — по вопросам сервиса; privacy@shinex.kz — по обработке персональных данных.',
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: May 23, 2026.',
    sections: [
      {
        h: '1. Parties',
        p: 'Using the shinex.kz website or the Shinex mobile app constitutes acceptance of these Terms. The operator is Shinex ("Service"); the user is the natural or legal person ordering cleaning services.',
      },
      {
        h: '2. Subject',
        p: 'The Service provides a platform for ordering cleaning services and connects the client with a performing cleaner. The Service is not the cleaner\'s employer and does not deliver cleaning itself except where explicitly stated.',
      },
      {
        h: '3. Orders and payment',
        list: [
          'Prices are calculated by the tariff in effect at the time of order.',
          'Payment is made online via an integrated provider or another method shown in the app.',
          'The client must provide the cleaner access to the property at the agreed time.',
        ],
      },
      {
        h: '4. Cancellation and refunds',
        p: 'The client may cancel an order before work has started. Refund terms for online payments follow the provider rules and applicable law. Refunds are returned to the original payment method.',
      },
      {
        h: '5. Liability',
        p: 'The Service takes reasonable measures to ensure service quality. The Service is not liable for indirect damages. Disputes are reviewed internally; confirmed losses may be partially or fully compensated.',
      },
      {
        h: '6. Prohibited use',
        list: [
          'Sharing your account with third parties.',
          'Orders intended to harm a cleaner or the Service.',
          'Using the Service for illegal activity.',
        ],
      },
      {
        h: '7. Changes',
        p: 'The Service may update these Terms. Material changes will be posted at least 7 days before they take effect.',
      },
      {
        h: '8. Governing law',
        p: 'These Terms are governed by the law of the Republic of Kazakhstan.',
      },
      {
        h: '9. Contact',
        p: 'support@shinex.kz for service questions; privacy@shinex.kz for data-handling questions.',
      },
    ],
  },
  kk: {
    title: 'Қызмет шарттары',
    updated: 'Соңғы жаңарту: 23 мамыр 2026 ж.',
    sections: [
      {
        h: '1. Тараптар',
        p: 'shinex.kz сайтын немесе Shinex мобильді қосымшасын пайдалану осы Шарттарды қабылдауды білдіреді. Оператор — Shinex («Сервис»), пайдаланушы — тазалау қызметтерін тапсырыс беретін жеке немесе заңды тұлға.',
      },
      {
        h: '2. Тақырып',
        p: 'Сервис клинингтік қызметтерді тапсырыс беруге арналған платформаны ұсынады және клиентті орындаушы клинермен байланыстырады. Сервис клинердің жұмыс берушісі болып табылмайды.',
      },
      {
        h: '3. Тапсырыстар мен төлем',
        list: [
          'Бағалар тапсырыс берген сәттегі тарифпен есептеледі.',
          'Төлем қосымшада көрсетілген тәсілмен жүргізіледі.',
          'Клиент келісілген уақытта объектіге кіруді қамтамасыз етеді.',
        ],
      },
      {
        h: '4. Бас тарту және қайтару',
        p: 'Клиент тапсырыстан жұмыс басталғанға дейін бас тарта алады. Қайтару шарттары провайдер ережелеріне және қолданыстағы заңнамаға сәйкес жүргізіледі.',
      },
      {
        h: '5. Жауапкершілік',
        p: 'Сервис қызмет сапасын қамтамасыз ету үшін барлық ақылға қонымды шараларды қабылдайды. Сервис жанама зияндар үшін жауап бермейді.',
      },
      {
        h: '6. Тыйым салынған пайдалану',
        list: [
          'Аккаунтты үшінші тұлғаларға беру.',
          'Клинерге немесе Сервиске зиян келтіру мақсатындағы тапсырыстар.',
          'Заңсыз әрекеттер үшін Сервисті пайдалану.',
        ],
      },
      {
        h: '7. Өзгерістер',
        p: 'Сервис осы Шарттарды жаңарта алады. Маңызды өзгерістер күшіне енгенге дейін кемінде 7 күн бұрын жарияланады.',
      },
      {
        h: '8. Қолданылатын құқық',
        p: 'Осы Шарттарға Қазақстан Республикасының заңнамасы қолданылады.',
      },
      {
        h: '9. Байланыс',
        p: 'support@shinex.kz — сервис сұрақтары; privacy@shinex.kz — дербес деректер сұрақтары.',
      },
    ],
  },
};

export default async function TermsPage({
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
  title: 'Shinex — Terms',
};
