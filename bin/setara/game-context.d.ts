import { Sound, SoundManager } from "./sounds.js";
import { GameRound } from "./game-round.js";
import { Random } from "../lib/math.js";
import { Player } from "./player.js";
import { ObservableValue } from "../lib/common.js";
import { GameState } from "./game-states.js";
export declare class GameConstants {
    static MAX_SCORE: number;
    static MIN_SCORE: number;
    static SCORE_DECAY: number;
    static SCORE_DECAY_INTERVAL: number;
}
export declare enum GameDifficulty {
    Normal = 0,
    Expert = 1
}
export declare type PlayerFactory = {
    create: (context: GameContext) => Player[];
};
export declare class GameContext {
    private readonly soundManager;
    private readonly random;
    private readonly players;
    private state;
    readonly difficulty: ObservableValue<GameDifficulty>;
    constructor(soundManager: SoundManager, random: Random, playerFactory: PlayerFactory);
    createGameRound(): GameRound;
    forEachPlayer(callback: (player: Player) => void, exclude?: Player[]): void;
    requestPlayerAction(player: Player): Promise<void>;
    play(sound: Sound): void;
    getWinner(): Player;
    switchState(state: GameState): void;
}
