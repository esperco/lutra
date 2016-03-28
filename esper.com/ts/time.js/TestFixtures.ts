/*
  Zorilla-specific test fixutres
*/

/// <reference path="../common/Login.ts" />
/// <reference path="../lib/Test.ts" />
/// <reference path="../lib/Api.ts" />
/// <reference path="./Teams.ts" />

module Esper.TestFixtures {
  export var uid = "my-uid";
  export var email = "me@esper.com";
  export var teamId0 = "team-id-0";
  export var team0Labels = ["Label"];
  export var teamId1 = "team-id-1";
  export var team1Labels = ["Label 1", "Label 2", "Label 3"];
  export var teamId2 = "team-id-2";
  export var team2Labels = ["Label A", "Label B", "Label C"];

  // Stub normalization function for tests
  function normalizeLabel(label: string) {
    return label.trim().toLowerCase();
  }

  // Start complete init process with mock login data
  export function mockLogin() {
    reset();
    Test.mockAPIs();
    mockLoginInfo();
    Main.initAll();
  }

  // Mock response to getLoginInfo call
  export function mockLoginInfo() {
    spyOn(LocalStore, "get").and.returnValue({
      uid: uid,
      api_secret: "secret",
      email: email
    });

    var promise = $.Deferred().resolve(getLoginInfo()).promise();
    Test.spySafe(Api, "getLoginInfo").and.returnValue(promise);
  }

  export function reset() {
    Login.reset();
    Teams.teamStore.reset();
    Teams.teamStore.removeAllChangeListeners();
    Teams.allTeamsStore.reset();
    Teams.allTeamsStore.removeAllChangeListeners();
    Calendars.CalendarListStore.reset();
    Calendars.CalendarListStore.removeAllChangeListeners();
    Events2.EventsForDateStore.reset();
    Events2.EventsForDateStore.removeAllChangeListeners();
    Events2.EventStore.reset();
    Events2.EventStore.removeAllChangeListeners();
  }

  export function getLoginInfo(): ApiT.LoginResponse {
    return {
      uid: uid,
      api_secret: "secret",
      account_created: "2015-10-23T21:18:08.020-08:00",
      is_admin: false,
      is_alias: false,
      platform: "Google",
      email: email,
      teams: [
        {
          teamid: teamId0,
          team_name: email,
          team_approved: true,
          team_owner: uid,
          team_cal_user: uid,
          team_assistants: [uid],
          team_calendar_accounts: [],
          team_calendars: [{
            calendar_default_agenda: true,
            calendar_default_dupe: false,
            calendar_default_view: true,
            calendar_default_write: true,
            calendar_timezone: "America/New_York",
            calendar_title: "Lois's Calendar",
            google_access_role: "Owner",
            google_cal_id: "lois@esper.com",
            is_primary: true
          }],
          team_email_aliases: [],
          team_executive: uid,
          team_labels: team0Labels,
          team_labels_norm: _.map(team0Labels, normalizeLabel),
          team_label_urgent: "Urgent",
          team_label_new: "New",
          team_label_in_progress: "In Progress",
          team_label_pending: "Pending",
          team_label_done: "Done",
          team_label_canceled: "Canceled",
          team_timestats_calendars: ["lois@esper.com"]
        }, {
          teamid: teamId1,
          team_name: "Peter Griffin",
          team_approved: true,
          team_owner: uid,
          team_cal_user: uid,
          team_assistants: [uid],
          team_calendar_accounts: [],
          team_calendars: [{
            calendar_default_agenda: true,
            calendar_default_dupe: false,
            calendar_default_view: true,
            calendar_default_write: true,
            calendar_timezone: "America/New_York",
            calendar_title: "Peter's Calendar",
            google_access_role: "Owner",
            google_cal_id: "peter@esper.com",
            is_primary: true
          }],
          team_email_aliases: [],
          team_executive: "O-w_peter____________w",
          team_labels: team1Labels,
          team_labels_norm: _.map(team1Labels, normalizeLabel),
          team_label_urgent: "Urgent",
          team_label_new: "New",
          team_label_in_progress: "In Progress",
          team_label_pending: "Pending",
          team_label_done: "Done",
          team_label_canceled: "Canceled",
          team_timestats_calendars: ["peter@esper.com"]
        }, {
          teamid: teamId2,
          team_name: "Stewie Griffin",
          team_approved: true,
          team_owner: uid,
          team_cal_user: uid,
          team_assistants: [uid],
          team_calendar_accounts: [],
          team_calendars: [{
            calendar_default_agenda: true,
            calendar_default_dupe: false,
            calendar_default_view: true,
            calendar_default_write: true,
            calendar_timezone: "America/New_York",
            calendar_title: "Stewie's Calendar",
            google_access_role: "Owner",
            google_cal_id: "stewie@esper.com",
            is_primary: true
          }, {
            calendar_default_agenda: true,
            calendar_default_dupe: false,
            calendar_default_view: true,
            calendar_default_write: true,
            calendar_timezone: "America/Los_Angeles",
            calendar_title: "Rupert's Calendar",
            google_access_role: "Writer",
            google_cal_id: "rupert@esper.com",
            is_primary: false
          }],
          team_email_aliases: [],
          team_executive: "O-w_stewie____________w",
          team_labels: team2Labels,
          team_labels_norm: _.map(team2Labels, normalizeLabel),
          team_label_urgent: "Urgent",
          team_label_new: "New",
          team_label_in_progress: "In Progress",
          team_label_pending: "Pending",
          team_label_done: "Done",
          team_label_canceled: "Canceled",
          team_timestats_calendars: ["stewie@esper.com", "rupert@esper.com"]
        }
      ],
      team_members: [
        {
          member_email: "peter@esper.com",
          member_other_emails: [],
          member_uid: "O-w_peter____________w"
        }, {
          member_email: email,
          member_other_emails: [],
          member_uid: uid
        }, {
          member_email: "stewie@esper.com",
          member_other_emails: [],
          member_uid: "O-w_stewie____________w"
        }, {
          member_email: "rupert@esper.com",
          member_other_emails: [],
          member_uid: "O-w_rupert____________w"
        }, {
          member_email: email,
          member_other_emails: [],
          member_uid: uid
        }
      ],
      landing_url: "moon/base"
    };
  }

  export function makeGenericCalendarEvent(props: {
    start?: string,
    end?: string,
    id?: string,
    calendar_id?: string
  } = {}): ApiT.GenericCalendarEvent {
    var defaultEvent: ApiT.GenericCalendarEvent = {
      id: "id1",
      calendar_id: "calId",
      start: "2016-03-02T12:14:17.000-08:00",
      end: "2016-03-02T2:14:17.000-08:00",
      title: "Event",
      all_day: false,
      labels: [],
      labels_norm: [],
      feedback: {},
      guests: [],
      transparent: false,
      description_messageids: []
    };
    return _.extend(defaultEvent, props) as ApiT.GenericCalendarEvent;
  }
}
