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
    events: Events.TeamEvent[];
  }

  export class LabelEditor2 extends Component<LabelEditorProps, {}>
  {
    renderWithData() {
      var events = this.props.events;
      if (! events.length) {
        return <span />;
      }

      return <div className="esper-select-menu">
        { _.map(this.getAllLabels(), this.renderLabel.bind(this)) }
      </div>;
    }

    renderLabel(label: Labels.LabelCount) {
      var checkedByAll = label.count === this.props.events.length;
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
        if (checkedByAll) {
          EventLabelChange.remove(this.props.events, label.displayAs);
        } else {
          EventLabelChange.add(this.props.events, label.displayAs);
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
      return Labels.fromEvents(this.getEvents(), true);
    }

    // Get updated events from store to trigger reactive udpate
    getEvents() {
      return _.map(this.props.events,
        (e) => Events.EventStore.val(Events.storeId(e))
      );
    }
  }

  export class LabelEditorModal extends Component<LabelEditorProps, {}> {
    renderWithData() {
      var heading = (this.props.events.length === 1 ?
        this.props.events[0].title || "1 Event Selected":
        this.props.events.length + " Events Selected"
      );

      var error = !!_.find(this.props.events, (e) =>
        Option.cast(Events.EventStore.metadata(Events.storeId(e))).match({
          none: () => false,
          some: (m) => m.dataStatus === Model.DataStatus.PUSH_ERROR ||
                       m.dataStatus === Model.DataStatus.FETCH_ERROR
        })
      );

      var busy = !!_.find(this.props.events, (e) =>
        Option.cast(Events.EventStore.metadata(Events.storeId(e))).match({
          none: () => false,
          some: (m) => m.dataStatus === Model.DataStatus.INFLIGHT
        })
      );

      return <Modal icon="fa-calendar-o" title={heading}
        showFooter={true}
        busy={busy}
      >
        { error ? <ErrorMsg /> : null }
        <LabelEditor2 events={this.props.events} />
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
