/*
  Common, re-usable types not found in ApiT.ts
*/

/// <referene path="./ApiT.ts" />
/// <referene path="./Option.ts" />

module Esper.Types {

  /* Event Types */

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
  export interface EventListData {
    start: Date;
    end: Date;
    events: TeamEvent[];
    isBusy: boolean;
    hasError: boolean;
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
}
