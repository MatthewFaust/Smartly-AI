// Login page — select a test agent account, no password needed for prototype
import { useRouter } from 'next/router';

const TEST_USERS = [
  { id: 'agent-001', name: 'Brady Singh',  email: 'brady@realty.com',  role: 'Agent' },
  { id: 'agent-002', name: 'Sarah Chen',   email: 'sarah@realty.com',  role: 'Agent' },
];

export default function LoginPage() {
  const router = useRouter();

  function login(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#F0EEF8] flex items-center justify-center" style={{ paddingRight: 0 }}>
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-sm text-center">
        {/* Logo mark */}
        <div className="w-14 h-14 bg-[#6B4EFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">R</span>
        </div>

        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-1">RealEstate AI</h1>
        <p className="text-sm text-gray-400 mb-8">AI-powered CRM for real estate agents</p>

        <div className="space-y-3">
          {TEST_USERS.map(user => (
            <button
              key={user.id}
              onClick={() => login(user)}
              className="w-full py-3 px-4 bg-[#6B4EFF] text-white rounded-2xl font-medium hover:bg-[#5A3FE0] transition-colors"
            >
              Login as {user.name}
            </button>
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-300">Prototype — test accounts only</p>
      </div>
    </div>
  );
}
