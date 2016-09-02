/*
  Rating bucket selector
*/

/// <reference path="./Components.CalcUI.tsx" />

module Esper.Components {
  const MAX_RATING = 5;

  export class RatingCalcDropdownSelector
    extends CalcUI<Types.EventOptGrouping, {
      id?: string;
      calculation: EventStats.RatingCountCalc;
      selected: Params.ListSelectJSON;
      updateFn: (x: Params.ListSelectJSON) => void;
    }>
  {
    render() {
      // Dropdown input text
      let selectedText = (() => {
        if (this.props.selected.all) {
          return this.props.selected.none ?
            Text.AllRatings :
            Text.HideNoRating
        }

        let ratings = _.map(this.props.selected.some,
          (r) => Text.stars(parseInt(r))
        );
        if (this.props.selected.none) {
          ratings.push(Text.NoRating);
        }
        return ratings.join(", ");
      })();

      return <Dropdown keepOpen={true}>
        <Selector id={this.props.id} className="dropdown-toggle">
          { selectedText }
        </Selector>
        <div className="dropdown-menu">
          <RatingListSelector
            result={this.state.result}
            selected={this.props.selected}
            updateFn={this.props.updateFn}
          />
        </div>
      </Dropdown>;
    }
  }

  function RatingListSelector({result, selected, updateFn} : {
    result: Option.T<Types.EventOptGrouping>;
    selected: Params.ListSelectJSON;
    updateFn: (x: Params.ListSelectJSON) => void;
  }) {
    return result.match({
      none: () => <span>{ Text.UICalculating }</span>,
      some: (optGroups) => {
        let choices = _.times(MAX_RATING, (i) => {
          let strCount = (i + 1).toString();
          let value = optGroups.some[strCount];
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
            badgeColor: Colors.level(MAX_RATING - i)
          }
        });

        let allCount = optGroups.totalUnique;
        let noneCount = optGroups.none.totalUnique;
        return <Components.ListSelectorASN
          choices={choices}
          selected={selected}
          updateFn={updateFn}
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
    });
  }
}
