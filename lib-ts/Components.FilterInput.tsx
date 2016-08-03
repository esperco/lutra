/*
  Generic input for input box used to filter a list of values + base class
  for list to hook up to input.
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Log.ts" />

module Esper.Components {

  interface Props {
    className?: string;
    inputClass?: string;
    placeholder?: string;

    // Reference to FilterList, function to allow sibling refs
    getList: () => FilterList;

    // Triggered by hitting enter
    onSubmit: (val: string) => void;

    // Triggered by hitting esc (also clears input, triggers onChange)
    onEsc?: () => void;

    // Input focus
    onFocus?: React.FocusEventHandler;
  }

  interface State {
    value: string;
  }

  export class FilterInput extends ReactHelpers.Component<Props, State> {
    _input: HTMLInputElement;

    constructor(props: Props) {
      super(props);
      this.state = {
        value: ""
      };
    }

    // Safety wrapper in case no list provided
    list(fn: (l: FilterList) => void) {
      var list = this.props.getList();
      if (list) { fn(list); }
      else { Log.e("Filter Input is not connected to list"); }
    }

    render() {
      return <div className={classNames(this.props.className, {
        "esper-has-right-icon": !!this.state.value
      })}>
        <input ref={(c) => this._input = c}
          type="text"
          className={this.props.inputClass || "form-control"}
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
          // Submit list value (whatever is highlighted)
          this.list((l) => this.props.onSubmit(l.getValue()));
        }
      }

      else if (e.keyCode === 27) {    // ESC
        e.preventDefault();
        this.reset();
        if (this.props.onEsc) { this.props.onEsc(); }
      }

      // Assume filter list is below input, so up is previous
      else if (e.keyCode === 38) {    // Up
        e.preventDefault();
        this.list((l) => l.prev());
      }

      else if (e.keyCode === 40) {    // Down
        e.preventDefault();
        this.list((l) => l.next());
      }
    }

    onChange(e: React.FormEvent) {
      var value = (e.target as HTMLInputElement).value;
      this.updateValue(value);
    }

    focus() {
      /*
        Not entirely sure why timeout is necessary, but focus doesn't work
        reliably without some delay
      */
      setTimeout(() => this._input && this._input.focus(), 250);
    }

    reset() {
      this.updateValue("");
    }

    updateValue(value: string) {
      this.setState({ value: value });
      this.list((l) => l.updateValue(value));
    }
  }


  /*
    Component to render list components that rely on FilterInput.
  */
  interface FilterListProps {
    className?: string;

    // Filter list values
    choices: string[];

    // What to render for each item
    itemFn: (value: string, highlight: boolean) => JSX.Element;

    /*
      Optionally render an element for a new item if it doesn't match
      any of the existing values
    */
    newItemFn?: (value: string, highlight: boolean) => JSX.Element;

    /*
      New item is only shown if newItemFn is defined, is non-empty, and it
      doesn't match one of the existing choices exactly. Can define additional
      custom behavior here.
    */
    showNewItem?: (value: string) => boolean;

    // Maximum number of new items to show
    maxNewItems?: number;

    /*
      Custom normalization function for comparing filtered text. By default,
      just lower-case and trim.
    */
    normalize?: (value: string) => string;

    // By default, new items are at start (if applicable)
    newItemPosition?: "start"|"end";
  }

  interface FilterListState {
    value: string;            // Value in input box
    highlightIndex: number;   // Which item is highlighted? Defaults to 0.
  }

  export abstract class FilterList
         extends ReactHelpers.Component<FilterListProps, FilterListState>
  {
    constructor(props: FilterListProps) {
      super(props);
      this.state = {
        value: "",
        highlightIndex: 0
      };
    }

    render() {
      /*
        Curry itemFn since active state depends on index, and index is unknown
        until after we evaluate new item function.
      */
      let items = _.map(this.getFiltered(),
        (value) => (active: boolean) => this.props.itemFn(value, active)
      );

      if (this.props.maxNewItems) {
        items = items.slice(0, this.props.maxNewItems);
      }

      if (this.showNewItem()) {
        let fn =
          (active: boolean) => this.props.newItemFn(this.state.value, active);
        if (this.props.newItemPosition === "end") {
          items.push(fn);
        } else {
          items.unshift(fn);
        }
      }

      return <div className={this.props.className}>
        { _.map(items, (fn, i) => fn(i === this.state.highlightIndex)) }
      </div>;
    }

    // Highlight the next item
    next() {
      let max = this.getFiltered().length - 1;
      if (this.showNewItem()) {
        max += 1;
      }
      this.mutateState((s) =>
        s.highlightIndex = Math.min(s.highlightIndex + 1, max)
      )
    }

    // Highlight the previous item
    prev() {
      this.mutateState((s) =>
        s.highlightIndex = Math.max(s.highlightIndex - 1, 0)
      )
    }

    // Get the selected value
    getValue() {
      let values = this.getFiltered();
      if (this.showNewItem()) {
        if (this.props.newItemPosition === "end") {
          values.push(this.state.value);
        } else {
          values.unshift(this.state.value);
        }
      }
      return values[this.state.highlightIndex] || this.state.value;
    }

    updateValue(value: string) {
      this.mutateState((s) => {
        s.value = value;
        s.highlightIndex = 0;
      });
    }

    /*
      Filter string choices against a value. Returns filtered values and
      whether there's an exact match.
    */
    getFiltered() {
      let filterStr = this.normalize(this.state.value);
      let filtered: string[] = [];
      _.each(this.props.choices, (c) => {
        let norm = this.normalize(c);

        // Exact(ish) matches go to front of list
        if (norm === filterStr) {
          filtered.unshift(c);
        }

        // Everything else to end
        else if (_.includes(norm, filterStr)) {
          filtered.push(c);
        }
      });
      return filtered;
    }

    // Should we show a choice for selecting a new value?
    showNewItem() {
      let val = this.state.value;
      if (val && this.props.newItemFn) {
        let filterStr = this.normalize(val);
        let exactMatch = _.some(
          this.props.choices,
          (c) => this.normalize(c) === filterStr
        );
        if (exactMatch) { return false; }
        if (this.props.showNewItem) {
          return this.props.showNewItem(val);
        }
        return true;
      }
      return false;
    }

    // Normalize values for filtering / exact match comparisons
    normalize(val: string) {
      if (this.props.normalize) {
        return this.props.normalize(val);
      }
      return val.trim().toLowerCase();
    }
  }
}
