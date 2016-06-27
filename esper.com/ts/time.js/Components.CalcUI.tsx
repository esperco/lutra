/*
  Base class for UI components tied to calculations, similar to Chart
  component, except that it only uses a single calculation, makes fewer
  assumptions about calculation, and stores the intermediate calculation
  result so that event changes don't cause checkboxes to disappear, etc.
*/
module Esper.Components {
  interface Props<T> {
    calculation: EventStats.CalcBase<T>;
    events: Stores.Events.TeamEvent[];
  }

  interface State<T> {
    result: Option.T<T>;
  }

  export abstract class CalcUI<T, P extends Props<T>>
    extends ReactHelpers.Component<P, State<T>>
  {
    _calculation: EventStats.CalcBase<T>;

    constructor(props: P) {
      super(props);
      this.state = {
        result: this.getResults()
      }
    }

    componentDidMount() {
      this.props.calculation.addChangeListener(this.setResults);
    }

    componentDidUpdate(oldProps: P) {
      if (oldProps.calculation !== this.props.calculation) {
        oldProps.calculation.removeChangeListener(this.setResults);
        this.props.calculation.addChangeListener(this.setResults);
      }
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      this.props.calculation.removeChangeListener(this.setResults);
    }

    getResults(props?: P) {
      props = props || this.props;
      return props.calculation.getResults();
    }

    // Use arrow syntax so we can reference for listener
    setResults = () => {
      this.getResults().match({
        none: () => null,
        some: (result) => this.setState({ result: Option.some(result) })
      });
    }
  }
}
