/*
  Charts subnav in left sidebar
*/

module Esper.Components {
  interface Props {
    teamId: string;
    active?: "charts"|"list"
  }

  export function SidebarNav(p: Props) {
    let { active, teamId } = p;
    return <nav className="esper-select-menu charts-nav">
      <a className={classNames("esper-selectable", {
            active: active === "charts"
          })}
          href={Paths.Time.charts({ teamId }).href}>
        <i className="fa fa-fw fa-left fa-pie-chart" />
        Chart Summary
      </a>

      <a className={classNames("esper-selectable", {
            active: active === "list"
          })}
          href={Paths.Time.list({ teamId }).href}>
        <i className="fa fa-fw fa-left fa-list" />
        Event List
      </a>
    </nav>;
  }
}
