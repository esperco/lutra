/*
  Extraction of data from the Google Calendar document and JavaScript
  environment.
*/

module Esper.Gcal {

  function extractUserEmail() {
    var selection = $(".gb_ia");
    if (selection.length === 1) {
      var text = selection.text();
      if (/^[^ ]+@[^ ]+$/.test(text))
        return text;
      else
        return;
    }
    else
      return;
  }

  var userEmail;
  var userEmailInit = false;

  /*
    getUserEmail() caches the result of extractUserEmail() as soon as it looks
    like an email address.
  */
  export function getUserEmail() {
    if (userEmailInit)
      return userEmail;
    else {
      userEmail = extractUserEmail();
      if (userEmail !== undefined) {
        userEmailInit = true;
      }
      return userEmail;
    }
  }

  export module Event {

    export interface FullEventId {
      calendarId: string;
      eventId: string;
    }

    export function equal(a: FullEventId, b: FullEventId): boolean {
      if (a === b)
        return true;
      else if (a === undefined || b === undefined)
        return false;
      else
        return a.eventId === b.eventId && a.calendarId === b.calendarId;
    }

    function decodeBase64(encoded: string): string {
      return atob(encoded);
    }

    function decodeFullEventId(encodedId: string): FullEventId {
      var decoded = decodeBase64(encodedId);
      var eventId = decoded.slice(0, 26);
      var ar = decoded.split(" ");
      var calendarId = ar[1];
      return {
        calendarId: calendarId,
        eventId: eventId
      };
    }

    export function extractFullEventId(): FullEventId {
      var encodedId = $("div.ep[data-eid]").attr("data-eid");
      if (encodedId !== undefined)
        return decodeFullEventId(encodedId);
    }
  }
}
