import { useState, useEffect } from 'react'
import { Outlet } from 'react-router'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  return (
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row">
      <header className="md:hidden h-14 bg-surface border-b border-line px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-accent text-white text-xs font-semibold flex items-center justify-center select-none">
            M
          </div>
          <span className="text-[15px] font-semibold text-ink tracking-tight">
            MerchantHub
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="text-muted hover:text-ink p-1.5 rounded-md transition-colors duration-150 cursor-pointer"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {mobileMenuOpen ? (
        <div className="md:hidden fixed inset-0 top-14 z-20 bg-surface border-b border-line">
          <Sidebar onItemClick={() => setMobileMenuOpen(false)} />
        </div>
      ) : null}

      <aside className="hidden md:flex w-[232px] shrink-0 min-h-screen border-r border-line bg-surface sticky top-0 h-screen">
        <div className="w-full h-full overflow-y-auto">
          <Sidebar />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
