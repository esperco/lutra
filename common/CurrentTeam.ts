/// <reference path="./Option.ts" />
module Esper.CurrentTeam {

  export var currentTeam = new Esper.Watchable.C<Option.T<ApiT.Team>>(
    function (team) { return team !== undefined && team !== null; },
    Option.none<ApiT.Team>()
  );

}
