"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

export default function PomodoroTimer() {
  const [workMinutes, setWorkMinutes] = useState(25)
  const [restMinutes, setRestMinutes] = useState(5)
  const [totalPomodoros, setTotalPomodoros] = useState(4)
  const [workInput, setWorkInput] = useState("25")
  const [restInput, setRestInput] = useState("5")
  const [pomodoroInput, setPomodoroInput] = useState("4")
  const [currentPomodoro, setCurrentPomodoro] = useState(1)
  const [timeLeft, setTimeLeft] = useState(workMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isWorkTime, setIsWorkTime] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [accentColor, setAccentColor] = useState("#4f46e5")
  const [showCelebration, setShowCelebration] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const savedColor = localStorage.getItem("pomodoro:accent")
    if (savedColor) {
      setAccentColor(savedColor)
    }
  }, [])

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(isWorkTime ? workMinutes * 60 : restMinutes * 60)
    }
  }, [workMinutes, restMinutes, isWorkTime, isRunning])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      playSound(isWorkTime ? "rest" : "work")

      if (isWorkTime) {
        setIsWorkTime(false)
        setTimeLeft(restMinutes * 60)
      } else {
        if (currentPomodoro >= totalPomodoros) {
          setIsComplete(true)
          setIsRunning(false)
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 3000)
        } else {
          setCurrentPomodoro((prev) => prev + 1)
          setIsWorkTime(true)
          setTimeLeft(workMinutes * 60)
        }
      }
    }
  }, [timeLeft, isRunning, isWorkTime, currentPomodoro, totalPomodoros, workMinutes, restMinutes])

  const hexToRgb = (hex: string) => {
    const m = hex.replace("#", "")
    const v =
      m.length === 3
        ? m
            .split("")
            .map((c) => c + c)
            .join("")
        : m
    const n = Number.parseInt(v, 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")
  }

  const darkenHex = (hex: string, amount: number) => {
    const { r, g, b } = hexToRgb(hex)
    const d = (v: number) => Math.max(0, Math.floor(v * (1 - amount)))
    return rgbToHex(d(r), d(g), d(b))
  }

  const hexToRing = (hex: string, alpha = 0.35) => {
    const { r, g, b } = hexToRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const playSound = (type: "work" | "rest") => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    if (type === "rest") {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.3)
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.6)

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 1)
    } else {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(554.37, audioContext.currentTime + 0.2)
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.4)

      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.8)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startTimer = () => {
    setIsRunning(true)
    setIsComplete(false)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setCurrentPomodoro(1)
    setIsWorkTime(true)
    setTimeLeft(workMinutes * 60)
    setIsComplete(false)
    setShowCelebration(false)
  }

  const TomatoIcon = ({ isWorking }: { isWorking: boolean }) => {
    if (isWorking) {
      return (
        <div className="tomato-working">
          🍅<div className="work-indicator">💪</div>
        </div>
      )
    } else {
      return (
        <div className="tomato-resting">
          🍅<div className="coffee-indicator">☕</div>
        </div>
      )
    }
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setAccentColor(color)
    localStorage.setItem("pomodoro:accent", color)
  }

  const handleWorkMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setWorkInput(value)

    if (value === "") {
      return
    }

    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 60) {
      setWorkMinutes(numValue)
    }
  }

  const handleRestMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRestInput(value)

    if (value === "") {
      return
    }

    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 30) {
      setRestMinutes(numValue)
    }
  }

  const handlePomodorosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPomodoroInput(value)

    if (value === "") {
      return
    }

    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 12) {
      setTotalPomodoros(numValue)
    }
  }

  const handleWorkBlur = () => {
    if (workInput === "" || Number.parseInt(workInput, 10) < 1) {
      setWorkInput("1")
      setWorkMinutes(1)
    }
  }

  const handleRestBlur = () => {
    if (restInput === "" || Number.parseInt(restInput, 10) < 1) {
      setRestInput("1")
      setRestMinutes(1)
    }
  }

  const handlePomodoroBlur = () => {
    if (pomodoroInput === "" || Number.parseInt(pomodoroInput, 10) < 1) {
      setPomodoroInput("1")
      setTotalPomodoros(1)
    }
  }

  return (
    <main
      className="card"
      role="region"
      aria-labelledby="title"
      style={
        {
          "--accent": accentColor,
          "--accent-pressed": darkenHex(accentColor, 0.12),
          "--ring": hexToRing(accentColor, 0.35),
        } as React.CSSProperties
      }
    >
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <div className="celebration-emoji">🎉</div>
            <div className="celebration-text">Amazing work!</div>
            <div className="celebration-subtext">All pomodoros complete!</div>
          </div>
        </div>
      )}

      <div className="header-row">
        <div className="header-section">
          <h1 id="title">Pomodoro timer</h1>
          <p className="sub">Focus with gentle rhythm, rest with purpose.</p>
        </div>
        <div className="picker" title="Pick an accent color">
          <span>Accent</span>
          <input type="color" value={accentColor} onChange={handleColorChange} aria-label="Pick accent color" />
        </div>
      </div>

      <div className="timer-display">
        <div className="tomato-container">
          <TomatoIcon isWorking={isWorkTime} />
        </div>
        <div className="time-text">{formatTime(timeLeft)}</div>
        <div className="status-text">
          {isComplete
            ? "All pomodoros complete! Well done!"
            : `${isWorkTime ? "Focus time" : "Rest time"} • ${currentPomodoro}/${totalPomodoros}`}
        </div>
      </div>

      <div className="controls-section">
        <div className="timer-controls">
          {!isRunning ? (
            <button onClick={startTimer} type="button">
              {isComplete ? "Start new session" : "Start timer"}
            </button>
          ) : (
            <button onClick={pauseTimer} type="button">
              Pause timer
            </button>
          )}
          <button onClick={resetTimer} type="button" className="secondary">
            Reset
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-grid">
            <div className="setting-item">
              <label htmlFor="work-minutes">Work (min)</label>
              <input
                id="work-minutes"
                type="number"
                min="1"
                max="60"
                value={workInput}
                onChange={handleWorkMinutesChange}
                onBlur={handleWorkBlur}
                disabled={isRunning}
              />
            </div>
            <div className="setting-item">
              <label htmlFor="rest-minutes">Rest (min)</label>
              <input
                id="rest-minutes"
                type="number"
                min="1"
                max="30"
                value={restInput}
                onChange={handleRestMinutesChange}
                onBlur={handleRestBlur}
                disabled={isRunning}
              />
            </div>
            <div className="setting-item">
              <label htmlFor="total-pomodoros">Pomodoros</label>
              <input
                id="total-pomodoros"
                type="number"
                min="1"
                max="12"
                value={pomodoroInput}
                onChange={handlePomodorosChange}
                onBlur={handlePomodoroBlur}
                disabled={isRunning}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        :root {
          --bg: #ffffff;
          --card: #f7f7f9;
          --text: #1c1c1f;
          --muted: #6b6b76;
          --accent: ${accentColor};
          --accent-pressed: ${darkenHex(accentColor, 0.12)};
          --ring: ${hexToRing(accentColor, 0.35)};
          --scale: 1;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0c0c0f;
            --card: #15151a;
            --text: #e9e9ee;
            --muted: #a0a0ad;
          }
        }

        .card {
          width: 100%;
          max-width: min(900px, 100%);
          background: var(--card);
          border-radius: clamp(12px, 2vw, 20px);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.04);
          padding: clamp(12px, 3vw, 24px);
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-sizing: border-box;
          margin: 0 auto;
          color: var(--text);
          position: relative;
          container-type: inline-size;
        }

        .celebration-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          border-radius: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          animation: celebrationFade 3s ease-in-out;
        }

        .celebration-content {
          text-align: center;
          color: white;
          animation: celebrationBounce 0.6s ease-out;
        }

        .celebration-emoji {
          font-size: clamp(3rem, 8vw, 6rem);
          margin-bottom: 16px;
          animation: celebrationSpin 2s ease-in-out infinite;
        }

        .celebration-text {
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          font-weight: 700;
          margin-bottom: 8px;
        }

        .celebration-subtext {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          opacity: 0.9;
        }

        @keyframes celebrationFade {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes celebrationBounce {
          0% { transform: scale(0.3) translateY(50px); opacity: 0; }
          50% { transform: scale(1.05) translateY(-10px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        @keyframes celebrationSpin {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-10deg) scale(1.1); }
          75% { transform: rotate(10deg) scale(1.1); }
        }

        /* New header row layout with color picker */
        .header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: clamp(16px, 3vw, 24px);
          gap: clamp(8px, 2vw, 16px);
        }

        .header-section {
          flex: 1;
        }

        h1 {
          margin: 0 0 6px 0;
          font-size: clamp(16px, 1.6rem, 22px);
          letter-spacing: 0.2px;
        }

        .sub {
          color: var(--muted);
          margin: 0;
          font-size: clamp(12px, 0.9rem, 14px);
        }

        /* Color picker styling matching reference */
        .picker {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          font-size: clamp(12px, 0.95rem, 14px);
          flex-shrink: 0;
        }

        .picker input {
          width: 36px;
          height: 30px;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
        }

        .timer-display {
          text-align: center;
          margin: clamp(16px, 4vw, 32px) 0;
          padding: clamp(16px, 3vw, 24px);
          background: rgba(0, 0, 0, 0.04);
          border-radius: clamp(8px, 2vw, 16px);
        }

        @media (prefers-color-scheme: dark) {
          .timer-display {
            background: rgba(255, 255, 255, 0.06);
          }
        }

        .tomato-container {
          position: relative;
          display: inline-block;
          font-size: clamp(2.5rem, 6vw, 4rem);
          margin-bottom: clamp(8px, 2vw, 16px);
        }

        .tomato-working, .tomato-resting {
          position: relative;
          display: inline-block;
        }

        .work-indicator, .coffee-indicator {
          position: absolute;
          bottom: -4px;
          right: -4px;
          font-size: clamp(0.8rem, 2vw, 1.5rem);
          background: var(--card);
          border-radius: 50%;
          padding: clamp(2px, 0.5vw, 4px);
          border: 2px solid var(--accent);
        }

        .time-text {
          font-size: clamp(2rem, 5vw, 4rem);
          font-weight: 600;
          margin: clamp(8px, 2vw, 16px) 0;
          font-family: 'Courier New', monospace;
        }

        .status-text {
          color: var(--muted);
          font-size: clamp(12px, 0.9rem, 16px);
          margin-top: clamp(4px, 1vw, 8px);
        }

        .controls-section {
          margin-top: clamp(16px, 3vw, 24px);
        }

        .timer-controls {
          display: flex;
          gap: clamp(8px, 2vw, 12px);
          justify-content: center;
          margin-bottom: clamp(16px, 3vw, 24px);
          flex-wrap: wrap;
        }

        button {
          appearance: none;
          border: 0;
          cursor: pointer;
          background: var(--accent);
          color: white;
          padding: clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px);
          border-radius: clamp(6px, 1.5vw, 12px);
          font-weight: 600;
          transition: transform 0.03s ease, background-color 0.12s ease;
          box-shadow: 0 0 0 0 var(--ring);
          font-size: clamp(14px, 1rem, 16px);
          min-width: clamp(80px, 20vw, 120px);
        }

        button:active {
          transform: translateY(1px);
          background: var(--accent-pressed);
        }

        button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 6px var(--ring);
        }

        button.secondary {
          background: rgba(0, 0, 0, 0.1);
          color: var(--text);
        }

        @media (prefers-color-scheme: dark) {
          button.secondary {
            background: rgba(255, 255, 255, 0.1);
          }
        }

        button.secondary:active {
          background: rgba(0, 0, 0, 0.15);
        }

        @media (prefers-color-scheme: dark) {
          button.secondary:active {
            background: rgba(255, 255, 255, 0.15);
          }
        }

        .settings-section {
          display: flex;
          flex-direction: column;
          gap: clamp(16px, 3vw, 20px);
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(clamp(80px, 20vw, 120px), 1fr));
          gap: clamp(8px, 2vw, 16px);
        }

        .setting-item {
          display: flex;
          flex-direction: column;
          gap: clamp(4px, 1vw, 6px);
        }

        .setting-item label {
          color: var(--muted);
          font-size: clamp(11px, 0.85rem, 13px);
          font-weight: 500;
        }

        .setting-item input {
          padding: clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 12px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: clamp(4px, 1vw, 8px);
          background: var(--bg);
          color: var(--text);
          font-size: clamp(12px, 0.9rem, 14px);
          transition: border-color 0.12s ease;
        }

        @media (prefers-color-scheme: dark) {
          .setting-item input {
            border-color: rgba(255, 255, 255, 0.1);
          }
        }

        .setting-item input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--ring);
        }

        .setting-item input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive behavior for narrow screens like reference */
        @container (max-width: 360px) {
          .header-row {
            flex-direction: column;
            gap: 8px;
          }
          
          .picker {
            width: 100%;
            justify-content: flex-start;
          }
          
          .timer-controls {
            flex-direction: column;
            gap: 6px;
          }
          
          button {
            width: 100%;
          }
        }

        @container (max-width: 300px) {
          .header-section {
            text-align: center;
          }
          
          .timer-display {
            padding: 12px;
            margin: 12px 0;
          }
          
          .tomato-container {
            font-size: 2rem;
            margin-bottom: 6px;
          }
          
          .time-text {
            font-size: 1.8rem;
            margin: 6px 0;
          }
          
          .settings-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }

        @container (max-width: 200px) {
          .card {
            padding: 8px;
            border-radius: 8px;
          }
          
          .sub {
            display: none;
          }
          
          .status-text {
            font-size: 10px;
          }
          
          .settings-section {
            gap: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </main>
  )
}
