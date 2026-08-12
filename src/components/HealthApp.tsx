import {
  Activity, AlarmClock, Bell, BrainCircuit, CalendarDays, Check, ChevronRight,
  ClipboardPlus, Clock3, Download, Droplets, Dumbbell, FileHeart, HeartPulse, Home,
  LogOut, Menu, MessageCircleHeart, Moon, MoreHorizontal, Pill, Plus, Search,
  History, ShieldCheck, Sparkles, Stethoscope, Sun, UserRound, X, Zap,
} from 'lucide-react'
import { Line } from 'react-chartjs-2'
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { jsPDF } from 'jspdf'
import { healthRequest, type HealthData } from '../lib/health'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler)

type View = 'dashboard' | 'health' | 'medications' | 'activities' | 'symptoms' | 'timeline' | 'appointments' | 'insights' | 'reports' | 'profile'
type QuickType = 'medication' | 'water' | 'activity' | 'symptom' | 'metric' | 'mood' | 'sleep' | 'appointment' | 'checkin' | null

const nav: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Home }, { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'medications', label: 'Medications', icon: Pill }, { id: 'activities', label: 'Activities', icon: Dumbbell },
  { id: 'symptoms', label: 'Symptoms', icon: ClipboardPlus }, { id: 'timeline', label: 'Timeline', icon: History },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays }, { id: 'insights', label: 'Insights', icon: BrainCircuit },
  { id: 'reports', label: 'Reports', icon: FileHeart }, { id: 'profile', label: 'Profile', icon: UserRound },
]

const quickItems: Array<{ type: Exclude<QuickType, null>; label: string; icon: typeof Pill; color: string }> = [
  { type: 'medication', label: 'Medication', icon: Pill, color: 'violet' }, { type: 'water', label: 'Water', icon: Droplets, color: 'blue' },
  { type: 'activity', label: 'Activity', icon: Dumbbell, color: 'lime' }, { type: 'symptom', label: 'Symptom', icon: ClipboardPlus, color: 'coral' },
  { type: 'metric', label: 'Measurement', icon: HeartPulse, color: 'pink' }, { type: 'mood', label: 'Mood', icon: Sparkles, color: 'amber' },
]

