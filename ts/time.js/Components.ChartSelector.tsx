/*
  Component for selecting chart groupings or filters
*/

/// <reference path="./Components.CalcUI.tsx" />

module Esper.Components {

  interface Props extends Types.ChartProps {
    id?: string;
    updateFn: (extra: Types.ChartExtraOpt) => void;
  }

  // Generic selector for groups
  export class ChartSelector extends CalcUI<Types.GroupState, Props>
  {
    shouldComponentUpdate(newProps: Types.ChartProps, newState: {
      result: Option.T<Types.GroupState>
    }) {
      // Always update if state changed
      if (this.state !== newState) {
        return true;
      }

      // Otherwise, don't update if props are mostly the same.
      return !Charting.eqProps(newProps, this.props);
    }

    getCalc(props: Props) {
      // For calc -> unset all extras
      let newProps = _.extend({}, props, {
        extra: Charting.defaultExtras(props.team.teamid)
      }) as Props;
      return EventStats.defaultGroupCounterCalc(
        props.eventsForRanges,
        (e) => props.groupBy.keyFn(e, newProps)
      );
    }

    getSelected() {
      return this.props.groupBy.getListSelectJSONFn(this.props.extra);
    }

    render() {
      return this.state.result.mapOr(
        <div className="esper-no-content">
          { Text.UICalculating }
        </div>,
        (results) => {
          let groupBy = this.props.groupBy;
          let keys = groupBy.selectorKeysFn ?
            groupBy.selectorKeysFn(results.group, this.props) :
            _.keys(results.group.some).sort();
          let colors = groupBy.colorMapFn ?
            groupBy.colorMapFn(keys, this.props) : [];

          let choices = _.map(keys, (k, index) => {
            let v = results.group.some[k];
            return {
              id: k,
              displayAs: groupBy.displayFn ?
                groupBy.displayFn(k, this.props) : k,
              badgeText: v ? v.totalUnique.toString() : undefined,
              badgeHoverText: v ? Text.events(v.totalUnique) : undefined,
              badgeColor: colors[index]
            };
          });

          if (_.isEmpty(choices) && groupBy.selectorNoDataFn) {
            return <div className="esper-no-content">
              { groupBy.selectorNoDataFn(this.props) }
            </div>;
          }

          return <Components.ListSelectorASN
            choices={choices}
            selected={this.getSelected()}
            updateFn={(x) => this.props.updateFn(
              groupBy.updateExtraFn(x, this.props)
            )}
            allChoice={groupBy.allText ? {
              displayAs: groupBy.allText,
              badgeText: results.group.all.totalUnique.toString(),
              badgeHoverText: Text.events(results.group.all.totalUnique),
            } : undefined}
            noneChoice={groupBy.noneText ? {
              displayAs: groupBy.noneText,
              badgeText: results.group.none.totalUnique.toString(),
              badgeHoverText: Text.events(results.group.none.totalUnique)
            } : undefined}
            selectedItemClasses="active"
            className="esper-select-menu"
            listClasses="esper-select-menu"
            itemClasses="esper-selectable"
          />;
        }
      );
    }
  }

  // Dropdown form of above
  export class ChartSelectorDropdown extends ChartSelector {
    render() {
      // Dropdown input text
      let selectedText = (() => {
        let groupBy = this.props.groupBy;
        let selected = this.getSelected();
        if (selected.all) {
          if (selected.none) {
            if (groupBy.showAllText) {
              return groupBy.showAllText;
            }
          } else {
            if (groupBy.hideNoneText) {
              return groupBy.hideNoneText;
            }
          }
        }

        let items = _.map(selected.some,
          (s) => groupBy.displayFn ? groupBy.displayFn(s, this.props) : s
        );
        if (selected.none && groupBy.noneText) {
          items.push(groupBy.noneText);
        }
        return items.join(", ");
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
