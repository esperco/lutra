/*
  Base wrapper or container for settings pages
*/

module Esper.Views {
  interface Props extends Types.SettingsPageProps {
    msg?: string;
    err?: string;
    children?: JSX.Element|JSX.Element[];
    subMenu?: JSX.Element;
  }

  export function Settings(props: Props) {
    return <div className="settings-page esper-expanded">
      <SidebarContainer { ...props } />
      <div className="esper-content">
        { props.subMenu }
        <div className="esper-container">
          {
            props.msg ?
            <div className="alert msg alert-info">{ props.msg }</div> :
            null
          }
          {
            props.err ?
            <div className="alert msg alert-danger">{ props.err }</div> :
            null
          }
          { props.children }
        </div>
      </div>
    </div>;
  }


  /*
    Wrap with ReactHelpers.contain so this auto-updates when teams or
    groups change
  */

  function SidebarContainer(props: Types.SettingsPageProps) {
    return ReactHelpers.contain(function() {
      return <Components.ManageSidebar
        teams={Stores.Teams.all(false)}
        customers={Stores.Customers.all()}
        {...props}
      />
    });
  }
}
