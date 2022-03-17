export declare enum Sound {
    Appearance = 0,
    Fly = 1,
    Join = 2,
    Docked = 3,
    Click = 4,
    Select = 5,
    PointDecay = 6,
    Scoring = 7,
    Countdown = 8,
    Success = 9,
    Failure = 10,
    Cancel = 11,
    Reject = 12,
    GameOver = 13
}
export declare class SoundManager {
    private readonly context;
    private readonly map;
    constructor(context: AudioContext);
    load(): Promise<void>;
    play(sound: Sound): void;
    private register;
}
