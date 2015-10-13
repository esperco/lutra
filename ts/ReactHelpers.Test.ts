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
      return React.createElement("div", {className: "dog"}, [
        React.createElement("div", { className: "cat" })
      ]);
    }
  }

  describe("ReactHelpers.renderReact", function() {
    var sandbox: JQuery;

    beforeEach(function() {
      sandbox = $("<div>");
      $("body").append(sandbox);
      this.listener = listener = jasmine.createSpy("listener");
    });

    afterEach(function() {
      sandbox.remove();
    });

    describe("render into element in DOM", function() {
      beforeEach(function() {
        this.elm = $('<div class="top">');
        sandbox.append(this.elm);
        this.elm.renderReact(TestComponent, {});
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

        it("should be able to get itself", function() {
          expect(this.component.jQuery().attr("class")).toEqual("dog");
        });

        it("should be able to get child element", function() {
          expect(this.component.find("div").attr("class")).toEqual("cat");
        });
      });
    });

    describe("render into element before insertion into DOM", function() {
      beforeEach(function() {
        this.elm = $('<div class="top">');
        this.elm.renderReact(TestComponent, {});
        sandbox.append(this.elm);
      });

      it("should still render the React element", function() {
        expect(sandbox.find(".cat").length).toBe(1);
      });

      it("should call componentWillUnmount when removed", function() {
        expect(listener).not.toHaveBeenCalled();
        this.elm.remove();
        expect(listener).toHaveBeenCalled();
      });
    });
  });


  /////////////

  var stringStore = new Model.StoreOne<string>();

  // NB: Wrap string in object because React needs an object
  class StoreComponent extends Component<{}, { val: string }> {
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

    componentDidMount(): void {
      this.setSources([stringStore]);
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
      expect(this.component.jQuery().text()).toBe("initial");
    });

    it("should display updated state on change", function() {
      stringStore.set("second");
      expect(this.component.jQuery().text()).toBe("second");
    });
  });
}