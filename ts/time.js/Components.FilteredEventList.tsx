/*
  A list of events with a search box for filtering
*/

/// <refernece path="./Components.EventList.tsx" />

module Esper.Components {
  interface Props extends EventList_.Props { }

  export class FilteredEventList extends ReactHelpers.Component<Props, {
    filterStr: string;
  }> {
    constructor(props: Props) {
      super(props);
      this.state = { filterStr: "" };
    }

    render() {
      var props = this.props;
      if (this.state.filterStr) {
        props = _.cloneDeep(props);
        props.events = Stores.Events.filter(
          props.events,
          this.state.filterStr
        );
      }

      return <div>
        <div className="form-group">
          <SearchBox icon="fa-search"
            className="form-control"
            placeholder={Text.SearchEventsPlaceholder}
            value={this.state.filterStr}
            onUpdate={(val) => this.mutateState((s) => s.filterStr = val)}
          />
        </div>

        { React.createElement(EventList, props) }
      </div>;
    }
  }

  export class FilteredEventListModal extends FilteredEventList {
    render() {
      return <Modal icon="fa-calendar-o"
                    title={Text.events(this.props.events.length)}>
        { super.render() }
      </Modal>;
    }
  }
}
