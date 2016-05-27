/*
  Label settings for a given group
*/

/// <reference path="./Views.GroupSettings.tsx" />
/// <reference path="./Components.LabelManager.tsx" />

module Esper.Views {

  export class GroupLabelSettings extends GroupSettings {
    pathFn = Paths.Manage.Group.labels;

    renderMain(group: ApiT.Group) {
      return <div className="panel panel-default">
        <div className="panel-body">
          <Components.LabelManager getLabels={this.getLabels(group)}
            addLabel={this.addLabel(group)} archiveFn={this.archive(group)}
            removeLabel={this.removeLabel(group)} renameLabel={this.renameLabel(group)} />
        </div>
      </div>;
    }

    getLabels(group: ApiT.Group): () => string[] {
      return function() {
        return Labels.sortLabelStrs(group.group_labels);
      };
    }

    addLabel(group: ApiT.Group) {
      return function(label: string) {
        Actions.Groups.addLabel(group.groupid, label);
      };
    }

    archive(group: ApiT.Group) {
      return function(label: string) {
        Actions.Groups.rmLabel(group.groupid, label);
      };
    }

    removeLabel(group: ApiT.Group) {
      var archive = this.archive(group);
      return function(label: string) {
        archive(label);
        // FIXME: Disable batch labelling until we properly figure this out
        // Actions.BatchLabels.remove(this.props.group.groupid, label);
      };
    }

    renameLabel(group: ApiT.Group) {
      return function(orig: string, val: string) {
        Actions.Groups.renameLabel(group.groupid, orig, val);
        // FIXME: Disable batch labelling until we properly figure this out
        // Actions.BatchLabels.rename(this.props.group.groupid, orig, val);
      };
    }
  }
}





