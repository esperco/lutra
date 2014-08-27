/*
  Extraction of data from the Google Calendar document and JavaScript
  environment.
*/

module Esper.Gcal {

  function validateEmail(s) {
    return (/^[^ ]+@[^ ]+$/.test(s));
  }

  function tryJQuerySelection(selection: JQuery) {
    if (selection.length === 1) {
      var text = selection.text();
      if (validateEmail(text))
        return text;
      else
        return;
    }
    else
      return;
  }

  function method0() {
    return tryJQuerySelection($(".gb_ia"));
  }

  function method1() {
    return tryJQuerySelection($(".gb_ja"));
  }

  /* Seems to work only after some delay */
  function method2() {
    return window["gbar"]._CONFIG[0][10][5];
  }

  function trySeveralMethods(l) {
    for (var i = 0; i < l.length; i++) {
      try {
        Log.d("Extracting logged-in email address using method " + i);
        var x = l[i]();
        if (x !== undefined && x !== null)
          return x;
      } catch(e) {}
    }
  }

  function extractUserEmail() {
    return trySeveralMethods([method0, method1, method2]);
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
      if (encoded !== undefined && encoded !== null)
        return atob(encoded);
      else
        return;
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

    /* Examples covering what we're parsing after base64 decoding:

       "4jqqn6rb48sh9c2sbet0che86k lois.mj.esper@m"
       "4jqqn6rb48sh9c2sbet0che86k_20140825T000000Z lois.mj.esper@m"
       "4jqqn6rb48sh9c2sbet0che86k someone@example.com"
     */
    function decodeFullEventId(encodedId: string): Types.FullEventId {
      var decoded = decodeBase64(encodedId);
      if (decoded !== undefined) {
        var ar = decoded.split(" ");
        if (ar.length === 2) {
          /* An event ID looks like this:
             one-time:  qvb2c11pcjkpdm2t0simrfvo24
             recurring: qvb2c11pcjkpdm2t0simrfvo24_20140822T190000Z
          */
          var eventId = ar[0];
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
