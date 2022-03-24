import {Boot, newAudioContext, preloadImagesOfCssFile} from "./lib/boot.js"
import {Player} from "./setara/player.js"
import {SoundManager} from "./setara/sounds.js"
import {Mulberry32} from "./lib/math.js"
import {GameContext, PlayerFactory} from "./setara/game-context.js"

const showProgress = (() => {
    const progress: SVGSVGElement = document.querySelector("svg.preloader")
    window.onerror = () => progress.classList.add("error")
    window.onunhandledrejection = () => progress.classList.add("error")
    return (percentage: number) => progress.style.setProperty("--percentage", percentage.toFixed(2))
})();

(async () => {
    console.debug("booting...")

    // --- BOOT STARTS ---
    const boot = new Boot()
    boot.addObserver(boot => showProgress(boot.normalizedPercentage()))
    boot.registerProcess(preloadImagesOfCssFile("./bin/main.css"))
    const context = newAudioContext()
    const soundManager = new SoundManager(context)
    soundManager.load().forEach(promise => boot.registerProcess(promise))
    await boot.waitForCompletion()
    // --- BOOT ENDS ---

    const orientations = ["top", "left", "right", "bottom"]
    const mainElement = document.querySelector("main div.game")
    const playerTemplate = mainElement.querySelector("div.player-wrapper.template")
    playerTemplate.remove()
    const playerFactory: PlayerFactory = {
        create: (context: GameContext): Player[] => {
            return orientations.map(orientation => {
                playerTemplate.classList.remove("template")
                const gridAreaElement = playerTemplate.cloneNode(true) as HTMLElement
                gridAreaElement.classList.add(orientation)
                mainElement.appendChild(gridAreaElement)
                return new Player(context, gridAreaElement.querySelector("div.player"))
            })
        }
    }
    window["doNotGc"] = new GameContext(soundManager, new Mulberry32(), playerFactory)

    // prevent dragging entire document on mobile
    document.addEventListener('touchmove', (event: TouchEvent) => event.preventDefault(), {passive: false})
    document.addEventListener('dblclick', (event: Event) => event.preventDefault(), {passive: false})
    const resize = () => document.body.style.height = `${window.innerHeight}px`
    window.addEventListener("resize", resize)
    resize()
    requestAnimationFrame(() => {
        document.querySelectorAll("body svg.preloader").forEach(element => element.remove())
        document.querySelectorAll("body main").forEach(element => element.classList.remove("invisible"))
    })
    console.debug("boot complete.")
})()