/*
  Label settings for a given group
*/

/// <reference path="./Views.GroupSettings.tsx" />
/// <reference path="./Components.LabelManager.tsx" />

module Esper.Views {

  export class GroupLabelSettings extends GroupSettings {
    pathFn = Paths.Manage.Group.labels;

    renderMain(group: ApiT.Group) {
      var myself = _.find(group.group_individuals, {
        uid: Login.me()
      });

      var addPermission = false;
      if (!_.isEmpty(myself) && myself.role !== Text.GroupRoleMember)
        addPermission = true;
      return <div className="panel panel-default">
        <div className="panel-body">
          <Components.LabelManager getLabelInfos={this.getLabelInfos(group)}
            addLabel={this.addLabel(group)} archiveFn={this.archive(group)}
            removeLabel={this.removeLabel(group)} renameLabel={this.renameLabel(group)}
            setLabelColor={this.setLabelColor(group)} addPermission={addPermission} />
        </div>
      </div>;
    }

    setLabelColor(group: ApiT.Group) {
      return function(oldInfo: ApiT.LabelInfo, newColor: string) {
        return Actions.Groups.setLabelColor(group.groupid, oldInfo, newColor);
      };
    }

    getLabelInfos(group: ApiT.Group): () => ApiT.LabelInfo[] {
      return function() {
        return Labels.sortLabelInfos(group.group_labels);
      };
    }

    addLabel(group: ApiT.Group) {
      return function(label: Types.LabelBase) {
        Actions.Groups.addLabel(group.groupid, label);
      };
    }

    archive(group: ApiT.Group) {
      return function(label: Types.LabelBase) {
        Actions.Groups.rmLabel(group.groupid, label);
      };
    }

    removeLabel(group: ApiT.Group) {
      var archive = this.archive(group);
      return function(label: Types.LabelBase) {
        archive(label);
        // FIXME: Disable batch labelling until we properly figure this out
        // Actions.BatchLabels.remove(this.props.group.groupid, label);
      };
    }

    renameLabel(group: ApiT.Group) {
      return function(orig: Types.LabelBase, val: Types.LabelBase) {
        Actions.Groups.renameLabel(group.groupid, orig, val);
        // FIXME: Disable batch labelling until we properly figure this out
        // Actions.BatchLabels.rename(this.props.group.groupid, orig, val);
      };
    }
  }
}





