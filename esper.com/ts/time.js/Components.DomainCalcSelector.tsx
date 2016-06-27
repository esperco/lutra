/*
  Domain selection widget based on calc
*/
module Esper.Components {
  interface Props {
    calculation: EventStats.DomainCountCalc;
    events: Stores.Events.TeamEvent[];
    selected: {
      all: boolean;
      some: string[];
      none: boolean;
    };
    showNone?: boolean;
    updateFn: (x: {
      all: boolean;
      none: boolean;
      some: string[];
    }) => void;
  }

  export class DomainCalcSelector
    extends CalcUI<EventStats.OptGrouping, Props>
  {
    render() {
      return this.state.result.match({
        none: () => <span />,
        some: (result) => {
          var choices = _.map(result.some, (v, k) => ({
            id: k,
            displayAs: k,
            badgeText: v.totalUnique.toString(),
            badgeHoverText: Text.events(v.totalUnique),
            badgeColor: Colors.getColorForDomain(k)
          }));
          return <div className="esper-select-menu">
            { this.renderAllSelector(result) }
            <Components.ListSelectorSimple
              choices={choices}
              selectedIds={
                this.props.selected.all ?
                _.map(choices, (c) => c.displayAs) :
                this.props.selected.some
              }
              selectOption={Components.ListSelectOptions.MULTI_SELECT}
              selectedItemClasses="active"
              className="esper-select-menu"
              listClasses="esper-select-menu"
              itemClasses="esper-selectable"
              updateFn={(x) => this.props.updateFn({
                all: choices.length === x.length && (
                  this.props.selected.none || !this.props.showNone
                ),
                none: this.props.selected.none,
                some: x
              })} />
            { this.props.showNone ? this.renderNoneSelector(result) : null }
          </div>;
        }
      });
    }

    renderAllSelector(result: EventStats.OptGrouping) {
      var total = _.keys(result.some).length;
      var selected: boolean|"some" = false;
      if (this.props.selected.all || (
        this.props.selected.some.length === total &&
          (this.props.selected.none || !this.props.showNone)
        )
      ) {
        selected = true;
      }

      else if (this.props.selected.some.length > 0 || (
        this.props.selected.none && this.props.showNone
      )) {
        selected = "some"
      }

      return this.renderSpecialSelector({
        text: Text.SelectAll,
        count: result.totalUnique,
        selected: selected,
        onClick: (x) => this.props.updateFn({
          all: x,
          none: x ? this.props.showNone : false,
          some: []
        })
      });
    }

    renderNoneSelector(result: EventStats.OptGrouping) {
      var allDomains = _.keys(result.some);
      var total = allDomains.length;
      return this.renderSpecialSelector({
        text: Text.NoGuests,
        count: result.none.totalUnique,
        selected: this.props.selected.all || this.props.selected.none,
        onClick: (x) => this.props.updateFn({
          all: x ? this.props.selected.some.length === total : false,
          none: x,
          some: x ? this.props.selected.some :
            (this.props.selected.all ? allDomains : this.props.selected.some)
        })
      });
    }

    renderSpecialSelector({text, count, selected, onClick}: {
      text: string;
      count: number;
      selected: boolean|"some";
      onClick: (selected: boolean) => void;
    }) {

      var icon = (() => {
        if (selected === true) {
          return "fa-check-square-o";
        } else if (selected === "some") {
          return "fa-minus-square-o";
        } else {
          return "fa-square-o"
        }
      })();

      return <div className="esper-select-menu">
        <a className="esper-selectable"
           onClick={() => onClick(!selected)}>
          <Components.Badge
            text={count.toString()}
            hoverText={count.toString() + " Events"}
          />
          <i className={"fa fa-fw " + icon} />{" "}
          { text }
        </a>
      </div>;
    }

    updateSelections({all, some, none}: {
      all?: boolean;
      some?: string[];
      none?: boolean;
    }) {

    }
  }
}
