/*
  WIP. TODO: Merge changes back into DefinitelyTyped.
*/

// Type definitions for bootstrap-daterangepicker.js
// Project: https://github.com/dangrossman/bootstrap-daterangepicker
// Definitions by: Andrew Fong <https://github.com/fongandrew>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference path="../jquery/jquery.d.ts"/>
/// <reference path="../moment/moment.d.ts"/>

declare module BootstrapDaterangepicker {
  type DateType = Date|moment.Moment|string;

  interface Options {
    startDate?: DateType;
    endDate?: DateType;
    minDate?: DateType;
    maxDate?: DateType;
    dateLimit?: moment.MomentInput;
    showDropdowns?: boolean;
    showWeekNumbers?: boolean;
    timePicker?: boolean;
    timePickerIncrement?: number;
    timePicker24Hour?: boolean;
    timePickerSeconds?: boolean;
    ranges?: { [index: string]: [DateType, DateType] };
    opens?: string; // 'left', 'right', 'center'
    drops?: string; // 'down', 'up'
    buttonClasses?: string[];
    applyClass?: string;
    cancelClass?: string;
    locale?: {
      format?: string;
      separator?: string;
      applyLabel?: string;
      cancelLabel?: string;
      weekLabel?: string;
      customRangeLabel?: string;
      daysOfWeek?: [string, string, string, string, string, string, string];
      monthNames?: [string, string, string, string, string, string, string,
                    string, string, string, string, string];
      firstDay?: number;
    };
    singleDatePicker?: boolean;
    autoApply?: boolean;
    linkedCalendars?: boolean;
    parentEl?: string;
    isInvalidDate?: Function; // TODO
    autoUpdateInput?: boolean;
  }

  interface Picker {
    setStartDate(date: DateType): void;
    setEndDate(date: DateType): void;
    startDate: moment.Moment;
    endDate: moment.Moment;
  }

  interface Handler {
    (eventObject: JQueryEventObject, picker: Picker): any;
  }
}

interface JQuery {
  daterangepicker(options?: BootstrapDaterangepicker.Options): JQuery;
  data(key: 'daterangepicker'): BootstrapDaterangepicker.Picker;

  on(events: 'show.daterangepicker',
     handler: BootstrapDaterangepicker.Handler): JQuery;
  on(events: 'hide.daterangepicker',
     handler: BootstrapDaterangepicker.Handler): JQuery;
  on(events: 'showCalendar.daterangepicker',
     handler: BootstrapDaterangepicker.Handler): JQuery;
  on(events: 'hideCalendar.daterangepicker',
     handler: BootstrapDaterangepicker.Handler): JQuery;
  on(events: 'apply.daterangepicker',
     handler: BootstrapDaterangepicker.Handler): JQuery;
  on(events: 'cancel.daterangepicker',
     handler: BootstrapDaterangepicker.Handler): JQuery;
}
