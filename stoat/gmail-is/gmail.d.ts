/*
  Type definitions for gmail.js
  (incomplete)
*/

declare module GmailJs {

  interface Message {
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

  interface Thread {
    first_email: string;
      /* gmail thread ID (hex-encoded).
         This is the gmail message ID of the root message of the thread,
         and remains the thread ID even after permanently deleting
         that message.
      */

    last_email: string;
    total_emails: number;
    total_threads: string[]; // gmail message IDs

    /*  Name, email tuple
    people_involved: [
      ["Kartik Talwar", "hi@kartikt.com"],
      ["California", "california@gmail.com"]
    ]
    */
    people_involved: [string, string][];

    subject: string;

    /* MESSAGES of the thread, not threads */
    threads: { [threadId: string]: Message }
  }

  interface SendMessageData {
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body: string;
    ishtml: boolean;
  }

  interface GmailJsGet {
    user_email(): string;
    current_page(): string;
    email_subject(): string;
    email_id(): string;
    email_ids(): string[];
    email_data(): Thread;
  }

  interface GmailJsCheck {
    is_inside_email(): boolean;
  }

  /* Not part of gmail.Js proper but defined by Gmail.init */
  interface GmailJsOn {
    new_email(callback: (id: string,
                         url: string,
                         body: string,
                         xhr: XMLHttpRequest) => void): void;

    open_email(callback: (id: string,
                          url: string,
                          body: string,
                          xhr: XMLHttpRequest) => void): void;

    show_newly_arrived_message(callback: (id: string,
                                          url: string,
                                          body: string) => void): void;

    star(callback: (id: string,
                    url: string,
                    body: string,
                    xhr: XMLHttpRequest) => void): void;

    unstar(callback: (id: string,
                      url: string,
                      body: string,
                      xhr: XMLHttpRequest) => void): void;

    // TODO: Support the arguments ($selection, string) to the callback.
    reply_forward(callback: (match: JQuery, type: string) => void): void;

    /* complete as needed */
  }

  /* Not part of gmail.Js proper but defined by Gmail.init */
  interface GmailJsOff {
    new_email(): void;
    open_email(): void;
    send_message(): void;
    show_newly_arrived_message(): void;
    star(): void;
    unstar(): void;
  }

  /* Not part of gmail.Js proper but defined by Gmail.init */
  interface GmailJsAfter {
    // NB: Apears to be reversed from documentation? May cause weird
    // errors if we update our gmail.js library
    send_message(callback: (body: any,
                            url: string,
                            data: SendMessageData,
                            response: any,
                            xhr: XMLHttpRequest) => void): void;

    /* complete as needed */
  }

  /* Not part of gmail.Js proper but defined by Gmail.init */
  interface GmailJsBefore {
    /* complete as needed */
  }

  interface GmailJsStatic {
    get: GmailJsGet;
    check: GmailJsCheck;
    on: GmailJsOn;
    off: GmailJsOff;
    after: GmailJsAfter;
    before: GmailJsBefore;

    observe: {
      on(action: string, callback: (...args: any[]) => void): void;
      off(action: string|void, type?: string): void;
      after(action: string, callback: (...args: any[]) => void): void;
      before(action: string, callback: (...args: any[]) => void): void;
    }
  }

  interface Factory {
    (jQuery: JQueryStatic): GmailJsStatic;
  }
}

declare module Esper {
  // Factory added by vendor
  export var gmailJs: GmailJs.Factory;

  // Library created by Gmail.init function
  export var GmailJs: GmailJs.GmailJsStatic;
}
