/*
  Component for selecting a bunch of labels. Extract labels from
*/

/// <reference path="./Components.SidebarSelector.tsx" />

module Esper.Components {
  interface Props {
    period: Period.Single|Period.Custom;
    selectedIncrs: number[];
    allowedIncrs: number[];
    updateFn: (x: number[]) => void;
  }

  export function RelativePeriodSelector(props: Props) {
    var choices = _.map(props.allowedIncrs, (i) => ({
      id: i.toString(),
      displayAs: relPeriodText(props.period, i)
    }));
    var selected = _.map(props.selectedIncrs, (i) => i.toString());

    return <ListSelectorSimple choices={choices} selectedIds={selected}
      selectOption={ ListSelectOptions.MULTI_SELECT }
      selectedItemClasses="active"
      listClasses="esper-select-menu"
      itemClasses="esper-selectable"
      headerClasses="esper-select-header"
      updateFn={(x) => props.updateFn(parseIncrs(x))}
    />;
  }

  function relPeriodText(period: Period.Single|Period.Custom, i: number) {
    var periodText = Text.fmtPeriod(Period.incr(period, i), true);
    if (Period.isCustom(period)) {
      return periodText;
    } else {
      return `${Text.fmtRelPeriod(period.interval, i)} (${periodText})`;
    }
  }

  function parseIncrs(x: string[], zero=true): number[] {
    let ret = _(x)
      .map((i) => parseInt(i))
      .filter((n) => !isNaN(n))
      .value();
    if (! _.includes(ret, 0)) {
      ret.push(0);
    }
    ret.sort();
    return ret;
  }


  //////

  export class RelativePeriodSidebarSelector extends SidebarSelector<Props> {
    renderHeader() {
      return <span>
        <i className="fa fa-fw fa-flip-horizontal fa-tasks" />{" "}
        Compare With
      </span>;
    }

    renderContent() {
      return <RelativePeriodSelector
        period={this.props.period}
        allowedIncrs={[-1, 1]}
        selectedIncrs={this.props.selectedIncrs}
        updateFn={this.props.updateFn}
      />;
    }
  }
}
