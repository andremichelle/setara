var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export var Sound;
(function (Sound) {
    Sound[Sound["Appearance"] = 0] = "Appearance";
    Sound[Sound["Fly"] = 1] = "Fly";
    Sound[Sound["Join"] = 2] = "Join";
    Sound[Sound["Docked"] = 3] = "Docked";
    Sound[Sound["Click"] = 4] = "Click";
    Sound[Sound["Select"] = 5] = "Select";
    Sound[Sound["PointDecay"] = 6] = "PointDecay";
    Sound[Sound["Scoring"] = 7] = "Scoring";
    Sound[Sound["Countdown"] = 8] = "Countdown";
    Sound[Sound["Success"] = 9] = "Success";
    Sound[Sound["Failure"] = 10] = "Failure";
    Sound[Sound["Cancel"] = 11] = "Cancel";
    Sound[Sound["Reject"] = 12] = "Reject";
    Sound[Sound["GameOver"] = 13] = "GameOver";
})(Sound || (Sound = {}));
export class SoundManager {
    constructor(context) {
        this.context = context;
        this.map = new Map();
    }
    load() {
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
        ];
    }
    play(sound) {
        const bufferSource = this.context.createBufferSource();
        bufferSource.buffer = this.map.get(sound);
        bufferSource.onended = () => bufferSource.disconnect();
        bufferSource.connect(this.context.destination);
        bufferSource.start();
    }
    register(sound, url) {
        return __awaiter(this, void 0, void 0, function* () {
            this.map.set(sound, yield fetch(url).then(x => x.arrayBuffer()).then(x => this.context.decodeAudioData(x)));
            return Promise.resolve();
        });
    }
}
//# sourceMappingURL=sounds.js.map