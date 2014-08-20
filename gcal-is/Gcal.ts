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

    export function equal(a: Types.FullEventId, b: Types.FullEventId): boolean {
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

    /*
      Google Calendar uses abbreviations for common "domains" in
      email-like calendar IDs.
      We convert these abbreviations to their full form usable
      with the Google APIs.
     */
    function fixCalendarId(s) {
      var ar = s.split("@");
      if (ar.length !== 2)
        return s;
      else {
        var domain = ar[1];
        switch (ar[1]) {
        case "m":
          /* "mjambon@gmail.com" */
          domain = "gmail.com";
          break;
        case "v":
          /* "en.usa#holiday@group.v.calendar.google.com" */
          domain = "group.v.calendar.google.com";
          break;
        }
        return ar[0] + "@" + domain;
      }
    }

    function decodeFullEventId(encodedId: string): Types.FullEventId {
      var decoded = decodeBase64(encodedId);
      if (decoded !== undefined && decoded !== null) {
        var eventId = decoded.slice(0, 26);
        var ar = decoded.split(" ");
        if (ar.length === 2) {
          var calendarId = fixCalendarId(ar[1]);
          return {
            calendarId: calendarId,
            eventId: eventId
          };
        }
      }
    }

    export function extractFullEventId(): Types.FullEventId {
      var encodedId = $("div.ep[data-eid]").attr("data-eid");
      if (encodedId !== undefined)
        return decodeFullEventId(encodedId);
    }
  }
}