export function HealthApp({ initialData, demo, onLogout }: { initialData: HealthData; demo: boolean; onLogout: () => void }) {
  const [data, setData] = useState(initialData)
  const [view, setView] = useState<View>('dashboard')
  const [quickType, setQuickType] = useState<QuickType>(null)
  const [quickOpen, setQuickOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [timelineFilter, setTimelineFilter] = useState('all')
  const [search, setSearch] = useState('')

  const reload = async () => {
    if (demo) return
    setData(await healthRequest())
  }
  const act = async (action: string, payload: Record<string, unknown>, success: string) => {
    if (demo) {
      setToast('Demo mode is fictional and read-only. Create an account to save records.')
      return
    }
    setSaving(true)
    try {
      await healthRequest(action, payload)
      await reload()
      setQuickType(null)
      setQuickOpen(false)
      setToast(success)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Something went wrong')
    } finally { setSaving(false) }
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    return () => { delete document.documentElement.dataset.theme }
  }, [theme])
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 4200)
    return () => window.clearTimeout(timeout)
  }, [toast])
  useEffect(() => {
    if (demo || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const timer = window.setInterval(() => {
      const due = getDoseRows(data).find((dose) => dose.state === 'due')
      if (due) new Notification('Vitality medication reminder', { body: `${due.medication.name} ${due.medication.dosage} ${due.medication.unit} is due now.` })
      const appointment = data.appointments.find((item) => {
        const minutes = Math.round((new Date(item.startsAt).getTime() - Date.now()) / 60000)
        return (item.reminders || [10080, 1440, 60]).some((reminder: number) => Math.abs(minutes - reminder) <= 1)
      })
      if (appointment) new Notification('Vitality appointment reminder', { body: `${appointment.appointmentType} with ${appointment.doctor} is ${formatDateTime(appointment.startsAt)}.` })
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [data, demo])

  const todayWater = data.water.filter((item) => sameDay(item.recordedAt)).reduce((sum, item) => sum + Number(item.amountMl), 0)
  const doses = getDoseRows(data)
  const taken = doses.filter((dose) => dose.state === 'taken').length
  const adherence = doses.length ? Math.round((taken / doses.length) * 100) : 100
  const unread = data.notifications.filter((item) => !item.isRead).length

  return (
    <div className="health-shell">
      <aside className={`side-nav ${mobileOpen ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark"><HeartPulse /></div><div><strong>VITAL</strong><span>ITY</span></div></div>
        <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X /></button>
        <div className="profile-mini"><div className="avatar">{initials(data.profile.fullName)}</div><div><strong>{data.profile.fullName || 'Vitality Member'}</strong><span>{demo ? 'Fictional demo profile' : 'Private health space'}</span></div></div>
        <nav>{nav.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => { setView(item.id); setMobileOpen(false) }}><item.icon /><span>{item.label}</span>{view === item.id && <i />}</button>)}</nav>
        <div className="privacy-card"><ShieldCheck /><div><strong>Private by design</strong><span>Your records stay linked to your secure account.</span></div></div>
        <button className="logout-button" onClick={onLogout}><LogOut /> {demo ? 'Exit demo' : 'Log out'}</button>
      </aside>
      {mobileOpen && <button className="nav-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <main className="app-main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileOpen(true)}><Menu /></button>
          <div className="topbar-copy"><span>{formatLongDate(new Date())}</span><strong>{view === 'dashboard' ? `Good ${dayPart()}, ${firstName(data.profile.fullName)}` : nav.find((item) => item.id === view)?.label}</strong></div>
          <div className="top-actions">
            <label className="search"><Search /><input aria-label="Search health records" placeholder="Search your health" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">{theme === 'dark' ? <Sun /> : <Moon />}</button>
            <button className="icon-button notification-button" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications"><Bell />{unread > 0 && <span>{unread}</span>}</button>
            <button className="primary-button compact" onClick={() => setQuickOpen(!quickOpen)}><Plus /> Add record</button>
          </div>
        </header>

        {data.demo && <div className="demo-banner"><Sparkles /><span><strong>Fictional starter data.</strong> Nothing preloaded belongs to a real patient.</span>{demo && <button onClick={onLogout}>Create your space</button>}</div>}
        {notificationsOpen && <NotificationPanel data={data} close={() => setNotificationsOpen(false)} act={act} requestPermission={() => requestNotificationPermission(setToast)} />}
        {quickOpen && <QuickMenu choose={(type) => { setQuickType(type); setQuickOpen(false) }} close={() => setQuickOpen(false)} />}
        {search && <SearchResults data={data} query={search} close={() => setSearch('')} setView={setView} />}

        <section className="content-area">
          {view === 'dashboard' && <Dashboard data={data} doses={doses} adherence={adherence} todayWater={todayWater} setView={setView} add={setQuickType} act={act} />}
          {view === 'health' && <HealthView data={data} add={setQuickType} />}
          {view === 'medications' && <MedicationView data={data} doses={doses} add={setQuickType} act={act} />}
          {view === 'activities' && <ActivitiesView data={data} add={setQuickType} />}
          {view === 'symptoms' && <SymptomsView data={data} add={setQuickType} />}
          {view === 'timeline' && <TimelineView data={data} filter={timelineFilter} setFilter={setTimelineFilter} />}
          {view === 'appointments' && <AppointmentsView data={data} add={setQuickType} />}
          {view === 'insights' && <InsightsView data={data} />}
          {view === 'reports' && <ReportsView data={data} adherence={adherence} />}
          {view === 'profile' && <ProfileView data={data} act={act} saving={saving} requestPermission={() => requestNotificationPermission(setToast)} />}
        </section>
      </main>

      <nav className="mobile-tabs">{nav.slice(0, 4).map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><item.icon /><span>{item.label === 'Dashboard' ? 'Home' : item.label}</span></button>)}<button onClick={() => setView('profile')} className={view === 'profile' ? 'active' : ''}><UserRound /><span>Profile</span></button></nav>
      <button className="floating-add" onClick={() => setQuickOpen(!quickOpen)} aria-label="Quick add"><Plus /></button>
      {quickType && <RecordModal type={quickType} close={() => setQuickType(null)} act={act} saving={saving} />}
      {toast && <div className="toast"><Check />{toast}</div>}
    </div>
  )
}

function Dashboard({ data, doses, adherence, todayWater, setView, add, act }: any) {
  const sleep = data.sleep[0]?.durationMinutes ?? 0
  const activityMinutes = data.activities.filter((item: any) => Date.now() - new Date(item.occurredAt).getTime() < 7 * 86_400_000).reduce((sum: number, item: any) => sum + item.durationMinutes, 0)
  const heartRate = data.metrics.find((item: any) => item.metricType === 'Heart rate')
  const weight = data.metrics.find((item: any) => item.metricType === 'Weight')
  const mood = data.moods[0]
  return <>
    <div className="section-heading"><div><span className="eyebrow">YOUR HEALTH OS</span><h1>Today, at a glance.</h1><p>Small signals, organized into one calm personal timeline.</p></div><button className="secondary-button" onClick={() => add('checkin')}><MessageCircleHeart /> Daily check-in</button></div>
    <div className="metric-grid">
      <MetricCard icon={Activity} label="Active minutes" value={`${activityMinutes}`} unit="this week" accent="lime" trend="+12%" />
      <MetricCard icon={Droplets} label="Hydration" value={`${todayWater}`} unit={`of ${data.profile.waterTargetMl || 2500} ml`} accent="blue" progress={Math.min(100, todayWater / (data.profile.waterTargetMl || 2500) * 100)} />
      <MetricCard icon={Moon} label="Sleep" value={`${Math.floor(sleep / 60)}h ${sleep % 60}m`} unit="latest night" accent="violet" trend="Good" />
      <MetricCard icon={HeartPulse} label="Heart rate" value={heartRate?.value || '—'} unit={heartRate?.unit || 'bpm'} accent="coral" pulse />
    </div>
    <div className="dashboard-grid">
      <section className="panel medication-panel"><PanelTitle icon={Pill} title="Medication flow" subtitle={`${adherence}% of today's scheduled doses recorded`} action="Manage" onAction={() => setView('medications')} />
        <div className="adherence-row"><div className="adherence-ring" style={{ '--progress': `${adherence * 3.6}deg` } as any}><div><strong>{adherence}%</strong><span>adherence</span></div></div><div className="dose-list">{doses.slice(0, 5).map((dose: any) => <DoseRow key={dose.schedule.id} dose={dose} act={act} />)}</div></div>
      </section>
      <section className="panel trend-panel"><PanelTitle icon={Zap} title="Vital trends" subtitle="Your recent recorded measurements" action="All metrics" onAction={() => setView('health')} /><TrendChart data={data.metrics} /><div className="trend-stats"><span><i className="pink" />Weight <strong>{weight?.value || '—'} kg</strong></span><span><i className="blue" />Mood <strong>{mood?.mood || '—'}</strong></span></div></section>
      <section className="panel timeline-panel"><PanelTitle icon={History} title="Today's timeline" subtitle="Your latest health events" action="View all" onAction={() => setView('timeline')} /><TimelineList items={data.timeline.slice(0, 5)} /></section>
      <section className="panel insight-panel"><div className="insight-orb"><BrainCircuit /></div><span className="eyebrow">HEALTH INTELLIGENCE</span><h2>Your patterns, made understandable.</h2><p>{data.insights[0]?.message || 'Keep recording your day to unlock personal trends.'}</p><button onClick={() => setView('insights')}>Open Health Intelligence <ChevronRight /></button><small>Informational only — never diagnosis or medical advice.</small></section>
      <section className="panel appointment-panel"><PanelTitle icon={CalendarDays} title="Next appointment" subtitle="Stay prepared" />{data.appointments[0] ? <div className="appointment-card"><div className="date-tile"><strong>{new Date(data.appointments[0].startsAt).getDate()}</strong><span>{new Date(data.appointments[0].startsAt).toLocaleString('en', { month: 'short' })}</span></div><div><h3>{data.appointments[0].appointmentType}</h3><p>{data.appointments[0].doctor} · {data.appointments[0].clinic}</p><span><Clock3 /> {formatDateTime(data.appointments[0].startsAt)}</span></div></div> : <EmptyState icon={CalendarDays} text="No upcoming appointments" />}</section>
      <section className="panel quick-log-panel"><PanelTitle icon={Plus} title="Quick log" subtitle="Capture a health moment" /><div className="quick-grid">{quickItems.map((item) => <button key={item.type} onClick={() => add(item.type)} className={item.color}><item.icon /><span>{item.label}</span></button>)}</div></section>
    </div>
  </>
}

function HealthView({ data, add }: any) {
  const metricTypes = ['Weight', 'Blood pressure', 'Heart rate', 'Blood glucose', 'Body temperature', 'Oxygen saturation']
  return <><PageHeading eyebrow="MEASUREMENTS" title="Health metrics" description="Record observations without turning numbers into diagnoses." action="Add measurement" onAction={() => add('metric')} />
    <div className="metric-detail-grid">{metricTypes.map((type) => { const latest = data.metrics.find((item: any) => item.metricType === type); return <article className="panel metric-detail" key={type}><span>{type}</span><strong>{latest ? `${latest.value}${latest.secondaryValue ? `/${latest.secondaryValue}` : ''}` : '—'} <small>{latest?.unit}</small></strong><p>{latest ? `Recorded ${relativeTime(latest.recordedAt)}` : 'No readings yet'}</p><div className="sparkline" /></article> })}</div>
    <section className="panel caution-card"><Stethoscope /><div><h3>Measurements are context, not conclusions.</h3><p>Vitality does not diagnose. Consider discussing unusual or persistent readings with a qualified healthcare professional.</p></div></section>
    <section className="panel records-table"><PanelTitle icon={HeartPulse} title="Measurement history" subtitle="Most recent readings" /><DataTable rows={data.metrics} columns={[['metricType','Metric'],['value','Value'],['unit','Unit'],['recordedAt','Recorded']]} /></section>
  </>
}

function MedicationView({ data, doses, add, act }: any) {
  return <><PageHeading eyebrow="MEDICATION COMPANION" title="Medication schedule" description="See every dose, record what happened, and keep a clear history." action="Add medication" onAction={() => add('medication')} />
    <div className="medication-layout"><section className="panel"><PanelTitle icon={AlarmClock} title="Today's doses" subtitle={`${doses.length} scheduled`} />{doses.map((dose: any) => <DoseRow key={dose.schedule.id} dose={dose} act={act} expanded />)}</section><section className="panel medication-list"><PanelTitle icon={Pill} title="Your medications" subtitle={`${data.medications.length} total`} />{data.medications.map((med: any) => <article key={med.id}><div className="med-icon"><Pill /></div><div><h3>{med.name}</h3><p>{med.dosage} {med.unit} · {med.frequency}</p><span>{med.instructions || 'No special instructions'}</span></div><div className={`status-chip ${med.status}`}>{med.status}</div><button className="more-button"><MoreHorizontal /></button><div className="med-actions"><button onClick={() => act('medicationState',{ id: med.id, status: med.status === 'paused' ? 'active' : 'paused' }, med.status === 'paused' ? 'Medication resumed' : 'Medication paused')}>{med.status === 'paused' ? 'Resume' : 'Pause'}</button><button onClick={() => act('medicationState',{ id: med.id, status: 'ended' }, 'Medication ended')}>End</button></div></article>)}</section></div>
    <section className="panel records-table"><PanelTitle icon={History} title="Dose history" subtitle="Exact status and recording time" /><DataTable rows={data.medicationLogs} columns={[['status','Status'],['scheduledFor','Scheduled'],['recordedAt','Recorded']]} /></section>
  </>
}

function ActivitiesView({ data, add }: any) {
  const weekly = data.activities.filter((item: any) => Date.now() - new Date(item.occurredAt).getTime() < 7 * 86_400_000)
  return <><PageHeading eyebrow="MOVEMENT & RECOVERY" title="Activities, sleep & water" description="Track the routines that shape how you feel." action="Log activity" onAction={() => add('activity')} />
    <div className="triple-grid"><ProgressPanel icon={Dumbbell} title="Movement" value={`${weekly.reduce((s: number, i: any) => s + i.durationMinutes, 0)} min`} subtitle="this week" color="lime" action={() => add('activity')} /><ProgressPanel icon={Moon} title="Sleep" value={`${Math.floor((data.sleep[0]?.durationMinutes || 0)/60)}h ${(data.sleep[0]?.durationMinutes || 0)%60}m`} subtitle="latest night" color="violet" action={() => add('sleep')} /><ProgressPanel icon={Droplets} title="Hydration" value={`${data.water.filter((i:any)=>sameDay(i.recordedAt)).reduce((s:number,i:any)=>s+i.amountMl,0)} ml`} subtitle="today" color="blue" action={() => add('water')} /></div>
    <div className="two-column"><section className="panel"><PanelTitle icon={Activity} title="Recent activity" subtitle="Distance, duration and energy" />{data.activities.map((item: any) => <RecordRow key={item.id} icon={Dumbbell} title={item.activityType} meta={`${item.durationMinutes} min · ${item.distanceKm || '—'} km · ${item.calories || '—'} kcal`} date={item.occurredAt} />)}</section><section className="panel"><PanelTitle icon={Moon} title="Sleep history" subtitle="Duration and self-rated quality" />{data.sleep.map((item: any) => <RecordRow key={item.id} icon={Moon} title={`${Math.floor(item.durationMinutes/60)}h ${item.durationMinutes%60}m`} meta={`Quality ${item.quality}/5`} date={item.bedtime} />)}</section></div>
  </>
}

function SymptomsView({ data, add }: any) { return <><PageHeading eyebrow="PERSONAL JOURNAL" title="Symptoms & wellbeing" description="Record what you notice, when it happens, and possible context." action="Record symptom" onAction={() => add('symptom')} /><div className="two-column"><section className="panel"><PanelTitle icon={ClipboardPlus} title="Symptom journal" subtitle="Chronological observations" />{data.symptoms.map((item: any)=><article className="symptom-card" key={item.id}><div className="severity">{item.severity}<span>/10</span></div><div><h3>{item.symptom}</h3><p>{item.possibleTrigger ? `Possible trigger: ${item.possibleTrigger}` : 'No trigger recorded'}</p><span>{formatDateTime(item.startedAt)}</span></div></article>)}</section><section className="panel"><PanelTitle icon={MessageCircleHeart} title="Mood trend" subtitle="No mental-health diagnosis is provided" /><MoodChart moods={data.moods}/><div className="mood-history">{data.moods.map((item:any)=><RecordRow key={item.id} icon={Sparkles} title={item.mood} meta={`Stress ${item.stressLevel}/10 · Energy ${item.energyLevel}/10`} date={item.recordedAt}/>)}</div><button className="secondary-button full" onClick={()=>add('mood')}>Log today's mood</button></section></div></> }

function TimelineView({ data, filter, setFilter }: any) {
  const filters = ['all','medication','activity','symptom','measurement','appointment','sleep','mood','water']
  const items = filter === 'all' ? data.timeline : data.timeline.filter((item:any)=>item.eventType===filter)
  return <><PageHeading eyebrow="PERSONAL HISTORY" title="Health timeline" description="A searchable chronology of the health moments you choose to record." /><div className="filter-row">{filters.map((item)=><button key={item} className={filter===item?'active':''} onClick={()=>setFilter(item)}>{item}</button>)}</div><section className="panel master-timeline">{items.length ? <TimelineList items={items} large /> : <EmptyState icon={History} text="No events match this filter" />}</section></>
}

function AppointmentsView({ data, add }: any) { return <><PageHeading eyebrow="CARE COORDINATION" title="Appointments" description="Keep visits, reminders, locations and preparation notes together." action="Add appointment" onAction={()=>add('appointment')} /><div className="appointment-grid">{data.appointments.map((item:any)=><article className="panel appointment-large" key={item.id}><div className="date-tile large"><strong>{new Date(item.startsAt).getDate()}</strong><span>{new Date(item.startsAt).toLocaleString('en',{month:'short'})}</span></div><div><span className="eyebrow">UPCOMING</span><h2>{item.appointmentType}</h2><p>{item.doctor} · {item.clinic}</p><span><Clock3/> {formatDateTime(item.startsAt)}</span><span><CalendarDays/> {item.location}</span>{item.attachmentName&&<a className="attachment-link" href={`/api/attachment?key=${encodeURIComponent(item.attachmentName)}`}><Download/> Download private attachment</a>}<small>{item.notes}</small></div></article>)}</div>{!data.appointments.length&&<EmptyState icon={CalendarDays} text="No appointments scheduled"/>}</> }

function InsightsView({ data }: any) {
  const sleepAvg = data.sleep.length ? Math.round(data.sleep.reduce((s:number,i:any)=>s+i.durationMinutes,0)/data.sleep.length) : 0
  const activityThisWeek = data.activities.filter((i:any)=>Date.now()-new Date(i.occurredAt).getTime()<7*86400000).reduce((s:number,i:any)=>s+i.durationMinutes,0)
  const missed = data.medicationLogs.filter((i:any)=>i.status==='missed').length
  const generated = [`Your recorded sleep averages ${Math.floor(sleepAvg/60)}h ${sleepAvg%60}m.`,`You logged ${activityThisWeek} active minutes during the last 7 days.`,`You recorded ${missed} missed medication doses in the available history.`]
  return <><PageHeading eyebrow="HEALTH INTELLIGENCE" title="Patterns, not prescriptions." description="Understand only the data you recorded, with clear limits and cautious language."/><section className="ai-hero panel"><div className="ai-orbit"><BrainCircuit/></div><div><span className="eyebrow">INFORMATIONAL ANALYSIS</span><h2>Your health data has a story.</h2><p>Health Intelligence organizes your own records into plain-language patterns. It never diagnoses, prescribes, or recommends changing medication.</p></div></section><div className="insight-grid">{[...generated,...data.insights.map((i:any)=>i.message)].slice(0,6).map((message,index)=><article className="panel insight-card" key={`${message}-${index}`}><span>0{index+1}</span><Sparkles/><p>{message}</p></article>)}</div><div className="disclaimer"><ShieldCheck/><p><strong>Health Intelligence provides informational insights based on your recorded data.</strong> It is not a medical professional and does not provide diagnosis or treatment. Consult a qualified healthcare professional for medical decisions.</p></div></>
}

function ReportsView({ data, adherence }: any) {
  const exportCsv = () => { const rows = [['Category','Date','Record'],...data.timeline.map((i:any)=>[i.eventType,i.occurredAt,`${i.title} — ${i.detail||''}`])]; downloadBlob(rows.map((row:any[])=>row.map(csvCell).join(',')).join('\n'),'vitality-report.csv','text/csv') }
  const exportPdf = () => { const doc = new jsPDF(); doc.setFontSize(20); doc.text('Vitality — Personal Health Report',20,22); doc.setFontSize(10); doc.text('User-generated personal health record. Not a medical diagnosis.',20,30); let y=42; const lines=[`Name: ${data.profile.fullName}`,`Generated: ${new Date().toLocaleString()}`,`Medication adherence: ${adherence}%`,`Medications: ${data.medications.length}`,`Measurements: ${data.metrics.length}`,`Activities: ${data.activities.length}`,`Symptoms: ${data.symptoms.length}`,`Appointments: ${data.appointments.length}`]; lines.forEach((line)=>{doc.text(line,20,y);y+=8}); y+=4; doc.setFontSize(14);doc.text('Recent timeline',20,y);y+=8;doc.setFontSize(9);data.timeline.slice(0,18).forEach((item:any)=>{const line=`${new Date(item.occurredAt).toLocaleDateString()}  ${item.title}`;doc.text(line.slice(0,95),20,y);y+=6});doc.save('vitality-report.pdf') }
  return <><PageHeading eyebrow="PORTABLE RECORDS" title="Reports & exports" description="Create a clear, user-generated personal health record to keep or share intentionally."/><section className="report-cover panel"><div className="report-mark"><FileHeart/></div><div><span className="eyebrow">PERSONAL HEALTH REPORT</span><h2>{data.profile.fullName}</h2><p>Compiled from the records entered in Vitality.</p></div><div className="report-actions"><button className="primary-button" onClick={exportPdf}><Download/> Export PDF</button><button className="secondary-button" onClick={exportCsv}><Download/> Export CSV</button></div></section><div className="report-stats"><MetricCard icon={Pill} label="Adherence" value={`${adherence}%`} unit="recorded doses" accent="violet"/><MetricCard icon={HeartPulse} label="Measurements" value={data.metrics.length} unit="records" accent="coral"/><MetricCard icon={Dumbbell} label="Activities" value={data.activities.length} unit="sessions" accent="lime"/><MetricCard icon={ClipboardPlus} label="Symptoms" value={data.symptoms.length} unit="observations" accent="blue"/></div><section className="panel report-note"><ShieldCheck/><div><h3>Privacy reminder</h3><p>Exports may contain sensitive health information. Store and share them carefully. This report is user-generated and is not a certified medical record.</p></div></section></>
}

function ProfileView({ data, act, saving, requestPermission }: any) {
  const [form,setForm]=useState({...data.profile})
  const submit=(event:FormEvent)=>{event.preventDefault();act('updateProfile',form,'Profile updated')}
  return <><PageHeading eyebrow="PRIVATE PROFILE" title="Profile & emergency information" description="Keep essential information organized and visible only inside your account."/><form className="panel profile-form" onSubmit={submit}><PanelTitle icon={UserRound} title="Personal details" subtitle="Sensitive information is never made public"/><div className="form-grid"><Field label="Full name" name="fullName" value={form.fullName} set={setForm}/><Field label="Date of birth" name="dateOfBirth" type="date" value={form.dateOfBirth} set={setForm}/><Field label="Gender" name="gender" value={form.gender} set={setForm}/><Field label="Blood type" name="bloodType" value={form.bloodType} set={setForm}/><Field label="Height (cm)" name="heightCm" type="number" value={form.heightCm} set={setForm}/><Field label="Weight (kg)" name="weightKg" type="number" value={form.weightKg} set={setForm}/><Field label="Emergency contact" name="emergencyContact" value={form.emergencyContact} set={setForm}/><Field label="Doctor contact" name="doctorContact" value={form.doctorContact} set={setForm}/><Field label="Allergies" name="allergies" value={form.allergies} set={setForm} textarea/><Field label="Existing conditions" name="conditions" value={form.conditions} set={setForm} textarea/><Field label="Current medications" name="currentMedications" value={form.currentMedications} set={setForm} textarea/><Field label="Daily water target (ml)" name="waterTargetMl" type="number" value={form.waterTargetMl} set={setForm}/></div><div className="form-footer"><button type="button" className="secondary-button" onClick={requestPermission}><Bell/> Enable browser reminders</button><button className="primary-button" disabled={saving}>{saving?'Saving…':'Save profile'}</button></div></form><section className="panel emergency-card"><div className="emergency-header"><div><span>EMERGENCY CARD</span><strong>{form.fullName}</strong></div><HeartPulse/></div><div className="emergency-grid"><span>Blood type<strong>{form.bloodType||'—'}</strong></span><span>Allergies<strong>{form.allergies||'None recorded'}</strong></span><span>Conditions<strong>{form.conditions||'None recorded'}</strong></span><span>Emergency contact<strong>{form.emergencyContact||'—'}</strong></span></div><small>This card is shown only inside the authenticated application. No public URL or unsecured QR code is created.</small></section></>
}

function RecordModal({ type, close, act, saving }: { type: Exclude<QuickType,null>; close:()=>void; act:any; saving:boolean }) {
  const nowLocal = new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)
  const [form,setForm]=useState<Record<string,any>>({ recordedAt:nowLocal, occurredAt:nowLocal, startedAt:nowLocal, startsAt:nowLocal, startDate:new Date().toISOString().slice(0,10), bedtime:nowLocal, wakeTime:nowLocal, quality:4, severity:5, stressLevel:5, energyLevel:5, mood:'Good', amountMl:250, durationMinutes:30, metricType:'Heart rate', unit:'bpm', activityType:'Walking', times:'08:00, 20:00', frequency:'Twice daily', foodInstruction:'With food' })
  const [formError,setFormError]=useState('')
  const config:Record<string,{title:string;action:string;success:string;fields:Array<any>}>= {
    medication:{title:'Add medication',action:'addMedication',success:'Medication and schedule created',fields:[['name','Medication name','text'],['dosage','Dose','number'],['unit','Unit','text'],['frequency','Frequency','text'],['times','Times, comma separated','text'],['startDate','Start date','date'],['endDate','End date','date'],['foodInstruction','Food instruction','select',['With food','Without food','Either']],['prescribingDoctor','Prescribing doctor','text'],['instructions','Instructions','textarea'],['notes','Notes','textarea']]},
    water:{title:'Log water',action:'addWater',success:'Hydration recorded',fields:[['amountMl','Amount (ml)','number'],['recordedAt','Date and time','datetime-local']]},
    activity:{title:'Log activity',action:'addActivity',success:'Activity recorded',fields:[['activityType','Activity type','select',['Walking','Running','Cycling','Gym','Swimming','Other']],['durationMinutes','Duration (minutes)','number'],['distanceKm','Distance (km)','number'],['calories','Calories','number'],['occurredAt','Date and time','datetime-local'],['notes','Notes','textarea']]},
    symptom:{title:'Record symptom',action:'addSymptom',success:'Symptom recorded',fields:[['symptom','Symptom','text'],['severity','Severity (1–10)','range'],['startedAt','Started','datetime-local'],['endedAt','Ended','datetime-local'],['frequency','Frequency','text'],['possibleTrigger','Possible trigger','text'],['notes','Notes','textarea']]},
    metric:{title:'Record measurement',action:'addMetric',success:'Measurement recorded',fields:[['metricType','Metric','select',['Weight','Height','Blood pressure','Heart rate','Blood glucose','Body temperature','Oxygen saturation','BMI']],['value','Primary value','number'],['secondaryValue','Secondary value (optional)','number'],['unit','Unit','text'],['recordedAt','Date and time','datetime-local'],['notes','Notes','textarea']]},
    mood:{title:'Mood check-in',action:'addMood',success:'Mood check-in recorded',fields:[['mood','How do you feel?','select',['Excellent','Good','Neutral','Low','Very Low']],['stressLevel','Stress level (1–10)','range'],['energyLevel','Energy level (1–10)','range'],['recordedAt','Date and time','datetime-local'],['notes','Notes','textarea']]},
    sleep:{title:'Record sleep',action:'addSleep',success:'Sleep recorded',fields:[['bedtime','Bedtime','datetime-local'],['wakeTime','Wake-up time','datetime-local'],['quality','Sleep quality (1–5)','range'],['notes','Notes','textarea']]},
    appointment:{title:'Add appointment',action:'addAppointment',success:'Appointment scheduled',fields:[['doctor','Doctor','text'],['clinic','Hospital or clinic','text'],['appointmentType','Appointment type','text'],['startsAt','Date and time','datetime-local'],['location','Location','text'],['attachmentFile','Private attachment','file'],['notes','Notes','textarea']]},
    checkin:{title:'Daily health check-in',action:'dailyCheckin',success:'Daily check-in completed',fields:[['mood','How are you feeling?','select',['Excellent','Good','Neutral','Low','Very Low']],['sleepQuality','How was your sleep?','select',['Excellent','Good','Fair','Poor']],['medicationsTaken','Did you take your medications?','select',['Yes','Some','No','Not applicable']],['waterMl','How much water so far? (ml)','number'],['exercised','Did you exercise?','select',['No','Yes']],['exerciseMinutes','Exercise minutes','number'],['symptom','Any symptoms today?','text'],['severity','Symptom severity','range'],['stressLevel','Stress level','range'],['energyLevel','Energy level','range'],['notes','Anything else?','textarea']]},
  }
  const current=config[type]
  const submit=async(event:FormEvent)=>{event.preventDefault();setFormError('');try{const payload={...form};if(type==='appointment'&&form.attachmentFile){const upload=new FormData();upload.append('file',form.attachmentFile);const response=await fetch('/api/attachment',{method:'POST',body:upload,credentials:'same-origin'});const result=await response.json();if(!response.ok)throw new Error(result.error||'Attachment upload failed');payload.attachmentName=result.key;delete payload.attachmentFile}await act(current.action,payload,current.success)}catch(error){setFormError(error instanceof Error?error.message:'Unable to save record')}}
  return <div className="modal-backdrop" onMouseDown={close}><form className="record-modal" onSubmit={submit} onMouseDown={(e)=>e.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">QUICK RECORD</span><h2>{current.title}</h2></div><button type="button" onClick={close}><X/></button></div><div className="modal-fields">{current.fields.map(([name,label,kind,options])=><ModalField key={name} name={name} label={label} kind={kind} options={options} form={form} setForm={setForm}/>)}</div>{formError&&<div className="auth-error">{formError}</div>}<p className="medical-note"><ShieldCheck/> Records are informational and are not medical diagnosis.</p><div className="modal-footer"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" disabled={saving}>{saving?'Saving…':'Save record'}</button></div></form></div>
}

function ModalField({name,label,kind,options,form,setForm}:any){ const value=form[name]??''; if(kind==='file')return <label className="field full"><span>{label} · PDF, PNG, JPG or text · 10 MB max</span><input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={(e)=>setForm({...form,[name]:e.target.files?.[0]})}/></label>;if(kind==='textarea')return <label className="field full"><span>{label}</span><textarea value={value} onChange={(e)=>setForm({...form,[name]:e.target.value})}/></label>;if(kind==='select')return <label className="field"><span>{label}</span><select value={value} onChange={(e)=>setForm({...form,[name]:e.target.value})}>{options.map((o:string)=><option key={o}>{o}</option>)}</select></label>;if(kind==='range')return <label className="field range-field"><span>{label}<strong>{value}</strong></span><input type="range" min="1" max={name==='quality'?'5':'10'} value={value} onChange={(e)=>setForm({...form,[name]:e.target.value})}/></label>;return <label className="field"><span>{label}</span><input required={!['endDate','endedAt','secondaryValue','distanceKm','calories','attachmentName','symptom','exerciseMinutes'].includes(name)} type={kind} step={kind==='number'?'any':undefined} value={value} onChange={(e)=>setForm({...form,[name]:e.target.value})}/></label> }

function SearchResults({data,query,close,setView}:any){const needle=query.toLowerCase();const results=[...data.medications.map((item:any)=>({title:item.name,detail:`${item.dosage} ${item.unit}`,view:'medications'})),...data.timeline.map((item:any)=>({title:item.title,detail:item.detail,view:'timeline'})),...data.appointments.map((item:any)=>({title:item.appointmentType,detail:item.doctor,view:'appointments'})),...data.symptoms.map((item:any)=>({title:item.symptom,detail:`Severity ${item.severity}/10`,view:'symptoms'}))].filter((item:any)=>`${item.title} ${item.detail}`.toLowerCase().includes(needle)).slice(0,8);return <div className="search-results"><div><strong>Search results</strong><button onClick={close}><X/></button></div>{results.length?results.map((item:any,index:number)=><button key={`${item.title}-${index}`} onClick={()=>{setView(item.view);close()}}><Search/><span><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight/></button>):<p>No matching private records.</p>}</div>}

function NotificationPanel({data,close,act,requestPermission}:any){return <div className="notification-panel"><div className="panel-title"><div><Bell/><span><strong>Notifications</strong><small>{data.notifications.filter((i:any)=>!i.isRead).length} unread</small></span></div><button onClick={close}><X/></button></div><button className="permission-row" onClick={requestPermission}><Bell/> Enable browser notifications <ChevronRight/></button><div className="notification-list">{data.notifications.map((item:any)=><article className={item.isRead?'read':''} key={item.id}><div className="notification-dot"/><div><strong>{item.title}</strong><p>{item.message}</p><span>{relativeTime(item.createdAt)}</span><div><button onClick={()=>act('notificationRead',{id:item.id},'Marked as read')}>Mark read</button><button onClick={()=>act('notificationDelete',{id:item.id},'Notification deleted')}>Delete</button></div></div></article>)}</div></div>}
function QuickMenu({choose,close}:any){return <div className="quick-menu"><div><strong>Quick record</strong><button onClick={close}><X/></button></div>{quickItems.map((item)=><button key={item.type} onClick={()=>choose(item.type)}><span className={item.color}><item.icon/></span>{item.label}<ChevronRight/></button>)}<button onClick={()=>choose('sleep')}><span className="violet"><Moon/></span>Sleep<ChevronRight/></button><button onClick={()=>choose('appointment')}><span className="blue"><CalendarDays/></span>Appointment<ChevronRight/></button></div>}
function DoseRow({dose,act,expanded}:any){const medication=dose.medication;return <article className={`dose-row ${expanded?'expanded':''}`}><div className={`dose-state ${dose.state}`}><Pill/></div><div><h3>{medication.name}</h3><p>{medication.dosage} {medication.unit} · {formatTime(dose.schedule.doseTime)}</p></div><span className={`dose-chip ${dose.state}`}>{dose.state}</span>{dose.state!=='taken'&&<div className="dose-actions"><button onClick={()=>act('doseStatus',{medicationId:medication.id,scheduleId:dose.schedule.id,status:'taken',scheduledFor:dose.scheduledFor},`${medication.name} recorded as taken`)}>Taken</button><button onClick={()=>act('doseStatus',{medicationId:medication.id,scheduleId:dose.schedule.id,status:'delayed',scheduledFor:dose.scheduledFor},'Dose snoozed for 10 minutes')}>Snooze</button><button onClick={()=>act('doseStatus',{medicationId:medication.id,scheduleId:dose.schedule.id,status:'skipped',scheduledFor:dose.scheduledFor},'Dose recorded as skipped')}>Skip</button></div>}</article>}
function MetricCard({icon:Icon,label,value,unit,accent,trend,progress,pulse}:any){return <article className={`metric-card ${accent}`}><div className="metric-icon"><Icon/></div><span>{label}</span><strong>{value}</strong><small>{unit}</small>{trend&&<em>{trend}</em>}{progress!==undefined&&<div className="mini-progress"><i style={{width:`${progress}%`}}/></div>}{pulse&&<div className="pulse-line"/>}</article>}
function PanelTitle({icon:Icon,title,subtitle,action,onAction}:any){return <div className="panel-title"><div><Icon/><span><strong>{title}</strong><small>{subtitle}</small></span></div>{action&&<button onClick={onAction}>{action}<ChevronRight/></button>}</div>}
function PageHeading({eyebrow,title,description,action,onAction}:any){return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action&&<button className="primary-button" onClick={onAction}><Plus/>{action}</button>}</div>}
function ProgressPanel({icon:Icon,title,value,subtitle,color,action}:any){return <article className={`panel progress-panel ${color}`}><div><Icon/><button onClick={action}><Plus/></button></div><span>{title}</span><strong>{value}</strong><p>{subtitle}</p><div className="wide-progress"><i/></div></article>}
function RecordRow({icon:Icon,title,meta,date}:any){return <article className="record-row"><div><Icon/></div><span><strong>{title}</strong><small>{meta}</small></span><time>{relativeTime(date)}</time></article>}
function TimelineList({items,large}:any){return <div className={`timeline-list ${large?'large':''}`}>{items.map((item:any,index:number)=><article key={item.id||index}><time>{formatTime(new Date(item.occurredAt).toTimeString())}</time><div className={`timeline-dot ${item.eventType}`}><TimelineIcon type={item.eventType}/></div><div><strong>{item.title}</strong><span>{item.detail}</span>{large&&<small>{formatDateTime(item.occurredAt)}</small>}</div></article>)}</div>}
function TimelineIcon({type}:any):ReactNode{const icons:any={medication:Pill,activity:Dumbbell,symptom:ClipboardPlus,measurement:HeartPulse,appointment:CalendarDays,sleep:Moon,mood:Sparkles,water:Droplets};const Icon=icons[type]||Activity;return <Icon/>}
function TrendChart({data}:any){const values=[...data].filter((i:any)=>i.metricType==='Weight').reverse().slice(-8);const fallback=[71.9,72.1,71.8,72.4,72.2,72.5,72.4];return <div className="chart-wrap"><Line data={{labels:(values.length?values:fallback).map((_:any,i:number)=>`D${i+1}`),datasets:[{data:values.length?values.map((i:any)=>Number(i.value)):fallback,borderColor:'#9df7c5',backgroundColor:'rgba(157,247,197,.08)',fill:true,tension:.42,pointRadius:0,borderWidth:2}]}} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}}}/></div>}
function MoodChart({moods}:any){const values=moods.length?[...moods].reverse().map((m:any)=>({Excellent:5,Good:4,Neutral:3,Low:2,'Very Low':1}[m.mood]||3)):[3,4,3,5,4,4,4];return <div className="chart-wrap mood"><Line data={{labels:values.map((_:any,i:number)=>i+1),datasets:[{data:values,borderColor:'#d9b8ff',backgroundColor:'rgba(217,184,255,.12)',fill:true,tension:.45,pointRadius:3,pointBackgroundColor:'#d9b8ff'}]}} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false,min:1,max:5}}}}/></div>}
function DataTable({rows,columns}:any){return rows.length?<div className="table-wrap"><table><thead><tr>{columns.map((c:any)=><th key={c[0]}>{c[1]}</th>)}</tr></thead><tbody>{rows.slice(0,20).map((row:any,i:number)=><tr key={row.id||i}>{columns.map((c:any)=><td key={c[0]}>{String(c[0].toLowerCase().includes('at')?formatDateTime(row[c[0]]):row[c[0]]??'—')}</td>)}</tr>)}</tbody></table></div>:<EmptyState icon={FileHeart} text="No records yet"/>}
function EmptyState({icon:Icon,text}:any){return <div className="empty-state"><Icon/><strong>{text}</strong><span>Use the + button to add your first record.</span></div>}
function Field({label,name,type='text',value,set,textarea}:any){return <label className={`field ${textarea?'full':''}`}><span>{label}</span>{textarea?<textarea value={value||''} onChange={(e)=>set((f:any)=>({...f,[name]:e.target.value}))}/>:<input type={type} value={value||''} onChange={(e)=>set((f:any)=>({...f,[name]:e.target.value}))}/>}</label>}

