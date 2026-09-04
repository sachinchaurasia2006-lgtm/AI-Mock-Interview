import { useEffect, useState } from 'react'
import { request, token } from './api'

const tracks = [
  ['HR', 'HR interview', 'Clarity under pressure', 'voice', 'Warm-up'],
  ['TECHNICAL', 'Technical interview', 'Systems and trade-offs', 'grid', 'Core'],
  ['JAVA', 'Java interview', 'JVM, Spring, and OOP', 'braces', 'Deep work'],
  ['DSA', 'DSA interview', 'Algorithms and complexity', 'nodes', 'Sprint'],
]

const TrackMark = ({ kind }) => <span className={`track-mark ${kind}`} aria-hidden="true"><i /><i /><i /></span>
const PressureLine = ({ value = 38, className = '' }) => <div className={`pressure-line ${className}`} aria-label={`Readiness ${value}%`}><span style={{ width: `${value}%` }} />{[...Array(16)].map((_, i) => <i key={i} />)}</div>

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('mockmate_user') || 'null'))
  const [page, setPage] = useState(token() ? 'dashboard' : 'auth')
  const [dashboard, setDashboard] = useState(null)
  const [interview, setInterview] = useState(null)
  const [message, setMessage] = useState('')
  const loadDashboard = async () => { try { setDashboard(await request('/dashboard')) } catch { logout() } }
  useEffect(() => { if (token()) loadDashboard() }, [])
  const logout = () => { localStorage.removeItem('mockmate_token'); localStorage.removeItem('mockmate_user'); setUser(null); setDashboard(null); setPage('auth') }
  const notify = (value) => { setMessage(value); setTimeout(() => setMessage(''), 3500) }
  const authSuccess = (data) => { localStorage.setItem('mockmate_token', data.token); localStorage.setItem('mockmate_user', JSON.stringify({ name: data.name, email: data.email })); setUser({ name: data.name, email: data.email }); setPage('dashboard'); loadDashboard() }
  const begin = async (type, targetRole = 'Software Developer', questionCount = 3) => { try { const created = await request('/interviews', { method: 'POST', body: JSON.stringify({ type, targetRole, questionCount }) }); setInterview(created); setPage('interview') } catch (e) { notify(e.message) } }
  return <div className="app-shell">
    {message && <div className="toast" role="status">{message}</div>}
    {user && <header><button className="brand" onClick={() => setPage('dashboard')}><span className="brand-sigil">M</span> MOCKMATE</button><nav><button onClick={() => setPage('dashboard')}>Overview</button><button onClick={() => setPage('setup')}>Practice</button><button onClick={() => setPage('resume')}>Resume</button><button className="avatar" onClick={logout} title="Log out">{user.name?.[0] || 'U'}</button></nav></header>}
    <main>
      {page === 'auth' && <Auth onSuccess={authSuccess} />}
      {page === 'dashboard' && <Dashboard user={user} data={dashboard} onPractice={() => setPage('setup')} onResume={() => setPage('resume')} />}
      {page === 'setup' && <Setup onStart={begin} />}
      {page === 'interview' && interview && <InterviewRoom interview={interview} onComplete={(done) => { if (done) setInterview(done); setPage('results'); loadDashboard() }} notify={notify} />}
      {page === 'results' && interview && <Results interview={interview} onPractice={() => setPage('setup')} />}
      {page === 'resume' && <Resume notify={notify} />}
    </main>
  </div>
}

