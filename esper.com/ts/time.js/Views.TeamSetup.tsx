/*
  View for initial team setup
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Actions.Teams.ts" />
/// <reference path="../lib/Components.Expando.tsx" />
/// <reference path="../lib/Components.NewTeamForm.tsx" />

module Esper.Views {
  interface State {
    busy: boolean;

    // Which expando is open?
    selfSelected: boolean;
    execSelected: boolean;

    // List of temporary identifiers that React can use to identify components
    newTeamIds: string[];

    // Which of the above newTeamIds errors because exec has team already
    execErrorIds: string[];
  }

  export class TeamSetup extends ReactHelpers.Component<{}, State> {
    _expandos: Components.Expando[] = [];
    _selfForm: Components.NewTeamForm;
    _execForms: {[index: string]: Components.NewTeamForm};

    constructor(props: {}) {
      super(props);
      this._execForms = {};
      this.state = {
        busy: false,
        execErrorIds: [],
        selfSelected: false,
        execSelected: false,
        newTeamIds: [Util.randomString()]
      };
    }

    renderWithData() {
      let heading = Text.TeamSetupHeading;
      let subheading = Text.TeamSetupDescription;
      if (Redeem.checkExtendedTrial()) {
        heading = Text.ExtendedTrialHeading;
        subheading += " " + Text.ExtendedTrialDescription;
      }

      return <Components.OnboardingPanel heading={ heading }
              subheading={ subheading }
              progress={1/3} busy={this.state.busy}
              disableNext={!((this._selfForm && this.state.selfSelected) ||
                             this.state.execSelected)}
              onNext={() => this.onNext()}>
        <div className="esper-section">
          <Components.Expando onOpen={() => this.onOpenSelf()}
            group={this._expandos}
            header="Just Myself"
            headerClasses="esper-panel-section"
            bodyClasses="esper-panel-section"
          >
            <div>
              { Stores.Profiles.get(Login.myUid()).mapOr(
                <span className="esper-spinner" />,
                (p) => <div>
                  <p>{ Text.TeamSelfDescription }</p>
                  <Components.NewTeamForm
                    ref={(c) => this._selfForm = c}
                    name={p.display_name || ""}
                    email={Login.myEmail()}
                    supportsExec={false} />
                </div>
              )}
            </div>
          </Components.Expando>
        </div>

        <div className="esper-section">
          <Components.Expando onOpen={() => this.onOpenExec()}
            group={this._expandos}
            header="Someone Else"
            headerClasses="esper-panel-section"
            bodyClasses="esper-panel-section"
          >
            <div>
              <p>{ Text.TeamExecDescription }</p>
              { _.map(this.state.newTeamIds, (id) =>
                <div key={id} className="new-team esper-panel-section">
                  { _.includes(this.state.execErrorIds, id) ?
                    <Components.ErrorMsg msg={Text.ExecHasTeamErr} /> : null }
                  { this.state.newTeamIds.length > 1 ?
                    <span className="action close-action"
                          onClick={() => this.rmTeam(id)}>
                      <i className="fa fa-fw fa-close" />
                    </span> : null
                  }
                  <Components.NewTeamForm
                   ref={(c) => this._execForms[id] = c}
                   supportsExec={true} />
                </div>
              )}
              <div className="add-team-div esper-panel-section clearfix">
                <span className="action pull-right"
                      onClick={() => this.addTeam()}>
                  <i className="fa fa-fw fa-plus" />{" "}Add Someone Else
                </span>
              </div>
            </div>
          </Components.Expando>
        </div>
      </Components.OnboardingPanel>
    }



    // On open the self expando
    onOpenSelf() {
      this.mutateState((state) => {
        state.selfSelected = true;
        state.execSelected = false;
      });
    }

    // On open the support someone else / exec expando
    onOpenExec() {
      this.mutateState((state) => {
        state.selfSelected = false;
        state.execSelected = true;
      });
    }

    // On clicking the "Add someone else" action
    addTeam() {
      this.mutateState(
        (state) => state.newTeamIds.push(Util.randomString())
      );
    }

    rmTeam(id: string) {
      this.mutateState(
        (state) => _.pull(state.newTeamIds, id)
      );
    }

    onNext() {
      var promises: JQueryPromise<any>[] = []
      if (this.state.selfSelected) {
        this._selfForm && this._selfForm.validate().match({
          none: () => null,
          some: (d) => promises.push(Actions.Teams.createSelfTeam(d))
        });
      } else { // Assume exec selected
        var validations: {
          [index: string]: Option.T<Actions.Teams.ExecTeamData>
        } = {};
        _.each(this._execForms, (v, k) => {
          if (v) { validations[k] = v.validate(); }
        });

        // Only post if all teams valid
        var failedIds: string[] = [];
        if (_.every(validations, (v) => v.isSome())) {
          _.each(validations, (v, k) => v.match({
            none: () => null,
            some: (d) => promises.push(
              Actions.Teams.createExecTeam(d).then(
                (x) => x,
                (err) => {
                  if (err.errorDetails ===
                      "Cannot_create_new_team_for_executive") {
                    err.handled = true;
                    this.mutateState((s) => s.execErrorIds.push(k));
                  }
                }
              )
            )
          }));
        }
      }

      if (promises.length) {
        this.mutateState((s) => {
          s.busy = true;
          s.execErrorIds = [];
        });

        $.when.apply($, promises)
          .done(() => Route.nav.go(Paths.Time.calendarSetup()))
          .fail(() => this.mutateState((s) => s.busy = false));
      }
    }
  }
}
