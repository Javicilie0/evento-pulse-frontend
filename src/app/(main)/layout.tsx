import { Navbar } from '@/components/layout/Navbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { PullToRefresh } from '@/components/ui/PullToRefresh'
import { ScrollRestoration } from '@/components/ui/ScrollRestoration'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollRestoration />
      <PullToRefresh />
      <Navbar />
      <div className="container site-content pb-5">
        <main role="main" className="pb-3">
          {children}
        </main>
      </div>
      <footer className="border-top footer text-muted bg-light">
        <div className="container text-center py-2">
          &copy; {new Date().getFullYear()} Evento
        </div>
      </footer>
      <MobileNav />
    </>
  )
}
