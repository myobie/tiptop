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
const stopButton = document.getElementById('stop-button')

volumeField.addEventListener('change', event => { volume = volumeField.value })
volume = volumeField.value

typeField.addEventListener('change', updateOscillatorType)
updateOscillatorType()

function createGithubURI () {
  let user = userField.value
  if (user === '') { user = 'myobie' }

  let repo = repoField.value
  if (repo === '') { repo = 'tiptop' }

  return `https://api.github.com/repos/${user}/${repo}/events?per_page=100`
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

const typeAdjustments = {
  CommitCommentEvent: note => note,
  CreateEvent: note => note,
  DeleteEvent: note => note,
  DeploymentEvent: note => note,
  DeploymentStatusEvent: note => note,
  DownloadEvent: note => note,
  FollowEvent: note => note,
  ForkEvent: ([frequency, duration], event) => {
    frequency = Math.floor(frequency * event.bias / 100.0) + 200
    return [frequency, duration]
  },
  ForkApplyEvent: note => note,
  GistEvent: note => note,
  GollumEvent: note => note,
  IssueCommentEvent: ([frequency, duration], event) => {
    frequency = frequency + Math.floor(event.bias)
    return [frequency, duration]
  },
  IssuesEvent: note => note,
  MemberEvent: note => note,
  MembershipEvent: note => note,
  PageBuildEvent: note => note,
  PublicEvent: note => note,
  PullRequestEvent: note => note,
  PullRequestReviewCommentEvent: ([frequency, duration], event) => {
    duration *= event.bias / 50.0
    return [frequency, duration]
  },
  PushEvent: note => note,
  ReleaseEvent: note => note,
  RepositoryEvent: note => note,
  StatusEvent: note => note,
  TeamAddEvent: note => note,
  WatchEvent: ([frequency, duration], event) => {
    if (event.payload.action === 'started') {
      duration += event.bias / 100.0
    }
    return [frequency, duration]
  }
}

const silence = [0, 0.5]

function parseNote (event) {
  let [frequency, duration] = types[event.type] || silence

  // general adjustments

  const actorId = event.actor.id
  const actorIdString = actorId.toString()
  const bias = (actorIdString.length * 5) + parseInt(actorIdString.substr(actorIdString.length - 3, 2), 10)
  event.bias = bias

  if (actorId < 1000) {
    frequency -= bias
    duration += 0.2
  } else if (actorId > 500000) {
    frequency += bias
  }

  // type specific adjustments

  const adjustment = typeAdjustments[event.type] || (note => { return note })

  return adjustment([frequency, duration], event)
}

function parseNotes (json) {
  console.dir(json)
  return json.map(parseNote)
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
    writeNote(...info, prevEnd)

    const duration = info[1]
    return prevEnd + duration
  }, now)
}

function stop () {
  return new Promise((resolve, reject) => {
    const now = context.currentTime
    amp.gain.cancelScheduledValues(now)
    amp.gain.setValueAtTime(now, volume)
    amp.gain.linearRampToValueAtTime(0, now + 3.0)

    setTimeout(() => {
      const now = context.currentTime
      oscillator.frequency.cancelScheduledValues(now)
      amp.gain.cancelScheduledValues(now)
      resolve()
    }, 3100)
  })
}

playButton.addEventListener('click', event => {
  playButton.disabled = true
  stopButton.disabled = false
  context.suspend()
    .then(fetchEvents)
    .then(response => response.json())
    .then(parseNotes)
    .then(writeSong)
    .then(() => context.resume())
    .then(() => console.log('should be playing'))
})

stopButton.addEventListener('click', event => {
  stopButton.disabled = true
  stop()
    .then(() => console.log('should not be playing'))
    .then(() => context.suspend())
    .then(() => { playButton.disabled = false })
})
stopButton.disabled = true

const repoRegexp = /^([\w-]+) ?\/ ?([\w-]+)$/

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

context.suspend() // start out not playing
