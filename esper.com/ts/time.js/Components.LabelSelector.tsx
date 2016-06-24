/*
  Component for selecting a bunch of labels. Extract labels from
*/

/// <reference path="./Components.CalcUI.tsx" />

module Esper.Components {
  interface LabelSelectorBaseProps {
    className?: string;
    selected: string[];
    allSelected?: boolean;
    unlabeledSelected?: boolean;
    showUnlabeled?: boolean;
    unconfirmedSelected?: boolean;
    updateFn: (x: {
      all: boolean;
      unlabeled: boolean;
      labels: string[];
    }) => void;
    onUnconfirmedClick?: () => void;
  }

  interface LabelCalcSelectorProps extends LabelSelectorBaseProps {
    teams: ApiT.Team[];
    events: Stores.Events.TeamEvent[];
    calculation: EventStats.LabelCountCalc;
  }

  interface LabelSelectorProps extends LabelSelectorBaseProps {
    labels: Array<Labels.LabelCount>;
    totalCount?: number;
    unlabeledCount?: number;
    unconfirmedCount?: number;
  }

  export function LabelSelector(props: LabelSelectorProps) {
    // Only one group for now
    var groups = [{
      id: "",
      choices: _.map(props.labels, (l) => ({
        id: l.id,
        displayAs: l.displayAs,
        badgeText: l.count ? l.count && l.count.toString() : "",
        badgeHoverText: l.count ? (l.count && l.count.toString() +
          " Event" + (l.count == 1 ? "" : "s")) : "",
        badgeColor: Colors.getColorForLabel(l.id)
      }))
    }];

    // Handle selection
    var selectedIds = (() => {
      if (props.allSelected) {
        return _.map(props.labels, (l) => l.id)
      }
      return props.selected;
    })();

    // Conform to ListSelector syntax
    var selectedIdsWithGroups = _.map(selectedIds, (l) => ({
      id: l,
      groupId: ""
    }));

     /////

    var allSelected = props.allSelected ||
      (selectedIds.length === props.labels.length &&
       (props.unlabeledSelected || !props.showUnlabeled));
    var unlabeledSelected = props.allSelected || props.unlabeledSelected;
    var someSelected = allSelected || selectedIds.length ||
      (props.unlabeledSelected && props.showUnlabeled);

    function toggleAll() {
      props.updateFn(someSelected ? {
        all: false,
        unlabeled: false,
        labels: []
      } : {
        all: true,
        unlabeled: true,
        labels: []
      });
    }

    function toggleUnlabel() {
      props.updateFn(props.unlabeledSelected ? {
        all: false,
        unlabeled: false,
        labels: selectedIds
      } : {
        all: props.selected.length === props.labels.length,
        unlabeled: true,
        labels: selectedIds
      });
    }

    function updateLabels(labels: {id: string; groupId: string}[]) {
      props.updateFn({
        all: labels.length === props.labels.length && unlabeledSelected,
        unlabeled: unlabeledSelected,
        labels: _.map(labels, (l) => l.id)
      });
    }


    /////

    var selectAllIcon = (() => {
      if (allSelected) {
        return "fa-check-square-o";
      } else if (someSelected) {
        return "fa-minus-square-o";
      } else {
        return "fa-square-o";
      }
    })();

    return <div className={props.className || "esper-select-menu"}>
      <div className="esper-select-menu">
        <a className="esper-selectable"
           onClick={toggleAll}>
          <span className="badge">{ props.totalCount }</span>
          <i className={"fa fa-fw " + selectAllIcon} />{" "}
          Select All
        </a>
      </div>
      <div className="divider" />

      { groups[0].choices.length > 0 ?
        <ListSelector groups={groups} selectedIds={selectedIdsWithGroups}
          selectOption={ ListSelectOptions.MULTI_SELECT }
          selectedItemClasses="active"
          listClasses="esper-select-menu"
          itemClasses="esper-selectable"
          headerClasses="esper-select-header"
          dividerClasses="divider"
          updateFn={updateLabels}
        /> : null }
      { groups[0].choices.length > 0 ? <div className="divider" /> : null }

      { props.showUnlabeled ?
        <div className="esper-select-menu">
        <a className="esper-selectable"
           onClick={toggleUnlabel}>
          {
            props.unlabeledCount ?
            <span className="badge">{ props.unlabeledCount }</span> :
            null
          }
          <i className={"fa fa-fw " + (unlabeledSelected ?
            "fa-check-square-o" : "fa-square-o")} />{" "}
          { Text.Unlabeled }
        </a>
      </div> : null }
      { props.showUnlabeled ? <div className="divider" /> : null }

      { props.onUnconfirmedClick ?
        <div className="esper-select-menu">
        <a className="esper-selectable"
           onClick={() => props.onUnconfirmedClick()}>
          {
            props.unconfirmedCount ?
            <span className={classNames("badge", "unconfirmed", {
              active: props.unconfirmedSelected
            })}>
              { props.unconfirmedCount }
            </span> : null
          }
          <i className="fa fa-fw fa-question-circle" />{" "}
          { Text.Unconfirmed }
        </a>
      </div> : null }
      { props.onUnconfirmedClick ? <div className="divider" /> : null }

      <div className="esper-select-menu">
        <a className="esper-selectable"
           href={Paths.Manage.Team.labels().href}>
          <i className="fa fa-fw fa-bars" />{" "}
          { Text.ManageLabels }
        </a>
      </div>
    </div>;
  }


