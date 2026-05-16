import React, { useState, useEffect, useRef } from 'react';
import * as sdk from 'matrix-js-sdk';

function App() {
  const [client, setClient] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [homeserver, setHomeserver] = useState('https://mtux.nl');

  useEffect(() => {
    if (client) {
      client.on('sync', (state, prevState, data) => {
        if (state === 'PREPARED') {
          setLoggedIn(true);
          loadRooms();
        }
      });

      client.on('Room.timeline', (event, room, toStartOfTimeline) => {
        if (toStartOfTimeline) return;
        if (room.roomId === currentRoom?.roomId) {
          setMessages(prev => [...prev, event]);
        }
      });

      client.startClient({ initialSyncLimit: 10 });
    }
  }, [client, currentRoom]);

  const login = async () => {
    const matrixClient = sdk.createClient({ baseUrl: homeserver });
    try {
      const response = await matrixClient.loginWithPassword(username, password);
      const authenticatedClient = sdk.createClient({
        baseUrl: homeserver,
        accessToken: response.access_token,
        userId: response.user_id,
      });
      setClient(authenticatedClient);
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const loadRooms = () => {
    const allRooms = client.getRooms();
    setRooms(allRooms);
  };

  const joinRoom = async (roomId) => {
    const room = client.getRoom(roomId);
    setCurrentRoom(room);
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();
    setMessages(events);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentRoom) return;
    await client.sendTextMessage(currentRoom.roomId, inputMessage);
    setInputMessage('');
  };

  if (!loggedIn) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <h1>Plusly Web</h1>
        <input
          type="text"
          placeholder="Homeserver (bijv. https://mtux.nl)"
          value={homeserver}
          onChange={(e) => setHomeserver(e.target.value)}
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <input
          type="text"
          placeholder="Gebruikersnaam"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <input
          type="password"
          placeholder="Wachtwoord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <button onClick={login} style={{ width: '100%', padding: '10px', backgroundColor: '#E60000', color: 'white', border: 'none', cursor: 'pointer' }}>
          Inloggen
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1A1A1A', color: 'white' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#242424', borderRight: '1px solid #333', padding: '10px' }}>
        <h2 style={{ color: '#E60000' }}>Plusly</h2>
        {rooms.map(room => (
          <div
            key={room.roomId}
            onClick={() => joinRoom(room.roomId)}
            style={{
              padding: '10px',
              cursor: 'pointer',
              backgroundColor: currentRoom?.roomId === room.roomId ? '#E60000' : 'transparent',
              borderRadius: '8px',
              marginBottom: '5px'
            }}
          >
            {room.name || room.roomId}
          </div>
        ))}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #333', backgroundColor: '#242424' }}>
          <h3>{currentRoom?.name || 'Selecteer een room'}</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {messages.map((event, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#242424', borderRadius: '8px' }}>
              <strong style={{ color: '#E60000' }}>{event.sender?.name || event.sender}:</strong>
              <div>{event.getContent().body}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '15px', borderTop: '1px solid #333', display: 'flex' }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Typ een bericht..."
            style={{ flex: 1, padding: '10px', backgroundColor: '#242424', color: 'white', border: '1px solid #333', borderRadius: '8px' }}
          />
          <button onClick={sendMessage} style={{ marginLeft: '10px', padding: '10px 20px', backgroundColor: '#E60000', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Verstuur
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;