/*
  Generic view with settings for each team
*/

module Esper.Views {
  interface Props {
    teamId: string;
  }

  export class TeamSettings extends ReactHelpers.Component<Props, {}> {
    renderWithData() {
      var team = Stores.Teams.require(this.props.teamId);
      if (! team) return <span />;

      return <div id="charts-page" className="esper-full-screen minus-nav">
        <Components.TeamsSidebar
          activeTeamId={this.props.teamId}
          teams={Stores.Teams.all()}
        />

        <div className="esper-right-content padded">

        </div>
      </div>;
    }
  }
}
