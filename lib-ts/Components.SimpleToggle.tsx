/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  interface Props {
    active: boolean;
    title: string;
    listClass?: string;
    itemClass?: string;
    onChange: (x: boolean) => void;
  }

  export function SimpleToggle(
    {active, title, listClass, itemClass, onChange}: Props
  ) {
    var icon = active ? "fa-check-square-o" : "fa-square-o";
    return <div className={listClass || "esper-select-menu"}>
      <div className={itemClass || "esper-selectable"}
           onClick={() => onChange(!active)}>
        <i className={"fa fa-fw " + icon} />{" "}
        { title }
      </div>
    </div>
  }

}
