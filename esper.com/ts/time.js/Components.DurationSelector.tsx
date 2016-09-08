/*
  Duration bucket selector
*/

module Esper.Components {

  // Select events based on how long they are
  export class DurationSelector
    extends CalcUI<Types.EventOptGrouping, {
      id?: string;
      calculation: EventStats.DurationBucketCountCalc;
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
      })
    }
  }

  export class DurationDropdownSelector extends DurationSelector {
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
          { super.render() }
        </div>
      </Dropdown>;
    }
  }
}
