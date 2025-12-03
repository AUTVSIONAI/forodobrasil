import AdminSidebar from '@/components/AdminSidebar'
import AdminTopBar from '@/components/AdminTopBar'
import SidebarOverlay from '@/components/SidebarOverlay'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AdminLayout({ children }: { children: React.ReactNode }){
  return (
    <div className="adminShell">
      <AdminSidebar />
      <div className="col">
        <AdminTopBar />
        {children}
      </div>
      <SidebarOverlay />
    </div>
  )
}
