const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// Data Structure with Foot & X/Y Coords for visual mapping
const teams = {
  "Madrid": [
    { name: "Courtois", pos: "GK", rating: 90, x: 50, y: 95 },
    { name: "Carvajal", pos: "DEF", rating: 84, foot: 'R', x: 20, y: 80 }, { name: "Militao", pos: "DEF", rating: 86, foot: 'R', x: 40, y: 80 }, { name: "Alaba", pos: "DEF", rating: 85, foot: 'L', x: 60, y: 80 }, { name: "Mendy", pos: "DEF", rating: 83, foot: 'L', x: 80, y: 80 },
    { name: "Valverde", pos: "MID", rating: 88, foot: 'R', x: 30, y: 50 }, { name: "Tchouameni", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Kroos", pos: "MID", rating: 89, foot: 'R', x: 70, y: 50 },
    { name: "Rodrygo", pos: "ATT", rating: 85, foot: 'R', x: 30, y: 20 }, { name: "Benzema", pos: "ATT", rating: 91, foot: 'R', x: 50, y: 20 }, { name: "Vinicius Jr", pos: "ATT", rating: 92, h2h_edge: 2, foot: 'R', x: 70, y: 20 }
  ],
  "Barcelona": [
    { name: "Ter Stegen", pos: "GK", rating: 89, x: 50, y: 5 },
    { name: "Kounde", pos: "DEF", rating: 85, h2h_edge: -1, foot: 'R', x: 20, y: 20 }, { name: "Araujo", pos: "DEF", rating: 87, foot: 'R', x: 40, y: 20 }, { name: "Christensen", pos: "DEF", rating: 83, foot: 'R', x: 60, y: 20 }, { name: "Balde", pos: "DEF", rating: 82, foot: 'L', x: 80, y: 20 },
    { name: "De Jong", pos: "MID", rating: 87, foot: 'R', x: 30, y: 50 }, { name: "Pedri", pos: "MID", rating: 86, foot: 'R', x: 50, y: 50 }, { name: "Gavi", pos: "MID", rating: 84, foot: 'R', x: 70, y: 50 },
    { name: "Raphinha", pos: "ATT", rating: 84, foot: 'L', x: 30, y: 80 }, { name: "Lewandowski", pos: "ATT", rating: 90, foot: 'R', x: 50, y: 80 }, { name: "Yamal", pos: "ATT", rating: 83, foot: 'L', x: 70, y: 80 }
  ]
};

// Match Engine Handling Shooters, GK Logic, and Visual Logs
function simulateMatch(teamA, tacticsA, nameA, teamB, tacticsB, nameB, shooterA, shooterB) {
  let scoreA = 0; let scoreB = 0;
  let matchLog = [];
  let visualEvents = []; 

  let possession = 'A'; 
  const totalPossessions = 15; 

  const getZoneIndices = (zone, isAttacking) => {
    if (zone === 0) return isAttacking ? [1,2,3,4] : [8,9,10]; 
    if (zone === 1) return [5,6,7]; 
    if (zone === 2) return isAttacking ? [8,9,10] : [1,2,3,4]; 
  };

  matchLog.push("KICK OFF!");

  for (let turn = 0; turn < totalPossessions; turn++) {
    let connections = 0; let currentZone = 0; 
    let lastPlayer = null;
    let currentAttackingTeam = possession === 'A' ? nameA : nameB;
    matchLog.push(`\n▶ ${currentAttackingTeam} starts possession...`);

    while (connections < 5) {
      const attIndices = getZoneIndices(currentZone, true);
      const defIndices = getZoneIndices(currentZone, false);
      const attIdx = attIndices[Math.floor(Math.random() * attIndices.length)];
      const defIdx = defIndices[Math.floor(Math.random() * defIndices.length)];

      const attTactic = possession === 'A' ? tacticsA[attIdx] : tacticsB[attIdx];
      const defTactic = possession === 'A' ? tacticsB[defIdx] : tacticsA[defIdx];
      const attPlayer = possession === 'A' ? teamA[attIdx] : teamB[attIdx];
      const defPlayer = possession === 'A' ? teamB[defIdx] : teamA[defIdx];

      // Logic check for pass success
      let passSuccess = false;
      if (attTactic === 'Aggressive' && defTactic === 'Neutral') passSuccess = true;
      else if (attTactic === 'Link' && defTactic === 'Marking') passSuccess = true;
      else if (attTactic === defTactic) {
          const attScore = attPlayer.rating + (attPlayer.h2h_edge || 0);
          const defScore = defPlayer.rating + (defPlayer.h2h_edge || 0);
          passSuccess = attScore >= defScore;
      }
      
      // Auto fail for aggressive vs marking
      if (attTactic === 'Aggressive' && defTactic === 'Marking') passSuccess = false;

      // Track line coordinates for the frontend visual pitch
      if (lastPlayer) {
        visualEvents.push({
          type: passSuccess ? 'success' : 'break',
          x1: lastPlayer.x, y1: possession === 'A' ? lastPlayer.y : 100 - lastPlayer.y,
          x2: attPlayer.x, y2: possession === 'A' ? attPlayer.y : 100 - attPlayer.y,
          color: possession === 'A' ? '#00ff00' : '#0088ff' 
        });
      }
      lastPlayer = attPlayer;

      if (passSuccess) {
        connections += (attTactic === 'Aggressive' ? 2 : 1);
        currentZone = Math.min(2, currentZone + 1);
        matchLog.push(`✔️ ${attPlayer.name} connects... (${connections}/5)`);
        
        if (connections >= 5) {
          // Trigger the shot mechanic
          const shooterName = possession === 'A' ? shooterA : shooterB;
          const attackingTeam = possession === 'A' ? teamA : teamB;
          const defendingTactics = possession === 'A' ? tacticsB : tacticsA;
          
          const shooterObj = attackingTeam.find(p => p.name === shooterName) || attPlayer;
          const gkFocus = defendingTactics[0].replace('Focus ', ''); 
          const shotSide = shooterObj.foot === 'L' ? 'Left' : 'Right';

          if (shotSide === gkFocus) {
             matchLog.push(`🧤 CHANCE CANCELLED! GK guessed ${shotSide} correctly and stopped ${shooterObj.name}!`);
          } else {
             possession === 'A' ? scoreA++ : scoreB++;
             matchLog.push(`⚽ GOAL!!! ${shooterObj.name} shoots ${shotSide}, GK guessed wrong!`);
          }
          break; 
        }
      } else {
        matchLog.push(`❌ Turnover by ${attPlayer.name}.`);
        possession = possession === 'A' ? 'B' : 'A';
        break; 
      }
    }
  }
  return { scoreA, scoreB, nameA, nameB, matchLog, visualEvents, teamA, teamB };
}

let p1 = null; 
let p2 = null;

io.on('connection', (socket) => {
  const teamNames = Object.keys(teams).reduce((acc, key) => {
    acc[key] = teams[key].map(p => p.name);
    return acc;
  }, {});
  
  socket.emit('loadTeams', teamNames);

  socket.on('tacticsLocked', (data) => {
    if (!p1) {
      p1 = data;
    } else {
      p2 = data;
      // Send both tactical arrays and shooter selections into the simulator
      const result = simulateMatch(
        teams[p1.teamName], p1.tactics, p1.teamName,
        teams[p2.teamName], p2.tactics, p2.teamName,
        p1.shooter, p2.shooter
      );
      io.emit('matchResult', result);
      p1 = null; p2 = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server listening on port ${PORT}`));