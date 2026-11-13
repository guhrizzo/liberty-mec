import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

// Rotas por endereço; cada uma carrega só o que precisa. Qualquer outro caminho mostra a landing.
const Landing = lazy(() => import('./App'))
const AuthPage = lazy(() => import('./app/AuthPage'))
const RealApp = lazy(() => import('./app/RealApp'))

const path = window.location.pathname.replace(/\/+$/, '') || '/'
let page = <Landing />
if (path === '/entrar') page = <AuthPage modo="entrar" />
else if (path === '/cadastrar') page = <AuthPage modo="cadastrar" />
else if (path === '/app' || path.startsWith('/app/')) page = <RealApp />

createRoot(document.getElementById('root')).render(<Suspense fallback={null}>{page}</Suspense>)
