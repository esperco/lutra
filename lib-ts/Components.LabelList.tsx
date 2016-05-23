/*
  Component for showing a list of labels for an event
*/

/// <reference path="./Actions.EventLabels.ts" />
/// <reference path="./Actions.Feedback.ts" />
/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Colors.ts" />
/// <reference path="./Labels.ts" />
/// <reference path="./Stores.Events.ts" />h
/// <reference path="./Text.ts" />

module Esper.Components {
  // How many labels to show in list by default
  const LABEL_COUNT_CUTOFF = 4;

  interface Props {
    event: Stores.Events.TeamEvent;
    team: ApiT.Team;
    onAddLabelClick?: (event: Stores.Events.TeamEvent) => void;
  }

  /*
    A list of toggle-able labels or predicted labels for an event.
  */
  export class LabelList extends ReactHelpers.Component<Props, {
    initLabelList: Labels.Label[];
    expanded: boolean;
  }> {
    constructor(props: Props) {
      super(props);

      /*
        Track the initial set of labels (or predicted labels) for rendering
        purposes. We don't want predicted labels or other options to disappear
        just because the user toggled one.
      */
      this.state = {
        initLabelList: this.getInitLabels(props.event),
        expanded: false
      }
    }

    /*
      If new labels outside of the initial list are assigned, that means
      user has added labels from outside the label toggle interface, so
      reset our initial toggle list.
    */
    componentWillReceiveProps(props: Props) {
      if (!this.state.expanded) {
        var labelList = this.getInitLabels(props.event);
        var newLabels = _.differenceBy(labelList, this.state.initLabelList,
                                       (l) => l.id);
        if (newLabels.length > 0) {
           this.setState({
            initLabelList: labelList,
            expanded: this.state.expanded
          });
        }
      }
    }

    // Returns a combination of predicted labels and team labels,
    // up to threshold, for selection purposes.
    getInitLabels(event: Stores.Events.TeamEvent): Labels.Label[] {
      var labels = event.labelScores.match({
        none: (): Labels.Label[] => [],
        some: (l) => l
      });

      if (labels.length < LABEL_COUNT_CUTOFF) {
        labels = labels.concat(Labels.fromTeam(this.props.team));
        labels = _.uniqBy(labels, (l) => l.id);
        labels = labels.slice(0, LABEL_COUNT_CUTOFF);
      }

      return labels;
    }

    render() {
      var labelList = this.state.initLabelList;
      if (this.state.expanded) {
        labelList = labelList.concat(Labels.fromTeam(this.props.team));
        labelList = _.uniqBy(labelList, (l) => l.id);
      }

      return <div className="event-labels">
        { Stores.Events.needsConfirmation(this.props.event) ?
          <span className="label-list-actions">
            <ConfirmPredictions event={this.props.event} />
          </span> : null }
        { _.map(labelList, (labelVal) =>
          <LabelToggle key={labelVal.id}
                       id={labelVal.id}
                       displayAs={labelVal.displayAs}
                       event={this.props.event} />
        ) }
        { this.state.expanded && this.props.onAddLabelClick ?
          <span className="add-event-label action label-list-action"
                onClick={() => this.props.onAddLabelClick(this.props.event)}>
            {labelList.length ?
              <span>
                <i className="fa fa-fw fa-tag" />{" "}
                <i className="fa fa-fw fa-ellipsis-h" />
              </span> :
              <span>
                <i className="fa fa-fw fa-plus" />{" "}{Text.AddLabel}
              </span>
            }
          </span> : null }
        <span className="toggle-label-expansion action label-list-action"
              onClick={() => this.toggleExpand()}>
          <i className={classNames("fa", "fa-fw", {
            "fa-chevron-left": this.state.expanded,
            "fa-chevron-right": !this.state.expanded
          })} />
        </span>
      </div>;
    }

    // When contracting, re-adjust init label list
    toggleExpand() {
      this.setState({
        initLabelList: (this.state.expanded ?
          this.getInitLabels(this.props.event) :
          this.state.initLabelList
        ),
        expanded: !this.state.expanded
      });
    }
  }


  interface LabelProps {
    id: string;
    displayAs: string;
    event: Stores.Events.TeamEvent;
  }

  class LabelToggle extends ReactHelpers.Component<LabelProps, {}> {
    render() {
      var labelColor = Colors.getColorForLabel(this.props.id);
      var score = this.getScore();
      var style = (() => ({
        borderStyle: "solid",
        borderColor: labelColor,
        background: score > 0 ? labelColor : "transparent",
        color: score > 0 ? Colors.colorForText(labelColor) :
                           Colors.darken(labelColor)
      }))();

      // Predicted label
      if (score > 0 && score < 1) {
        return <Tooltip style={style}
          className="event-label predicted-label"
          data-toggle="tooltip"
          title={Text.predictionTooltip(score)}
          onClick={() => {
            score > 0 ? this.toggleOff() : this.toggleOn()
        }}>
          <i className="fa fa-fw fa-question-circle" />
          {" "}
          {this.props.displayAs}{" "}
          <span className="label-score">
            <SignalStrength strength={score} />
          </span>
        </Tooltip>;
      }

      // User-selected label
      return <span style={style} className="event-label"
                   onClick={() => {
                     score > 0 ? this.toggleOff() : this.toggleOn()
                   }}>
        <i className="fa fa-fw fa-tag" />{" "}
        {this.props.displayAs}
      </span>;
    }

    getScore() {
      return this.props.event.labelScores.match({
        none: () => 0,
        some: (labels) => Option.wrap(
          _.find(labels, (l) => l.id === this.props.id)
        ).match({
          none: () => 0,
          some: (label) => label.score
        })
      });
    }

    toggleOn() {
      Actions.EventLabels.add([this.props.event],
        this.props.displayAs);
    }

    toggleOff() {
      Actions.EventLabels.remove([this.props.event],
        this.props.displayAs);
    }
  }

  function ConfirmPredictions({event}: { event: Stores.Events.TeamEvent }) {
    return <Tooltip className="confirm-action action label-list-action"
                    title={Text.ConfirmLabels}
                    onClick={() => Actions.EventLabels.confirm([event])}>
      <i className="fa fa-fw fa-check" />
    </Tooltip>;
  }

}
