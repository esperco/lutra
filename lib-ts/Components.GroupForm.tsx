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

  interface State extends Actions.Groups.GroupData {
    editMember?: string;
    teamFilter?: string;
  }

  export class GroupForm extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        name: props.name,
        uid: props.uid,
        groupMembers: props.groupMembers
      };
    }

    // Reset state on prop change
    componentWillReceiveProps(props: Props) {
      super.componentWillReceiveProps(props);
      if (! _.isEqual(this.props, props)) {
         this.state = {
          name: props.name,
          uid: props.uid,
          groupMembers: props.groupMembers
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
        { this.renderMemberInput() }
        { _.isEmpty(this.state.groupMembers) ?
          <div className="esper-no-content">
            No Group Members Found
          </div>
          :
          <div className="list-group">
            { _.map(this.state.groupMembers, this.renderMember.bind(this)) }
          </div>
        }
      </div>;
    }

    renderMemberInput() {
      return <div className="form-group">
        <label htmlFor={this.getId("new-members")}
               className="col-md-2 control-label">
          {Text.AddGroupMemberLink}
        </label>
        <div className="col-md-10">
          <div className={this.state.teamFilter ? "esper-has-right-icon" : ""}>
            <input type="text"
                   className="form-control"
                   id={this.getId("new-members")}
                   onKeyDown={this.inputKeydown.bind(this)}
                   onChange={(e) => this.onChange(e)}
                   value={this.state.teamFilter || ""}
                   placeholder="Tony Stark"
            />
            {
              this.state.teamFilter ?
              <span className="esper-clear-action esper-right-icon"
                    onClick={() => this.resetState()}>
                <i className="fa fa-fw fa-times" />
              </span> :
              <span />
            }
          </div>
          { this.state.teamFilter ? this.renderFilteredTeams() : null }
        </div>
      </div>;
    }

    inputKeydown(e: KeyboardEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (e.keyCode == 27) { // ESC
        e.preventDefault();
        this.resetState();
      }
    }

    onChange(e: React.FormEvent) {
      var val = (e.target as HTMLInputElement).value;
      this.mutateState((s) => s.teamFilter = val);
    }

    renderFilteredTeams() {
        var self = this;
      var memberIds = _.map(this.state.groupMembers, function(member) {
        return member.teamid;
      });
      var filteredTeams = _.filter(Stores.Teams.all(), function(team) {
        return !_.includes(memberIds, team.teamid)
          && _.includes(team.team_name.toLowerCase(),
                        self.state.teamFilter.toLowerCase());
      });
      var filteredMembers = _.map(filteredTeams, function(team) {
        return {
          id: team.teamid,
          displayAs: team.team_name
        };
      });
      return <ListSelectorSimple choices={filteredMembers}
        selectedIds={null} updateFn={this.update.bind(this)}/>;
    }

    update(selected: string[]) {
      var selectedTeam = Stores.Teams.get(selected[0]).unwrap();
      var member = {
        teamid: selectedTeam.teamid,
        name: selectedTeam.team_name
      };
      this.mutateState((s) => s.groupMembers.push(member));
      this.processUpdate();
    }

    renderMember(member: ApiT.GroupMember) {
      // State of editing a group member
      if (member.teamid === this.state.editMember) {
        return <div className="list-group-item one-line" key={member.teamid}>
          <div className="row">
            <div className="col-xs-6">
              <button className="btn btn-default form-control" type="button"
                      onClick={this.resetState.bind(this)}>
                Cancel
              </button>
            </div>
            <div className="col-xs-6">
              <button className="btn btn-primary form-control" type="button"
                      onClick={this.submitEditInput.bind(this)}>
                Save
              </button>
            </div>
          </div>
        </div>;
      }

      return <div className="list-group-item one-line" key={member.teamid}>
        <i className="fa fa-fw fa-user" />
        {" "}{member.name}{" "}
        <span>
          <a className="pull-right text-danger" title="Delete"
             onClick={(e) => this.removeMember(member)}>
            <i className="fa fa-fw fa-trash list-group-item-text" />
          </a>
        </span>
      </div>;
    }

    resetState() {
      this.mutateState((s) => {
        s.editMember = null;
        s.teamFilter = null;
      });
    }

    showEditFor(gim: ApiT.GroupIndividual) {
      this.mutateState((s) => s.editMember = gim.uid);
    }

    // Catch enter key on input -- use jQuery to actual examine value
    editInputKeydown(e: KeyboardEvent) {
      if (e.keyCode === 13) {
        e.preventDefault();
        this.submitEditInput();
      }
    }

    submitEditInput() {
      this.resetState();
    }

    removeMember(selected: ApiT.GroupMember) {
      this.mutateState((s) => s.groupMembers = _.filter(s.groupMembers, function(member) {
        return member.teamid !== selected.teamid;
      }));
      this.processUpdate();
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
