/*
  Notification settings for a given group
*/

/// <reference path="./Views.GroupSettings.tsx" />

module Esper.Views {

  export class GroupNotificationSettings extends GroupSettings {
    pathFn = Paths.Manage.Group.notifications;

    renderMain(group: ApiT.Group) {
      var groupId = group.groupid;
      var calendars = Stores.Calendars.list(groupId).match({
        none: (): ApiT.GenericCalendar[] => [],
        some: (l) => l
      });

      var prefsOpt = Stores.GroupPreferences.get(groupId);
      var prefs = prefsOpt.match({
        none: () => Stores.GroupPreferences.makeNewPreferences(groupId),
        some: (p) => p
      });
      return <div>
        <GeneralPrefs prefs={prefs} group={group} />
        <BadMeetingPrefs prefs={prefs} group={group} />
      </div>;
    }
  }

  function GeneralPrefs({prefs, group}: {
    prefs: ApiT.GroupPreferences;
    group: ApiT.Group;
  }) {
    let dailyBreakdownReminder = prefs.daily_breakdown;
    let weeklyBreakdownReminder = prefs.weekly_breakdown;
    let email = Login.myEmail();

    return <div className="panel panel-default">
      <div className="panel-heading">
        <i className="fa fa-fw fa-envelope" />{" "}
        { Text.GeneralPrefsHeading }
      </div>
      <div className="panel-body">
        <div className="alert alert-info text-center">
          { Text.generalPrefsDescription(email) }
        </div>

        <div className="esper-select-menu">

          {/* Daily breakdown e-mail */}
          <div className="esper-selectable"
            onClick={() => toggleDailyBreakdownEmails(prefs) }>
            <i className={classNames("fa fa-fw", {
              "fa-check-square-o": dailyBreakdownReminder,
              "fa-square-o": !dailyBreakdownReminder
            }) } />{" "}
            { Text.SendDailyBreakdownEmail }
          </div>

          {/* Weekly breakdown e-mail */}
          <div className="esper-selectable"
            onClick={() => toggleWeeklyBreakdownEmails(prefs) }>
            <i className={classNames("fa fa-fw", {
              "fa-check-square-o": weeklyBreakdownReminder,
              "fa-square-o": !weeklyBreakdownReminder
            }) } />{" "}
            { Text.SendWeeklyBreakdownEmail }
          </div>

        </div>
      </div>
    </div>;
  }

  interface Props {
    prefs: ApiT.GroupPreferences;
    group: ApiT.Group;
  }

  class BadMeetingPrefs extends ReactHelpers.Component<Props, {}> {
    render() {
      let badMeetingWarning = this.props.prefs.bad_meeting_warning;

      return <div className="panel panel-default">
        <div className="panel-heading">
          <i className="fa fa-fw fa-clock-o" />{" "}
          { Text.BadMeetingPrefsHeading }
        </div>
        <div className="panel-body">
          <div className="esper-select-menu">

            {/* Daily breakdown e-mail */}
            <div className="esper-selectable"
              onClick={this.toggleBadMeetingNotifications.bind(this)}>
              <i className={classNames("fa fa-fw", {
                "fa-check-square-o": badMeetingWarning,
                "fa-square-o": !badMeetingWarning
              }) } />{" "}
              { Text.ShowBadMeetingNotifications }
            </div>

          </div>

          <div className="alert alert-info">
            <div className="form-group">
              <label className="col-md-5"
                     htmlFor={this.getId("bad-meeting-duration")}>
                { Text.BadMeetingDuration }
              </label>{" "}
              <input id={this.getId("bad-meeting-duration")} type="number"
                     defaultValue={`${this.props.prefs.bad_duration}`}
                     onChange={this.onBadMeetingDurationChange.bind(this)}
                     disabled={!badMeetingWarning} />
            </div>

            <div className="form-group">
              <label className="col-md-5"
                     htmlFor={this.getId("bad-meeting-people")}>
                { Text.BadMeetingPeople }
              </label>{" "}
              <input id={this.getId("bad-meeting-people")} type="number"
                     defaultValue={`${this.props.prefs.bad_attendees}`}
                     onChange={this.onBadMeetingAttendeesChange.bind(this)}
                     disabled={!badMeetingWarning} />
            </div>
          </div>
        </div>
      </div>;
    }

    toggleBadMeetingNotifications() {
      Actions.GroupPreferences.toggleBadMeetingNotifications(this.props.prefs);
    }

    onBadMeetingDurationChange(e: React.FormEvent) {
      var val = (e.target as HTMLInputElement).value || "20";
      Actions.GroupPreferences.setBadMeetingDuration(
        this.props.prefs, parseInt(val));
    }

    onBadMeetingAttendeesChange(e: React.FormEvent) {
      var val = (e.target as HTMLInputElement).value || "4";
      Actions.GroupPreferences.setBadMeetingAttendees(
        this.props.prefs, parseInt(val));
    }
  }


  /////

  function toggleDailyBreakdownEmails(p: ApiT.GroupPreferences) {
    Actions.GroupPreferences.toggleDailyBreakdownEmails(p);
  }

  function toggleWeeklyBreakdownEmails(p: ApiT.GroupPreferences) {
    Actions.GroupPreferences.toggleWeeklyBreakdownEmails(p);
  }
}
