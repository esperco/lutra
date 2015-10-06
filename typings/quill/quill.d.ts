interface QuillStatic {
    new(container1: Element, options?: Object): Delta;
}

interface Delta {
    getSelection(): Range;
    setSelection(start: number, end: number, source?: string): void;
    setSelection(range: Range, source?: string): void;
    insertText(index: number, text: string): void;
    getContents(start?: number, end?: number): Object;
    setContents(delta: Object, source?: string): void;
    getHTML(): string;
    setText(html: string, source?: string): void;
    on(arg: string, arg2: Function): void;
    focus(): void;
}

interface Range {
    start: number;
    end: number;
}