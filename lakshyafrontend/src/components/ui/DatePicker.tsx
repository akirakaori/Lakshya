import {
  DatePicker as AriaDatePicker,
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
} from 'react-aria-components';
import type { DateValue } from 'react-aria-components';

interface DatePickerProps {
  label?: string;
  value: DateValue | null | undefined;
  onChange: (date: DateValue | null) => void;
  minValue?: DateValue;
  isRequired?: boolean;
  className?: string;
}

export function DatePicker({ 
  label, 
  value, 
  onChange, 
  minValue,
  isRequired = false,
  className = ''
}: DatePickerProps) {
  return (
    <AriaDatePicker 
      value={value} 
      onChange={onChange}
      minValue={minValue}
      isRequired={isRequired}
      className={className}
    >
      {label && (
        <Label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Group className="app-input flex items-center px-3 py-2">
        <DateInput className="flex-1 flex items-center gap-1">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="rounded-sm px-0.5 text-sm tabular-nums caret-transparent outline-none placeholder:text-slate-500 focus:bg-indigo-600 focus:text-white dark:placeholder:text-slate-500"
            />
          )}
        </DateInput>
        <Button className="ml-2 rounded p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          <svg className="h-5 w-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </Button>
      </Group>
      <Popover className="z-50 mt-2 rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <Dialog className="p-4 outline-none">
          <Calendar>
            <header className="flex items-center justify-between mb-4">
              <Button 
                slot="previous"
                className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <Heading className="text-lg font-semibold text-slate-900 dark:text-slate-100" />
              <Button 
                slot="next"
                className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </header>
            <CalendarGrid className="border-collapse w-full">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="w-10 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={({ isSelected, isDisabled, isOutsideMonth }) =>
                      `w-10 h-10 text-sm rounded-lg outline-none cursor-pointer ${
                        isDisabled
                          ? 'text-slate-300 cursor-not-allowed dark:text-slate-700'
                          : isOutsideMonth
                          ? 'text-slate-400 hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-slate-800'
                          : isSelected
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-slate-900 hover:bg-indigo-100 dark:text-slate-100 dark:hover:bg-indigo-500/20'
                      }`
                    }
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}
