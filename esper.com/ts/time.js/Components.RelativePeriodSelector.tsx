/*
  Component for selecting a bunch of labels. Extract labels from
*/

module Esper.Components {
  interface Props {
    period: Period.Single;
    selectedIncrs: number[];
    allowedIncrs: number[];
    updateFn: (x: number[]) => void;
  }

  export function RelativePeriodSelector(props: Props) {
    var groups = [{
      id: "",
      choices: _.map(props.allowedIncrs, (i) => ({
        id: i.toString(),
        displayAs: Text.fmtRelPeriod(props.period.interval, i) + " (" +
          Text.fmtPeriod({
            interval: props.period.interval,
            index: props.period.index + i
          }, true) + ")"
      }))
    }];
    var selected = _.map(props.selectedIncrs, (i) => ({
      groupId: "",
      id: i.toString()
    }));

    return <ListSelector groups={groups} selectedIds={selected}
      selectOption={ ListSelectOptions.MULTI_SELECT }
      selectedItemClasses="active"
      listClasses="esper-select-menu"
      itemClasses="esper-selectable"
      headerClasses="esper-select-header"
      dividerClasses="divider"
      updateFn={(x) => props.updateFn(
        _(x).map((i) => parseInt(i.id)).filter((n) => !isNaN(n)).value()
      )}
    />;
  }
}
