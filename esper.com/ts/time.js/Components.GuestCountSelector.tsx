/*
  Guest count bucket selector
*/

/// <reference path="./Components.SidebarSelector.tsx" />

module Esper.Components {
  export class GuestCountSelector extends DefaultSidebarSelector<{
    calculation: EventStats.GuestCountBucketCalc;
    selected: Params.ListSelectJSON;
    updateFn: (x: Params.ListSelectJSON) => void;
  }> {
    renderHeader() {
      return <span>
        <i className="fa fa-fw fa-users" />{" "}
        { Text.ChartGuestsCount }
      </span>;
    }

    renderContent() {
      var choices = _.map(EventStats.GUEST_COUNT_BUCKETS, (b) => {
        let value = this.state.result.match({
          none: () => null,
          some: (result) => result.some[b.label]
        });
        return {
          id: b.label,
          displayAs: b.label,
          badgeText: value ? value.totalUnique.toString() : undefined,
          badgeHoverText: value ?
            Text.events(value.totalUnique) : undefined,
          badgeColor: this.props.primary ? b.color : undefined
        };
      });

      var allCount = this.state.result.match({
        none: () => null,
        some: (result) => result.totalUnique
      });
      var noneCount = this.state.result.match({
        none: () => null,
        some: (result) => result.none.totalUnique
      });

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
  }
}
