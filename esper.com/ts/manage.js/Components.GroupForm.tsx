/*
  Form used in editing group name, timezone, etc.
*/

module Esper.Components {
  interface Props extends Actions.Groups.GroupData {
    userCalendars: Option.T<ApiT.GenericCalendar[]>;
    isAdmin?: boolean;
    isOwner?: boolean;
    groupid?: string;
    onUpdate?: () => void;
  }

  interface State extends Actions.Groups.GroupData {
    teamFilter: string;
    emailFilter: string;
    selectedRole: ApiT.GroupRole;
    editMember?: string;
    hasInvalidEmail?: boolean;
  }

  export class GroupForm extends ReactHelpers.Component<Props, State> {

    constructor(props: Props) {
      super(props);
      this.state = {
        name: props.name,
        uid: props.uid,
        timezone: props.timezone,
        groupMembers: props.groupMembers,
        groupIndividuals: props.groupIndividuals,
        teamFilter: "",
        emailFilter: "",
        selectedRole: "Member"
      };
    }

    // Reset state on prop change
    componentWillReceiveProps(props: Props) {
      if (! _.isEqual(this.props, props)) {
        this.state = {
          name: props.name,
          uid: props.uid,
          timezone: props.timezone,
          groupMembers: props.groupMembers,
          groupIndividuals: props.groupIndividuals,
          teamFilter: "",
          emailFilter: "",
          selectedRole: "Member"
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
             placeholder="The Avengers"
             disabled={!this.props.isAdmin && !this.props.isOwner} />
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
              disabled={!this.props.isAdmin && !this.props.isOwner}
            />
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
            No {Text.GroupMembers} found
          </div>
          :
          <div>
            <label className="esper-header">
              { "Other " + Text.TeamExecs + " in " +
                (this.state.name || "this " + Text.Group) }
            </label>
            <div className="list-group">

              { _.map(this.state.groupMembers, (member) =>
                      this.renderMember(member)) }
              { _.map(individuals, (gim) =>
                      this.renderIndividual(gim)) }
            </div>
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

    updateTimezone(tz: string) {
      this.mutateState((s) => s.timezone = tz);
      this.processUpdate();
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
                   disabled={!this.props.isAdmin && !this.props.isOwner}
            />
            { _.isEmpty(this.state.teamFilter) ?
              <span /> :
              <span className="esper-clear-action esper-right-icon"
                    onClick={() => this.resetState()}>
                <i className="fa fa-fw fa-times" />
              </span>
            }
          </div>
          { this.props.isAdmin || this.props.isOwner ?
              this.renderTeams() : null }
        </div>
      </div>;
    }

    renderIndividualInput() {
      return <div className="form-group">
        <label htmlFor={this.getId("new-individuals")}
               className="col-md-2 control-label">
          {Text.AddGroupIndividualLink}
        </label>
        <div className="col-md-10">
          <div className="input-group">
            <div className={_.isEmpty(this.state.emailFilter) ?
                              "" : "esper-has-right-icon"}>
              <input type="text"
                     className="form-control"
                     id={this.getId("new-individuals")}
                     onKeyDown={this.inputEmailKeydown.bind(this)}
                     onChange={(e) => this.onIndividualEmailChange(e)}
                     placeholder="john.doe@esper.com"
                     disabled={!this.props.isAdmin && !this.props.isOwner} />
              { _.isEmpty(this.state.emailFilter) ?
                <span /> :
                <span className="esper-clear-action esper-right-icon"
                      onClick={() => {
                        this.mutateState((s) => {
                          s.hasInvalidEmail = false;
                          s.emailFilter = "";
                        });
                      }}>
                  <i className="fa fa-fw fa-times" />
                </span>
              }
            </div>
            <span className="input-group-btn">
              <button className="btn btn-default" type="button"
                      onClick={this.addIndividual.bind(this)}
                      disabled={!this.props.isAdmin && !this.props.isOwner}>
                <i className="fa fa-fw fa-plus" />
              </button>
            </span>
          </div>
          { this.props.isAdmin || this.props.isOwner ?
              this.renderIndividuals() : null }
        </div>
      </div>;
    }

    renderIndividuals() {
      var emailFilter = this.state.emailFilter;
      return this.props.userCalendars.match({
        none: () => null,
        some: (allCalendars) => {
          var gimEmails = _.map(this.state.groupIndividuals, (gim) => gim.email);
          var filteredCalendars = _.filter(allCalendars, (cal) => {
            return !_.includes(gimEmails, cal.id)
              && Util.validateEmailAddress(cal.id)
              && !_.includes(cal.id, "calendar.google.com")
              && _.includes(cal.id.toLowerCase(), emailFilter.toLowerCase());
          });
          if (_.isEmpty(filteredCalendars) && !_.isEmpty(emailFilter)) {
            return <div className="esper-no-content">
              Add '{emailFilter}' to {this.state.name || "this " + Text.Group}
            </div>;
          }
          var emails = _.map(_.take(filteredCalendars, 5), (cal) => {
            return {
              id: cal.id,
              displayAs: cal.id
            };
          });
          return <ListSelectorSimple choices={emails} selectedIds={null}
            updateFn={(ids) => this.addIndividual.call(this, ids[0])}
            unselectedIcon=" " />;
        }
      });
    }

    addIndividual(selectedEmail?: string) {
      var email: string;
      if (_.isEmpty(selectedEmail))
        email = this.state.emailFilter;
      else
        email = selectedEmail;
      if (!Util.validateEmailAddress(email)) {
        this.mutateState((s) => s.hasInvalidEmail = true);
        return;
      }

      var individual = {
        email,
        role: "Member" as ApiT.GroupRole
      };
      this.mutateState((s) => {
        s.groupIndividuals.push(individual);
        s.hasInvalidEmail = false;
      });
      this.processUpdate();

      if (_.isEmpty(selectedEmail))
        this.state.emailFilter = "";
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
        this.state.emailFilter = "";
        this.resetState();
      }
    }

    onIndividualEmailChange(e: React.FormEvent) {
      var val = (e.target as HTMLInputElement).value;
      this.mutateState((s) => s.emailFilter = val);
    }

    onTeamFilterChange(e: React.FormEvent) {
      var val = (e.target as HTMLInputElement).value;
      this.mutateState((s) => s.teamFilter = val);
    }

    renderTeams() {
      var teamFilter = this.state.teamFilter;
      var memberIds = _.map(this.state.groupMembers, (member) => {
        return member.teamid;
      });
      var filteredTeams = _.filter(Stores.Teams.all(), (team) => {
        return !_.includes(memberIds, team.teamid)
          && _.includes(team.team_name.toLowerCase(),
                        teamFilter.toLowerCase());
      });
      if (_.isEmpty(filteredTeams)) {
        if (_.isEmpty(teamFilter)) {
          return <div className="esper-no-content">
            There are no available { Text.TeamExecs } to add
          </div>;
        }
        return <div className="esper-no-content">
          No { Text.TeamExec } with the name containing '{ teamFilter }' found
        </div>;
      }
      var filteredMembers = _.map(_.take(filteredTeams, 5), (team) => {
        return {
          id: team.teamid,
          displayAs: team.team_name
        };
      });
      return <ListSelectorSimple choices={filteredMembers} unselectedIcon=" "
        selectedIds={null} updateFn={this.addTeam.bind(this)} />;
    }

    addTeam(selected: string[]) {
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

    displayGroupRole(role: ApiT.GroupRole) {
      if (role === "Member")
        return Text.GroupRoleMember;
      else if (role === "Manager")
        return Text.GroupRoleManager;
      else
        return Text.GroupRoleOwner;
    }

    renderMember(member: ApiT.GroupMember) {
      var exec = _.find(this.state.groupIndividuals, {
        email: member.email
      });
      if (!_.isEmpty(exec)) this.state.selectedRole = exec.role;
      else this.state.selectedRole = "Member";

      var isOwnTeam = Stores.Teams.get(member.teamid).match({
        none: () => false,
        some: () => true
      });
      // State of editing a group member
      if (this.state.editMember === member.email) {
        return <div className="list-group-item" key={member.teamid}>
          <div className="form-group">
            <div className="one-line">
              <i className="fa fa-fw fa-user"></i>
              {" "}{member.name}{" "}
              <Tooltip title={Text.GroupCalendarSharing}>
                <i className="fa fa-fw fa-calendar"></i>
              </Tooltip>
            </div>
            <div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-owner")}
                       name="group-role"
                       onClick={() => this.state.selectedRole = "Owner"}
                       defaultChecked={this.state.selectedRole === "Owner"} />
                <label htmlFor={this.getId("role-owner")}
                       className="group-role-label">
                  {Text.GroupRoleOwner}
                </label>
              </div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-manager")}
                       name="group-role"
                       onClick={() => this.state.selectedRole = "Manager"}
                       defaultChecked={this.state.selectedRole === "Manager"} />
                <label htmlFor={this.getId("role-manager")}
                       className="group-role-label">
                  {Text.GroupRoleManager}
                </label>
              </div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-member")}
                       name="group-role"
                       onClick={() => this.state.selectedRole = "Member"}
                       defaultChecked={this.state.selectedRole === "Member"} />
                <label htmlFor={this.getId("role-member")}
                       className="group-role-label">
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

      return <div className="list-group-item" key={member.teamid}>
        <i className="fa fa-fw fa-user" />
        {" "}{member.name}{" "}
        <Tooltip title={Text.GroupCalendarSharing}>
          <i className="fa fa-fw fa-calendar" />
        </Tooltip>
        {" "}
        { this.props.isOwner || this.props.isAdmin || isOwnTeam ?
          <span>
            <a className="pull-right text-danger" title="Delete"
               onClick={(e) => this.removeMember(member)}>
              <i className="fa fa-fw fa-trash list-group-item-text" />
            </a>
            { this.props.isOwner || this.props.isAdmin ?
              <Tooltip className="pull-right"
                       title={Text.ClickToEdit("role")}
                       onClick={() => this.showEditFor(member.email)}>
                <span className="badge role-box pull-right editable">
                  {_.isEmpty(exec) ? Text.GroupRoleMember
                    : this.displayGroupRole(exec.role)}
                </span>
              </Tooltip>
              :
              <span className="badge role-box pull-right">
                {_.isEmpty(exec) ? Text.GroupRoleMember
                  : this.displayGroupRole(exec.role)}
              </span>
            }
          </span>
          :
          <span className="badge role-box pull-right">
            {_.isEmpty(exec) ? Text.GroupRoleMember
              : this.displayGroupRole(exec.role)}
          </span>
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
              {" "}{gim.email}{" "}
            </div>
            <div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-owner")} name="group-role"
                       defaultChecked={gim.role === "Owner"}
                       onClick={() => this.state.selectedRole = "Owner"} />
                <label htmlFor={this.getId("role-owner")} className="group-role-label">
                  {Text.GroupRoleOwner}
                </label>
              </div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-manager")} name="group-role"
                       defaultChecked={gim.role === "Manager"}
                       onClick={() => this.state.selectedRole = "Manager"} />
                <label htmlFor={this.getId("role-manager")} className="group-role-label">
                  {Text.GroupRoleManager}
                </label>
              </div>
              <div className="esper-selectable">
                <input type="radio" id={this.getId("role-member")} name="group-role"
                       defaultChecked={gim.role === "Member"}
                       onClick={() => this.state.selectedRole = "Member"} />
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
          </span>
          :
          <span className="badge role-box pull-right">
            {this.displayGroupRole(gim.role)}
          </span>
        }
      </div>;
    }

    resetState() {
      this.mutateState((s) => {
        s.teamFilter = "";
        s.emailFilter = "";
        s.selectedRole = "Member";
        s.editMember = null;
        s.hasInvalidEmail = false;
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
        Actions.Groups.setGroupMemberRole(this.props.groupid,
                                          this.state.selectedRole,
                                          { email: member.email });
      }
      this.resetState();
    }

    submitEditIndividual() {
      var gim = _.find(this.state.groupIndividuals, {
        email: this.state.editMember
      });
      if (_.isEmpty(gim)) return;

      if (!_.isEmpty(this.props.groupid)) {
        Actions.Groups.setGroupMemberRole(this.props.groupid,
                                          this.state.selectedRole,
                                          { uid: gim.uid });
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
