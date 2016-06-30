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

const userField = document.getElementById('user')
const repoField = document.getElementById('repo')
const volumeField = document.getElementById('volume-field')
const typeField = document.getElementById('oscillator-type')
const playButton = document.getElementById('play-button')

volumeField.addEventListener('change', event => { volume = volumeField.value })
volume = volumeField.value

typeField.addEventListener('change', updateOscillatorType)
updateOscillatorType()

function createGithubURI () {
  let user = userField.value
  if (user === '') { user = 'myobie' }

  let repo = repoField.value
  if (repo === '') { repo = 'tiptop' }

  return `https://api.github.com/repos/${user}/${repo}/events`
}

function fetchEvents () {
  let uri = createGithubURI()

  return window.fetch(uri, { headers: { 'Accept': 'application/json' } })
}

const types = {
  CommitCommentEvent: [1000, 0.3],
  CreateEvent: [200, 1],
  DeleteEvent: [300, 0.8],
  DeploymentEvent: [1200, 0.5],
  DeploymentStatusEvent: [900, 0.3],
  DownloadEvent: [700, 0.5],
  FollowEvent: [600, 0.4],
  ForkEvent: [800, 0.3],
  ForkApplyEvent: [1000, 0.9],
  GistEvent: [1000, 0.2],
  GollumEvent: [1000, 0.2],
  IssueCommentEvent: [700, 0.4],
  IssuesEvent: [900, 0.25],
  MemberEvent: [300, 3],
  MembershipEvent: [300, 2],
  PageBuildEvent: [1000, 0.1],
  PublicEvent: [200, 8],
  PullRequestEvent: [600, 0.8],
  PullRequestReviewCommentEvent: [650, 0.2],
  PushEvent: [400, 0.5],
  ReleaseEvent: [1000, 0.2],
  RepositoryEvent: [300, 4],
  StatusEvent: [950, 0.2],
  TeamAddEvent: [700, 0.25],
  WatchEvent: [600, 0.4]
}

const silence = [0, 0.5]

function parseNotes (json) {
  console.dir(json)
  return json.map(event => types[event.type] || silence)
}

function writeNote (frequency, duration, start) {
  const end = start + duration

  oscillator.frequency.setValueAtTime(frequency, start)
  amp.gain.setValueAtTime(0, start)
  amp.gain.linearRampToValueAtTime(volume, start + 0.1)
  amp.gain.setValueAtTime(volume, end - 0.1)
  amp.gain.linearRampToValueAtTime(0, end)
}

function writeSong (notes) {
  console.dir(notes)

  const now = context.currentTime

  notes.reduce((prevEnd, info) => {
    console.log(...info, prevEnd)
    writeNote(...info, prevEnd)

    const duration = info[1]
    return prevEnd + duration
  }, now)
}

playButton.addEventListener('click', event => {
  context.suspend()
    .then(fetchEvents)
    .then(response => response.json())
    .then(parseNotes)
    .then(writeSong)
    .then(() => context.resume())
    .then(() => console.log('should be playing'))
})

const repoRegexp = /^(\w+) ?\/ ?(\w+)$/

userField.addEventListener('paste', event => {
  const data = event.clipboardData.getData('Text')
  const match = repoRegexp.exec(data)

  if (match) {
    event.preventDefault()
    userField.value = match[1]
    repoField.value = match[2]
    repoField.focus()
  }
})
