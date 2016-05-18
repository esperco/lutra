/*
  Calendar settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class CalendarSettings extends TeamSettings {
    renderMain(team: ApiT.Team) {
      return <div className="panel panel-default">
        <div className="panel-body">
          Calendar
        </div>
      </div>;
    }
  }
}
