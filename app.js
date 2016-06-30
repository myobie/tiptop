const Context = window.AudioContext || window.webkitAudioContext || window.mozAudioContext
const context = new Context()

const oscillator = context.createOscillator()

const amp = context.createGain()
amp.gain.value = 0

let volume = 0

oscillator.connect(amp)
amp.connect(context.destination)
oscillator.start(0)

function updateNoteFrequency () {
  const frequency = frequencyField.value
  const now = context.currentTime
  oscillator.frequency.setValueAtTime(frequency, now)
}

function fadeIn () {
  const now = context.currentTime
  amp.gain.setValueAtTime(amp.gain.value, now)
  amp.gain.linearRampToValueAtTime(volume, context.currentTime + 0.1)
}

function fadeOut () {
  const now = context.currentTime
  amp.gain.setValueAtTime(amp.gain.value, now)
  amp.gain.linearRampToValueAtTime(0, context.currentTime + 0.1)
}

function down () {
  updateNoteFrequency()
  fadeIn()
}

function up () {
  fadeOut()
}

function updateOscillatorType () {
  oscillator.type = typeField.value
}

const frequencyField = document.getElementById('frequency-field')
const volumeField = document.getElementById('volume-field')
const typeField = document.getElementById('oscillator-type')
const playButton = document.getElementById('play-button')

volumeField.addEventListener('change', event => { volume = volumeField.value })
volume = volumeField.value

typeField.addEventListener('change', updateOscillatorType)
updateOscillatorType()
updateNoteFrequency()

playButton.addEventListener('click', event => {
  down()
  setTimeout(up, 1000)
})
