module HostUrl {
  export function isGmail(url: string) {
    return (/^https:\/\/mail\.google\.com\//).test(url);
  }

  export function isGcal(url: string) {
    return (/^https:\/\/www\.google\.com\/calendar\//).test(url)
        || (/^https:\/\/calendar\.google\.com\//).test(url);
  }

  export function hasExtension(url: string) {
    return isGmail(url) || isGcal(url);
  }
}
