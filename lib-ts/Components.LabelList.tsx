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
        <NoAttendToggle event={this.props.event} />
        { _.map(labelList, (labelVal) =>
          <LabelToggle key={labelVal.id}
                       label={labelVal} event={this.props.event} />
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
    label: Labels.Label;
    event: Stores.Events.TeamEvent;
  }

  class LabelToggle extends ReactHelpers.Component<LabelProps, {}> {
    render() {
      var labelColor = Colors.getColorForLabel(this.props.label.id);
      var isSelected = this.isSelected();
      var style = (() => ({
        borderStyle: "solid",
        borderColor: labelColor,
        background: isSelected ? labelColor : "transparent",
        color: isSelected ? Colors.colorForText(labelColor) :
                            Colors.darken(labelColor)
      }))();
      var label = this.props.label;

      // Predicted label
      if (label.score > 0 && label.score < 1) {
        return <Tooltip style={style}
          className="event-label predicted-label"
          data-toggle="tooltip"
          title={Text.predictionTooltip(label.score)}
          onClick={() => {
            isSelected ? this.toggleOff() : this.toggleOn()
        }}>
          <i className="fa fa-fw fa-question-circle" />
          {" "}
          {label.displayAs}{" "}
          <span className="label-score">
            <SignalStrength strength={label.score} />
          </span>
        </Tooltip>;
      }

      // User-selected label
      return <span style={style} className="event-label"
                   onClick={() => {
                     isSelected ? this.toggleOff() : this.toggleOn()
                   }}>
        <i className="fa fa-fw fa-tag" />{" "}
        {this.props.label.displayAs}
      </span>;
    }

    isSelected() {
      return this.props.event.labelScores.match({
        none: () => false,
        some: (labels) => !!_.find(labels, (l) => l.id === this.props.label.id)
      });
    }

    toggleOn() {
      Actions.EventLabels.add([this.props.event],
        this.props.label.displayAs);
    }

    toggleOff() {
      Actions.EventLabels.remove([this.props.event],
        this.props.label.displayAs);
    }
  }

  class NoAttendToggle extends ReactHelpers.Component<{
    event: Stores.Events.TeamEvent
  }, {}> {
    render() {
      return <Tooltip className={classNames("no-attend-action",
          "action", "label-list-action", {
            active: this.props.event.feedback.attended === false
          })} title="Did Not Attend" onClick={() => this.toggleAttend()}>
        <i className="fa fa-fw fa-ban" />
      </Tooltip>;
    }

    toggleAttend() {
      var newFeedback = _.clone(this.props.event.feedback);
      newFeedback.attended = this.props.event.feedback.attended === false;
      Actions.Feedback.post(this.props.event, newFeedback);
    }
  }

}
