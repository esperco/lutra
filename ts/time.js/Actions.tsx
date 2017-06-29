/*
  Base namespace for actions -- in particular, actions that render a view
  or do other one-off or asynchronous things necessary to render a view.
*/

module Esper.Actions {
  // Render with App container
  export function render(main: React.ReactElement<any>, teamId?: string) {
    Layout.render(<Views.App teamId={teamId}>
      { main }
    </Views.App>);
  }
}
