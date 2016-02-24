/*
  Component for updating labels for a given task
*/

/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Events.ts" />
/// <reference path="./EventLabelChange.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Components.LabelAdd.tsx" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LabelEditorProps {
    eventPairs: [Events.TeamEvent, Model.StoreMetadata][];
  }

  export class LabelEditor2 extends Component<LabelEditorProps, {}>
  {
    render() {
      var events = _.map(this.props.eventPairs, (e) => e[0]);
      if (! events.length) {
        return <span />;
      }

      return <div className="esper-select-menu">
        { _.map(this.getAllLabels(), this.renderLabel.bind(this)) }
      </div>;
    }

    renderLabel(label: Labels.LabelCount) {
      var checkedByAll = label.count === this.props.eventPairs.length;
      var checkedBySome = label.count > 0;
      var icon = (() => {
        if (checkedByAll) {
          return "fa-check-square";
        } else if (checkedBySome) {
          return "fa-minus-square-o"
        }
        return "fa-square-o";
      })();

      var handler = () => {
        var events = _.map(this.props.eventPairs, (e) => e[0]);
        if (checkedByAll) {
          EventLabelChange.remove(events, label.displayAs);
        } else {
          EventLabelChange.add(events, label.displayAs);
        }
      };

      return <a className="esper-selectable" key={label.id} onClick={handler}>
        <i className={"fa fa-fw " + icon} />{" "}
        {label.displayAs}
      </a>
    }

    /*
      Returns a list of labels including those stored on the team and each
      of the events themselves
    */
    getAllLabels() {
      var events = _.map(this.props.eventPairs, (e) => e[0]);
      return Labels.fromEvents(events, true);
    }
  }

  export class LabelEditorModal extends Component<LabelEditorProps, {}> {
    render() {
      var heading = (this.props.eventPairs.length === 1 ?
        this.props.eventPairs[0][0].title || "1 Event Selected":
        this.props.eventPairs.length + " Events Selected"
      );

      var error = !!_.find(this.props.eventPairs, (e) =>
        e[1].dataStatus === Model.DataStatus.PUSH_ERROR ||
        e[1].dataStatus === Model.DataStatus.FETCH_ERROR
      );

      var busy = !!_.find(this.props.eventPairs, (e) =>
        e[1].dataStatus === Model.DataStatus.INFLIGHT
      );

      return <Modal icon="fa-calendar-o" title={heading}
        showFooter={true}
        busy={busy}
      >
        { error ? <ErrorMsg /> : null }
        <LabelEditor2 eventPairs={this.props.eventPairs} />
        <div className="esper-select-menu">
          <div className="divider" />
          <a className="esper-selectable" target="_blank"
             onClick={this.editLabelList.bind(this)}>
          <i className="fa fa-fw fa-cog"></i>
          {" "}Edit Label List
          </a>
        </div>
      </Modal>;
    }

    editLabelList() {
      Layout.renderModal(<LabelAddModal
        onHidden={Views.forceCalendarLabelingUpdate}
      />);
    }
  }
}
