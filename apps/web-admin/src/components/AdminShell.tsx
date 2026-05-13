'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminSession } from '@/lib/use-session';

interface NavItem {
  href: string;
  label: string;
  ready: boolean;
}

const NAV: NavItem[] = [
  { href: '/', label: 'Дашборд', ready: true },
  { href: '/cleaners', label: 'Клинеры', ready: true },
  { href: '/orders', label: 'Заказы', ready: true },
  { href: '/reviews', label: 'Отзывы', ready: true },
  { href: '/applications', label: 'Заявки', ready: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, hydrated, signOut } = useAdminSession();

  // Block render until hydration finishes — avoids a flash of admin content
  // before useAdminSession can redirect non-managers to /login.
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Загрузка…
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <header className="border-b border-slate-200 bg-white lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="min-w-0 text-base font-bold text-brand-600">
            CleaningService
          </Link>
          <button onClick={signOut} className="btn-ghost shrink-0">
            Выйти
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3 text-sm">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-2 ${
                  active
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="px-6 py-5 border-b border-slate-200">
          <Link href="/" className="text-lg font-bold text-brand-600">
            CleaningService
          </Link>
          <div className="text-xs text-slate-400">Панель оператора</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const className = `flex items-center justify-between rounded-lg px-3 py-2 ${
              active
                ? 'bg-brand-50 text-brand-700 font-medium'
                : item.ready
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-slate-400 cursor-not-allowed'
            }`;
            return item.ready ? (
              <Link key={item.href} href={item.href} className={className}>
                <span>{item.label}</span>
              </Link>
            ) : (
              <span key={item.href} className={className} title="Скоро">
                <span>{item.label}</span>
                <span className="badge-slate">скоро</span>
              </span>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <div className="font-medium text-slate-700">{session.user.name ?? session.user.phone}</div>
          <div>{session.user.role}</div>
          <button onClick={signOut} className="mt-2 btn-ghost">
            Выйти
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
