/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamExport extends TeamSettings<{}> {
    pathFn = Paths.Manage.Team.exportCSV;

    renderMain(team: ApiT.Team) {
      return <span />;
    }
  }
}
