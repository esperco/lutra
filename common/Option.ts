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
  }

  export function some<E>(x : E) : T<E> {
    return new T(x, true);
  }

  export function none<E>() : T<E> {
    return new T(null, false);
  }
}
