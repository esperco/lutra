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
            addPermission={true} />
        </div>
      </div>;
    }

    getLabelInfos(team: ApiT.Team): () => ApiT.LabelInfo[] {
      return function() {
        return Labels.sortLabelInfos(team.team_api.team_labels);
      };
    }

    addLabel(team: ApiT.Team) {
      return function(label: string) {
        Actions.Teams.addLabel(team.teamid, label);
      };
    }

    archive(team: ApiT.Team) {
      return function(label: string) {
        Actions.Teams.rmLabel(team.teamid, label);
      };
    }

    removeLabel(team: ApiT.Team) {
      var archive = this.archive(team);
      return function(label: string) {
        archive(label);
        Actions.BatchLabels.remove(team.teamid, label);
      };
    }

    renameLabel(team: ApiT.Team) {
      return function(orig: string, val: string) {
          Actions.Teams.renameLabel(team.teamid, orig, val);
          Actions.BatchLabels.rename(team.teamid, orig, val);
      };
    }
  }
}





