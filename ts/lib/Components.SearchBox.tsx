/*
  An input component for triggering real-time inputs based on text
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Util.ts" />

module Esper.Components {
  // Default delay before triggering callback
  const DEFAULT_DELAY = 500;

  interface Props {
    // NB: Add end-of-group class to make this work inside input groups
    className?: string;

    placeholder?: string;

    // The "default" or original value
    value: string;
    onUpdate: (newValue: string) => void;

    // How long to delay before triggering callback -- defaults to
    // DEFAULT_DELAY above
    delay?: number;

    // Add an icon class?
    icon?: string;
  }

  interface State {
    // The current value in the input
    value: string;
  }

  export class SearchBox extends ReactHelpers.Component<Props, State> {
    _timeout: number;

    constructor(props: Props) {
      super(props);
      this.state = { value: this.props.value };
    }

    render() {
      return <div className={classNames({
          "esper-has-right-icon": !!this.state.value,
          "esper-has-left-icon": !!this.props.icon
        })}>

        <input type="text"
          className={Util.some(this.props.className, "form-control")}
          placeholder={this.props.placeholder}
          value={this.state.value || ""}
          onKeyDown={(e) => this.inputKeydown(e)}
          onChange={
            (e) => this.onChange((e.target as HTMLInputElement).value)
          } />
        {
          this.state.value ?
          <span className="esper-clear-action esper-right-icon"
                onClick={() => this.reset()}>
            <i className="fa fa-fw fa-times" />
          </span> :
          null
        }
        {
          this.props.icon ?
          <span className="esper-left-icon">
            <i className={"fa fa-fw " + this.props.icon} />
          </span> :
          null
        }
      </div>;
    }

    onChange(val: string) {
      this.setState({ value: val });
      this.setTimeout();
    }

    // Catch enter / up / down keys
    inputKeydown(e: __React.KeyboardEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (e.keyCode === 13) {         // Enter
        e.preventDefault();
        clearTimeout(this._timeout);
        this.props.onUpdate(this.state.value);
      } else if (e.keyCode === 27) {  // ESC
        e.preventDefault();
        this.reset();
      }
    }

    setTimeout() {
      clearTimeout(this._timeout);
      this._timeout = setTimeout(
        () => this.props.onUpdate(this.state.value),
        Util.some(this.props.delay, DEFAULT_DELAY)
      );
    }

    reset() {
      clearTimeout(this._timeout);
      this.setState({ value: null });
      this.props.onUpdate("");
    }

    componentWillReceiveProps(nextProps: Props) {
      clearTimeout(this._timeout);
      this.setState({value: nextProps.value});
    }

    componentWillUnmount(){
      super.componentWillUnmount();
      clearTimeout(this._timeout);
    }
  }
}
