module Unixtime {

  export function ofDate(x: Date) {
    return x.getTime() / 1000;
  }

  export function now() {
    return ofDate(new Date());
  }
}
