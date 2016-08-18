/*
  View for a team report
*/

module Esper.Views {

  interface Props {
    teamId: string;
    period: Types.SinglePeriod|Types.CustomPeriod;
  }

  export class Report extends ReactHelpers.Component<Props, {}> {

    renderWithData() {
      return <div id="reports-page" className="esper-full-screen minus-nav">
        <Components.Sidebar className="esper-shade">
          <div className="sidebar-bottom-menu">
            <Components.TeamSelector
              teams={Stores.Teams.all()}
              selectedId={this.props.teamId}
              onUpdate={(teamId) => this.update({
                teamId: teamId
              })} />
          </div>
        </Components.Sidebar>

        <div className="esper-content">
          { this.props.teamId }
        </div>

      </div>;
    }

    update(params: {
      teamId?: string;
      period?: Types.SinglePeriod|Types.CustomPeriod;
    }) {
      var newProps = _.extend({}, this.props, params) as Props;
      var periodStr = Params.periodStr(newProps.period);
      Route.nav.go(Paths.Time.report({
        teamId: newProps.teamId,
        interval: periodStr.interval,
        period: periodStr.period
      }));
    }
  }



}
