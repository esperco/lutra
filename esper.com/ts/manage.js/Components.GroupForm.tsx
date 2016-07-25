/*
  Form used in editing group name and timezone
*/

module Esper.Components {
  interface Props extends Actions.Groups.GroupData {
    groupid?: string;
    onUpdate?: () => void;
    onSubmit?: () => void; // Enter
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
      if (this.props.groupid !== props.groupid ||
          this.props.name !== props.name) {
        this.setState({
          name: props.name,
          uid: props.uid,
          timezone: props.timezone
        });
      }
    }

    render() {
      return <div className="form-horizontal esper-panel-section">
        <div className={classNames("form-group", {
          "has-error": this.state.hasInvalidName
        })}>
          <label htmlFor={this.getId("name")}
                 className="col-md-2 control-label">
            Group Name
          </label>
          <div className="col-md-10">
            <input id={this.getId("name")} name="name"
              type="text" className="form-control"
              onKeyDown={(e) => this.onKeyDown(e)}
              onChange={(e) => this.onNameInputChange(e)}
              value={this.state.name}
              placeholder="The Avengers" />
          </div>
        </div>

        <div className="form-group">
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
        </div>
      </div>;
    }

    updateTimezone(tz: string) {
      this.mutateState((s) => s.timezone = tz);
      this.processUpdate();
    }

    // Enter to submit
    onKeyDown(e: React.KeyboardEvent) {
      if (e.keyCode === 13 && this.props.onSubmit) {
        e.preventDefault();
        this.props.onSubmit();
      }
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
