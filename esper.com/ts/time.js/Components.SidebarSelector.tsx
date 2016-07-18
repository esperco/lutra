/*
  Base classes for expando-style selectors in sidebar
*/

/// <reference path="./Components.CalcUI.tsx" />

module Esper.Components {
  interface Props {
    primary?: boolean; // Primary selector = thing we've grouped events by
  }

  /*
    For use for static, generic selectors.
  */
  export abstract class SidebarSelector<P>
         extends ReactHelpers.Component<Props & P, {}>
  {
    render() {
      return <Components.Expando
              className="esper-panel-section"
              initOpen={!!this.props.primary}
              header={ this.renderHeader() }
              headerClasses={classNames({ primary: this.props.primary })}>
        { this.renderContent() }
      </Components.Expando>
    }

    abstract renderContent(): JSX.Element;
    abstract renderHeader(): JSX.Element;
  }

  /*
    For use with CalcUI.
    Generic Types: R - Calculation result type, P - Extra component props
  */
  export abstract class SidebarCalcSelector<R, P> extends CalcUI<R, Props & P> {
    render() {
      return <Components.Expando
              className="esper-panel-section"
              initOpen={!!this.props.primary}
              header={ this.renderHeader() }
              headerClasses={classNames({ primary: this.props.primary })}>
        { this.renderContent() }
      </Components.Expando>
    }

    abstract renderContent(): JSX.Element;
    abstract renderHeader(): JSX.Element;
  }

  export abstract class DefaultSidebarSelector<P>
    extends SidebarCalcSelector<EventStats.OptGrouping, P> { }
}
