/*
  Helpers for using Facebook's React with Esper. Depends on jQuery UI
  being present.
*/

/// <reference path="../typings/react/react-global.d.ts" />
/// <reference path="./JQStore.ts" />

module Esper.ReactHelpers {

  // Returns a container into which you can render a React element.
  // When the jQuery object
  export class Container {
    elm: JQuery;

    constructor(type="<div>") {
      this.elm = $(type);

      // Call React clean-up on unbind
      var self = this;
      this.elm.bind('destroyed', function() {
        React.unmountComponentAtNode(self.elm.get(0));
      });
    }

    render(r: React.ReactElement<any>) {
      React.render(r, this.elm.get(0));
    }
  }
}