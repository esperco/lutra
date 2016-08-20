/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {
  export class LabelChartInsight extends ChartGroupingInsight<{}> {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      // Current group only
      let periodGroup = _.find(groups, (g) => g.current);
      if (! periodGroup) return <span />;

      let tuples = _.map(periodGroup.data.some,
        (v, k): [string, number] => [k,
          v.totalValue / periodGroup.data.totalValue]
      );
      tuples = _.sortBy(tuples, (t) => -t[1]);

      let tier1 = tier(tuples);
      let tier2 = tier(tuples.slice(tier1.length));

      return <div>
        <p>{ Text.ChartLabelsDescription }</p>

        { _.isEmpty(tier1) ?
          <p>None of your events are {Text.Labeled}/</p> :
          <p>
            You're spending the bulk of your time on events
            {" " + Text.Labeled + " "}
            <CommaList>
              { _.map(tier1, (t) => <InlineLabel key={t[0]} id={t[0]} />) }
            </CommaList>

            { _.isEmpty(tier2) ? null :
              <span>
                {" "}followed by{" "}
                <CommaList>
                  { _.map(tier2, (t) => <InlineLabel key={t[0]} id={t[0]} />) }
                </CommaList>
              </span>
            }.
          </p>
        }
      </div>;
    }
  }

  /*
    Given a list of sorted [string, number] pairs, where the number is a
    a float betwen 0 and 1, returns the first "tier" of pairs (i.e. pairs where
    the number is reasonably close to the largest number).
  */
  function tier(pairs: [string, number][]) {
    let ret: [string, number][] = [];
    let index = 0;

    if (pairs.length) {
      ret.push(pairs[0]);
      let base = pairs[0][1];
      let threshold = Math.max(0.8 * base, 0.02);
      index += 1;

      while (pairs[index]) {
        if (pairs[index][1] >= threshold) {
          ret.push(pairs[index]);
          index += 1;
        } else {
          break;
        }
      }
    }

    return ret;
  }

  function InlineLabel({id}: {id: string}) {
    let bg = Colors.getColorForLabel(id);
    let displayAs = Labels.getDisplayAs(id);
    return <Components.Badge color={bg} text={displayAs} />;
  }
}
