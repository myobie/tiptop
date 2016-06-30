const Context = window.AudioContext || window.webkitAudioContext || window.mozAudioContext
const context = new Context()

const oscillator = context.createOscillator()
oscillator.frequency.value = 440

const amp = context.createGain()
amp.gain.value = 0

let volume = 0

oscillator.connect(amp)
amp.connect(context.destination)
oscillator.start(0)

function updateOscillatorType () {
  oscillator.type = typeField.value
}

const volumeField = document.getElementById('volume-field')
const typeField = document.getElementById('oscillator-type')
const playButton = document.getElementById('play-button')

volumeField.addEventListener('change', event => { volume = volumeField.value })
volume = volumeField.value

typeField.addEventListener('change', updateOscillatorType)
updateOscillatorType()

function writeNote (frequency, duration, start) {
  const end = start + duration

  oscillator.frequency.setValueAtTime(frequency, start)
  amp.gain.setValueAtTime(0, start)
  amp.gain.linearRampToValueAtTime(volume, start + 0.1)
  amp.gain.setValueAtTime(volume, end - 0.1)
  amp.gain.linearRampToValueAtTime(0, end)
}

const notes = [
  [400, 0.5],
  [600, 0.5],
  [400, 1],
  [600, 1],
  [400, 1.5],
  [600, 1.5],
  [400, 0.3],
  [600, 0.3],
  [400, 0.3],
  [600, 0.3],
  [400, 0.3],
  [600, 2],
  [400, 1],
  [600, 0.5]
]

function writeSong () {
  const now = context.currentTime

  notes.reduce((prevEnd, info) => {
    console.log(...info, prevEnd)
    writeNote(...info, prevEnd)

    const duration = info[1]
    return prevEnd + duration
  }, now)

  return Promise.resolve(true)
}

playButton.addEventListener('click', event => {
  context.suspend()
    .then(() => writeSong())
    .then(() => context.resume())
    .then(() => console.log('should be playing'))
})
