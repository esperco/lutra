/*
  Rating bucket selector
*/

/// <reference path="./Components.SidebarSelector.tsx" />

module Esper.Components {
  const MAX_RATING = 5;

  export class RatingSelector extends DefaultSidebarSelector<{
    calculation: EventStats.RatingCountCalc;
    selected: Params.ListSelectJSON;
    updateFn: (x: Params.ListSelectJSON) => void;
  }> {
    renderHeader() {
      return <span>
        <i className="fa fa-fw fa-star" />{" "}
        { Text.ChartRatings }
      </span>;
    }

    renderContent() {
      var choices = _.times(MAX_RATING, (i) => {
        var strCount = (i + 1).toString();
        var value = this.state.result.match({
          none: () => null,
          some: (result) => result.some[i]
        });

        return {
          id: strCount,
          displayAs: <span>
            { _.times(i + 1, (n) =>
              <i key={n} className="fa fa-fa fa-star" />
            ) }
          </span>,
          badgeText: value ? value.totalUnique.toString() : undefined,
          badgeHoverText: value ?
            Text.events(value.totalUnique) : undefined,
          badgeColor: this.props.primary ?
            Colors.level(MAX_RATING - i) : undefined
        }
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
          displayAs: Text.NoRating,
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
