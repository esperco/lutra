/*
  View for initial label setup
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Actions.Teams.ts" />
/// <reference path="../lib/Components.Expando.tsx" />
/// <reference path="../lib/Components.NewLabelsForm.tsx" />

module Esper.Views {
  interface Props {
    teamId: string;
  }

  interface State {
    busy: boolean;
  }

  export class LabelSetup extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        busy: false,
      };
    }

    renderWithData() {
      var disableNext = !_.find(Stores.Teams.all(),
        (t) => t.team_labels.length);
      var hasExec = !!_.find(Stores.Teams.all(),
        (t) => t.team_executive !== Login.myUid());

      return <Components.OnboardingPanel heading={Text.LabelSetupHeading}
              progress={2/4} busy={this.state.busy}
              backPath={"#!" + Route.nav.getPath("team-setup")}
              disableNext={disableNext}
              onNext={() => this.onNext()}>
        <div className="alert alert-info">
          { hasExec ?
            Text.LabelSetupExecDescription :
            Text.LabelSetupSelfDescription }
        </div>

        <Components.OnboardingTeams
          teams={Stores.Teams.all()}
          initOpenId={this.props.teamId}
          renderFn={(t) => <Components.NewLabelsForm team={t} />}
          onAddTeam={() => Route.nav.path("team-setup")}
        />
      </Components.OnboardingPanel>
    }

    onNext() {
      Route.nav.path("calendar-setup");
    }
  }
}