function Auth({ onSuccess }) {
  const urlParams = new URLSearchParams(window.location.search)
  const initialToken = urlParams.get('resetToken') || ''
  const initialMode = initialToken ? 'reset' : 'login'
  
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '', token: initialToken })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const register = mode === 'register', forgot = mode === 'forgot', reset = mode === 'reset'
  const set = values => setForm(prev => ({ ...prev, ...values }))
  const changeMode = next => { setMode(next); setError(''); setNotice('') }

  const handleResend = async () => {
    if (!form.email?.trim()) {
      setError('Please enter your email address to resend the code.')
      return
    }
    setResending(true)
    setError('')
    setNotice('')
    try {
      const data = await request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: form.email.trim() })
      })
      if (data.developmentToken) {
        set({ token: data.developmentToken })
        setNotice(`New reset code: ${data.developmentToken}`)
      } else {
        setNotice(data.message || 'If an account exists, a reset link/code has been sent.')
      }
      setCooldown(30)
    } catch (x) {
      setError(x.message)
    } finally {
      setResending(false)
    }
  }

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (forgot) {
        const data = await request('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: form.email.trim() })
        })
        if (data.developmentToken) {
          set({ token: data.developmentToken })
          setNotice(`Reset code: ${data.developmentToken}`)
        } else {
          setNotice(data.message || 'If an account exists, a reset link has been sent.')
        }
        setCooldown(30)
      } else if (reset) {
        if (!form.token?.trim()) {
          throw new Error('Please enter the reset code.')
        }
        const data = await request('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: form.token.trim(), password: form.password })
        })
        setNotice(data.message || 'Password changed successfully! You can now sign in.')
        setMode('login')
      } else {
        const payload = register
          ? { name: form.name.trim(), email: form.email.trim(), password: form.password }
          : { email: form.email.trim(), password: form.password }
        const res = await request(`/auth/${register ? 'register' : 'login'}`, {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        onSuccess(res)
      }
    } catch (x) {
      setError(x.message)
    } finally {
      setBusy(false)
    }
  }

  const title = register ? 'Build your edge.' : forgot ? 'Reset your password.' : reset ? 'Choose a new password.' : 'Pick up where you left off.'
  const copy = register ? 'One focused session is enough to shift your confidence.' : forgot ? 'Enter your email and we will send you a secure reset link.' : reset ? 'Use the reset code from your email or dev mode, then set a new password.' : 'Your next answer is waiting.'

  return <section className="auth">
    <div className="auth-editorial">
      <div className="brand"><span className="brand-sigil">M</span> MOCKMATE</div>
      <div className="editorial-copy">
        <p className="eyebrow">INTERVIEW CONDITIONING</p>
        <h1>Walk in ready.<br />Speak like you belong.</h1>
        <p>MockMate turns the pressure of a real interview into a practice habit you can actually feel.</p>
      </div>
      <div className="editorial-meter">
        <span>READINESS SIGNAL</span>
        <PressureLine value={64} />
        <b>64 <small>baseline</small></b>
      </div>
    </div>
    <form className="auth-card" onSubmit={submit}>
      <div className="form-kicker">{register ? 'START YOUR PRACTICE' : forgot ? 'ACCOUNT RECOVERY' : reset ? 'NEW PASSWORD' : 'WELCOME BACK'}</div>
      <h2>{title}</h2>
      <p>{copy}</p>

      {register && (
        <Field label="Name">
          <input required value={form.name} onChange={e => set({ name: e.target.value })} placeholder="Your name" />
        </Field>
      )}

      <Field label="Email">
        <input type="email" required value={form.email} onChange={e => set({ email: e.target.value })} placeholder="you@example.com" />
      </Field>

      {(forgot || reset) && (
        <div className="resend-container">
          <span>Didn't get the code?</span>
          <button type="button" className="resend-btn" onClick={handleResend} disabled={resending || busy || cooldown > 0}>
            {resending ? 'Sending...' : cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend code'}
          </button>
        </div>
      )}

      {reset && (
        <Field label="Reset code">
          <input required value={form.token} onChange={e => set({ token: e.target.value })} placeholder="Code from your email or dev mode" />
        </Field>
      )}

      {!forgot && (
        <PasswordField value={form.password} onChange={value => set({ password: value })} label={reset ? 'New password' : 'Password'} />
      )}

      {error && <small className="error">{error}</small>}
      {notice && <small className="notice">{notice}</small>}

      <button className="primary wide" disabled={busy || resending}>
        {busy ? 'Working...' : forgot ? 'Send reset link' : reset ? 'Save new password' : register ? 'Create account' : 'Enter practice room'} <span>→</span>
      </button>

      <div className="auth-actions-group">
        {forgot && (
          <button type="button" className="link" onClick={() => changeMode('reset')}>
            Already have a reset code? Enter code →
          </button>
        )}
        {reset && (
          <button type="button" className="link" onClick={() => changeMode('forgot')}>
            Request a different email reset link
          </button>
        )}
        {!register && !forgot && !reset && (
          <button type="button" className="link forgot-link" onClick={() => changeMode('forgot')}>
            Forgot password?
          </button>
        )}
        <button type="button" className="link" onClick={() => changeMode(register ? 'login' : 'register')}>
          {register ? 'Already practising? Sign in' : forgot || reset ? 'Back to sign in' : 'New here? Create your account'}
        </button>
      </div>
    </form>
  </section>
}
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }
function PasswordField({ label, value, onChange }) { const [visible, setVisible] = useState(false); return <Field label={label}><div className="password-wrap"><input type={visible ? 'text' : 'password'} required minLength="8" value={value} onChange={e => onChange(e.target.value)} placeholder="At least 8 characters" /><button type="button" className="password-toggle" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? 'Hide' : 'Show'}</button></div></Field> }

