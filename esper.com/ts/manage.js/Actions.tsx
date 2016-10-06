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

  export function renderPersonalSettings() {
    render(<Views.PersonalSettings />);
    Analytics.page(Analytics.Page.PersonalSettings);
  }


  /* Team Settings */

  interface SettingProps {
    err?: string;
    msg?: string;
  }

  interface TeamSettingProps extends SettingProps {
    teamId: string;
  }

  export function renderTeamGeneralSettings(props: TeamSettingProps)
  {
    render(<Views.TeamGeneralSettings {...props} />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderCalendarSettings(props: TeamSettingProps) {
    Stores.Calendars.fetchAvailable(props.teamId);
    render(<Views.CalendarSettings {...props} />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderTeamLabelSettings(props: TeamSettingProps) {
    render(<Views.TeamLabelSettings {...props} />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderTeamNotificationSettings(props: TeamSettingProps) {
    Stores.TeamPreferences.checkSlack(props.teamId);
    render(<Views.TeamNotificationSettings {...props} />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderTeamPaySettings(props: TeamSettingProps) {
    render(<Views.TeamPaySettings {...props} />);
    Analytics.page(Analytics.Page.TeamPay);
  }

  export function renderNewTeam() {
    render(<Views.NewTeam />);
    Analytics.page(Analytics.Page.NewTeam);
  }


  /* Group Settings */

  interface GroupSettingProps extends SettingProps {
    groupId: string;
  }

  export function renderGroupGeneralSettings(props: GroupSettingProps) {
    render(<Views.GroupGeneralSettings {...props} />);
    Analytics.page(Analytics.Page.GroupManage);
  }

  export function renderGroupLabelSettings(props: GroupSettingProps) {
    render(<Views.GroupLabelSettings {...props} />);
    Analytics.page(Analytics.Page.GroupManage);
  }

  export function renderGroupNotificationSettings(props: GroupSettingProps) {
    render(<Views.GroupNotificationSettings {...props} />);
    Analytics.page(Analytics.Page.GroupManage);
  }

  export function renderNewGroup() {
    render(<Views.NewGroup />);
    Analytics.page(Analytics.Page.NewGroup);
  }


  /* Customer Settings*/

  interface CustomerSettingProps extends SettingProps {
    cusId: string;
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

  export function renderNewCustomer() {
    render(<Views.NewCustomer />);
    Analytics.page(Analytics.Page.NewCustomer);
  }


  /* Misc */

  export function renderSandbox() {
    render(<Views.Sandbox />);
    Analytics.page(Analytics.Page.Sandbox);
  }
}
