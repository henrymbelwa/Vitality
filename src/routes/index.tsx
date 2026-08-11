import { createFileRoute } from '@tanstack/react-router'
import { login, requestPasswordRecovery, signup } from '@netlify/identity'
import { Activity, ArrowRight, Bell, BrainCircuit, CalendarDays, Check, ChevronRight, CirclePlay, FileHeart, HeartPulse, History, LockKeyhole, Menu, Pill, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { HealthApp } from '../components/HealthApp'
import { fictionalDemoData, healthRequest, type HealthData } from '../lib/health'
import { useIdentity } from '../lib/identity-context'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { user, ready, logout, refresh } = useIdentity()
  const [data, setData] = useState<HealthData | null>(null)
  const [demo, setDemo] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!user) { setData(null); return }
    healthRequest().then(setData).catch((reason) => setError(reason.message))
  }, [user])
  if (demo) return <HealthApp initialData={fictionalDemoData} demo onLogout={() => setDemo(false)} />
  if (!ready) return <LoadingScreen />
  if (user && !data) return <LoadingScreen message={error || 'Preparing your private health space…'} />
  if (user && data) return <HealthApp initialData={data} demo={false} onLogout={async () => { await logout(); setData(null); await refresh() }} />
  return <Landing openAuth={() => setAuthOpen(true)} openDemo={() => setDemo(true)} authOpen={authOpen} closeAuth={() => setAuthOpen(false)} refresh={refresh} />
}

function Landing({ openAuth, openDemo, authOpen, closeAuth, refresh }: { openAuth: () => void; openDemo: () => void; authOpen: boolean; closeAuth: () => void; refresh: () => Promise<void> }) {
  const [menu, setMenu] = useState(false)
  return <div className="landing">
    <header className="landing-nav"><Brand /><nav className={menu ? 'open' : ''}><a href="#features">Platform</a><a href="#intelligence">Intelligence</a><a href="#privacy">Privacy</a><button className="nav-login" onClick={openAuth}>Log in</button><button className="primary-button" onClick={openAuth}>Get started <ArrowRight /></button></nav><button className="landing-menu" onClick={() => setMenu(!menu)}><Menu /></button></header>
    <main>
      <section className="hero-section"><div className="hero-glow one"/><div className="hero-glow two"/><div className="hero-copy"><div className="launch-pill"><Sparkles /> YOUR PERSONAL HEALTH OS <span>2026</span></div><h1>Your Health.<br/><em>One Intelligent Timeline.</em></h1><p>Track your health, stay on schedule with medications, and understand your progress from one secure personal health dashboard.</p><div className="hero-actions"><button className="primary-button hero-button" onClick={openAuth}>Get Started <ArrowRight /></button><button className="secondary-button hero-button" onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}><CirclePlay /> Explore Features</button></div><div className="hero-trust"><span><ShieldCheck/> Private by design</span><span><LockKeyhole/> Secure authentication</span><span><Check/> No diagnosis</span></div></div><HealthOrb /></section>
      <section className="signal-strip"><span>MEDICATIONS</span><i/><span>VITALS</span><i/><span>ACTIVITY</span><i/><span>SLEEP</span><i/><span>APPOINTMENTS</span><i/><span>WELLBEING</span></section>
      <section id="features" className="feature-section"><SectionIntro eyebrow="ONE CONNECTED VIEW" title="Everything your health day needs." emphasis="Nothing it doesn’t." text="Designed for ordinary people who want clarity, consistency and control — without the complexity of clinical software."/><div className="landing-feature-grid"><Feature icon={Pill} number="01" title="Medication companion" text="Automatic dose schedules, status tracking, snooze controls and exact medication history." accent="violet"/><Feature icon={History} number="02" title="Intelligent timeline" text="Water, movement, symptoms, sleep and measurements become one calm chronology." accent="lime"/><Feature icon={BrainCircuit} number="03" title="Personal insights" text="Understand patterns in your recorded data with visible medical-safety boundaries." accent="coral"/><Feature icon={Bell} number="04" title="Smart reminders" text="Browser and in-app reminders keep doses and appointments visible." accent="blue"/><Feature icon={CalendarDays} number="05" title="Care coordination" text="Keep visits, locations, notes and preparation reminders together." accent="amber"/><Feature icon={FileHeart} number="06" title="Portable records" text="Generate professional PDF and CSV exports of your health history." accent="pink"/></div></section>
      <section className="product-showcase"><div className="showcase-copy"><span className="eyebrow">CALM, NOT CLINICAL</span><h2>A dashboard that helps you <em>see the whole day.</em></h2><p>Future Health turns scattered moments into a living personal record that is easy to update from any device.</p><ul><li><Check/> Fast daily check-ins</li><li><Check/> Medication adherence at a glance</li><li><Check/> Cautious, understandable trends</li></ul><button className="secondary-button" onClick={openDemo}>Explore fictional demo <ChevronRight/></button></div><DashboardPreview /></section>
      <section id="intelligence" className="intelligence-section"><div className="intelligence-orb"><BrainCircuit/><i/><i/><i/></div><div><span className="eyebrow">HEALTH INTELLIGENCE</span><h2>Useful patterns.<br/><em>Responsible boundaries.</em></h2><p>Future Health summarizes only your recorded information. It never diagnoses disease, prescribes medication, or tells you to change treatment.</p><blockquote>“You averaged 6.8 hours of sleep over the last 14 days, and logged more activity this week than last week.”</blockquote><small>Informational example based on fictional records.</small></div></section>
      <section id="privacy" className="privacy-section"><div><ShieldCheck/><span className="eyebrow">PRIVACY FIRST</span><h2>Your health information is personal. The architecture treats it that way.</h2></div><div className="privacy-points"><Privacy number="01" title="Account-isolated records" text="Every database record is scoped to its authenticated owner."/><Privacy number="02" title="No public health URLs" text="Emergency data stays inside the secure application."/><Privacy number="03" title="Portable by choice" text="You decide when to export and share your records."/></div></section>
      <section className="landing-cta"><HeartPulse/><span className="eyebrow">START YOUR TIMELINE</span><h2>One place for the health moments that matter.</h2><p>Build a clearer picture of your routines, medications and personal history.</p><div><button className="primary-button hero-button" onClick={openAuth}>Create your private space <ArrowRight/></button><button className="secondary-button hero-button" onClick={openDemo}>View fictional demo</button></div></section>
    </main>
    <footer><Brand/><p>Health tracking for information and organization — not diagnosis or treatment.</p><span>© 2026 Future Health</span></footer>
    {authOpen && <AuthModal close={closeAuth} refresh={refresh}/>} 
  </div>
}

