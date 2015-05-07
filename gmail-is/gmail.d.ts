/*
  Type definitions for gmail.js
  (incomplete)
*/

declare module esperGmail.get {

  export interface Message {
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

  export interface Thread {
    first_email: string;
      /* gmail thread ID (hex-encoded).
         This is the gmail message ID of the root message of the thread,
         and remains the thread ID even after permanently deleting
         that message.
      */

    last_email: string;
    total_emails: number;
    total_threads: string[]; // gmail message IDs

    /*  TypeScript has no tuples
    people_involved: [
      ["Kartik Talwar", "hi@kartikt.com"],
      ["California", "california@gmail.com"]
    ],
    */
    people_involved: string[][];

    subject: string;

    /* MESSAGES of the thread, not threads */
    threads: { [threadId: string]: Message }
  }

  export interface sendMessageData {
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body: string;
    ishtml: boolean;
  }

  export function user_email(): string;
  export function current_page(): string;
  export function email_subject(): string;
  export function email_id(): string;
  export function email_ids(): string[];
  export function email_data(): Thread;
}

/* Typable functions defined in gmailInit.js */

declare module esperGmail.on {
  export function open_email(
    callback: (id: string,
               url: string,
               body: string,
               xhr: XMLHttpRequest) => void
  ): void;

  export function star(
    callback: (id: string,
               url: string,
               body: string,
               xhr: XMLHttpRequest) => void
  ): void;

  export function unstar(
    callback: (id: string,
               url: string,
               body: string,
               xhr: XMLHttpRequest) => void
  ): void;

  // TODO: Support the arguments ($selection, string) to the callback.
  export function reply_forward(
    callback: (match: JQuery, type: string) => void): void;

  /* complete as needed */
}

declare module esperGmail.after {
  export function send_message(
    callback: (whatever1: any,
               url: string,
               email: esperGmail.get.sendMessageData,
               whatever2: any,
               xhr: XMLHttpRequest) => void
  ): void;

  /* complete as needed */
}

declare module esperGmail.off {
  export function open_email(): void;
  export function send_message(): void;
  export function star(): void;
  export function unstar(): void;

  /* complete as needed */
}

declare module esperGmail.check {
  export function is_inside_email(): boolean;
}
