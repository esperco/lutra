module CalEvent {
  export interface FullEventId {
    calendarId: string;
    eventId: string;
  }

  function decodeBase64(encoded: string): string {
    //s.replace("/","_").replace("+","-");
    return atob(encoded);
  }

  function decodeFullEventId(encodedId: string) {
    var ar = encodedId.split(" ");
    var eventId = ar[0];
    var calendarId = ar[1];
    return {
      calendarId: calendarId,
      eventId: eventId
    };
  }

  export function extractFullEventId(): FullEventId {
    var encodedId = $("div.ep[data-eid]") .attr("data-eid");
    return decodeFullEventId(encodedId);
  }
}
