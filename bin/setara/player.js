var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export var PlayerState;
(function (PlayerState) {
    PlayerState[PlayerState["WaitingToJoin"] = 0] = "WaitingToJoin";
    PlayerState[PlayerState["RequestingToJoin"] = 1] = "RequestingToJoin";
    PlayerState[PlayerState["Playing"] = 2] = "Playing";
    PlayerState[PlayerState["Selecting"] = 3] = "Selecting";
    PlayerState[PlayerState["Hiding"] = 4] = "Hiding";
    PlayerState[PlayerState["Winner"] = 5] = "Winner";
})(PlayerState || (PlayerState = {}));
export class Player {
    constructor(gameContext, element) {
        this.gameContext = gameContext;
        this.element = element;
        this.score = 0 | 0;
        this.button = element.querySelector("button");
        const clickHandler = (event) => __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            yield this.gameContext.requestPlayerAction(this);
        });
        this.button.addEventListener("mousedown", clickHandler);
        this.button.addEventListener("touchstart", clickHandler);
        this.scoreLabel = element.querySelector("div.display.score span");
        this.countdownBar = element.querySelector("div.display.countdown div span");
        this.cardsLeftLabel = element.querySelector("[data-info='cards-left']");
        this.cardsAvailablePoints = element.querySelector("[data-info='available-points']");
        this.crown = this.element.querySelector("div.crown");
        this.setCountDown(0.0);
        this.setCardsLeft(0);
        this.updateScoreLabel();
    }
    setState(state) {
        this.element.classList.remove("waiting");
        this.element.classList.remove("requesting");
        this.element.classList.remove("playing");
        this.element.classList.remove("selecting");
        this.element.classList.remove("hide");
        this.element.classList.remove("winner");
        switch (state) {
            case PlayerState.WaitingToJoin: {
                this.element.classList.add("waiting");
                break;
            }
            case PlayerState.RequestingToJoin: {
                this.element.classList.add("requesting");
                break;
            }
            case PlayerState.Playing: {
                this.element.classList.add("playing");
                break;
            }
            case PlayerState.Selecting: {
                this.element.classList.add("selecting");
                break;
            }
            case PlayerState.Hiding: {
                this.element.classList.add("hide");
                break;
            }
            case PlayerState.Winner: {
                this.element.classList.add("winner");
                break;
            }
        }
    }
    setCardsLeft(count) {
        this.cardsLeftLabel.textContent = `${count}`;
    }
    setAvailablePoints(points) {
        this.cardsAvailablePoints.textContent = `${points}`;
        this.cardsAvailablePoints.classList.add("flash");
        this.cardsAvailablePoints.addEventListener("animationend", () => this.cardsAvailablePoints.classList.remove("flash"), { once: true });
    }
    setActionName(text) {
        this.button.textContent = text;
    }
    setCountDown(progress) {
        this.countdownBar.style.width = `${progress * 100}%`;
    }
    flashCountDown() {
        this.countdownBar.classList.add("flash");
        this.countdownBar.addEventListener("animationend", () => this.countdownBar.classList.remove("flash"));
    }
    addScore(points) {
        this.score += points;
        this.updateScoreLabel();
    }
    getScore() {
        return this.score;
    }
    updateScoreLabel() {
        if (this.score < 0)
            this.scoreLabel.classList.add("negative");
        else
            this.scoreLabel.classList.remove("negative");
        this.scoreLabel.textContent = `${Math.abs(this.score).toString(10).padStart(4, "0")}`;
    }
}
//# sourceMappingURL=player.js.map