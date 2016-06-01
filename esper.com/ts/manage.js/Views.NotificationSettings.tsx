/*
  Notification settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class NotificationSettings extends TeamSettings {
    pathFn = Paths.Manage.Team.notifications;

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
            { Text.GeneralPrefsHeading }
          </div>
          <div className="panel-body">{
            prefs.match({
              none: () => <i className="esper-spinner centered" />,
              some: (p) => {
                let prefsWithDefaults = Stores.Preferences.withDefaults(p);
                let sendLabelReminder =
                  emailToggled(prefsWithDefaults.label_reminder);
                let sendFeedbackSummary =
                  emailToggled(prefsWithDefaults.email_types.feedback_summary);
                let sendDailyAgenda =
                  emailToggled(prefsWithDefaults.email_types.daily_agenda);

                return <div className="esper-select-menu">
                  { /* Daily agenda e-mail */ }
                  <div className="esper-selectable"
                       onClick={() => toggleDailyAgenda(prefsWithDefaults)}>
                    <i className={classNames("fa fa-fw", {
                      "fa-check-square-o": sendDailyAgenda,
                      "fa-square-o": !sendDailyAgenda
                    })} />{" "}
                    { Text.SendDailyAgenda }
                  </div>

                  { /* Label reminder e-mail */ }
                  <div className="esper-selectable"
                       onClick={() => toggleLabelReminders(prefsWithDefaults)}>
                    <i className={classNames("fa fa-fw", {
                      "fa-check-square-o": sendLabelReminder,
                      "fa-square-o": !sendLabelReminder
                    })} />{" "}
                    { Text.SendLabelReminder }
                  </div>

                  { /* Feedback summary e-mail */ }
                  <div className="esper-selectable"
                       onClick={() => toggleFeedbackSummary(prefsWithDefaults)}>
                    <i className={classNames("fa fa-fw", {
                      "fa-check-square-o": sendFeedbackSummary,
                      "fa-square-o": !sendFeedbackSummary
                    })} />{" "}
                    { Text.SendFeedbackSummary }
                  </div>
                </div>;
            }})
          }</div>
        </div>
      </div>;
    }
  }


  /////

  /* Handles two variants of recipient list */
  type RecipientList = { recipients: string[] }|{ recipients_: string[] };

  function emailToggled(emailPrefs: RecipientList) {
    var recipients = hasRecipients(emailPrefs) ?
      emailPrefs.recipients :
      emailPrefs.recipients_;
    return _.includes(recipients, Login.myEmail());
  }

  function hasRecipients(emailPrefs: RecipientList)
    : emailPrefs is { recipients: string[] }
  {
    return emailPrefs.hasOwnProperty('recipients');
  }


  /////

  function toggleDailyAgenda(p: Stores.Preferences.PrefsWithDefaults) {
    Actions.Preferences.toggleDailyAgenda(p);
  }

  function toggleFeedbackSummary(p: Stores.Preferences.PrefsWithDefaults) {
    Actions.Preferences.toggleFeedbackSummary(p);
  }

  function toggleLabelReminders(p: Stores.Preferences.PrefsWithDefaults) {
    Actions.Preferences.toggleLabelReminders(p);
  }
}

