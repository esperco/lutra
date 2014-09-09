/*
  Small-size least-recently-used cache (LRU).
*/

module Esper.LRU {

  function sanityCheck(this_) {
    /*
      Note to programmers: make sure the object was created with 'new'
      and that the methods are not detached and passed
      to higher-order functions.

      Bad:  List.iter(a, cache.add);
      Good: List.iter(a, function(x) { cache.add(x); });

    */
    console.assert(this_ !== window);
  }

  export class C<T> {

    /*
      Array of at most maxlen elements without repeats,
      least recently added last.
    */
    all: T[] = [];

    private maxlen: number;
    private eq: (a: T, b: T) => boolean;

    constructor(maxlen: number,
                eq: (a: T, b: T) => boolean) {
      sanityCheck(this);
      this.maxlen = maxlen;
      this.eq = eq;
    }

    remove(x: T) {
      sanityCheck(this);
      var i = 0;
      while (i < this.all.length) {
        if (this.eq(x, this.all[i]))
          this.all.splice(i, 1);
        else
          i++;
      }
    }

    add(x: T) {
      sanityCheck(this);
      this.remove(x);
      this.all.unshift(x);
      if (this.all.length > this.maxlen) {
        this.all.pop();
      }
    }

    clear() {
      sanityCheck(this);
      this.all.splice(0, this.all.length);
    }
  }

  export function test() {
    var cache = new Esper.LRU.C(3, function(a, b) { return a == b; });

    function eq(a) {
      console.assert(JSON.stringify(cache.all) === JSON.stringify(a));
    }

    eq([]);
    cache.add(2);
    eq([2]);
    cache.add(2);
    eq([2]);
    cache.add(3);
    eq([3,2]);
    cache.add(2);
    eq([2,3]);
    cache.add(4);
    eq([4,2,3]);
    cache.add(3);
    eq([3,4,2]);
    cache.add(5);
    eq([5,3,4]);
  }
}
