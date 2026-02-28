// /chat — redirects to /mail where AI chat lives
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ChatRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/mail'); }, []);
  return null;
}
