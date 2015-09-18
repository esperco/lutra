/*
  Helpers for using Facebook's React with Esper. Depends on jQuery UI
  being present.
*/

/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./ReactHelpers.Test.ts" />

module Esper.ReactHelpers {
  // Set listener in scope to use
  var listener: jasmine.Spy;

  class TestComponent extends React.Component<{}, {}> {
    componentWillUnmount() {
      if (listener) {
        listener();
      }
    }

    render() {
      return React.createElement("div");
    }
  }

  describe("ReactHelpers.Container", function() {
    var sandbox: JQuery;

    beforeEach(function() {
      sandbox = $("<div>");
      $("body").append(sandbox);
      this.container = new Container();
      this.listener = listener = jasmine.createSpy("listener");
      this.element = React.createElement(TestComponent);
      sandbox.append(this.container.get());
      this.container.render(this.element);
    });

    afterEach(function() {
      sandbox.remove();
    });

    it("should call componentWillUnmount when removed", function() {
      this.container.get().remove();
      expect(listener).toHaveBeenCalled();
    });

    it("should call componentWillUnmount when parent is removed", function() {
      sandbox.remove();
      expect(listener).toHaveBeenCalled();
    });
  });
}