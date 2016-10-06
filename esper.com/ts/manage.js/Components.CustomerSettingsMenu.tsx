/*
  A quick menu to switch between different tabs for a given group's settings
*/

module Esper.Components {
  export function CustomerSettingsMenu({cust, pathFn}: {
    cust: ApiT.Customer;
    pathFn?: (p: {custId: string}) => Paths.Path;
  }) {
    var custId = cust.id;
    return <div className="esper-content-header settings-menu fixed padded">
      <SettingsMenuLink custId={custId} text={Text.CustomerGeneral}
        pathFn={Paths.Manage.Customer.general} activePathFn={pathFn} />
      <SettingsMenuLink custId={custId} text={Text.CustomerAccounts}
        pathFn={Paths.Manage.Customer.accounts} activePathFn={pathFn} />
      <SettingsMenuLink custId={custId} text={Text.CustomerPay}
        pathFn={Paths.Manage.Customer.pay} activePathFn={pathFn} />
    </div>;
  }

  function SettingsMenuLink({custId, text, pathFn, activePathFn}: {
    custId: string;
    text: string|JSX.Element;
    pathFn: (p: {custId: string}) => Paths.Path;
    activePathFn?: (p: {custId: string}) => Paths.Path;
  }) {
    return <a href={pathFn({custId: custId}).href}
              className={classNames("esper-subheader-link", {
                active: activePathFn === pathFn
              })}>
      { text }
    </a>;
  }
}
