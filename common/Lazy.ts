/*
  Lazy evaluation.
*/
module Esper.Lazy {

  /*
    Wrap a computation such that its result is cached forever.
  */
  export function create<T>(computation: { (): T }): { (): T } {
    var ready: boolean = false;
    var success: boolean;
    var result: T;
    var exception: any;

    function force(): T {
      if (ready) {
        if (success)
          return result;
        else
          throw exception;
      }
      else {
        try {
          result = computation();
          success = true;
          ready = true;
          computation = undefined;
          return result;
        }
        catch (e) {
          exception = e;
          success = false;
          ready = true;
          computation = undefined;
          throw exception;
        }
      }
    }

    return force;
  }
}
