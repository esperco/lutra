/*
  A form for creating a new Team
*/

/// <reference path="./Actions.Teams.ts" />
/// <reference path="./Components.TeamForm.tsx" />
/// <reference path="./Login.ts" />
/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  interface Props {
    email?: string;
    name?: string;
    supportsExec?: boolean;
  }

  interface State { }

  export class NewTeamForm extends ReactHelpers.Component<Props, State> {
    _form: TeamForm;

    render() {
      return <TeamForm ref={(c) => this._form = c}
        name={this.props.name || ""} email={this.props.email || ""}
        timezone={moment.tz.guess()}
        showEmail={this.props.supportsExec}
        editableEmail={this.props.supportsExec}
        groups_only={false}
      />
    }

    // Ref the component and call this to get values
    validate(): Option.T<Actions.Teams.ExecTeamData> {
      return this._form.validate();
    }
  }
}
