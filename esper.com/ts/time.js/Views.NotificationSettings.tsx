/// <reference path="../lib/ApiC.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/Stores.Teams.ts" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  class OneCalendarPrefs extends Component<{
    team: ApiT.Team;
    cal: ApiT.GenericCalendar;
  }, {}> {

    updateCalendarPrefs(prefs: ApiT.CalendarPrefs) {
      // Post to server
      var teamId = this.props.team.teamid;
      var calId = this.props.cal.id
      var p = Api.postCalendarPrefs(teamId, calId, prefs);

      // Update local state
      var newCal = _.cloneDeep(this.props.cal);
      newCal.prefs = prefs;

      var calendarList = _.clone(Calendars.CalendarListStore.val(teamId));
      var index = _.findIndex(calendarList, (c) => c.id === calId);
      calendarList[index] = newCal;

      Calendars.CalendarListStore.push(teamId, p, calendarList);
    }

    toggleDailyAgenda() {
      var newPrefs = _.cloneDeep(this.props.cal.prefs);
      newPrefs.add_to_daily_agenda = ! newPrefs.add_to_daily_agenda;
      this.updateCalendarPrefs(newPrefs);
    }

    toggleUseEmail() {
      var newPrefs = _.cloneDeep(this.props.cal.prefs);
      newPrefs.email_for_meeting_feedback =
        ! newPrefs.email_for_meeting_feedback;
      this.updateCalendarPrefs(newPrefs);
    }

    toggleUseSlack() {
      var newPrefs = _.cloneDeep(this.props.cal.prefs);
      newPrefs.slack_for_meeting_feedback =
        ! newPrefs.slack_for_meeting_feedback;
      this.updateCalendarPrefs(newPrefs);

      // Check if we need Slack authorization
      if (newPrefs.slack_for_meeting_feedback) {
        ApiC.getSlackAuthInfo().then(function(x:ApiT.SlackAuthInfo) {
          if (! x.slack_authorized) {
            // Uncache non-authorized status b/c this is likely to change
            ApiC.getSlackAuthInfo.store.reset();
            location.href = x.slack_auth_url;
          }
        });
      }
    }

    render() {
      var prefs = this.props.cal.prefs || {add_to_daily_agenda:false};
      return <div className="esper-select-menu">
        <div className="esper-select-header">
          { this.props.cal.title }
        </div>
        <div className="esper-selectable" onClick={() => this.toggleUseEmail()}>
          <i className={"fa fa-fw " + (
            prefs.email_for_meeting_feedback ?
            "fa-check-square-o" : "fa-square-o"
          )} />{" "}
          {Text.SendFeedbackEmail}
        </div>
        <div className="esper-selectable"
             onClick={() => this.toggleDailyAgenda()}>
          <i className={"fa fa-fw " + (
            prefs.add_to_daily_agenda ?
            "fa-check-square-o" : "fa-square-o"
          )} />{" "}
          {Text.AddToDailyAgenda}
        </div>
      </div>;
    }
  }

  function TeamSettings({team, calendars, prefs, status}: {
    team: ApiT.Team;
    calendars: Option.T<ApiT.GenericCalendar[]>;
    prefs: Option.T<ApiT.Preferences>;
    status: Model.DataStatus;
  }) {
    return calendars.match({
      none: () => {
        if (status === Model.DataStatus.READY) {
          return <span />;
        }
        return <div className="esper-spinner esper-centered esper-large" />;
      },
      some: (calendars) => {
        if (calendars.length === 0) {
          return <span />;
        }

        var isBusy = (
          status === Model.DataStatus.FETCHING ||
          status === Model.DataStatus.INFLIGHT);
        var hasError = (
          status === Model.DataStatus.PUSH_ERROR ||
          status === Model.DataStatus.FETCH_ERROR);
        return <div className="panel panel-default">
          <div className="panel-heading">
            <i className="fa fa-fw fa-user" />{" "}
            {team.team_name}
            {isBusy ? <span className="esper-spinner" /> : null}
          </div>
          <div className="panel-body">
            { hasError ? <Components.ErrorMsg /> : null }
            { _.map(calendars, (c) =>
              <OneCalendarPrefs key={team.teamid + " " + c.id}
                team={team} cal={c}
              />
            )}
            <TeamGeneralPrefs prefs={prefs} />
          </div>
        </div>;
      }
    });
  }

  class TeamGeneralPrefs extends Component<{
    prefs: Option.T<ApiT.Preferences>;
  }, {}> {
    render() {
      return <div className="esper-select-menu">
        <div className="esper-select-header">
          {Text.GeneralPrefsHeading}
        </div>
        <div className="esper-selectable"
             onClick={() => this.toggleLabelReminders()}>
          <i className={"fa fa-fw " + (
            this.sendLabelReminders() ?
            "fa-check-square-o" : "fa-square-o"
          )} />{" "}{Text.SendLabelReminder}
        </div>
        <div className="esper-selectable"
             onClick={() => this.toggleDailyAgenda()}>
          <i className={"fa fa-fw " + (
            this.sendDailyAgenda() ?
            "fa-check-square-o" : "fa-square-o"
          )} />{" "}{Text.SendDailyAgenda}
        </div>
        <div className="esper-selectable"
             onClick={() => this.toggleFeedbackSummary()}>
          <i className={"fa fa-fw " + (
            this.sendFeedbackSummary() ?
            "fa-check-square-o" : "fa-square-o"
          )} />{" "}{Text.SendFeedbackSummary}
        </div>
      </div>;
    }

    sendLabelReminders(): boolean {
      return this.props.prefs.match({
        none: () => false,
        some: (p) => {
          return p.label_reminder
              && p.label_reminder.recipients_
              && 0 <= _.indexOf(p.label_reminder.recipients_,
                                Login.myEmail());
        }
      });
    }

    sendDailyAgenda(): boolean {
      return this.props.prefs.match({
        none: () => false,
        some: (p) => {
          return 0 <= _.indexOf(p.email_types.daily_agenda.recipients,
                                Login.myEmail());
        }
      });
    }

    sendFeedbackSummary(): boolean {
      return this.props.prefs.match({
        none: () => false,
        some: (p) => {
          var emailPrefs = p.email_types.feedback_summary;
          if (! emailPrefs) {
            emailPrefs = p.email_types.daily_agenda;
          }
          return 0 <= _.indexOf(emailPrefs.recipients, Login.myEmail());
        }
      });
    }

    toggleLabelReminders() {
      this.props.prefs.match({
        none: () => null,
        some: (p) => {
          var prefs = _.cloneDeep(p);
          if (this.sendLabelReminders()) {
            prefs.label_reminder.recipients_ =
              _.without(prefs.label_reminder.recipients_, Login.myEmail());
          } else {
            if (! prefs.label_reminder) {
              prefs.label_reminder = {recipients_:[Login.myEmail()]};
            } else if (! prefs.label_reminder.recipients_) {
              prefs.label_reminder.recipients_ = [Login.myEmail()];
            } else {
              prefs.label_reminder.recipients_.push(Login.myEmail());
            }
          }
          updateTeamPreferences(prefs,
            Api.setLabelReminderPrefs(prefs.teamid, prefs.label_reminder));
        }
      });
    }

    toggleDailyAgenda() {
      this.props.prefs.match({
        none: () => null,
        some: (p) => {
          var prefs = setupEmailPrefs(p);
          if (this.sendDailyAgenda()) {
            prefs.email_types.daily_agenda.recipients =
              _.without(prefs.email_types.daily_agenda.recipients,
                        Login.myEmail());
          } else {
            if (prefs.email_types.daily_agenda.recipients) {
              prefs.email_types.daily_agenda.recipients.push(Login.myEmail());
            } else {
              prefs.email_types.daily_agenda.recipients = [Login.myEmail()];
            }
          }
          updateTeamPreferences(prefs,
            Api.setEmailTypes(prefs.teamid, prefs.email_types));
        }
      });
    }

    toggleFeedbackSummary() {
      this.props.prefs.match({
        none: () => null,
        some: (p) => {
          var prefs = setupEmailPrefs(p);
          if (this.sendFeedbackSummary()) {
            prefs.email_types.feedback_summary.recipients =
              _.without(prefs.email_types.feedback_summary.recipients,
                        Login.myEmail());
          } else {
            if (prefs.email_types.feedback_summary.recipients) {
              prefs.email_types.feedback_summary.recipients
                .push(Login.myEmail());
            } else {
              prefs.email_types.feedback_summary.recipients
                = [Login.myEmail()];
            }
          }
          updateTeamPreferences(prefs,
            Api.setEmailTypes(prefs.teamid, prefs.email_types));
        }
      });
    }
  }

  interface TeamPreferences {
    [index: string]: ApiT.Preferences;
  }

  function getTeamPreferences(): TeamPreferences {
    var teamPrefs: TeamPreferences = {};

    var store = ApiC.getAllPreferences.store;
    var key = ApiC.getAllPreferences.strFunc([]);
    var prefsList = store.val(key);
    if (prefsList) {
      _.each(prefsList.preferences_list, (prefs) => {
        teamPrefs[prefs.teamid] = prefs;
      });
    }
    return teamPrefs;
  }

  function updateTeamPreferences(prefs: ApiT.Preferences,
                                 promise: JQueryPromise<any>) {
    var store = ApiC.getAllPreferences.store;
    var key = ApiC.getAllPreferences.strFunc([]);

    var prefsList = store.val(key);
    if (prefsList) {
      var ps = _.filter(prefsList.preferences_list, (p) => {
        return p.teamid != prefs.teamid;
      });
      ps.push(prefs);

      store.push(key, promise, {preferences_list:ps});
    }
  }

  function setupEmailPrefs(prefs: ApiT.Preferences): ApiT.Preferences {
    prefs = _.cloneDeep(prefs);
    if (! prefs.email_types.feedback_summary) {
      prefs.email_types.feedback_summary =
        _.cloneDeep(prefs.email_types.daily_agenda);
    }
    return prefs;
  }

  export class NotificationSettings extends Component<{message?: string}, {}> {
    renderWithData() {
      var teamPrefs = getTeamPreferences();
      return <div id="notification-settings" className="container">
        { this.props.message ?
          <div className="alert alert-info">{this.props.message}</div> :
          null }
        { _.map(Stores.Teams.all(),
          (t) => this.renderTeam(t, teamPrefs[t.teamid]))
        }
      </div>;
    }

    renderTeam(team: ApiT.Team, prefs: ApiT.Preferences) {
      var calendars = Option.cast(
        Calendars.CalendarListStore.val(team.teamid)
      );
      var status = Option.cast(
        Calendars.CalendarListStore.metadata(team.teamid)
      ).match({
        none: () => Model.DataStatus.FETCH_ERROR,
        some: (m) => m.dataStatus
      });

      return <TeamSettings key={team.teamid}
        team={team}
        calendars={calendars}
        prefs={Option.cast(prefs)}
        status={status}
      />;
    }
  }
}
