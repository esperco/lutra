/*
  Domain selection widget based on calc
*/

/// <reference path="./Components.CalcUI.tsx" />

module Esper.Components {
  export class DomainCalcDropdownSelector
    extends CalcUI<Types.EventOptGrouping, {
      id?: string;
      calculation: EventStats.DomainCountCalc;
      selected: Params.ListSelectJSON;
      updateFn: (x: Params.ListSelectJSON) => void;
    }>
  {
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
          <DomainListSelector
            result={this.state.result}
            selected={this.props.selected}
            updateFn={this.props.updateFn}
          />
        </div>
      </Dropdown>;
    }
  }

  function DomainListSelector({result, selected, updateFn} : {
    result: Option.T<Types.EventOptGrouping>;
    selected: Params.ListSelectJSON;
    updateFn: (x: Params.ListSelectJSON) => void;
  }) {
    return result.match({
      none: () => <span>{ Text.UICalculating }</span>,
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
          selected={selected}
          updateFn={updateFn}
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
