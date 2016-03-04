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
          Receive e-mail for meeting feedback
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
            { hasError ? <Components.ErrorMsg /> : null}
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

  export class NotificationSettings extends Component<{message?: string}, {}> {
    renderWithData() {
      return <div className="container">
        { this.props.message ?
          <div className="alert alert-info">{this.props.message}</div> :
          null }
        { _.map(Teams.all(), (t) => this.renderTeam(t)) }
      </div>;
    }

    renderTeam(team: ApiT.Team) {
      var calendars = Option.cast(
        Calendars.CalendarListStore.val(team.teamid)
      );
      var status = Option.cast(
        Calendars.CalendarListStore.metadata(team.teamid)
      ).match({
        none: () => Model.DataStatus.FETCHING,
        some: (m) => m.dataStatus
      });

      return <TeamCalendarSettings key={team.teamid}
        team={team}
        calendars={calendars}
        status={status}
      />;
    }
  }
}