function getDoseRows(data:HealthData){const today=new Date();const medications=new Map(data.medications.map((m)=>[m.id,m]));return data.schedules.map((schedule)=>{const medication=medications.get(schedule.medicationId);const [h,m]=String(schedule.doseTime).split(':').map(Number);const scheduled=new Date(today);scheduled.setHours(h,m,0,0);const log=data.medicationLogs.find((item)=>item.scheduleId===schedule.id&&sameDay(item.recordedAt||item.scheduledFor));let state=log?.status;if(!state){const diff=scheduled.getTime()-Date.now();state=diff>30*60000?'upcoming':diff>-30*60000?'due':'missed'}return {schedule,medication,state,scheduledFor:scheduled.toISOString()}}).filter((dose)=>dose.medication&&dose.medication.status==='active').sort((a,b)=>a.schedule.doseTime.localeCompare(b.schedule.doseTime))}
function sameDay(value:string){const date=new Date(value),today=new Date();return date.getFullYear()===today.getFullYear()&&date.getMonth()===today.getMonth()&&date.getDate()===today.getDate()}
function formatDateTime(value:string){if(!value)return '—';return new Date(value).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
function relativeTime(value:string){if(!value)return '—';const diff=Math.max(0,Date.now()-new Date(value).getTime());if(diff<3600000)return `${Math.max(1,Math.floor(diff/60000))}m ago`;if(diff<86400000)return `${Math.floor(diff/3600000)}h ago`;return `${Math.floor(diff/86400000)}d ago`}
function formatTime(value:string){const [h,m]=String(value).split(':');const date=new Date();date.setHours(Number(h),Number(m));return date.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}
function formatLongDate(date:Date){return date.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}
function dayPart(){const hour=new Date().getHours();return hour<12?'morning':hour<18?'afternoon':'evening'}
function firstName(name:string){return name?.split(' ')[0]||'there'}
function initials(name:string){return (name||'FH').split(' ').map((n)=>n[0]).join('').slice(0,2).toUpperCase()}
function requestNotificationPermission(setToast:(s:string)=>void){if(typeof Notification==='undefined'){setToast('Browser notifications are not supported here.');return}Notification.requestPermission().then((permission)=>setToast(permission==='granted'?'Browser medication reminders enabled':'Notification permission was not enabled'))}
function csvCell(value:unknown){return `"${String(value??'').replaceAll('"','""')}"`}
function downloadBlob(content:string,name:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
