var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Boot, newAudioContext, preloadImagesOfCssFile } from "./lib/boot.js";
import { Player } from "./setara/player.js";
import { SoundManager } from "./setara/sounds.js";
import { Mulberry32 } from "./lib/math.js";
import { GameContext } from "./setara/game-context.js";
const showProgress = (() => {
    const progress = document.querySelector("svg.preloader");
    window.onerror = () => progress.classList.add("error");
    window.onunhandledrejection = () => progress.classList.add("error");
    return (percentage) => progress.style.setProperty("--percentage", percentage.toFixed(2));
})();
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.debug("booting...");
    const boot = new Boot();
    boot.addObserver(boot => showProgress(boot.normalizedPercentage()));
    boot.registerProcess(preloadImagesOfCssFile("./bin/main.css"));
    const context = newAudioContext();
    const soundManager = new SoundManager(context);
    boot.registerProcess(soundManager.load());
    yield boot.waitForCompletion();
    const orientations = ["top", "left", "right", "bottom"];
    const mainElement = document.querySelector("main div.game");
    const playerTemplate = mainElement.querySelector("div.player-wrapper.template");
    playerTemplate.remove();
    const playerFactory = {
        create: (context) => {
            return orientations.map(orientation => {
                playerTemplate.classList.remove("template");
                const gridAreaElement = playerTemplate.cloneNode(true);
                gridAreaElement.classList.add(orientation);
                mainElement.appendChild(gridAreaElement);
                return new Player(context, gridAreaElement.querySelector("div.player"));
            });
        }
    };
    window["doNotGc"] = new GameContext(soundManager, new Mulberry32(), playerFactory);
    document.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
    document.addEventListener('dblclick', (event) => event.preventDefault(), { passive: false });
    const resize = () => document.body.style.height = `${window.innerHeight}px`;
    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(() => {
        document.querySelectorAll("body svg.preloader").forEach(element => element.remove());
        document.querySelectorAll("body main").forEach(element => element.classList.remove("invisible"));
    });
    console.debug("boot complete.");
}))();
//# sourceMappingURL=main.js.map