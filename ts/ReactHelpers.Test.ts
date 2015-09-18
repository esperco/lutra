/*
  Helpers for using Facebook's React with Esper. Depends on jQuery UI
  being present.
*/

/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Model.StoreOne.ts" />

module Esper.ReactHelpers {
  // Set listener in scope to use
  var listener: jasmine.Spy;

  class TestComponent extends Component<{}, {}> {
    componentWillUnmount() {
      if (listener) {
        listener();
      }
    }

    render() {
      return React.createElement("div", {className: "cat"});
    }
  }

  describe("ReactHelpers.renderReact", function() {
    var sandbox: JQuery;

    beforeEach(function() {
      sandbox = $("<div>");
      $("body").append(sandbox);
      this.listener = listener = jasmine.createSpy("listener");
      this.elm = $('<div class="dog">');
      sandbox.append(this.elm);
      this.elm.renderReact(TestComponent, {});
    });

    afterEach(function() {
      sandbox.remove();
    });
    it("should call componentWillUnmount when removed", function() {
      this.elm.remove();
      expect(listener).toHaveBeenCalled();
    });

    it("should call componentWillUnmount when parent is removed", function() {
      sandbox.remove();
      expect(listener).toHaveBeenCalled();
    });

    describe("Component referenced from jQuery element", function() {
      beforeEach(function() {
        this.component = this.elm.reactComponent();
      });

      it("should exist", function() {
        expect(this.component).toBeDefined();
      });

      it("should be able to get parent", function() {
        expect(this.component.parent().attr("class")).toEqual("dog");
      });

      it("should be able to query itself", function() {
        expect(this.component.find("div").attr("class")).toEqual("cat");
      });

      it("should be able to unmount itself", function() {
        this.component.removeSelf();
        expect(listener).toHaveBeenCalled();
        expect($.contains(document.documentElement, this.elm.get(0)))
          .toBeFalsy();
      });
    });
  });


  /////////////

  var stringStore = new Model.StoreOne<string>();

  // NB: Wrap string in object because React needs an object
  class StoreComponent extends Component<{}, { val: string }> {
    static stores = [stringStore];

    getState(init=false) {
      if (init) {
        return { val: "initial" };
      } else {
        return { val: stringStore.val() };
      }
    }

    render() {
      return React.createElement("div", {}, this.state && this.state.val);
    }
  }

  describe("ReactHelpers.Component hooked up to store", function() {
    beforeEach(function() {
      this.sandbox = $("<div>").appendTo("body");
      this.elm = $('<div class="penguin">').appendTo(this.sandbox);
      stringStore.set("something");
      this.elm.renderReact(StoreComponent, {});
      this.component = this.elm.reactComponent();
    });

    afterEach(function() {
      stringStore.reset();
      stringStore.removeAllChangeListeners();
      this.sandbox.remove();
    });

    it("should display initial state", function() {
      expect(this.component.find("div").text()).toBe("initial");
    });

    it("should display updated state on change", function() {
      stringStore.set("second");
      expect(this.component.find("div").text()).toBe("second");
    });
  });
}