/*
  Zorilla-specific test fixutres
*/

/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../common/Login.OAuth.ts" />
/// <reference path="../lib/Api.ts" />
/// <reference path="./Teams.ts" />

module Esper.TestFixtures {
  export var uid = "my-uid";
  export var email = "me@esper.com"
  export var teamId1 = "team-id-1";
  export var team1Labels = ["Label 1", "Label 2", "Label 3"];
  export var teamId2 = "team-id-2";
  export var team2Labels = ["Label A", "Label B", "Label C"];

  export function mockLogin() {
    spyOn(LocalStore, "get").and.returnValue({
      uid: uid,
      api_secret: "secret",
      email: email
    });

    var promise = $.Deferred().resolve(mockLoginInfo()).promise();
    spyOn(Api, "getLoginInfo").and.returnValue(promise);

    Login.init();
  }

  export function mockLoginInfo() {
    Teams.teamStore.reset();
    Teams.teamStore.removeAllChangeListeners();
    Teams.allTeamsStore.reset();
    Teams.allTeamsStore.removeAllChangeListeners();

    var info = getLoginInfo();
    Login.InfoStore.set(info);
    Teams.loadFromLoginInfo(info);
    return info;
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
          teamid: teamId1,
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
          team_labels: team1Labels,
          team_label_urgent: "Urgent",
          team_label_new: "New",
          team_label_in_progress: "In Progress",
          team_label_pending: "Pending",
          team_label_done: "Done",
          team_label_canceled: "Canceled"
        }, {
          teamid: teamId2,
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
          team_labels: team2Labels,
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
