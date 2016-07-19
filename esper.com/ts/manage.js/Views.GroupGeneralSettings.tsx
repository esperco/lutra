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

      var prefs = Stores.TeamPreferences.get(group.groupid)
        .flatMap((p) => Option.some(p.general));

      return <div>
        <GroupInfo
          group={group} busy={busy} error={error}
        />

        <RemoveGroup group={group} />
      </div>;
    }
  }


  /* Separate component for the group settings */

  interface Props {
    group: ApiT.Group;
    busy?: boolean;
    error?: boolean;
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
      var myself = _.find(this.props.group.group_individuals, function(gim) {
        return gim.uid === Login.me();
      });
      var isOwner = _.isEmpty(myself) ? false : myself.role === "Owner";

      return <div className="panel panel-default">
        <div className="panel-body">
          <Components.ModalPanel
              busy={this.props.busy}
              error={this.props.error}
              success={this.state.didSave &&
                       !this.props.busy && !this.props.error}
              onCancel={() => this.save()} cancelText="Save">
            <Components.GroupForm ref={(c) => this._form = c}
              name={this.props.group.group_name}
              groupid={this.props.group.groupid}
              uid={Login.me()}
              timezone={this.props.group.group_timezone}
              groupMembers={this.props.group.group_teams || []}
              groupIndividuals={this.props.group.group_individuals || []}
              userCalendars={Stores.Calendars.listAllForUser()}
              isOwner={isOwner}
              onUpdate={this.delayedSave.bind(this)}
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
              timezone: d.timezone,
              groupMembers: d.groupMembers,
              groupIndividuals: d.groupIndividuals
            });
          }
        });
      }
    }
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
