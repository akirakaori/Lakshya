import {
  TimeField as AriaTimeField,
  DateInput,
  DateSegment,
  Label,
} from 'react-aria-components';
import type { TimeValue } from 'react-aria-components';

interface TimeFieldProps {
  label?: string;
  value: TimeValue | null | undefined;
  onChange: (time: TimeValue | null) => void;
  isRequired?: boolean;
  hourCycle?: 12 | 24;
  className?: string;
}

export function TimeField({ 
  label, 
  value, 
  onChange, 
  isRequired = false,
  hourCycle = 24,
  className = ''
}: TimeFieldProps) {
  return (
    <AriaTimeField 
      value={value} 
      onChange={onChange}
      isRequired={isRequired}
      hourCycle={hourCycle}
      className={className}
    >
      {label && (
        <Label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
      )}
      <DateInput className="app-input flex items-center gap-1 px-3 py-2">
        {(segment) => (
          <DateSegment
            segment={segment}
            className="rounded-sm px-0.5 text-sm tabular-nums caret-transparent outline-none placeholder:text-slate-500 focus:bg-indigo-600 focus:text-white dark:placeholder:text-slate-500"
          />
        )}
      </DateInput>
    </AriaTimeField>
  );
}

// Helper function to format TimeValue to HH:mm string
export function formatTimeToString(time: TimeValue | null): string {
  if (!time) return '';
  
  const hours = String(time.hour).padStart(2, '0');
  const minutes = String(time.minute).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}
