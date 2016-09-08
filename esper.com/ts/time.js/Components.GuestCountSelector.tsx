/*
  Guest count bucket selector
*/

/// <reference path="./Components.CalcUI.tsx" />

module Esper.Components {

  export class GuestCountSelector
    extends CalcUI<Types.EventOptGrouping, {
      id?: string;
      calculation: EventStats.GuestCountBucketCalc;
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
          var choices = _.map(EventStats.GUEST_COUNT_BUCKETS, (b) => {
            let value = optGroups.some[b.label]
            return {
              id: b.label,
              displayAs: b.label,
              badgeText: value ? value.totalUnique.toString() : undefined,
              badgeHoverText: value ?
                Text.events(value.totalUnique) : undefined,
              badgeColor: b.color
            };
          });

          var allCount = optGroups.totalUnique;
          var noneCount = optGroups.none.totalUnique;
          return <Components.ListSelectorASN
            choices={choices}
            selected={this.props.selected}
            updateFn={this.props.updateFn}
            allChoice={{
              displayAs: Text.SelectAll,
              badgeText: allCount ? allCount.toString() : undefined,
              badgeHoverText: allCount ? Text.events(allCount) : undefined,
            }}
            noneChoice={{
              displayAs: Text.NoGuests,
              badgeText: noneCount ? noneCount.toString() : undefined,
              badgeHoverText: noneCount ? Text.events(noneCount) : undefined
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

  export class GuestCountDropdownSelector extends GuestCountSelector {
    render() {
      // Dropdown input text
      let selectedText = (() => {
        if (this.props.selected.all) {
          return this.props.selected.none ?
            Text.AllGuests :
            Text.HideNoGuests
        }

        let vals = this.props.selected.some;
        if (this.props.selected.none) {
          vals = vals.concat([Text.NoGuests]);
        }
        return vals.join(", ");
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
