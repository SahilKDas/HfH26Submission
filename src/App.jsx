import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowLeft, ArrowRight, Brain, Check, ChevronDown, CircleOff, Clipboard,
  CloudRain, Database, Eye, EyeOff, Footprints, HeartHandshake, Info, Leaf, LockKeyhole,
  Menu, MessageCircleHeart, Minus, MoonStar, Pause, Play, RefreshCcw, Scan, ShieldCheck,
  Snowflake, Sparkles, SunDim, Trash2, Waves, X, Zap,
} from 'lucide-react';
import { needOptions, signalOptions } from './data/interventions.js';
import { createPlan, recordOutcome } from './lib/engine.js';
import { addSession, clearPrivateData, loadOutcomes, loadSessions, saveOutcomes } from './lib/storage.js';

const iconMap = { Activity, CircleOff, CloudRain, EyeOff, Footprints, Scan, Snowflake, SunDim, Waves, Zap };

const defaultCheckin = {
  signals: [],
  need: '',
  intensity: 6,
  capacity: 90,
  preferences: { noBreath: false, eyesOpen: true, silent: false, seated: false },
  immediateDanger: false,
};

function Brand({ compact = false }) {
  return (
    <button className="brand" onClick={() => window.dispatchEvent(new CustomEvent('unspool:navigate', { detail: 'home' }))} aria-label="Unspool home">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      {!compact && <span>unspool</span>}
    </button>
  );
}

function Pill({ children, tone = 'neutral', icon: Icon }) {
  return <span className={`pill pill-${tone}`}>{Icon && <Icon size={14} aria-hidden="true" />}{children}</span>;
}

