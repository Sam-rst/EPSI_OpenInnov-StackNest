import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { LogoMark } from '@core/ui';
import { ROUTES } from '@core/routing/routes';
import { OAuthButtons } from '../components/OAuthButtons';
import { Divider } from '../components/Divider';
import { LoginForm } from '../components/LoginForm';
import { LoginVisual } from '../components/LoginVisual';

export function LoginPage() {
  const navigate = useNavigate();
  const handleLogin = () => navigate(ROUTES.app.catalog);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      <div className="flex items-center justify-center p-8 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          <Link to={ROUTES.public.landing} className="inline-flex items-center gap-2.5 mb-12 hover:opacity-80 transition">
            <LogoMark size={32} />
            <span className="font-bold tracking-tight text-[19px] text-text-primary">StackNest</span>
          </Link>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] leading-tight text-text-primary">
            Connexion à ton compte
          </h1>
          <p className="mt-2 text-[14px] text-text-secondary">Bon retour. Reprends là où tu t'étais arrêté.</p>

          <div className="mt-8">
            <OAuthButtons />
          </div>
          <div className="my-7">
            <Divider label="ou par email" />
          </div>
          <LoginForm onSubmit={handleLogin} />

          <p className="mt-8 text-center text-[13px] text-text-secondary">
            Pas encore de compte&nbsp;? <a href="#" className="font-medium text-cyan">Créer un compte</a>
          </p>
        </motion.div>
      </div>
      <LoginVisual />
    </div>
  );
}
