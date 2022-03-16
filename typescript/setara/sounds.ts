export enum Sound {
    Appearance, Fly, Join, Docked, Click, Select, Countdown, Success, Failure, Cancel, GameOver
}

export class SoundManager {
    private readonly context: AudioContext = new AudioContext()
    private readonly map: Map<Sound, AudioBuffer> = new Map()

    constructor() {
    }

    async load(): Promise<void> {
        await this.register(Sound.Appearance, "samples/appearance.wav")
        await this.register(Sound.Fly, "samples/fly.wav")
        await this.register(Sound.Join, "samples/join.wav")
        await this.register(Sound.Docked, "samples/docked.wav")
        await this.register(Sound.Click, "samples/click.wav")
        await this.register(Sound.Select, "samples/select.wav")
        await this.register(Sound.Countdown, "samples/countdown.wav")
        await this.register(Sound.Success, "samples/success.wav")
        await this.register(Sound.Failure, "samples/failure.wav")
        await this.register(Sound.Cancel, "samples/cancel.wav")
        await this.register(Sound.GameOver, "samples/gameover.wav")
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