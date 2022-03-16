import { Observable, Observer, Terminable } from "./common.js";
export declare const preloadImagesOfCssFile: (pathToCss: string) => Promise<void>;
export declare class Boot implements Observable<Boot> {
    private readonly observable;
    private readonly completion;
    private finishedTasks;
    private totalTasks;
    private completed;
    addObserver(observer: Observer<Boot>): Terminable;
    removeObserver(observer: Observer<Boot>): boolean;
    terminate(): void;
    registerProcess<T>(promise: Promise<T>): void;
    isCompleted(): boolean;
    normalizedPercentage(): number;
    percentage(): number;
    waitForCompletion(): Promise<void>;
}
export declare const newAudioContext: (options?: AudioContextOptions) => AudioContext;
