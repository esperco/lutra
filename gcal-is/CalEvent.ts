module CalEvent {
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
    //s.replace("/","_").replace("+","-");
    return atob(encoded);
  }

  function decodeFullEventId(encodedId: string): FullEventId {
    var ar = decodeBase64(encodedId).split(" ");
    var eventId = ar[0];
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

