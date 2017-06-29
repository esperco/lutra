/*
  Dropdown menu for selecting a timezone, with filtering
*/

/// <reference path="./Components.Dropdown.tsx" />
/// <reference path="./Timezones.ts" />

module Esper.Components {
  interface Timezone {
    id: string;
    display: string;
    offset: number;
  }


  /* React Component */

  interface Props {
    id?: string;
    selected?: string;
    disabled?: boolean;
    onSelect: (timezone: string) => void;
  }

  interface State {
    filterStr: string;
    highlightIndex: number;
    zones: typeof Timezones.Zones;
  }

  export class TimezoneSelector extends ReactHelpers.Component<Props, State> {
    _dropdown: Components.Dropdown;
    _input: HTMLInputElement;

    constructor(props: Props) {
      super(props);

      var zones = this.getZones();
      this.state = {
        filterStr: "",
        highlightIndex: 0,
        zones: zones
      }
    }

    getZones(filterStr?: string) {
      filterStr = filterStr ? filterStr.toLowerCase() : "";
      return filterStr ? _.filter(Timezones.Zones,
        (z) => _.includes(z.searchFmt, filterStr)
      ) : Timezones.Zones;
    }

    render() {
      var zoneInfo = Timezones.get(this.props.selected);
      return <Components.Dropdown ref={(c) => this._dropdown = c}
              keepOpen={true} className="esper-timezone-select"
              onOpen={() => this.onOpen()}
              disabled={this.props.disabled}>
        <Components.Selector id={this.props.id || this.getId("tz")}
                             className="dropdown-toggle"
                             disabled={this.props.disabled}>
          { zoneInfo.display }
        </Components.Selector>
        <div className="dropdown-menu">
          { this.renderList() }
        </div>
      </Components.Dropdown>;
    }

    renderList() {
      var zones = this.state.zones;
      return <div className="esper-timezone-filter-container">
        <div className="esper-panel-section">
            <input ref={(c) => this._input = c}
                   className="form-control timezone-filter"
                   placeholder="Pacific Time"
                   value={this.state.filterStr}
                   onKeyDown={(e) => this.inputKeydown(e)}
                   onChange={(e) => this.onChange(e)} />
          </div>
          <div className={"esper-select-menu esper-full-width " +
                          "esper-panel-section"}>
            { _.map(zones, (z, i) =>
              <div key={z.id} className={classNames("esper-selectable", {
                highlight: this.state.highlightIndex === i
              })} onClick={() => this.onSelect(z.id)}>
                { z.display }
              </div>
            )}
            { zones.length ? null : <div className="esper-no-content">
              Timezone not found
            </div> }
          </div>
      </div>;
    }

    onOpen() {
      window.requestAnimationFrame(
        () => this._input && this._input.focus()
      );
    }

    onChange(e: React.FormEvent) {
      var filterStr = (e.target as HTMLInputElement).value;
      this.setState({
        filterStr: filterStr,
        highlightIndex: 0,
        zones: this.getZones(filterStr)
      });
    }

    onSelect(id: string) {
      if (this._dropdown) {
        this._dropdown.close();
      }
      this.props.onSelect(id);
    }

    reset() {
      this.setState({
        filterStr: "",
        highlightIndex: 0,
        zones: this.getZones()
      });
    }

    // Catch enter / up / down keys
    inputKeydown(e: React.KeyboardEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (e.keyCode === 13) {         // Enter
        e.preventDefault();

        var selected = this.state.zones[this.state.highlightIndex];
        if (selected) {
          this.onSelect(selected.id);
        }
      }

      else if (e.keyCode === 27) {    // ESC
        e.preventDefault();
        this.reset();
        this._dropdown && this._dropdown.close();
      }

      else if (e.keyCode === 38) {    // Up
        e.preventDefault();
        this.setState({
          filterStr: this.state.filterStr,
          highlightIndex: Math.max(this.state.highlightIndex - 1, 0),
          zones: this.state.zones
        });
      }

      else if (e.keyCode === 40) {    // Down
        e.preventDefault();
        this.setState({
          filterStr: this.state.filterStr,
          highlightIndex: Math.min(this.state.highlightIndex + 1,
                                   this.state.zones.length - 1),
          zones: this.state.zones
        });
      }
    }
  }
}
