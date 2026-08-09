const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

app.use(express.static('public'));

// AI Setup (Pulls the key you hid in Render)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

async function translateTactics(prompt) {
  if (!prompt || prompt.trim() === "") return Array(10).fill("Center");
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING, enum: ["Left", "Center", "Right"] }
        }
      }
    });
    const result = await model.generateContent(
      "You are a football tactician mapping instructions to a grid. Translate the user's tactical instruction into an array of exactly 10 strings representing the lane assignments for their 10 outfield players. Choose ONLY from 'Left', 'Center', or 'Right'.\nUser input: " + prompt
    );
    let arr = JSON.parse(result.response.text());
    while (arr.length < 10) arr.push("Center");
    return arr.slice(0, 10);
  } catch (err) {
    console.error("AI Error:", err);
    return Array(10).fill("Center");
  }
}

// 16 Balanced UCL Teams (All outfield players flat 85 rating)
const teams = {
  "Real Madrid": [
    { name: "Courtois", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Carvajal", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Rudiger", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Alaba", pos: "DEF", rating: 85, foot: 'L', x: 60, y: 80 }, { name: "Mendy", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "Valverde", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Tchouameni", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Kroos", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Rodrygo", pos: "ATT", rating: 85, foot: 'R', x: 30, y: 20 }, { name: "Bellingham", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Vinicius Jr", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Barcelona": [
    { name: "Ter Stegen", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Kounde", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Araujo", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Christensen", pos: "DEF", rating: 85, foot: 'R', x: 60, y: 80 }, { name: "Cancelo", pos: "DEF", rating: 85, foot: 'R', x: 80, y: 80 },
    { name: "De Jong", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Pedri", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Gundogan", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Raphinha", pos: "ATT", rating: 85, foot: 'L', x: 30, y: 20 }, { name: "Lewandowski", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Yamal", pos: "ATT", rating: 85, foot: 'L', x: 70, y: 20 }
  ],
  "Manchester City": [
    { name: "Ederson", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Walker", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Dias", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Akanji", pos: "DEF", rating: 85, foot: 'R', x: 60, y: 80 }, { name: "Gvardiol", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "Rodri", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "De Bruyne", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Silva", pos: "MID", rating: 85, foot: 'L', x: 70, y: 50 },
    { name: "Foden", pos: "ATT", rating: 85, foot: 'L', x: 30, y: 20 }, { name: "Haaland", pos: "ATT", rating: 85, foot: 'L', x: 50, y: 20 }, { name: "Doku", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Arsenal": [
    { name: "Raya", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "White", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Saliba", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Gabriel", pos: "DEF", rating: 85, foot: 'L', x: 60, y: 80 }, { name: "Zinchenko", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "Rice", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Odegaard", pos: "MID", rating: 85, foot: 'L', x: 50, y: 50 }, { name: "Havertz", pos: "MID", rating: 85, foot: 'L', x: 70, y: 50 },
    { name: "Saka", pos: "ATT", rating: 85, foot: 'L', x: 30, y: 20 }, { name: "Jesus", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Martinelli", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Liverpool": [
    { name: "Alisson", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Alexander-Arnold", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Konate", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Van Dijk", pos: "DEF", rating: 85, foot: 'R', x: 60, y: 80 }, { name: "Robertson", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "Mac Allister", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Szoboszlai", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Endo", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Salah", pos: "ATT", rating: 85, foot: 'L', x: 30, y: 20 }, { name: "Nunez", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Diaz", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Manchester United": [
    { name: "Onana", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Dalot", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Varane", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Martinez", pos: "DEF", rating: 85, foot: 'L', x: 60, y: 80 }, { name: "Shaw", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "Casemiro", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Mainoo", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Fernandes", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Garnacho", pos: "ATT", rating: 85, foot: 'R', x: 30, y: 20 }, { name: "Hojlund", pos: "ATT", rating: 85, foot: 'L', x: 50, y: 20 }, { name: "Rashford", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Bayern Munich": [
    { name: "Neuer", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Kimmich", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "De Ligt", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Kim", pos: "DEF", rating: 85, foot: 'R', x: 60, y: 80 }, { name: "Davies", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "Goretzka", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Pavlovic", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Musiala", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Sane", pos: "ATT", rating: 85, foot: 'L', x: 30, y: 20 }, { name: "Kane", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Coman", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Bayer Leverkusen": [
    { name: "Hradecky", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Kossounou", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Tah", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Tapsoba", pos: "DEF", rating: 85, foot: 'R', x: 60, y: 80 }, { name: "Frimpong", pos: "DEF", rating: 85, foot: 'R', x: 80, y: 80 },
    { name: "Xhaka", pos: "MID", rating: 85, foot: 'L', x: 30, y: 50 }, { name: "Palacios", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Grimaldo", pos: "MID", rating: 85, foot: 'L', x: 70, y: 50 },
    { name: "Hofmann", pos: "ATT", rating: 85, foot: 'R', x: 30, y: 20 }, { name: "Boniface", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Wirtz", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Paris SG": [
    { name: "Donnarumma", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Hakimi", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Marquinhos", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Hernandez", pos: "DEF", rating: 85, foot: 'L', x: 60, y: 80 }, { name: "Mendes", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "Ugarte", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Zaire-Emery", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Vitinha", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Dembele", pos: "ATT", rating: 85, foot: 'R', x: 30, y: 20 }, { name: "Mbappe", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Barcola", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Inter Milan": [
    { name: "Sommer", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Pavard", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Acerbi", pos: "DEF", rating: 85, foot: 'L', x: 40, y: 80 }, { name: "Bastoni", pos: "DEF", rating: 85, foot: 'L', x: 60, y: 80 }, { name: "Dumfries", pos: "DEF", rating: 85, foot: 'R', x: 80, y: 80 },
    { name: "Barella", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Calhanoglu", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Mkhitaryan", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Dimarco", pos: "ATT", rating: 85, foot: 'L', x: 30, y: 20 }, { name: "Thuram", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Martinez", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "AC Milan": [
    { name: "Maignan", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Calabria", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Tomori", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Thiaw", pos: "DEF", rating: 85, foot: 'R', x: 60, y: 80 }, { name: "Hernandez", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "Bennacer", pos: "MID", rating: 85, foot: 'L', x: 30, y: 50 }, { name: "Reijnders", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Loftus-Cheek", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Pulisic", pos: "ATT", rating: 85, foot: 'R', x: 30, y: 20 }, { name: "Giroud", pos: "ATT", rating: 85, foot: 'L', x: 50, y: 20 }, { name: "Leao", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Juventus": [
    { name: "Szczesny", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Gatti", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Bremer", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Danilo", pos: "DEF", rating: 85, foot: 'R', x: 60, y: 80 }, { name: "Cambiaso", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "McKennie", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Locatelli", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Rabiot", pos: "MID", rating: 85, foot: 'L', x: 70, y: 50 },
    { name: "Kostic", pos: "ATT", rating: 85, foot: 'L', x: 30, y: 20 }, { name: "Vlahovic", pos: "ATT", rating: 85, foot: 'L', x: 50, y: 20 }, { name: "Chiesa", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Atletico Madrid": [
    { name: "Oblak", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Molina", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Gimenez", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Hermoso", pos: "DEF", rating: 85, foot: 'L', x: 60, y: 80 }, { name: "Lino", pos: "DEF", rating: 85, foot: 'R', x: 80, y: 80 },
    { name: "De Paul", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Koke", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Llorente", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Griezmann", pos: "ATT", rating: 85, foot: 'L', x: 30, y: 20 }, { name: "Morata", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Correa", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Borussia Dortmund": [
    { name: "Kobel", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Ryerson", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Hummels", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Schlotterbeck", pos: "DEF", rating: 85, foot: 'L', x: 60, y: 80 }, { name: "Maatsen", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "Sabitzer", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Can", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Brandt", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Sancho", pos: "ATT", rating: 85, foot: 'R', x: 30, y: 20 }, { name: "Fullkrug", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Adeyemi", pos: "ATT", rating: 85, foot: 'L', x: 70, y: 20 }
  ],
  "Napoli": [
    { name: "Meret", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "Di Lorenzo", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Rrahmani", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Jesus", pos: "DEF", rating: 85, foot: 'L', x: 60, y: 80 }, { name: "Olivera", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "Anguissa", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Lobotka", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Zielinski", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Politano", pos: "ATT", rating: 85, foot: 'L', x: 30, y: 20 }, { name: "Osimhen", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Kvaratskhelia", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ],
  "Chelsea": [
    { name: "Sanchez", pos: "GK", rating: 85, x: 50, y: 95 },
    { name: "James", pos: "DEF", rating: 85, foot: 'R', x: 20, y: 80 }, { name: "Silva", pos: "DEF", rating: 85, foot: 'R', x: 40, y: 80 }, { name: "Colwill", pos: "DEF", rating: 85, foot: 'L', x: 60, y: 80 }, { name: "Chilwell", pos: "DEF", rating: 85, foot: 'L', x: 80, y: 80 },
    { name: "Caicedo", pos: "MID", rating: 85, foot: 'R', x: 30, y: 50 }, { name: "Fernandez", pos: "MID", rating: 85, foot: 'R', x: 50, y: 50 }, { name: "Gallagher", pos: "MID", rating: 85, foot: 'R', x: 70, y: 50 },
    { name: "Palmer", pos: "ATT", rating: 85, foot: 'L', x: 30, y: 20 }, { name: "Jackson", pos: "ATT", rating: 85, foot: 'R', x: 50, y: 20 }, { name: "Sterling", pos: "ATT", rating: 85, foot: 'R', x: 70, y: 20 }
  ]
};

// Global Match State
let activeMatch = {
  active: false, turn: 0, 
  scoreA: 0, scoreB: 0,
  p1: null, p2: null,
  possession: 'A',
  playstyleA: 'Balanced', playstyleB: 'Balanced',
  irritatedA: null, irritatedB: null
};

function getLaneCount(teamData, tacticsData, targetLane, irritatedName) {
  let count = 0;
  for (let i = 1; i <= 10; i++) {
    if (tacticsData[i] === targetLane && teamData[i].name !== irritatedName) {
      count++;
    }
  }
  return count;
}

function runPhase() {
  let matchLog = [];
  let visualEvents = [];
  let goalScored = false;
  let scorer = null;

  const teamA = teams[activeMatch.p1.teamName];
  const teamB = teams[activeMatch.p2.teamName];

  while (activeMatch.turn < 15 && !goalScored) {
    let connections = 0;
    let currentAttackingTeam = activeMatch.possession === 'A' ? activeMatch.p1.teamName : activeMatch.p2.teamName;
    matchLog.push(`\n▶ ${currentAttackingTeam} builds up...`);
    let lastPlayer = null;

    while (connections < 3) { // 3-Pass Rule
      const attIdx = Math.floor(Math.random() * 10) + 1; 
      const attTeam = activeMatch.possession === 'A' ? teamA : teamB;
      const defTeam = activeMatch.possession === 'A' ? teamB : teamA;
      const attTactics = activeMatch.possession === 'A' ? activeMatch.p1.tactics : activeMatch.p2.tactics;
      const defTactics = activeMatch.possession === 'A' ? activeMatch.p2.tactics : activeMatch.p1.tactics;

      const attPlayer = attTeam[attIdx];
      const attackLane = attTactics[attIdx];

      const irritatedAtt = activeMatch.possession === 'A' ? activeMatch.irritatedA : activeMatch.irritatedB;
      const irritatedDef = activeMatch.possession === 'A' ? activeMatch.irritatedB : activeMatch.irritatedA;

      let attCount = getLaneCount(attTeam, attTactics, attackLane, irritatedAtt);
      let defCount = getLaneCount(defTeam, defTactics, attackLane, irritatedDef);

      const playstyle = activeMatch.possession === 'A' ? activeMatch.playstyleA : activeMatch.playstyleB;
      if (playstyle === 'Focus Center' && attackLane === 'Center') attCount += 1.5;
      if (playstyle === 'Focus Wings' && (attackLane === 'Left' || attackLane === 'Right')) attCount += 1.5;

      const totalInvolved = attCount + defCount;
      const successRatio = totalInvolved === 0 ? 0.5 : (attCount / totalInvolved);
      const passSuccess = Math.random() < successRatio;

      if (lastPlayer) {
        visualEvents.push({
          type: passSuccess ? 'success' : 'break',
          x1: lastPlayer.x, y1: activeMatch.possession === 'A' ? lastPlayer.y : 100 - lastPlayer.y,
          x2: attPlayer.x, y2: activeMatch.possession === 'A' ? attPlayer.y : 100 - attPlayer.y,
          color: activeMatch.possession === 'A' ? '#00ff00' : '#0088ff' 
        });
      }
      lastPlayer = attPlayer;

      if (passSuccess) {
        connections++;
        matchLog.push(`✔️ ${attPlayer.name} pushes through the ${attackLane} lane... (${connections}/3)`);
        
        if (connections >= 3) {
          const shooterName = activeMatch.possession === 'A' ? activeMatch.p1.shooter : activeMatch.p2.shooter;
          const shooterObj = attTeam.find(p => p.name === shooterName) || attPlayer;
          const gkFocus = defTactics[0].replace('Focus ', ''); 
          const shotSide = shooterObj.foot === 'L' ? 'Left' : 'Right';

          if (shotSide === gkFocus) {
             matchLog.push(`🧤 SAVED! GK guessed ${shotSide} correctly and stopped ${shooterObj.name}!`);
          } else {
             if (activeMatch.possession === 'A') { activeMatch.scoreA++; scorer = 'A'; }
             else { activeMatch.scoreB++; scorer = 'B'; }
             matchLog.push(`⚽ GOAL!!! ${shooterObj.name} scores!`);
             goalScored = true;
          }
          break; 
        }
      } else {
        matchLog.push(`❌ The ${attackLane} lane is completely blocked. Turnover.`);
        activeMatch.possession = activeMatch.possession === 'A' ? 'B' : 'A';
        break; 
      }
    }
    activeMatch.turn++;
  }

  return { 
    log: matchLog, visualEvents, 
    scoreA: activeMatch.scoreA, scoreB: activeMatch.scoreB,
    nameA: activeMatch.p1.teamName, nameB: activeMatch.p2.teamName,
    teamA, teamB, finished: activeMatch.turn >= 15, scorer: scorer
  };
}

let p1DataRaw = null;
let p2DataRaw = null;

io.on('connection', (socket) => {
  const teamNames = Object.keys(teams).reduce((acc, key) => { acc[key] = teams[key].map(p => p.name); return acc; }, {});
  socket.emit('loadTeams', teamNames);

  socket.on('tacticsLocked', async (data) => {
    if (!p1DataRaw) {
      p1DataRaw = data;
    } else {
      p2DataRaw = data;
      io.emit('aiProcessing'); // Tell frontend to show loading text
      
      // Send both text prompts to Gemini AI simultaneously
      const [aiArr1, aiArr2] = await Promise.all([
        translateTactics(p1DataRaw.prompt),
        translateTactics(p2DataRaw.prompt)
      ]);

      // Map AI array (index 1-10) and prepend GK choice (index 0)
      activeMatch.p1 = { ...p1DataRaw, tactics: [p1DataRaw.gkFocus, ...aiArr1] };
      activeMatch.p2 = { ...p2DataRaw, tactics: [p2DataRaw.gkFocus, ...aiArr2] };
      
      p1DataRaw = null; p2DataRaw = null;
      activeMatch.active = true; activeMatch.turn = 0; 
      activeMatch.scoreA = 0; activeMatch.scoreB = 0; activeMatch.possession = 'A';
      activeMatch.playstyleA = 'Balanced'; activeMatch.playstyleB = 'Balanced';
      activeMatch.irritatedA = null; activeMatch.irritatedB = null;

      const phaseResult = runPhase();
      io.emit('phaseUpdate', phaseResult);
    }
  });

  socket.on('reactionSubmitted', (data) => {
    if (data.scorer === 'A') {
      activeMatch.playstyleA = data.playstyle;
      activeMatch.irritatedA = data.irritated;
    } else {
      activeMatch.playstyleB = data.playstyle;
      activeMatch.irritatedB = data.irritated;
    }
    const phaseResult = runPhase();
    io.emit('phaseUpdate', phaseResult);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server listening on port ${PORT}`));