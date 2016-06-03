/*
  A form for creating a new Group
*/

/// <reference path="./Actions.Groups.ts" />
/// <reference path="./Components.GroupForm.tsx" />
/// <reference path="./Login.ts" />
/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  interface Props {
    isAdmin?: boolean;
    groupMembers?: ApiT.Team[];
  }

  interface State { }

  export class NewGroupForm extends ReactHelpers.Component<Props, State> {
    _form: GroupForm;

    render() {
      return <GroupForm ref={(c) => this._form = c}
        name="" uid={Login.me()} isAdmin={this.props.isAdmin}
        groupMembers={this.props.groupMembers || []}
      />
    }

    // Ref the component and call this to get values
    validate(): Option.T<Actions.Groups.GroupData> {
      return this._form.validate();
    }
  }
}
