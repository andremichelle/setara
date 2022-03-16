import { GameContext } from "./game-context.js";
export declare enum PlayerState {
    WaitingToJoin = 0,
    RequestingToJoin = 1,
    Playing = 2,
    Selecting = 3,
    Hiding = 4,
    Winner = 5
}
export declare class Player {
    private readonly gameContext;
    private readonly element;
    private readonly button;
    private readonly scoreLabel;
    private readonly countdownBar;
    private readonly cardsLeftLabel;
    private readonly cardsAvailablePoints;
    private readonly crown;
    private score;
    constructor(gameContext: GameContext, element: Element);
    setState(state: PlayerState): void;
    setCardsLeft(count: number): void;
    setAvailablePoints(points: number): void;
    setActionName(text: string): void;
    setCountDown(progress: number): void;
    flashCountDown(): void;
    addScore(points: number): void;
    getScore(): number;
    private updateScoreLabel;
}