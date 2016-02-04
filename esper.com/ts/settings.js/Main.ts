/* Main modules */

// Some external references

/// <reference path="./Esper.ts" />
/// <reference path="../lib/Log.ts" />
/// <reference path="../lib/Watchable.ts" />
/// <reference path="../lib/JsonHttp.ts" />
/// <reference path="../lib/ApiT.ts" />
/// <reference path="../lib/Api.ts" />
/// <reference path="../lib/XDate.ts" />
/// <reference path="../common/Analytics.Web.ts"/>
/// <reference path="../common/Login.ts" />
/// <reference path="../common/Route.ts" />
/// <reference path="./Pay.ts" />
/// <reference path="./Status.ts" />
/// <reference path="./Svg.ts" />


module Esper.Main {

  function main() {
    Svg.init();
    Login.init();
    Route.setBase("/settings");
    Route.init();
    Status.init();
    Pay.init();
    (<any> $("[data-toggle='tooltip']")).tooltip(); // FIXME
  }

  $(document).ready(main);

}
