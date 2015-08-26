/// <reference path="./Esper.ts"/>
/// <reference path="./TestPage.tsx"/>

module Esper.App {

  export function init() {
    $(document).ready(function() {
      var rootElm = $("#esper-root").get(0);
      if (rootElm) {
        React.render(
          React.createElement(TestPage.IndexPage),
          document.body);
      } else {
        console.log("Esper root not found.");
      }
    });
  }
}

Esper.App.init();
