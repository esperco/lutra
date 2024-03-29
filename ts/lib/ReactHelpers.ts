/*
  Helpers for using Facebook's React with Esper. Depends on jQuery UI
  being present.
*/

/// <reference path="./Emit.ts" />
/// <reference path="./JQStore.ts" />
/// <reference path="./Tracker.ts" />
/// <reference path="./Util.ts" />

/*
  Re-open the jQuery interface and adds our prototype extension. This needs
  to be top-level because jQuery.d.ts defines the JQuery interface on the
  top-level.
*/
interface JQuery {
  renderReact(r: React.ReactElement<any>): JQuery;
  renderReact(cls: typeof Esper.ReactHelpers.Component,
              props?: any): JQuery;

  reactComponent(): Esper.ReactHelpers.Component<any, any>;
}

module Esper.ReactHelpers {

  /*
    Note that although the interface is top-level, actual prototype extension
    should happen within the module itself to ensure we're modifying Esper's
    own copy of the jQuery. Use <any> because fn.extend is not supported by
    DefinitelyType's jquery.d.ts.
  */
  jQuery.fn.extend({
    renderReact: function(elmOrCls: any, props?: any) {
      // Call React clean-up on unbind
      var self = this;
      var unmounted = false;

      if (! this.data("react-component")) {
        this.off('destroyed');
        this.bind('destroyed', function() {
          ReactDOM.unmountComponentAtNode(self.get(0));
          unmounted = true;
        });
      }

      /*
        Throw error if parent node isn't in DOM when we render React element.
        React itself doesn't care if it's rendered into a detached DOM node,
        but rendering into a detached DOM node runs the risk of a memory leak
        because we depend on the parent node being removed from the DOM to
        trigger the event that unmounts the React component.

        Run this check in window.requestAnimationFrame because we may want
        to prepare a DOM element in JS before inserting into the DOM. Chrome
        should wait until all synchronous operations affecting the DOM are
        complete before calling the requestAnimationFrame callback.
      */
      var self = this;
      window.requestAnimationFrame(function() {
        if (self.data("react-component") && !unmounted &&
            !$.contains(document.documentElement, self.get(0))) {
          Log.e(self);
          Log.e(self.data("react-component"));
          throw new Error("Node must be in DOM for React render");
        }
      });

      var elm: React.ReactElement<any>;
      if (_.isFunction(elmOrCls)) {
        elm = React.createElement(elmOrCls, props);
      } else {
        elm = elmOrCls;
      }
      this.data("react-component", ReactDOM.render(elm, this.get(0)));

      return this;
    },

    reactComponent: function() {
      return this.data("react-component");
    }
  });

  function isTrackingKey(a: Emit.EmitBase|Tracker.TrackingKey)
    : a is Tracker.TrackingKey
  {
    var typedA = <Tracker.TrackingKey> a;
    return !!typedA.store;
  }

  interface Source {
    emitter: Emit.EmitBase;
    keys?: any[]

    // Create a new onChange function for each source
    onChange: (_ids: any[]) => void;
  }

  // Subclass of Component with some helper functions
  export class Component<P,S> extends React.Component<P,S> {
    // Temporary React state - used if mutateState gets called twice in the
    // same React loop
    _tempState: S;

    // List of stores this component is listening to. Set via setSources.
    sources: Source[];

    constructor(props: P) {
      super(props);
      this.sources = [];

      // Not correct typing, but add empty object to save step in cases
      // where state props are all optional.
      this.state = <S> {};
    }

    /*
      In subclass, you can choose to override either render or renderWithData.
      If using renderWithData, any references to Model.Store (or subclasses)
      will be automatically tracked and you don't have to call setSources.
    */
    render() {
      return Tracker.track(() => this.renderWithData(), (calls) => {
        this.setSources(calls);
      });
    }

    renderWithData(): JSX.Element {
      return React.createElement("span");
    }

    // Reference to JQuery-wrapped parent node
    jQuery(): JQuery {
      return $(ReactDOM.findDOMNode(this));
    }

