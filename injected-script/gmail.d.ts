/*
  Type definitions for gmail.js
  (incomplete)
*/

declare module gmail.get {

  /* yeah it's a message, not a thread. */
  export interface Thread {
    reply_to_id: string;
    is_deleted: boolean;
    from: string; // name
    to: string[];
    cc: string[];
    bcc: string[];
    from_email: string;
    timestamp: number;
    datetime: string; // "Sun, Nov 20, 2013 at 1:19 AM"
    content_plain: string;
    subject: string;
    content_html: string;
  }

  export interface EmailData {
    first_email: string;
      /* gmail thread ID (hex-encoded).
         This is the gmail message ID of the root message of the thread,
         and remains the thread ID even after permanently deleting
         that message.
      */

    last_email: string;
    total_emails: number;
    total_threads: string[]; // gmail message IDs

/*  TypeScript has no tuples, screw this.

    people_involved: [
      ["Kartik Talwar", "hi@kartikt.com"],
      ["California", "california@gmail.com"]
    ],
*/
    subject: string;
    threads: { [threadId: string]: Thread }
  }

  export function user_email(): string;
  export function current_page(): string;
  export function email_subject(): string;
  export function email_id(): string;
  export function email_ids(): string[];
  export function email_data(): EmailData;
}


/* Typable functions defined in gmailInit.js */

declare module gmail.on {
  export function open_email(
    callback: (id: string,
               url: string,
               body: string) => void
  ): void;

  export function star(
    callback: (id: string,
               url: string,
               body: string) => void
  ): void;

  export function unstar(
    callback: (id: string,
               url: string,
               body: string) => void
  ): void;

  /* complete as needed */
}

declare module gmail.off {
  export function open_email(): void;
  export function star(): void;
  export function unstar(): void;

  /* complete as needed */
}

declare module gmail.check {
  export function is_inside_email(): boolean;
}
