/*
  Form used in editing group name, timezone, etc.
*/

/// <reference path="./Actions.Groups.ts" />
/// <reference path="./Option.ts" />
/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  interface Props extends Actions.Groups.GroupData {
    isAdmin?: boolean;
    onUpdate?: () => void;
  }

  type State = Actions.Groups.GroupData;

  export class GroupForm extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        name: props.name,
        uid: props.uid
      };
    }

    // Reset state on prop change
    componentWillReceiveProps(props: Props) {
      super.componentWillReceiveProps(props);
      if (! _.isEqual(this.props, props)) {
         this.state = {
          name: props.name,
          uid: props.uid
        };
      }
    }

    render() {
      return <div className="form-set form-horizontal">
        <div className="form-group">
          <label htmlFor={this.getId("name")}
                 className="col-md-2 control-label">
            Group Name
          </label>
          <div className="col-md-10">
            <input id={this.getId("name")} name="name"
             type="text" className="form-control"
             onChange={(e) => this.onNameInputChange(e)}
             value={this.state.name}
             placeholder="The Avengers Council" />
          </div>
        </div>
        { this.props.isAdmin ?
          <div className={classNames("form-group")}>
            <label htmlFor={this.getId("user")}
                   className="col-md-2 control-label">
              User
            </label>
            <div className="col-md-10">
              <input id={this.getId("user") } type="text" name="user"
                       className="form-control"
                       onChange={(e) => this.onUserInputChange(e)}
                       value={this.state.uid} />
            </div>
          </div> : null
        }
      </div>;
    }

    onNameInputChange(event: React.FormEvent) {
      var name = (event.target as HTMLInputElement).value
      this.mutateState((s) => s.name = name);
      this.processUpdate();
    }

    onUserInputChange(event: React.FormEvent) {
      var uid = (event.target as HTMLInputElement).value
      var newState = _.clone(this.state);
      this.mutateState((s) => s.uid = uid);
      this.processUpdate();
    }

    processUpdate() {
      if (this.props.onUpdate) {
        this.props.onUpdate();
      }
    }

    // Ref the component and call this to get values
    validate(): Option.T<Actions.Groups.GroupData>
    {
      return Option.wrap(this.state);
    }

  }


}
