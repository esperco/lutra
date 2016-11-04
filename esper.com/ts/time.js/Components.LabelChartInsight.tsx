/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {
  export class LabelChartInsight extends GroupChartInsight {
    getGroupBy() { return Charting.GroupByLabel; }

    render() {
      return this.getResult().mapOr(
        null,

        /*
          NB: We'd move more of this to Text namespace but given the complexity
          of the scenarios, leave alone for the time being
        */
        (s) => <div>{
          Insights.matchScenario(s.group, {
            allNone: () => <p>
              None of your events are{" "}{Text.Labeled}. Click on the
              {" "}<span className="text-muted">"{Text.Unlabeled}"</span>{" "}
              portion of the chart to assign {" "}{Text.Labels} to your events.
            </p>,

            allOne: (label) => <p>
              All of your {" " + Text.Labeled + " "} time is being spent on
              {" "}<InlineLabelList pairs={[[label, 1]]} props={this.props}  />.
            </p>,

            allEqual: (pairs) => <p>
              Your time is being spent roughly equally between{" "}
              <InlineLabelList pairs={pairs} props={this.props} />.
            </p>,

            tiersMajority: (tier1, tier2) => <p>
              You're spending the majority of your time on events
              {" " + Text.Labeled + " "}
              <InlineLabelList pairs={tier1} props={this.props} />,
              {" "}followed by{" "}
              <InlineLabelList pairs={tier2} props={this.props} />.
            </p>,

            tiersPlurality: (tier1, tier2) => <p>
              You're spending the bulk of your time on events
              {" " + Text.Labeled + " "}
              <InlineLabelList pairs={tier1} props={this.props} />,
              {" "}followed by{" "}
              <InlineLabelList pairs={tier2} props={this.props} />.
            </p>,

            fallback: (pairs) => <p>
              Your top {Text.Labels} are{" "}
              <InlineLabelList pairs={pairs.slice(0, 3)} props={this.props} />.
            </p>
          })
        }</div>
      );
    }
  }

  function InlineLabelList({pairs, props} : {
    pairs: [string, number][];
    props: Types.ChartProps;
  }) {
    let keys = _.map(pairs, (p) => p[0]);
    let colors = props.groupBy.colorMapFn(keys, props);
    return <CommaList>{ _.map(pairs, (p, i) =>
      <InlineLabel
        key={p[0]} id={p[0]}
        color={colors[i]}
        displayAs={props.groupBy.displayFn(p[0], props)}
      />
    )}</CommaList>;
  }

  function InlineLabel({id, color, displayAs}: {
    id: string;
    color: string;
    displayAs: string;
  }) {
    return <Components.Badge color={color} text={displayAs} />;
  }
}
