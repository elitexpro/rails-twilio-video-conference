const localVideoTrack = document.getElementById('localVideoTrack');
const login = document.getElementById('login');
const usernameInput = document.getElementById('username');
const joinLeaveButton = document.getElementById('joinOrLeaveRoom');
const localParticipant = document.getElementById('localParticipant');
const remoteParticipants = document.getElementById('remoteParticipants');

let connected = false;
let room;

async function addLocalVideo() {
  const videoTrack = await Twilio.Video.createLocalVideoTrack();
  const trackElement = videoTrack.attach();
  localVideoTrack.appendChild(trackElement);
};

async function connectOrDisconnect(event) {
  event.preventDefault();
  if (!connected) {
    const username = usernameInput.value;
    joinLeaveButton.disabled = true;
    joinLeaveButton.innerHTML = 'Connecting...';

    try {
      await connect(username);
    } catch (error) {
      console.log(error);
      alert('Failed to connect to video room.');
      joinLeaveButton.innerHTML = 'Join Video Call';
      joinLeaveButton.disabled = false;
    }
  }
  else {
    disconnect();
  }
};

async function connect(username) {
  const response = await fetch('/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({'username': username})
  });

  const data = await response.json();
  room = await Twilio.Video.connect(data.token);

  const identityDiv = document.createElement('div');
  identityDiv.setAttribute('class', 'identity');
  identityDiv.innerHTML = username;
  localParticipant.appendChild(identityDiv);

  room.participants.forEach(participantConnected);
  room.on('participantConnected', participantConnected);
  room.on('participantDisconnected', participantDisconnected);
  connected = true;

  joinLeaveButton.innerHTML = 'Leave Video Call';
  joinLeaveButton.disabled = false;
  usernameInput.style.display = 'none';
};

function disconnect() {
  room.disconnect();

  let removeParticipants = remoteParticipants.getElementsByClassName('participant');

  while (removeParticipants[0]) {
    remoteParticipants.removeChild(removeParticipants[0]);
  }

  joinLeaveButton.innerHTML = 'Join Video Call';
  connected = false;
  usernameInput.style.display = 'inline-block';
  localParticipant.removeChild(localParticipant.lastElementChild);
};

function participantConnected(participant) {
  const participantDiv = document.createElement('div');
  participantDiv.setAttribute('id', participant.sid);
  participantDiv.setAttribute('class', 'participant');

  const tracksDiv = document.createElement('div');
  participantDiv.appendChild(tracksDiv);

  const identityDiv = document.createElement('div');
  identityDiv.setAttribute('class', 'identity');
  identityDiv.innerHTML = participant.identity;
  participantDiv.appendChild(identityDiv);

  remoteParticipants.appendChild(participantDiv);

  participant.tracks.forEach(publication => {
    if (publication.isSubscribed) {
      trackSubscribed(tracksDiv, publication.track);
    }
  });
  participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track));
  participant.on('trackUnsubscribed', trackUnsubscribed);
};

function participantDisconnected(participant) {
  document.getElementById(participant.sid).remove();
};

function trackSubscribed(div, track) {
  const trackElement = track.attach();
  div.appendChild(trackElement);
};

function trackUnsubscribed(track) {
  track.detach().forEach(element => {
    element.remove()
  });
};

addLocalVideo();
login.addEventListener('submit', connectOrDisconnect);