/*
  Base component for a list of expandos for each team
*/
module Esper.Components {

  interface Props {
    teams: ApiT.Team[];
    initOpenId?: string;
    onAddTeam: () => void;
    renderFn: (team: ApiT.Team) => void;
  }

  export class OnboardingTeams extends ReactHelpers.Component<Props, {}> {
    _expandos: Components.Expando[] = [];

    render() {
      return <div>
        { _.map(this.props.teams, (t) =>
          <Components.Expando key={t.teamid}
            initOpen={t.teamid === this.props.initOpenId}
            group={this._expandos}
            header={<div className="esper-subheader">
              <i className="fa fa-fw fa-user" />
              {" "}{t.team_name}
            </div>}
          >
            { this.props.renderFn(t) }
          </Components.Expando>
        )}

        <div className="add-team-div clearfix">
          <span className="action pull-right"
                onClick={() => this.props.onAddTeam()}>
            <i className="fa fa-fw fa-plus" />{" "}Add Someone Else
          </span>
        </div>
      </div>;
    }
  }

}
