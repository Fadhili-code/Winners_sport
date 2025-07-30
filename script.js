// script.js

const season = 2022; // Changed to 2022 for 2022/2023 season
const leagueId = 39; // Premier League

const matchesGrid = document.getElementById("matches-grid");
const statsTableBody = document.getElementById("stats-table-body");
const teamPage = document.getElementById("team-page");
const backToHomeBtn = document.getElementById("back-to-home");

// Premier League 2022/2023 teams (static list for dropdown)
const premierLeagueTeams = [
  { id: 33, name: "Manchester United" },
  { id: 34, name: "Newcastle" },
  { id: 35, name: "Bournemouth" },
  { id: 36, name: "Brighton" },
  { id: 37, name: "Chelsea" },
  { id: 38, name: "Crystal Palace" },
  { id: 39, name: "Everton" },
  { id: 40, name: "Leicester" },
  { id: 41, name: "Liverpool" },
  { id: 42, name: "Man City" },
  { id: 43, name: "Southampton" },
  { id: 44, name: "Tottenham" },
  { id: 45, name: "West Ham" },
  { id: 46, name: "Wolves" },
  { id: 47, name: "Arsenal" },
  { id: 48, name: "Aston Villa" },
  { id: 49, name: "Brentford" },
  { id: 50, name: "Fulham" },
  { id: 51, name: "Leeds" },
  { id: 52, name: "Nottingham Forest" }
];

const teamDropdown = document.getElementById("team-dropdown");
const h2hSearch = document.getElementById("h2h-search");

// Fetch team stats from backend API route
async function fetchTeamStats(teamId) {
  try {
    const res = await fetch(`/api/teamStats?type=team&team=${teamId}`);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    return data.response; // your backend returns this structure
  } catch (error) {
    console.error("Error fetching team stats:", error);
    return null;
  }
}

// Fetch league standings from backend API route
async function fetchLeagueStandings() {
  try {
    const res = await fetch(`/api/teamStats?type=league`);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    console.log("API response for league standings:", data);
    // Defensive check for expected structure
    if (!data.response || !Array.isArray(data.response) || !data.response[0]?.league?.standings) {
      console.error("Unexpected API response:", data);
      // Optionally, show a user-friendly message in the UI
      matchesGrid.innerHTML = '<div class="error-message">Unable to load league standings. Please try again later.</div>';
      return [];
    }
    // data.response is an array, standings in response[0].league.standings[0]
    return data.response[0].league.standings[0];
  } catch (error) {
    console.error("Error fetching league standings:", error);
    matchesGrid.innerHTML = '<div class="error-message">Failed to load league standings. Please check your connection or try again later.</div>';
    return [];
  }
}

// Render all teams as cards on the main page
async function renderTeams() {
  const teams = await fetchLeagueStandings();
  matchesGrid.innerHTML = "";
  if (!teams || teams.length === 0) {
    matchesGrid.innerHTML = '<div class="error-message">No teams available to display.</div>';
    return;
  }
  teams.forEach(team => {
    const teamCard = document.createElement("div");
    teamCard.className = "team-card";
    teamCard.innerHTML = `
      <img src="${team.team.logo}" alt="${team.team.name}" />
      <h3>${team.team.name}</h3>
      <p>W: ${team.all.win} | D: ${team.all.draw} | L: ${team.all.lose}</p>
    `;
    teamCard.addEventListener("click", () => showTeamPage(team.team.id, team.team.name, team.team.logo));
    matchesGrid.appendChild(teamCard);
  });
}

// Show detailed team stats page
async function showTeamPage(teamId, name, logo) {
  const stats = await fetchTeamStats(teamId);
  if (!stats) return alert("Failed to load team stats");

  document.getElementById("team-name").innerText = name;
  document.getElementById("team-logo-large").src = logo;

  // Defensive checks for nested data, to avoid errors
  document.getElementById("wins-count").innerText = stats.fixtures?.wins?.total ?? 0;
  document.getElementById("draws-count").innerText = stats.fixtures?.draws?.total ?? 0;
  document.getElementById("losses-count").innerText = stats.fixtures?.loses?.total ?? 0;

  statsTableBody.innerHTML = "";

  // The API returns results in stats.fixtures.results array, but sometimes data might be missing
  if (stats.fixtures?.results && stats.fixtures.results.length > 0) {
    stats.fixtures.results.slice(0, 5).forEach(match => {
      const row = document.createElement("tr");
      // Extract date, opponent, result, and score properly
      const matchDate = match.fixture?.date ? match.fixture.date.split("T")[0] : "N/A";
      const opponentName = match.teams?.away?.name === name ? match.teams.home.name : match.teams.away.name;
      const result = match.goals.home === match.goals.away ? "Draw" : (match.goals.home > match.goals.away ? (match.teams.home.name === name ? "W" : "L") : (match.teams.away.name === name ? "W" : "L"));
      const score = `${match.goals.home} - ${match.goals.away}`;

      row.innerHTML = `
        <td>${matchDate}</td>
        <td>${opponentName}</td>
        <td>${result}</td>
        <td>${score}</td>
      `;
      statsTableBody.appendChild(row);
    });
  } else {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4">No recent match data available</td>`;
    statsTableBody.appendChild(row);
  }

  teamPage.style.display = "block";
}

