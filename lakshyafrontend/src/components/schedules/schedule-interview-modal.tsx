import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useScheduleInterviewRound } from '../../hooks';
import type { Interview } from '../../services';

interface ScheduleInterviewModalProps {
  applicationId: string;
  jobId: string; // Used for future extensibility
  currentInterviews?: Interview[];
  candidateName: string;
  onClose: () => void;
}

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  applicationId,
  currentInterviews = [],
  candidateName,
  onClose,
}) => {
  const scheduleInterviewMutation = useScheduleInterviewRound();
  
  // Auto-compute next round number
  const nextRoundNumber = currentInterviews.length + 1;
  
  const [formData, setFormData] = useState({
    roundNumber: nextRoundNumber,
    date: '',
    time: '',
    timezone: 'IST',
    mode: 'online' as 'online' | 'onsite' | 'phone',
    linkOrLocation: '',
    messageToCandidate: '',
    internalNotes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date) {
      toast.error('Please select interview date');
      return;
    }

    try {
      await scheduleInterviewMutation.mutateAsync({
        applicationId,
        interviewData: formData,
      });
      
      toast.success(`Interview Round ${formData.roundNumber} scheduled successfully!`);
      onClose();
    } catch (error) {
      toast.error('Failed to schedule interview');
      console.error('Schedule interview error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h3 className="text-lg font-semibold text-white">Schedule Interview</h3>
            <p className="text-sm text-indigo-100 mt-0.5">
              {candidateName} - Round {formData.roundNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-indigo-100 transition-colors"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Round Number (display only, auto-computed) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Round
            </label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 font-medium">
              Round {formData.roundNumber}
              {currentInterviews.length > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  (Previous rounds: {currentInterviews.length})
                </span>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="IST">IST (Indian Standard Time)</option>
              <option value="UTC">UTC</option>
              <option value="EST">EST (Eastern Standard Time)</option>
              <option value="PST">PST (Pacific Standard Time)</option>
              <option value="GMT">GMT (Greenwich Mean Time)</option>
            </select>
          </div>

          {/* Interview Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['online', 'onsite', 'phone'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFormData({ ...formData, mode })}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                    formData.mode === mode
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {mode === 'online' && (
                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  {mode === 'onsite' && (
                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                  {mode === 'phone' && (
                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  )}
                  <div className="text-xs capitalize">{mode}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Link or Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.mode === 'online' ? 'Meeting Link' : formData.mode === 'onsite' ? 'Office Address' : 'Phone Number'}
            </label>
            <input
              type="text"
              value={formData.linkOrLocation}
              onChange={(e) => setFormData({ ...formData, linkOrLocation: e.target.value })}
              placeholder={
                formData.mode === 'online'
                  ? 'https://meet.google.com/xyz or Zoom link'
                  : formData.mode === 'onsite'
                  ? 'Office address or room number'
                  : 'Contact number for the interview'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Message to Candidate (Visible) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message to Candidate
              <span className="ml-2 text-xs text-gray-500">(Candidate will see this)</span>
            </label>
            <textarea
              value={formData.messageToCandidate}
              onChange={(e) => setFormData({ ...formData, messageToCandidate: e.target.value })}
              rows={3}
              placeholder="E.g., Please be ready with your portfolio. We'll discuss your React projects in detail."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Internal Notes (Recruiter Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes
              <span className="ml-2 text-xs text-amber-600 font-medium">(Recruiter-only, NOT visible to candidate)</span>
            </label>
            <textarea
              value={formData.internalNotes}
              onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
              rows={2}
              placeholder="Private notes for internal team use only..."
              className="w-full px-3 py-2 border border-amber-200 bg-amber-50 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={scheduleInterviewMutation.isPending}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduleInterviewMutation.isPending || !formData.date}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
            >
              {scheduleInterviewMutation.isPending ? 'Scheduling...' : `Schedule Round ${formData.roundNumber}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
