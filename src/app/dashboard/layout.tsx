import MobileNav from '@/components/layout/MobileNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 md:pb-0">
      {children}
      <MobileNav />
    </div>
  )
}
