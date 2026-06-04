import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ROUTES } from '@core/routing/routes';

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => navigate(ROUTES.public.landing);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto bg-surface">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
