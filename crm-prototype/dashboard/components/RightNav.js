// Right navigation bar — fixed pill on the right edge of every page with icon links
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Menu,
  Home,
  Mail,
  Inbox,
  Users,
  Phone,
  Calendar,
  Key,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home,    label: 'Home',       href: '/dashboard'   },
  { icon: Mail,    label: 'Mail',       href: '/mail'        },
  { icon: Inbox,   label: 'Approvals',  href: '/approvals'   },
  { icon: Users,   label: 'Clients',    href: '/clients'     },
  { icon: Phone,   label: 'Phone',      href: '/phone'       },
  { icon: Calendar,label: 'Schedule',   href: '/schedule'    },
  { icon: Key,     label: 'Properties', href: '/properties'  },
];

export default function RightNav() {
  const router = useRouter();

  function isActive(href) {
    if (href === '/dashboard') {
      return router.pathname === '/dashboard' || router.pathname === '/';
    }
    return router.pathname === href || router.pathname.startsWith(href + '/');
  }

  return (
    <div className="fixed right-0 top-0 h-full w-20 flex flex-col items-center py-4 z-50 pointer-events-none">
      {/* Hamburger — sits above the pill, outside it */}
      <button className="mb-3 p-2 text-gray-500 hover:text-gray-800 pointer-events-auto">
        <Menu size={22} strokeWidth={1.75} />
      </button>

      {/* Nav pill */}
      <div
        className="pointer-events-auto bg-white flex flex-col items-center py-4 gap-2 w-16 shadow-[0_4px_24px_rgba(0,0,0,0.10)]"
        style={{ borderRadius: 32 }}
      >
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 w-full px-1 group"
            >
              {/* Icon circle */}
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  active
                    ? 'bg-[#6B4EFF]'
                    : 'group-hover:bg-[#F0EEF8]'
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={1.75}
                  className={active ? 'text-white' : 'text-gray-600 group-hover:text-[#6B4EFF]'}
                />
              </div>
              {/* Label */}
              <span
                className={`text-[10px] leading-tight tracking-wide ${
                  active ? 'text-[#6B4EFF] font-semibold' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
