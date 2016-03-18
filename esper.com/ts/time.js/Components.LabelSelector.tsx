/*
  Component for selecting a bunch of labels. Extract labels from
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Components.DropdownModal.tsx" />
/// <reference path="./Labels.ts" />

module Esper.Components {
  interface LabelSelectorProps {
    labels: Array<Labels.Label|Labels.LabelCount>;
    totalCount?: number;
    unlabeledCount?: number;
    selected: string[];
    allSelected?: boolean;
    unlabeledSelected?: boolean;
    showUnlabeled?: boolean;
    updateFn: (x: {
      all: boolean;
      unlabeled: boolean;
      labels: string[];
    }) => void;
    className?: string;
  }

  export function LabelSelector(props: LabelSelectorProps) {
    // Only one group for now
    var groups = [{
      id: "",
      choices: _.map(props.labels, (l) => ({
        id: l.id,
        displayAs: l.displayAs,
        badgeText: Labels.hasCount(l) ? l.count && l.count.toString() : "",
        badgeHoverText: Labels.hasCount(l) ? (l.count && l.count.toString() +
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

    function editLabels() {
      Layout.renderModal(<Views.LabelManageModal />);
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
          Unlabeled Events
        </a>
      </div> : null }
      { props.showUnlabeled ? <div className="divider" /> : null }

      <div className="esper-select-menu">
        <a className="esper-selectable"
           onClick={editLabels}>
          <i className="fa fa-fw fa-bars" />{" "}
          Manage Labels
        </a>
      </div>
    </div>;
  }


  //////

  export function LabelSelectorDropdown(props: LabelSelectorProps) {
    // Dropdown input text
    var selectedText = (() => {
      if (props.allSelected) {
        return "All Labels";
      }
      var labels = _.map(
        _.filter(props.labels, (l) => _.includes(props.selected, l.id)),
        (l) => l.displayAs);
      if (props.unlabeledSelected) {
        labels.push("Unlabeled Events");
      }
      return labels.join(", ");
    })();

    return <div className="input-group cal-selector">
      <span className="input-group-addon">
        <i className="fa fa-fw fa-tag" />
      </span>
      <DropdownModal keepOpen={true}>
        <input type="text" className="form-control dropdown-toggle end-of-group"
               data-toggle="dropdown" readOnly={true}
               value={ selectedText } />
        {
          LabelSelector(_.extend({
            className: "dropdown-menu"
          }, props) as LabelSelectorProps)
        }
      </DropdownModal>
    </div>;
  }
}
