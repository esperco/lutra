/*
  A quick menu to switch between different tabs for a given group's settings
*/

module Esper.Components {
  export function CustomerSettingsMenu({cust, pathFn}: {
    cust: ApiT.Customer;
    pathFn?: (p: {cusId: string}) => Paths.Path;
  }) {
    var cusId = cust.id;
    return <div className="esper-content-header settings-menu fixed padded">
      <SettingsMenuLink cusId={cusId} text={Text.CustomerGeneral}
        pathFn={Paths.Manage.Customer.general} activePathFn={pathFn} />
      <SettingsMenuLink cusId={cusId} text={Text.CustomerAccounts}
        pathFn={Paths.Manage.Customer.accounts} activePathFn={pathFn} />
      <SettingsMenuLink cusId={cusId} text={Text.CustomerPay}
        pathFn={Paths.Manage.Customer.pay} activePathFn={pathFn} />
    </div>;
  }

  function SettingsMenuLink({cusId, text, pathFn, activePathFn}: {
    cusId: string;
    text: string|JSX.Element;
    pathFn: (p: {cusId: string}) => Paths.Path;
    activePathFn?: (p: {cusId: string}) => Paths.Path;
  }) {
    return <a href={pathFn({cusId: cusId}).href}
              className={classNames("esper-subheader-link", {
                active: activePathFn === pathFn
              })}>
      { text }
    </a>;
  }
}
