import { useEffect, useRef } from 'react'
import DemoApp from '../demo/DemoApp'
import { conectarReal, desconectarReal } from '../demo/store'
import { useSession, iniciar, reiniciar } from './session'
import '../landing/landing.css'

// O sistema de verdade: exige login e usa os dados da oficina via API.
export default function RealApp() {
  const { status, oficina } = useSession()
  const conectou = useRef(false)

  useEffect(() => { document.title = 'Liberty Mec' ; iniciar() }, [])

  useEffect(() => {
    if (status === 'anon') window.location.replace('/entrar')
    if (status === 'logado' && !conectou.current) { conectou.current = true; conectarReal() }
    return undefined
  }, [status])
  useEffect(() => () => { if (conectou.current) desconectarReal() }, [])

  if (status === 'erro') {
    return (
      <main className="auth"><div className="auth__card">
        <h1>Servidor indisponível</h1>
        <p className="auth__sub">Não foi possível falar com o servidor agora. Se ele estava ocioso, pode levar até 30 segundos para acordar.</p>
        <button className="btn btn--white auth__submit" onClick={reiniciar}>Tentar de novo</button>
        <p className="auth__alt"><a href="/">Voltar ao site</a></p>
      </div></main>
    )
  }
  if (status !== 'logado' || !oficina) return <main className="auth"><p className="auth__sub" role="status">Carregando…</p></main>

  return <div className="realapp"><DemoApp /></div>
}
