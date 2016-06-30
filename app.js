const Context = window.AudioContext || window.webkitAudioContext || window.mozAudioContext
const context = new Context()

const oscillator = context.createOscillator()
oscillator.frequency.value = 440

const amp = context.createGain()
amp.gain.value = 0

oscillator.connect(amp)
amp.connect(context.destination)
oscillator.start(0)

function down (frequency) {
  const now = context.currentTime
  oscillator.frequency.setValueAtTime(frequency, now)
  amp.gain.cancelScheduledValues(now)
  amp.gain.setValueAtTime(amp.gain.value, now)
  amp.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.1)
}

function up () {
  const now = context.currentTime
  amp.gain.cancelScheduledValues(now)
  amp.gain.setValueAtTime(amp.gain.value, now)
  amp.gain.linearRampToValueAtTime(0, context.currentTime + 0.1)
}

const playButton = document.getElementById('play-button')
const frequencyField = document.getElementById('frequency-field')

playButton.addEventListener('click', event => {
  down(frequencyField.value)
  setTimeout(up, 1000)
})
