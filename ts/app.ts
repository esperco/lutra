class Add {
  plusOne(n: number): string {
    return n + " plus one!";
  }
}

declare var __ESPER_PRODUCTION__: boolean;

// Dev mode may not define this, so ensure it's falsey
if (typeof __ESPER_PRODUCTION__ === "undefined") {
  __ESPER_PRODUCTION__ = false;
}

if (! __ESPER_PRODUCTION__) {
  console.log((new Add()).plusOne(1));
}
