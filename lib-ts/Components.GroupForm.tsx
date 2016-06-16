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
    teamFilter: string;
    selectedRole: string;
    editMember?: string;
    hasIndividualEmail?: boolean;
    hasInvalidEmail?: boolean;
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
        teamFilter: "",
        selectedRole: Text.GroupRoleMember
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
          teamFilter: "",
          selectedRole: Text.GroupRoleMember
        };
      }
    }

    render() {
      var individuals = _.differenceBy(this.state.groupIndividuals,
        this.state.groupMembers,
        (m: ApiT.GroupMember) => m.email);
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
        { _.isEmpty(this.state.groupMembers) &&
          _.isEmpty(individuals) ?
          <div className="esper-no-content">
            No {Text.GroupMembers} Found
          </div>
          :
          <div className="list-group">
            <label className="esper-header">
              { "Other " + Text.TeamExecs + " in " +
                (this.state.name || "this " + Text.Group) }
            </label>
            { _.map(this.state.groupMembers, (member) =>
                    this.renderMember(member)) }
            { _.map(individuals, (gim) =>
                    this.renderIndividual(gim)) }
          </div>
        }
        <hr />
        { this.renderIndividualInput() }
        { this.state.hasInvalidEmail ?
            <div className="alert alert-danger">
              <i className="fa fa-fw fa-warning"></i>
              Invalid email address provided.
            </div> :
            null
        }
      </div>;
    }

    renderMemberInput() {
      return <div className="form-group">
        <label htmlFor={this.getId("new-members")}
               className="col-md-2 control-label">
          Your {Text.TeamExecs}
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
                   placeholder={"Filter / Search for " + Text.TeamExecs}
            />
            {
              _.isEmpty(this.state.teamFilter) ?
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
                        s.hasInvalidEmail = false;
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
        this.mutateState((s) => s.hasInvalidEmail = true);
        return;
      }
      var individual = {
        email: email,
        role: Text.GroupRoleMember
      };
      this.mutateState((s) => {
        s.groupIndividuals.push(individual);
        s.hasInvalidEmail = false;
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
        selectedIds={null} updateFn={this.update.bind(this)} />;
    }

    update(selected: string[]) {
      var selectedTeam = Stores.Teams.get(selected[0]).unwrap();
      var profile = Stores.Profiles.get(selectedTeam.team_executive).unwrap();
      var member = {
        teamid: selectedTeam.teamid,
        name: selectedTeam.team_name,
        email: profile.email
      };
      this.mutateState((s) => s.groupMembers.push(member));
      this.processUpdate();
    }

    renderMember(member: ApiT.GroupMember) {
      var exec = _.find(this.state.groupIndividuals, {
        email: member.email
      });
      if (!_.isEmpty(exec)) this.state.selectedRole = exec.role;
      else this.state.selectedRole = Text.GroupRoleMember;
      // State of editing a group member
      if (this.state.editMember === member.email) {
        return <div className="list-group-item" key={member.teamid}>
          <div className="form-group">
            <div className="one-line">
              <i className="fa fa-fw fa-user"></i>
              {" "}{member.name}{" "}
              <i className="fa fa-fw fa-calendar"></i>
            </div>
            <div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-owner")} name="group-role"
                       onClick={() => this.state.selectedRole = Text.GroupRoleOwner}
                       defaultChecked={this.state.selectedRole === Text.GroupRoleOwner} />
                <label htmlFor={this.getId("role-owner")} className="group-role-label">
                  {Text.GroupRoleOwner}
                </label>
              </div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-manager")} name="group-role"
                       onClick={() => this.state.selectedRole = Text.GroupRoleManager}
                       defaultChecked={this.state.selectedRole === Text.GroupRoleManager} />
                <label htmlFor={this.getId("role-manager")} className="group-role-label">
                  {Text.GroupRoleManager}
                </label>
              </div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-member")} name="group-role"
                       onClick={() => this.state.selectedRole = Text.GroupRoleMember}
                       defaultChecked={this.state.selectedRole === Text.GroupRoleMember} />
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
                      onClick={this.submitEditMember.bind(this)}>
                Save
              </button>
            </div>
          </div>
        </div>;
      }

      return <div className="list-group-item one-line" key={member.teamid}>
        <i className="fa fa-fw fa-user" />
        {" "}{member.name}{" "}
        <i className="fa fa-fw fa-calendar"></i>
        { this.props.isOwner || this.props.isAdmin ?
          <span>
            <a className="pull-right text-danger" title="Delete"
               onClick={(e) => this.removeMember(member)}>
              <i className="fa fa-fw fa-trash list-group-item-text" />
            </a>
            <a className="pull-right text-info" title="Edit"
               onClick={(e) => this.showEditFor(member.email)}>
              <i className="fa fa-fw fa-pencil list-group-item-text" />
            </a>
          </span> : null
        }
      </div>;
    }

    renderIndividual(gim: ApiT.GroupIndividual) {
      // State of editing a group member
      if (this.state.editMember === gim.email) {
        this.state.selectedRole = gim.role;
        return <div className="list-group-item" key={gim.email}>
          <div className="form-group">
            <div className="one-line">
              <i className="fa fa-fw fa-user"></i>
              {gim.email}
            </div>
            <div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-owner")} name="group-role"
                       defaultChecked={gim.role === Text.GroupRoleOwner}
                       onClick={() => this.state.selectedRole = Text.GroupRoleOwner} />
                <label htmlFor={this.getId("role-owner")} className="group-role-label">
                  {Text.GroupRoleOwner}
                </label>
              </div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-manager")} name="group-role"
                       defaultChecked={gim.role === Text.GroupRoleManager}
                       onClick={() => this.state.selectedRole = Text.GroupRoleManager} />
                <label htmlFor={this.getId("role-manager")} className="group-role-label">
                  {Text.GroupRoleManager}
                </label>
              </div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-member")} name="group-role"
                       defaultChecked={gim.role === Text.GroupRoleMember}
                       onClick={() => this.state.selectedRole = Text.GroupRoleMember} />
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
                onClick={(e) => this.showEditFor(gim.email)}>
                 <i className="fa fa-fw fa-pencil list-group-item-text" />
            </a>
          </span> :
          null
        }
      </div>;
    }

    resetState() {
      this.mutateState((s) => {
        s.teamFilter = "";
        s.selectedRole = Text.GroupRoleMember;
        s.editMember = null;
        s.hasInvalidEmail = false;
        s.hasIndividualEmail = false;
      });
    }

    showEditFor(email: string) {
      this.mutateState((s) => s.editMember = email);
    }

    submitEditMember() {
      var member = _.find(this.state.groupMembers, {
        email: this.state.editMember
      });
      if (_.isEmpty(member)) return;

      if (!_.isEmpty(this.props.groupid)) {
        Api.putGroupIndividualByEmail(this.props.groupid, member.email, {
          role: this.state.selectedRole
        });
      }
      this.resetState();
    }

    submitEditIndividual() {
      var gim = _.find(this.state.groupIndividuals, {
        email: this.state.editMember
      });
      if (_.isEmpty(gim)) return;

      if (!_.isEmpty(this.props.groupid)) {
          gim.role = this.state.selectedRole;
          Api.putGroupIndividual(this.props.groupid, gim.uid, {
            role: this.state.selectedRole
          });
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

    onNameInputChange(event: React.FormEvent) {
      var name = (event.target as HTMLInputElement).value
      this.mutateState((s) => s.name = name);
      if (_.isEmpty(name)) return;
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
