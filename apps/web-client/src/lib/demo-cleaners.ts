import type { CleanerCard, CleanerReview } from './types';

export const demoCleaners: CleanerCard[] = [
  {
    id: 'demo-gulzira',
    displayName: 'Гульзира',
    photoUrl: '/img/cleaner_profile_1.png',
    bio: 'Аккуратно ведет поддерживающие и генеральные уборки. Сильна в кухнях, санузлах и деталях, которые обычно замечают только после ухода клинера.',
    yearsOfExperience: 6,
    languages: ['ru', 'kk'],
    specialization: ['apartment', 'deep'],
    ratingAvg: 5,
    ratingCount: 24,
    completedOrdersCount: 132,
    verified: true,
  },
  {
    id: 'demo-lilia',
    displayName: 'Лилия',
    photoUrl: '/img/cleaner_profile_2.png',
    bio: 'Работает с квартирами и офисами. Любит четкий чек-лист, приезжает без опозданий и спокойно относится к сложным задачам.',
    yearsOfExperience: 5,
    languages: ['ru'],
    specialization: ['apartment', 'office'],
    ratingAvg: 4.9,
    ratingCount: 18,
    completedOrdersCount: 96,
    verified: true,
  },
  {
    id: 'demo-gulnaz',
    displayName: 'Гульназ',
    photoUrl: '/img/cleaner_profile_3.png',
    bio: 'Берет заказы после ремонта и большие дома. Внимательно проходит пыль на поверхностях, плинтусах и в трудных углах.',
    yearsOfExperience: 7,
    languages: ['ru', 'kk'],
    specialization: ['house', 'post_renovation'],
    ratingAvg: 5,
    ratingCount: 31,
    completedOrdersCount: 148,
    verified: true,
  },
];

export const demoCleanerReviews: Record<string, CleanerReview[]> = {
  'demo-gulzira': [
    demoReview('demo-gulzira', 5, 'Квартира после уборки выглядела очень свежо. Особенно понравилось, как отмыли кухню.'),
    demoReview('demo-gulzira', 5, 'Приехала вовремя, работала спокойно и аккуратно. Буду звать еще.'),
  ],
  'demo-lilia': [
    demoReview('demo-lilia', 5, 'Офис убран без лишних вопросов, переговорная и кухня стали заметно чище.'),
    demoReview('demo-lilia', 4, 'Хорошая уборка, все по чек-листу. Хотелось бы чуть быстрее, но качество отличное.'),
  ],
  'demo-gulnaz': [
    demoReview('demo-gulnaz', 5, 'После ремонта было много пыли, результат очень хороший. Плинтусы и углы чистые.'),
    demoReview('demo-gulnaz', 5, 'Большой дом убрали аккуратно, без спешки и пропусков.'),
  ],
};

function demoReview(cleanerId: string, rating: number, comment: string): CleanerReview {
  return {
    id: `${cleanerId}-${rating}-${comment.length}`,
    orderId: 'demo',
    cleanerId,
    rating,
    comment,
    tags: [],
    photos: [],
    status: 'published',
    publishedAt: new Date('2026-05-01T10:00:00.000Z').toISOString(),
    createdAt: new Date('2026-05-01T10:00:00.000Z').toISOString(),
  };
}
