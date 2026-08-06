import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import LiquidBackdrop from '../components/LiquidBackdrop'
import ProductSearch from '../components/ProductSearch'
import { signUpWithProfile } from '../services/userData'
import { useAuth } from '../context/AuthContext'
import { ease } from '../lib/easing'

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Patna', 'Vadodara', 'Chandigarh', 'Kochi', 'Goa', 'Guwahati', 'Coimbatore', 'Visakhapatnam', 'Mysuru', 'Dehradun', 'Shimla', 'Srinagar', 'Noida', 'Gurugram', 'Thiruvananthapuram']

const FITZ = [
  { v: 1, hex: '#F5D8C2' }, { v: 2, hex: '#EDC3A5' }, { v: 3, hex: '#D9A183' },
  { v: 4, hex: '#B87E5C' }, { v: 5, hex: '#8D5A3B' }, { v: 6, hex: '#5C3A26' },
]

// stage: 1..5 — the vine sprouts a leaf per completed stage
const STEPS = [
  { stage: 1, key: 'skin_type', title: ['How does your skin', 'behave', '?'], type: 'single', options: ['oily', 'dry', 'combination', 'normal', 'sensitive'] },
  { stage: 1, key: 'midday_feel', title: ['By midday, it', 'feels', '…'], type: 'single', options: ['shiny all over', 'tight and dry', 'oily T-zone only', 'comfortable', 'itchy or flushed'] },
  { stage: 1, key: 'skin_concerns', title: ['What are we', 'working', ' on?'], type: 'multi', options: ['acne', 'pigmentation', 'anti-aging', 'dullness', 'hydration', 'pores', 'dark circles', 'redness'] },
  { stage: 1, key: 'known_allergens', title: ['Anything your skin', 'refuses', '?'], type: 'multi', options: ['fragrance', 'alcohol', 'nuts', 'latex', 'nickel'], freeText: true },
  { stage: 2, key: 'genetic_history', title: ['What runs in the', 'family', '?'], type: 'multi', options: ['early fine lines', 'adult acne', 'eczema / psoriasis', 'pigmentation / melasma', 'very oily', 'very dry'], note: 'This calibrates, it doesn’t diagnose.' },
  { stage: 2, key: 'skin_tone', title: ['Your skin', 'tone', ''], type: 'scale' },
  { stage: 3, key: 'city', title: ['Where does your skin', 'live', '?'], type: 'city', note: 'City sets humidity, UV and pollution context.' },
  { stage: 3, key: 'indoor_environment', title: ['Your indoor', 'air', ''], type: 'single', options: ['AC most of the day', 'natural airflow', 'a mix of both'] },
  { stage: 3, key: 'spf_habit', title: ['Sun and', 'SPF', ''], type: 'single', options: ['SPF every morning', 'SPF only outdoors', 'rarely SPF', 'never SPF'] },
  { stage: 4, key: 'sleep_hours', title: ['How is your', 'sleep', '?'], type: 'single', options: ['under 6 hours', '6–7 hours', '7–8 hours', '8+ hours'] },
  { stage: 4, key: 'stress_level', title: ['Honest stress', 'level', ''], type: 'single', options: ['low', 'medium', 'high'] },
  { stage: 4, key: 'water_intake', title: ['Water through the', 'day', ''], type: 'single', options: ['under 1L', '1–2L', '2–3L', '3L+'] },
  { stage: 4, key: 'exercise_frequency', title: ['Sweat, per', 'week', ''], type: 'single', options: ['rarely', '1–2 times', '3–4 times', 'most days'] },
  { stage: 5, key: 'treatments', title: ['On any prescription', 'treatments', '?'], type: 'treatments', note: 'Tretinoin, isotretinoin, steroid creams… we’ll warn you about clashes.' },
  { stage: 5, key: 'routineProducts', title: ['Your current', 'go-tos', ''], type: 'products', note: 'These seed your routine and your shelf.' },
  { stage: 5, key: 'account', title: ['Save it to your', 'account', ''], type: 'account' },
]

function Vine({ progress }) {
  const stagesDone = Math.floor(progress * 5)
  return (
    <div className="relative mx-auto h-8 w-full max-w-[420px]">
      <div className="absolute top-1/2 h-[2px] w-full -translate-y-1/2 rounded bg-line" />
      <motion.div
        className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded"
        style={{ background: 'linear-gradient(90deg, var(--accent), var(--gold))' }}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.6, ease: ease.silk }}
      />
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${s * 20 - 2}%` }}>
          <svg
            width="16" height="16" viewBox="0 0 16 16"
            style={{
              transform: stagesDone >= s ? 'scale(1)' : 'scale(0)',
              animation: stagesDone >= s ? 'leaf-pop 0.5s ease-out' : 'none',
              transition: 'transform 0.3s',
            }}
          >
            <path d="M8 14C8 8 11 3 15 1 15 7 12 12 8 14z" fill="var(--accent)" />
            <path d="M8 14C8 8 5 3 1 1 1 7 4 12 8 14z" fill="var(--gold)" opacity="0.85" />
          </svg>
        </span>
      ))}
    </div>
  )
}

function OptionButton({ label, selected, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-2xl border px-5 py-3 text-[0.9rem] capitalize transition-colors ${
        selected
          ? 'border-accent bg-accent text-on-accent shadow-[var(--shadow)]'
          : 'border-line bg-card/70 text-ink hover:border-accent/60'
      }`}
    >
      {label}
    </motion.button>
  )
}