function Header({ view, setView, openCheckin }) {
  const [open, setOpen] = useState(false);
  const go = (next) => { setView(next); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className={open ? 'nav-open' : ''} aria-label="Main navigation">
          <button className={view === 'home' ? 'active' : ''} onClick={() => go('home')}>Home</button>
          <button className={view === 'insights' ? 'active' : ''} onClick={() => go('insights')}>My pattern</button>
          <button className={view === 'method' ? 'active' : ''} onClick={() => go('method')}>How it works</button>
          <button className="nav-checkin" onClick={openCheckin}>Check in <ArrowRight size={15} /></button>
        </nav>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

function Hero({ openCheckin, openSafety }) {
  return (
    <main id="main-content">
      <section className="hero-shell">
        <div className="hero-art" role="img" aria-label="A softly glowing path opening into a quiet sanctuary" />
        <div className="hero-vignette" />
        <div className="hero-content">
          <Pill tone="warm" icon={Sparkles}>Built for the moment before words</Pill>
          <h1>When everything is <em>too much,</em><br />start with one signal.</h1>
          <p className="hero-lede">No blank page. No explaining. Tell us what your body is doing and get one private, evidence-informed next step for the next 90 seconds.</p>
          <div className="hero-actions">
            <button className="primary-button large" onClick={openCheckin}>Find my next step <ArrowRight size={18} /></button>
            <button className="quiet-button large" onClick={openSafety}><ShieldCheck size={18} /> See our safety promise</button>
          </div>
          <div className="trust-row" aria-label="Privacy commitments">
            <span><LockKeyhole size={16} /> No account</span>
            <span><Database size={16} /> Stays on device</span>
            <span><Brain size={16} /> No diagnosis</span>
          </div>
        </div>
        <aside className="hero-now-card">
          <span className="eyebrow">A gentle check-in</span>
          <div className="now-orbit"><span>90</span><small>seconds</small></div>
          <h2>Less figuring out.<br />More getting through.</h2>
          <p>Choose from simple body signals. Unspool does the sorting for you.</p>
          <button onClick={openCheckin}>Begin quietly <ArrowRight size={16} /></button>
        </aside>
      </section>

      <section className="proof-strip" aria-label="Product principles">
        <span>Body-first</span><i />
        <span>Trauma-aware</span><i />
        <span>Explainable AI</span><i />
        <span>Local by default</span>
      </section>

      <section className="why-section section-pad">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow coral">THE LANGUAGE GAP</span>
            <h2>You should not have to explain a storm while you are standing in it.</h2>
          </div>
          <p>Most mental-health tools begin with a question: “How are you feeling?” In a high-stress moment, that can be the hardest possible starting point. Unspool begins lower—at the level of sensation, capacity, and immediate need.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card feature-dark">
            <div className="feature-number">01</div>
            <div className="signal-cloud" aria-hidden="true">
              <span>tight chest</span><span>far away</span><span>too loud</span><span>racing</span>
            </div>
            <h3>Signal, don’t summarize</h3>
            <p>Tap what your body is doing. No journaling, labels, or emotional vocabulary required.</p>
          </article>
          <article className="feature-card feature-coral">
            <div className="feature-number">02</div>
            <div className="mini-path" aria-hidden="true"><i /><i /><i /><i /></div>
            <h3>One step, not twelve</h3>
            <p>A safety-constrained recommender selects one small action that fits your time, intensity, and access needs.</p>
          </article>
          <article className="feature-card feature-paper">
            <div className="feature-number">03</div>
            <div className="bridge-preview">
              <MessageCircleHeart size={19} />
              <span>“I could use calm company. You don’t need to fix it.”</span>
            </div>
            <h3>Bridge back to people</h3>
            <p>Every plan includes language you can copy when reaching out feels bigger than the words you have.</p>
          </article>
        </div>
      </section>

      <section className="demo-section section-pad">
        <div className="demo-copy">
          <Pill tone="sage" icon={Leaf}>Designed to subtract</Pill>
          <h2>Support that meets your actual capacity.</h2>
          <p>Breathwork uncomfortable? Keep your eyes open? Need a seated option? Unspool treats access needs as core inputs—not settings buried three screens deep.</p>
          <ul className="check-list">
            <li><Check /> Works without an account or cloud AI</li>
            <li><Check /> Shows exactly why a step was selected</li>
            <li><Check /> Learns from a single “helped / didn’t help” tap</li>
            <li><Check /> Crisis signals bypass the recommender entirely</li>
          </ul>
          <button className="text-button" onClick={openCheckin}>Try the two-minute flow <ArrowRight size={17} /></button>
        </div>
        <div className="demo-phone" aria-label="Example Unspool recommendation">
          <div className="phone-top"><Brand compact /><span>private session</span><LockKeyhole size={15} /></div>
          <div className="phone-body">
            <span className="eyebrow">YOUR NEXT 90 SECONDS</span>
            <div className="phone-orbit"><span>1:30</span></div>
            <h3>Turn the volume down.</h3>
            <p>Remove one source of demand instead of adding a task.</p>
            <div className="phone-step"><span>1</span><p><b>Choose one input</b><br />Dim one screen, mute one sound, or move one busy object.</p></div>
            <button>Start when ready <Play size={15} fill="currentColor" /></button>
            <small><ShieldCheck size={13} /> Selected for high input load · 82% fit</small>
          </div>
        </div>
      </section>

      <section className="closing-section section-pad">
        <div className="closing-orb" aria-hidden="true" />
        <span className="eyebrow">YOU DO NOT HAVE TO SOLVE THE WHOLE DAY</span>
        <h2>Just find the next kind thing.</h2>
        <p>A private check-in takes about two minutes. You can leave at any point.</p>
        <button className="primary-button light" onClick={openCheckin}>Check in with myself <ArrowRight size={18} /></button>
      </section>
    </main>
  );
}

function CheckinModal({ onClose, onPlan, onCrisis }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(defaultCheckin);
  const [processing, setProcessing] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, [step]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const toggleSignal = (id) => setData((current) => ({
    ...current,
    signals: current.signals.includes(id) ? current.signals.filter((signal) => signal !== id) : [...current.signals, id],
  }));

  const canContinue = step === 1 ? data.signals.length > 0 : step === 2 ? Boolean(data.need) : true;
  const next = () => {
    if (step < 3) setStep(step + 1);
    else {
      setProcessing(true);
      window.setTimeout(() => {
        const plan = createPlan(data, loadOutcomes());
        setProcessing(false);
        onPlan(plan, data);
      }, 1450);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="checkin-title">
      <div className="checkin-modal">
        <header className="checkin-header">
          <Brand />
          <div className="privacy-chip"><LockKeyhole size={14} /> Private on this device</div>
          <button className="icon-button" onClick={onClose} aria-label="Close check-in"><X /></button>
        </header>
        <div className="progress-rail" aria-label={`Step ${step} of 3`}><span style={{ width: `${step * 33.333}%` }} /></div>
        <div className="checkin-content">
          <div className="step-meta"><span>0{step}</span><p>of 03</p></div>
          {step === 1 && (
            <section className="checkin-step">
              <span className="eyebrow coral">NO PERFECT WORDS NEEDED</span>
              <h1 id="checkin-title" tabIndex="-1" ref={titleRef}>What is your body telling you?</h1>
              <p className="step-lede">Choose any that feel close enough. There is no score and no diagnosis.</p>
              <div className="signal-grid">
                {signalOptions.map((signal) => {
                  const Icon = iconMap[signal.icon];
                  const selected = data.signals.includes(signal.id);
                  return (
                    <button key={signal.id} className={`signal-option ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => toggleSignal(signal.id)}>
                      <span className="signal-icon"><Icon size={21} /></span>
                      <span>{signal.label}</span>
                      <i>{selected ? <Check size={15} /> : <PlusIcon />}</i>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          {step === 2 && (
            <section className="checkin-step">
              <span className="eyebrow coral">MAKE THE STEP FIT THE MOMENT</span>
              <h1 id="checkin-title" tabIndex="-1" ref={titleRef}>What would help most right now?</h1>
              <p className="step-lede">Choose the direction, not the perfect outcome.</p>
              <div className="need-grid">
                {needOptions.map((need) => (
                  <button key={need.id} aria-pressed={data.need === need.id} className={data.need === need.id ? 'selected' : ''} onClick={() => setData({ ...data, need: need.id })}>
                    <span>{need.label}</span>{data.need === need.id && <Check size={16} />}
                  </button>
                ))}
              </div>
              <div className="range-card">
                <div className="range-heading"><label htmlFor="intensity">How intense is it?</label><strong>{data.intensity}<small>/10</small></strong></div>
                <input id="intensity" type="range" min="1" max="10" value={data.intensity} onChange={(event) => setData({ ...data, intensity: Number(event.target.value) })} style={{ '--range': `${(data.intensity - 1) * 11.11}%` }} />
                <div className="range-labels"><span>Present, but manageable</span><span>Hard to stay with</span></div>
              </div>
              <fieldset className="capacity-field">
                <legend>How much capacity do you have?</legend>
                <div>
                  {[{ value: 45, label: 'About 45 sec' }, { value: 90, label: 'About 90 sec' }, { value: 180, label: 'Up to 3 min' }].map((item) => (
                    <button type="button" className={data.capacity === item.value ? 'selected' : ''} key={item.value} onClick={() => setData({ ...data, capacity: item.value })}>{item.label}</button>
                  ))}
                </div>
              </fieldset>
            </section>
          )}
          {step === 3 && (
            <section className="checkin-step preferences-step">
              <span className="eyebrow coral">ACCESS IS PART OF THE PLAN</span>
              <h1 id="checkin-title" tabIndex="-1" ref={titleRef}>Make this easier to use.</h1>
              <p className="step-lede">These choices constrain the recommender. They are not saved as a profile.</p>
              <div className="preference-list">
                <PreferenceRow icon={Waves} title="Skip breath-focused steps" body="Breath attention can feel activating for some people." checked={data.preferences.noBreath} onChange={(value) => setData({ ...data, preferences: { ...data.preferences, noBreath: value } })} />
                <PreferenceRow icon={Eye} title="Keep my eyes open" body="Only recommend steps that work with eyes open." checked={data.preferences.eyesOpen} onChange={(value) => setData({ ...data, preferences: { ...data.preferences, eyesOpen: value } })} />
                <PreferenceRow icon={MoonStar} title="I need a silent option" body="No audio, speaking, or noticeable movement." checked={data.preferences.silent} onChange={(value) => setData({ ...data, preferences: { ...data.preferences, silent: value } })} />
                <PreferenceRow icon={Activity} title="I need to stay seated" body="Avoid steps that assume standing or balance." checked={data.preferences.seated} onChange={(value) => setData({ ...data, preferences: { ...data.preferences, seated: value } })} />
              </div>
              <div className="review-card">
                <div><ShieldCheck size={20} /><span><b>Safety check active</b><small>Every candidate is checked against intensity and access constraints before ranking.</small></span></div>
                <button onClick={onCrisis}>I may not be safe right now</button>
              </div>
            </section>
          )}
        </div>
        <footer className="checkin-footer">
          <button className="back-button" onClick={() => step === 1 ? onClose() : setStep(step - 1)}><ArrowLeft size={17} /> {step === 1 ? 'Leave' : 'Back'}</button>
          <span>Your answers stay in this tab.</span>
          <button className="primary-button" disabled={!canContinue} onClick={next}>{step === 3 ? 'Create my step' : 'Continue'} <ArrowRight size={17} /></button>
        </footer>
        {processing && <ProcessingOverlay />}
      </div>
    </div>
  );
}

function PlusIcon() { return <><span className="sr-only">Select</span><i className="plus-line" /></>; }

function PreferenceRow({ icon: Icon, title, body, checked, onChange }) {
  return (
    <label className="preference-row">
      <span className="preference-icon"><Icon size={21} /></span>
      <span className="preference-copy"><b>{title}</b><small>{body}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i className="toggle" aria-hidden="true"><span /></i>
    </label>
  );
}

function ProcessingOverlay() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(() => setStage((value) => Math.min(3, value + 1)), 360);
    return () => window.clearInterval(interval);
  }, []);
  const stages = ['Checking safety constraints', 'Retrieving fitting practices', 'Learning from local feedback', 'Creating a plain-language reason'];
  return (
    <div className="processing-overlay" role="status" aria-live="polite">
      <div className="processing-orbit"><span /><span /><Brain size={28} /></div>
      <h2>Finding the lightest next step…</h2>
      <p>Nothing is being uploaded.</p>
      <ul>{stages.map((label, index) => <li className={index <= stage ? 'done' : ''} key={label}>{index < stage ? <Check size={14} /> : <span />}{label}</li>)}</ul>
    </div>
  );
}

function PlanView({ plan, input, onClose, onAgain }) {
  const item = plan.primary;
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(item.duration);
  const [finished, setFinished] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rated, setRated] = useState(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    if (!running || remaining <= 0) return undefined;
    const timer = window.setInterval(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [running, remaining]);

  useEffect(() => {
    if (remaining === 0 && !finished) { setRunning(false); setFinished(true); }
  }, [remaining, finished]);

  const elapsed = item.duration - remaining;
  const activeStep = Math.min(item.steps.length - 1, item.steps.findIndex((_, index) => elapsed < item.steps.slice(0, index + 1).reduce((sum, step) => sum + step.time, 0)));
  const displayStep = activeStep < 0 ? item.steps.length - 1 : activeStep;
  const rate = (helpful) => {
    const outcomes = recordOutcome(loadOutcomes(), item.id, helpful);
    saveOutcomes(outcomes);
    if (!sessionRef.current) sessionRef.current = addSession({ interventionId: item.id, before: input.intensity, after: helpful ? Math.max(1, input.intensity - 2) : input.intensity, helpful });
    setRated(helpful);
  };
  const copy = async () => {
    await navigator.clipboard?.writeText(item.bridge);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const circumference = 2 * Math.PI * 74;
  const progress = remaining / item.duration;

  return (
    <div className="plan-page">
      <header className="plan-header"><Brand /><Pill tone="sage" icon={LockKeyhole}>Private session</Pill><button className="icon-button" onClick={onClose} aria-label="Close plan"><X /></button></header>
      <main className="plan-main">
        <div className="plan-intro">
          <span className="eyebrow coral">YOUR NEXT {item.duration} SECONDS</span>
          <h1>{item.name}.</h1>
          <p>{item.short}</p>
          <button className="why-button" onClick={() => setWhyOpen(!whyOpen)} aria-expanded={whyOpen}><Sparkles size={16} /> Why this step <ChevronDown size={16} /></button>
          {whyOpen && (
            <div className="why-panel">
              <p>{item.why}</p>
              <div className="reason-chips">
                {item.explanation.matchedSignals.slice(0, 2).map((signal) => <span key={signal}>{signal.replace('-', ' ')}</span>)}
                {item.explanation.capacityFit && <span>fits your time</span>}
                {item.explanation.preferenceFit && <span>fits access needs</span>}
              </div>
              <small><ShieldCheck size={13} /> {item.confidence}% retrieval fit · {item.explanation.evidence} · {item.explanation.learning}</small>
            </div>
          )}
        </div>

        <section className="practice-card">
          <div className="timer-column">
            <div className={`timer-ring ${running ? 'running' : ''}`}>
              <svg viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="74" /><circle className="progress" cx="90" cy="90" r="74" style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - progress) }} /></svg>
              <div><strong>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</strong><span>{finished ? 'complete' : running ? 'stay easy' : 'when ready'}</span></div>
            </div>
            {!finished ? (
              <button className="timer-control" onClick={() => setRunning(!running)}>{running ? <Pause fill="currentColor" /> : <Play fill="currentColor" />} {running ? 'Pause' : remaining < item.duration ? 'Continue' : 'Start gently'}</button>
            ) : <Pill tone="sage" icon={Check}>You made space</Pill>}
            <button className="reset-link" onClick={() => { setRemaining(item.duration); setFinished(false); setRunning(false); }}><RefreshCcw size={14} /> Reset timer</button>
          </div>
          <div className="steps-column">
            {item.steps.map((step, index) => (
              <article key={step.title} className={`${displayStep === index ? 'active' : ''} ${elapsed >= item.steps.slice(0, index + 1).reduce((sum, value) => sum + value.time, 0) ? 'passed' : ''}`}>
                <span>{index + 1}</span>
                <div><div className="step-title-row"><h3>{step.title}</h3><small>{step.time}s</small></div><p>{step.body}</p></div>
              </article>
            ))}
            {item.cautions.length > 0 && <div className="caution"><Info size={16} /><span><b>Your body gets the final say.</b> {item.cautions[0]}</span></div>}
          </div>
        </section>

        <section className="bridge-card">
          <div className="bridge-icon"><HeartHandshake /></div>
          <div><span className="eyebrow">IF YOU WANT A PERSON IN THE LOOP</span><h2>Borrow these words.</h2><blockquote>“{item.bridge}”</blockquote></div>
          <button onClick={copy}>{copied ? <Check size={17} /> : <Clipboard size={17} />}{copied ? 'Copied' : 'Copy message'}</button>
        </section>

        <section className="feedback-card">
          {rated === null ? <><div><span className="eyebrow">TEACH YOUR PRIVATE MODEL</span><h2>Did this make the moment even 1% easier?</h2><p>Only the yes/no is stored—not what you selected or felt.</p></div><div><button onClick={() => rate(true)}>Yes, a little <Check size={17} /></button><button onClick={() => rate(false)}>Not this time <Minus size={17} /></button></div></> : <div className="feedback-thanks"><span><Check /></span><div><h2>That is enough data.</h2><p>Your answer stays on this device and quietly improves the next ranking.</p></div></div>}
        </section>
        <div className="plan-actions"><button onClick={onAgain}><RefreshCcw size={16} /> Start another check-in</button><button onClick={onClose}>Return home</button></div>
      </main>
    </div>
  );
}

function CrisisModal({ onClose }) {
  return (
    <div className="modal-backdrop crisis-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="crisis-title">
      <div className="crisis-modal">
        <button className="icon-button" onClick={onClose} aria-label="Close safety support"><X /></button>
        <div className="crisis-mark"><HeartHandshake /></div>
        <span className="eyebrow coral">THE APP STEPS ASIDE HERE</span>
        <h1 id="crisis-title">You deserve real-time human support.</h1>
        <p>If you may hurt yourself or someone else, or cannot stay safe, call your local emergency number now or go to the nearest emergency department.</p>
        <div className="crisis-actions">
          <a href="tel:988" className="primary-button">Call or text 988 <ArrowRight size={17} /></a>
          <a href="https://findahelpline.com/" target="_blank" rel="noreferrer" className="quiet-button">Find support outside the U.S. <ArrowRight size={17} /></a>
        </div>
        <small>In the U.S. and Canada, 988 connects you with trained crisis support. If calling is not safe, move toward another person or public place if you can.</small>
        <button className="stay-button" onClick={onClose}>I can stay safe right now—return to Unspool</button>
      </div>
    </div>
  );
}

function InsightsView({ openCheckin }) {
  const [sessions, setSessions] = useState(() => loadSessions());
  const [confirmClear, setConfirmClear] = useState(false);
  const helpful = sessions.filter((session) => session.helpful).length;
  const rate = sessions.length ? Math.round((helpful / sessions.length) * 100) : 0;
  const clear = () => { clearPrivateData(); setSessions([]); setConfirmClear(false); };
  const points = sessions.slice(0, 7).reverse();
  const chartPoints = points.map((session, index) => `${20 + index * 55},${130 - ((session.after ?? session.before) / 10) * 95}`).join(' ');
  return (
    <main id="main-content" className="insights-page page-shell">
      <div className="page-kicker"><Pill tone="sage" icon={LockKeyhole}>Only visible on this device</Pill></div>
      <div className="insights-heading"><div><span className="eyebrow coral">YOUR PRIVATE PATTERN</span><h1>Small signals.<br /><em>Useful memory.</em></h1></div><p>Unspool remembers outcomes, not stories. No journal text, diagnosis, or identity is collected. Your pattern can be erased in one tap.</p></div>
      <section className="stats-grid">
        <article><span>Check-ins</span><strong>{sessions.length || '—'}</strong><small>{sessions.length ? 'stored locally' : 'Your first check-in starts the pattern'}</small></article>
        <article><span>Helpful steps</span><strong>{sessions.length ? `${rate}%` : '—'}</strong><small>Based on your one-tap feedback</small></article>
        <article className="accent"><span>Data uploaded</span><strong>0 <small>bytes</small></strong><small>Local mode keeps raw signals here</small></article>
      </section>
      <div className="insights-grid">
        <section className="pattern-card">
          <div className="card-heading"><div><span className="eyebrow">RECENT MOMENTS</span><h2>Intensity after each step</h2></div><Pill>{points.length ? 'Your data' : 'Waiting for data'}</Pill></div>
          {points.length ? (
            <div className="line-chart"><div className="y-labels"><span>10</span><span>5</span><span>0</span></div><svg viewBox="0 0 380 150" role="img" aria-label="Recent intensity scores"><line x1="20" y1="35" x2="360" y2="35" /><line x1="20" y1="82" x2="360" y2="82" /><line x1="20" y1="130" x2="360" y2="130" /><polyline points={chartPoints} />{points.map((session, index) => <circle key={session.id} cx={20 + index * 55} cy={130 - ((session.after ?? session.before) / 10) * 95} r="5" />)}</svg></div>
          ) : (
            <div className="empty-pattern"><div><i /><i /><i /></div><h3>No story to perform here.</h3><p>Complete a practice and answer one tiny question. That is all the model needs.</p><button onClick={openCheckin}>Try a check-in <ArrowRight size={16} /></button></div>
          )}
        </section>
        <section className="model-card">
          <span className="eyebrow">WHAT THE MODEL KNOWS</span>
          <h2>A deliberately tiny memory.</h2>
          <div className="knows-row"><Check /><span><b>Intervention ID</b><small>Which kind of step you tried</small></span></div>
          <div className="knows-row"><Check /><span><b>One outcome bit</b><small>Helped / did not help</small></span></div>
          <div className="knows-row muted"><X /><span><b>No raw check-in</b><small>Signals and needs are discarded</small></span></div>
          <div className="knows-row muted"><X /><span><b>No identity or diagnosis</b><small>Not requested, inferred, or stored</small></span></div>
          <button className="delete-button" onClick={() => setConfirmClear(true)}><Trash2 size={16} /> Erase my private model</button>
          {confirmClear && <div className="confirm-clear"><p>This removes all local outcomes and check-ins from this browser.</p><div><button onClick={clear}>Erase it</button><button onClick={() => setConfirmClear(false)}>Cancel</button></div></div>}
        </section>
      </div>
    </main>
  );
}

function MethodView({ openCheckin }) {
  const [audit, setAudit] = useState({ status: 'idle' });
  const runAudit = async () => {
    setAudit({ status: 'running' });
    try {
      const response = await fetch('/api/workflow/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'synthetic-parity-audit' }),
      });
      const result = await response.json();
      setAudit({ status: result.configured ? 'queued' : 'local', ...result });
    } catch {
      setAudit({ status: 'local', message: 'The deployed Workflow is not connected in this preview.' });
    }
  };
  const stages = [
    { n: '01', icon: ShieldCheck, title: 'Safety gate', body: 'Urgent danger signals bypass recommendation entirely. Bounded inputs and explicit constraints reduce prompt injection and unsafe inference.' },
    { n: '02', icon: Scan, title: 'Hybrid retrieval', body: 'Structured signal overlap and a compact local embedding retrieve practices from a curated, evidence-labeled library.' },
    { n: '03', icon: Sparkles, title: 'Contextual ranking', body: 'A small contextual bandit balances prior helpfulness with gentle exploration, while time and accessibility remain hard constraints.' },
    { n: '04', icon: Eye, title: 'Explanation layer', body: 'Every result reports matched signals, evidence family, time fit, access fit, and local learning—without presenting a health conclusion.' },
  ];
  return (
    <main id="main-content" className="method-page page-shell">
      <section className="method-hero">
        <div><Pill tone="warm" icon={Brain}>AI that knows its place</Pill><h1>Useful intelligence.<br /><em>Radical restraint.</em></h1><p>Unspool uses AI to reduce decision load—not to impersonate a clinician, diagnose distress, or keep a transcript of someone’s hardest moments.</p><button className="primary-button" onClick={openCheckin}>See it in action <ArrowRight size={17} /></button></div>
        <div className="method-visual" aria-hidden="true"><div className="method-core"><Brain /></div><span className="ring r1" /><span className="ring r2" /><span className="ring r3" /><small className="orbit-label l1">bounded</small><small className="orbit-label l2">local</small><small className="orbit-label l3">explainable</small></div>
      </section>
      <section className="pipeline-section">
        <div className="section-heading"><span className="eyebrow coral">FIVE STAGES, ZERO BLACK BOX</span><h2>Every recommendation earns its way onto the screen.</h2></div>
        <div className="pipeline-grid">
          {stages.map(({ n, icon: Icon, title, body }) => <article key={n}><div><span>{n}</span><Icon /></div><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>
      <section className="responsibility-section">
        <div className="responsibility-copy"><span className="eyebrow">RESPONSIBLE BY ARCHITECTURE</span><h2>The safest health record is the one we never create.</h2><p>Raw check-ins are processed in-browser and discarded. Only a practice ID and one-bit helpfulness outcome can persist locally. Cloud workflows receive bounded synthetic or consented aggregate vectors—never journal text or direct identifiers.</p></div>
        <div className="data-diagram">
          <div className="diagram-row positive"><span><Check /></span><div><b>On your device</b><small>Signals · intensity · access needs · outcome</small></div><Pill tone="sage">encrypted by OS</Pill></div>
          <div className="diagram-divider"><LockKeyhole /><i /></div>
          <div className="diagram-row"><span><Database /></span><div><b>Optional Render audit workflow</b><small>Bounded numeric vectors · no identity · auto-expiring</small></div><Pill>opt-in only</Pill></div>
          <div className="diagram-row blocked"><span><X /></span><div><b>Never collected</b><small>Names · contacts · diagnoses · free text · location</small></div></div>
        </div>
      </section>
      <section className="workflow-proof">
        <div className="workflow-copy">
          <Pill tone="sage" icon={RefreshCcw}>Powered by Render Workflows</Pill>
          <h2>Bias checks should run like infrastructure, not promises.</h2>
          <p>A distributed Workflow generates bounded synthetic cohorts, fans out accessibility-parity evaluations, retries failed cases, and composes a versioned model-card audit. It never receives a real check-in.</p>
        </div>
        <div className="workflow-console">
          <div className="console-top"><span><i /><i /><i /></span><b>unspool-ai-audit</b><small>Render Workflow</small></div>
          <div className="console-flow"><span>generate cohort</span><ArrowRight /><span>48 parallel checks</span><ArrowRight /><span>model card</span></div>
          <button onClick={runAudit} disabled={audit.status === 'running'}>{audit.status === 'running' ? <RefreshCcw className="spin-icon" /> : <Play fill="currentColor" />}{audit.status === 'running' ? 'Starting workflow…' : 'Run a synthetic safety audit'}</button>
          {audit.status !== 'idle' && audit.status !== 'running' && <div className={`audit-result ${audit.status}`}><ShieldCheck /><span><b>{audit.status === 'queued' ? 'Workflow queued on Render' : 'Local safe mode confirmed'}</b><small>{audit.taskRunId ? `Run ${audit.taskRunId}` : audit.message}</small></span></div>}
          <small className="console-note"><LockKeyhole /> Input: seed + cohort size only. No user data.</small>
        </div>
      </section>
      <section className="guardrail-grid">
        <article><ShieldCheck /><h3>Clinical boundary</h3><p>Practices are brief self-regulation options, never treatment plans. Copy names evidence families without claiming a cure.</p></article>
        <article><Eye /><h3>Explainability</h3><p>Users can inspect the score factors and choose a different option. The model does not conceal uncertainty.</p></article>
        <article><Activity /><h3>Access parity</h3><p>Automated tests verify that breath sensitivity, eyes-open, silent, and seated modes all receive safe candidates.</p></article>
        <article><RefreshCcw /><h3>Reversible learning</h3><p>Local feedback can be viewed or erased at any time. No dark patterns, retention tricks, or inaccessible settings.</p></article>
      </section>
    </main>
  );
}

function Footer({ setView, openCheckin }) {
  return (
    <footer className="site-footer"><div className="footer-top"><div><Brand /><p>A low-language bridge from overwhelm to one safe next step.</p></div><div><span>Explore</span><button onClick={() => setView('method')}>How it works</button><button onClick={() => setView('insights')}>My pattern</button><button onClick={openCheckin}>Check in</button></div><div><span>Safety</span><a href="https://findahelpline.com/" target="_blank" rel="noreferrer">Find a helpline</a><a href="tel:988">Call or text 988</a><small>Not medical care or crisis response.</small></div></div><div className="footer-bottom"><span>© 2026 Unspool</span><span>Built for Hack for Humanity · Mental Health</span><span>Privacy is the product.</span></div></footer>
  );
}

export default function App() {
  const [view, setView] = useState('home');
  const [checkingIn, setCheckingIn] = useState(false);
  const [planState, setPlanState] = useState(null);
  const [crisis, setCrisis] = useState(false);

  useEffect(() => {
    const navigate = (event) => setView(event.detail);
    window.addEventListener('unspool:navigate', navigate);
    return () => window.removeEventListener('unspool:navigate', navigate);
  }, []);

  const openCheckin = () => { setPlanState(null); setCheckingIn(true); };
  const receivePlan = (plan, input) => {
    setCheckingIn(false);
    setPlanState({ plan, input });
    window.requestAnimationFrame(() => window.scrollTo({ top: 0 }));
  };
  const content = useMemo(() => {
    if (view === 'insights') return <InsightsView openCheckin={openCheckin} />;
    if (view === 'method') return <MethodView openCheckin={openCheckin} />;
    return <Hero openCheckin={openCheckin} openSafety={() => setView('method')} />;
  }, [view]);

  if (planState) return <PlanView plan={planState.plan} input={planState.input} onClose={() => { setPlanState(null); setView('home'); }} onAgain={openCheckin} />;

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Header view={view} setView={setView} openCheckin={openCheckin} />
      {content}
      <Footer setView={setView} openCheckin={openCheckin} />
      {checkingIn && <CheckinModal onClose={() => setCheckingIn(false)} onPlan={receivePlan} onCrisis={() => setCrisis(true)} />}
      {crisis && <CrisisModal onClose={() => setCrisis(false)} />}
    </div>
  );
}
