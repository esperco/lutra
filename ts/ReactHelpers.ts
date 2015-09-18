/*
  Helpers for using Facebook's React with Esper. Depends on jQuery UI
  being present.
*/

/// <reference path="../typings/react/react-global.d.ts" />
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
    // Reference to JQuery-wrapped parent node
    parent(): JQuery {
      return $(React.findDOMNode(this)).parent();
    }

    find(selector: string): JQuery {
      return this.parent().find(selector);
    }

    removeSelf(): void {
      this.parent().remove();
    }
  }
}