// Hide team page and show main page
backToHomeBtn.addEventListener("click", () => {
  teamPage.style.display = "none";
});

// Populate dropdown
function populateTeamDropdown() {
  // Clear existing options
  teamDropdown.innerHTML = '<option value="">See Squad</option>';
  
  // Add team options
  premierLeagueTeams.forEach(team => {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.name;
    teamDropdown.appendChild(option);
  });
}

// Show team stats when a team is selected
teamDropdown.addEventListener("change", async function () {
  const teamId = this.value;
  if (!teamId) return;
  
  const selectedTeam = premierLeagueTeams.find(t => t.id == teamId);
  if (!selectedTeam) return;
  
  // Clear head-to-head search when using squad dropdown
  h2hSearch.value = '';
  
  // Show loading state
  matchesGrid.innerHTML = '<div class="loading">Loading team data...</div>';
  
  try {
    // Fetch team stats
    const stats = await fetchTeamStats(teamId);
    if (!stats) throw new Error("Failed to load team stats");
    
    // Fetch squad data
    const squad = await fetchSquadData(teamId);
    
    // Display team details
    displayTeamDetails(selectedTeam, stats, squad);
  } catch (error) {
    matchesGrid.innerHTML = `<div class="error-message">Failed to load team data: ${error.message}</div>`;
  }
});

// Fetch squad data
async function fetchSquadData(teamId) {
  try {
    const res = await fetch(`/api/teamStats?type=squad&team=${teamId}`);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    return data.response;
  } catch (error) {
    console.error("Error fetching squad data:", error);
    return null;
  }
}

// Display team details with squad, goals, top scorer
function displayTeamDetails(team, stats, squad) {
  // Fix the [object Object] issue by properly accessing the API response structure
  console.log("Team stats response:", stats);
  console.log("Squad response:", squad);
  
  // Extract goals data properly - the API structure might be different
  let goalsFor = 0;
  let goalsAgainst = 0;
  
  if (stats.goals) {
    console.log("Goals object:", stats.goals);
    if (typeof stats.goals.for === 'object' && stats.goals.for.total !== undefined) {
      goalsFor = stats.goals.for.total;
    } else if (typeof stats.goals.for === 'number') {
      goalsFor = stats.goals.for;
    } else if (stats.goals.for && typeof stats.goals.for === 'object') {
      // Try different possible structures
      goalsFor = stats.goals.for.total || stats.goals.for.all || stats.goals.for.home || 0;
    }
    
    if (typeof stats.goals.against === 'object' && stats.goals.against.total !== undefined) {
      goalsAgainst = stats.goals.against.total;
    } else if (typeof stats.goals.against === 'number') {
      goalsAgainst = stats.goals.against;
    } else if (stats.goals.against && typeof stats.goals.against === 'object') {
      // Try different possible structures
      goalsAgainst = stats.goals.against.total || stats.goals.against.all || stats.goals.against.away || 0;
    }
  }
  
  console.log("Extracted goals - For:", goalsFor, "Against:", goalsAgainst);
  
  matchesGrid.innerHTML = `
    <div class="team-details">
      <h2>${team.name}</h2>
      
      <div class="team-stats-grid">
        <div class="stat-card">
          <h3>Season Stats</h3>
          <p>Wins: ${stats.fixtures?.wins?.total || 0}</p>
          <p>Draws: ${stats.fixtures?.draws?.total || 0}</p>
          <p>Losses: ${stats.fixtures?.loses?.total || 0}</p>
          <p>Goals Scored: ${goalsFor}</p>
          <p>Goals Conceded: ${goalsAgainst}</p>
        </div>
        
        <div class="stat-card">
          <h3>Current Squad</h3>
          ${squad && squad.length > 0 ? squad.map(player => `
            <div class="player">
              <span>${player.player.name}</span>
              <span>${player.statistics?.[0]?.games?.position || 'N/A'}</span>
            </div>
          `).join('') : '<p>No squad data available</p>'}
        </div>
        
        <div class="stat-card">
          <h3>Top Scorers</h3>
          ${squad && squad.length > 0 ? squad.filter(p => p.statistics?.[0]?.goals?.total > 0)
            .sort((a, b) => (b.statistics[0]?.goals?.total || 0) - (a.statistics[0]?.goals?.total || 0))
            .slice(0, 5)
            .map(player => `
              <div class="player">
                <span>${player.player.name}</span>
                <span>${player.statistics[0]?.goals?.total || 0} goals</span>
              </div>
            `).join('') : '<p>No scoring data available</p>'}
        </div>
      </div>
    </div>
  `;
}

