/*
  View for initial team setup
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Actions.Teams.ts" />
/// <reference path="../lib/Components.Expando.tsx" />
/// <reference path="../lib/Components.NewTeamForm.tsx" />

module Esper.Views {
  export class TeamSetup extends ReactHelpers.Component<{}, {
    busy: boolean;

    // Which expando is open?
    selfSelected: boolean;
    execSelected: boolean;
  }> {
    _expandos: Components.Expando[] = [];
    _selfForm: Components.NewTeamForm;
    _execForm: Components.NewTeamForm;

    constructor(props: {}) {
      super(props);
      this.state = {
        busy: false,
        selfSelected: false,
        execSelected: false
      };
    }

    renderWithData() {
      return <Components.OnboardingPanel heading={Text.TeamSetupHeading}
              progress={1/4} busy={this.state.busy}
              disableNext={!(this.state.selfSelected ||
                             this.state.execSelected)}
              onNext={() => this.onNext()}>
        <div className="alert alert-info">
          { Text.TeamSetupDescription }
        </div>

        <Components.Expando onOpen={() => this.onOpenSelf()}
          group={this._expandos}
          header={<div className="esper-subheader">Just Myself</div>}
        >
          <div className="onboarding-expando-content">
            <p>{ Text.TeamSelfDescription }</p>
            <Components.NewTeamForm
             ref={(c) => this._selfForm = c}
             supportsExec={false} />
          </div>
        </Components.Expando>

        <Components.Expando onOpen={() => this.onOpenExec()}
          group={this._expandos}
          header={<div className="esper-subheader">Someone Else</div>}
        >
          <div className="onboarding-expando-content">
            <p>{ Text.TeamExecDescription }</p>
            <Components.NewTeamForm
             ref={(c) => this._execForm = c}
             supportsExec={true} />
          </div>
        </Components.Expando>
      </Components.OnboardingPanel>
    }

    onOpenSelf() {
      var newState = _.clone(this.state);
      newState.selfSelected = true;
      newState.execSelected = false;
      this.setState(newState);
    }

    onOpenExec() {
      var newState = _.clone(this.state);
      newState.selfSelected = false;
      newState.execSelected = true;
      this.setState(newState);
    }

    onNext() {
      var promises: JQueryPromise<any>[] = []
      if (this.state.selfSelected) {
        this._selfForm.validate().match({
          none: () => null,
          some: (d) => promises.push(Actions.Teams.createSelfTeam(d))
        });
      } else { // Assume exec selected
        this._execForm.validate().match({
          none: () => null,
          some: (d) => promises.push(Actions.Teams.createExecTeam(d))
        });
      }

      if (promises.length) {
        var newState = _.clone(this.state);
        newState.busy = true;
        this.setState(newState);

        $.when.apply($, promises)
          .done(() => Route.nav.path("calendar-setup"))
          .fail(() => {
            let newState = _.clone(this.state);
            newState.busy = false;
            this.setState(newState);
          });
      }
    }
  }
}
