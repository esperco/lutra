/*
  Various types shared across the extension (content script, Gmail, Calendar)
*/

module Esper.Types {
    /*
    This is the minimum we need to make API calls as a logged-in Esper user.
    Other account information (profile, teams) can be retrieved using these.
  */
  export interface Credentials {
    apiSecret: string;       // used for signing, but not sent to the server
    uid: string;             // used by the server to find the API secret
  }

  export interface GmailThread {
    threadId: string;
    subject: string;
      /* easy to extract from gmail, saves an API call,
         helps for debugging */
  }

  export interface FullEventId {
    calendarId: string;
    eventId: string;
  }

  export interface Visited<T> {
    lastVisited: number; /* unixtime in seconds */
    id: string; /* used in comparisons for deduplication */
    item: T;
  }

  /* One short list of the recently consulted email threads */
  export interface ActiveThreads {
    googleAccountId: string;
    threads: Visited<GmailThread>[];
  }

  /* One short list of the recently consulted events per calendar */
  export interface ActiveEvents {
    googleAccountId: string;
    calendars: { [calendarId: string]: Visited<FullEventId>[] };
  }

  export interface Account {
    googleAccountId: string;
      /* Google account (email address) tied to the Esper account */
    credentials?: Credentials;
      /* Esper UID and API secret */
    declined: boolean;
      /* user said "no thanks" when asked to log in;
         this field should be set to false
         if credentials exist.
      */

    activeThreads?: ActiveThreads; /* for Google Calendar */
    activeEvents?: ActiveEvents;   /* for Gmail */
  }

  export interface Storage {
    accounts: { [googleAccountId: string]: Account; };
  }
}
