/// <reference path="./Main.ts" />
/// <reference path="./Layout.Test.ts" />
/// <reference path="./Route.Test.ts" />
/// <reference path="./Teams.Test.ts" />
/// <reference path="./Calendars.Test.ts" />
/// <reference path="./Views.CalendarLabeling.Test.tsx" />
/// <reference path="./Views.LabelsOverTime.Test.tsx" />

module Esper {
  PRODUCTION = false;
  Api.prefix = "http://localhost";
  Conf.segmentKey = "QwsMs5clHuU0IhYhq664x8VyV32HFph6";

  if (location.pathname === "/test.html") {
    TESTING = true;
  }
}

