/*
  Zorilla-specific test fixutres
*/

/// <reference path="../marten/typings/jasmine/jasmine.d.ts" />
/// <reference path="../marten/ts/Api.ts" />
/// <reference path="./Login.ts" />

module Esper.TestFixtures {
  export var uid = "my-uid";
  export var email = "me@esper.com"

  export function mockLogin() {
    Login.setCredentials(uid, "secret");
    var info = mockLoginInfo();
    Login.loginPromise = $.Deferred().resolve(info).promise();
  }

  export function mockLoginInfo() {
    var info = getLoginInfo();
    Login.InfoStore.set(info);
    return info;
  }

  export function getLoginInfo(): ApiT.LoginResponse {
    return {
      uid: uid,
      api_secret: "secret",
      account_created: "2015-10-23T21:18:08.020-08:00",
      is_admin: false,
      is_alias: false,
      is_nylas: false,
      email: email,
      teams: [
        {
          teamid: "team-id-1",
          team_name: "Peter Griffin",
          team_approved: true,
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
          team_labels: ["Label 1", "Label 2", "Label 3"],
          team_label_urgent: "Urgent",
          team_label_new: "New",
          team_label_in_progress: "In Progress",
          team_label_pending: "Pending",
          team_label_done: "Done",
          team_label_canceled: "Canceled"
        }, {
          teamid: "team-id-2",
          team_name: "Stewie Griffin",
          team_approved: true,
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
          team_labels: ["Label A", "Label B", "Label C"],
          team_label_urgent: "Urgent",
          team_label_new: "New",
          team_label_in_progress: "In Progress",
          team_label_pending: "Pending",
          team_label_done: "Done",
          team_label_canceled: "Canceled"
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
      waiting_for_sync: false,
      has_ios_app: false
    };
  }
}
