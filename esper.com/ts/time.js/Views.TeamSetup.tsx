/*
  View for initial team setup
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.Expando.tsx" />
/// <reference path="../lib/Components.NewTeamForm.tsx" />

module Esper.Views {
  export class TeamSetup extends ReactHelpers.Component<{}, {}> {
    _expandos: Components.Expando[] = [];

    renderWithData() {
      return <Components.OnboardingPanel heading={Text.TeamSetupHeading}
              progress={1/4}>
        <div className="alert alert-info">
          { Text.TeamSetupDescription }
        </div>
        <Components.Expando group={this._expandos}
         header={<div className="esper-subheader">Just Myself</div>}>
          <div className="onboarding-expando-content">
            <p>{ Text.TeamSelfDescription }</p>
            <Components.NewTeamForm supportsExec={false} />
          </div>
        </Components.Expando>
        <Components.Expando group={this._expandos}
         header={<div className="esper-subheader">Someone Else</div>}>
          <div className="onboarding-expando-content">
            <p>{ Text.TeamExecDescription }</p>
            <Components.NewTeamForm
             ref={(c) => console.info(c)}
             supportsExec={true} />
          </div>
        </Components.Expando>
      </Components.OnboardingPanel>
    }
  }
}
