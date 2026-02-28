// Card component for a pending follow-up draft in the approvals queue
import api from '@/lib/api';

export default function FollowUpCard({ followUp, onUpdate }) {
  const leadName = followUp.leads?.name || 'Unknown Lead';

  async function handleAction(status) {
    try {
      await api.patch(`/followups/${followUp.id}`, { status });
      onUpdate(followUp.id, status);
    } catch (err) {
      console.error('FollowUpCard: failed to update status:', err.message);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-gray-900">{leadName}</span>
          <span className="ml-2 text-xs text-gray-400 capitalize">via {followUp.channel}</span>
        </div>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
          Pending
        </span>
      </div>

      {/* Draft message */}
      <p className="text-sm text-gray-700 leading-relaxed border-l-2 border-purple-300 pl-3">
        {followUp.draft_content}
      </p>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => handleAction('approved')}
          className="px-4 py-1.5 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => handleAction('rejected')}
          className="px-4 py-1.5 text-sm font-medium bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
