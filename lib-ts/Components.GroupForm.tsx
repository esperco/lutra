/*
  Form used in editing group name, timezone, etc.
*/

/// <reference path="./Actions.Groups.ts" />
/// <reference path="./Option.ts" />
/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  interface Props extends Actions.Groups.GroupData {
    isAdmin?: boolean;
    isOwner?: boolean;
    groupid?: string;
    onUpdate?: () => void;
  }

  interface State extends Actions.Groups.GroupData {
    editMember?: string;
    editIndividual?: ApiT.GroupIndividual;
    teamFilter: string;
    hasIndividualEmail?: boolean;
    hasEmailError?: boolean;
  }

  export class GroupForm extends ReactHelpers.Component<Props, State> {
    _emailInput: HTMLInputElement;

    constructor(props: Props) {
      super(props);
      this.state = {
        name: props.name,
        uid: props.uid,
        groupMembers: props.groupMembers,
        groupIndividuals: props.groupIndividuals,
        teamFilter: ""
      };
    }

    // Reset state on prop change
    componentWillReceiveProps(props: Props) {
      super.componentWillReceiveProps(props);
      if (! _.isEqual(this.props, props)) {
         this.state = {
          name: props.name,
          uid: props.uid,
          groupMembers: props.groupMembers,
          groupIndividuals: props.groupIndividuals,
          teamFilter: ""
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
          <div className="form-group">
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
        <hr />
        { _.isEmpty(this.state.groupMembers) ?
          <div className="esper-no-content">
            No {Text.GroupMembers} Found
          </div>
          :
          <div className="list-group">
            <label className="esper-header">
              { Text.TeamExecs + " in " + (this.state.name || Text.Group) }
            </label>
            { _.map(this.state.groupMembers, this.renderMember.bind(this)) }
          </div>
        }
        <hr />
        { this.renderIndividualInput() }
        { this.state.hasEmailError ?
            <div className="alert alert-danger">
              <i className="fa fa-fw fa-warning"></i>
              Invalid email address provided.
            </div> :
            null
        }
        <hr />
        { _.isEmpty(this.state.groupIndividuals) ?
          <div className="esper-no-content">
            No {Text.GroupIndividuals} Found
          </div>
          :
          <div className="list-group">
            <label className="esper-header">
              {Text.GroupIndividuals + " in " + (this.state.name || Text.Group)}
            </label>
            { _.map(this.state.groupIndividuals, this.renderIndividual.bind(this))}
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
          <div className=
            {_.isEmpty(this.state.teamFilter) ? "" : "esper-has-right-icon"}>
            <input type="text"
                   className="form-control"
                   id={this.getId("new-members")}
                   onKeyDown={this.inputKeydown.bind(this)}
                   onChange={(e) => this.onTeamFilterChange(e)}
                   value={this.state.teamFilter || ""}
                   placeholder="Tony Stark"
            />
            { _.isEmpty(this.state.teamFilter) ?
              <span /> :
              <span className="esper-clear-action esper-right-icon"
                    onClick={() => this.resetState()}>
                <i className="fa fa-fw fa-times" />
              </span>
            }
          </div>
          { this.renderTeams() }
        </div>
      </div>;
    }

    renderIndividualInput() {
      return <div className="form-group">
        <label htmlFor={this.getId("new-individuals")}
               className="col-md-2 control-label">
          {Text.AddGroupIndividualLink}
        </label>
        <div className="input-group">
          <div className={this.state.hasIndividualEmail ? "esper-has-right-icon" : ""}>
            <input type="text"
                   className="form-control"
                   id={this.getId("new-individuals")}
                   ref={(c) => this._emailInput = c}
                   onKeyDown={this.inputEmailKeydown.bind(this)}
                   onChange={(e) => this.onIndividualEmailChange(e)}
                   placeholder="john.doe@esper.com" />
            { this.state.hasIndividualEmail ?
              <span className="esper-clear-action esper-right-icon"
                    onClick={() => {
                      this._emailInput.value = "";
                      this.mutateState((s) => {
                        s.hasIndividualEmail = false;
                        s.hasEmailError = false;
                      });
                    }}>
                <i className="fa fa-fw fa-times" />
              </span> :
              <span />
            }
          </div>
          <span className="input-group-btn">
            <button className="btn btn-default" type="button"
                    onClick={this.addIndividual.bind(this)}>
              <i className="fa fa-fw fa-plus" />
            </button>
          </span>
        </div>
      </div>;
    }

    addIndividual() {
      var email = this._emailInput.value;
      if (!Util.validateEmailAddress(email)) {
        this.mutateState((s) => s.hasEmailError = true);
        return;
      }
      var individual = {
        email: email,
        role: Text.GroupRoleMember
      };
      this.mutateState((s) => {
        s.groupIndividuals.push(individual);
        s.hasEmailError = false;
      });
      this.processUpdate();
      this._emailInput.value = "";
    }

    inputKeydown(e: KeyboardEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (e.keyCode == 27) { // ESC
        e.preventDefault();
        this.resetState();
      }
    }

    inputEmailKeydown(e: KeyboardEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (e.keyCode == 13) { // Enter
        e.preventDefault();
        this.addIndividual();
      } else if (e.keyCode == 27) { // ESC
        e.preventDefault();
        this._emailInput.value = "";
        this.resetState();
      }
    }

    onIndividualEmailChange(e: React.FormEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (_.isEmpty(val))
        this.mutateState((s) => s.hasIndividualEmail = false);
      else
        this.mutateState((s) => s.hasIndividualEmail = true);
    }

    onTeamFilterChange(e: React.FormEvent) {
      var val = (e.target as HTMLInputElement).value;
      this.mutateState((s) => s.teamFilter = val);
    }

    renderTeams() {
      var teamFilter = this.state.teamFilter;
      var memberIds = _.map(this.state.groupMembers, function(member) {
        return member.teamid;
      });
      var filteredTeams = _.filter(Stores.Teams.all(), function(team) {
        return !_.includes(memberIds, team.teamid)
          && _.includes(team.team_name.toLowerCase(),
                        teamFilter.toLowerCase());
      });
      if (_.isEmpty(filteredTeams) && !_.isEmpty(teamFilter)) {
        return <div className="esper-no-content">
          No { Text.TeamExec } with the name containing '{ teamFilter }' found
        </div>;
      }
      var filteredMembers = _.take(_.map(filteredTeams, function(team) {
        return {
          id: team.teamid,
          displayAs: team.team_name
        };
      }), 5);
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
        { this.props.isOwner || this.props.isAdmin ?
          <a className="pull-right text-danger" title="Delete"
             onClick={(e) => this.removeMember(member)}>
            <i className="fa fa-fw fa-trash list-group-item-text" />
          </a> : null
        }
        </span>
      </div>;
    }

    renderIndividual(gim: ApiT.GroupIndividual) {
      // State of editing a group member
      if (!_.isEmpty(this.state.editIndividual) &&
          this.state.editIndividual.email === gim.email) {
        return <div className="list-group-item" key={gim.email}>
          <div className="form-group">
            <div className="one-line">
              <i className="fa fa-fw fa-user"></i>
              {gim.email}
            </div>
            <div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-owner")} name="group-role"
                       value={Text.GroupRoleOwner} defaultChecked={gim.role === Text.GroupRoleOwner}
                       onClick={this.onRoleChange.bind(this)} />
                <label htmlFor={this.getId("role-owner")} className="group-role-label">
                  {Text.GroupRoleOwner}
                </label>
              </div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-manager")} name="group-role"
                       value={Text.GroupRoleManager} defaultChecked={gim.role === Text.GroupRoleManager}
                       onClick={this.onRoleChange.bind(this)} />
                <label htmlFor={this.getId("role-manager")} className="group-role-label">
                  {Text.GroupRoleManager}
                </label>
              </div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-member")} name="group-role"
                       value={Text.GroupRoleMember} defaultChecked={gim.role === Text.GroupRoleMember}
                       onClick={this.onRoleChange.bind(this)} />
                <label htmlFor={this.getId("role-member")} className="group-role-label">
                  {Text.GroupRoleMember}
                </label>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-6">
              <button className="btn btn-default form-control" type="button"
                      onClick={this.resetState.bind(this)}>
                Cancel
              </button>
            </div>
            <div className="col-xs-6">
              <button className="btn btn-primary form-control" type="button"
                      onClick={this.submitEditIndividual.bind(this)}>
                Save
              </button>
            </div>
          </div>
        </div>;
      }

      return <div className="list-group-item one-line" key={gim.email}>
        <i className="fa fa-fw fa-user" />
        {" "}{gim.email}{" "}
        { this.props.isOwner || this.props.isAdmin ?
          <span>
            { gim.uid !== Login.me() ?
              <a className="pull-right text-danger" title="Delete"
                 onClick={(e) => this.removeIndividual(gim)}>
                <i className="fa fa-fw fa-trash list-group-item-text" />
              </a> : null
            }
            <a className="pull-right text-info" title="Edit"
                onClick={(e) => this.showEditFor(gim)}>
                 <i className="fa fa-fw fa-pencil list-group-item-text" />
            </a>
          </span> :
          null
        }
      </div>;
    }

    resetState() {
      this.mutateState((s) => {
        s.editMember = null;
        s.editIndividual = null;
        s.teamFilter = "";
        s.hasEmailError = false;
        s.hasIndividualEmail = false;
      });
    }

    showEditFor(gim: ApiT.GroupIndividual) {
      this.mutateState((s) => s.editIndividual = gim);
    }

    submitEditInput() {
      this.resetState();
    }

    submitEditIndividual() {
      var gim = _.find(this.state.groupIndividuals, {
                       email: this.state.editIndividual.email });
      if (gim !== this.state.editIndividual && !_.isEmpty(this.props.groupid)) {
        Api.putGroupIndividual(this.props.groupid, gim.uid, { role: gim.role });
      }
      this.resetState();
    }

    removeMember(selected: ApiT.GroupMember) {
      this.mutateState((s) => s.groupMembers = _.filter(s.groupMembers, function(member) {
        return member.teamid !== selected.teamid;
      }));
      this.processUpdate();
    }

    removeIndividual(selected: ApiT.GroupIndividual) {
      this.mutateState((s) => _.remove(s.groupIndividuals, { email: selected.email }));
      this.processUpdate();
    }

    onRoleChange(event: React.FormEvent) {
      var role = (event.target as HTMLInputElement).value;

      if (this.state.editIndividual.role !== role) {
        this.mutateState((s) => {
          var gim = _.find(s.groupIndividuals, { email: this.state.editIndividual.email });
          gim.role = role;
        });
      }
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
