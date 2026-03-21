import React from 'react';
import { toast } from 'react-toastify';
import { useScheduleInterviewRound, useUpdateInterviewRound } from '../../hooks';
import type { Interview } from '../../services';
import { today, type DateValue, parseDate } from '@internationalized/date';
import type { TimeValue } from 'react-aria-components';
import { Time } from '@internationalized/date';
import { DatePicker } from '../ui/DatePicker';
import { TimeField, formatTimeToString } from '../ui/TimeField';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { getInterviewEndTime, getInterviewStartTime } from '../../utils/interview-status';

interface ScheduleInterviewModalProps {
  applicationId: string;
  jobId: string; // Used for future extensibility
  currentInterviews?: Interview[];
  candidateName: string;
  onClose: () => void;
  interviewToEdit?: Interview; // For edit mode
  isEditMode?: boolean; // Indicates if we're editing
}

type ScheduleInterviewFormData = {
  roundNumber: number;
  date: DateValue | null;
  startTime: TimeValue | null;
  endTime: TimeValue | null;
  timezone: string;
  mode: 'online' | 'onsite' | 'phone';
  linkOrLocation: string;
  messageToCandidate: string;
  internalNotes: string;
};

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  applicationId,
  currentInterviews = [],
  candidateName,
  onClose,
  interviewToEdit,
  isEditMode = false,
}) => {
  const scheduleInterviewMutation = useScheduleInterviewRound();
  const updateInterviewMutation = useUpdateInterviewRound();
  
  // Auto-compute next round number
  const nextRoundNumber = currentInterviews.length + 1;

  // Parse existing interview data for edit mode
  const getDefaultValues = (): ScheduleInterviewFormData => {
    if (isEditMode && interviewToEdit) {
      // Parse date string to DateValue
      let parsedDate: DateValue | null = null;
      if (interviewToEdit.date) {
        try {
          parsedDate = parseDate(interviewToEdit.date.split('T')[0]);
        } catch (e) {
          console.error('Failed to parse date:', e);
        }
      }

      const interviewStartTime = getInterviewStartTime(interviewToEdit);
      const interviewEndTime = getInterviewEndTime(interviewToEdit);

      // Parse start time string (HH:mm) to TimeValue
      let parsedStartTime: TimeValue | null = null;
      if (interviewStartTime) {
        try {
          const [hours, minutes] = interviewStartTime.split(':').map(Number);
          parsedStartTime = new Time(hours, minutes);
        } catch (e) {
          console.error('Failed to parse interview start time:', e);
        }
      }

      // Parse end time string (HH:mm) to TimeValue
      let parsedEndTime: TimeValue | null = null;
      if (interviewEndTime) {
        try {
          const [hours, minutes] = interviewEndTime.split(':').map(Number);
          parsedEndTime = new Time(hours, minutes);
        } catch (e) {
          console.error('Failed to parse interview end time:', e);
        }
      }

      return {
        roundNumber: interviewToEdit.roundNumber,
        date: parsedDate,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        timezone: interviewToEdit.timezone || 'IST',
        mode: interviewToEdit.mode || 'online',
        linkOrLocation: interviewToEdit.linkOrLocation || '',
        messageToCandidate: interviewToEdit.messageToCandidate || '',
        internalNotes: interviewToEdit.internalNotes || '',
      };
    }

    // Default values for new interview
    return {
      roundNumber: nextRoundNumber,
      date: null,
      startTime: null,
      endTime: null,
      timezone: 'IST',
      mode: 'online',
      linkOrLocation: '',
      messageToCandidate: '',
      internalNotes: '',
    };
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    getValues,
  } = useForm<ScheduleInterviewFormData>({
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  const roundNumberValue = useWatch({ control, name: 'roundNumber' });
  const modeValue = useWatch({ control, name: 'mode' });
  const interviewDate = useWatch({ control, name: 'date' });
  const interviewStartTime = useWatch({ control, name: 'startTime' });
  const interviewEndTime = useWatch({ control, name: 'endTime' });

  const onSubmit = async (data: ScheduleInterviewFormData) => {
    if (!data.date) {
      toast.error('Please select interview date');
      return;
    }

    if (!data.startTime) {
      toast.error('Please select interview start time');
      return;
    }

    if (!data.endTime) {
      toast.error('Please select interview end time');
      return;
    }

    // Convert CalendarDate to YYYY-MM-DD string
    const dateString = `${data.date.year}-${String(data.date.month).padStart(2, '0')}-${String(data.date.day).padStart(2, '0')}`;
    
    // Convert TimeValue to HH:mm string (24-hour format for backend)
    const startTimeString = formatTimeToString(data.startTime);
    const endTimeString = formatTimeToString(data.endTime);

    if (endTimeString <= startTimeString) {
      toast.error('End time must be later than start time');
      return;
    }

    const interviewData = {
      roundNumber: data.roundNumber,
      date: dateString,
      startTime: startTimeString,
      endTime: endTimeString,
      timezone: data.timezone,
      mode: data.mode,
      linkOrLocation: data.linkOrLocation,
      messageToCandidate: data.messageToCandidate,
      internalNotes: data.internalNotes,
    };

    try {
      if (isEditMode && interviewToEdit?._id) {
        // Update existing interview
        await updateInterviewMutation.mutateAsync({
          applicationId,
          interviewId: interviewToEdit._id,
          interviewData,
        });
        toast.success(`Interview Round ${data.roundNumber} updated successfully!`);
      } else {
        // Schedule new interview
        await scheduleInterviewMutation.mutateAsync({
          applicationId,
          interviewData,
        });
        toast.success(`Interview Round ${data.roundNumber} scheduled successfully!`);
      }
      
      onClose();
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update interview' : 'Failed to schedule interview');
      console.error('Interview operation error:', error);
    }
  };

  return (
    <div className="app-modal-overlay">
      <div className="app-modal-panel max-h-[90vh] max-w-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {isEditMode ? 'Edit Interview' : 'Schedule Interview'}
            </h3>
            <p className="text-sm text-indigo-100 mt-0.5">
              {candidateName} - Round {roundNumberValue}
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Round Number (display only, auto-computed or from edit) */}
          <div>
            <label className="mb-1 block text-sm font-medium app-label">
              Interview Round
            </label>
            <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Round {roundNumberValue}
              {isEditMode ? (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-300">
                  (Editing existing round)
                </span>
              ) : currentInterviews.length > 0 ? (
                <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">
                  (Previous rounds: {currentInterviews.length})
                </span>
              ) : null}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Controller
                name="date"
                control={control}
                rules={{ required: 'Date is required' }}
                render={({ field }) => (
                  <DatePicker
                    label="Date"
                    value={field.value}
                    onChange={field.onChange}
                    minValue={today('UTC')}
                    isRequired={true}
                  />
                )}
              />
              {errors.date && (
                <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
              )}
            </div>
            <div>
              <Controller
                name="startTime"
                control={control}
                rules={{ required: 'Start time is required' }}
                render={({ field }) => (
                  <TimeField
                    label="Start Time"
                    value={field.value}
                    onChange={field.onChange}
                    isRequired={true}
                    hourCycle={12}
                  />
                )}
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 mt-1">{errors.startTime.message}</p>
              )}
            </div>
            <div>
              <Controller
                name="endTime"
                control={control}
                rules={{
                  required: 'End time is required',
                  validate: (value) => {
                    if (!value) return 'End time is required';
                    const startTime = getValues('startTime');
                    if (!startTime) return true;
                    const start = formatTimeToString(startTime);
                    const end = formatTimeToString(value);
                    return end > start || 'End time must be later than start time';
                  },
                }}
                render={({ field }) => (
                  <TimeField
                    label="End Time"
                    value={field.value}
                    onChange={field.onChange}
                    isRequired={true}
                    hourCycle={12}
                  />
                )}
              />
              {errors.endTime && (
                <p className="text-sm text-red-600 mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="mb-1 block text-sm font-medium app-label">
              Timezone
            </label>
            <select
              {...register('timezone')}
              className="app-select"
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
            <label className="mb-2 block text-sm font-medium app-label">
              Interview Mode <span className="text-red-500">*</span>
            </label>
            <Controller
              name="mode"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-3">
                  {(['online', 'onsite', 'phone'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => field.onChange(mode)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                        field.value === mode
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                          : 'border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500'
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
              )}
            />
          </div>

          {/* Link or Location */}
          <div>
            <label className="mb-1 block text-sm font-medium app-label">
              {modeValue === 'online' ? 'Meeting Link' : modeValue === 'onsite' ? 'Office Address' : 'Phone Number'}
            </label>
            <input
              type="text"
              {...register('linkOrLocation')}
              placeholder={
                modeValue === 'online'
                  ? 'https://meet.google.com/xyz or Zoom link'
                  : modeValue === 'onsite'
                  ? 'Office address or room number'
                  : 'Contact number for the interview'
              }
              className="app-input"
            />
          </div>

          {/* Message to Candidate (Visible) */}
          <div>
            <label className="mb-1 block text-sm font-medium app-label">
              Message to Candidate
              <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">(Candidate will see this)</span>
            </label>
            <textarea
              {...register('messageToCandidate')}
              rows={3}
              placeholder="E.g., Please be ready with your portfolio. We'll discuss your React projects in detail."
              className="app-input resize-none"
            />
          </div>

          {/* Internal Notes (Recruiter Only) */}
          <div>
            <label className="mb-1 block text-sm font-medium app-label">
              Internal Notes
              <span className="ml-2 text-xs text-amber-600 font-medium">(Recruiter-only, NOT visible to candidate)</span>
            </label>
            <textarea
              {...register('internalNotes')}
              rows={2}
              placeholder="Private notes for internal team use only..."
              className="w-full resize-none rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isEditMode ? updateInterviewMutation.isPending : scheduleInterviewMutation.isPending}
              className="app-secondary-button flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(isEditMode ? updateInterviewMutation.isPending : scheduleInterviewMutation.isPending) || !interviewDate || !interviewStartTime || !interviewEndTime || !isValid}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isEditMode 
                ? (updateInterviewMutation.isPending ? 'Updating...' : `Update Round ${roundNumberValue}`)
                : (scheduleInterviewMutation.isPending ? 'Scheduling...' : `Schedule Round ${roundNumberValue}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;

