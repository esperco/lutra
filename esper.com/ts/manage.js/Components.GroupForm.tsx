/*
  Form used in editing group name and timezone
*/

module Esper.Components {
  interface Props extends Actions.Groups.GroupData {
    groupid?: string;
    onUpdate?: () => void;
    editable?: boolean;
  }

  interface State extends Actions.Groups.GroupData {
    hasInvalidName?: boolean;
  }

  export class GroupForm extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        name: props.name,
        uid: props.uid,
        timezone: props.timezone
      };
    }

    // Reset state on prop change
    componentWillReceiveProps(props: Props) {
      if (! _.isEqual(this.props, props)) {
        this.setState({
          name: props.name,
          uid: props.uid,
          timezone: props.timezone
        });
      }
    }

    render() {
      return <div className="form-horizontal esper-panel-section">
        <div className={classNames({
          "form-group": this.props.editable,
          "has-error": this.state.hasInvalidName
        })}>
          <label htmlFor={this.getId("name")}
                 className="col-md-2 control-label">
            Group Name
          </label>
          <div className="col-md-10">
            { this.props.editable ?
              <input id={this.getId("name")} name="name"
                type="text" className="form-control"
                onChange={(e) => this.onNameInputChange(e)}
                value={this.state.name}
                placeholder="The Avengers" /> :
              <span className="esper-input-align">
                { this.state.name }
              </span>
            }
          </div>
        </div>

        { this.props.editable ? <div className="form-group">
          <label htmlFor={this.getId("timezone")}
                 className="col-md-2 control-label">
            Timezone
          </label>
          <div className="col-md-10">
            <TimezoneSelector id={this.getId("timezone")}
              onSelect={(tz) => this.updateTimezone(tz)}
              selected={this.state.timezone}
            />
          </div>
        </div> : null }
      </div>;
    }

    updateTimezone(tz: string) {
      this.mutateState((s) => s.timezone = tz);
      this.processUpdate();
    }

    onNameInputChange(event: React.FormEvent) {
      var name = (event.target as HTMLInputElement).value;
      this.mutateState((s) => s.name = name);
      this.processUpdate();
    }

    processUpdate() {
      if (this.props.onUpdate) {
        this.props.onUpdate();
      }
    }

    // Ref the component and call this to get values
    validate(): Option.T<Actions.Groups.GroupData> {
      if (! this.state.name) {
        this.mutateState((s) => s.hasInvalidName = true);
        return Option.none<State>();
      } else {
        this.mutateState((s) => s.hasInvalidName = false);
      }
      return Option.wrap(this.state);
    }
  }
}
