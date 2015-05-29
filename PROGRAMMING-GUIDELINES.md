Guidelines for improved correctness and maintainability of the Chrome extension
===============================================================================

Effective use of typechecking in TypeScript
-------------------------------------------

Unlike OCaml, TypeScript is optionally typed and does very little to
propagate type information when an OCaml programmer would expect it.
In order to guarantee that everything is typechecked, the following
discipline must be followed.

Each named function definition must be explicitly typed. The type of
each of the arguments as well as the result must be explicitly
specified. An example is:

```javascript
function f(x: string, y: ApiT.Team): JQueryPromise<ApiT.Food> {
  ...
}
```

`var` definitions that are not initialized from a function application
must be type-annotated. Examples of such cases include:

```javascript
var x: number;
var p: Point2 = { x: 12, y: -2 };
```

Basic functional data structures
--------------------------------

Lists:

The `List` module uses regular JavaScript arrays but provides
non-destructive operations similar to those found in OCaml's `List`
module.

Options:

We have an `Option` module provides an explicit option type. Values
that can legitimately be undefined (`undefined` or `null`) should be
encapsulated in an option type.

General maintainability principles
----------------------------------

* Instead of a giant multi-page mother function sprinkled with ugly comments,
  small functions with a self-documenting name and type.

* Organize code into modules, each module providing a specific
  functionality. Minimize the number of public module members.

* Split off into its own module any piece of code with a non-trivial
  implementation that has nothing specific to the current
  module. For example, instead of embedding a simple Cache
  implementation in a module that deals with task preferences, the
  code that implements the cache should go into its own module.
  Steps are:
  1. Identify that the code being written is of general purpose
  2. Check that we don't already have a suitable implementation
  3. Take your code and create a dedicated module for it

* Proactively refactor code *before* it becomes unmanageable. Take
  pride in doing it. The opposite, shortsighted behavior of never refactoring
  without being told by others is not acceptable.

* Format code within the project according to the same rules so that
  everyone can read it:

  - indent TypeScript code using 2 spaces
  - make sure no line of TypeScript code exceeds 80 characters
  - set your editor to highlight trailing whitespace and don't
    introduce any

Managing state changes: watchability
------------------------------------

Global variables used to hold a mutable state are regularly needed and
can be a source of bugs and confusion if not handled properly.

For example, the Esper extension for Chrome has one intuitive state which
corresponds to the current email thread ID. When viewing a
conversation in Gmail, our code detects that we are currently viewing
a conversation and we're given it's ID - as opposed to being in an
inbox or settings view. When this happens, a series of actions is
fired.

In order store and watch mutable states, we have a module `Watchable`
which provides getters and setters for a state, as well a way to
register functions called when the state changes.

The rule here is to use watchable values and watchers to hold
any mutable state. Additionally, if a state can be undefined,
e.g. it's a thread ID but we're not in a thread view, the `Option`
type must be used as mentioned above.

Managing state changes: maximize referential transparency
---------------------------------------------------------

Functions whose output and effects are entirely determined by their
inputs are called referentially transparent. For the programmer it
means:

- it doesn't matter when the function is executed, we know it will
  work using the arguments that were given to it, and not some future
  version of them
- the programmer understands in which context the function is allowed
  to run, which is any context where the arguments can be provided

Do not write:

```javascript
  function prefWidget() {
    ...
    saveButton.click(function() {
      Api.savePref(currentTeam.get().unwrap().teamid, pref);
    });
    return view;
  }

  function refreshSidebar() {
    ...
    prefWidget().append(prefContainer);
  }
```

Do write instead:

```javascript
  function prefWidget(team: ApiT.Team) {
    ...
    saveButton.click(function() {
      Api.savePref(team.teamid, pref);
    });
    return view;
  }

  /* requires current team to be defined */
  function refreshSidebar() {
    var team = currentTeam.get().unwrap();
    ...
    prefWidget(team).append(prefContainer);
  }
```

Why?

Because the `prefWidget` and the rest of the sidebar were created for a given
team. They display data of that team. Clicking on the button is
expected to apply to data of that team. If the
current team changes but for any reason the sidebar is not refreshed
right away, the old `prefWidget` and other sidebar elements remain
unchanged. Clicking the Save button should absolutely not save that
data for the current team, which doesn't own any of it.


Graphical elements: use a functional approach
---------------------------------------------

Graphical elements are created to display and make editable data
of a specific owner (e.g. a specific team). It is particularly
important that the buttons and other controls that save freshly-edited
data is saved into their rightful owner's account. In order to avoid
any mixup, create graphical elements in a functional way, by passing
all the inputs explicitly. See example in the section above on
referential transparency.

Graphical elements are created immutable in the sense that they won't
be taken over and mutated to display a totally new set of
data. Instead, old ones are removed and new ones are created.

In short, this is just about using a functional programming style:

- create object from fully-specified, immutable inputs
- replace old object with new one as needed
- remove the object when there's nothing to display

as opposed to an imperative approach:

- create uninitialized object that lives forever
- initialize each field of the object from some data
- when new data needs to be displayed, clear the existing fields
  and initialize the fields with new data
- somehow clear the fields when there's nothing to display and make it
  invisible


Don't make superfluous API calls
--------------------------------

When a new read-only resource becomes needed somewhere in the code,
the solution is usually not to make an API call on the spot.
Rather one should ensure that the API call is made as early as
possible so that other parts of the code may also access that data
without making their own API call.

Don't write this:

```javascript
  function a(teamid: string) {
    Api.getSocks(teamid).done(
      ...
    );
  }

  function b(teamid: string) {
    Api.getSocks(teamid).done(
      ...
    );
  }

  function init(teamid: string) {
    a(teamid);
    b(teamid);
  }
```

Do write:

```javascript
  function a(teamid: string, socks: ApiT.Socks) {
    ...
  }

  function b(teamid: string, socks: ApiT.Socks) {
    ...
  }

  function init(teamid: string) {
    Api.getSocks(teamid).done(function(socks) {
      a(teamid, socks);
      b(teamid, socks);
    });
  }
```

Obviously use that style even if for the moment there's only one place
where the resource is needed.

Some API calls can be cached, too. Use our `Cache` module and cache
results as JQuery promises.

Use asserts: program defensively, check your inputs, fail early
---------------------------------------------------------------

Use `console.assert(...)` at the beginning of a function or piece of
code that assumes a particular context. It has two benefits:

- documents what context or arguments are expected by a particular
  function
- it prevents from executing code in a broken environment and focusing
  on the correct code rather than focusing on what created the broken
  environment (the caller).
