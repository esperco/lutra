/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />
/// <reference path="./Components.LabelManager.tsx" />

module Esper.Views {

  export class TeamLabelSettings extends TeamSettings {
    pathFn = Paths.Manage.Team.labels;

    renderMain(team: ApiT.Team) {
      return <div className="panel panel-default">
        <div className="panel-body">
          <Components.LabelManager getLabelInfos={this.getLabelInfos(team)}
            addLabel={this.addLabel(team)} archiveFn={this.archive(team)}
            removeLabel={this.removeLabel(team)} renameLabel={this.renameLabel(team)}
            setLabelColor={this.setLabelColor(team)} addPermission={true} />
        </div>
      </div>;
    }

    getLabelInfos(team: ApiT.Team): () => ApiT.LabelInfo[] {
      return function() {
        return Labels.sortLabelInfos(team.team_api.team_labels);
      };
    }

    setLabelColor(team: ApiT.Team) {
      return function(oldInfo: ApiT.LabelInfo, newColor: string) {
        return Actions.Teams.setLabelColor(team.teamid, oldInfo, newColor);
      }
    }

    addLabel(team: ApiT.Team) {
      return function(label: Types.LabelBase) {
        Actions.Teams.addLabel(team.teamid, label);
      };
    }

    archive(team: ApiT.Team) {
      return function(label: Types.LabelBase) {
        Actions.Teams.rmLabel(team.teamid, label);
      };
    }

    removeLabel(team: ApiT.Team) {
      var archive = this.archive(team);
      return function(label: Types.LabelBase) {
        archive(label);
        Actions.BatchLabels.remove(team.teamid, label.displayAs);
      };
    }

    renameLabel(team: ApiT.Team) {
      return function(orig: Types.LabelBase, val: Types.LabelBase) {
          Actions.Teams.renameLabel(team.teamid, orig, val);
          Actions.BatchLabels.rename(team.teamid, orig.displayAs, val.displayAs);
      };
    }
  }
}
