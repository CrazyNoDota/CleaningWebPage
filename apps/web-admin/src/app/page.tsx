import { AdminShell } from '@/components/AdminShell';

export default function DashboardPage() {
  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900">Дашборд</h1>
        <p className="mt-2 text-sm text-slate-500">
          Сводка скоро. Пока используйте пункты в боковом меню.
        </p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <a href="/cleaners" className="card hover:border-brand-600 transition-colors">
            <div className="text-sm text-slate-500">Управление</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">Клинеры</div>
          </a>
          <div className="card opacity-60">
            <div className="text-sm text-slate-400">Скоро</div>
            <div className="mt-1 text-lg font-semibold text-slate-700">Заказы</div>
          </div>
          <div className="card opacity-60">
            <div className="text-sm text-slate-400">Скоро</div>
            <div className="mt-1 text-lg font-semibold text-slate-700">Отзывы</div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
