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

  export function renderTeamGeneralSettings(teamId?: string,
    msgCode?: string, errCode?: string)
  {
    var teamId = Params.cleanTeamId(teamId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);
    render(<Views.TeamGeneralSettings teamId={teamId}
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

  export function renderTeamLabelSettings(teamId?: string,
    msgCode?: string, errCode?: string)
  {
    var teamId = Params.cleanTeamId(teamId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);
    render(<Views.TeamLabelSettings teamId={teamId}
            msg={msg} err={err}  />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderTeamNotificationSettings(teamId?: string,
    msgCode?: string, errCode?: string)
  {
    var teamId = Params.cleanTeamId(teamId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);

    Stores.TeamPreferences.checkSlack(teamId);
    render(<Views.TeamNotificationSettings teamId={teamId}
            msg={msg} err={err} />);
    Analytics.page(Analytics.Page.TeamManage);
  }

  export function renderTeamPaySettings(teamId?: string,
    msgCode?: string, errCode?: string)
  {
    var teamId = Params.cleanTeamId(teamId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);
    render(<Views.TeamPaySettings teamId={teamId}
            msg={msg} err={err} />);
    Analytics.page(Analytics.Page.TeamPay);
  }

  export function renderNewTeam() {
    render(<Views.NewTeam />);
    Analytics.page(Analytics.Page.NewTeam);
  }

  export function renderGroupGeneralSettings(groupId?: string,
    msgCode?: string, errCode?: string)
  {
    var groupId = Params.cleanGroupId(groupId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);
    render(<Views.GroupGeneralSettings groupId={groupId}
            msg={msg} err={err} />);
    Analytics.page(Analytics.Page.GroupManage);
  }

  export function renderGroupLabelSettings(groupId?: string,
    msgCode?: string, errCode?: string)
  {
    var groupId = Params.cleanGroupId(groupId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);
    render(<Views.GroupLabelSettings groupId={groupId}
            msg={msg} err={err} />);
    Analytics.page(Analytics.Page.GroupManage);
  }

  export function renderGroupNotificationSettings(groupId?: string,
    msgCode?: string, errCode?: string)
  {
    var groupId = Params.cleanGroupId(groupId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);
    render(<Views.GroupNotificationSettings groupId={groupId}
            msg={msg} err={err} />);
    Analytics.page(Analytics.Page.GroupManage);
  }

  export function renderNewGroup() {
    render(<Views.NewGroup />);
    Analytics.page(Analytics.Page.NewGroup);
  }

  export function renderCustomerGeneralSettings(custId?: string,
    msgCode?: string, errCode?: string)
  {
    custId = Params.cleanCustomerId(custId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);
    render(<Views.CustomerGeneralSettings {...{custId, msg, err}}/>);
    Analytics.page(Analytics.Page.CustomerManage);
  }

  export function renderCustomerAccountsSettings(custId?: string,
    msgCode?: string, errCode?: string)
  {
    custId = Params.cleanCustomerId(custId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);
    render(<Views.CustomerAccountsSettings {...{custId, msg, err}}/>);
    Analytics.page(Analytics.Page.CustomerAccounts);
  }

  export function renderCustomerPaySettings(custId?: string,
    msgCode?: string, errCode?: string)
  {
    custId = Params.cleanCustomerId(custId);
    var msg = ManageMsg.get(msgCode);
    var err = ManageMsg.get(errCode);
    render(<Views.CustomerPaySettings {...{custId, msg, err}}/>);
    Analytics.page(Analytics.Page.CustomerPay);
  }

  export function renderNewCustomer() {
    render(<Views.NewCustomer />);
    Analytics.page(Analytics.Page.NewCustomer);
  }

  export function renderSandbox() {
    render(<Views.Sandbox />);
    Analytics.page(Analytics.Page.Sandbox);
  }
}
