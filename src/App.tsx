import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

/* 라우터 라이브러리 없이 인증 상태 + 화면 상태로만 전환한다. */
export default function App() {
  const { user } = useAuth();
  const [view, setView] = useState<'login' | 'signup'>('login');

  if (user) return <Home />;
  return view === 'login' ? (
    <Login onGoSignup={() => setView('signup')} />
  ) : (
    <Signup onGoLogin={() => setView('login')} />
  );
}
