/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  interface Props {
    active: boolean;
    title: string;
    className?: string;
    onChange: (x: boolean) => void;
  }

  export function SimpleToggle({active, title, className, onChange}: Props) {
    var icon = active ? "fa-check-square-o" : "fa-square-o";
    return <div className="esper-select-menu">
      <div className={classNames(className, "esper-selectable")}
           onClick={() => onChange(!active)}>
        <i className={"fa fa-fw " + icon} />{" "}
        { title }
      </div>
    </div>
  }

}
