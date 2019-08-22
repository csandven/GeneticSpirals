// keep a reference to the canvasContainer element
const canvasContainer = document.querySelector('#canvasContainer')

// Inputs from the user
const inputs = {
    mutationChance: null,
    mutationRate: null,
    scale: null
}

// Constants
var population = []
const POPULATION_SIZE = 50
const A = 6
const SCALE = 6
const MUTATION_CHANCE = .1
const MUTATION_RATE = 10
const MARGIN_LEFT = 80


class Genome {

    /**
     * Creates a new instance of Genome
     * @param {number} index 
     */
    constructor (index) {
        this.id = Math.random().toString(32).slice(2) + Math.random().toString(32).slice(2)
        this.min = this.getRandomInt(1, 500)
        this.max = this.getRandomInt(this.min, 800)
        this.step = this.getRandomInt(1, 40)
        this.score = 0
        this.index = index
    }

    /**
     * Clones this class and adds the same parameters as this one.
     * This is done to get rid of reference problems
     * 
     * @returns {Genome}
     */
    clone () {
        const newThis = new Genome(this.index)
        newThis.min = this.min
        newThis.max = this.max
        newThis.step = this.step
        return newThis
    }

    /**
     * Creates the canvas and the body for this genome
     * Only used for visualisations
     */
    createCanvas () {
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext('2d')
        this.canvas.width = (canvasContainer.clientWidth / 3) - 80
        this.canvas.height = 500
        this.canvas.addEventListener('mousedown', this.addScore.bind(this))
        this.canvas.addEventListener('mouseup', this.clearLoop.bind(this))

        this.centerX = this.canvas.width / 2
        this.centerY = this.canvas.height / 2

        const div = document.createElement('div')
        div.appendChild(this.canvas)
        const innerDiv = document.createElement('div')
        innerDiv.innerHTML = `
            <span>Min: ${this.min}</span>
            <span>Max: ${this.max}</span>
            <span>Step: ${this.step}</span>
            <span>Score: <span class="genomeScore_${this.id}">${this.score}</span></span>
        `
        div.appendChild(innerDiv)

        if (this.index % 3 === 0) {
            div.style.marginLeft = MARGIN_LEFT + 'px'
        }
        canvasContainer.appendChild(div)
    }

    /**
     * Handles mouse click event: Adds one point to the score 
     * every 50 millisecond the mouse is down.
     */
    addScore () {
        this.loop = setInterval(_ => {
            this.score += 1
            document.querySelector(`.genomeScore_${this.id}`).innerHTML = this.score
        }, 50)
    }

    /**
     * Handles mouse up event. Clears the loops so that it stops adding points
     * when mouse is released
     */
    clearLoop () {
        clearInterval(this.loop)
    }

    /**
     * Draws the pattern to the canvas
     */
    draw () {
        this.createCanvas()

        const scale = +inputs.scale.value
        const funcToRun = document.getElementById('algoSelect').value
        
        /**
         * When changing the formula, it is important to change it both in the moveTo function and
         * in the for-loop. When changing it in the moveTo function, replace the `i` variable with 
         * `this.min` to make it move to the correct point before drawing the pattern.
         */
        this.ctx.moveTo(
            this.centerX + this[`${funcToRun}Cos`](this.min, scale), 
            this.centerY + this[`${funcToRun}Sin`](this.min, scale)
        )

        this.ctx.strokeStyle = '#222'

        for (let i = this.min; i < this.max; i+=this.step) {
            // calculate x value:
            var newX = this.centerX + this[`${funcToRun}Cos`](i, scale)
            // calculate y value
            var newY = this.centerY + this[`${funcToRun}Sin`](i, scale)
            //console.log(newX, newY)
            this.ctx.lineTo(newX, newY)
        }
        this.ctx.stroke()
    }

    theodorusCos (theta, scale) {
        const it = Math.PI * this.max / this.centerX
        return scale * Math.sqrt(theta) * Math.cos(theta * it)
    }

    theodorusSin (theta, scale) {
        const it = Math.PI * this.max / this.centerX
        return scale * Math.sqrt(theta) * Math.sin(theta * it)
    }

    fermatCos (theta, scale) {
        const it = Math.PI * this.max / this.centerX
        const t = it * theta
        return (A * Math.sqrt(t)) * Math.cos(t) / scale
    }

    fermatSin (theta, scale) {
        const it = Math.PI * this.max / this.centerX
        const t = it * theta
        return (A * Math.sqrt(t)) * Math.sin(t) / scale
    }

    archimedean1Cos (theta, scale) {
        const it = Math.PI * this.max / this.centerX
        const t = theta * it
        const r = A + (.1 * t)
        return r * Math.cos(t) / scale
    }

    archimedean1Sin (theta, scale) {
        const it = Math.PI * this.max / this.centerX
        const t = theta * it
        const r = A + (.1 * t)
        return r * Math.sin(t) / scale
    }