    // Use JQuery to find a DOM element within this compoent
    find(selector: string): JQuery {
      return this.jQuery().find(selector);
    }

    // Use for getting a unique-ish id for HTML elements that need it (like
    // labels and inputs)
    protected getId(key: string): string {
      if (! this._idPrefix) {
        this._idPrefix = Util.randomString();
      }
      return "id-" + this._idPrefix + "-" + key;
    }
    private _idPrefix: string;

    // Connect or disconnect component from all sources -- remember to
    // call super if overridden
    componentWillUnmount(): void {
      this.setSources([]);
    }

    componentDidUpdate(prevProps?: P, prevState?: S) {
      this._tempState = null;
    }

    /*
      Call to change the sources this component is listening to. Adds and
      removes listeners as appropriate.

      Sources can be either an emitter or a TrackingKey (store + key list).
      If no key list is provided, then emitter will trigger change on each
      change. Otherwise, will filter against keys if emitter passes any.
    */
    protected setSources(newSources: Array<Emit.EmitBase|Tracker.TrackingKey>)
      : void
    {
      _.each(this.sources || [], (source) => {
        source.emitter.removeChangeListener(source.onChange);
      });

      this.sources = [];
      _.each(newSources, (source) => {
        var emitter: Emit.EmitBase;
        var key: any;
        if (isTrackingKey(source)) {
          emitter = source.store;
          key = source.key;
        } else { // Source is just the emitter
          emitter = source;
        }

        var current = this.findMatchingSource(emitter);
        if (current) { // Just update keys, if any
          if (key) {
            current.keys = current.keys || [];
            current.keys.push(key);
          }
        } else {
          var newSrc = this.createSource(emitter, key ? [key] : undefined);
          newSrc.emitter.addChangeListener(newSrc.onChange);
          this.sources.push(newSrc);
        }
      });
    }

    protected findMatchingSource(emitter: Emit.EmitBase): Source {
      return _.find(this.sources, (s) => s.emitter === emitter);
    }

    // Like createSimpleSource, but ensure that only call updateState if
    // keys match
    protected createSource(emitter: Emit.EmitBase, keys?: any[])
      : Source
    {
      var src = {
        emitter: emitter,
        keys: keys,
        onChange: (_ids?: any[]) => {

          /*
            No _ids or _ids match keys for this source => force update.

            React docs advise against doing a forceUpdate for simplicity and
            efficiency reasons but if you're using our `setSources` helper,
            it's actually simpler to provide a mechanism by which the component
            will always re-render in the event a source changes without needing
            to define a getState function. It's a little less efficient since
            we can't do a `shouldComponentUpdate` check, but simpler than
            artificially introducing state management.
          */

          if (_.isUndefined(_ids) || _.isNull(_ids) || !src.keys) {
            this.forceUpdate();
          }

          else if (_.intersectionWith(_ids, src.keys, _.isEqual).length > 0) {
            this.forceUpdate();
          }
        }
      };
      return src;
    }

    // Helper for updating the state object via mutation
    protected mutateState(fn: (state: S) => void) {
      if (! this._tempState) { this._tempState = _.cloneDeep(this.state); }
      fn(this._tempState);
      this.setState(this._tempState);
    }
  }

  // Use when handling children
  export function isReactElement(p: React.ReactElement<any> | string | number):
    p is React.ReactElement<any>
  {
    var p2 = p as React.ReactElement<any>;
    return p2.props instanceof Object;
  }

  // Use when inspecting if React child has class
  export function hasClass(p: React.ReactElement<any> | string | number,
                           cls: string)
  {
    return isReactElement(p) &&
      (p.props as React.HTMLAttributes).className &&
      _.includes((p.props as React.HTMLAttributes).className.split(" "), cls);
  }


  /*
    Helpers for implementing container pattern (binding an otherwise pure
    Component to some data function)
  */
  export function contain(fn: () => JSX.Element) {
    return React.createElement(Container, { renderFn: fn });
  }

  class Container extends ReactHelpers.Component<{
    renderFn: () => JSX.Element;
  }, {}> {
    renderWithData() {
      return this.props.renderFn();
    }
  }
}
