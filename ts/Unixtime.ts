module Unixtime {

  export function ofDate(x: Date) {
    return x.getTime() / 1000;
  }

  export function now(): number {
    return ofDate(new Date());
  }

  export function ofRFC3339(s: string) {
    return ofDate(new Date(s));
  }
}
