export declare enum Sound {
    Appearance = 0,
    Fly = 1,
    Join = 2,
    Docked = 3,
    Click = 4,
    Select = 5,
    PointDecay = 6,
    Countdown = 7,
    Success = 8,
    Failure = 9,
    Cancel = 10,
    Reject = 11,
    GameOver = 12
}
export declare class SoundManager {
    private readonly context;
    private readonly map;
    constructor(context: AudioContext);
    load(): Promise<void>;
    play(sound: Sound): void;
    private register;
}
