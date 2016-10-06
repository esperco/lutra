/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamPaySettings extends TeamSettings {
    pathFn = Paths.Manage.Team.pay;

    // TODO
    renderMain(team: ApiT.Team) {
      return <div className="panel panel-default">
        <div className="panel-body">
          Hello world
        </div>
      </div>;
    }
  }
}
