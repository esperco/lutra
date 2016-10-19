/*
  Base namespace for actions -- in particular, actions that render a view
  or do other one-off or asynchronous things necessary to render a view.
*/

module Esper.Actions {
  // Render with App container
  export function render(main: React.ReactElement<any>) {
    Layout.render(<Views.App>
      { main }
    </Views.App>);
  }

  export function renderPersonalSettings(props: {
    pathFn?: () => Paths.Path
  }) {
    render(<Views.PersonalSettings {...props} />);
    Analytics.page(Analytics.Page.PersonalSettings);
  }


  /* Team Settings */

  interface SettingProps {
    err?: string;
    msg?: string;
  }

  interface TeamSettingProps extends SettingProps {
    teamId: string;
    pathFn: (x: {teamId?: string}) => Paths.Path;
  }

  export function renderTeamGeneralSettings(props: TeamSettingProps)
  {
    render(<Views.TeamGeneralSettings {...props} />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderTeamCalendarSettings(props: TeamSettingProps) {
    Stores.Calendars.fetchAvailable(props.teamId);
    render(<Views.TeamCalendarSettings {...props} />);
    Analytics.page(Analytics.Page.TeamCalendars);
  }

  export function renderTeamLabelSettings(props: TeamSettingProps) {
    render(<Views.TeamLabelSettings {...props} />);
    Analytics.page(Analytics.Page.TeamLabels);
  }

  export function renderTeamNotificationSettings(props: TeamSettingProps) {
    Stores.TeamPreferences.checkSlack(props.teamId);
    render(<Views.TeamNotificationSettings {...props} />);
    Analytics.page(Analytics.Page.TeamNotifications);
  }

  export function renderTeamPaySettings(props: TeamSettingProps) {
    let team = Stores.Teams.require(props.teamId);
    Stores.Subscriptions.fetch(team.team_api.team_subscription.cusid);
    render(<Views.TeamPaySettings {...props} />);
    Analytics.page(Analytics.Page.TeamPay);
  }

  export function renderNewTeam(props: {pathFn?: () => Paths.Path}) {
    render(<Views.NewTeam {...props} />);
    Analytics.page(Analytics.Page.NewTeam);
  }


  /* Group Settings */

  interface GroupSettingProps extends SettingProps {
    groupId: string;
    pathFn: (x: {groupId?: string}) => Paths.Path;
  }

  export function renderGroupGeneralSettings(props: GroupSettingProps) {
    render(<Views.GroupGeneralSettings {...props} />);
    Analytics.page(Analytics.Page.GroupManage);
  }

  export function renderGroupLabelSettings(props: GroupSettingProps) {
    render(<Views.GroupLabelSettings {...props} />);
    Analytics.page(Analytics.Page.GroupLabels);
  }

  export function renderGroupNotificationSettings(props: GroupSettingProps) {
    render(<Views.GroupNotificationSettings {...props} />);
    Analytics.page(Analytics.Page.GroupNotifications);
  }

  export function renderNewGroup(props: {pathFn?: () => Paths.Path}) {
    render(<Views.NewGroup {...props} />);
    Analytics.page(Analytics.Page.NewGroup);
  }


  /* Customer Settings*/

  interface CustomerSettingProps extends SettingProps {
    cusId: string;
    pathFn: (x: {cusId?: string}) => Paths.Path;
  }

  export function renderCustomerGeneralSettings(props: CustomerSettingProps) {
    render(<Views.CustomerGeneralSettings {...props} />);
    Analytics.page(Analytics.Page.CustomerManage);
  }

  export function renderCustomerAccountsSettings(props: CustomerSettingProps) {
    render(<Views.CustomerAccountsSettings {...props} />);
    Analytics.page(Analytics.Page.CustomerAccounts);
  }

  export function renderCustomerPaySettings(props: CustomerSettingProps) {
    render(<Views.CustomerPaySettings {...props} />);
    Analytics.page(Analytics.Page.CustomerPay);
  }

  export function renderNewCustomer(props: {pathFn?: () => Paths.Path}) {
    render(<Views.NewCustomer {...props} />);
    Analytics.page(Analytics.Page.NewCustomer);
  }


  /* Misc */

  export function renderSandbox() {
    render(<Views.Sandbox />);
    Analytics.page(Analytics.Page.Sandbox);
  }
}
