import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  ArrowDownLeft,
  Receipt,
  Zap,
  QrCode
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Payments', to: '/payments', icon: ArrowDownLeft },
  { name: 'Ledger', to: '/ledger', icon: Receipt },
  { name: 'Cash Advance', to: '/advances', icon: Zap },
  { name: 'Payment Link', to: '/payment-link', icon: QrCode }
]

export default function Sidebar({ onItemClick }) {
  const { merchant, logout } = useAuth()

  return (
    <div className="h-full flex flex-col justify-between p-4">
      <div>
        <div className="flex items-center gap-2 px-2 py-2 mb-6">
          <div className="w-5 h-5 rounded bg-accent text-white text-xs font-semibold flex items-center justify-center select-none shrink-0">
            M
          </div>
          <span className="text-[15px] font-semibold text-ink tracking-tight">
            MerchantHub
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors duration-150 ${
                    isActive
                      ? 'bg-canvas text-ink font-medium'
                      : 'text-muted hover:text-ink'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-line px-2">
        <div className="truncate">
          <p className="text-[13px] font-medium text-ink truncate">
            {merchant?.businessName || 'Merchant'}
          </p>
          <p className="text-xs text-muted truncate mt-0.5">
            {merchant?.email || ''}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-3 text-xs text-muted hover:text-ink transition-colors duration-150 cursor-pointer block"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
