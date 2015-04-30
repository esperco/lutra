module Esper.Option {
  export class T<E> {
    value : E
    some : boolean

    constructor(value : E, some? : boolean) {
      this.value = value;
      this.some = some || false;
    }

    match<A>(noneCase : () => A, someCase : (x:E) => A): A {
      if (this.some) {
        return someCase(this.value);
      } else {
        return noneCase();
      }
    }
  }

  export function some<E>(x : E) : Option<E> {
    return new Option(x, true);
  }

  export function none<E>() : Option<E> {
    return new Option(null, false);
  }
}