import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, glow = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] p-6',
        'border border-white/5 shadow-lg',
        'transition-all duration-200 ease-out',
        glow && 'shadow-[var(--color-accent-primary)]/20',
        onClick && 'cursor-pointer hover:border-[var(--color-accent-primary)]/30 hover:scale-[1.02]',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent-primary)]/20 flex items-center justify-center text-[var(--color-accent-primary)]">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
          {subtitle && <p className="text-sm text-[var(--color-text-secondary)]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Toggle({ checked, onChange, disabled = false, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-12 h-6 rounded-full transition-colors duration-200 overflow-hidden',
          checked ? 'bg-[var(--color-accent-primary)]' : 'bg-[var(--color-bg-secondary)]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={clsx(
            'absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200',
            checked ? 'right-1' : 'left-1'
          )}
        />
      </button>
      {label && <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>}
    </label>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-[var(--radius-md)] font-medium transition-all duration-200',
        'flex items-center justify-center gap-2',
        'hover:scale-[1.02] active:scale-[0.98]',
        {
          'bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary)]/90': variant === 'primary',
          'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-white/10 hover:bg-[var(--color-bg-card)]': variant === 'secondary',
          'bg-[var(--color-accent-danger)] text-white hover:bg-[var(--color-accent-danger)]/90': variant === 'danger',
          'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5': variant === 'ghost',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        props.disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[var(--color-text-secondary)]">{label}</label>}
      <input
        className={clsx(
          'w-full px-4 py-2.5 rounded-[var(--radius-md)]',
          'bg-[var(--color-bg-secondary)] border border-white/10',
          'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
          'focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)]',
          'transition-all duration-200',
          error && 'border-[var(--color-accent-danger)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[var(--color-accent-danger)]">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[var(--color-text-secondary)]">{label}</label>}
      <select
        className={clsx(
          'w-full px-4 py-2.5 rounded-[var(--radius-md)]',
          'bg-[var(--color-bg-secondary)] border border-white/10',
          'text-[var(--color-text-primary)]',
          'focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)]',
          'transition-all duration-200 cursor-pointer',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]': variant === 'default',
          'bg-[var(--color-accent-success)]/20 text-[var(--color-accent-success)]': variant === 'success',
          'bg-[var(--color-accent-warning)]/20 text-[var(--color-accent-warning)]': variant === 'warning',
          'bg-[var(--color-accent-danger)]/20 text-[var(--color-accent-danger)]': variant === 'danger',
        }
      )}
    >
      {children}
    </span>
  );
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function ProgressRing({ progress, size = 120, strokeWidth = 8, color = 'var(--color-accent-primary)' }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-bg-secondary)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-[var(--color-text-primary)]">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
