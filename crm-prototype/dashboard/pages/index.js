// Root — redirects to /dashboard if logged in, otherwise /login
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    router.replace(user ? '/dashboard' : '/login');
  }, []);

  return null;
}
