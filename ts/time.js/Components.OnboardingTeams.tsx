/*
  Base component for a list of expandos for each team
*/
module Esper.Components {

  interface Props {
    teams: ApiT.Team[];
    initOpenId?: string;
    onAddTeam: () => void;

    // Must be pure function of team (or other bound elements)
    renderFn: (team: ApiT.Team) => JSX.Element;
  }

  export class OnboardingTeams extends ReactHelpers.Component<Props, {}> {
    _teamExpandos: { [index: string]: Components.Expando }

    constructor(props: Props) {
      super(props);
      this._teamExpandos = {};
    }

    render() {
      return <div className="esper-section">
        { _.map(this.props.teams, (t) =>
          <div className="onboarding-team esper-section" key={t.teamid}>
            <span className="action rm-action"
                  onClick={() => Actions.Teams.removeTeam(t.teamid)}>
              <i className="fa fa-fw fa-close" />
            </span>
            <Components.Expando
              ref={(c) => this._teamExpandos[t.teamid] = c}
              initOpen={t.teamid === this.props.initOpenId}
              headerClasses="esper-panel-section"
              bodyClasses="esper-panel-section"
              header={<div>
                <i className="fa fa-fw fa-user" />
                {" "}{t.team_name}
              </div>}
            >
              <div className="esper-panel-section">
                { this.props.renderFn(t) }
              </div>
            </Components.Expando>
          </div>
        )}

        <div className="add-team-div esper-section clearfix">
          <span className="action pull-right"
                onClick={() => this.props.onAddTeam()}>
            <i className="fa fa-fw fa-plus" />{" "}Add Someone Else
          </span>
        </div>
      </div>;
    }

    // Open epxpandos for a given teamid
    openTeams(teamIds: string[], closeOther=false) {
      if (closeOther) {
        _.each(this._teamExpandos, (expando) => {
          if (expando) {
            expando.close();
          }
        });
      }

      _.each(teamIds, (_id) => {
        var expando = this._teamExpandos[_id];
        if (expando) {
          expando.open();
        }
      });
    }
  }
}