function AuthModal({ close, refresh }: { close: () => void; refresh: () => Promise<void> }) {
  const [mode, setMode] = useState<'login'|'signup'|'reset'>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState({ error: '', notice: '' })
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage({ error: '', notice: '' })
    try {
      if (mode === 'reset') { await requestPasswordRecovery(form.email); setMessage({ error: '', notice: 'Check your email for a secure password reset link.' }) }
      else if (mode === 'signup') { await signup(form.email, form.password, { full_name: form.name }); setMessage({ error: '', notice: 'Account created. Confirm your email, then log in.' }) }
      else { await login(form.email, form.password); await refresh(); close() }
    } catch (error) { setMessage({ error: error instanceof Error ? error.message : 'Authentication failed.', notice: '' }) }
    finally { setBusy(false) }
  }
  return <div className="modal-backdrop" onMouseDown={close}><form className="auth-modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}><div className="auth-visual"><Brand/><div className="auth-pulse"><HeartPulse/><i/><i/><i/></div><div><span className="eyebrow">PRIVATE BY DESIGN</span><h2>Your personal health timeline starts here.</h2><p>Securely organize medications, daily activity and the health information you choose to record.</p></div></div><div className="auth-form"><button className="auth-close" type="button" onClick={close}><X/></button><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : mode === 'signup' ? 'CREATE ACCOUNT' : 'RECOVER ACCESS'}</span><h2>{mode === 'login' ? 'Log in to Future Health' : mode === 'signup' ? 'Create your health space' : 'Reset your password'}</h2><p>{mode === 'reset' ? 'We’ll email you a secure recovery link.' : 'Your records remain private to your account.'}</p>{mode === 'signup' && <AuthField icon={UserRound} label="Full name" type="text" value={form.name} set={(value) => setForm({...form,name:value})}/>}<AuthField icon={Activity} label="Email address" type="email" value={form.email} set={(value) => setForm({...form,email:value})}/>{mode !== 'reset' && <AuthField icon={LockKeyhole} label="Password" type="password" value={form.password} set={(value) => setForm({...form,password:value})}/>} {message.error && <div className="auth-error">{message.error}</div>}{message.notice && <div className="auth-notice">{message.notice}</div>}<button className="primary-button auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send recovery link'}<ArrowRight/></button>{mode === 'login' && <button type="button" className="text-button" onClick={() => setMode('reset')}>Forgot your password?</button>}<div className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to Future Health?'} <button type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? 'Log in' : 'Create account'}</button></div><small>Future Health is not a medical provider and does not provide diagnosis or treatment.</small></div></form></div>
}