function Dashboard({ user, data, onPractice, onResume }) {
  const score = data?.averageScore ?? 0, completed = data?.completedInterviews ?? 0, readiness = score || 12
  const scoresByType = data?.scoresByType || {}, recentTypes = new Set((data?.recent || []).map(item => item.type))
  const weakest = Object.entries(scoresByType).filter(([, value]) => value > 0).sort((a, b) => a[1] - b[1])[0]?.[0]
  const coachTitle = weakest ? `${weakest === 'DSA' ? 'Problem-solving' : weakest.toLowerCase()} needs the next rep.` : 'The first answer tells us where to start.'
  const firstName = (user?.name || 'Candidate').split(' ')[0]
  return <><section className="dashboard-hero"><div><p className="eyebrow">PRACTICE STATUS / TODAY</p><h1>Good evening,<br /><em>{firstName}.</em></h1><p className="lede">You do not need more confidence. You need one sharper answer than yesterday.</p></div><div className="readiness-dial"><span>READINESS</span><strong>{readiness}</strong><small>/100</small><PressureLine value={readiness} /></div></section><section className="scoreboard"><div className="score-cell dominant"><span>INTERVIEW SCORE</span><b>{score}<small>/100</small></b><p>{score ? 'Your current average. Keep the pressure on.' : 'Your baseline begins with one answer.'}</p><PressureLine value={readiness} /></div><div className="score-cell"><span>SESSIONS CLOSED</span><b>{completed}</b><p>{completed ? 'Evidence beats anxiety.' : 'No sessions yet.'}</p></div><div className="score-cell quiet"><span>ACTIVE TRACKS</span><b>04</b><p>HR / Technical / Java / DSA</p></div><button className="start-panel" onClick={onPractice}><span>READY WHEN YOU ARE</span><b>Start a<br />practice set</b><i>→</i></button></section><section className="dashboard-layout"><div className="track-section"><div className="section-heading"><div><span>FOUR WAYS TO GET SHARPER</span><h2>Choose the pressure.</h2></div><button className="link" onClick={onPractice}>All tracks →</button></div><div className="tracks">{tracks.map(([key, title, text, mark, state]) => { const trackScore = scoresByType[key] || 0; const signal = trackScore ? `${trackScore}% average` : recentTypes.has(key) ? 'In progress' : state; return <button className={`track track-${key.toLowerCase()}`} key={key} onClick={onPractice}><TrackMark kind={mark} /><div><span className="track-state">{signal}</span><b>{title}</b><small>{text}</small></div><i>→</i></button> })}</div></div><aside className="insight"><div className="live-dot">LIVE READ</div><span className="eyebrow">YOUR COACH'S NOTE</span><h2>{coachTitle}</h2><p>{weakest ? `Your ${weakest.toLowerCase()} score is the clearest opportunity. Run one focused set and make structure automatic: context, decision, impact.` : 'Choose a track. We will turn the unknown into questions you can answer out loud.'}</p><div className="insight-footer"><PressureLine value={score || 18} /><button className="secondary" onClick={onResume}>Add resume</button></div></aside></section></>
}

function Setup({ onStart }) { const [role, setRole] = useState('Software Developer'), [count, setCount] = useState(3); return <section className="setup"><p className="eyebrow">NEW PRACTICE SET</p><h1>Choose the pressure<br />you want to rehearse.</h1><div className="setup-options"><Field label="Target role"><input value={role} onChange={e => setRole(e.target.value)} /></Field><Field label="Round length"><select value={count} onChange={e => setCount(Number(e.target.value))}><option value="3">3 questions / Quick</option><option value="5">5 questions / Standard</option></select></Field></div><div className="choose-grid">{tracks.map(([key, title, text, mark]) => <button key={key} onClick={() => onStart(key, role, count)}><TrackMark kind={mark} /><span>{key}</span><h2>{title}</h2><p>{text}</p><b>Begin set →</b></button>)}</div></section> }

