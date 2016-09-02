/*
  Notification settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamNotificationSettings extends TeamSettings {
    pathFn = Paths.Manage.Team.notifications;

    renderMain(team: ApiT.Team) {
      var teamId = team.teamid;
      var calendars = Stores.Calendars.list(teamId).match({
        none: (): ApiT.GenericCalendar[] => [],
        some: (l) => l
      });

      var prefs = Stores.TeamPreferences.get(team.teamid);
      var slackAuthorized = Stores.TeamPreferences.slackAuthorized(team.teamid);
      return prefs.match({
        none: () => <i className="esper-spinner" />,
        some: (p) => {
          let prefsWithDefaults = Stores.TeamPreferences.withDefaults(p);

          return <div>
            <GeneralPrefs prefs={prefsWithDefaults} team={team} />
            <FeedbackPrefs prefs={prefsWithDefaults} team={team}
              slackAuthorized={slackAuthorized}
            />
          </div>;
        }
      });
    }
  }

  function GeneralPrefs({prefs, team}: {
    prefs: Stores.TeamPreferences.PrefsWithDefaults;
    team: ApiT.Team;
  }) {
    let sendLabelReminder = emailToggled(prefs.label_reminder);
    let sendFeedbackSummary = emailToggled(prefs.email_types.feedback_summary);
    let sendDailyAgenda = emailToggled(prefs.email_types.daily_agenda);
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
  function FeedbackPrefs({prefs, slackAuthorized, team}: {
    prefs: Stores.TeamPreferences.PrefsWithDefaults;
    slackAuthorized: Option.T<boolean>;
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
    var showSlackError = sendSlack && !execTeam && !slackAuthorized.match({
      none: () => true,
      some: (d) => d
    });

    return <div className="panel panel-default">
      <div className="panel-heading">
        <i className="fa fa-fw fa-mail-reply" />{" "}
        { Text.FeedbackHeading }
      </div>
      <div className="panel-body">
        <div className="alert alert-info text-center">
          { execTeam ?
            Text.execOnlyFeedbackDescription(email) :
            Text.feedbackDescription(email) }
        </div>

        { execTeam ? null :
          <div className="esper-panel-section">
            <div className="esper-panel-section">
              <div className="esper-select-menu">
                <div className="esper-selectable"
                     onClick={() => toggleEmailFeedback(prefs)}>
                  <i className={classNames("fa fa-fw", {
                    "fa-check-square-o": sendEmail,
                    "fa-square-o": !sendEmail
                  })} />{" "}
                  { Text.SendFeedbackEmail }
                </div>

                <div className="esper-selectable"
                     onClick={() => toggleSlackFeedback(prefs)}>
                  <i className={classNames("fa fa-fw", {
                    "fa-check-square-o": sendSlack,
                    "fa-square-o": !sendSlack
                  })} />{" "}
                  { Text.SendFeedbackSlack }
                </div>

                { showSlackError ? <SlackError teamId={team.teamid} /> : null }
              </div>
            </div>
            <div className="esper-panel-section">
              <FeedbackTiming prefs={prefs} />
            </div>
          </div>
        }
      </div>
    </div>;
  }

  function SlackError({teamId}: {teamId: string}) {
    var onClick = () => {
      Api.getSlackAuthInfo(teamId).then((x) => {
        if (! x.slack_authorized) {
          location.href = x.slack_auth_url
        }
      });
    }

    return <div className="alert alert-danger alert-bottom text-center"
                onClick={onClick}>
      <i className="fa fa-fw fa-warning" />{" "}
      <a>{/* Link doesn't do anything because onClick above handles */}
        { Text.SlackAuthError }
      </a>
    </div>
  }

  function FeedbackTiming({prefs}: {
    prefs: Stores.TeamPreferences.PrefsWithDefaults
  }) {
    var timeToNotify =
      prefs.timestats_notify.time_to_notify_since_meeting_start || 0;
    var selected = (() => {
      if (timeToNotify >= 1) return "1";
      if (! timeToNotify) return "0";
      return "0.5";
    })();

    return <div>
      <label>{ Text.FeedbackTiming }</label>
      <Components.RadioList
        choices={[
          { id: "0", displayAs: Text.FeedbackTimingStart },
          { id: "0.5", displayAs: Text.FeedbackTimingMiddle },
          { id: "1", displayAs: Text.FeedbackTimingEnd },
        ]}
        selectedId={selected}
        updateFn={(id) =>
          Actions.TeamPreferences.updateNotifTiming(prefs, parseFloat(id))
        }
      />
    </div>;
  }


  /////

  /* Handles two variants of recipient list */
  type RecipientList = { recipients: string[] }|{ recipients_: string[] };

  function emailToggled(emailPrefs?: RecipientList) {
    if (! emailPrefs) {
      return false;
    }
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

  function toggleDailyAgenda(p: Stores.TeamPreferences.PrefsWithDefaults) {
    Actions.TeamPreferences.toggleDailyAgenda(p);
  }

  function toggleFeedbackSummary(p: Stores.TeamPreferences.PrefsWithDefaults) {
    Actions.TeamPreferences.toggleFeedbackSummary(p);
  }

  function toggleLabelReminders(p: Stores.TeamPreferences.PrefsWithDefaults) {
    Actions.TeamPreferences.toggleLabelReminders(p);
  }

  function toggleEmailFeedback(p: Stores.TeamPreferences.PrefsWithDefaults) {
    Actions.TeamPreferences.toggleEmailFeedback(p);
  }

  function toggleSlackFeedback(p: Stores.TeamPreferences.PrefsWithDefaults) {
    Actions.TeamPreferences.toggleSlackFeedback(p);
  }
}

