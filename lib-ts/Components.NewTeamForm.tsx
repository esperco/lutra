/*
  A form for creating a new Team
*/

/// <reference path="./Actions.Teams.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Components.TimezoneSelector.tsx" />

module Esper.Components {
  interface Props {
    supportsExec?: boolean;
  }

  interface State extends Actions.Teams.ExecTeamData {
    emailError?: boolean;
  }

  export class NewTeamForm extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        name: "",
        email: "",
        timezone: moment.tz.guess()
      };
    }

    render() {
      return <div className="form-set form-horizontal">
        <div className="form-group">
          <label htmlFor={this.getId("name")}
                 className="col-md-2 control-label">
            Name
          </label>
          <div className="col-md-10">
            <input id={this.getId("name")} name="name"
             type="text" className="form-control"
             onChange={(e) => this.onNameInputChange(e)}
             value={this.state.name}
             placeholder="Tony Stark" />
          </div>
        </div>
        { this.props.supportsExec ?
          <div className={classNames("form-group", {
            "has-error": this.state.emailError
          })}>
            <label htmlFor={this.getId("email")}
                   className="col-md-2 control-label">
              Email
            </label>
            <div className="col-md-10">
              <input id={this.getId("email") } type="email" name="email"
                     className="form-control" placeholder="tony@stark.com"
                     onChange={(e) => this.onEmailInputChange(e)}
                     value={this.state.email} />
            </div>
          </div> : null
        }
        <div className="form-group">
          <label htmlFor={this.getId("zone")}
                 className="col-md-2 control-label">
            Timezone
          </label>
          <div className="col-md-10">
            <TimezoneSelector id={this.getId("zone")}
              onSelect={(tz) => this.updateTimezone(tz)}
              selected={this.state.timezone}
            />
          </div>
        </div>
      </div>;
    }

    onNameInputChange(event: React.FormEvent) {
      var name = (event.target as HTMLInputElement).value
      var newState = _.clone(this.state);
      newState.name = name;
      this.setState(newState);
    }

    onEmailInputChange(event: React.FormEvent) {
      var email = (event.target as HTMLInputElement).value
      var newState = _.clone(this.state);
      newState.email = email;
      newState.emailError = false;
      this.setState(newState);
    }

    updateTimezone(tz: string) {
      var newState = _.clone(this.state);
      newState.timezone = tz;
      this.setState(newState);
    }

    // Ref the component and call this to get values
    validate(): Option.T<Actions.Teams.ExecTeamData>
    {
      if (this.props.supportsExec &&
          !Util.validateEmailAddress(this.state.email)) {
        var newState = _.clone(this.state);
        newState.emailError = true;
        this.setState(newState);
        return Option.none<Actions.Teams.ExecTeamData>();
      }
      return Option.wrap(this.state);
    }
  }
}
