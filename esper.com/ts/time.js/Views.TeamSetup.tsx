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
        selfSelected: false,
        execSelected: false,
        newTeamIds: [Util.randomString()]
      };
    }

    renderWithData() {
      return <Components.OnboardingPanel heading={ Text.TeamSetupHeading }
              subheading={ Text.TeamSetupDescription }
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
              { Stores.Profiles.get(Login.myUid()).match({
                none: () =>
                  <span className="esper-spinner" />,
                some: (p) => <div>
                  <p>{ Text.TeamSelfDescription }</p>
                  <Components.NewTeamForm
                    ref={(c) => this._selfForm = c}
                    name={p.display_name || ""}
                    email={Login.myEmail()}
                    supportsExec={false} />
                </div>
              })}
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
        var execForms = _.filter(
          _.values<Components.NewTeamForm>(this._execForms)
        );
        var validations = _.map(execForms, (f) => f.validate());

        // Only post if all teams valid
        if (_.every(validations, (v) => v.isSome())) {
          _.each(validations, (v) => v.match({
            none: () => null,
            some: (d) => promises.push(Actions.Teams.createExecTeam(d))
          }));
        }
      }

      if (promises.length) {
        var newState = _.clone(this.state);
        newState.busy = true;
        this.setState(newState);

        $.when.apply($, promises)
          .done(() => Route.nav.go(Paths.Time.calendarSetup()))
          .fail(() => {
            let newState = _.clone(this.state);
            newState.busy = false;
            this.setState(newState);
          });
      }
    }
  }
}
