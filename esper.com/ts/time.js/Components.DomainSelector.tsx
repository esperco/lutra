/*
  Domain selection widget based on calc
*/

/// <reference path="./Components.CalcUI.tsx" />

module Esper.Components {

  export class DomainCalcSelector
    extends CalcUI<Types.EventOptGrouping, {
      id?: string;
      calculation: EventStats.DomainCountCalc;
      selected: Params.ListSelectJSON;
      updateFn: (x: Params.ListSelectJSON) => void;
    }>
  {
    render() {
      return this.state.result.match({
        none: () => <div className="esper-no-content">
          { Text.UICalculating }
        </div>,
        some: (optGroups) => {
          var choices = _.map(optGroups.some, (v, k) => ({
            id: k,
            displayAs: k,
            badgeText: v.totalUnique.toString(),
            badgeHoverText: Text.events(v.totalUnique),
            badgeColor: Colors.getColorForDomain(k)
          }));

          return <Components.ListSelectorASN
            choices={choices}
            selected={this.props.selected}
            updateFn={this.props.updateFn}
            allChoice={{
              displayAs: Text.SelectAll,
              badgeText: optGroups.totalUnique.toString(),
              badgeHoverText: Text.events(optGroups.totalUnique),
            }}
            noneChoice={{
              displayAs: Text.NoGuests,
              badgeText: optGroups.none ?
                optGroups.none.totalUnique.toString() : undefined,
              badgeHoverText: optGroups.none ?
                Text.events(optGroups.none.totalUnique) : undefined,
            }}
            selectedItemClasses="active"
            className="esper-select-menu"
            listClasses="esper-select-menu"
            itemClasses="esper-selectable"
          />;
        }
      });
    }
  }

  export class DomainCalcDropdownSelector extends DomainCalcSelector {
    render() {
      // Dropdown input text
      let selectedText = (() => {
        if (this.props.selected.all) {
          return this.props.selected.none ?
            Text.AllGuests :
            Text.HideNoGuests
        }

        let domains = _.map(this.props.selected.some);
        if (this.props.selected.none) {
          domains.push(Text.NoGuests);
        }
        return domains.join(", ");
      })();

      return <Dropdown keepOpen={true}>
        <Selector id={this.props.id} className="dropdown-toggle">
          { selectedText }
        </Selector>
        <div className="dropdown-menu">
          { super.render() }
        </div>
      </Dropdown>;
    }
  }
}
