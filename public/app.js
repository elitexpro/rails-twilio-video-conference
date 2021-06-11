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
  let trackElement = videoTrack.attach();
  localVideoTrack.appendChild(trackElement);
};

async function connectOrDisconnect(event) {
  event.preventDefault();
  if (!connected) {
    let username = usernameInput.value;
    if (!username) {
      alert('Please enter your name before connecting to the video room');
      return;
    }
    joinLeaveButton.disabled = true;
    joinLeaveButton.innerHTML = 'Connecting...';

    try {
      connect(username);
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
  room = await Twilio.Video.connect(data.token, {room: 'my-video-room'});

  let identityDiv = document.createElement('div');
  identityDiv.setAttribute('class', 'identity');
  identityDiv.innerHTML = username;
  localParticipant.appendChild(identityDiv);

  room.participants.forEach(participantConnected);
  room.on('participantConnected', participantConnected);
  room.on('participantDisconnected', participantDisconnected);
  connected = true;

  joinLeaveButton.innerHTML = 'Leave Video Call';
  joinLeaveButton.disabled = false;
  login.style.display = 'none';
};

function disconnect() {
  room.disconnect();

  let removeParticipants = remoteParticipants.getElementsByClassName('participant');

  while (removeParticipants[0]) {
    remoteParticipants.removeChild(removeParticipants[0]);
  }

  joinLeaveButton.innerHTML = 'Join Video Call';
  connected = false;
  login.style.display = 'inline-block';
  localParticipant.removeChild(localParticipant.lastElementChild);
};

function participantConnected(participant) {
  let participantDiv = document.createElement('div');
  participantDiv.setAttribute('id', participant.sid);
  participantDiv.setAttribute('class', 'participant');

  let tracksDiv = document.createElement('div');
  participantDiv.appendChild(tracksDiv);

  let identityDiv = document.createElement('div');
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
  let trackElement = track.attach();
  div.appendChild(trackElement);
};

function trackUnsubscribed(track) {
  track.detach().forEach(element => {
    element.remove()
  });
};

addLocalVideo();
joinLeaveButton.addEventListener('click', connectOrDisconnect);