  //////

  export function LabelSelectorDropdown(props: LabelSelectorProps) {
    // Dropdown input text
    var selectedText = (() => {
      if (props.unconfirmedSelected) {
        return Text.Unconfirmed;
      }
      if (props.allSelected) {
        return Text.AllLabels;
      }
      var labels = _.map(
        _.filter(props.labels, (l) => _.includes(props.selected, l.id)),
        (l) => l.displayAs);
      if (props.unlabeledSelected) {
        labels.push(Text.Unlabeled);
      }
      return labels.join(", ");
    })();

    return <div className="input-group cal-selector">
      <span className="input-group-addon">
        <i className="fa fa-fw fa-tag" />
      </span>
      <DropdownModal keepOpen={true}>
        <Selector className="dropdown-toggle end-of-group">
          { selectedText }
        </Selector>
        {
          LabelSelector(_.extend({
            className: "dropdown-menu"
          }, props) as LabelSelectorProps)
        }
      </DropdownModal>
    </div>;
  }


  /////


  export class LabelCalcSelector
         extends CalcUI<EventStats.LabelCalcCount, LabelCalcSelectorProps>
  {
    render() {
      return this.state.result.match({
        none: () => <span />,
        some: (result) => {
          // Labels from events
          var labels: Labels.LabelCount[] = _.map(result.some, (v, k) => ({
            id: k,
            displayAs: Labels.getDisplayAs(k),
            count: v.totalUnique
          }));

          // Get team labels too
          _.each(this.props.teams, (team) => {
            _.each(team.team_labels_norm, (norm, i) => {
              labels.push({
                id: norm,
                displayAs: team.team_labels[i],
                count: 0
              })
            })
          })
          labels = _.uniqBy(labels, (l) => l.id)

          // Get total event count

          return <LabelSelector
            className={this.props.className}
            labels={labels}
            selected={this.props.selected}
            allSelected={this.props.allSelected}
            unlabeledSelected={this.props.unlabeledSelected}
            unconfirmedSelected={this.props.unconfirmedSelected}

            showUnlabeled={this.props.showUnlabeled}
            totalCount={result.totalUnique}
            unlabeledCount={result.none.totalUnique}
            unconfirmedCount={result.unconfirmedCount}

            updateFn={this.props.updateFn}
            onUnconfirmedClick={this.props.onUnconfirmedClick}
          />;
        }
      })
    }
  }
}