    atzemaCos (theta, scale) {
        const sint = Math.sin(theta)
        return (sint / theta) - (2 * Math.cos(theta)) - (theta * sint) / scale
    }

    atzemaSin (theta, scale) {
        const cost = Math.cos(theta)
        return (-Math.cos(theta) / theta) - (2 * Math.sin(theta)) + (theta * cost) / scale
    }

    sacksCos (theta, scale) {
        const sqi = Math.sqrt(theta)
        return A * -Math.cos(sqi * (Math.PI * 2)) * sqi
    }

    sacksSin (theta, scale) {
        const sqi = Math.sqrt(theta)
        return A * Math.sin(sqi * (Math.PI * 2)) * sqi
    }

    /**
     * Helper function to get a random integer between two numbers
     * 
     * @param {number} min 
     * @param {number} max
     * @returns {number} 
     */
    getRandomInt (min, max) {
        min = Math.ceil(min)
        max = Math.floor(max)
        return Math.floor(Math.random() * (max - min + 1)) + min
    }
}

///

/**
 * Takes in two genomes and makes a new genome that is the combination
 * of both. Like a parents -> child relationship
 * 
 * @param {Genome} parent1 
 * @param {Genome} parent2 
 * @param {Genome} childIndex 
 * @returns {Genome}
 */
const crossOver = (parent1, parent2, childIndex) => {
    const child = new Genome(childIndex)
    child.min = parent1.min
    child.max = parent2.max
    child.step = Math.random() < .5 ? parent1.step : parent2.step

    return child
}

/**
 * Adds mutation to the genome to tweak the parameters to create different patterns. 
 * @param {Genome} genome 
 */
const mutation = genome => {
    const traits = ['min', 'max', 'step']
    for (let trait of traits) {
        if (Math.random() < +inputs.mutationChance.value) {
            genome[trait] = genome[trait] + genome.getRandomInt(1, (Math.random() < .5 ? -inputs.mutationRate.value : +inputs.mutationRate.value))
            if (genome[trait] < 1) {
                genome[trait] = 1
            }
            if (genome[trait] > 1000) {
                genome[trait] = 1000
            }
        }
    }
}

/**
 * Evaluates the current population and creates a new one based
 * on this one. 
 */
const evaluatePopulation = _ => {
    // Handle input
    const inputs = {
        baseMin: +document.getElementById('baseMin').value,
        baseMax: +document.getElementById('baseMax').value,
        baseStep: +document.getElementById('baseStep').value
    }

    // If user typed in starting values for a pattern
    if (inputs.baseMin && inputs.baseMax && inputs.baseStep) {
        const modPopulation = []
        for (let i = 0; i < POPULATION_SIZE; i++) {
            const gen = new Genome(i)
            gen.min = inputs.baseMin
            gen.max = inputs.baseMax
            gen.step = inputs.baseStep
            gen.score = 2
            modPopulation.push(gen)
        }

        population = modPopulation

        document.getElementById('baseMin').value = ''
        document.getElementById('baseMax').value = ''
        document.getElementById('baseStep').value = ''
    }

    const newPopulation = []
    
    // Add the "survival of the fittest" list
    const popPool = []
    for (let i = 0; i < population.length; i++) {
        const genome = population[i]
        popPool.push(...Array(genome.score).fill(i))
    }

    // If no genomes was selected, simply start all over again
    if (!popPool.length) {
        population = Array(POPULATION_SIZE).fill(1).map((x, index) => new Genome(index))
        nextGeneration()
        return
    }

    // Create new children for the next generation
    for (let genome of population) {
        const partner = population[popPool[genome.getRandomInt(0, popPool.length - 1)]]
        const child = crossOver(genome, partner, newPopulation.length)
        mutation(child)
        newPopulation.push(child)
    }

    population = newPopulation
    nextGeneration()
}

const createDefaultSpiral = _ => {
    document.getElementById('baseMin').value = '1'
    document.getElementById('baseMax').value = '700'
    document.getElementById('baseStep').value = '1'
    evaluatePopulation()
}

/**
 * Prints out the next generation 
 */
const nextGeneration = _ => {
    document.getElementById('canvasContainer').innerHTML = ''
    population.forEach((g, i) => setTimeout(_ => g.draw(), i * 50))
}

const init = () => {
    inputs.mutationChance = document.getElementById('mutationChance')
    inputs.mutationRate = document.getElementById('mutationRate')
    inputs.scale = document.getElementById('scale')

    inputs.mutationChance.value = MUTATION_CHANCE
    inputs.mutationRate.value = MUTATION_RATE
    inputs.scale.value = SCALE

    nextgenBtn.addEventListener('click', evaluatePopulation)
    showSpiral.addEventListener('click', createDefaultSpiral)

    population = Array(POPULATION_SIZE).fill(1).map((x, index) => new Genome(index))
    nextGeneration()
}

window.addEventListener('DOMContentLoaded', init)