/*
  Generic test fixutres
*/

/// <reference path="./Login.Web.ts" />
/// <reference path="./Test.ts" />
/// <reference path="./Api.ts" />
/// <reference path="./Stores.Calendars.ts" />
/// <reference path="./Stores.Teams.ts" />

module Esper.TestFixtures {
  export var uid = "my-uid";
  export var email = "me@esper.com";

  export var teamId0 = "team-id-0";
  export var team0Exec = uid;
  export var team0Email = email;
  export var team0Labels = ["Label"];
  export var team0Calendars = ["lois@esper.com"];

  export var teamId1 = "team-id-1";
  export var team1Exec = "O-w_peter____________w";
  export var team1Email = "peter@esper.com";
  export var team1Labels = ["Label 1", "Label 2", "Label 3"];
  export var team1Calendars = ["peter@esper.com"];

  export var teamId2 = "team-id-2";
  export var team2Exec = "O-w_stewie____________w";
  export var team2Email = "stewie@esper.com";
  export var team2Labels = ["Label A", "Label B", "Label C"];
  export var team2Calendars = ["stewie@esper.com", "rupert@esper.com"];

  export var groupId = "group-id";

  // Stub normalization function for tests
  function normalizeLabel(label: string) {
    return label.trim().toLowerCase();
  }

  // Start complete init process with mock login data
  export function mockLogin() {
    reset();
    Test.mockAPIs();
    mockLoginInfo();
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
    Stores.Teams.TeamStore.reset();
    Stores.Teams.TeamStore.removeAllChangeListeners();
    Stores.Teams.TeamListStore.reset();
    Stores.Teams.TeamListStore.removeAllChangeListeners();
    Stores.Calendars.ListStore.reset();
    Stores.Calendars.ListStore.removeAllChangeListeners();
    Stores.Events.EventsForDateStore.reset();
    Stores.Events.EventsForDateStore.removeAllChangeListeners();
    Stores.Events.EventStore.reset();
    Stores.Events.EventStore.removeAllChangeListeners();
    Stores.Preferences.PrefsStore.reset();
    Stores.Preferences.PrefsStore.removeAllChangeListeners();
    Stores.Profiles.ProfileStore.reset();
    Stores.Profiles.ProfileStore.removeAllChangeListeners();
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
          team_email_aliases: [],
          team_executive: team0Exec,
          team_labels: team0Labels,
          team_labels_norm: _.map(team0Labels, normalizeLabel),
          team_label_urgent: "Urgent",
          team_label_new: "New",
          team_label_in_progress: "In Progress",
          team_label_pending: "Pending",
          team_label_done: "Done",
          team_label_canceled: "Canceled",
          team_timestats_calendars: team0Calendars
        }, {
          teamid: teamId1,
          team_name: "Peter Griffin",
          team_approved: true,
          team_owner: uid,
          team_cal_user: uid,
          team_assistants: [uid],
          team_calendar_accounts: [],
          team_email_aliases: [],
          team_executive: team1Exec,
          team_labels: team1Labels,
          team_labels_norm: _.map(team1Labels, normalizeLabel),
          team_label_urgent: "Urgent",
          team_label_new: "New",
          team_label_in_progress: "In Progress",
          team_label_pending: "Pending",
          team_label_done: "Done",
          team_label_canceled: "Canceled",
          team_timestats_calendars: team1Calendars
        }, {
          teamid: teamId2,
          team_name: "Stewie Griffin",
          team_approved: true,
          team_owner: uid,
          team_cal_user: uid,
          team_assistants: [uid],
          team_calendar_accounts: [],
          team_email_aliases: [],
          team_executive: team2Exec,
          team_labels: team2Labels,
          team_labels_norm: _.map(team2Labels, normalizeLabel),
          team_label_urgent: "Urgent",
          team_label_new: "New",
          team_label_in_progress: "In Progress",
          team_label_pending: "Pending",
          team_label_done: "Done",
          team_label_canceled: "Canceled",
          team_timestats_calendars: team2Calendars
        }
      ],
      groups: [groupId],
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
    calendar_id?: string,
    guests?: ApiT.Attendee[],
    recurring_event_id?: string;
    transparent?: boolean;
    feedback?: ApiT.EventFeedback;
  } = {}): ApiT.GenericCalendarEvent {
    var defaultEvent: ApiT.GenericCalendarEvent = {
      id: "id1",
      calendar_id: "calId",
      start: "2016-03-02T12:14:17.000-08:00",
      end: "2016-03-02T13:14:17.000-08:00",
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


  ///////

  export interface ProfileOpts {
    profile_uid: string;
    email?: string;
    other_emails?: string[];
    google_access?: boolean;
    display_name?: string;
    has_ios_app?: boolean;
  }

  export function mockProfiles(add?: ProfileOpts[]) {
    Stores.Profiles.ProfileStore.reset();
    _.each(getProfileList(add).profile_list, (p) =>
      Stores.Profiles.ProfileStore.set(p.profile_uid, Option.some(p))
    );
  }

  export function getProfileList(add?: ProfileOpts[]): ApiT.ProfileList {
    var defaults: ApiT.Profile[] = [{
      profile_uid: team0Exec,
      email: team0Email,
      other_emails: <string[]> [],
      google_access: true,
      display_name: "Lois",
      has_ios_app: false
    }, {
      profile_uid: team1Exec,
      email: team1Email,
      other_emails: <string[]> [],
      google_access: true,
      display_name: "Peter",
      has_ios_app: false
    }, {
      profile_uid: team2Exec,
      email: team2Email,
      other_emails: <string[]> [],
      google_access: true,
      display_name: "Stewie",
      has_ios_app: false
    }];

    _.each(add, (a) => {
      var currentIndex = _.findIndex(defaults,
        (d) => a.profile_uid === d.profile_uid
      );
      if (currentIndex) {
        var current = defaults[currentIndex];
        defaults[currentIndex] = (<ApiT.Profile> _.extend(current, a));
      } else {
        defaults.push(<ApiT.Profile> _.extend({
          email: "something@example.com",
          other_emails: [],
          google_access: true,
          display_name: "Something",
          has_ios_app: false
        }, a));
      }
    })

    return { profile_list: defaults };
  }
}
