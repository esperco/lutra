/*
  Component for managing members in an existing group
*/

module Esper.Components {
  interface Props {
    group: ApiT.Group;
    teams: ApiT.Team[];
    onRoleChange: (email: string, role: ApiT.GroupRole) => void;
    onRemove: (email: string) => void;
    onToggleCalendar: (email: string) => void;
  }

  export function GroupMemberList(props: Props & {
    onAdd: (email: string) => void;
    emails: string[]; // For auto-complete
  }) {
    var persons = getPersons(props.group);
    var selfGIM = _.find(props.group.group_individuals,
      (gim) => gim.uid === Login.me() || gim.email === Login.myEmail());
    var isSuper = (selfGIM && selfGIM.role === "Owner") ||
      Login.data.is_admin;

    return <div>
      <div className="list-group">
        { _.map(persons, (p) => <GroupMember
          key={p.email}
          person={p}
          isSuper={isSuper}
          group={props.group}
          teams={props.teams}
          onRoleChange={props.onRoleChange}
          onRemove={props.onRemove}
          onToggleCalendar={props.onToggleCalendar}
        />)}
      </div>

      { selfGIM ? <GroupMemberAdd
        group={props.group}
        onSubmit={props.onAdd}
        emails={props.emails}
      /> : null }
    </div>;
  }

  /*
    Single component for displaying a team or individual group member
  */
  interface HasTeam {
    email: string;
    team: ApiT.GroupMember
  }

  interface HasGIM {
    email: string;
    gim: ApiT.GroupIndividual;
  }

  type Person = HasTeam|HasGIM|(HasTeam&HasGIM);

  function hasTeam(m: Person): m is HasTeam|(HasGIM&HasTeam) {
    return !!(m as any).team;
  }

  function hasGIM(m: Person): m is HasGIM|(HasGIM&HasTeam) {
    return !!(m as any).gim;
  }

  function getPersons(group: ApiT.Group): Person[] {
    // Merge individuals + members into single list by e-mail
    var emailMap: { [email: string]: Person } = {};
    _.each(group.group_individuals, (i) => {
      let current = emailMap[i.email];
      if (current) {
        (current as HasGIM).gim = i;
      } else {
        emailMap[i.email] = { email: i.email, gim: i };
      }
    });

    _.each(group.group_teams, (t) => {
      let current = emailMap[t.email];
      if (current) {
        (current as HasTeam).team = t;
      } else {
        emailMap[t.email] = { email: t.email, team: t };
      }
    });

    return _.map(emailMap, (v) => v);
  }

  function GroupMember(props: Props & {
    person: Person;
    isSuper?: boolean;
  }) {
    // Figure out permissions
    let person = props.person;
    let canChangeRole = props.isSuper;
    let partOfTeam = hasTeam(person) ? !!_.find(props.teams,
      (t) => t.teamid === person.team.teamid
    ) : false;
    let canRemove = canChangeRole
      || (hasGIM(person) ? person.gim.uid === Login.myUid() : false)
      || partOfTeam;
    let canRemoveCals = partOfTeam || (hasTeam(person) && props.isSuper);
    let canAddCals = !hasTeam(person) &&
      !!_.find(props.teams, (t) => t.team_executive === person.gim.uid);

    // Don't allow change role or removal if last admin
    let numAdmins = _.filter(props.group.group_individuals,
      (gim) => gim.role === "Owner"
    ).length;
    if (numAdmins <= 1 && hasGIM(person) && person.gim.role === "Owner") {
      canRemove = canChangeRole = false;
    }

    let name = hasTeam(person) ? person.team.name : person.gim.email;
    let role = hasGIM(person) ? person.gim.role : "Member" as ApiT.GroupRole;
    let sharing = hasTeam(person);

    return <div className="list-group-item clearfix">
      { sharing ?
        <Tooltip title={Text.GroupCalendarSharing}>
          <i className="fa fa-fw fa-calendar-check-o" />
        </Tooltip> :
        <i className="fa fa-fw fa-calendar-o text-muted" />
      }
      {" " + name + " "}

      { canRemove || canChangeRole || canRemoveCals || canAddCals ?

        <div className="pull-right"><Dropdown>
          <GroupRole role={role} className="dropdown-toggle" editable={true} />
          <div className="dropdown-menu">
            { canChangeRole ? <RadioList
              className="esper-select-menu"
              listClasses="esper-select-menu"
              itemClasses="esper-selectable"
              choices={[{
                id: "Owner",
                displayAs: <GroupRoleDescription role="Owner" />
              }, {
                id: "Manager",
                displayAs: <GroupRoleDescription role="Manager" />
              }, {
                id: "Member",
                displayAs: <GroupRoleDescription role="Member" />
              }]}
              selectedId={role}
              updateFn={(newRole) =>
                props.onRoleChange(person.email, newRole as ApiT.GroupRole)
              }
            /> : <div className="esper-select-menu">
              <div className="esper-selectable">
                <GroupRoleDescription role={role} />
              </div>
            </div> }

            { (canRemoveCals || canAddCals) ?
              <div className="esper-select-menu">
                <div className="esper-selectable"
                     onClick={() => props.onToggleCalendar(person.email)}>
                  <i className={classNames("fa fa-fw", {
                    "fa-calendar-times-o": canRemoveCals,
                    "fa-calendar-plus-o": canAddCals
                  })} />{" "}
                  <div>
                    <div className="title">{
                      canRemoveCals ?
                      Text.RemoveGroupTeam :
                      Text.AddGroupTeam
                    }</div>
                    <div className="description">
                      {
                        canRemoveCals ?
                        Text.RemoveGroupTeamDescription :
                        Text.AddGroupTeamDescription
                      }
                    </div>
                  </div>
                </div>
              </div> : null }

            { canRemove ? <div className="esper-select-menu">
              <div className="esper-selectable text-danger"
                   onClick={() => props.onRemove(person.email)}>
                <i className="fa fa-fw fa-trash" />{" "}
                { Text.RemoveGroupMember }
              </div>
            </div> : null }

          </div>
        </Dropdown></div> :

        <GroupRole role={role} className="pull-right" editable={false} />
      }
    </div>;
  }

