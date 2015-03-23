/** This module contains logic for calculating "background events":
 *  times based on preferences that display things like potential
 *  meeting times, travel times and buffers between meetings.
 */

module Esper.BackgroundEvents {

  /** Returns possible meeting times in the given time range based on
   *  executive preferences for the given tyep of event.
   *
   *  The start date passed in should be a *Sunday* (the first day of
   *  the week). The preferences will be calculated with this
   *  assumption.
   */
  function meetingTimes(eventType: string, startOfWeek: Moment) {
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    CurrentThread.withPreferences(function (preferences) {
      var meeting = preferences.meeting_types[eventType];
      if (meeting && meeting.availabile && meeting.availability) {
        var times = [];

        for (var i = 0; i < days.length; i++) {
          var day    = days[i];
          var moment = startOfWeek.add("days", i);
          var events = meeting.availability.filter(function (availability) {
            return availability.avail_from.day === day;
          }).map(function (availability) {
            var startHours   = availability.avail_from.hour;
            var startMinutes = parseInt(availability.avail_from.minutes, 10);
            var endHours     = availability.avail_to.hour;
            var endMinutes   = parseInt(availability.avail_to.minutes, 10);

            return {
              title     : eventType,
              start     : moment.add("hours", startHours).add("minutes", startMinutes).format(),
              end       : moment.add("hours", endHours).add("minutes", endMinutes).format(),
              editable  : false,
              rendering : background,
              overlap   : true
            }
          });

          times = times.concat(events);
        }

        return times;
      } else {
        return []; // unknown meeting type; no set preferences
      }
    });
  }
}