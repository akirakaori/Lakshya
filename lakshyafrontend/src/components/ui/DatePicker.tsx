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
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Group className="flex items-center w-full px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white">
        <DateInput className="flex-1 flex items-center gap-1">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="px-0.5 tabular-nums outline-none rounded-sm focus:bg-indigo-600 focus:text-white caret-transparent placeholder:text-gray-500 text-sm"
            />
          )}
        </DateInput>
        <Button className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </Button>
      </Group>
      <Popover className="bg-white rounded-lg shadow-xl border border-gray-200 mt-2 z-50">
        <Dialog className="p-4 outline-none">
          <Calendar>
            <header className="flex items-center justify-between mb-4">
              <Button 
                slot="previous"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <Heading className="text-lg font-semibold text-gray-900" />
              <Button 
                slot="next"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </header>
            <CalendarGrid className="border-collapse w-full">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="text-xs font-semibold text-gray-500 pb-2 w-10">
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
                          ? 'text-gray-300 cursor-not-allowed'
                          : isOutsideMonth
                          ? 'text-gray-400 hover:bg-gray-100'
                          : isSelected
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-gray-900 hover:bg-indigo-100'
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
