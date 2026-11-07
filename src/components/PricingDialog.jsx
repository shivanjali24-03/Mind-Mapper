import { useState } from 'react';
import { Check, Minus, Sparkles, X } from 'lucide-react';
import { COMPARISON, PLANS, isPro, monthlyPrice, yearlySavingPct } from '../lib/plans.js';

const cell = (v) =>
  v === true ? <Check size={16} className="yes" aria-label="Included" /> : v === false ? <Minus size={16} className="no" aria-label="Not included" /> : v;

export default function PricingDialog({ plan, reason, onUpgrade, onDowngrade, onClose }) {
  const [billing, setBilling] = useState(plan.billing ?? 'yearly');
  const pro = isPro(plan);
  const price = monthlyPrice(billing);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog dialog--pricing"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="dialog__head">
          <h2 id="pricing-title">{pro ? 'Your plan' : 'Upgrade to Pro'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close" autoFocus>
            <X size={17} />
          </button>
        </div>
        {reason && !pro && (
          <p className="pricing__reason">
            <Sparkles size={15} /> {reason}
          </p>
        )}

        <div className="segmented pricing__billing" role="tablist" aria-label="Billing period">
          {['monthly', 'yearly'].map((b) => (
            <button key={b} role="tab" aria-selected={billing === b} className={billing === b ? 'is-on' : ''} onClick={() => setBilling(b)}>
              {b === 'monthly' ? 'Monthly' : `Yearly · save ${yearlySavingPct()}%`}
            </button>
          ))}
        </div>

        <div className="plans">
          <div className={`plan${!pro ? ' is-current' : ''}`}>
            <h3>{PLANS.free.name}</h3>
            <p className="plan__tag">{PLANS.free.tagline}</p>
            <p className="plan__price">
              $0 <span>forever</span>
            </p>
            {pro ? (
              <button className="btn btn--ghost btn--block" onClick={onDowngrade}>
                Switch to Free
              </button>
            ) : (
              <button className="btn btn--ghost btn--block" disabled>
                Current plan
              </button>
            )}
          </div>
          <div className={`plan plan--pro${pro ? ' is-current' : ''}`}>
            <span className="plan__badge">Most popular</span>
            <h3>{PLANS.pro.name}</h3>
            <p className="plan__tag">{PLANS.pro.tagline}</p>
            <p className="plan__price">
              ${price} <span>/ month{billing === 'yearly' ? `, $${PLANS.pro.yearly} billed yearly` : ''}</span>
            </p>
            {pro ? (
              <button className="btn btn--primary btn--block" disabled>
                <Check size={16} /> You are on Pro
              </button>
            ) : (
              <button className="btn btn--primary btn--block" onClick={() => onUpgrade(billing)}>
                <Sparkles size={16} /> Upgrade to Pro
              </button>
            )}
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

        <p className="pricing__demo">
          Demo checkout: upgrading only unlocks Pro in this browser. No payment is taken and no card details are collected.
        </p>
      </div>
    </div>
  );
}
