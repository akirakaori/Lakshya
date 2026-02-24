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
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
      )}
      <DateInput className="flex items-center gap-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white">
        {(segment) => (
          <DateSegment
            segment={segment}
            className="px-0.5 tabular-nums outline-none rounded-sm focus:bg-indigo-600 focus:text-white caret-transparent placeholder:text-gray-500 text-sm"
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
