import { Terminable } from "../lib/common.js";
import { Player } from "./player.js";
import { GameRound } from "./game-round.js";
import { GameContext } from "./game-context.js";
export declare abstract class GameState implements Terminable {
    protected readonly context: GameContext;
    protected constructor(context: GameContext);
    abstract executePlayerAction(player: Player): Promise<void>;
    abstract terminate(): void;
}
export declare class GameWaitForPlayersState extends GameState {
    private readonly terminator;
    private readonly players;
    private readonly menu;
    private readonly buttonManual;
    private readonly buttonNormal;
    private readonly buttonExpert;
    private readonly buttonStart;
    constructor(context: GameContext);
    executePlayerAction(player: Player): Promise<void>;
    terminate(): void;
}
export declare class GameStartState extends GameState {
    constructor(context: GameContext, players: Player[]);
    executePlayerAction(player: Player): Promise<void>;
    terminate(): void;
}
export declare class GameSearchState extends GameState {
    private readonly gameRound;
    private readonly players;
    private points;
    private interval;
    constructor(context: GameContext, gameRound: GameRound, players: Player[]);
    executePlayerAction(player: Player): Promise<void>;
    terminate(): void;
    private decreasePoints;
}
export declare class GameSelectionState extends GameState {
    constructor(context: GameContext, gameRound: GameRound, players: Player[], player: Player, possibleScore: number);
    executePlayerAction(player: Player): Promise<void>;
    terminate(): void;
}
export declare class GameOverState extends GameState {
    private gameRound;
    private readonly subscription;
    constructor(context: GameContext, gameRound: GameRound);
    executePlayerAction(player: Player): Promise<void>;
    startOver(): void;
    terminate(): void;
}
