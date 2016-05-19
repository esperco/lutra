/*
  Notification settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class NotificationSettings extends TeamSettings {
    renderMain(team: ApiT.Team) {
      var teamId = team.teamid;
      var calendars = Stores.Calendars.list(teamId).match({
        none: (): ApiT.GenericCalendar[] => [],
        some: (l) => l
      });

      var prefs = Stores.Preferences.get(team.teamid);

      return <div>
        <div className="panel panel-default">
          <div className="panel-heading">
            <i className="fa fa-fw fa-envelope-o" />{" "}
            { Text.SendDailyAgenda }
          </div>
          <div className="panel-body">
            <CalendarPrefsList
              calendars={calendars}
              isActiveFn={(c) => c.prefs && c.prefs.add_to_daily_agenda}
              onToggle={(c) => toggleDailyAgenda(teamId, c)}
            />
          </div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <i className="fa fa-fw fa-envelope-o" />{" "}
            { Text.SendFeedbackEmail }
          </div>
          <div className="panel-body">
            <CalendarPrefsList
              calendars={calendars}
              isActiveFn={(c) => c.prefs && c.prefs.email_for_meeting_feedback}
              onToggle={(c) => toggleEmailFeedback(teamId, c)}
            />
          </div>
        </div>

         <div className="panel panel-default">
          <div className="panel-heading">
            <i className="fa fa-fw fa-envelope-o" />{" "}
            { Text.GeneralPrefsHeading }
          </div>
          <div className="panel-body">

            {
              prefs.match({
                none: () => <i className="esper-spinner centered" />,
                some: (p) => {
                  let sendLabelReminder = p.label_reminder &&
                    p.label_reminder.recipients_ &&
                    _.includes(p.label_reminder.recipients_, Login.myEmail());

                  let feedbackSummary = p.email_types.feedback_summary
                  let sendFeedbackSummary = feedbackSummary &&
                    _.includes(feedbackSummary.recipients, Login.myEmail());
                  return <div className="esper-select-menu">

                    { /* Label reminder e-mail */ }
                    <div className="esper-selectable"
                         onClick={() => toggleLabelReminders(p)}>
                      <i className={classNames("fa fa-fw", {
                        "fa-check-square-o": sendLabelReminder,
                        "fa-square-o": !sendLabelReminder
                      })} />{" "}
                      { Text.SendLabelReminder }
                    </div>

                    { /* Feedback summary e-mail */ }
                    <div className="esper-selectable"
                         onClick={() => toggleFeedbackSummary(p)}>
                      <i className={classNames("fa fa-fw", {
                        "fa-check-square-o": sendFeedbackSummary,
                        "fa-square-o": !sendFeedbackSummary
                      })} />{" "}
                      { Text.SendFeedbackSummary }
                    </div>
                  </div>;
              }})
            }
          </div>
        </div>
      </div>;
    }
  }


  function CalendarPrefsList({calendars, isActiveFn, onToggle} : {
    calendars: ApiT.GenericCalendar[];
    isActiveFn: (cal: ApiT.GenericCalendar) => boolean;
    onToggle: (cal: ApiT.GenericCalendar) => void;
  }) {
    return <div className="esper-select-menu">{
      _.map(calendars, (c) => {
        let active = isActiveFn(c);
        return <div key={c.id} className={classNames("esper-selectable", {
                      active: active
                    })}>
          <i className={classNames("fa", "fa-fw", {
            "fa-calendar-o": !active,
            "fa-calendar-check-o": active
          })} />{" "}
          { c.title || <span className="esper-placeholder" /> }
        </div>
      })
    }</div>;
  }


  ////

  function toggleDailyAgenda(teamId: string, cal: ApiT.GenericCalendar) {
    var newPrefs = _.cloneDeep(cal.prefs || {} as ApiT.CalendarPrefs);
    newPrefs.add_to_daily_agenda = !newPrefs.add_to_daily_agenda;
    Actions.Calendars.updatePrefs(teamId, cal.id, newPrefs);
  }

  function toggleEmailFeedback(teamId: string, cal: ApiT.GenericCalendar) {
    var newPrefs = _.cloneDeep(cal.prefs || {} as ApiT.CalendarPrefs);
    newPrefs.email_for_meeting_feedback = !newPrefs.email_for_meeting_feedback;
    Actions.Calendars.updatePrefs(teamId, cal.id, newPrefs);
  }

  function toggleLabelReminders(prefs: ApiT.Preferences) {
    prefs = _.cloneDeep(prefs);
    prefs.label_reminder = prefs.label_reminder || {};
    prefs.label_reminder.recipients_ = prefs.label_reminder.recipients_ || [];

    if (_.includes(prefs.label_reminder.recipients_, Login.myEmail())) {
      _.pull(prefs.label_reminder.recipients_, Login.myEmail())
    } else {
      prefs.label_reminder.recipients_.push(Login.myEmail())
    }

    Actions.Preferences.setLabelReminders(prefs.teamid,
                                          prefs.label_reminder);
  }

  function toggleFeedbackSummary(prefs: ApiT.Preferences) {
    prefs = _.cloneDeep(prefs);
    if (! prefs.email_types.feedback_summary) {
      prefs.email_types.feedback_summary =
        _.cloneDeep(prefs.email_types.daily_agenda);
      prefs.email_types.feedback_summary.recipients = [];
    }

    if (_.includes(prefs.email_types.feedback_summary.recipients,
                   Login.myEmail())) {
      _.pull(prefs.email_types.feedback_summary.recipients, Login.myEmail());
    } else {
      prefs.email_types.feedback_summary.recipients.push(Login.myEmail());
    }

    Actions.Preferences.setEmailTypes(prefs.teamid, prefs.email_types);
  }
}
