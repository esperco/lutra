module Esper.Option {
  export class T<E> {
    private value : E
    private some : boolean

    constructor(value : E, some? : boolean) {
      this.value = value;
      this.some = some || false;
    }

    match<A>(matcher: { none : () => A; some : (x:E) => A }): A {
      if (this.some) {
        return matcher.some(this.value);
      } else {
        return matcher.none();
      }
    }

    isNone<A>() {
      return !this.some;
    }

    isSome<A>() {
      return this.some;
    }

    /* Extract the value or fail by raising an exception indicating a bug. */
    unwrap(): E {
      Log.assert(this.some, "Unwrap failed.")
      return this.value;
    }

    /** Monadic bind for Option.T, but `bind' is already used in the
     *  JavaScript standard library for something else, so I called
     *  this flatMap à la Scala to avoid confusion.
     */
    flatMap<B>(f : (x : E) => T<B>) : T<B> {
      return this.match({
        some : function (x) {
          return f(x);
        },
        none : function () {
          return Option.none<B>();
        }
      });
    }

    /* Join option with another option */
    join<B, C>(o: T<B>, f?: (a: E, b: B) => T<C>) {
      return this.flatMap((a) => o.flatMap((b) => f(a,b)));
    }
  }

  export function some<E>(x : E) : T<E> {
    return new T(x, true);
  }

  export function none<E>() : T<E> {
    return new T(null, false);
  }

  /** Wraps a potentially null value into an Option. It's Option.none
   *  if the value is null or undefined. If value is already an Option,
   *  returns value as is (this is useful if you want to wrap a return value
   *  from a function as an Option and that function is later updated to
   *  return an Option directly.)
   */
  export function wrap<E>(x : E) : T<E> {
    if (x === null || x === undefined) {
      return Option.none<E>();
    } else {
      return Option.some(x);
    }
  }

  /** Like Option.wrap, but if value is already an Option, returns value as is
   *  (this is useful if you want to wrap a return value from a function as an
   *  Option and that function is later updated to return an Option directly).
   */
  export function cast<E>(x : E|T<E>) : T<E> {
    if (x instanceof T) {
      return x;
    }
    return wrap(<E> x);
  }

  /** For function composition and general interface consistency, curried */
  export function unwrap<E>(): { (opt: T<E>) : E } {
    return function(opt) { return opt.unwrap(); }
  }

  /** Uncurried version */
  export function unwrap2<E>(opt: T<E>) : E {
    return opt.unwrap();
  }

  /*
    Given a list of options, unwrap them if some -- i.e. what flatMap
    in Scala does (which is would we'd call this function if it wasn't
    already taken above ...)
  */
  export function flatten<E>(opts: T<E>[]): E[] {
    return _(opts)
      .filter((o) => o.isSome())
      .map((s) => s.unwrap())
      .value();
  }

  /*
    Helper to help Typescript infer types when matching against lists
    Otherwise, `none: () => []` will return any
  */
  export function matchList<E>(opt: T<E[]>): E[] {
    return opt.match({
      none: (): E[] => [],
      some: (s) => s
    });
  }
}
