/*
  Component for updating labels for a given task
*/

/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="../common/Components.ModalPanel.tsx" />
/// <reference path="./Events2.ts" />
/// <reference path="./EventLabelChange.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Components.EventEditor.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  //////

  interface LabelEditorProps {
    eventData: Model2.StoreData<Events2.FullEventId, Events2.TeamEvent>[];
    teamPairs: [ApiT.Team, Model.StoreMetadata][];
    onDone?: () => void;
    doneText?: string;
    autoFocus?: boolean;
  }

  export class LabelEditor2 extends Component<LabelEditorProps, {
    // Did labels change in between props? Set in componentWillReceiveProps
    labelsChanged?: boolean;

    // Filter for labels shown
    labelFilter?: string;

    // Which label is selected?
    labelSelected?: string;
  }> {
    constructor(props: LabelEditorProps) {
      super(props);
      this.state = {};
    }

    componentWillReceiveProps(newProps: LabelEditorProps) {
      // Events changed => not a label change
      var oldIds = _.map(this.props.eventData, (d) => d.aliases[0]);
      var newIds = _.map(newProps.eventData, (d) => d.aliases[0]);
      if (! _.isEqual(oldIds, newIds)) {
        this.setState({ labelsChanged: false });
        return;
      }

      // Check if labels changed
      var oldLabels = _.map(this.props.eventData, (d) => d.data.match({
        none: (): string[] => [],
        some: (e) => e.labels_norm
      }));
      var newLabels = _.map(newProps.eventData, (d) => d.data.match({
        none: (): string[] => [],
        some: (e) => e.labels_norm
      }));
      if (!_.isEqual(oldLabels, newLabels)) {
        this.setState({ labelsChanged: true });
      }
    }

    componentDidMount() {
      this.focus();
    }

    componentDidUpdate(prevProps: LabelEditorProps) {
      if (! _.isEqual(this.props, prevProps)) {
        this.focus();
      }
    }

    focus() {
      if (this.props.autoFocus) {
        this.find("input[type=text]:first").focus();
      }
    }

    render() {
      var props = this.props;
      var events = this.getEvents();
      var teams = _.map(props.teamPairs, (t) => t[0]);

      var error = !!_.find(props.eventData, (data) =>
        data.dataStatus === Model.DataStatus.PUSH_ERROR ||
        data.dataStatus === Model.DataStatus.FETCH_ERROR
      );

      var busy = !!_.find(props.eventData, (data) =>
        data.dataStatus === Model.DataStatus.INFLIGHT
      );
      var busyText = <span className="esper-footer-text">Saving &hellip;</span>;

      var success = !busy && this.state.labelsChanged;
      var selectedTeamId = events[0] ? events[0].teamId : "";

      // NB: Use cancel button instead of OK button because purpose of button
      // is just to close panel, not do anything
      return <ModalPanel busy={busy} error={error} busyText={busyText}
              onCancel={props.onDone} cancelText={props.doneText || "Close"}
              success={success} className="esper-panel-section">
        <div className="esper-panel-section">
          { this.renderLabelInput(events) }
          { this.renderLabelList(events) }
          <div className="esper-select-menu">
            <div className="divider" />
            <a className="esper-selectable"
               href={"#!/labels/" + selectedTeamId}>
            <i className="fa fa-fw fa-bars"></i>
            {" "}Manage Labels
            </a>
          </div>
        </div>
      </ModalPanel>
    }

    renderLabelInput(events: Events2.TeamEvent[]) {
      return <LabelInput
        className={ this.props.autoFocus ? "esper-modal-focus" : null }
        onSubmit={(val) => {
          if (this.state.labelSelected) {
            if (_.every(events,
              (e) => _.includes(e.labels_norm, this.state.labelSelected)
            )) {
              EventLabelChange.remove(events, val);
            } else {
              EventLabelChange.add(events, val);
            }
            return val;
          }

          else {
            var teamIds = _.map(events, (e) => e.teamId);
            teamIds = _.uniq(teamIds);
            _.each(teamIds, (teamId) => {
              Teams.addLabel(teamId, val);
            });
            EventLabelChange.add(events, val);
            this.setState({ labelFilter: null })
            return "";
          }
        }}
        onChange={(val) => this.setState({
          labelFilter: val,
          labelSelected: null
        })}
        onDown={(val) => this.handleUpDown(val, 1)}
        onUp={(val) => this.handleUpDown(val, -1)}
      />;
    }

    renderLabelList(events: Events2.TeamEvent[]) {
      var labels = this.getLabels();
      return <div className="esper-select-menu">
        {
          _.map(labels,
            (l) => <Label key={l.id} label={l} events={events}
              highlight={l.id === this.state.labelSelected}
            />
          )
        }
      </div>;
    }

    getEvents() {
      var events: Events2.TeamEvent[] = [];
      _.each(this.props.eventData, (e) => e.data.match({
        none: () => null,
        some: (e) => events.push(e)
      }));
      return events;
    }

    getLabels() {
      var events = this.getEvents();
      var teams = _.map(this.props.teamPairs, (t) => t[0]);
      var labels = Labels.fromEvents(events, teams);
      labels = Labels.sortLabels(labels);

      if (this.state.labelFilter) {
        var normFilter = this.state.labelFilter.toLowerCase();
        labels = _.filter(labels,
          (l) => _.includes(l.displayAs.toLowerCase(), normFilter)
        );
      }

      return labels;
    }

    handleUpDown(val: string, incr: number) {
      var labels = this.getLabels();
      if (! labels.length) return val;

      var currentIndex = _.findIndex(labels,
        (l) => this.state.labelSelected === l.id
      );
      currentIndex += incr;

      if (currentIndex < 0) {
        currentIndex = 0;
      } else if (currentIndex > labels.length - 1) {
        currentIndex = labels.length - 1;
      }

      var selected = labels[currentIndex];
      this.setState( { labelSelected: selected.id });
      return labels[currentIndex].displayAs;
    }
  }


  ///////

  interface LabelInputProps {
    className?: string;
    onSubmit: (val: string) => string;

    // Triggered by user typing (not changes by onSubmit, onUp, onDown)
    onChange?: (val: string) => void;

    // Keyboard events
    onDown?: (val: string) => string;
    onUp?: (val: string) => string;
  }

  export class LabelInput extends Component<LabelInputProps, {
    value: string;
  }> {
    constructor(props: LabelInputProps) {
      super(props);
      this.state = { value: "" }
    }

    render() {
      return <div className="form-group">
        <label htmlFor={this.getId("new-labels")}>
          Find / Add Labels
        </label>
        <div className="input-group">
          <div className={this.state.value ? "esper-clearable" : ""}>
            <input type="text"
                   className={classNames("form-control", this.props.className)}
                   id={this.getId("new-labels")}
                   onKeyDown={this.inputKeydown.bind(this)}
                   onChange={(e) => this.onChange(e)}
                   value={this.state.value}
                   placeholder="Ex: Q1 Sales Goal"
            />
            {
              this.state.value ?
              <span className="esper-clear-action"
                    onClick={() => this.reset()}>
                <i className="fa fa-fw fa-times" />
              </span> :
              <span />
            }
          </div>
          <span className="input-group-btn">
            <button className="btn btn-default" type="button"
                    onClick={this.submitInput.bind(this)}>
              <i className="fa fa-fw fa-plus" />
            </button>
          </span>
        </div>
      </div>;
    }

    submitInput() {
      var val = this.state.value;
      if (val) {
        var newVal = this.props.onSubmit(val);
        this.setState({ value: newVal });
      }
    }

    reset() {
      this.setState({ value: "" });
      this.props.onChange("");
    }

    // Catch enter / up / down keys
    inputKeydown(e: KeyboardEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (e.keyCode === 13) {         // Enter
        e.preventDefault();
        this.submitInput();
      } else if (e.keyCode === 27) {  // ESC
        e.preventDefault();
        this.reset();
      } else if (e.keyCode === 38 && this.props.onUp) {
        e.preventDefault();
        this.setState({ value: this.props.onUp(val) });
      } else if (e.keyCode === 40 && this.props.onDown) {
        e.preventDefault();
        this.setState({ value: this.props.onDown(val) });
      }
    }

    onChange(e: React.FormEvent) {
      var val = (e.target as HTMLInputElement).value;
      this.setState({ value: val })
      if (this.props.onChange) {
        this.props.onChange(val);
      }
    }
  }


  ///////

  function Label(props: {
    label: Labels.LabelCount;
    events: Events2.TeamEvent[];
    highlight?: boolean;
  }) {
    var checkedByAll = props.label.count === props.events.length;
    var checkedBySome = props.label.count > 0;

    var labelClass = (() => {
      var ret = "esper-selectable";
      if (checkedByAll) {
        return ret + " active";
      } else if (checkedBySome) {
        return ret + " partial-active";
      }
      return ret;
    })();
    var icon = (() => {
      if (checkedByAll) {
        return "fa-check-square";
      } else if (checkedBySome) {
        return "fa-minus-square";
      }
      return "fa-square";
    })();
    if (props.highlight) {
      labelClass += " highlight";
    }
    var iconStyle = { color: Colors.getColorForLabel(props.label.id) };

    var handler = () => {
      if (checkedByAll) {
        EventLabelChange.remove(props.events, props.label.displayAs);
      } else {
        EventLabelChange.add(props.events, props.label.displayAs);
      }
    };

    return <a key={props.label.id} className={labelClass} onClick={handler}>
      <i style={iconStyle} className={"fa fa-fw " + icon} />{" "}
      {props.label.displayAs}
    </a>;
  }
}