function AuthField({ icon: Icon, label, type, value, set }: any) { return <label><span>{label}</span><div><Icon/><input required minLength={type === 'password' ? 8 : undefined} type={type} value={value} onChange={(e) => set(e.target.value)} /></div></label> }
function Brand() { return <a className="brand" href="#top"><div className="brand-mark"><HeartPulse /></div><div><strong>FUTURE</strong><span>HEALTH</span></div></a> }
function SectionIntro({ eyebrow, title, emphasis, text }: any) { return <div className="section-intro"><span className="eyebrow">{eyebrow}</span><h2>{title}<br/><em>{emphasis}</em></h2><p>{text}</p></div> }
function Feature({ icon: Icon, number, title, text, accent }: any) { return <article className={`landing-feature ${accent}`}><div><span>{number}</span><Icon/></div><h3>{title}</h3><p>{text}</p><button>Explore <ChevronRight/></button></article> }
function Privacy({ number, title, text }: any) { return <article><strong>{number}</strong><h3>{title}</h3><p>{text}</p></article> }
function HealthOrb() { return <div className="health-orb-wrap"><div className="orbit orbit-one"><i/><i/><i/></div><div className="orbit orbit-two"><i/><i/></div><div className="health-orb"><HeartPulse/><span>HEALTH<br/>SYNCED</span></div><div className="floating-stat stat-one"><HeartPulse/><span><small>HEART RATE</small><strong>68 <em>BPM</em></strong></span></div><div className="floating-stat stat-two"><Pill/><span><small>NEXT DOSE</small><strong>35 <em>MIN</em></strong></span></div><div className="floating-stat stat-three"><Activity/><span><small>ACTIVITY</small><strong>+12<em>%</em></strong></span></div></div> }
function DashboardPreview() { return <div className="dashboard-preview"><div className="preview-side"><HeartPulse/>{[HeartPulse,Pill,History,CalendarDays,BrainCircuit].map((Icon,index)=><i className={index===0?'active':''} key={index}><Icon/></i>)}</div><div className="preview-main"><div className="preview-top"><div><span>Tuesday, August 11</span><strong>Good morning, Alex</strong></div><div><i/><i/></div></div><div className="preview-cards"><article><span>HYDRATION</span><strong>1,250 <small>ml</small></strong><i/></article><article><span>SLEEP</span><strong>7h 12m</strong><em>Good</em></article><article><span>HEART RATE</span><strong>68 <small>bpm</small></strong><svg viewBox="0 0 100 30"><path d="M0 20 L18 20 L25 7 L34 27 L44 14 L52 20 L100 20"/></svg></article></div><div className="preview-bottom"><article><h3><Pill/> Medication flow</h3>{['08:00  Amoxicillin','08:00  Vitamin D','14:00  Amoxicillin'].map((value,index)=><p key={value}><i className={index<2?'done':''}/>{value}<span>{index<2?'Taken':'Due soon'}</span></p>)}</article><article><h3><History/> Today’s timeline</h3>{['Medication taken','500 ml water','32-minute walk'].map((value,index)=><p key={value}><time>{['8:03','9:15','10:00'][index]}</time><i/>{value}</p>)}</article></div></div></div> }
function LoadingScreen({ message = 'Loading Future Health…' }: { message?: string }) { return <div className="loading-screen"><div className="loading-mark"><HeartPulse/><i/></div><strong>FUTURE HEALTH</strong><span>{message}</span></div> }
