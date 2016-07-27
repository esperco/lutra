/*
  Common, re-usable types not found in ApiT.ts
*/

/// <referene path="./ApiT.ts" />
/// <referene path="./Option.ts" />

module Esper.Types {

  // Mix into other interfaces for indicating simplified data status
  export interface HasStatus {
    isBusy: boolean;
    hasError: boolean;
  }


  /* Event Types */ //////////////////////////

  /*
    Similar to ApiT.GenericCalendarEvent but with some teamId and different
    representation of labels, camelCase, and removal of fields we don't care
    about at the moment
  */
  export interface TeamEvent {
    id: string;
    calendarId: string;
    teamId: string;
    start: Date;
    end: Date;
    timezone: string;
    title: string;
    description: string;

    labelScores: Option.T<Labels.Label[]>;

    feedback: ApiT.EventFeedback;
    location: string;
    allDay: boolean;
    guests: ApiT.Attendee[];
    transparent: boolean;
    recurringEventId?: string;
  }

  // Identifies an event on a team alendar
  export interface FullEventId {
    teamId: string;
    calId: string;
    eventId: string;
  }

  // Identifies a date on a team calendar
  export interface FullCalDateId {
    teamId: string;
    calId: string;
    date: Date;  // Start of date
  }

  /*
    Convenience interface for grouping together merged event list for multiple
    days
  */
  export interface EventListData extends HasStatus {
    start: Date;
    end: Date;
    events: TeamEvent[];
  }

  /*
    Convenience interface for grouping together events still separated by
    date
  */
  export interface EventsForDate {
    date: Date;
    events: TeamEvent[];
  };

  export interface EventDateData {
    dates: EventsForDate[];
    isBusy: boolean;
    hasError: boolean;
  }


  /* Filtering, selection */ //////////////////////////

  // Filter events by some attribute in a list
  export interface ListSelectJSON {
    // Show all items
    all: boolean;

    // Show items with no label, domain, etc.
    none: boolean;

    // Show items with at least one of the items in this list
    some: string[];
  }

  /*
    Interface for representing business hours -- considered using a 7-item
    array but this introduces the possibility of errors based on what the
    "start" of the week is.

    Use Option.none to represent that there should be no hours on a given day.
  */
  export interface WeekHours {
    sun: Option.T<DayHours>;
    mon: Option.T<DayHours>;
    tue: Option.T<DayHours>;
    wed: Option.T<DayHours>;
    thu: Option.T<DayHours>;
    fri: Option.T<DayHours>;
    sat: Option.T<DayHours>;
  }

  export type DayAbbr = "sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat";

  /*
    i.e. 11:00 to 17:00 -- end should be > start. Hour is in HourMinute is
    usually 0-23, but use 24:00 instead of 23:59 if you actually want to
    capture going to end of day.
  */
  export interface DayHours {
    start: ApiT.HourMinute;
    end: ApiT.HourMinute;
  }


  /* Event Calcs */ ///////////////////////

  /*
    Wrapper around event with relative weight for an event as well as how we
    should categorize or group this event
  */
  export interface Annotation {
    event: Stores.Events.TeamEvent;

    /*
      Interface itself has no implied unit -- this can be seconds or people-
      hours or anything other value we want to assign to an event. Up to
      code using this interface to determine
    */
    value: number;

    // Heirarchical list of tags to group this event by
    groups: string[];
  }

  export interface IdMap {
    [index: string]: boolean;
  }

  /*
    Heirarchal maps of grouping strings to annotations
  */
  export interface EventGroup {
    annotations: Annotation[];
    totalValue: number;   // Sum of all annotation values
    totalUnique: number;  // Total unique events
    eventMap: IdMap;      /* Map used to quickly test whether event exists
                             in group */
  }

  /*
    Collection of annotated events for a given date
  */
  export interface EventDateGroup extends EventGroup {
    date: Date;
  }

  export interface EventSubgroup extends EventGroup {
    subgroups: EventGrouping;
  }

  export interface EventGrouping {
    [index: string]: EventSubgroup;
  }

  export interface EventOptGrouping extends EventGroup {
    some: EventGrouping;
    none: EventGroup;
  }

  export interface EventCalcOpts { // Standard calc opts for all charts
    filterStr: string;
    labels: ListSelectJSON;
    domains: ListSelectJSON;
    durations: ListSelectJSON;
    guestCounts: ListSelectJSON;
    ratings: ListSelectJSON;
    weekHours: WeekHours;
  }

  export interface DomainNestOpts extends EventCalcOpts {
    nestByDomain: boolean; // Used to nest domain => email in duration calc
  }


  /* Charting */ //////////////////////////

  export type ChartType = "percent"|"absolute"|"calendar";
  export type ChartGroup = "calendars"
                          |"durations"
                          |"guests"
                          |"guest-counts"
                          |"labels"
                          |"ratings";

  // Base options needed to fetch and get events
  export interface ChartBaseOpts<T> {
    teamId: string;
    calIds: string[];
    period: Period.Single|Period.Custom;
    extra: ChartExtraOpts & T;
  }

  export interface ChartExtraOptsMaybe {
    type?: ChartType;
    incUnscheduled?: boolean;
    incrs?: number[];
    filterStr?: string;
    domains?: ListSelectJSON;
    durations?: ListSelectJSON;
    labels?: ListSelectJSON;
    ratings?: ListSelectJSON;
    guestCounts?: ListSelectJSON;
    weekHours?: WeekHours;
  }

  export interface ChartExtraOpts extends ChartExtraOptsMaybe, EventCalcOpts {
    type: ChartType;
    incUnscheduled: boolean;
    incrs: number[];
    filterStr: string;
    domains: ListSelectJSON;
    durations: ListSelectJSON;
    labels: ListSelectJSON;
    ratings: ListSelectJSON;
    guestCounts: ListSelectJSON;
    weekHours: WeekHours;
  }

  // Data tied to a particular period of time
  export interface PeriodData<T> {
    period: Period.Single|Period.Custom;
    current: boolean; // Is this the "current" or active group?
    total: number; // Optional total for period (for unscheduled time)
    data: T;
  }
  export type PeriodOptGroup = PeriodData<EventOptGrouping>;
  export type PeriodGrouping = PeriodData<EventGrouping>;
}
