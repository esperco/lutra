/*
  Module for displaying dropdown menus with a search bar
*/

/// <reference path="./Esper.ts" />
/// <reference path="../marten/ts/Model.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/Query.ts" />

module Esper.Dropdown {
  var React = Esper.React;
  var dataEngine: Bloodhound<string>;
  var initialData: string[];
  var onSelect: () => void;
  var displayData = new Model.StoreOne<DataDisplay>();
  var selectedOption = new Model.StoreOne<string>();

  export function getSelectedOption() {
    return selectedOption.val();
  }

  interface DataDisplay {
    data: string[]
  }

  interface MenuProps {
    dataEngine: Bloodhound<string>,
    initialData: string[],
    selectedOption: string,
    onSelect: () => void
  }

  export class Menu extends ReactHelpers.Component<MenuProps, {}> {
    constructor(props) {
      super(props);
      dataEngine = props.dataEngine;
      initialData = props.initialData;
      onSelect = props.onSelect;
      selectedOption.set(props.selectedOption);
      displayData.set({data: props.initialData});
    }

    render() {
      return (
        <div>
          <SearchBar />
          <hr />
          <List />
        </div>
      );
    }
  }

  class SearchBar extends ReactHelpers.Component<{}, {}> {
    constructor(props) {
      super(props);
    }

    handleKeyUp(e) {
      function setData(datum) {
        if (datum.length > 0)
          displayData.set({data: datum});
        else
          displayData.set({data: initialData});
      }
      dataEngine.search(e.target.value, setData, null);
    }

    render() {
      return (
        <div className="esper-dropdown-search">
          <input type="text"
            onKeyUp={this.handleKeyUp}
          />
        </div>
      );
    }
  }

  interface ListState {
    data: string[]
  }

  class List extends ReactHelpers.Component<{}, ListState> {
    getState() {
      return {
        data: displayData.val().data || []
      };
    }

    componentDidMount() {
      this.setSources([displayData]);
    }

    render() {
      var items = [];
      for (var i = 0; i < this.state.data.length; i++) {
        items.push(<Item
          id={"esper-dropdown-item" + i}
          text={this.state.data[i]}
        />);
      }
      return (
        <ul className="esper-dropdown-list">
          {items}
        </ul>
      );
    }
  }

  interface ItemProps {
    id: string,
    text: string
  }

  interface ItemState {
    checkedValue: string
  }                                                                                                                                                          

  class Item extends ReactHelpers.Component<ItemProps, ItemState> {
    constructor(props) {
      super(props);
    }

    getState() {
      return {
        checkedValue: selectedOption.val() || ""
      }
    }

    componentDidMount() {
      this.setSources([selectedOption]);
    }

    selectTimezoneHandler(e) {
      selectedOption.set(e.target.value);
      if (onSelect !== undefined) onSelect();
    }

    render() {
      return (
        <li>
          <label htmlFor={this.props.id}>
            <input type="radio"
              onChange={this.selectTimezoneHandler}
              checked={this.state.checkedValue === this.props.text}
              value={this.props.text}
              name="dropdown-list-item"
              id={this.props.id} />
            {this.props.text}
          </label>
        </li>
      );
    }
  }
}