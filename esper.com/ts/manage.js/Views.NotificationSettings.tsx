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
      return prefs.match({
        none: () => <i className="esper-spinner centered" />,
        some: (p) => {
          let prefsWithDefaults = Stores.Preferences.withDefaults(p);

          return <div>
            <GeneralPrefs prefs={prefsWithDefaults} team={team} />
            <FeedbackPrefs prefs={prefsWithDefaults} team={team} />
          </div>;
        }
      });
    }
  }

  function GeneralPrefs({prefs, team}: {
    prefs: Stores.Preferences.PrefsWithDefaults;
    team: ApiT.Team;
  }) {
    let sendLabelReminder = emailToggled(prefs.label_reminder);
    let sendFeedbackSummary = emailToggled(prefs.email_types.feedback_summary);
    let sendDailyAgenda = emailToggled(prefs.email_types.daily_agenda);
    let email = Login.myEmail();

    return <div className="panel panel-default">
      <div className="panel-heading">
        { Text.GeneralPrefsHeading }
      </div>
      <div className="panel-body">
        <div className="alert alert-info">
          { Text.generalPrefsDescription(email) }
        </div>

        <div className="esper-select-menu">

          {/* Daily agenda e-mail */}
          <div className="esper-selectable"
               onClick={() => toggleDailyAgenda(prefs)}>
            <i className={classNames("fa fa-fw", {
              "fa-check-square-o": sendDailyAgenda,
              "fa-square-o": !sendDailyAgenda
            })} />{" "}
            { Text.SendDailyAgenda }
          </div>

          {/* Label reminder e-mail */}
          <div className="esper-selectable"
               onClick={() => toggleLabelReminders(prefs)}>
            <i className={classNames("fa fa-fw", {
              "fa-check-square-o": sendLabelReminder,
              "fa-square-o": !sendLabelReminder
            })} />{" "}
            { Text.SendLabelReminder }
          </div>

          { /* Feedback summary e-mail */ }
          <div className="esper-selectable"
               onClick={() => toggleFeedbackSummary(prefs)}>
            <i className={classNames("fa fa-fw", {
              "fa-check-square-o": sendFeedbackSummary,
              "fa-square-o": !sendFeedbackSummary
            })} />{" "}
            { Text.SendFeedbackSummary }
          </div>

        </div>
      </div>
    </div>;
  }


  /*
    NB: Feedback preferences can only be set by team exec (since this
    pings exec directly and in some cases, as with Slack, we need that exec
    to authorize Esper access.
  */
  function FeedbackPrefs({prefs, team}: {
    prefs: Stores.Preferences.PrefsWithDefaults;
    team: ApiT.Team;
  }) {
    var execTeam = team.team_executive !== Login.myUid();
    var email = execTeam ?
      Stores.Profiles.get(team.team_executive).match({
        none: () => Login.myEmail(),
        some: (p) => p.email
      }) :
      Login.myEmail();

    var sendEmail = prefs.timestats_notify.email_for_meeting_feedback;
    var sendSlack = prefs.timestats_notify.slack_for_meeting_feedback;

    return <div className="panel panel-default">
      <div className="panel-heading">
        { Text.FeedbackHeading }
      </div>
      <div className="panel-body">
        <div className="alert alert-info">
          { execTeam ?
            Text.execOnlyFeedbackDescription(email) :
            Text.feedbackDescription(email) }
        </div>

        { execTeam ? null :
          <div className="esper-select-menu">
            <div className="esper-selectable"
                 onClick={() => null}>
              <i className={classNames("fa fa-fw", {
                "fa-check-square-o": sendEmail,
                "fa-square-o": !sendEmail
              })} />{" "}
              { Text.SendFeedbackEmail }
            </div>

            <div className="esper-selectable"
                 onClick={() => null}>
              <i className={classNames("fa fa-fw", {
                "fa-check-square-o": sendSlack,
                "fa-square-o": !sendSlack
              })} />{" "}
              { Text.SendFeedbackSlack }
            </div>
          </div> }
      </div>
    </div>;
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

