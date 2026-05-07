import { PrismaClient, ServiceType, UserRole, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Cities
  const astana = await prisma.city.upsert({
    where: { slug: 'astana' },
    update: {},
    create: { slug: 'astana', name: 'Астана', timezone: 'Asia/Almaty', currency: 'KZT' },
  });

  const almaty = await prisma.city.upsert({
    where: { slug: 'almaty' },
    update: {},
    create: { slug: 'almaty', name: 'Алматы', timezone: 'Asia/Almaty', currency: 'KZT' },
  });

  // A simple seed pricing formula: basePrice + area * perM2 + rooms * perRoom + sum_options.
  // Stored as a small JSON DSL the PricingEngine module will evaluate.
  const apartmentFormula = {
    op: 'add',
    args: [
      { op: 'var', name: 'basePrice' },
      { op: 'mul', args: [{ op: 'input', name: 'area_m2', default: 0 }, { op: 'const', value: 250_00 }] },
      { op: 'mul', args: [{ op: 'input', name: 'rooms', default: 0 }, { op: 'const', value: 1500_00 }] },
      { op: 'sum_options' },
    ],
  };

  const apartment = await prisma.service.upsert({
    where: { slug: 'apartment-standard' },
    update: {},
    create: {
      slug: 'apartment-standard',
      type: ServiceType.apartment,
      nameRu: 'Уборка квартиры — стандарт',
      nameKk: 'Пәтерді тазалау — стандарт',
      nameEn: 'Apartment cleaning — standard',
      descRu: 'Поддерживающая уборка жилых помещений.',
      descKk: 'Тұрғын үй-жайларды тазалау.',
      descEn: 'Maintenance cleaning for apartments and houses.',
      basePrice: 5000_00,
      pricingExpr: apartmentFormula,
    },
  });

  await prisma.serviceOption.upsert({
    where: { serviceId_key: { serviceId: apartment.id, key: 'windows' } },
    update: {},
    create: {
      serviceId: apartment.id,
      key: 'windows',
      labelRu: 'Мытьё окон',
      labelKk: 'Терезе жуу',
      labelEn: 'Window cleaning',
      priceDelta: 3000_00,
    },
  });

  await prisma.serviceOption.upsert({
    where: { serviceId_key: { serviceId: apartment.id, key: 'carpet' } },
    update: {},
    create: {
      serviceId: apartment.id,
      key: 'carpet',
      labelRu: 'Чистка ковров',
      labelKk: 'Кілем тазалау',
      labelEn: 'Carpet cleaning',
      priceDelta: 4500_00,
    },
  });

  // Sample verified cleaner — used for cleaner-profile demos before real onboarding.
  const cleanerUser = await prisma.user.upsert({
    where: { phone: '+77010000001' },
    update: {},
    create: {
      phone: '+77010000001',
      name: 'Айгуль К.',
      role: UserRole.cleaner,
    },
  });

  await prisma.cleaner.upsert({
    where: { userId: cleanerUser.id },
    update: {},
    create: {
      userId: cleanerUser.id,
      specialization: ['apartment', 'post_renovation'],
      bioRu: 'Опытный клинер с вниманием к деталям. Использую только сертифицированные средства.',
      bioKk: 'Тәжірибелі тазалаушы, нюанстарға мән беремін. Тек сертификатталған құралдарды қолданамын.',
      bioEn: 'Experienced cleaner with an eye for detail. Uses only certified products.',
      yearsOfExperience: 4,
      languages: ['ru', 'kk'],
      verificationStatus: VerificationStatus.verified,
      verifiedAt: new Date(),
      ratingAvg: 4.9,
      ratingCount: 37,
      completedOrdersCount: 41,
    },
  });

  console.log(`Seeded cities: ${astana.slug}, ${almaty.slug}`);
  console.log(`Seeded service: ${apartment.slug}`);
  console.log(`Seeded cleaner: ${cleanerUser.name}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
