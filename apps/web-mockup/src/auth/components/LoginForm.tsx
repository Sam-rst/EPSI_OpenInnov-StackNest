import { useState, type FormEvent } from 'react';
import { Icon } from '@core/ui';

interface LoginFormProps {
  onSubmit: () => void;
}

const inputClass =
  'w-full h-11 px-3.5 rounded-md border border-border bg-surface-elevated text-[13.5px] text-text-primary focus:border-cyan focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklch,var(--brand-cyan)_30%,transparent)]';

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('yassine.zouitni@stacknest.dev');
  const [password, setPassword] = useState('••••••••••');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => onSubmit(), 700);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="auth-email" className="block text-[12px] font-medium mb-1.5 text-text-secondary">Email</label>
        <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="auth-password" className="text-[12px] font-medium text-text-secondary">Mot de passe</label>
          <a href="#" className="text-[12px] font-medium text-cyan">Mot de passe oublié&nbsp;?</a>
        </div>
        <input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </div>
      <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
        <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border accent-cyan" />
        Garder ma session active
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-md bg-sun text-[#3a2a00] text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 hover:brightness-105 disabled:opacity-70 transition shadow-[0_4px_12px_-4px_rgba(254,162,31,0.5)]"
      >
        {loading ? <Icon name="loader-circle" size={14} className="animate-spin" /> : <Icon name="arrow-right" size={14} />}
        {loading ? 'Connexion en cours…' : 'Se connecter'}
      </button>
    </form>
  );
}
