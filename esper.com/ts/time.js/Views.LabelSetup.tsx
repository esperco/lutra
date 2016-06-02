/*
  View for initial label setup
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Actions.Teams.ts" />
/// <reference path="../lib/Components.NewLabelsForm.tsx" />

module Esper.Views {
  interface Props {
    teamId: string;
  }

  interface State {
    busy: boolean;
  }

  export class LabelSetup extends ReactHelpers.Component<Props, State> {
    _onboardingExpandos: Components.OnboardingTeams;
    _teamForms: { [index: string]: Components.NewLabelsForm }

    constructor(props: Props) {
      super(props);
      this.state = {
        busy: false,
      };
      this._teamForms = {};
    }

    renderWithData() {
      var hasExec = !!_.find(Stores.Teams.all(),
        (t) => t.team_executive !== Login.myUid());

      return <Components.OnboardingPanel heading={Text.LabelSetupHeading}
              progress={2/3} busy={this.state.busy}
              backPath={Paths.Time.calendarSetup().href}
              disableNext={Onboarding.needsTeam()}
              onNext={() => this.onNext()}>
        <div className="alert alert-info">
          { hasExec ?
            Text.LabelSetupExecDescription :
            Text.LabelSetupSelfDescription }
        </div>

        <Components.OnboardingTeams
          ref={(c) => this._onboardingExpandos = c}
          teams={Stores.Teams.all()}
          initOpenId={this.props.teamId}
          renderFn={(t) => this.renderTeamForm(t)}
          onAddTeam={() => Route.nav.go(Paths.Time.teamSetup())}
        />
      </Components.OnboardingPanel>
    }

    renderTeamForm(team: ApiT.Team) {
      return <Components.NewLabelsForm
        ref={(c) => this._teamForms[team.teamid] = c}
        team={team}
        defaults={Text.DefaultLabels} />;
    }

    onNext() {
      var promises: JQueryPromise<any>[] = []

      var badTeamIds: string[] = [];
      _.each(this._teamForms, (t, teamId) => {
        if (t) {
          t.validate().match({
            none: () => {
              badTeamIds.push(teamId)
            },
            some: (labels) => {
              promises.push(Actions.Teams.putLabels(teamId, labels))
            }
          })
        }
      });

      if (badTeamIds.length) {
        if (this._onboardingExpandos) {
          this._onboardingExpandos.openTeams(badTeamIds, true);
        }
      } else if (promises.length) {
        this.mutateState((state) => state.busy = true)
        var defaultChartId: Actions.ChartId = "labels-pie";
        $.when.apply($, promises)
          .done(() => Route.nav.go(Paths.Time.charts({
            chartId: defaultChartId,
            teamId: this.props.teamId
          })))
          .fail(() => {
            this.mutateState((state) => state.busy = false)
          });
      }
    }
  }
}
