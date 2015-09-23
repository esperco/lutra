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
    // List of stores this component is listening to. Override in sub-class.
    static sources: Emit.EmitBase[] = [];

    constructor(props: P) {
      super(props);
      this.state = (<S> this.getState(true));
    }

    // Reference to JQuery-wrapped parent node
    parent(): JQuery {
      return $(React.findDOMNode(this)).parent();
    }

    // Use JQuery to find a DOM element within this compoent
    find(selector: string): JQuery {
      return this.parent().find(selector);
    }

    // Remove jQuery wrapper around this React Component
    removeSelf(): void {
      this.parent().remove();
    }

    // Connect or disconnect component from declared stores -- remember to
    // call super() if these are overridden
    componentDidMount(): void {
      var self = this;
      _.each(this.getSources(), function(source) {
        source.addChangeListener(self.onChange);
      });
    }

    componentWillUnmount(): void {
      var self = this;
      _.each(this.getSources(), function(source) {
        source.removeChangeListener(self.onChange);
      });
    }

    // Callback to trigger from listeners
    // Implement as arrow function so "this" value is properly referenced
    protected onChange = (): void => this.setState(<S> this.getState());

    // Interface for getting State -- passed a boolean = true if this is
    // called during the initial constructor
    protected getState(init=false): void|S { return; }

    // Helper to get static source vals from instance
    protected getSources(): Emit.EmitBase[] {
      return (<typeof Component> this.constructor).sources;
    }
  }
}