interface QuillStatic {
    new(container1: Element, options?: Object): Delta;
}

interface Delta {
    getContents(start?: number, end?: number): Object;
    setContents(delta: Object, source?: string): void;
    getHTML(): string;
    setText(html: string, source?: string): void;
    on(arg: string, arg2: Function): void;
}