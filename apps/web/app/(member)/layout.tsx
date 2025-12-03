import MemberSidebar from '@/components/MemberSidebar'
import MemberTopBar from '@/components/MemberTopBar'
import SidebarOverlay from '@/components/SidebarOverlay'
import { getServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MemberLayout({ children }: { children: React.ReactNode }){
  const supa = getServerSupabase()
  const { data: userRes } = await supa.auth.getUser()
  const uid = userRes.user?.id as string|undefined
  if(!uid) redirect('/login')
  return (
    <div className="adminShell">
      <MemberSidebar />
      <div className="col">
        <MemberTopBar />
        {children}
      </div>
      <SidebarOverlay />
    </div>
  )
}
