// Type definitions for filepicker.js for Bower
// Project: https://filepicker.com
// Definitions by: Keith Yeung <https://github.com/KiChjang>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare var filepicker: FilePicker.fp;

interface Blob {
  url?: string;
  id?: number;
  filename?: string;
  mimetype?: string;
  key?: string;
  container?: string;
  isWriteable?: boolean;
  path?: string;
}

declare module FilePicker {
  interface PickerOptions {
    maxFiles?: number;
    multiple?: boolean;
    folders?: boolean;

    mimetype?: string | string[];
    extension?: string | string[];
    maxSize?: number;
    container?: string;
    service?: string;
    services?: string[];
    openTo?: string;
    webcamDim?: [number, number];
    debug?: boolean;
    hide?: boolean;
    policy?: string;
    signature?: string;
    customCss?: string;
    customText?: string;

    // Clientside image compression and resize
    imageQuality?: number;
    imageMax?: [number, number];
    imageMin?: [number, number];

    // Crop UI
    conversions?: string | string[];
    cropRatio?: number;
    cropDim?: [number, number];
    cropMax?: [number, number];
    cropMin?: [number, number];
    cropForce?: boolean;
  }

  interface StoreOptions {
    location?: string;
    path?: string;
    storeContainer?: string;
    access?: string;
  }

  interface FPProgress {
    progress: number;
    filename: string;
    mimetype: string;
    size: number;
  }

  export class FilepickerException {
    constructor(text: string);
  }

  export class FPError {
    constructor(code: number);
  }

  interface fp {
    setKey(key: string): void;

    pick(picker_options: PickerOptions, onSuccess: (blob: Blob) => any,
         onError: (error: FPError) => any,
         onProgress: (progress: FPProgress) => any): void;
    pick(picker_options: PickerOptions, onSuccess: (blob: Blob) => any,
         onError: (error: FPError) => any): void;
    pick(picker_options: PickerOptions, onSuccess: (blob: Blob) => any): void;
    pick(onSuccess: (blob: Blob) => any, onError: (error: FPError) => any,
         onProgress: (progress: FPProgress) => any): void;
    pick(onSuccess: (blob: Blob) => any,
         onError: (error: FPError) => any): void;
    pick(onSuccess: (blob: Blob) => any): void;

    pickAndStore(picker_options: PickerOptions, store_options: StoreOptions,
                 onSuccess: (blobs: Blob[]) => any,
                 onError: (error: FPError) => any,
                 onProgress: (progress: FPProgress) => any): void;
    pickAndStore(picker_options: PickerOptions, store_options: StoreOptions,
                 onSuccess: (blobs: Blob[]) => any,
                 onError: (error: FPError) => any): void;
    pickAndStore(picker_options: PickerOptions, store_options: StoreOptions,
                 onSuccess: (blobs: Blob[]) => any): void;
    pickAndStore(store_options: StoreOptions,
                 onSuccess: (blobs: Blob[]) => any,
                 onError: (error: FPError) => any,
                 onProgress: (progress: FPProgress) => any): void;
    pickAndStore(store_options: StoreOptions,
                 onSuccess: (blobs: Blob[]) => any,
                 onError: (error: FPError) => any): void;
    pickAndStore(store_options: StoreOptions,
                 onSuccess: (blobs: Blob[]) => any): void;
  }
}