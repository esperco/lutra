/* This module is used for the Marten app created to test individual modules */

/// <reference path="./Esper.ts"/>
/// <reference path="./Util.ts"/>
/// <reference path="./Log.ts"/>
/// <reference path="./Model.ts"/>
/// <reference path="./IndexPage.tsx"/>


module Esper.App {

  export function init() {
    $(document).ready(function() {
      var rootElm = $("#esper-root").get(0);
      if (rootElm) {
        React.render(
          React.createElement(IndexPage.IndexPage),
          document.body);
      } else {
        Log.info("Esper root not found.");
      }
    });
  }
}

Esper.App.init();
