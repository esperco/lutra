/*
  Base class for UI components tied to calculations, similar to Chart
  component, except that it only uses a single calculation, makes fewer
  assumptions about calculation, and stores the intermediate calculation
  result so that event changes don't cause checkboxes to disappear, etc.
*/
module Esper.Components {
  interface State<R> {
    result: Option.T<R>;
  }

  // Generic Types: R - Calculation result type, P -  props
  export abstract class CalcUI<R, P>
         extends ReactHelpers.Component<P, State<R>>
  {
    _calc: Calc<R>;

    constructor(props: P) {
      super(props);
      this.state = { result: Option.none<R>() }
    }

    abstract getCalc(props: P): Calc<R>;

    updateCalculation(props: P) {
      if (this._calc) {
        this._calc.removeChangeListener(this.setResult);
      }
      this._calc = this.getCalc(props);
      this._calc.addChangeListener(this.setResult);
    }

    componentDidMount() {
      this.updateCalculation(this.props);
    }

    componentDidUpdate(prevProps: P) {
      if (prevProps !== this.props) {
        this.updateCalculation(this.props);
      }
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      if (this._calc) {
        this._calc.removeChangeListener(this.setResult);
      }
    }

    /*
      getResult is a private helper function. Subclasses should use
      this.state.result (which pulls last known result option)
    */
    private getResults() {
      return this._calc.getOutput();
    }

    // Use arrow syntax so we can reference for listener
    private setResult = () => {
      this.getResults().match({
        none: () => null,
        some: (result) => this.setState({ result: Option.some(result) })
      });
    }
  }
}
