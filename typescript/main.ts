import {Boot, newAudioContext, preloadImagesOfCssFile} from "./lib/boot.js"
import {LimiterWorklet} from "./audio/limiter/worklet.js"
import {MeterWorklet} from "./audio/meter/worklet.js"
import {MetronomeWorklet} from "./audio/metronome/worklet.js"
import {Player} from "./setara/player.js"
import {GameRound} from "./setara/game-round.js"
import {Rules} from "./setara/card.js"
import {SVGCardFactory} from "./setara/card-design.js"
import {SoundManager} from "./setara/sounds.js"

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
    boot.registerProcess(LimiterWorklet.loadModule(context))
    boot.registerProcess(MeterWorklet.loadModule(context))
    boot.registerProcess(MetronomeWorklet.loadModule(context))
    const soundManager = new SoundManager(context)
    boot.registerProcess(soundManager.load())
    await boot.waitForCompletion()
    // --- BOOT ENDS ---

    const orientations = ["top", "left", "right", "bottom"]
    const mainElement = document.querySelector("main div.game")
    const playerTemplate = mainElement.querySelector("div.player-wrapper.template")
    playerTemplate.remove()
    const players: Player[] = orientations.map(orientation => {
        playerTemplate.classList.remove("template")
        const gridAreaElement = playerTemplate.cloneNode(true) as HTMLElement
        gridAreaElement.classList.add(orientation)
        mainElement.appendChild(gridAreaElement)
        return new Player(gridAreaElement.querySelector("div.player"))
    })

    const gameRound = new GameRound(new Rules(), new SVGCardFactory(), soundManager)
    window.addEventListener("mousedown", async (event) => {
        console.log(event.target, event.currentTarget)
        await gameRound.start()
        const gameComplete = await gameRound.waitForTurnComplete(isSet => console.log(`isSet: ${isSet}`))
        console.log(`gameComplete: ${gameComplete}`)
    }, {once: true})


    // prevent dragging entire document on mobile
    document.addEventListener('touchmove', (event: TouchEvent) => event.preventDefault(), {passive: false})
    const resize = () => document.body.style.height = `${window.innerHeight}px`
    window.addEventListener("resize", resize)
    resize()
    requestAnimationFrame(() => {
        document.querySelectorAll("body svg.preloader").forEach(element => element.remove())
        document.querySelectorAll("body main").forEach(element => element.classList.remove("invisible"))
    })
    console.debug("boot complete.")
})()