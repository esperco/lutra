/*
  Helpers for using Facebook's React with Esper. Depends on jQuery UI
  being present.
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Model2.ts" />
/// <reference path="./Test.ts" />

module Esper.ReactHelpers {
  // Set listener in scope to use
  var listener: jasmine.Spy;

  class TestComponent extends Component<{}, {}> {
    componentWillUnmount() {
      if (listener) { listener(); }
    }

    render() {
      return React.createElement("div", {className: "dog"}, [
        React.createElement("div", { className: "cat", key: "cat" })
      ]);
    }
  }

  var listener2: jasmine.Spy;

  class TestComponent2 extends Component<{}, {}> {
    componentWillUnmount() {
      if (listener2) { listener2(); }
    }

    render() {
      return React.createElement("div", { className: "fish" }, [
        React.createElement("div", { className: "bird", key: "bird" })
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

    describe("render same component into element in DOM twice", function() {
      beforeEach(function() {
        this.elm = $('<div class="top">');
        sandbox.append(this.elm);
        this.elm.renderReact(TestComponent, {});
        this.elm.renderReact(TestComponent, {});
      });

      it("should not call componentWillUnmount prior to removal", function() {
        expect(listener).not.toHaveBeenCalled();
      });

      it("should call componentWillUnmount when removed", function() {
        this.elm.remove();
        expect(listener).toHaveBeenCalled();
      });
    });

    describe("render different component into element in DOM", function() {
      beforeEach(function() {
        this.listener2 = listener2 = jasmine.createSpy("listener");
        this.elm = $('<div class="top">');
        sandbox.append(this.elm);
        this.elm.renderReact(TestComponent, {});
        this.elm.renderReact(TestComponent2, {});
      });

      it("should call componentWillUnmount on prior component", function() {
        expect(listener).toHaveBeenCalled();
      });

      it("should not call componentWillUnmount on current component prior " +
         "to removal", function() {
        expect(listener2).not.toHaveBeenCalled();
      });

      it("should not call each componentWillUnmount more than once on removal",
          function() {
        this.elm.remove();
        expect(listener.calls.count()).toEqual(1);
        expect(listener2.calls.count()).toEqual(1);
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

  var stringStore = new Model2.Store<string, string>();

  // NB: Wrap string in object because React needs an object
  class StoreComponent extends Component<{ prop: string }, { val: string }> {
    render() {
      return React.createElement("div", {},
        stringStore.get(this.props.prop).match({
          none: () => "",
          some: (s) => s.data.match({
            none: () => "",
            some: (v) => v
          })
        }));
    }

    componentDidMount(): void {
      this.setSources([stringStore]);
    }
  }

  describe("ReactHelpers.Component hooked up to store", function() {
    beforeEach(function() {
      this.sandbox = $("<div>").appendTo("body");
      this.elm = $('<div class="penguin">').appendTo(this.sandbox);
      stringStore.set("A", Option.some("first"));
      stringStore.set("B", Option.some("second"));
      this.elm.renderReact(StoreComponent, { prop: "A" });
      this.component = this.elm.reactComponent();
    });

    afterEach(function() {
      stringStore.reset();
      stringStore.removeAllChangeListeners();
      this.sandbox.remove();
    });

    it("should display initial state", function() {
      expect(this.component.jQuery().text()).toBe("first");
    });

    it("should use updated state on change", function() {
      stringStore.set("A", Option.some("plus"));
      expect(this.component.jQuery().text()).toBe("plus");
    });

    it("should use updated props on change", function() {
      this.elm.renderReact(StoreComponent, { prop: "B" });
      expect(this.component.jQuery().text()).toBe("second");
    });

    it("should disconnect on removal", function() {
      spyOn(this.component, "setState");
      this.sandbox.remove();
      stringStore.set("A", Option.some("plus"));
      expect(this.component.setState).not.toHaveBeenCalled();
    });
  });


  //////////

  class StatelessStoreComponent extends Component<{}, {}> {
    render() {
      return React.createElement("div", {}, stringStore.get("myVal").match({
        none: () => "",
        some: (s) => s.data.match({
          none: () => "",
          some: (v) => v
        })
      }));
    }

    componentDidMount(): void {
      this.setSources([stringStore]);
    }
  }

  describe("ReactHelpers.Component hooked up to a store without setState",
    function()
  {
    beforeEach(function() {
      stringStore.set("myVal", Option.some("first"));
      var elm = React.createElement(StatelessStoreComponent);
      this.component = Test.render(elm);
    });

    afterEach(function() {
      stringStore.reset();
      stringStore.removeAllChangeListeners();
    });

    it("should force update when a source changes", function() {
      spyOn(this.component, "render").and.callThrough();
      stringStore.set("myVal", Option.some("second"));
      expect(this.component.render).toHaveBeenCalled();
    });
  });


  //////

  var storeOneKey: "" = "";
  var storeOne = new Model2.Store<"", string>();
  var storeMany = new Model2.Store<string, string>();

  class DataComponent extends Component<{}, {}> {
    renderWithData() {
      var value = storeOne.get(storeOneKey)
        .flatMap((v1) => v1.data)
        .flatMap((v2) => storeMany.get(v2))
        .flatMap((v3) => v3.data)
        .match({
          none: () => "",
          some: (s) => s
        });
      return React.createElement('span', {}, value);
    }
  }

  describe("ReactHelpers.Component with renderData", function() {
    beforeEach(function() {
      var elm = React.createElement(DataComponent);
      this.component = Test.render(elm);
      spyOn(this.component, "render").and.callThrough();
    });

    afterEach(function() {
      storeOne.reset();
      storeOne.removeAllChangeListeners();
      storeMany.reset();
      storeMany.removeAllChangeListeners();
    });

    it("should re-render when first-order store changes", function() {
      storeOne.set(storeOneKey, Option.some("x"));
      expect(this.component.render.calls.count()).toEqual(1);

      storeMany.set("x", Option.some("5"));
      expect(this.component.render.calls.count()).toEqual(2);
    });

    it("should not re-render when second-order store changes if first-order " +
       "store value would prevent second-order from being called", function()
    {
      storeMany.set("x", Option.some("5"));
      expect(this.component.render).not.toHaveBeenCalled();
    });

    it("should only re-render when affected keys are called", function() {
      storeOne.set(storeOneKey, Option.some("x"));
      expect(this.component.render.calls.count()).toEqual(1);

      storeMany.set("y", Option.some("5"));
      expect(this.component.render.calls.count()).toEqual(1);
    });

    it("should update for aliases", function() {
      storeOne.set(storeOneKey, Option.some("x"));
      storeMany.set("x", Option.some("5"), {
        aliases: ["y"]
      });
      storeMany.set("y", Option.some("6"));
      expect(this.component.render.calls.count()).toEqual(3);
    });
  });
}
