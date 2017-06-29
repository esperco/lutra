/*
  Page for displaying errors
*/

module Esper.Views {
  interface Props {
    err: string;
  }

  export function SettingsError(props: Props) {
    return <Views.Settings {...props} />;
  }
}
