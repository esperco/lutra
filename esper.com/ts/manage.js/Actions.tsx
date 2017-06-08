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

  export function renderTeamPaySettings(props: TeamSettingProps) {
    let team = Stores.Teams.require(props.teamId);
    Stores.Subscriptions.fetch(team.team_api.team_subscription.cusid);
    render(<Views.TeamPaySettings {...props} />);
    Analytics.page(Analytics.Page.TeamPay);
  }

  export function renderTeamExport(props: TeamSettingProps) {
    render(<Views.TeamExport {...props} />);
    Analytics.page(Analytics.Page.TeamExport);
  }

  export function renderTeamMisc(props: TeamSettingProps) {
    render(<Views.TeamMiscSettings {...props} />);
    Analytics.page(Analytics.Page.TeamMisc);
  }

  export function renderNewTeam(props: {pathFn?: () => Paths.Path}) {
    render(<Views.NewTeam {...props} />);
    Analytics.page(Analytics.Page.NewTeam);
  }


  /* Customer Settings*/

  interface CustomerSettingProps extends SettingProps {
    cusId: string;
    pathFn: (x: {cusId?: string}) => Paths.Path;
  }

  export function renderCustomerGeneralSettings(props: CustomerSettingProps) {
    Route.nav.go(Paths.Manage.Customer.accounts(props));
    // render(<Views.CustomerGeneralSettings {...props} />);
    // Analytics.page(Analytics.Page.CustomerManage);
  }

  export function renderCustomerAccountsSettings(props: CustomerSettingProps) {
    Stores.Subscriptions.fetch(props.cusId);
    render(<Views.CustomerAccountsSettings {...props} />);
    Analytics.page(Analytics.Page.CustomerAccounts);
  }

  export function renderCustomerPaySettings(props: CustomerSettingProps) {
    Route.nav.go(Paths.Manage.Customer.accounts(props));
    // Stores.Subscriptions.fetch(props.cusId);
    // render(<Views.CustomerPaySettings {...props} />);
    // Analytics.page(Analytics.Page.CustomerPay);
  }

  export function renderNewCustomer(props: {pathFn?: () => Paths.Path}) {
    render(<Views.NewCustomer {...props} />);
    Analytics.page(Analytics.Page.NewCustomer);
  }


  /* Misc */

  export function renderErrorPage(err: string) {
    render(<Views.SettingsError err={err} />);
  }

  export function renderSandbox() {
    render(<Views.Sandbox />);
    Analytics.page(Analytics.Page.Sandbox);
  }
}
