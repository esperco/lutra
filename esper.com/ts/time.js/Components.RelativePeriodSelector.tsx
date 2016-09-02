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

  export function RelativePeriodDropdownSelector(props: Props & {
    id?: string;
  }) {
    /*
      This is going to be removed in favor of a proper time series graph at
      some point in the future, so not going to worry about properly
      refactoring text.
    */
    let selectedText = ((incrs: number[]) => {
      let interval = Period.isCustomInterval(props.period.interval) ?
        "Period" : _.capitalize(props.period.interval);
      if (_.isEmpty(incrs) || _.isEqual(incrs, [0])) {
        return `Current ${interval} Only`;
      }

      let items: string[] = [];
      if (_.includes(incrs, -1)) {
        items.push(`Last ${interval}`);
      }
      if (_.includes(incrs, 1)) {
        items.push(`Next ${interval}`);
      }
      return items.join(", ");
    })(props.selectedIncrs)

    return <Dropdown keepOpen={true}>
      <Selector id={props.id} className="dropdown-toggle">
        { selectedText }
      </Selector>
      <div className="dropdown-menu">
        <RelativePeriodSelector {...props} />
      </div>
    </Dropdown>;
  }
}
