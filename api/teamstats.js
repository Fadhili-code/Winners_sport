// /api/teamStats.js
export default async function handler(req, res) {
  const { team, type, teamA, teamB } = req.query;
  const headers = {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
  };

  const league = 39; // Premier League ID
  const season = 2023;

  let url = '';
  if (type === 'team') {
    url = `https://api-football-v1.p.rapidapi.com/v3/teams/statistics?league=${league}&season=${season}&team=${team}`;
  } else if (type === 'squad') {
    url = `https://api-football-v1.p.rapidapi.com/v3/players?team=${team}&league=${league}&season=${season}`;
  } else if (type === 'performance') {
    url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${team}&league=${league}&season=${season}`;
  } else if (type === 'h2h' && teamA && teamB) {
    url = `https://api-football-v1.p.rapidapi.com/v3/fixtures/headtohead?h2h=${teamA}-${teamB}&league=${league}&season=${season}`;
  } else {
    url = `https://api-football-v1.p.rapidapi.com/v3/standings?league=${league}&season=${season}`;
  }

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'API call failed' });
  }
}
