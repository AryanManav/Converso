import AppShell from '@/components/AppShell'
import './globals.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata = {
  title: 'PeerTalks - Real-Time Peer Conversations',
  description: 'A minimal, fast, real-time messaging platform connecting peers seamlessly.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className='relative font-sans bg-zinc-50 text-zinc-900'>
        <ToastContainer
          position="bottom-right"
          theme="light"
          pauseOnHover={false}
          autoClose={2200}
          hideProgressBar={true}
          toastClassName="!rounded-xl !shadow-dropdown !border !border-zinc-100 !text-sm !font-medium"
        />
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
