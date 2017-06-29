/*
  A link to switch between different tabs for a given group or team
  or customer or whatever
*/

module Esper.Components {
  export function SettingsMenu({children}: {
    children?: JSX.Element|JSX.Element[];
  }) {
    return <div className="esper-content-header settings-menu fixed padded">
      { children }
    </div>;
  }


  interface LinkProps extends Types.SettingsId {
    href: (p: Types.SettingsId) => Paths.Path;   // Go to this link
    pathFn?: (p: Types.SettingsId) => Paths.Path; // Active
    children?: JSX.Element|JSX.Element[]|string;
  }

  export function SettingsMenuLink(props: LinkProps) {
    return <a href={props.href(props).href}
              className={classNames("esper-subheader-link", {
                active: props.href === props.pathFn
              })}>
      { props.children }
    </a>;
  }
}
