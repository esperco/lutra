interface QuillStatic {
    new(container1: Element, options?: Object): any;
    getContents(start?: number, end?: number): Object;
    setContents(delta: Object, source: Object): void;
    getHTML(): string;
}