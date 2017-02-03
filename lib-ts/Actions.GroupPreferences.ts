/*
  Preferences-related actions
*/

/// <reference path="./Stores.GroupPreferences.ts" />

module Esper.Actions.GroupPreferences {
  function update(
    groupId: string,
    promise: JQueryPromise<any>,
    newPrefs: ApiT.GroupPreferences
  ) {
    // Update prefs in store if data present
    Stores.GroupPreferences.getInitPromise().done(function() {
      Stores.GroupPreferences.PrefsStore.push(groupId,
        promise, Option.some(newPrefs));
    });
  }

  // Enable or disable daily breakdown email
  export function toggleDailyBreakdownEmails(oldPrefs: ApiT.GroupPreferences) {
    var groupId = oldPrefs.groupid;
    var newPrefs = _.cloneDeep(oldPrefs);
    newPrefs.daily_breakdown = !oldPrefs.daily_breakdown;
    var promise = Api.putGroupPreferences(groupId, newPrefs);
    update(groupId, promise, newPrefs);
  }

  // Enable or disable weekly breakdown email
  export function toggleWeeklyBreakdownEmails(oldPrefs: ApiT.GroupPreferences) {
    var groupId = oldPrefs.groupid;
    var newPrefs = _.cloneDeep(oldPrefs);
    newPrefs.weekly_breakdown = !oldPrefs.weekly_breakdown;
    var promise = Api.putGroupPreferences(groupId, newPrefs);
    update(groupId, promise, newPrefs);
  }

  // Enable or disable bad meeting notifications
  export function toggleBadMeetingNotifications(oldPrefs: ApiT.GroupPreferences) {
    var groupId = oldPrefs.groupid;
    var newPrefs = _.cloneDeep(oldPrefs);
    newPrefs.bad_meeting_warning = !oldPrefs.bad_meeting_warning;
    var promise = Api.putGroupPreferences(groupId, newPrefs);
    update(groupId, promise, newPrefs);
  }

  // Sets the bad meeting duration for bad meeting notifications
  export function setBadMeetingDuration(oldPrefs: ApiT.GroupPreferences,
                                        duration: number) {
    var groupId = oldPrefs.groupid;
    var newPrefs = _.cloneDeep(oldPrefs);
    newPrefs.bad_duration = duration;
    var promise = Api.putGroupPreferences(groupId, newPrefs);
    update(groupId, promise, newPrefs);
  }

  // Sets the bad meeting attendees for bad meeting notifications
  export function setBadMeetingAttendees(oldPrefs: ApiT.GroupPreferences,
                                         attendees: number) {
    var groupId = oldPrefs.groupid;
    var newPrefs = _.cloneDeep(oldPrefs);
    newPrefs.bad_attendees = attendees;
    var promise = Api.putGroupPreferences(groupId, newPrefs);
    update(groupId, promise, newPrefs);
  }
}
