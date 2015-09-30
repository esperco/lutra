/*
  Helpers for using Facebook's React with Esper. Depends on jQuery UI
  being present.
*/

/// <reference path="../typings/react/react-global.d.ts" />
/// <reference path="./Emit.ts" />
/// <reference path="./JQStore.ts" />

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
      this.off('destroyed');
      this.bind('destroyed', function() {
        React.unmountComponentAtNode(self.get(0));
      });

      if (! $.contains(document.documentElement, this.get(0))) {
        throw new Error("Node must be in DOM before React render");
      }

      var elm: React.ReactElement<any>;
      if (_.isFunction(elmOrCls)) {
        elm = React.createElement(elmOrCls, props);
      } else {
        elm = elmOrCls;
      }
      this.data("react-component", React.render(elm, this.get(0)));

      return this;
    },

    reactComponent: function() {
      return this.data("react-component");
    }
  });

  // Subclass of Component with some helper functions
  export class Component<P,S> extends React.Component<P,S> {
    // List of stores this component is listening to. Set via getSources.
    sources: Emit.EmitBase[];

    constructor(props: P) {
      super(props);
      this.sources = [];
      this.state = (<S> this.getState(true));
    }

    // Reference to JQuery-wrapped parent node
    jQuery(): JQuery {
      return $(React.findDOMNode(this));
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

    // Call to change the sources this component is listening to. Adds and
    // removes listeners as appropriate.
    protected setSources(newSources: Emit.EmitBase[]): void {
      var self = this;
      _.each(this.sources || [], function(source) {
        source.removeChangeListener(self.onChange);
      });

      this.sources = newSources;
      _.each(this.sources, function(source) {
        source.addChangeListener(self.onChange);
      });
    }

    // Callback to trigger from listeners
    // Implement as arrow function so "this" value is properly referenced
    protected onChange = (): void => this.setState(<S> this.getState());

    // Interface for getting State -- passed a boolean = true if this is
    // called during the initial constructor
    protected getState(init=false): void|S { return; }
  }
}