import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  small?: boolean;
}

export function Button({ variant = 'subtle', small = false, className = '', children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={`btn btn-${variant} ${small ? 'btn-sm' : ''} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warn' | 'good' }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function MatchRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${score}% match`}
      className="match-ring"
    >
      <circle cx="50" cy="50" r={r} className="ring-track" />
      <circle
        cx="50"
        cy="50"
        r={r}
        className="ring-value"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="55" textAnchor="middle" className="ring-text">
        {score}
      </text>
    </svg>
  );
}

export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {hint !== undefined && <p className="empty-hint">{hint}</p>}
      {action !== undefined && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function PageHead({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children !== undefined && <p className="page-sub">{children}</p>}
      </div>
      {actions !== undefined && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Metric({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="metric">
      <div className="metric-head">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <strong className="metric-value">{value}</strong>
      {hint !== undefined && <small className="metric-hint">{hint}</small>}
    </div>
  );
}
