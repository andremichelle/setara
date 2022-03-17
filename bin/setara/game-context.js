import { GameRound } from "./game-round.js";
import { ObservableValueImpl } from "../lib/common.js";
import { GameWaitForPlayersState } from "./game-states.js";
export class GameConstants {
}
GameConstants.MAX_SCORE = 1000;
GameConstants.MIN_SCORE = 100;
GameConstants.SCORE_DECAY = 100;
GameConstants.SCORE_DECAY_INTERVAL = 10000;
export var GameDifficulty;
(function (GameDifficulty) {
    GameDifficulty[GameDifficulty["Normal"] = 0] = "Normal";
    GameDifficulty[GameDifficulty["Expert"] = 1] = "Expert";
})(GameDifficulty || (GameDifficulty = {}));
export class GameContext {
    constructor(soundManager, random, playerFactory) {
        this.soundManager = soundManager;
        this.random = random;
        this.state = null;
        this.difficulty = new ObservableValueImpl(GameDifficulty.Normal);
        this.players = playerFactory.create(this);
        this.switchState(new GameWaitForPlayersState(this));
    }
    createGameRound() {
        const difficulty = this.difficulty.get();
        if (difficulty === GameDifficulty.Normal) {
            return new GameRound(this.soundManager, this.random, 4, 3);
        }
        else if (difficulty === GameDifficulty.Expert) {
            return new GameRound(this.soundManager, this.random, 4, 4);
        }
    }
    forEachPlayer(callback, exclude) {
        if (exclude === undefined) {
            this.players.forEach(callback);
        }
        else {
            this.players.filter(player => !exclude.includes(player)).forEach(callback);
        }
    }
    requestPlayerAction(player) {
        return this.state.executePlayerAction(player);
    }
    play(sound) {
        this.soundManager.play(sound);
    }
    getWinner() {
        return this.players.slice().sort((a, b) => b.getScore() - a.getScore())[0];
    }
    switchState(state) {
        if (this.state !== null) {
            this.state.terminate();
        }
        console.debug(`switch to ${state.constructor.name}`);
        this.state = state;
    }
}
//# sourceMappingURL=game-context.js.map