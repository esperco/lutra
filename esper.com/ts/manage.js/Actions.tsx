/*
  Base namespace for actions -- in particular, actions that render a view
  or do other one-off or asynchronous things necessary to render a view.
*/

module Esper.Actions {
  // Set defaults for header and footer render
  export function render(main: React.ReactElement<any>,
                         header?: React.ReactElement<any>,
                         footer?: React.ReactElement<any>) {
    if (header !== null) { // Null => intentionally blank
      header = header || <Views.Header active={Views.Header_.Tab.Manage} />;
    }
    Layout.render(main, header, footer);
  }

  export function renderGeneralSettings(teamId?: string,
    msgCode?: string, errCode?: string)
  {
    var teamId = Params.cleanTeamId(teamId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);
    render(<Views.GeneralSettings teamId={teamId}
            msg={msg} err={err} />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderCalendarSettings(teamId?: string,
    msgCode?: string, errCode?: string)
  {
    var teamId = Params.cleanTeamId(teamId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);

    Stores.Calendars.fetchAvailable(teamId);
    render(<Views.CalendarSettings teamId={teamId}
            msg={msg} err={err}  />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderLabelSettings(teamId?: string,
    msgCode?: string, errCode?: string)
  {
    var teamId = Params.cleanTeamId(teamId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);
    render(<Views.LabelSettings teamId={teamId}
            msg={msg} err={err}  />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderNotificationSettings(teamId?: string,
    msgCode?: string, errCode?: string)
  {
    var teamId = Params.cleanTeamId(teamId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);

    Stores.Preferences.checkSlack(teamId);
    render(<Views.NotificationSettings teamId={teamId}
            msg={msg} err={err} />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderNewTeam() {
    render(<Views.NewTeam />);
    Analytics.page(Analytics.Page.NewTeam);
  }

  export function renderNewGroup() {
    render(<Views.NewGroup />);
    Analytics.page(Analytics.Page.NewGroup);
  }
}
