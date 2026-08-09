const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// 1. The Team Data
const teams = {
  "Madrid": ["Courtois", "Carvajal", "Militao", "Alaba", "Mendy", "Valverde", "Tchouameni", "Kroos", "Rodrygo", "Benzema", "Vinicius Jr"],
  "Manchester City": ["Ederson", "Walker", "Dias", "Akanji", "Ake", "Rodri", "De Bruyne", "Gundogan", "Silva", "Haaland", "Grealish"],
  "Barcelona": ["Ter Stegen", "Kounde", "Araujo", "Christensen", "Balde", "De Jong", "Pedri", "Gavi", "Raphinha", "Lewandowski", "Yamal"],
  "Manchester United": ["Onana", "Dalot", "Varane", "Martinez", "Shaw", "Casemiro", "Mainoo", "Fernandes", "Garnacho", "Hojlund", "Rashford"],
  "Bayern Munich": ["Neuer", "Kimmich", "Upamecano", "Kim", "Davies", "Goretzka", "Pavlovic", "Musiala", "Sane", "Kane", "Coman"],
  "Arsenal": ["Raya", "White", "Saliba", "Gabriel", "Zinchenko", "Rice", "Odegaard", "Havertz", "Saka", "Trossard", "Martinelli"],
  "Liverpool": ["Alisson", "Alexander-Arnold", "Konate", "Van Dijk", "Robertson", "Mac Allister", "Szoboszlai", "Endo", "Salah", "Nunez", "Diaz"],
  "Paris SG": ["Donnarumma", "Hakimi", "Marquinhos", "Skriniar", "Hernandez", "Ugarte", "Zaire-Emery", "Vitinha", "Dembele", "Ramos", "Mbappe"]
};

// 2. The 1-to-1 Tactical Matrix
function simulateMatch(teamATactics, teamBTactics) {
  let scoreA = 0;
  let scoreB = 0;

  for (let i = 0; i < 11; i++) {
    const a = teamATactics[i];
    const b = teamBTactics[i];

    if (a === b) continue; // Draw

    if (
      (a === 'Aggressive' && b === 'Neutral') ||
      (a === 'Marking' && b === 'Aggressive') ||
      (a === 'Link' && b === 'Marking') ||
      (a === 'Neutral' && b === 'Link')
    ) {
      scoreA++;
    } else {
      scoreB++;
    }
  }

  return { scoreA, scoreB };
}

// 3. Server State & Communication
let player1Tactics = null;
let player2Tactics = null;

io.on('connection', (socket) => {
  // Send the available teams to the frontend immediately
  socket.emit('loadTeams', teams);

  socket.on('tacticsLocked', (tactics) => {
    if (!player1Tactics) {
      player1Tactics = tactics;
    } else {
      player2Tactics = tactics;
      
      // Both are ready, simulate the match!
      const result = simulateMatch(player1Tactics, player2Tactics);
      io.emit('matchResult', result);
      
      // Reset for the next match
      player1Tactics = null;
      player2Tactics = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server listening on port ${PORT}`));