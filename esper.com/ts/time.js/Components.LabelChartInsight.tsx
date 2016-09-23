/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {
  export class LabelChartInsight extends GroupChartInsight {
    getGroupBy() { return Charting.GroupByLabel; }

    render() {
      return this.getResult().match({
        none: () => null,

        /*
          NB: We'd move more of this to Text namespace but given the complexity
          of the scenarios, leave alone for the time being
        */
        some: (s) => <div>{
          Insights.matchScenario(s.group, {
            allNone: () => <p>
              None of your events are{" "}{Text.Labeled}. Click on the
              {" "}<span className="text-muted">"{Text.Unlabeled}"</span>{" "}
              portion of the chart to assign {" "}{Text.Labels} to your events.
            </p>,

            allOne: (label) => <p>
              All of your {" " + Text.Labeled + " "} time is being spent on
              {" "}<InlineLabel id={label} />.
            </p>,

            allEqual: (pairs) => <p>
              Your time is being spent roughly equally between{" "}
              <InlineLabelList pairs={pairs} />.
            </p>,

            tiersMajority: (tier1, tier2) => <p>
              You're spending the majority of your time on events
              {" " + Text.Labeled + " "}
              <InlineLabelList pairs={tier1} />, {" "}followed by{" "}
              <InlineLabelList pairs={tier2} />.
            </p>,

            tiersPlurality: (tier1, tier2) => <p>
              You're spending the bulk of your time on events
              {" " + Text.Labeled + " "}
              <InlineLabelList pairs={tier1} />, {" "}followed by{" "}
              <InlineLabelList pairs={tier2} />.
            </p>,

            fallback: (pairs) => <p>
              Your top {Text.Labels} are{" "}
              <InlineLabelList pairs={pairs.slice(0, 3)} />.
            </p>
          })
        }</div>
      });
    }
  }

  function InlineLabelList({pairs} : {pairs: [string, number][]}) {
    return <CommaList>
      { _.map(pairs, (p) => <InlineLabel key={p[0]} id={p[0]} />) }
    </CommaList>
  }

  function InlineLabel({id}: {id: string}) {
    let bg = Colors.getColorForLabel(id);
    let displayAs = Labels.getDisplayAs(id);
    return <Components.Badge color={bg} text={displayAs} />;
  }
}
