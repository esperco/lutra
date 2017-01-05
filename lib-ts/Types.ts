/*
  Common, re-usable types not found in ApiT.ts
*/

/// <referene path="./ApiT.ts" />
/// <referene path="./Option.ts" />

module Esper.Types {

  // List of hints
  export type Hints =
    'SeeMoreLinkHint'|'FilterMenuHint'|'PeriodSelectorHint';

  // Trinary state
  export type Fuzzy = boolean|"some";

  // Mix into other interfaces for indicating simplified data status
  export interface HasStatus {
    isBusy: boolean;
    hasError: boolean;
  }


  /* Periods */ ///////////

  export type Interval = 'day'|'week'|'month'|'quarter';
  export interface Period {
    interval: Interval;
    start: number;
    end: number;
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

    labels: Option.T<Label[]>;
    confirmed: boolean;
    attendScore: number;

    feedback: ApiT.EventFeedback;
    location: string;
    allDay: boolean;
    guests: ApiT.Attendee[];
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

  export type Range = [Date, Date];

  /*
    Convenience interface for grouping together merged event list for multiple
    sets of days
  */
  export interface EventsForRange {
    range: Range;
    events: TeamEvent[];
  }

  // Multiple ranges with store status
  export interface EventsForRangesData extends HasStatus {
    eventsForRanges: EventsForRange[];
  }


  /* Filtering, selection */ //////////////////////////

  export interface FilterFn {
    (e: Types.TeamEvent): boolean;
  }

  // Filter events by some attribute in a list
  export interface ListSelectJSON {
    // Show items with any label, domain, etc.
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

  export interface EventWeights {
    weights: Types.Weight[];
    totalValue: number;
    totalUnique: number;

    // For quick lookup purposes
    eventMap: { [index: string]: Types.TeamEvent };

    // For enumeration purposes (can't use Weight because may be more than
    // one weight per event)
    events: TeamEvent[];
  }

  export interface RangeValue extends EventWeights {
    range: Range;
  }

  export interface RangeSeries extends EventWeights {
    values: RangeValue[];
  }

  export interface RangesGrouping {
    [key: string]: RangeSeries;
  }

  export interface RangesGroup {
    some: RangesGrouping;
    none: RangeSeries;
    all: RangeSeries;
  }

  // Events for range with an index position
  export interface RangesState {
    eventsForRanges: Types.EventsForRange[];

    // Index of position in eventsForRanges Array
    rangeIndex: number;

    // Index of next event to process for current eventRange
    eventIndex: number;
  }

  // Intermediate state for translating data from RangeState into RangeGroup
  export interface GroupState extends RangesState
  {
    group: RangesGroup; // Accumulator
  }

  export interface CounterState extends RangesState {
    eventMap: { [index: string]: TeamEvent };
    events: TeamEvent[];
    total: number;
  }

  export interface AnnotationState extends RangesState {
    values: [TeamEvent, number][];
  }

  /*
    Wrapper around event with relative weight for an event as well as how we
    should categorize or group this event.
  */
  export interface Weight {
    event: TeamEvent;

    /*
      Interface itself has no implied unit -- this can be seconds or people-
      hours or anything other value we want to assign to an event. Up to
      code using this interface to determine
    */
    value: number;

    // Actual tag corresponding to value
    group: string|void;
  }


  /* Charting */ //////////////////////////

  export type ChartType = (
    "percent"
    |"absolute"
    |"percent-series"
    |"absolute-series"
  );

  // Base params passed via querystring, needed to fetch and get events
  export interface ChartParams {
    teamId: string;
    period: Period;
    extra: ChartExtra;
  }

  // Extra filter options -- maybe is the optional variant of ChartExtras
  export interface ChartExtraOpt {
    type?: ChartType;
    incUnscheduled?: boolean;
    filterStr?: string;
    calIds?: string[];
    domains?: ListSelectJSON;
    guests?: ListSelectJSON;
    durations?: ListSelectJSON;
    labels?: ListSelectJSON;
    ratings?: ListSelectJSON;
    guestCounts?: ListSelectJSON;
    weekHours?: WeekHours;
  }

  export interface ChartExtra extends ChartExtraOpt {
    type: ChartType;
    incUnscheduled: boolean;
    filterStr: string;
    calIds: string[];
    domains: ListSelectJSON;
    guests: ListSelectJSON;
    durations: ListSelectJSON;
    labels: ListSelectJSON;
    ratings: ListSelectJSON;
    guestCounts: ListSelectJSON;
    weekHours: WeekHours;
  }


  /*
    A set of functions and attributes used to describe something we're grouping
    events by (e.g. labels or guests or duration, etc.). For now, assume that
    we're always grouping by some set of strings (keys).
  */
  export interface GroupBy {
    // Textual description of what this is
    name: string;

    // Icon to represent this group
    icon?: string;

    /*
      Get applicable keys from event -- returns an option because we may want
      to display the empty key as Option.some([]) vs. Option.none (which means
      don't display this key at all)
    */
    keyFn: (event: TeamEvent, props: ChartProps) => Option.T<string[]>;

    // Given a sorted list of keys, output a list of colors
    colorMapFn?: (keys: string[], props: ChartProps) => string[];

    // Display name for key
    displayFn?: (key: string, props: ChartProps) => string;

    /*
      Pre-sorted keys (if we want them to display in a particular order).
      Otherwise defaults to max to min for charts and alphabetical for
      selector.
    */
    selectorKeysFn?: (group: RangesGroup, props: ChartProps) => string[];
    chartKeysFn?: (group: RangesGroup, props: ChartProps) => string[];

    // Selector text for all of the above / none of the above options
    allText?: string;
    noneText?: string;

    // Selector text for display all / hide all options
    showAllText?: string;
    hideNoneText?: string;

    // Functions for selector update
    getListSelectJSONFn: (extra: ChartExtra) => Types.ListSelectJSON;
    updateExtraFn:
      (x: Types.ListSelectJSON, props: ChartProps) => ChartExtraOpt;

    // Content to show if no keys for selector
    selectorNoDataFn?: (props: ChartProps) => string|JSX.Element|JSX.Element[];
  }

   // Complete set of data we need to render a single chart
  export interface ChartProps extends EventsForRangesData {
    period: Period;
    team: ApiT.Team;
    calendars: ApiT.GenericCalendar[];
    groupBy: GroupBy;
    extra: ChartExtra;
    simplified?: boolean;
  }


  /* Labels */

  export interface Label {
    id: string;        // Normalized form
    displayAs: string; // Display form
    color: string;     // Color associated with this label
  }

  export interface LabelCount extends Label {
    count: number;
  }


  /* Billing Plans */

  export interface PlanDetails {
    id: ApiT.PlanId;
    name: string;
    price: string|JSX.Element;
    discountedPrice?: string|JSX.Element;
    freeTrial?: string|JSX.Element;
    extendedTrial?: string|JSX.Element;
    features: Array<string|JSX.Element>;
    enterprise?: boolean; // Requires billing address
  }
}
