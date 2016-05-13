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
    render() {
      return <div>
        { _.map(this.props.teams, (t) =>
          <div className="onboarding-team" key={t.teamid}>
            <span className="action rm-action"
                  onClick={() => Actions.Teams.removeTeam(t.teamid)}>
              <i className="fa fa-fw fa-close" />
            </span>
            <Components.Expando
              initOpen={t.teamid === this.props.initOpenId}
              header={<div className="esper-subheader">
                <i className="fa fa-fw fa-user" />
                {" "}{t.team_name}
              </div>}
            >
              <div className="onboarding-expando-content">
                { this.props.renderFn(t) }
              </div>
            </Components.Expando>
          </div>
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
