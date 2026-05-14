'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Receipt, PlusCircle, Settings } from 'lucide-react'

export default function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Hem', icon: Home, href: '/dashboard' },
    { label: 'Räkningar', icon: Receipt, href: '/dashboard/bills' },
    { label: 'Lägg till', icon: PlusCircle, href: '/dashboard/add', isMain: true },
    { label: 'Inställningar', icon: Settings, href: '/dashboard/settings' },
  ]

  // Only show in dashboard routes
  if (!pathname?.startsWith('/dashboard')) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-white/5 pb-safe pt-2 px-6 flex justify-between items-center z-50 backdrop-blur-lg bg-opacity-90">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
              item.isMain 
                ? 'text-white scale-110' 
                : isActive ? 'text-indigo-400' : 'text-gray-500'
            }`}
          >
            <Icon size={item.isMain ? 28 : 22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
