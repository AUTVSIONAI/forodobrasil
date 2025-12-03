import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'ForoBrasil',
  description: 'Institucional público'
}

export default function PublicLayout({ children }: { children: React.ReactNode }){
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
