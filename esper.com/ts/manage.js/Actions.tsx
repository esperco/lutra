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
      header = header || <Views.Header />;
    }
    Layout.render(main, header, footer);
  }

  export function renderGeneralSettings(teamId?: string) {
    var teamId = Params.cleanTeamId(teamId);
    render(<Views.GeneralSettings teamId={teamId} />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderCalendarSettings(teamId?: string) {
    var teamId = Params.cleanTeamId(teamId);

    Stores.Calendars.fetchAvailable(teamId);
    render(<Views.CalendarSettings teamId={teamId} />);

    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderLabelSettings(teamId?: string) {
    var teamId = Params.cleanTeamId(teamId);
    render(<Views.LabelSettings teamId={teamId} />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderNotificationSettings(teamId?: string) {
    var teamId = Params.cleanTeamId(teamId);
    render(<Views.NotificationSettings teamId={teamId} />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderNewTeam() {
    render(<Views.NewTeam />);
    Analytics.page(Analytics.Page.NewTeam);
  }
}