  function GroupRole({role, className, editable, onClick}: {
    role: ApiT.GroupRole;
    className?: string;
    editable?: boolean
    onClick?: () => void;
  }) {
    return <span className={classNames("role-box", className, {
      editable: editable
    })} onClick={onClick}>
      { Util.match(role, [
        ["Owner", Text.GroupRoleOwner],
        ["Manager", Text.GroupRoleManager],
      ], Text.GroupRoleMember) }
      <i className={classNames("fa fa-fw", {
        "fa-caret-down": editable
      })} />
    </span>;
  }

  function GroupRoleDescription({role}: {role: ApiT.GroupRole}) {
    if (role === "Owner") {
      return <div>
        <div className="title">
          { Text.GroupRoleOwner }
        </div>
        <div className="description">
          { Text.GroupRoleOwnerDescription }
        </div>
      </div>;
    }

    else if (role === "Manager") {
      return <div>
        <div className="title">
          { Text.GroupRoleManager }
        </div>
        <div className="description">
          { Text.GroupRoleManagerDescription }
        </div>
      </div>;
    }

    return <div>
      <div className="title">
        { Text.GroupRoleMember }
      </div>
      <div className="description">
        { Text.GroupRoleMemberDescription }
      </div>
    </div>;
  }


  interface AddProps {
    group: ApiT.Group;
    onSubmit: (email: string) => void;

    // Used for auto-complete
    emails: string[];
  }

  class GroupMemberAdd extends ReactHelpers.Component<AddProps, {
    active?: boolean;
    invalid?: boolean;
  }> {
    _input: Components.FilterInput;
    _list: Components.FilterList;

    constructor(props: AddProps) {
      super(props);
      this.state = {};
    }

    componentWillReceiveProps(newProps: AddProps) {
      if (newProps.group.groupid !== this.props.group.groupid) {
        this.mutateState((s) => s.active = false);
      }
    }

    render() {
      return <div>
        <div className={classNames("form-group", {
          "has-error": this.state.invalid
        })}>
          <div className="input-group">
            <Components.FilterInput
              ref={(c) => this._input = c}
              placeholder="email@example.com"
              getList={() => this._list}
              onFocus={() => this.onFocus()}
              onSubmit={() => this.submit()}
            />
            <span className="input-group-btn">
              <button className="btn btn-default" type="button"
                      onClick={() => this.submit()}>
                <i className="fa fa-fw fa-plus" />
              </button>
            </span>
          </div>
        </div>

        { this.state.active ?
          <Components.FilterList
            ref={(c) => this._list = c}
            choices={this.props.emails}
            className="esper-select-menu"
            itemFn={(email, active) => this.renderEmailItem(email, active)}
            newItemFn={(email, active) => this.renderEmailItem(email, active)}
            showNewItem={Util.validateEmailAddress}
            maxNewItems={5}
          /> : null }
      </div>;
    }

    renderEmailItem(email: string, active: boolean) {
      return <div key={email} className={classNames("esper-selectable", {
        highlight: active
      })} onClick={() => this.submit(email)}>
        <i className="fa fa-fw fa-user-plus" />{" "}{ email }
      </div>;
    }

    onFocus() {
      this.mutateState((s) => s.active = true);
    }

    submit(email?: string) {
      this.mutateState((s) => s.invalid = false);
      email = email || (() => {
        if (this._list) {
          var val = this._list.getValue();
          if (Util.validateEmailAddress(val)) {
            return val;
          } else {
            this.mutateState((s) => s.invalid = true);
          }
        }
        return "";
      })();

      if (email) {
        this.props.onSubmit(email);
        if (this._input) { this._input.reset(); }
      }
    }
  }
}
