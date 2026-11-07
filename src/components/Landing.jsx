import { ArrowRight, Check, ClipboardPaste, Compass, Focus, Keyboard, ListChecks, ListTree, Minus, Presentation, Sparkles } from 'lucide-react';
import Logo from './Logo.jsx';
import { COMPARISON, PLANS, yearlySavingPct } from '../lib/plans.js';

const FEATURES = [
  [ClipboardPaste, 'Paste to map', 'Paste notes or a bullet list from anywhere and get an organised map in one step.'],
  [ListChecks, 'Tasks & progress', 'Turn ideas into tasks with due dates. Every branch shows how much is done.'],
  [ListTree, 'Map ⇄ Outline', 'Write fast as a bullet list, then switch to see it visually. Same map, two views.'],
  [Presentation, 'Present in one click', 'Show your map full screen, branch by branch, with speaker notes.'],
  [Focus, 'Focus mode', 'Zoom into one branch and hide the rest while you work.'],
  [Keyboard, 'Keyboard first', 'Arrow keys, Tab, Enter and F2: build a whole map without the mouse.'],
];

const MORE = ['Undo & redo', 'Search (⌘K)', 'Auto-layout', '16 templates', 'PDF · PNG · Markdown', 'Light & dark', 'Works offline', 'No sign-up'];

const FAQ = [
  ['Is it really free?', `Yes. The Free plan includes ${PLANS.free.maxMaps} maps and every editing feature. Pro adds unlimited maps, PDF and JSON export, and presentation mode.`],
  ['Where are my maps saved?', 'In your browser, automatically. If you run the optional server with MongoDB, they sync to your database instead.'],
  ['Do I need an account?', 'No. Open the app and start mapping. Nothing to install or sign up for.'],
  ['Is the Pro checkout real?', 'Not yet: this is a portfolio project, so upgrading is a demo that unlocks Pro in your browser. No payment is ever taken.'],
];

const cell = (v) => (v === true ? <Check size={16} className="yes" /> : v === false ? <Minus size={16} className="no" /> : v);

export default function Landing({ onStart, onTour, heroSrc }) {
  return (
    <div className="landing">
      <header className="landing__nav">
        <a className="landing__brand" href="#home" aria-label="Mind Mapper home">
          <Logo size={32} />
          <span>Mind Mapper</span>
        </a>
        <nav aria-label="Sections">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <button className="btn btn--primary" onClick={onStart}>
          Open the app <ArrowRight size={16} />
        </button>
      </header>

      <section className="hero">
        <p className="hero__eyebrow">
          <Sparkles size={14} /> Free · No sign-up · Works in your browser
        </p>
        <h1>
          Think it. <span>Map it.</span> Ship it.
        </h1>
        <p className="hero__sub">
          The mind-map app that turns ideas into plans. Brainstorm visually, track tasks with progress, and present your thinking, all in one place.
        </p>
        <div className="hero__cta">
          <button className="btn btn--primary btn--lg" onClick={onStart}>
            Start mapping free <ArrowRight size={17} />
          </button>
          <button className="btn btn--ghost btn--lg" onClick={onTour}>
            <Compass size={17} /> Take the 1-minute tour
          </button>
        </div>
        <div className="hero__shot">
          <img src={heroSrc} alt="Mind Mapper showing a sprint plan with tasks, progress rings and a Tasks panel" width="1440" height="813" />
        </div>
      </section>

      <section id="features" className="landing__section">
        <h2>Everything you need to go from idea to done</h2>
        <p className="landing__lead">Most mind-map tools stop at the brainstorm. Mind Mapper keeps going.</p>
        <div className="feature-grid">
          {FEATURES.map(([Icon, title, text]) => (
            <article key={title} className="feature">
              <span className="feature__icon">
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <ul className="more-chips" aria-label="Also included">
          {MORE.map((m) => (
            <li key={m}>
              <Check size={13} /> {m}
            </li>
          ))}
        </ul>
      </section>

      <section id="how" className="landing__section">
        <h2>How it works</h2>
        <ol className="steps">
          <li>
            <span>1</span>
            <h3>Capture</h3>
            <p>Start from a template, type, or paste your notes. Ideas lay themselves out.</p>
          </li>
          <li>
            <span>2</span>
            <h3>Organise</h3>
            <p>Drag, collapse, focus and search. Switch to the outline to restructure fast.</p>
          </li>
          <li>
            <span>3</span>
            <h3>Deliver</h3>
            <p>Track tasks to done, present to your team, and export to PDF or Markdown.</p>
          </li>
        </ol>
      </section>

      <section id="pricing" className="landing__section">
        <h2>Simple pricing</h2>
        <p className="landing__lead">Start free. Upgrade when you need more. Yearly billing saves {yearlySavingPct()}%.</p>
        <div className="plans plans--landing">
          <div className="plan">
            <h3>{PLANS.free.name}</h3>
            <p className="plan__tag">{PLANS.free.tagline}</p>
            <p className="plan__price">
              $0 <span>forever</span>
            </p>
            <button className="btn btn--ghost btn--block" onClick={onStart}>
              Start free
            </button>
          </div>
          <div className="plan plan--pro">
            <span className="plan__badge">Most popular</span>
            <h3>{PLANS.pro.name}</h3>
            <p className="plan__tag">{PLANS.pro.tagline}</p>
            <p className="plan__price">
              ${PLANS.pro.yearly / 12} <span>/ month, billed yearly (or ${PLANS.pro.monthly} monthly)</span>
            </p>
            <button className="btn btn--primary btn--block" onClick={onStart}>
              Try it now
            </button>
          </div>
        </div>
        <div className="compare-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">Free</th>
                <th scope="col">Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([f, a, b]) => (
                <tr key={f}>
                  <td>{f}</td>
                  <td>{cell(a)}</td>
                  <td>{cell(b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="landing__section">
        <h2>Questions</h2>
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing__final">
        <h2>Your next big idea deserves a map.</h2>
        <button className="btn btn--primary btn--lg" onClick={onStart}>
          Start mapping free <ArrowRight size={17} />
        </button>
      </section>

      <footer className="landing__footer">
        <span>
          Built by <a href="https://github.com/shivanjali24-03">Shivanjali Desai</a> · A portfolio project
        </span>
        <a href="https://github.com/shivanjali24-03/Mind-Mapper">Source on GitHub</a>
      </footer>
    </div>
  );
}
