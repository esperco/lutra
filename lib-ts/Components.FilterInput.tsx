/*
  Generic input for input box used to filter a list of values. This is
  just the input. Use separate component for actual list.
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Option.ts" />

module Esper.Components {

  interface Props {
    classNames?: string;
    inputClasses?: string;
    placeholder?: string;
    onFocus?: React.FocusEventHandler;

    // Triggered by hitting enter
    onSubmit?: (val: string) => void;

    // Triggered by hitting esc (also clears input)
    onEsc?: () => void;

    /*
      If passed filters, matches against displayAs and calls onFilter with
      list of IDs
    */
    filterChoices?: {
      id: string;
      displayAs: string;
    }[];
    onFilter?: (vals: string[]) => void;

    // Triggered by up/down arrows or typing
    onChange?: (id: string) => void;

    /*
      By default, up/down assumes filter is on top of list items and
      filterChoices are dispalyed in order. Pass reverse=true to reverse
      this behavior.
    */
    reverse?: boolean;
  }

  interface State {
    value: string;
    highlightIndex: number;
  }

  export class FilterInput extends ReactHelpers.Component<Props, State> {
    _input: HTMLInputElement;

    constructor(props: Props) {
      super(props);
      this.state = {
        value: "",
        highlightIndex: -1
      };
    }

    componentWillReceiveProps(newProps: Props) {
      if (! _.isEqual(newProps.filterChoices, this.props.filterChoices)) {
        this.mutateState((s) => s.highlightIndex = -1);
      }
    }

    render() {
      return <div className={classNames({
        "esper-has-right-icon": !!this.state.value
      })}>
        <input ref={(c) => this._input = c}
          className={this.props.inputClasses || "form-control"}
          placeholder={this.props.placeholder}
          value={this.state.value}
          onFocus={this.props.onFocus}
          onKeyDown={(e) => this.inputKeydown(e)}
          onChange={(e) => this.onChange(e)}
        />
        {
          this.state.value ?
          <span className="esper-clear-action esper-right-icon"
                onClick={() => this.reset()}>
            <i className="fa fa-fw fa-times" />
          </span> :
          <span />
        }
      </div>;
    }

    // Catch enter / up / down keys
    inputKeydown(e: React.KeyboardEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (e.keyCode === 13) {         // Enter
        e.preventDefault();
        if (this.props.onSubmit) {
          this.props.onSubmit(val);
        }
      }

      else if (e.keyCode === 27) {    // ESC
        e.preventDefault();
        this.reset();
        if (this.props.onChange) { this.props.onChange(""); }
        if (this.props.onEsc) { this.props.onEsc(); }
      }

      else if (e.keyCode === 38) {    // Up
        e.preventDefault();
        this.props.reverse ? this.next() : this.prev();
      }

      else if (e.keyCode === 40) {    // Down
        e.preventDefault();
        this.props.reverse ? this.prev() : this.next();
      }
    }

    next() {
      if (this.props.filterChoices) {
        let newIndex = Math.min(
          this.state.highlightIndex + 1,
          this.props.filterChoices.length - 1
        );
        let choice = this.props.filterChoices[newIndex];

        this.mutateState((s) => {
          s.highlightIndex = newIndex;
          s.value = choice ? choice.displayAs : "";
        });
        if (this.props.onChange) {
          this.props.onChange(choice ? choice.id : "");
        }
      }
    }

    prev() {
      if (this.props.filterChoices) {
        let newIndex = Math.max(this.state.highlightIndex - 1, -1);
        let choice = this.props.filterChoices[newIndex];

        this.mutateState((s) => {
          s.highlightIndex = newIndex;
          s.value = choice ? choice.displayAs : "";
        });
        if (this.props.onChange) {
          this.props.onChange(choice ? choice.id : "");
        }
      }
    }

    onChange(e: React.FormEvent) {
      var value = (e.target as HTMLInputElement).value;
      this.setState({
        value: value,
        highlightIndex: -1
      });

      if (this.props.onChange) {
        this.props.onChange(value);
      }

      if (this.props.onFilter && this.props.filterChoices) {
        let filterStr = value.trim().toLowerCase();
        this.props.onFilter(
          _(this.props.filterChoices)
            .filter(
              (c) => _.includes(c.displayAs.trim().toLowerCase(), filterStr)
            )
            .map((c) => c.id)
            .value()
        );
      }
    }

    reset() {
      this.setState({
        value: "",
        highlightIndex: -1
      });
    }

    getVal() {
      return this.state.value;
    }

    getFiltered() {
      let filterStr = this.state.value.trim().toLowerCase();
      return _(this.props.filterChoices)
        .filter(
          (c) => _.includes(c.displayAs.trim().toLowerCase(), filterStr)
        )
        .map((c) => c.id)
        .value();
    }
  }
}
