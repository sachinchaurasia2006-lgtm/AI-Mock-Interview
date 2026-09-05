import { useEffect, useState, useRef } from 'react'
import { request, token } from './api'

const tracks = [
  {
    key: 'HR',
    title: 'HR & Behavioral',
    desc: 'STAR method, leadership & EQ under pressure',
    icon: 'voice',
    tag: 'Essential',
    badgeColor: '#ec4899',
  },
  {
    key: 'TECHNICAL',
    title: 'System & Architecture',
    desc: 'Scalability, microservices & design trade-offs',
    icon: 'grid',
    tag: 'Core Eng',
    badgeColor: '#06b6d4',
  },
  {
    key: 'JAVA',
    title: 'Java & Spring Deep Dive',
    desc: 'JVM internals, concurrency, memory & Spring Boot',
    icon: 'braces',
    tag: 'Deep Work',
    badgeColor: '#8b5cf6',
  },
  {
    key: 'DSA',
    title: 'Data Structures & Algorithmic',
    desc: 'Optimization, time/space complexity & patterns',
    icon: 'nodes',
    tag: 'High Impact',
    badgeColor: '#10b981',
  },
]

const QUICK_ROLES = [
  'Senior Backend Engineer',
  'Fullstack React & Node Developer',
  'Distributed Systems Architect',
  'Java Spring Boot Specialist',
  'Cloud & DevOps Engineer',
  'AI / ML Systems Engineer',
]

const POPULAR_SKILLS = [
  'Spring Boot',
  'Kafka',
  'Microservices',
  'React',
  'System Design',
  'Kubernetes',
  'PostgreSQL',
  'Redis',
  'AWS',
  'Concurrency',
  'Docker',
  'TypeScript',
]

// Subtle Web Audio Synthesizer for UI feedback
class SoundFX {
  constructor() {
    this.ctx = null
    this.enabled = true
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      this.ctx = new AudioCtx()
    }
  }

  playTone(freq, type = 'sine', duration = 0.12, gainVal = 0.08) {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      if (this.ctx.state === 'suspended') this.ctx.resume()

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + duration)
    } catch {
      // Audio autoplay policy fallback
    }
  }

  click() { this.playTone(600, 'sine', 0.06, 0.04) }
  success() {
    this.playTone(523.25, 'triangle', 0.1, 0.07)
    setTimeout(() => this.playTone(659.25, 'triangle', 0.15, 0.08), 90)
    setTimeout(() => this.playTone(783.99, 'triangle', 0.25, 0.09), 180)
  }
  warning() { this.playTone(280, 'sawtooth', 0.15, 0.05) }
}

const sfx = new SoundFX()

// Canvas Confetti Celebration for high score
const ConfettiCanvas = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = []
    const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ffffff']

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 2 - 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 8 - 4,
      })
    }

    let animationFrameId
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.y += p.speedY
        p.x += p.speedX
        p.rotation += p.rotationSpeed

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      })

      if (particles.some((p) => p.y < canvas.height)) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    render()
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}

const Logo = ({ size = 'normal', onClick }) => (
  <button className={`brand-logo ${size}`} onClick={onClick} type="button">
    <div className="logo-icon-wrapper">
      <svg className="logo-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mockLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#mockLogoGrad)" />
        <path d="M7.5 22V10L12.5 16.5L16 12L19.5 16.5L24.5 10V22" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="6.5" r="2" fill="url(#sparkGrad)" />
      </svg>
      <span className="logo-glow" />
    </div>
    <div className="logo-text">
      <span className="logo-title">MOCKMATE</span>
      <span className="logo-badge">AI</span>
    </div>
  </button>
)

