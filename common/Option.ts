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

  export function some<E>(x : E) : T<E> {
    return new T(x, true);
  }

  export function none<E>() : T<E> {
    return new T(null, false);
  }
}