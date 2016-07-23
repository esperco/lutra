/*
  General settings page
*/

/// <reference path="./Views.GroupSettings.tsx" />

module Esper.Views {

  export class GroupGeneralSettings extends GroupSettings {
    pathFn = Paths.Manage.Group.general;

    renderMain(group: ApiT.Group) {
      var busy = Stores.Groups.status(this.props.groupId).match({
        none: () => false,
        some: (d) => d === Model2.DataStatus.INFLIGHT
      });
      var error = Stores.Groups.status(this.props.groupId).match({
        none: () => true,
        some: (d) => d === Model2.DataStatus.PUSH_ERROR
      });

      var myself = _.find(group.group_individuals, function(gim) {
        return gim.uid === Login.me();
      });
      var isOwner = _.isEmpty(myself) ? false : myself.role === "Owner";

      return <div>
        <GroupInfo
          group={group} busy={busy} error={error} editable={isOwner}
        />

        <GroupMembers group={group} />

        { isOwner ? <RemoveGroup group={group} /> : null }
      </div>;
    }
  }


  /* Separate component for the group settings */

  interface Props {
    group: ApiT.Group;
    busy?: boolean;
    error?: boolean;
    editable?: boolean;
  }

  interface State {
    didSave?: boolean;
  }

  export class GroupInfo extends ReactHelpers.Component<Props, State> {
    _form: Components.GroupForm;
    _saveId = Util.randomString();

    constructor(props: Props) {
      super(props);
      this.state = {
        didSave: false
      }
    }

    render() {
      return <div className="panel panel-default">
        <div className="panel-body">
          <Components.ModalPanel
              busy={this.props.editable && this.props.busy}
              error={this.props.editable && this.props.error}
              success={this.props.editable && this.state.didSave &&
                       !this.props.busy && !this.props.error}
              onCancel={this.props.editable ? () => this.save() : null}
              cancelText={this.props.editable ? "Save" : null}>
            <Components.GroupForm ref={(c) => this._form = c}
              name={this.props.group.group_name}
              groupid={this.props.group.groupid}
              uid={Login.me()}
              editable={this.props.editable}
              timezone={this.props.group.group_timezone}
              onUpdate={this.save.bind(this)}
            />
          </Components.ModalPanel>
        </div>
      </div>;
    }

    // Save after inactivity
    delayedSave() {
      this.setState({ didSave: false });
      Util.delayOne(this._saveId, () => this.save(), 2000);
    }

    save() {
      if (this._form) {
        this._form.validate().match({
          none: () => null,
          some: (d) => {
            this.setState({ didSave: true });
            Actions.Groups.updateGroup(this.props.group.groupid, {
              name: d.name,
              uid: d.uid,
              timezone: d.timezone
            });
          }
        });
      }
    }
  }

  export function getAutoSuggestEmails(group: ApiT.Group): string[] {
    // Capture all e-mails already associated with this group
    let gimEmails = _.map(group.group_individuals, (gim) => gim.email);
    let teamEmails = _.map(group.group_teams, (t) => t.email);
    let teams = Option.flatten(
      _.map(group.group_teams, (t) => Stores.Teams.get(t.teamid))
    );
    let teamCals = _.flatten(
      _.map(teams, (t) => t.team_timestats_calendars)
    );
    let current = _.concat(gimEmails, teamEmails, teamCals);
    current = _.map(current, (c) => c.trim().toLowerCase());

    // Use team e-mails as sources of e-mail addresses
    var emails = _.map(Stores.Profiles.all(), (p) => p.email);

    // Capture e-mail addresses from calendar titels
    var calendars = _(Option.matchList(Stores.Calendars.listAllForUser()))
      .map((cal) => cal.id)
      .filter((calId) =>
        Util.validateEmailAddress(calId) &&
        !_.includes(calId, "calendar.google.com")
      )
      .value();

    return _(emails)
      .concat(calendars)
      .map((e) => e.trim().toLowerCase())
      .difference(current)
      .uniq()
      .value();
  }

  export function GroupMembers({group}: {group: ApiT.Group}) {
    var groupId = group.groupid;
    var emails = getAutoSuggestEmails(group);

    return <div className="panel panel-default">
      <div className="panel-body">
        <Components.GroupMemberList group={group}
          teams={Stores.Teams.all()}
          emails={emails}
          onAdd={(email) => Actions.Groups.addEmail(groupId, email)}
          onRemove={(email) => Actions.Groups.removeEmail(groupId, email)}
          onRoleChange={
            (email, role) => Actions.Groups.changeRole(groupId, email, role)
          }
          onToggleCalendar={
            (email) => Actions.Groups.toggleCalendar(groupId, email)
          }
        />
      </div>
    </div>;
  }

  export function RemoveGroup({group} : {group: ApiT.Group}) {
    return <div className="panel panel-default">
      <div className="panel-body clearfix">
        <span className="control-label esper-input-align">
          { Text.removeGroupDescription(group.group_name) }
        </span>
        <button className="pull-right btn btn-danger"
          onClick={() => removeGroup(group)}>
          { Text.RemoveGroupBtn }
        </button>
      </div>
    </div>;
  }

  function removeGroup(group: ApiT.Group) {
    Actions.Groups.removeGroup(group.groupid);
    Route.nav.go(Paths.Manage.Group.general());
  }
}
