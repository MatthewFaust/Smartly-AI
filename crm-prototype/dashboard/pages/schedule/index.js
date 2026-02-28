// Schedule page — monthly calendar grid placeholder
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function calendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const days = Array(first).fill(null);
  for (let d = 1; d <= total; d++) days.push(d);
  return days;
}

export default function SchedulePage() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const days = calendarDays(year, month);
  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <div className="w-56 flex-shrink-0 bg-[#F0EEF8] h-full p-5">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-3">Schedule</h2>
        <p className="text-sm text-gray-400">No events scheduled</p>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white px-10 py-8 overflow-y-auto">
        {/* Month navigation */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={prev} className="p-1.5 hover:bg-[#F0EEF8] rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <h2 className="text-xl font-bold text-[#1A1A2E] min-w-[200px]">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={next} className="p-1.5 hover:bg-[#F0EEF8] rounded-xl transition-colors">
            <ChevronRight size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => (
            <div
              key={i}
              className={`aspect-square flex items-center justify-center rounded-2xl text-sm select-none ${
                !day ? '' :
                day === todayDay
                  ? 'bg-[#6B4EFF] text-white font-semibold'
                  : 'text-[#1A1A2E] hover:bg-[#F0EEF8] cursor-pointer transition-colors'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
