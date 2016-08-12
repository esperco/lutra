/*
  A module for handling error responses from the server.

  We only include error responses we actually have handlers for at the moment.
  See wolverine/types/error_details.atd for more list of errors.
*/

/// <reference path="./ApiT.ts" />
/// <reference path="./Variant.ts" />

module Esper.Errors {

  /*
    An interface for defining different responses based on the tag of an error
    variant. The keys are error tags and the value should be a function that
    accepts an error value, if any. Tags are optional because we don't want
    to have to define a response for every possible error variant (since the
    response in most cases is just logging it and warning the user).
  */
  export interface Callbacks<T> {
    // Usually triggered when we incorrectly sign a timestamp.
    Invalid_authentication_headers?: () => T;

    // When trying to log into Google account with Nylas
    Use_google_oauth?: () => T;

    // Called if none of the above match
    default: (tag?: string, value?: any) => T;
  }

  export function handle<T>(error: ApiT.ErrorDetails,
                            callbacks: Callbacks<T>): T {
    if (! error) { return callbacks.default(); }

    let tag = Variant.tag(error);
    let value = Variant.value(error);

    let callback: (fn: any) => T = (<any> callbacks)[tag];
    return callback ? callback(value) : callbacks.default(tag, value);
  }

}
