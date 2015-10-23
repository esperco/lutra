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

  interface DataDisplay {
    data: string[]
  }

  interface MenuProps {
    dataEngine: Bloodhound<string>,
    initialData: string[],
    selectedOption: string,
    onSelect?: () => void
  }

  export class Menu extends ReactHelpers.Component<MenuProps, {}> {
    displayData: Model.StoreOne<DataDisplay>;
    selectedOption: Model.StoreOne<string>;
    constructor(props) {
      super(props);
      this.selectedOption = new Model.StoreOne<string>();
      this.selectedOption.set(props.selectedOption);
      this.displayData = new Model.StoreOne<DataDisplay>();
      this.displayData.set({data: props.initialData});
    }

    getSelectedOption() {
      return this.selectedOption.val();
    }

    render() {
      return (
        <div>
          <SearchBar dataEngine={this.props.dataEngine}
            displayData={this.displayData} />
          <hr />
          <List initialData={this.props.initialData}
            displayData={this.displayData}
            onSelect={this.props.onSelect}
            selectedOption={this.selectedOption} />
        </div>
      );
    }
  }

  interface SearchBarProps {
    dataEngine: Bloodhound<string>,
    displayData: Model.StoreOne<DataDisplay>
  }

  class SearchBar extends ReactHelpers.Component<SearchBarProps, {}> {
    handleKeyUp(e) {
      var self = this;
      function setData(datum) {
        self.props.displayData.set({data: datum});
      }
      this.props.dataEngine.search(e.target.value, setData, null);
    }

    render() {
      return (
        <div className="esper-dropdown-search">
          <input type="text"
            onKeyUp={this.handleKeyUp.bind(this)}
          />
        </div>
      );
    }
  }

  interface ListProps {
    initialData: string[],
    displayData: Model.StoreOne<DataDisplay>,
    selectedOption: Model.StoreOne<string>,
    onSelect: () => void
  }

  interface ListState {
    data: string[],
    checkedValue: string
  }

  class List extends ReactHelpers.Component<ListProps, ListState> {
    getState() {
      return {
        data: this.props.displayData.val().data.length ?
          this.props.displayData.val().data : this.props.initialData,
        checkedValue: this.props.selectedOption.val() || ""
      };
    }

    componentDidMount() {
      this.setSources([this.props.displayData, this.props.selectedOption]);
    }

    render() {
      var items = [];
      for (var i = 0; i < this.state.data.length; i++) {
        items.push(<Item
          id={"esper-dropdown-item" + i}
          key={this.state.data[i]}
          text={this.state.data[i]}
          isChecked={this.state.checkedValue === this.state.data[i]}
          onSelect={this.props.onSelect}
          selectedOption={this.props.selectedOption}
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
    key: string,
    text: string,
    isChecked: boolean,
    selectedOption: Model.StoreOne<string>,
    onSelect: () => void
  }

  class Item extends ReactHelpers.Component<ItemProps, {}> {
    onSelectTimezoneHandler(c) {
      var self = this;
      $(React.findDOMNode(c)).unbind().change(function(e) {
        self.props.selectedOption.set(this.value);
        if (self.props.onSelect !== undefined) self.props.onSelect();
      });
    }

    render() {
      return (
        <li>
          <label htmlFor={this.props.id}>
            <input type="radio"
              ref={this.onSelectTimezoneHandler.bind(this)}
              checked={this.props.isChecked}
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