const TrackIcon = ({ kind }) => {
  if (kind === 'voice') {
    return (
      <svg className="track-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    )
  }
  if (kind === 'grid') {
    return (
      <svg className="track-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    )
  }
  if (kind === 'braces') {
    return (
      <svg className="track-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    )
  }
  return (
    <svg className="track-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

const CircularProgress = ({ value = 0, size = 110, strokeWidth = 8, label = "Readiness" }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)))
  const offset = circumference - (clampedValue / 100) * circumference

  return (
    <div className="circular-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle
          className="gauge-bg"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="gauge-bar"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="gauge-content">
        <span className="gauge-val">{clampedValue}</span>
        <span className="gauge-label">{label}</span>
      </div>
    </div>
  )
}

const AudioWaveVisualizer = ({ active = false }) => (
  <div className={`audio-waveform ${active ? 'active' : ''}`}>
    {[...Array(16)].map((_, i) => (
      <span
        key={i}
        className="wave-bar"
        style={{
          animationDelay: `${(i % 5) * 0.12}s`,
          height: active ? undefined : `${20 + (i % 4) * 15}%`,
        }}
      />
    ))}
  </div>
)

// Dynamic STAR Method Live Heuristic Detector
const StarDetector = ({ text = '' }) => {
  const lower = text.toLowerCase()
  const hasSituation = /(when|while working|at my previous|in a project|background|scenario|we had a problem|situation|faced with)/i.test(lower)
  const hasTask = /(my goal|responsible for|needed to|objective|task was|aimed to|requirement was|challenge was)/i.test(lower)
  const hasAction = /(i implemented|we built|designed|created|refactored|developed|optimized|executed|wrote|utilized|applied)/i.test(lower)
  const hasResult = /(resulted in|improved by|reduced|increased|throughput|latency|metrics|successfully|boosted|achieved|saved|percent|%)/i.test(lower)

  return (
    <div className="star-detector-bar">
      <span className="star-label">LIVE STAR STRUCTURE CHECKER:</span>
      <div className="star-badges-group">
        <span className={`star-badge ${hasSituation ? 'detected' : ''}`}>
          {hasSituation ? '✓' : '○'} S: Situation
        </span>
        <span className={`star-badge ${hasTask ? 'detected' : ''}`}>
          {hasTask ? '✓' : '○'} T: Task
        </span>
        <span className={`star-badge ${hasAction ? 'detected' : ''}`}>
          {hasAction ? '✓' : '○'} A: Action
        </span>
        <span className={`star-badge ${hasResult ? 'detected' : ''}`}>
          {hasResult ? '✓' : '○'} R: Result
        </span>
      </div>
    </div>
  )
}

const RubricBarGrid = ({ score = 50, answer = '' }) => {
  const wordCount = (answer || '').trim().split(/\s+/).filter(Boolean).length
  const techScore = Math.min(100, Math.max(20, Math.round(score * 0.95 + (wordCount > 30 ? 5 : 0))))
  const commScore = Math.min(100, Math.max(30, Math.round(score * 0.9 + (wordCount >= 20 && wordCount <= 120 ? 10 : 0))))
  const structScore = Math.min(100, Math.max(25, Math.round(score * 0.85 + (answer.toLowerCase().includes('result') || answer.toLowerCase().includes('because') ? 12 : 5))))
  const tradeoffScore = Math.min(100, Math.max(20, Math.round(score * 0.8 + (answer.toLowerCase().includes('trade') || answer.toLowerCase().includes('however') || answer.toLowerCase().includes('cost') ? 15 : 0))))

  const metrics = [
    { label: 'Technical Depth', val: techScore, color: '#8b5cf6' },
    { label: 'Clarity & Delivery', val: commScore, color: '#06b6d4' },
    { label: 'STAR Structure', val: structScore, color: '#ec4899' },
    { label: 'Trade-off Mastery', val: tradeoffScore, color: '#10b981' },
  ]

  return (
    <div className="rubric-bars-container">
      <div className="rubric-header-title">4-DIMENSIONAL RUBRIC BREAKDOWN</div>
      <div className="rubric-bars-grid">
        {metrics.map((m) => (
          <div className="rubric-bar-item" key={m.label}>
            <div className="rubric-bar-meta">
              <span>{m.label}</span>
              <strong>{m.val}%</strong>
            </div>
            <div className="rubric-track">
              <span className="rubric-fill" style={{ width: `${m.val}%`, backgroundColor: m.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const CameraPreview = () => {
  const videoRef = useRef(null)
  const [streamActive, setStreamActive] = useState(false)
  const [permissionError, setPermissionError] = useState('')

  const startCamera = async () => {
    setPermissionError('')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Camera not supported in this browser.')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setStreamActive(true)
      sfx.click()
    } catch {
      setPermissionError('Camera permission denied or camera unavailable.')
      setStreamActive(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const videoTracks = videoRef.current.srcObject.getTracks()
      videoTracks.forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    setStreamActive(false)
    sfx.click()
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="hud-camera-card">
      <div className="camera-header">
        <div className="proctor-pill">
          <span className={`status-dot ${streamActive ? 'live-green' : 'idle'}`} />
          <span>{streamActive ? 'PROCTOR SIMULATION ON' : 'PROCTOR STANDBY'}</span>
        </div>
        <button
          type="button"
          className="camera-toggle-btn"
          onClick={streamActive ? stopCamera : startCamera}
        >
          {streamActive ? 'Stop Cam' : 'Start Cam'}
        </button>
      </div>

      <div className="camera-feed-box">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`camera-video ${streamActive ? 'visible' : 'hidden'}`}
        />
        {!streamActive && (
          <div className="camera-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span>Candidate Cam Preview</span>
            <small>{permissionError || 'Enable camera for interview realism'}</small>
          </div>
        )}
        {streamActive && (
          <div className="face-boundary-guide">
            <span className="guide-corner tl" />
            <span className="guide-corner tr" />
            <span className="guide-corner bl" />
            <span className="guide-corner br" />
            <div className="guide-tag">EYE CONTACT OPTIMAL</div>
          </div>
        )}
      </div>
    </div>
  )
}

// Global Keyboard Shortcuts Modal
const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(10px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel-glow"
        style={{
          width: 'min(500px, 100%)',
          padding: 32,
          borderRadius: 24,
          background: 'rgba(16, 22, 44, 0.95)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>
            ⌨️ Keyboard Shortcuts
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
            <span>Save & Advance to Next Question</span>
            <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>Ctrl + Enter</kbd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
            <span>Toggle Voice Speech-to-Text</span>
            <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>Alt + M</kbd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
            <span>Listen / Replay Question Voice</span>
            <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>Alt + P</kbd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Open / Close This Help Modal</span>
            <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>?</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('mockmate_user') || 'null'))
  const [page, setPage] = useState(token() ? 'dashboard' : 'auth')
  const [dashboard, setDashboard] = useState(null)
  const [interview, setInterview] = useState(null)
  const [message, setMessage] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const loadDashboard = async () => {
    try {
      setDashboard(await request('/dashboard'))
    } catch {
      logout()
    }
  }

  useEffect(() => {
    if (token()) loadDashboard()
  }, [])

  // Global key listener for '?'
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault()
        setShortcutsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [])

  const logout = () => {
    localStorage.removeItem('mockmate_token')
    localStorage.removeItem('mockmate_user')
    setUser(null)
    setDashboard(null)
    setPage('auth')
    sfx.click()
  }

  const notify = (value) => {
    setMessage(value)
    setTimeout(() => setMessage(''), 3800)
  }

  const toggleSound = () => {
    sfx.enabled = !soundEnabled
    setSoundEnabled(!soundEnabled)
    if (!soundEnabled) sfx.click()
  }

  const authSuccess = (data) => {
    localStorage.setItem('mockmate_token', data.token)
    localStorage.setItem('mockmate_user', JSON.stringify({ name: data.name, email: data.email }))
    setUser({ name: data.name, email: data.email })
    setPage('dashboard')
    loadDashboard()
    sfx.success()
  }

  const begin = async (type, targetRole = 'Software Developer', questionCount = 3) => {
    try {
      sfx.click()
      const created = await request('/interviews', {
        method: 'POST',
        body: JSON.stringify({ type, targetRole, questionCount }),
      })
      setInterview(created)
      setPage('interview')
    } catch (e) {
      notify(e.message)
    }
  }

  const reviewSession = async (sessionSummary) => {
    try {
      sfx.click()
      const full = await request(`/interviews/${sessionSummary.id}`)
      setInterview(full)
      setPage('results')
    } catch {
      notify('Failed to load session details.')
    }
  }

  return (
    <div className="app-shell">
      <div className="bg-grid-overlay" />
      <div className="ambient-glow orb-1" />
      <div className="ambient-glow orb-2" />
      <div className="ambient-glow orb-3" />

      {message && (
        <div className="toast-banner" role="status">
          <span className="toast-dot" />
          {message}
        </div>
      )}

      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {user && (
        <header className="app-header">
          <Logo onClick={() => { sfx.click(); setPage('dashboard') }} />
          <nav className="header-nav">
            <button
              className={`nav-link ${page === 'dashboard' ? 'active' : ''}`}
              onClick={() => { sfx.click(); setPage('dashboard') }}
            >
              Overview
            </button>
            <button
              className={`nav-link ${page === 'setup' ? 'active' : ''}`}
              onClick={() => { sfx.click(); setPage('setup') }}
            >
              Practice
            </button>
            <button
              className={`nav-link ${page === 'history' ? 'active' : ''}`}
              onClick={() => { sfx.click(); setPage('history') }}
            >
              History
            </button>
            <button
              className={`nav-link ${page === 'resume' ? 'active' : ''}`}
              onClick={() => { sfx.click(); setPage('resume') }}
            >
              Resume AI
            </button>
          </nav>

          <div className="header-tools">
            <button
              type="button"
              className="icon-action-btn"
              onClick={toggleSound}
              title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            >
              {soundEnabled ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>

            <button
              type="button"
              className="icon-action-btn"
              onClick={() => setShortcutsOpen(true)}
              title="Keyboard shortcuts (?)"
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>?</span>
            </button>

            <button className="user-avatar" onClick={logout} title="Click to log out">
              <span>{user.name?.[0]?.toUpperCase() || 'U'}</span>
            </button>
          </div>
        </header>
      )}

      <main className="main-content">
        {page === 'auth' && <Auth onSuccess={authSuccess} />}
        {page === 'dashboard' && (
          <Dashboard
            user={user}
            data={dashboard}
            onPractice={() => { sfx.click(); setPage('setup') }}
            onResume={() => { sfx.click(); setPage('resume') }}
            onHistory={() => { sfx.click(); setPage('history') }}
            onQuickDrill={() => begin('HR', 'Software Engineer', 1)}
          />
        )}
        {page === 'setup' && <Setup onStart={begin} />}
        {page === 'history' && <History onReview={reviewSession} onPractice={() => { sfx.click(); setPage('setup') }} />}
        {page === 'interview' && interview && (
          <InterviewRoom
            interview={interview}
            onComplete={(done) => {
              if (done) setInterview(done)
              setPage('results')
              loadDashboard()
            }}
            notify={notify}
          />
        )}
        {page === 'results' && interview && (
          <Results
            interview={interview}
            onPractice={() => { sfx.click(); setPage('setup') }}
            notify={notify}
          />
        )}
        {page === 'resume' && <Resume notify={notify} onStartCustom={begin} />}
      </main>
    </div>
  )
}

const PressureLine = ({ value = 38, className = '' }) => (
  <div className={`pressure-line ${className}`} aria-label={`Readiness ${value}%`}>
    <span style={{ width: `${value}%` }} />
    {[...Array(18)].map((_, i) => <i key={i} />)}
  </div>
)

function Auth({ onSuccess }) {
  const urlParams = new URLSearchParams(window.location.search)
  const initialToken = urlParams.get('resetToken') || ''
  const initialMode = initialToken ? 'reset' : 'login'

  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '', token: initialToken })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const oauthError = params.get('error')

    if (oauthError) {
      setError(`Authentication cancelled or failed: ${oauthError}`)
      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }

    if (code && state === 'github') {
      const processOAuth = async () => {
        setOauthLoading(true)
        setError('')
        const redirectUri = window.location.origin + window.location.pathname
        try {
          const res = await request(`/auth/oauth/github`, {
            method: 'POST',
            body: JSON.stringify({ code, redirectUri }),
          })
          window.history.replaceState({}, document.title, window.location.pathname)
          onSuccess(res)
        } catch (err) {
          window.history.replaceState({}, document.title, window.location.pathname)
          setError(err.message || 'Failed to sign in with GitHub.')
        } finally {
          setOauthLoading(false)
        }
      }
      processOAuth()
    }
  }, [])

  const register = mode === 'register',
    forgot = mode === 'forgot',
    reset = mode === 'reset'
  const set = (values) => setForm((prev) => ({ ...prev, ...values }))
  const changeMode = (next) => {
    sfx.click()
    setMode(next)
    setError('')
    setNotice('')
  }

  const triggerGithubLogin = async () => {
    setOauthLoading(true)
    setError('')
    try {
      const cfg = await request('/auth/oauth/config')
      if (!cfg || !cfg.githubClientId) {
        throw new Error('GitHub OAuth is not configured on the server yet.')
      }
      const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname)
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${cfg.githubClientId}&redirect_uri=${redirectUri}&scope=user:email&state=github`
      window.location.href = githubAuthUrl
    } catch (err) {
      setError(err.message || 'Failed to initiate GitHub login.')
      setOauthLoading(false)
    }
  }

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
        body: JSON.stringify({ email: form.email.trim() }),
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

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (forgot) {
        const data = await request('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: form.email.trim() }),
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
          body: JSON.stringify({ token: form.token.trim(), password: form.password }),
        })
        setNotice(data.message || 'Password changed successfully! You can now sign in.')
        setMode('login')
      } else {
        const payload = register
          ? { name: form.name.trim(), email: form.email.trim(), password: form.password }
          : { email: form.email.trim(), password: form.password }
        const res = await request(`/auth/${register ? 'register' : 'login'}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        onSuccess(res)
      }
    } catch (x) {
      setError(x.message)
      sfx.warning()
    } finally {
      setBusy(false)
    }
  }

  const title = register
    ? 'Build your edge.'
    : forgot
    ? 'Reset your password.'
    : reset
    ? 'Choose a new password.'
    : 'Step into the arena.'
  const copy = register
    ? 'One calibrated simulation is enough to completely transform your interview poise.'
    : forgot
    ? 'Enter your email address and we will dispatch a secure reset token.'
    : reset
    ? 'Provide the verification token received and configure your new password.'
    : 'Master technical, algorithmic & leadership rounds with real-time AI speech evaluation.'

  return (
    <section className="auth">
      <div className="auth-editorial">
        <div className="brand">
          <span className="brand-sigil">M</span> MOCKMATE AI
        </div>
        <div className="editorial-copy">
          <span className="eyebrow">NEXT-GEN INTERVIEW SIMULATOR</span>
          <h1>
            Walk in ready.
            <br />
            <span className="text-gradient">Speak like you belong.</span>
          </h1>
          <p>
            MockMate bridges the gap between preparation and authentic interview mastery with speech feedback, STAR rubric scoring, and resume calibration.
          </p>
          <div className="auth-highlights">
            <span className="auth-highlight-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 14 14" /></svg>
              Live Speech-to-Text
            </span>
            <span className="auth-highlight-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              STAR Rubric Scoring
            </span>
            <span className="auth-highlight-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              Resume Context
            </span>
          </div>
        </div>
        <div className="editorial-meter">
          <span>SYSTEM READINESS SIGNAL</span>
          <PressureLine value={78} />
          <b>
            78 <small>calibrated</small>
          </b>
        </div>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <div className="form-kicker">
          {register
            ? 'NEW CANDIDATE REGISTRATION'
            : forgot
            ? 'ACCOUNT RECOVERY'
            : reset
            ? 'SET CREDENTIALS'
            : 'MEMBER SIGN IN'}
        </div>
        <h2>{title}</h2>
        <p>{copy}</p>

        {/* GitHub Social Login */}
        {!forgot && !reset && (
          <div className="oauth-button-container">
            <button
              type="button"
              className="github-oauth-btn-classic"
              onClick={triggerGithubLogin}
              disabled={oauthLoading || busy}
            >
              <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>{oauthLoading ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
            </button>
            <div className="auth-or-divider">
              <span />
              <span>OR EMAIL</span>
              <span />
            </div>
          </div>
        )}

        {register && (
          <Field label="Full Name">
            <input
              required
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Alex Morgan"
            />
          </Field>
        )}

        <Field label="Email Address">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="alex@company.com"
          />
        </Field>

        {(forgot || reset) && (
          <div className="resend-container">
            <span>Didn't receive the token?</span>
            <button
              type="button"
              className="resend-btn"
              onClick={handleResend}
              disabled={resending || busy || cooldown > 0}
            >
              {resending ? 'Sending...' : cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend code'}
            </button>
          </div>
        )}

        {reset && (
          <Field label="Reset Token">
            <input
              required
              value={form.token}
              onChange={(e) => set({ token: e.target.value })}
              placeholder="Paste token from email or dev mode"
            />
          </Field>
        )}

        {!forgot && (
          <PasswordField
            value={form.password}
            onChange={(value) => set({ password: value })}
            label={reset ? 'New Password' : 'Password'}
          />
        )}

        {error && <small className="error">{error}</small>}
        {notice && <small className="notice">{notice}</small>}

        <button className="primary wide" disabled={busy || resending || oauthLoading}>
          {busy
            ? 'Authenticating...'
            : forgot
            ? 'Send Recovery Token'
            : reset
            ? 'Save New Password'
            : register
            ? 'Create Free Account'
            : 'Enter Simulation Suite'}
          <span style={{ fontSize: 18 }}>→</span>
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
              Forgot your password?
            </button>
          )}
          <button type="button" className="link" onClick={() => changeMode(register ? 'login' : 'register')}>
            {register
              ? 'Already registered? Sign in here'
              : forgot || reset
              ? 'Back to sign in'
              : "Don't have an account? Create one now"}
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function PasswordField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false)
  return (
    <Field label={label}>
      <div className="password-wrap">
        <input
          type={visible ? 'text' : 'password'}
          required
          minLength="8"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="At least 8 characters"
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </Field>
  )
}

function Dashboard({ user, data, onPractice, onResume, onHistory, onQuickDrill }) {
  const score = data?.averageScore ?? 0,
    completed = data?.completedInterviews ?? 0,
    readiness = score || 24
  const scoresByType = data?.scoresByType || {},
    recentTypes = new Set((data?.recent || []).map((item) => item.type))
  const weakest = Object.entries(scoresByType)
    .filter(([, value]) => value > 0)
    .sort((a, b) => a[1] - b[1])[0]?.[0]
  const coachTitle = weakest
    ? `${weakest === 'DSA' ? 'Problem-Solving' : weakest} is your primary lever for high-scoring rounds.`
    : 'Your readiness trajectory begins with one calibrated set.'
  const firstName = (user?.name || 'Candidate').split(' ')[0]

  return (
    <div className="dashboard-view">
      <section className="dash-hero-card">
        <div className="dash-hero-text">
          <div className="hero-status-pill">
            <span className="status-dot-live" />
            <span>SESSION READY • AI INTERVIEWER ACTIVE</span>
          </div>
          <h1>
            Welcome back, <span className="text-gradient">{firstName}.</span>
          </h1>
          <p className="hero-quote">
            Confidence isn't luck—it's structured repetition. Let's calibrate your next technical response under real pressure.
          </p>
        </div>
        <div className="dash-hero-gauge">
          <CircularProgress value={readiness} size={135} strokeWidth={10} label="READINESS" />
        </div>
      </section>

      {/* Quick Daily AI Drill Bar */}
      <div className="daily-drill-bar">
        <div className="drill-info">
          <div className="drill-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="drill-text">
            <h4>Quick 1-Minute Warm-Up Drill</h4>
            <p>Sharpen your instincts with a rapid single-question evaluation.</p>
          </div>
        </div>
        <button className="primary-glow-btn" onClick={onQuickDrill}>
          <span>Launch Rapid Drill</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      <section className="metrics-grid">
        <div className="metric-card highlight-card">
          <div className="metric-top">
            <span className="metric-label">OVERALL AVERAGE</span>
            <span className="metric-pill">AI Rubric</span>
          </div>
          <div className="metric-val-wrap">
            <span className="metric-val">{score}</span>
            <span className="metric-max">/100</span>
          </div>
          <p className="metric-desc">
            {score ? 'Aggregated across all tracks and mock evaluations.' : 'Start your first round to generate baseline analytics.'}
          </p>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">SESSIONS COMPLETED</span>
            <button className="text-link" onClick={onHistory}>View history →</button>
          </div>
          <div className="metric-val-wrap">
            <span className="metric-val">{completed}</span>
            <span className="metric-max">sets</span>
          </div>
          <p className="metric-desc">{completed ? 'Repetition builds unshakeable poise under pressure.' : 'No rounds logged yet today.'}</p>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">ACTIVE TRACKS</span>
            <span className="metric-pill green-pill">4 Core Tracks</span>
          </div>
          <div className="metric-val-wrap">
            <span className="metric-val">04</span>
            <span className="metric-max">modules</span>
          </div>
          <p className="metric-desc">HR Behavioral, System Architecture, Java & DSA</p>
        </div>

        <button className="cta-launcher-card" onClick={onPractice}>
          <div className="launcher-content">
            <span className="launcher-tag">START REHEARSAL</span>
            <h3>Launch New Set</h3>
            <span className="launcher-sub">Select track & customize round depth</span>
          </div>
          <div className="launcher-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </button>
      </section>

      <section className="dashboard-content-layout">
        <div className="tracks-column">
          <div className="column-header">
            <div>
              <span className="subhead-pill">FOUR CORE SPECIALIZATIONS</span>
              <h2>Select Your Focus Track</h2>
            </div>
            <button className="text-link" onClick={onPractice}>
              Custom setup →
            </button>
          </div>

          <div className="tracks-interactive-grid">
            {tracks.map((t) => {
              const trackScore = scoresByType[t.key] || 0
              const isRecent = recentTypes.has(t.key)
              return (
                <button
                  className={`track-card track-${t.key.toLowerCase()}`}
                  key={t.key}
                  onClick={onPractice}
                >
                  <div className="track-card-top">
                    <div className="track-icon-badge" style={{ color: t.badgeColor }}>
                      <TrackIcon kind={t.icon} />
                    </div>
                    <span className="track-tag" style={{ color: t.badgeColor, borderColor: `${t.badgeColor}40` }}>
                      {trackScore ? `${trackScore}% Avg` : isRecent ? 'In Progress' : t.tag}
                    </span>
                  </div>
                  <div className="track-card-body">
                    <h3>{t.title}</h3>
                    <p>{t.desc}</p>
                  </div>
                  <div className="track-card-footer">
                    <span>Rehearse track</span>
                    <svg className="track-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="coach-insight-card">
          <div className="coach-header">
            <div className="coach-badge">
              <span className="status-dot-live" />
              <span>AI COACH FEEDBACK</span>
            </div>
          </div>
          <h3>{coachTitle}</h3>
          <p>
            {weakest
              ? `Your ${weakest} responses show key growth opportunity. Focus on providing structured concrete metrics: context, architectural trade-offs, and measurable outcomes.`
              : 'Choose any track to begin. MockMate listens to your spoken or written answers, providing instant rubric ratings and actionable recommendations.'}
          </p>

          <div className="coach-card-action">
            <button className="secondary-glow-btn wide" onClick={onResume}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Add Resume for Ingestion</span>
            </button>
          </div>
        </aside>
      </section>
    </div>
  )
}

function History({ onReview, onPractice }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const list = await request('/interviews')
        setSessions(list || [])
      } catch {
        setSessions([])
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  return (
    <section className="history-container">
      <div className="history-header">
        <span className="subhead-pill">SESSION ARCHIVE</span>
        <h1>Interview Trajectory</h1>
        <p>Review every past simulation round, track score evolution, and master weak questions.</p>
      </div>

      {loading ? (
        <div className="history-empty-card">
          <div className="spinner" />
          <p>Loading your past simulation sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="history-empty-card">
          <h3>No Sessions Completed Yet</h3>
          <p>Launch your first mock interview set to start generating trajectory reports.</p>
          <button className="primary-glow-btn" onClick={onPractice}>
            <span>Start First Simulation</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="history-list">
          {sessions.map((s) => (
            <div className="history-row-card" key={s.id}>
              <div className="history-left">
                <span className="history-track-badge">{s.type}</span>
                <div>
                  <h3>{s.targetRole || 'Engineering Candidate'}</h3>
                  <small>{new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • {s.questions?.length || 0} Questions</small>
                </div>
              </div>

              <div className="history-right">
                <div className="history-score-chip">
                  <strong>{s.score ?? '--'}</strong>
                  <span>/ 100</span>
                </div>
                <button className="secondary-glow-btn" onClick={() => onReview(s)}>
                  <span>Review Rubric →</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Setup({ onStart }) {
  const [role, setRole] = useState('Senior Backend Engineer')
  const [selectedSkills, setSelectedSkills] = useState(['Spring Boot', 'Microservices', 'Kafka'])
  const [customSkill, setCustomSkill] = useState('')
  const [difficulty, setDifficulty] = useState('Senior')
  const [count, setCount] = useState(3)

  const toggleSkill = (skill) => {
    sfx.click()
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const addCustomSkill = (e) => {
    if (e.key === 'Enter' && customSkill.trim()) {
      e.preventDefault()
      const clean = customSkill.trim()
      if (!selectedSkills.includes(clean)) {
        setSelectedSkills([...selectedSkills, clean])
      }
      setCustomSkill('')
    }
  }

  const handleLaunch = (trackKey) => {
    const formattedRole = selectedSkills.length > 0 
      ? `${difficulty} ${role} (${selectedSkills.join(', ')})`
      : `${difficulty} ${role}`
    onStart(trackKey, formattedRole, count)
  }

  return (
    <section className="setup-container">
      <div className="setup-header">
        <span className="subhead-pill">CUSTOM SIMULATION SUITE</span>
        <h1>Configure Your Interview Room</h1>
        <p>Target specific tech stacks, tailor question complexity, and rehearse under realistic interview pressure.</p>
      </div>

      <div className="setup-controls-card">
        <Field label="Target Job Role">
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Backend Engineer, Fullstack Lead"
          />
        </Field>

        <div className="quick-roles-row">
          <span className="quick-roles-label">Quick Presets:</span>
          {QUICK_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              className={`preset-chip ${role === r ? 'active' : ''}`}
              onClick={() => { sfx.click(); setRole(r) }}
            >
              {r}
            </button>
          ))}
        </div>

        <div style={{ margin: '16px 0 20px' }}>
          <span className="input-label">Target Seniority / Difficulty Level:</span>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            {['Junior (L3)', 'Mid-Level (L4)', 'Senior (L5)', 'Staff / Architect (L6+)'].map((lvl) => {
              const base = lvl.split(' ')[0]
              const active = difficulty === base
              return (
                <button
                  key={lvl}
                  type="button"
                  className={`preset-chip ${active ? 'active' : ''}`}
                  onClick={() => { sfx.click(); setDifficulty(base) }}
                >
                  {lvl}
                </button>
              )
            })}
          </div>
        </div>

        <div className="skills-selector-section">
          <span className="input-label">Target Technologies & Focus Areas:</span>
          <div className="skills-chips-row">
            {POPULAR_SKILLS.map((sk) => {
              const active = selectedSkills.includes(sk)
              return (
                <button
                  key={sk}
                  type="button"
                  className={`skill-badge-btn ${active ? 'active' : ''}`}
                  onClick={() => toggleSkill(sk)}
                >
                  <span>{active ? '✓ ' : '+ '}{sk}</span>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <input
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={addCustomSkill}
              placeholder="Type custom skill (e.g. GraphQL, Golang) and press Enter..."
              style={{
                background: 'var(--bg-glass-input)',
                border: '1px solid var(--border-subtle)',
                padding: '8px 14px',
                borderRadius: 10,
                color: '#fff',
                fontSize: 13,
                width: 'min(380px, 100%)',
              }}
            />
          </div>
        </div>

        <Field label="Session Depth & Questions">
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
            <option value="1">1 Question • Instant Rapid Warmup (2-3 mins)</option>
            <option value="3">3 Questions • Quick Calibration Sprint (5-7 mins)</option>
            <option value="5">5 Questions • Comprehensive Technical Round (15-20 mins)</option>
          </select>
        </Field>
      </div>

      <div className="setup-grid">
        {tracks.map((t) => (
          <button key={t.key} className="setup-track-card" onClick={() => handleLaunch(t.key)}>
            <div className="setup-track-top">
              <div className="track-icon-badge" style={{ color: t.badgeColor }}>
                <TrackIcon kind={t.icon} />
              </div>
              <span className="setup-track-code">{t.key}</span>
            </div>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
            <div className="setup-card-footer">
              <span>Start Round</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function InterviewRoom({ interview, onComplete, notify }) {
  const [session, setSession] = useState(interview)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)
  const [timeLeft, setTimeLeft] = useState(120)
  const [timerRunning, setTimerRunning] = useState(true)

  const recognitionRef = useRef(null)
  const question = session.questions[index]
  const progress = Math.round(((index + 1) / session.questions.length) * 100)

  // Question Speech Synthesis (Text-to-Speech)
  const speakQuestion = (text, rate = speechRate) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    if (speaking) {
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = 1.0
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  // Auto-speak question on transition
  useEffect(() => {
    setTimeLeft(120)
    setTimerRunning(true)
    speakQuestion(question.question, speechRate)
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [index])

  // Countdown timer effect
  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return
    if (timeLeft === 30 || timeLeft === 10) sfx.warning()
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(interval)
  }, [timerRunning, timeLeft])

  const save = async (thenNext) => {
    if (!answer.trim()) return notify('Please write or dictate an answer first.')
    setLoading(true)
    try {
      const updated = await request(`/interviews/${session.id}/questions/${question.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer }),
      })
      sfx.success()
      const questions = [...session.questions]
      questions[index] = { ...questions[index], ...updated }
      setSession({ ...session, questions })
      if (thenNext) {
        setIndex(index + 1)
        setAnswer(questions[index + 1]?.answer || '')
      } else {
        notify('Answer evaluated & saved!')
      }
    } catch (e) {
      notify(e.message)
      sfx.warning()
    } finally {
      setLoading(false)
    }
  }

  const finish = async () => {
    try {
      if (question.score == null && answer.trim()) await save(false)
      const done = await request(`/interviews/${session.id}/complete`, { method: 'POST' })
      sfx.success()
      setSession(done)
      onComplete(done)
    } catch (e) {
      notify(e.message)
    }
  }

  const toggleDictation = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Speech) return notify('Speech recognition is not supported in this browser. Please type your response.')

    if (recording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setRecording(false)
      sfx.click()
      return
    }

    try {
      const recognition = new Speech()
      recognition.lang = 'en-US'
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        setRecording(true)
        sfx.click()
      }
      recognition.onend = () => setRecording(false)
      recognition.onerror = (err) => {
        setRecording(false)
        if (err.error !== 'no-speech') {
          notify(`Microphone error: ${err.error}`)
        }
      }
      recognition.onresult = (e) => {
        let finalTranscripts = ''
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscripts += e.results[i][0].transcript
          }
        }
        if (finalTranscripts) {
          setAnswer((prev) => `${prev} ${finalTranscripts}`.trim())
        }
      }
      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setRecording(false)
      notify('Failed to initialize speech microphone.')
    }
  }

  // Keyboard shortcut listener
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (index === session.questions.length - 1) {
        finish()
      } else {
        save(true)
      }
    }
  }

  // Global hotkeys in interview room
  useEffect(() => {
    const handleInterviewHotkeys = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        toggleDictation()
      }
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        speakQuestion(question.question, speechRate)
      }
    }
    window.addEventListener('keydown', handleInterviewHotkeys)
    return () => window.removeEventListener('keydown', handleInterviewHotkeys)
  }, [recording, question, speechRate])

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length

  return (
    <section className="interview-hud">
      <aside className="hud-sidebar">
        <div className="hud-session-info">
          <span className="session-type-pill">{session.type} TRACK</span>
          <h2>{session.targetRole}</h2>
        </div>

        {/* Live Proctoring Webcam Simulator */}
        <CameraPreview />

        {/* Live Pressure Countdown Timer */}
        <div className="hud-timer-card">
          <div className="timer-header">
            <span>ANSWER WINDOW</span>
            <button
              className="timer-toggle-btn"
              onClick={() => { sfx.click(); setTimerRunning(!timerRunning) }}
              title="Pause/Resume Timer"
            >
              {timerRunning ? 'PAUSE' : 'RESUME'}
            </button>
          </div>
          <div className={`timer-clock ${timeLeft < 30 ? 'critical' : timeLeft < 60 ? 'warning' : ''}`}>
            {formatTimer(timeLeft)}
          </div>
          <div className="timer-track-bar">
            <span
              className="timer-fill"
              style={{ width: `${(timeLeft / 120) * 100}%` }}
            />
          </div>
        </div>

        <div className="hud-progress-block">
          <div className="progress-labels">
            <span>Round Progress</span>
            <strong>{index + 1} of {session.questions.length}</strong>
          </div>
          <div className="progress-track-bar">
            <span className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="hud-question-list">
          <span className="hud-list-title">QUESTIONS IN SET</span>
          <div className="hud-q-chips">
            {session.questions.map((q, n) => (
              <button
                className={`q-chip ${n === index ? 'active' : ''} ${q.score != null ? 'answered' : ''}`}
                key={q.id}
                onClick={() => {
                  sfx.click()
                  setIndex(n)
                  setAnswer(q.answer || '')
                }}
              >
                <span>Q{n + 1}</span>
                {q.score != null && <span className="chip-tick">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="hud-main-panel">
        <div className="question-header-card">
          <div className="q-badge-row">
            <span className="q-badge">QUESTION {String(index + 1).padStart(2, '0')}</span>
            
            <div className="q-audio-controls">
              <div className="tts-speed-selector">
                {[0.8, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className={`speed-pill ${speechRate === rate ? 'active' : ''}`}
                    onClick={() => {
                      sfx.click()
                      setSpeechRate(rate)
                      speakQuestion(question.question, rate)
                    }}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`tts-speak-btn ${speaking ? 'is-speaking' : ''}`}
                onClick={() => speakQuestion(question.question, speechRate)}
                title="Shortcut: Alt+P"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                <span>{speaking ? 'Interviewer Speaking...' : 'Listen to Prompt'}</span>
              </button>
              <AudioWaveVisualizer active={recording || speaking} />
            </div>
          </div>

          <h1>{question.question}</h1>
          <p className="q-coach-hint">
            💡 <strong>AI Tip:</strong> Structure your answer clearly. State your primary technical judgment first, then walk through implementation details and trade-offs.
          </p>
        </div>

        <div className={`voice-dictate-banner ${recording ? 'is-recording' : ''}`}>
          <div className="dictate-left">
            <div className="voice-mic-orb">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            <div>
              <strong>{recording ? 'Listening closely... Speak your response clearly' : 'Live Speech-to-Text Available (Alt+M)'}</strong>
              <small>{recording ? 'Transcribing your speech directly into the editor...' : 'Click "Use Microphone" or type your answer below'}</small>
            </div>
          </div>
          <button
            type="button"
            className={`voice-action-btn ${recording ? 'recording' : ''}`}
            onClick={toggleDictation}
          >
            {recording ? 'Stop Dictating' : 'Use Microphone'}
          </button>
        </div>

        {/* Live STAR Structure Checker */}
        <StarDetector text={answer} />

        <div className="answer-editor-card">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Articulate your solution here. Open with your main thesis, support with evidence, and close with metrics... (Press Ctrl+Enter to submit)"
            rows={7}
          />
          <div className="editor-bottom-bar">
            <div className="editor-hints">
              <span className="word-count-badge">
                {wordCount} words {wordCount < 40 ? '(Brief)' : wordCount <= 220 ? '(Optimal Depth)' : '(Comprehensive)'}
              </span>
              <span className="shortcut-hint">Press <strong>Ctrl+Enter</strong> to save</span>
            </div>
            <div className="editor-buttons">
              {index === session.questions.length - 1 ? (
                <button className="primary-glow-btn" onClick={finish} disabled={loading}>
                  <span>{loading ? 'Evaluating...' : 'Finish & Complete Set'}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              ) : (
                <button className="primary-glow-btn" disabled={loading} onClick={() => save(true)}>
                  <span>{loading ? 'Evaluating...' : 'Save & Next Question'}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {question.feedback && (
          <div className="ai-feedback-panel">
            <div className="feedback-header">
              <div className="feedback-badge-wrap">
                <span className="feedback-pill">AI EVALUATION</span>
                <span className="calibrated-pill">Calibrated Rubric</span>
              </div>
              <strong className="feedback-score">{question.score} / 100</strong>
            </div>
            <p className="feedback-text">{question.feedback}</p>

            <RubricBarGrid score={question.score} answer={question.answer || ''} />

            {question.idealAnswer && (
              <div className="benchmark-box">
                <div className="benchmark-title">
                  <span className="star-icon">★</span>
                  <strong>10/10 Benchmark Ideal Answer</strong>
                </div>
                <p>{question.idealAnswer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function Results({ interview, onPractice, notify }) {
  const score = interview.score ?? 0
  const isTopScore = score >= 80

  const handlePrint = () => {
    sfx.click()
    window.print()
  }

  const copyFeedback = () => {
    const summary = `MockMate Simulation Report\nRole: ${interview.targetRole}\nTrack: ${interview.type}\nFinal Score: ${score}/100\nAnalysis: ${interview.weaknessAnalysis || ''}`
    navigator.clipboard?.writeText(summary)
    sfx.success()
    notify('Report summary copied to clipboard!')
  }

  return (
    <section className="results-container">
      {isTopScore && <ConfettiCanvas />}
      
      <div className="results-header no-print">
        <span className="subhead-pill">EVALUATION SUMMARY</span>
        <h1>Simulation Report</h1>
        <p>Comprehensive rubric performance report and recommendations for your next technical round.</p>
      </div>

      <div className="results-grand-card">
        <CircularProgress value={score} size={150} strokeWidth={11} label="FINAL SCORE" />
        <div className="results-grand-text">
          <div className="grade-badge">
            {score >= 85 ? '🌟 EXCEPTIONAL POISE & DEPTH' : score >= 70 ? '⚡ COMPETENT & CLEAR' : '🎯 FOUNDATIONAL WORK'}
          </div>
          <h2>{score >= 80 ? 'Ready for Real Interviews' : 'Targeted Practice Recommended'}</h2>
          <p>
            {interview.weaknessAnalysis ||
              'Focus on tightening architectural justifications and articulating measurable engineering outcomes.'}
          </p>
          <div className="session-summary-chips">
            <span className="stat-chip">Role: {interview.targetRole}</span>
            <span className="stat-chip">Track: {interview.type}</span>
            <span className="stat-chip">Questions: {interview.questions?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="breakdown-grid">
        <div className="breakdown-col">
          <h3>Question-by-Question Deep Dive</h3>
          <div className="q-feedback-list">
            {interview.questions.map((q, i) => (
              <div className="q-feedback-card" key={q.id}>
                <div className="q-card-top">
                  <span className="q-num">QUESTION {i + 1}</span>
                  <span className="q-score-tag">{q.score ?? 0}/100</span>
                </div>
                <h4>{q.question}</h4>
                <div className="q-user-ans">
                  <strong>Your Answer:</strong>
                  <p>{q.answer || 'No answer recorded.'}</p>
                </div>
                <div className="q-ai-critique">
                  <strong>Coach Critique:</strong>
                  <p>{q.feedback || 'Pending critique'}</p>
                </div>
                <RubricBarGrid score={q.score ?? 50} answer={q.answer || ''} />
                {q.idealAnswer && (
                  <div className="q-model-benchmark">
                    <strong>★ 10/10 Benchmark Model Answer:</strong>
                    <p>{q.idealAnswer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="results-action-footer no-print">
        <button className="secondary-glow-btn" onClick={copyFeedback}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          <span>Copy Summary</span>
        </button>
        <button className="secondary-glow-btn" onClick={handlePrint}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect width="12" height="8" x="6" y="14" />
          </svg>
          <span>Export / Print PDF</span>
        </button>
        <button className="primary-glow-btn" onClick={onPractice}>
          <span>Run Another Set</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </section>
  )
}

function Resume({ notify, onStartCustom }) {
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [pastedBio, setPastedBio] = useState('')
  const [detectedSkills, setDetectedSkills] = useState([])

  const extractSkills = (text) => {
    const known = ['Java', 'Spring Boot', 'Kafka', 'React', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'AWS', 'Microservices', 'GraphQL', 'TypeScript', 'System Design', 'Python', 'Golang', 'Node.js']
    const matched = known.filter((k) => text.toLowerCase().includes(k.toLowerCase()))
    setDetectedSkills(matched)
  }

  const handleBioChange = (e) => {
    const val = e.target.value
    setPastedBio(val)
    extractSkills(val)
  }

  const upload = async (e) => {
    e.preventDefault()
    if (!file) return notify('Please select a PDF or DOCX resume file.')
    setBusy(true)
    sfx.click()
    const body = new FormData()
    body.append('file', file)
    try {
      const data = await request('/resume', { method: 'POST', body })
      sfx.success()
      notify(data.message)
    } catch (x) {
      sfx.warning()
      notify(x.message)
    } finally {
      setBusy(false)
    }
  }

  const launchFromDetected = () => {
    if (detectedSkills.length === 0) return notify('Please enter or detect at least one skill.')
    const roleName = `Specialist (${detectedSkills.slice(0, 4).join(', ')})`
    onStartCustom('TECHNICAL', roleName, 3)
  }

  return (
    <section className="resume-container">
      <div className="resume-header">
        <span className="subhead-pill">RESUME INTELLIGENCE</span>
        <h1>Tailor Simulations to Your Background</h1>
        <p>
          Upload your resume or paste your experience bullets. MockMate analyzes your tech stack to formulate questions calibrated directly to your experience.
        </p>
      </div>

      <div className="resume-layout-grid">
        <form onSubmit={upload} className="resume-dropzone-card">
          <input
            id="resume-file"
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <label htmlFor="resume-file" className="dropzone-label">
            <div className="dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3>{file ? file.name : 'Click or Drag & Drop Resume File'}</h3>
            <p>Supports PDF or DOCX format (up to 10 MB)</p>
            {file && <span className="file-ready-tag">File Ready for Ingestion</span>}
          </label>

          <button className="primary-glow-btn wide" disabled={busy || !file}>
            <span>{busy ? 'Analyzing & Ingesting...' : 'Upload & Calibrate AI'}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </form>

        <div className="resume-scanner-card">
          <div className="scanner-top">
            <span className="scanner-badge">QUICK SKILL SCANNER</span>
            <h3>Paste Profile Summary / Bullets</h3>
          </div>
          <textarea
            value={pastedBio}
            onChange={handleBioChange}
            placeholder="Paste your resume experience bullets or tech stack here (e.g. 4+ years Java, Spring Boot, building Kafka-driven microservices)..."
            rows={5}
          />
          <div className="detected-skills-area">
            <span className="detected-label">Detected Competencies:</span>
            {detectedSkills.length === 0 ? (
              <span className="no-skills-msg">Type or paste skills above to see instant recognition</span>
            ) : (
              <div className="detected-chips">
                {detectedSkills.map((sk) => (
                  <span className="detected-chip" key={sk}>
                    ✓ {sk}
                  </span>
                ))}
              </div>
            )}
          </div>

          {detectedSkills.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                className="secondary-glow-btn wide"
                onClick={launchFromDetected}
              >
                <span>Launch Simulation with These Skills →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
