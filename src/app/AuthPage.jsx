import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../landing/Logo'
import { entrar, cadastrar } from './session'
import { ApiError, apiConfigurada, getToken } from '../lib/api'
import '../landing/landing.css'

const TEXTOS = {
  entrar: { titulo: 'Entrar no Liberty Mec', botao: 'Entrar', alt: ['Ainda não tem conta?', 'Teste 7 dias grátis', '/cadastrar'] },
  cadastrar: { titulo: 'Teste 7 dias grátis', botao: 'Criar conta', alt: ['Já tem conta?', 'Entrar', '/entrar'] },
}

export default function AuthPage({ modo }) {
  const t = TEXTOS[modo]
  const [f, setF] = useState({ oficina: '', nome: '', email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [demora, setDemora] = useState(false)

  useEffect(() => { document.title = `${t.titulo} — Liberty Mec` }, [t.titulo])

  // A API gratuita pode levar até ~30 s para "acordar": avisa em vez de parecer travado.
  useEffect(() => {
    if (!enviando) return setDemora(false)
    const id = setTimeout(() => setDemora(true), 4000)
    return () => clearTimeout(id)
  }, [enviando])

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  async function enviar(e) {
    e.preventDefault()
    if (enviando) return
    setErro('')
    setEnviando(true)
    try {
      if (modo === 'entrar') await entrar(f.email.trim(), f.senha)
      else await cadastrar({ oficina: f.oficina.trim(), nome: f.nome.trim(), email: f.email.trim(), senha: f.senha })
      window.location.assign('/app')
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível concluir. Tente novamente.')
      setEnviando(false)
    }
  }

  return (
    <main className="auth">
      <a className="auth__back" href="/"><ArrowLeft size={14} /> Voltar ao site</a>
      <div className="auth__card">
        <a href="/" className="auth__logo" aria-label="Liberty Mec — início"><Logo light /></a>
        <h1>{t.titulo}</h1>
        {modo === 'cadastrar' && <p className="auth__sub">Sem cartão. Cancele quando quiser.</p>}

        {!apiConfigurada && <p className="auth__erro" role="alert">A API ainda não foi configurada neste site.</p>}
        {getToken() && modo === 'entrar' && <p className="auth__sub">Você já está conectado. <a href="/app">Ir para o sistema</a></p>}

        <form onSubmit={enviar} noValidate>
          {modo === 'cadastrar' && (
            <>
              <label>Nome da oficina<input value={f.oficina} onChange={set('oficina')} autoComplete="organization" placeholder="Ex.: Auto Center Ribeiro" required minLength={2} /></label>
              <label>Seu nome<input value={f.nome} onChange={set('nome')} autoComplete="name" required minLength={2} /></label>
            </>
          )}
          <label>E-mail<input type="email" value={f.email} onChange={set('email')} autoComplete="email" inputMode="email" required /></label>
          <label>Senha<input type="password" value={f.senha} onChange={set('senha')} required minLength={modo === 'cadastrar' ? 8 : 1}
            autoComplete={modo === 'cadastrar' ? 'new-password' : 'current-password'} placeholder={modo === 'cadastrar' ? 'Mínimo de 8 caracteres' : ''} /></label>

          {erro && <p className="auth__erro" role="alert">{erro}</p>}
          <button className="btn btn--white auth__submit" type="submit" disabled={enviando || !apiConfigurada}>{enviando ? 'Aguarde…' : t.botao}</button>
          {demora && <p className="auth__sub" role="status">O servidor está acordando, isso pode levar até 30 segundos…</p>}
        </form>

        <p className="auth__alt">{t.alt[0]} <a href={t.alt[2]}>{t.alt[1]}</a></p>
      </div>
    </main>
  )
}
