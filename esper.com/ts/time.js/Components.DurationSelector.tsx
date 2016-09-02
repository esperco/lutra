/*
  Duration bucket selector
*/

module Esper.Components {

  // Select events based on how long they are
  export class DurationDropdownSelector
    extends CalcUI<Types.EventOptGrouping, {
      id?: string;
      calculation: EventStats.DurationBucketCalc;
      selected: Params.ListSelectJSON;
      updateFn: (x: Params.ListSelectJSON) => void;
    }>
  {
    render() {
      // Dropdown input text
      let selectedText = (() => {
        if (this.props.selected.all) {
          return Text.AllDurations;
        }
        let vals = this.props.selected.some;
        return vals.join(", ");
      })();

      return <Dropdown keepOpen={true}>
        <Selector id={this.props.id} className="dropdown-toggle">
          { selectedText }
        </Selector>
        <div className="dropdown-menu">
          <GuestCountListSelector
            result={this.state.result}
            selected={this.props.selected}
            updateFn={this.props.updateFn}
          />
        </div>
      </Dropdown>;
    }
  }

  function GuestCountListSelector({result, selected, updateFn} : {
    result: Option.T<Types.EventOptGrouping>;
    selected: Params.ListSelectJSON;
    updateFn: (x: Params.ListSelectJSON) => void;
  }) {
    return result.match({
      none: () => <span>{ Text.UICalculating }</span>,
      some: (optGroups) => {
        var choices = _.map(EventStats.DURATION_BUCKETS, (b) => {
          let value = optGroups.some[b.label];
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
        return <Components.ListSelectorASN
          choices={choices}
          selected={selected}
          updateFn={updateFn}
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
    })
  }
}
