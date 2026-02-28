// Global layout wrapper — adds right nav and floating chat to every page
import { useRouter } from 'next/router';
import RightNav from './RightNav';
import FloatingChat from './FloatingChat';

// Pages where the floating chat bubble should be hidden
const HIDE_CHAT_BUBBLE = ['/mail', '/chat'];

export default function Layout({ children }) {
  const router = useRouter();
  const hideBubble = HIDE_CHAT_BUBBLE.some(
    p => router.pathname === p || router.pathname.startsWith(p + '/')
  );

  return (
    // pr-20 reserves space for the 80px fixed right nav
    <div className="min-h-screen bg-white" style={{ paddingRight: 80 }}>
      {children}
      <RightNav />
      {!hideBubble && <FloatingChat />}
    </div>
  );
}
