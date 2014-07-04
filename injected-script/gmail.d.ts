/*
  Type definitions for gmail.js
  (incomplete)
*/

declare module gmail.get {
  export function user_email(): string;
  export function current_page(): string;
  export function email_subject(): string;
  export function email_id(): string;
  export function email_ids(): string[];
}


/* Typable functions defined in gmailInit.js */

declare module gmail.on {
  export function open_email(
    callback: (id: string,
               url: string,
               body: string) => void
  ): void;

  /* complete as needed */
}

declare module gmail.off {
  export function open_email(): void;

  /* complete as needed */
}
