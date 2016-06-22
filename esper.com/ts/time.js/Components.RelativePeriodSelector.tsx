/*
  Component for selecting a bunch of labels. Extract labels from
*/

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
      dividerClasses="divider"
      updateFn={(x) => props.updateFn(
        _(x).map((i) => parseInt(i)).filter((n) => !isNaN(n)).value()
      )}
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
}