export default function Quiz() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState({ skin_concerns: [], known_allergens: [], genetic_history: [], routineProducts: [], treatments: { on: false, names: '' } })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null) // { needsConfirmation }
  const [freeAllergen, setFreeAllergen] = useState('')

  const step = STEPS[i]

  const set = (key, value) => setAnswers((a) => ({ ...a, [key]: value }))
  const toggleMulti = (key, value) =>
    setAnswers((a) => ({
      ...a,
      [key]: a[key].includes(value) ? a[key].filter((v) => v !== value) : [...a[key], value],
    }))

  const next = () => setI((v) => Math.min(v + 1, STEPS.length - 1))
  const back = () => setI((v) => Math.max(v - 1, 0))

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const sleepMap = { 'under 6 hours': 5.5, '6–7 hours': 6.5, '7–8 hours': 7.5, '8+ hours': 8.5 }
      const profile = {
        name: name || null,
        email,
        skin_type: answers.skin_type ?? null,
        midday_feel: answers.midday_feel ?? null,
        skin_concerns: answers.skin_concerns,
        known_allergens: [...answers.known_allergens, ...(freeAllergen ? [freeAllergen] : [])],
        genetic_history: answers.genetic_history,
        skin_tone: answers.skin_tone ?? null,
        city: answers.city ?? null,
        indoor_environment: answers.indoor_environment ?? null,
        spf_habit: answers.spf_habit ?? null,
        sleep_hours: sleepMap[answers.sleep_hours] ?? null,
        stress_level: answers.stress_level ?? null,
        water_intake: answers.water_intake ?? null,
        exercise_frequency: answers.exercise_frequency ?? null,
        is_on_treatment: answers.treatments.on,
      }
      const treatments = answers.treatments.on
        ? answers.treatments.names.split(',').map((t) => t.trim()).filter(Boolean)
        : []
      const res = await signUpWithProfile({
        email,
        password,
        profile,
        treatments,
        routineProductIds: answers.routineProducts.map((p) => p.id),
      })
      setDone(res)
      if (!res.needsConfirmation) {
        setTimeout(() => navigate('/'), 3600)
      }
    } catch (e) {
      setError(e.message ?? 'Something went sideways — try again.')
    } finally {
      setBusy(false)
    }
  }

  // ---- completion: the gold bloom ----
  if (done) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <LiquidBackdrop bloom className="opacity-80" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.8, ease: ease.silk }}
          className="relative z-10 px-6 text-center"
        >
          <p className="tag-caps mb-4">skinwise</p>
          <h1 className="headline text-[2.4rem] md:text-[3.6rem]">
            Your skin profile is <em>ready</em>.
          </h1>
          <p className="mt-5 text-[0.9rem] text-ink2">
            {done.needsConfirmation
              ? 'One last step — confirm the link we just emailed you, and your profile blooms on sign-in.'
              : 'Taking you home — everything is now tuned to you.'}
          </p>
        </motion.div>
      </div>
    )
  }

  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="headline text-[2.2rem]">Your profile is already <em>blooming</em>.</h1>
          <p className="mt-4 text-[0.9rem] text-ink2">You’re signed in — every verdict and conflict check is tuned to you.</p>
          <button onClick={() => navigate('/skin-garden')} className="mt-8 rounded-full bg-accent px-7 py-3 text-[0.85rem] font-medium text-on-accent">
            Open your Skin Ritual
          </button>
        </div>
      </div>
    )
  }

  const isMulti = step.type === 'multi'
  const canContinue =
    step.type === 'account'
      ? email.includes('@') && password.length >= 6
      : true

  return (
    <div className="flex min-h-screen flex-col px-6 pb-16 pt-28 md:pt-36">
      <div className="mx-auto w-full max-w-[640px]">
        <Vine progress={STEPS[i].stage / 5} />
        <p className="mt-3 text-center text-[0.68rem] uppercase tracking-[0.3em] text-ink2">
          stage {step.stage} of 5
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: ease.silk }}
            className="mt-10"
          >
            <h1 className="headline text-center text-[1.9rem] md:text-[2.6rem]">
              {step.title[0]} <em>{step.title[1]}</em>{step.title[2]}
            </h1>
            {step.note && (
              <p className="mt-3 text-center text-[0.8rem] italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
                {step.note}
              </p>
            )}

            <div className="mt-9">
              {step.type === 'single' && (
                <div className="flex flex-wrap justify-center gap-3">
                  {step.options.map((o) => (
                    <OptionButton
                      key={o}
                      label={o}
                      selected={answers[step.key] === o}
                      onClick={() => { set(step.key, o); setTimeout(next, 260) }}
                    />
                  ))}
                </div>
              )}

              {isMulti && (
                <div className="flex flex-wrap justify-center gap-3">
                  {step.options.map((o) => (
                    <OptionButton key={o} label={o} selected={answers[step.key].includes(o)} onClick={() => toggleMulti(step.key, o)} />
                  ))}
                  {step.freeText && (
                    <input
                      value={freeAllergen}
                      onChange={(e) => setFreeAllergen(e.target.value)}
                      placeholder="anything else…"
                      className="rounded-2xl border border-line bg-card/70 px-5 py-3 text-[0.9rem] outline-none focus:border-accent"
                    />
                  )}
                </div>
              )}

              {step.type === 'scale' && (
                <div className="flex justify-center gap-3">
                  {FITZ.map((f) => (
                    <motion.button
                      key={f.v}
                      whileHover={{ scale: 1.12, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { set('skin_tone', f.v); setTimeout(next, 260) }}
                      aria-label={`Skin tone ${f.v}`}
                      className="h-12 w-12 rounded-full border-2 transition-all"
                      style={{
                        background: f.hex,
                        borderColor: answers.skin_tone === f.v ? 'var(--gold)' : 'transparent',
                        boxShadow: answers.skin_tone === f.v ? '0 0 0 3px color-mix(in srgb, var(--gold) 35%, transparent)' : 'none',
                      }}
                    />
                  ))}
                </div>
              )}

              {step.type === 'city' && (
                <div className="mx-auto max-w-sm">
                  <input
                    list="skinwise-cities"
                    value={answers.city ?? ''}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="Start typing your city…"
                    className="w-full rounded-2xl border border-line bg-card/70 px-5 py-3.5 text-center text-[0.95rem] outline-none focus:border-accent"
                  />
                  <datalist id="skinwise-cities">
                    {CITIES.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              )}

              {step.type === 'treatments' && (
                <div className="mx-auto max-w-sm space-y-4">
                  <div className="flex justify-center gap-3">
                    <OptionButton label="yes" selected={answers.treatments.on} onClick={() => set('treatments', { ...answers.treatments, on: true })} />
                    <OptionButton label="no" selected={!answers.treatments.on} onClick={() => { set('treatments', { on: false, names: '' }); setTimeout(next, 260) }} />
                  </div>
                  <AnimatePresence>
                    {answers.treatments.on && (
                      <motion.input
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        value={answers.treatments.names}
                        onChange={(e) => set('treatments', { ...answers.treatments, names: e.target.value })}
                        placeholder="e.g. tretinoin, isotretinoin…"
                        className="w-full rounded-2xl border border-line bg-card/70 px-5 py-3.5 text-[0.9rem] outline-none focus:border-accent"
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}

              {step.type === 'products' && (
                <div className="space-y-4">
                  <ProductSearch
                    compact
                    placeholder="Search a product you use daily…"
                    onSelect={(p) => {
                      if (!answers.routineProducts.some((x) => x.id === p.id)) {
                        set('routineProducts', [...answers.routineProducts, p])
                      }
                    }}
                  />
                  <div className="flex flex-wrap justify-center gap-2">
                    {answers.routineProducts.map((p) => (
                      <span key={p.id} className="flex items-center gap-2 rounded-full border border-line bg-card/80 px-4 py-1.5 text-[0.78rem] text-ink">
                        {p.name}
                        <button onClick={() => set('routineProducts', answers.routineProducts.filter((x) => x.id !== p.id))} className="text-terra">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {step.type === 'account' && (
                <div className="mx-auto max-w-sm space-y-3">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
                    className="w-full rounded-2xl border border-line bg-card/70 px-5 py-3.5 text-[0.9rem] outline-none focus:border-accent" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
                    className="w-full rounded-2xl border border-line bg-card/70 px-5 py-3.5 text-[0.9rem] outline-none focus:border-accent" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)"
                    className="w-full rounded-2xl border border-line bg-card/70 px-5 py-3.5 text-[0.9rem] outline-none focus:border-accent" />
                  {error && <p className="text-center text-[0.8rem] text-terra">{error}</p>}
                  <button
                    disabled={!canContinue || busy}
                    onClick={submit}
                    className="w-full rounded-2xl bg-accent px-5 py-3.5 text-[0.9rem] font-medium text-on-accent disabled:opacity-40 transition-opacity"
                  >
                    {busy ? 'Planting your profile…' : 'Create my skin profile'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* footer controls */}
        <div className="mt-12 flex items-center justify-between text-[0.8rem]">
          <button onClick={back} disabled={i === 0} className="text-ink2 hover:text-ink disabled:opacity-0 transition">
            ← back
          </button>
          {step.type !== 'account' && (
            <div className="flex items-center gap-5">
              <button onClick={next} className="text-ink2/70 hover:text-ink2 italic transition" style={{ fontFamily: 'var(--font-display)' }}>
                prefer not to say
              </button>
              {(isMulti || step.type === 'products' || step.type === 'city' || (step.type === 'treatments' && answers.treatments.on)) && (
                <button onClick={next} className="rounded-full bg-accent px-6 py-2 font-medium text-on-accent">
                  continue →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
