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
  export var uid_hash = "test-hash";
  export var email = "me@esper.com";

  export var teamId0 = "team-id-0";
  export var team0Exec = uid;
  export var team0Email = email;
  export var team0LabelInfos = [{
    original: "Label",
    normalized: normalizeLabel("Label")
  }];
  export var team0Calendars = ["lois@esper.com"];

  export var teamId1 = "team-id-1";
  export var team1Exec = "O-w_peter____________w";
  export var team1Email = "peter@esper.com";
  export var team1LabelInfos = [{
    original: "Label 1",
    normalized: normalizeLabel("Label 1"),
  }, {
    original: "Label 2",
    normalized: normalizeLabel("Label 2")
  }, {
    original: "Label 3",
    normalized: normalizeLabel("Label 3")
  }];
  export var team1Calendars = ["peter@esper.com"];

  export var teamId2 = "team-id-2";
  export var team2Exec = "O-w_stewie____________w";
  export var team2Email = "stewie@esper.com";
  export var team2LabelInfos = [{
    original: "Label A",
    normalized: normalizeLabel("Label A")
  }, {
    original: "Label B",
    normalized: normalizeLabel("Label B")
  }, {
    original: "Label C",
    normalized: normalizeLabel("Label C")
  }];
  export var team2Calendars = ["stewie@esper.com", "rupert@esper.com"];

  export var groupId = "group-id";

  // Stub normalization function for tests
  export function normalizeLabel(label: string) {
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
    Stores.TeamPreferences.PrefsStore.reset();
    Stores.TeamPreferences.PrefsStore.removeAllChangeListeners();
    Stores.Profiles.ProfileStore.reset();
    Stores.Profiles.ProfileStore.removeAllChangeListeners();
  }

  export function getLoginInfo(): ApiT.LoginResponse {
    return {
      uid: uid,
      uid_hash: uid_hash,
      api_secret: "secret",
      account_created: "2015-10-23T21:18:08.020-08:00",
      is_admin: false,
      is_alias: false,
      platform: "Google",
      is_sandbox_user: false,
      email: email,
      teams: [
        makeTeam({
          teamid: teamId0,
          team_name: email,
          team_executive: team0Exec,
          team_labels: team0LabelInfos,
          team_timestats_calendars: team0Calendars
        }),

        makeTeam({
          teamid: teamId1,
          team_name: "Peter Griffin",
          team_approved: true,
          team_executive: team1Exec,
          team_labels: team1LabelInfos,
          team_timestats_calendars: team1Calendars
        }),

        makeTeam({
          teamid: teamId2,
          team_name: "Stewie Griffin",
          team_approved: true,
          team_executive: team2Exec,
          team_labels: team2LabelInfos,
          team_timestats_calendars: team2Calendars
        })
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
      landing_url: "moon/base",
      feature_flags: {
        uid: uid,
        team_charts: false,
        group_charts: false,
        tb: false,
        fb: false
      }
    };
  }

  export function makeTeam(props: {
    teamid?: string;
    cusid?: string;
    team_name?: string;
    team_approved?: boolean;
    team_owner?: string;
    team_cal_user?: string;
    team_assistants?: string[];
    team_email_aliases?: string[];
    team_executive?: string;
    team_executive_email?: string;
    team_labels?: ApiT.LabelInfo[];
    team_timestats_calendars?: string[];
  } = {}): ApiT.Team {
    return {
      teamid: props.teamid || "team-id",
      team_api: {
        team_labels: props.team_labels || [],
        team_exec_email: props.team_executive_email || "",
        team_subscription: {
          teamid: props.teamid || "team-id",
          cusid: props.cusid || "customer-id",
          active: true,
          plan: "Basic_20161019",
          status: "Active",
          valid_payment_source: true
        }
      },
      team_name: props.team_name || "Team Name",
      team_approved: _.isUndefined(props.team_approved) ?
        true : props.team_approved,
      groups_only: false,
      team_owner: props.team_owner || uid,
      team_cal_user: props.team_cal_user || uid,
      team_assistants: props.team_assistants || [uid],
      team_email_aliases: props.team_email_aliases || [],
      team_executive: props.team_executive || uid,
      team_timestats_calendars: props.team_timestats_calendars || ["calId"]
    }
  }

  export function makeGenericCalendarEvent(props: {
    start?: string;
    end?: string;
    id?: string;
    calendar_id?: string;
    guests?: ApiT.Attendee[];
    labels?: ApiT.LabelInfo[];
    hidden?: boolean;
    labels_confirmed?: boolean;
    predicted_attended?: number;
    recurring_event_id?: string;
    transparent?: boolean;
    has_recurring_labels?: boolean;
  } = {}): ApiT.GenericCalendarEvent {
    var defaultEvent: ApiT.GenericCalendarEvent = {
      id: "id1",
      calendar_id: "calId",
      duplicates: [],
      start: "2016-03-02T12:14:17.000-08:00",
      end: "2016-03-02T13:14:17.000-08:00",
      title: "Event",
      all_day: false,
      guests: [],
      transparent: false,
      has_recurring_labels: false,
      labels_confirmed: false,
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