function InterviewRoom({ interview, onComplete, notify }) {
  const [session, setSession] = useState(interview), [index, setIndex] = useState(0), [answer, setAnswer] = useState(''), [loading, setLoading] = useState(false), [recording, setRecording] = useState(false)
  const question = session.questions[index], progress = Math.round(((index + 1) / session.questions.length) * 100)
  const save = async (thenNext) => { if (!answer.trim()) return notify('Write or dictate an answer first.'); setLoading(true); try { const updated = await request(`/interviews/${session.id}/questions/${question.id}/answer`, { method: 'POST', body: JSON.stringify({ answer }) }); const questions = [...session.questions]; questions[index] = { ...questions[index], ...updated }; setSession({ ...session, questions }); if (thenNext) { setIndex(index + 1); setAnswer(questions[index + 1].answer || '') } else notify('Answer saved. Review it, then complete the interview.') } catch (e) { notify(e.message) } finally { setLoading(false) } }
  const finish = async () => { try { if (question.score == null) await save(false); const done = await request(`/interviews/${session.id}/complete`, { method: 'POST' }); setSession(done); onComplete(done) } catch (e) { notify(e.message) } }
  const dictate = () => { const Speech = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Speech) return notify('Speech recognition is not supported in this browser.'); const recognition = new Speech(); recognition.lang = 'en-US'; recognition.onstart = () => setRecording(true); recognition.onend = () => setRecording(false); recognition.onerror = () => setRecording(false); recognition.onresult = e => setAnswer(v => `${v} ${e.results[0][0].transcript}`.trim()); recognition.start() }
  return <section className="interview-room"><aside className="session-rail"><span className="eyebrow">{session.type} / LIVE SET</span><h2>{session.targetRole}</h2><div className="session-clock"><b>00:{String((index + 1) * 2).padStart(2, '0')}</b><small>answer window</small></div><PressureLine value={progress} /><p>Question {index + 1} of {session.questions.length}</p><div className="question-nav">{session.questions.map((q, n) => <button className={n === index ? 'active-dot' : ''} key={q.id} onClick={() => { setIndex(n); setAnswer(q.answer || '') }}>{String(n + 1).padStart(2, '0')} {q.score != null && '✓'}</button>)}</div></aside><div className="question-area"><p className="question-label">PROMPT {String(index + 1).padStart(2, '0')}</p><h1>{question.question}</h1><p className="question-help">Pause. Build the answer in your head, then make the first sentence clear and direct.</p><div className={`voice-strip ${recording ? 'recording' : ''}`}><span className="voice-orb" /><div><b>{recording ? 'Listening. Take your time.' : 'Voice practice is ready.'}</b><small>{recording ? 'Your words will appear below.' : 'Dictate an answer or write one below.'}</small></div><button className="secondary" onClick={dictate}>{recording ? 'Recording' : 'Use microphone'}</button></div><textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Your answer lives here..." /><div className="answer-actions"><span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>{index === session.questions.length - 1 ? <button className="primary" onClick={finish}>Finish and score <span>→</span></button> : <button className="primary" disabled={loading} onClick={() => save(true)}>{loading ? 'Saving...' : 'Lock answer'} <span>→</span></button>}</div>{question.feedback && <div className="feedback"><span>COACH NOTE / {question.score}/100</span><p>{question.feedback}</p></div>}</div></section>
}

function Results({ interview, onPractice }) { const score = interview.score ?? 0; return <section className="results"><p className="eyebrow">REPORT COMPLETE</p><h1>You held the room.<br />Now sharpen the edges.</h1><div className="result-score"><span>SESSION SCORE</span><b>{score}<small>/100</small></b><PressureLine value={score} /></div><div className="results-grid"><div className="weakness-report"><span>WHAT TO WORK ON NEXT</span><h2>{interview.weaknessAnalysis || 'Make your answers tighter, more specific, and more measurable.'}</h2><p>This is not a verdict. It is the shortest route to a stronger next round.</p></div><div className="answer-report"><span>ANSWER BY ANSWER</span>{interview.questions.map((q, i) => <div className="result-row" key={q.id}><b>{String(i + 1).padStart(2, '0')}</b><div><strong>{q.score ?? 0}/100</strong><p>{q.feedback || 'Not answered'}</p></div></div>)}</div></div><button className="primary" onClick={onPractice}>Run another set <span>→</span></button></section> }

function Resume({ notify }) { const [file, setFile] = useState(null), [busy, setBusy] = useState(false); const upload = async e => { e.preventDefault(); if (!file) return notify('Choose a PDF or DOCX resume.'); setBusy(true); const body = new FormData(); body.append('file', file); try { const data = await request('/resume', { method: 'POST', body }); notify(data.message) } catch (x) { notify(x.message) } finally { setBusy(false) } }; return <section className="resume"><p className="eyebrow">CONTEXT FOR YOUR COACH</p><h1>Make the questions<br />more like your real ones.</h1><p>Upload your resume. We use your experience to make the practice relevant, not generic.</p><form onSubmit={upload} className="upload-zone"><input id="resume" type="file" accept=".pdf,.docx" onChange={e => setFile(e.target.files[0])} /><label htmlFor="resume"><span>+</span><b>{file ? file.name : 'Drop your resume here'}</b><small>PDF or DOCX / max 10 MB</small></label><button className="primary" disabled={busy}>{busy ? 'Uploading...' : 'Add resume'} <span>→</span></button></form></section> }
