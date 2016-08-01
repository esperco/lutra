/*
  Duration bucket selector
*/

/// <reference path="./Components.SidebarSelector.tsx" />

module Esper.Components {
  interface Props {
    calculation: EventStats.GuestCountBucketCalc;
    events: Stores.Events.TeamEvent[];
    selected: Params.ListSelectJSON;
    updateFn: (x: Params.ListSelectJSON) => void;
    showColor?: boolean;
  }

  // Select events based on how long they are
  export class DurationSelector extends DefaultSidebarSelector<{
    calculation: EventStats.DurationBucketCalc;
    selected: Params.ListSelectJSON;
    updateFn: (x: Params.ListSelectJSON) => void;
  }> {
    renderHeader() {
      return <span>
        <i className="fa fa-fw fa-hourglass" />{" "}
        { Text.ChartDuration }
      </span>;
    }

    renderContent() {
      var choices = _.map(EventStats.DURATION_BUCKETS, (b) => {
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

      return <Components.ListSelectorASN
        choices={choices}
        selected={this.props.selected}
        updateFn={this.props.updateFn}
        allChoice={{
          displayAs: Text.SelectAll,
          badgeText: allCount ? allCount.toString() : undefined,
          badgeHoverText: allCount ? Text.events(allCount) : undefined,
        }}

        selectedItemClasses="active"
        className="esper-select-menu"
        listClasses="esper-select-menu"
        itemClasses="esper-selectable"
      />;
    }
  }
}