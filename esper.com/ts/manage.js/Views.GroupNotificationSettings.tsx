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
      </div>;
    }
  }

  function GeneralPrefs({prefs, group}: {
    prefs: ApiT.GroupPreferences;
    group: ApiT.Group;
  }) {
    let sendLabelReminder = prefs.label_reminder;
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

          {/* Label reminder e-mail */}
          <div className="esper-selectable"
            onClick={() => toggleLabelReminders(prefs) }>
            <i className={classNames("fa fa-fw", {
              "fa-check-square-o": sendLabelReminder,
              "fa-square-o": !sendLabelReminder
            }) } />{" "}
            { Text.SendLabelReminder }
          </div>

        </div>
      </div>
    </div>;
  }


  /////

  function toggleLabelReminders(p: ApiT.GroupPreferences) {
    Actions.GroupPreferences.toggleLabelReminders(p);
  }
}
