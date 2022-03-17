export enum Sound {
    Appearance,
    Fly,
    Join,
    Docked,
    Click,
    Select,
    PointDecay,
    Scoring,
    Countdown,
    Success,
    Failure,
    Cancel,
    Reject,
    GameOver
}

export class SoundManager {
    private readonly map: Map<Sound, AudioBuffer> = new Map()

    constructor(private readonly context: AudioContext) {
    }

    load(): Promise<void>[] {
        return [
            this.register(Sound.Appearance, "samples/appearance.wav"),
            this.register(Sound.Fly, "samples/fly.wav"),
            this.register(Sound.Join, "samples/join.wav"),
            this.register(Sound.Docked, "samples/docked.wav"),
            this.register(Sound.Click, "samples/click.wav"),
            this.register(Sound.Select, "samples/select.wav"),
            this.register(Sound.PointDecay, "samples/points-decay.wav"),
            this.register(Sound.Scoring, "samples/scoring.wav"),
            this.register(Sound.Countdown, "samples/countdown.wav"),
            this.register(Sound.Success, "samples/success.wav"),
            this.register(Sound.Failure, "samples/failure.wav"),
            this.register(Sound.Cancel, "samples/cancel.wav"),
            this.register(Sound.Reject, "samples/reject.wav"),
            this.register(Sound.GameOver, "samples/gameover.wav")
        ]
    }

    play(sound: Sound) {
        const bufferSource = this.context.createBufferSource()
        bufferSource.buffer = this.map.get(sound)
        bufferSource.onended = () => bufferSource.disconnect()
        bufferSource.connect(this.context.destination)
        bufferSource.start()
    }

    private async register(sound: Sound, url: string): Promise<void> {
        this.map.set(sound, await fetch(url).then(x => x.arrayBuffer()).then(x => this.context.decodeAudioData(x)))
        return Promise.resolve()
    }
}