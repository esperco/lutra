/** This module contains logic for calculating "background events":
 *  times based on preferences that display things like potential
 *  meeting times, travel times and buffers between meetings.
 */

module Esper.BackgroundEvents {

  /** The color for suggested times based on meeting preferences. */
  export var suggestionColor = "#FFA858"; // light orange

  /** Returns possible meeting times in the given time range based on
   *  executive preferences for the given tyep of event.
   *
   *  The start date passed in should be a *Sunday* (the first day of
   *  the week). The preferences will be calculated with this
   *  assumption.
   */
  export function meetingTimes(eventType: string, start: Moment, end: Moment, resolve) {
    var start = start.startOf('day');
    var end   = end.startOf('day');

    CurrentThread.withPreferences(function (preferences) {
      var meeting  = preferences.meeting_types[eventType];
      if (meeting && meeting.available && meeting.availability) {
        var times = [];

        for (var day = moment(start); day.isBefore(end); day.add("days", 1)) {
          var events = meeting.availability.filter(function (availability) {
            return availability.avail_from.day === day.format("ddd");
          }).map(function (availability) {
            var startHours   = availability.avail_from.time.hour;
            var startMinutes = parseInt(availability.avail_from.time.minutes, 10);
            var endHours     = availability.avail_to.time.hour;
            var endMinutes   = parseInt(availability.avail_to.time.minutes, 10);

            return {
              start     : moment(day).add("hours", startHours)
                .add("minutes", startMinutes)
                .format(),
              end       : moment(day).add("hours",   endHours)
                .add("minutes", endMinutes)
                .format(),
              title     : eventType,
              editable  : false,
              rendering : "background",
              overlap   : true,
              color     : suggestionColor
            }
          });

          times = times.concat(events);
        }

        resolve(times);
      } else {
        resolve([]); // unknown meeting type; no set preferences
      }
    });
  }
}