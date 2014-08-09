module Esper.ApiT {
  /*
    The following type definitions were translated manually
    from wolverine/types/api.atd.
    We might want to generate them with atdgen in the future.
  */

  export interface Team {
    teamid: string;
    team_name: string;
    team_executive: string;
    team_assistants: string[];
  }

  export interface Phone {
    title: string;
    number: string;
  }

  export interface EmailEntry {
    title: string;
    email: string;
  }

  export interface FirstLastName {
    first: string;
    last: string;
  }

  export enum Role {
    Assistant,
    Executive
  }

  export enum Gender {
    Female,
    Male
  }

  export interface Profile {
    profile_uid: string;
    role: Role; // optional
    editable: boolean; // optional
    prefix: string; // optional
    first_last_name: FirstLastName; // optional
    pseudonym: string; // optional
    gender: Gender; // optional
    emails: EmailEntry[];
    phones: Phone[];
  }

  export interface LoginResponse {
    uid: string;
    api_secret: string;
    email: string;
    profile: Profile;
    teams: Team[];
  }

  export interface CalendarTime {
    local: string; // RFC 3339 timestamp; local time = time read in UTC
    utc: string; // RFC 3339 timestamp
  }

  export interface Latlon {
    lat: number;
    lon: number;
  }

  export interface Location {
    title: string;
    address: string;
    instructions: string;
    coord: Latlon; // optional
    timezone: string; // required if coordinates are missing
  }

  export interface CalendarEvent {
    google_event_id: string;
    google_cal_id: string;
    start: CalendarTime;
    end: CalendarTime;

    /* optional fields */
    meeting_type: string;
    title: string;
    description: string;
    location: Location;
    all_day: boolean;
    transparent: boolean;
    esper_tid: string;
  }

  export interface SyncedThread {
    esper_uid: string;
    gmail_thrid: string;
  }

  export interface EventWithSyncInfo {
    event: CalendarEvent;
    synced_threads: SyncedThread[];
  }

  export interface LinkedCalendarEvents {
    linked_events: EventWithSyncInfo[];
  }

  export interface CalendarEventList {
    events: CalendarEvent[];
  }

  export interface googleEvent {
    google_event_id: string;
  }

  export interface LinkCalendarEvents {
    google_events: googleEvent[];
  }

/*
  export interface GoogleProfile {
    display_name: string;
    gender: string;
    image_url: string;
  }
*/
}
