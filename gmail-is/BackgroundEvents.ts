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
        return meeting.availability;
      } else {
        return []; // unknown meeting type; no set preferences
      }
    });
  }
}