// Head-to-head search with edge case handling
h2hSearch.addEventListener("input", debounce(async function () {
  const query = this.value.trim();
  if (query.length < 2) {
    // Clear the display if query is too short
    matchesGrid.innerHTML = '';
    return;
  }
  
  // Handle edge cases: case insensitive, spaces, partial matches
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ');
  
  // First try exact match (case insensitive, ignoring extra spaces)
  let foundTeams = premierLeagueTeams.filter(team => {
    const normalizedName = team.name.toLowerCase().replace(/\s+/g, ' ');
    return normalizedName === normalizedQuery;
  });
  
  // If no exact match, try starts with
  if (foundTeams.length === 0) {
    foundTeams = premierLeagueTeams.filter(team => {
      const normalizedName = team.name.toLowerCase().replace(/\s+/g, ' ');
      return normalizedName.startsWith(normalizedQuery);
    });
  }
  
  // If still no match, try contains (but be more strict)
  if (foundTeams.length === 0) {
    foundTeams = premierLeagueTeams.filter(team => {
      const normalizedName = team.name.toLowerCase().replace(/\s+/g, ' ');
      // Only match if the query is a significant part of the team name
      return normalizedName.includes(normalizedQuery) && 
             (normalizedQuery.length >= 3 || normalizedName.split(' ').some(word => word.startsWith(normalizedQuery)));
    });
  }
  
  if (foundTeams.length > 0) {
    console.log(`Found team: ${foundTeams[0].name} for query: "${query}"`);
    // Clear dropdown selection when searching head-to-head
    teamDropdown.value = '';
    await showTeamPerformance(foundTeams[0]);
  } else {
    console.log(`No team found for query: "${query}"`);
  }
}, 300));

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Show team performance against all other teams
async function showTeamPerformance(team) {
  try {
    const res = await fetch(`/api/teamStats?type=performance&team=${team.id}`);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    
    // Debug: Log what we're getting
    console.log(`=== DEBUG: Team ${team.name} (ID: ${team.id}) ===`);
    console.log(`Total matches returned: ${data.response ? data.response.length : 0}`);
    if (data.response && data.response.length > 0) {
      console.log(`First 3 matches:`, data.response.slice(0, 3).map(m => ({
        home: m.teams?.home?.name,
        away: m.teams?.away?.name,
        score: `${m.goals?.home || 0} - ${m.goals?.away || 0}`
      })));
    }
    
    displayTeamPerformance(team, data.response);
  } catch (error) {
    console.error("Error in showTeamPerformance:", error);
    matchesGrid.innerHTML = `<div class="error-message">Failed to load performance data.</div>`;
  }
}

// Display team performance with win probabilities
function displayTeamPerformance(team, matches) {
  const performanceData = calculatePerformance(matches, team);
  
  matchesGrid.innerHTML = `
    <div class="performance-section">
      <h2>${team.name} Performance Analysis</h2>
      
      <div class="filter-controls">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="w">Wins</button>
        <button class="filter-btn" data-filter="l">Losses</button>
        <button class="filter-btn" data-filter="d">Draws</button>
      </div>
      
      <div class="performance-grid">
        ${performanceData.map(match => `
          <div class="performance-card ${match.result.toLowerCase()}" data-result="${match.result.toLowerCase()}">
            <div class="match-teams">
              <span>${match.homeTeam}</span>
              <span class="vs">vs</span>
              <span>${match.awayTeam}</span>
            </div>
            <div class="match-result">
              <span class="result ${match.result.toLowerCase()}">${match.result}</span>
              <span class="score">${match.score}</span>
            </div>
            <div class="win-probability">
              <span>Win Probability: ${match.winProbability}%</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  // Add filter functionality
  addFilterListeners();
}

