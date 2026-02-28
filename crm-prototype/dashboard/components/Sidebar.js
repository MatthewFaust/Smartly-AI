// Navigation sidebar — links to all main dashboard sections
import Link from 'next/link';
import { useRouter } from 'next/router';

const navItems = [
  { href: '/', label: 'Pipeline', icon: '⬛' },
  { href: '/leads', label: 'Leads', icon: '👥' },
  { href: '/approvals', label: 'Approvals', icon: '✅' },
  { href: '/chat', label: 'AI Chat', icon: '💬' },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <span className="text-lg font-bold text-purple-700 tracking-tight">Smartly CRM</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon }) => {
          const active =
            href === '/'
              ? router.pathname === '/'
              : router.pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">Prototype v0.1</p>
      </div>
    </aside>
  );
}
