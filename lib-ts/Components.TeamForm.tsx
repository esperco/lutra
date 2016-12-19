/*
  Form used in editing team name, timezone, etc.
*/

/// <reference path="./Actions.Teams.ts" />
/// <reference path="./Components.TimezoneSelector.tsx" />
/// <reference path="./Option.ts" />
/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  interface Props extends Actions.Teams.ExecTeamData {
    showEmail?: boolean;
    editableEmail?: boolean;
    onUpdate?: () => void;
  }

  interface State extends Actions.Teams.ExecTeamData {
    emailError?: boolean;
  }

  export class TeamForm extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        name: props.name,
        email: props.email,
        timezone: props.timezone,
        groups_only: props.groups_only
      };
    }

    // Reset state on prop change
    componentWillReceiveProps(props: Props) {
      if (! _.isEqual(this.props, props)) {
         this.state = {
          name: props.name,
          email: props.email,
          timezone: props.timezone,
          groups_only: props.groups_only
        };
      }
    }

    render() {
      return <div className="form-set form-horizontal esper-panel-section">
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
        { this.props.showEmail ?
          <div className={classNames("form-group", {
            "has-error": this.state.emailError
          })}>
            <label htmlFor={this.getId("email")}
                   className="col-md-2 control-label">
              Email
            </label>
            <div className="col-md-10">
              { this.props.editableEmail ?
                <input id={this.getId("email") } type="email" name="email"
                       className="form-control" placeholder="tony@stark.com"
                       onChange={(e) => this.onEmailInputChange(e)}
                       value={this.state.email} /> :
                <span className="esper-input-align">{ this.state.email }</span>
              }
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
      this.mutateState((s) => s.name = name);
      this.processUpdate();
    }

    onEmailInputChange(event: React.FormEvent) {
      var email = (event.target as HTMLInputElement).value
      var newState = _.clone(this.state);
      this.mutateState((s) => {
        s.email = email;
        s.emailError = false;
      });
      this.processUpdate();
    }

    updateTimezone(tz: string) {
      this.mutateState((s) => s.timezone = tz);
      this.processUpdate();
    }

    processUpdate() {
      if (this.props.onUpdate) {
        this.props.onUpdate();
      }
    }

    // Ref the component and call this to get values
    validate(): Option.T<Actions.Teams.ExecTeamData>
    {
      if (this.props.showEmail && this.props.editableEmail &&
          !Util.validateEmailAddress(this.state.email)) {
        this.mutateState((s) => s.emailError = true);
        return Option.none<Actions.Teams.ExecTeamData>();
      }
      return Option.wrap(this.state);
    }

  }


}