// Calculate performance and win probabilities
function calculatePerformance(matches, team) {
  if (!matches || !Array.isArray(matches)) return [];
  
  return matches.map(match => {
    const isHome = match.teams?.home?.name === team.name;
    const teamGoals = isHome ? match.goals?.home : match.goals?.away;
    const opponentGoals = isHome ? match.goals?.away : match.goals?.home;
    
    let result = 'D';
    let winProbability = 50;
    
    if (teamGoals > opponentGoals) {
      result = 'W';
      winProbability = 70 + Math.min(20, (teamGoals - opponentGoals) * 10);
    } else if (teamGoals < opponentGoals) {
      result = 'L';
      winProbability = 30 - Math.min(20, (opponentGoals - teamGoals) * 10);
    }
    
    return {
      homeTeam: match.teams?.home?.name || 'Unknown',
      awayTeam: match.teams?.away?.name || 'Unknown',
      result: result,
      score: `${match.goals?.home || 0} - ${match.goals?.away || 0}`,
      winProbability: Math.max(10, Math.min(90, winProbability))
    };
  });
}

// Add filter listeners
function addFilterListeners() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const performanceCards = document.querySelectorAll('.performance-card');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      
      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Filter cards
      performanceCards.forEach(card => {
        if (filter === 'all' || card.dataset.result === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Add navigation functionality
function addNavigationListeners() {
  // Home navigation
  const homeLinks = document.querySelectorAll('a[href="#home"]');
  homeLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      renderTeams();
    });
  });
}

// Add fixtures functionality
function addFixturesListener() {
  const fixturesLink = document.querySelector('a[href="#fixtures"]');
  if (fixturesLink) {
    fixturesLink.addEventListener('click', async (e) => {
      e.preventDefault();
      await showFixtures();
    });
  }
}

// Show fixtures page
async function showFixtures() {
  try {
    matchesGrid.innerHTML = '<div class="loading">Loading fixtures...</div>';
    
    // Fetch all fixtures for the season
    const res = await fetch(`/api/teamStats?type=fixtures`);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    
    console.log("Fixtures API response:", data);
    
    // Check if we have valid response data
    if (!data.response || !Array.isArray(data.response)) {
      console.error("Invalid fixtures data structure:", data);
      matchesGrid.innerHTML = '<div class="error-message">Invalid fixtures data received from API.</div>';
      return;
    }
    
    displayFixtures(data.response);
  } catch (error) {
    console.error("Fixtures error:", error);
    matchesGrid.innerHTML = `<div class="error-message">Failed to load fixtures: ${error.message}</div>`;
  }
}

// Display fixtures with weekly breakdown
function displayFixtures(fixtures) {
  console.log("Displaying fixtures:", fixtures);
  
  if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
    matchesGrid.innerHTML = '<div class="error-message">No fixtures data available.</div>';
    return;
  }
  
  // Group fixtures by week
  const weeklyFixtures = groupFixturesByWeek(fixtures);
  const totalGames = fixtures.length;
  
  matchesGrid.innerHTML = `
    <div class="fixtures-section">
      <h2>Premier League Fixtures 2022/23</h2>
      <div class="fixtures-summary">
        <p><strong>Total Games Played:</strong> ${totalGames}</p>
      </div>
      
      <div class="weekly-fixtures">
        ${Object.entries(weeklyFixtures).map(([week, matches]) => `
          <div class="week-section">
            <h3>Week ${week}</h3>
            <div class="week-matches">
              ${matches.map(match => `
                <div class="fixture-card">
                  <div class="fixture-teams">
                    <span class="home-team">${match.teams?.home?.name || 'TBD'}</span>
                    <span class="vs">vs</span>
                    <span class="away-team">${match.teams?.away?.name || 'TBD'}</span>
                  </div>
                  <div class="fixture-details">
                    <span class="fixture-date">${formatDate(match.fixture?.date)}</span>
                    <span class="fixture-score">${match.goals?.home || 0} - ${match.goals?.away || 0}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Group fixtures by week
function groupFixturesByWeek(fixtures) {
  const weekly = {};
  
  fixtures.forEach(fixture => {
    const date = new Date(fixture.fixture?.date);
    const weekNumber = Math.ceil((date.getTime() - new Date('2022-08-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
    const week = Math.max(1, weekNumber);
    
    if (!weekly[week]) {
      weekly[week] = [];
    }
    weekly[week].push(fixture);
  });
  
  return weekly;
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  renderTeams();
  populateTeamDropdown();
  addFixturesListener();
  addNavigationListeners();
});
