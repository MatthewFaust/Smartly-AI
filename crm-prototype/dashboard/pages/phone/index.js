// Phone page — placeholder, Twilio integration coming in production
export default function PhonePage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-56 flex-shrink-0 bg-[#F0EEF8] h-full p-5">
        <h2 className="text-base font-bold text-[#1A1A2E]">Phone</h2>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white flex-col gap-3">
        <div className="w-16 h-16 bg-[#EEEAF6] rounded-full flex items-center justify-center">
          <span className="text-3xl">📞</span>
        </div>
        <h1 className="text-xl font-bold text-[#1A1A2E]">Phone</h1>
        <p className="text-sm text-gray-400">Twilio call integration coming soon</p>
      </div>
    </div>
  );
}
