// Floating purple chat bubble fixed to bottom right — opens the AI chat on /mail
import { useRouter } from 'next/router';
import { MessageSquare } from 'lucide-react';

export default function FloatingChat() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/mail')}
      aria-label="Open AI chat"
      className="fixed bottom-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#6B4EFF] shadow-lg hover:bg-[#5A3FE0] transition-colors"
      style={{ right: 96 }}
    >
      <MessageSquare size={24} className="text-white" strokeWidth={2} />
    </button>
  );
}
