/// <reference path="../lib/ApiC.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.ErrorMsg.tsx" />

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
      newCal.prefs = _.extend(newCal.prefs, prefs);

      var calendarList = _.clone(Calendars.CalendarListStore.val(teamId));
      var index = _.findIndex(calendarList, (c) => c.id === calId);
      calendarList[index] = newCal;

      Calendars.CalendarListStore.push(teamId, p, calendarList);
    }

    toggleUseEmail() {
      var current = this.props.cal.prefs.email_for_meeting_feedback;
      this.updateCalendarPrefs({
        email_for_meeting_feedback: !current
      });
    }

    toggleUseSlack() {
      var current = this.props.cal.prefs.slack_for_meeting_feedback;
      this.updateCalendarPrefs({
        slack_for_meeting_feedback: !current
      });

      // Check if we need Slack authorization
      if (! current) {
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
      var prefs = this.props.cal.prefs || {};
      return <div className="esper-select-menu">
        <div className="esper-select-header">
          { this.props.cal.title }
        </div>
        <div className="esper-selectable" onClick={() => this.toggleUseEmail()}>
          <i className={"fa fa-fw " + (
            prefs.email_for_meeting_feedback ?
            "fa-check-square-o" : "fa-square-o"
          )} />{" "}
          Receive email for meeting feedback
        </div>
        <div className="esper-selectable" onClick={() => this.toggleUseSlack()}>
          <i className={"fa fa-fw " + (
            prefs.slack_for_meeting_feedback ?
            "fa-check-square-o" : "fa-square-o"
          )} />{" "}
          Receive Slack message for meeting feedback
        </div>
      </div>;
    }
  }

  function TeamCalendarSettings({team, calendars, status}: {
    team: ApiT.Team;
    calendars: Option.T<ApiT.GenericCalendar[]>;
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
          </div>
        </div>;
      }
    });
  }

  function prefsHasLabelReminders(prefs: ApiT.Preferences): boolean {
    return prefs.label_reminder
        && prefs.label_reminder.recipients_
        && 0 <= _.indexOf(prefs.label_reminder.recipients_, Login.myEmail());
  }

  class GeneralPrefs extends Component<{
    prefsList: Option.T<ApiT.PreferencesList>;
    status: Model.DataStatus;
  }, {}> {
    render() {
      var status = this.props.status;
      var isBusy = (
        status === Model.DataStatus.FETCHING ||
        status === Model.DataStatus.INFLIGHT);
      var hasError = (
        status === Model.DataStatus.PUSH_ERROR ||
        status === Model.DataStatus.FETCH_ERROR);

      return this.props.prefsList.match({
        none: () => {
          if (! isBusy) {
            return <span />;
          }
          return <div className="esper-spinner esper-centered esper-large" />;
        },
        some: (p) => {
          var sendLabelReminders = this.sendLabelReminders();
          return <div className="panel panel-default">
            <div className="panel-heading">
              <i className="fa fa-fw fa-envelope" />{" "}
              E-mail Subscriptions
              {isBusy ? <span className="esper-spinner" /> : null}
            </div>
            <div className="panel-body">
              { hasError ? <Components.ErrorMsg /> : null }
              <div className="esper-select-menu">
                <div className="esper-selectable"
                     onClick={() => this.toggleLabelReminders()}>
                  <i className={"fa fa-fw " + (
                    sendLabelReminders ?
                    "fa-check-square-o" : "fa-square-o"
                  )} />{" "}
                  Send reminder emails to label calendar events
                </div>
              </div>
            </div>
          </div>
        }
      });
    }

    sendLabelReminders(): boolean {
      return this.props.prefsList.match({
        none: () => false,
        some: (p) => {
          return _.some(p.preferences_list, prefsHasLabelReminders);
        }
      });
    }

    toggleLabelReminders() {
      this.props.prefsList.match({
        none: () => null,
        some: (p) => {
          var prefsList = _.cloneDeep(p);
          var prefsWithLabelReminders = _.filter(prefsList.preferences_list,
                                                 prefsHasLabelReminders);

          var store = ApiC.getAllPreferences.store;
          var storeKey = ApiC.getAllPreferences.strFunc([]);

          // If enabling label-reminders, only enable for first team
          if (prefsWithLabelReminders.length === 0) {
            let prefs = prefsList.preferences_list[0];
            let teamId = prefs.teamid;
            if (! prefsHasLabelReminders(prefs)) {
              if (! prefs.label_reminder) {
                prefs.label_reminder = {recipients_:[Login.myEmail()]};
              } else if (! prefs.label_reminder.recipients_) {
                prefs.label_reminder.recipients_ = [Login.myEmail()];
              } else {
                prefs.label_reminder.recipients_.push(Login.myEmail());
              }
            }
            let promise = Api.setLabelReminderPrefs(teamId,
                            prefs.label_reminder);
            store.push(storeKey, promise, prefsList);
          }

          // If disabling label-reminders, disable for all teams
          else {
            var promises: JQueryPromise<any>[] = [];
            _.each(prefsWithLabelReminders, (prefs) => {
              let teamId = prefs.teamid;
              if (prefs.label_reminder && prefs.label_reminder.recipients_) {
                prefs.label_reminder.recipients_ =
                  _.without(prefs.label_reminder.recipients_, Login.myEmail());
              }
              promises.push(Api.setLabelReminderPrefs(teamId,
                              prefs.label_reminder))
            });
            let promise = $.when.apply($, promises);
            store.push(storeKey, promise, prefsList);
          }
        }
      });
    }
  }

  export class NotificationSettings extends Component<{message?: string}, {}> {
    renderWithData() {
      return <div className="container">
        { this.props.message ?
          <div className="alert alert-info">{this.props.message}</div> :
          null }
        { _.map(Teams.all(), (t) => this.renderTeam(t)) }
        { this.renderGeneralPrefs() }
      </div>;
    }

    renderTeam(team: ApiT.Team) {
      var calendars = Option.cast(
        Calendars.CalendarListStore.val(team.teamid)
      );
      var status = Option.cast(
        Calendars.CalendarListStore.metadata(team.teamid)
      ).match({
        none: () => Model.DataStatus.FETCH_ERROR,
        some: (m) => m.dataStatus
      });

      return <TeamCalendarSettings key={team.teamid}
        team={team}
        calendars={calendars}
        status={status}
      />;
    }

    renderGeneralPrefs() {
      var store = ApiC.getAllPreferences.store;
      var key = ApiC.getAllPreferences.strFunc([]);
      var prefsList = Option.cast(store.val(key));
      var status = Option.cast(store.metadata(key)).match({
        none: () => Model.DataStatus.FETCH_ERROR,
        some: (m) => m.dataStatus
      });
      return <GeneralPrefs prefsList={prefsList} status={status} />;
    }
  }
}
