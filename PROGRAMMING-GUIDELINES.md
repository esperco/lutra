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

```
function f(x: string, y: ApiT.Team): JQueryPromise<ApiT.Food> {
  ...
}
```

`var` definitions that are not initialized from a function application
must be type-annotated. Examples of such cases include:

```
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

No uninitialized variables:

Unitialized variables (e.g. `var x : number;`) don't benefit from the
type system and should be avoided. The option type should be used
instead. Very occasionally it is impractical to avoid them and we have
to resort to the following style:

```javascript
var name: string;

switch(f(x)) { // must initialize `name`
  "a":
    ...
    name = ...;
    break;
  "b":
    ...
    name = ...;
    break;
  "c":
    name = ...;
    break;
  default:
    /* error */
}
```

A way to guarantee the initialization of `name` would be to
use the `... ? ... : ...` syntax, but it makes the code less readable:

```javascript
var fx = f(x);
var name: string =
  fx === "a" ?
    function() {
      ...
      return ...;
    }()
  :
  fx === "b" ?
    function() {
      ...
      return ...;
    }()
  :
  fx === "c" ?
    ...
  :
  /* error */
;
```

As for data returned by libraries and JSON APIs which contain optional
fields, we leave them as-is if they're used immediately but we wrap
them into an option if they are passed around or assigned to
variables:

```javascript
var data = someLibFunction(arg);

var x = Option.wrap(data.x); // good
var x = data.x; // bad!

// good:
if (data.x) {
  let x = data.x;
  ...
}

otherLibFunction(data.x); // good
ourFunction(data.x); // bad!
ourFunction(Option.wrap(data.x)); // good
```


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

The first rule here, is to use watchable values and watchers to hold
any mutable state. Additionally, if a state can be undefined
(e.g. it's a thread ID but we're not in a thread view), the `Option`
type must be used as mentioned above.

Managing state changes: maximizing referential transparency
-----------------------------------------------------------

...
