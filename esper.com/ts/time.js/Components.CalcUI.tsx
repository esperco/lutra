/*
  Base class for UI components tied to calculations, similar to Chart
  component, except that it only uses a single calculation, makes fewer
  assumptions about calculation, and stores the intermediate calculation
  result so that event changes don't cause checkboxes to disappear, etc.
*/
module Esper.Components {
  interface Props<R> {
    calculation: EventStats.CalcBase<R, {}>;
  }

  interface State<R> {
    result: Option.T<R>;
  }

  // Generic Types: R - Calculation result type, P - extra props
  export abstract class CalcUI<R, P>
    extends ReactHelpers.Component<Props<R> & P, State<R>>
  {
    _calculation: EventStats.CalcBase<R, {}>;

    constructor(props: Props<R> & P) {
      super(props);
      this.state = {
        result: this.getResults()
      }
    }

    componentDidMount() {
      this.props.calculation.addChangeListener(this.setResults);
    }

    componentDidUpdate(oldProps: Props<R> & P) {
      if (oldProps.calculation !== this.props.calculation) {
        oldProps.calculation.removeChangeListener(this.setResults);
        this.props.calculation.addChangeListener(this.setResults);
      }
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      this.props.calculation.removeChangeListener(this.setResults);
    }

    /*
      getResult is a private helper function. Subclasses should use
      this.state.result (which pulls last known result option)
    */
    private getResults(props?: Props<R> & P) {
      props = props || this.props;
      return props.calculation.getResults();
    }

    // Use arrow syntax so we can reference for listener
    private setResults = () => {
      this.getResults().match({
        none: () => null,
        some: (result) => this.setState({ result: Option.some(result) })
      });
    }
  }
}
