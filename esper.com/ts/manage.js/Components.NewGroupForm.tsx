/*
  A form for creating a new Group
*/

module Esper.Components {
  interface Props {
    teams: ApiT.Team[];
    userCalendars: Option.T<ApiT.GenericCalendar[]>;
    isAdmin?: boolean;
    onSubmit?: () => void;
  }

  interface State { }

  export class NewGroupForm extends ReactHelpers.Component<Props, State> {
    _form: GroupForm;

    render() {
      return <GroupForm ref={(c) => this._form = c}
        name="" uid={Login.me()}
        timezone={moment.tz.guess()}
        onSubmit={this.props.onSubmit}
      />
    }

    // Ref the component and call this to get values
    validate(): Option.T<Actions.Groups.GroupData> {
      return this._form.validate();
    }
  }
}
