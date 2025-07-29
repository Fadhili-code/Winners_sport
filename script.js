// script.js

const season = 2023;
const leagueId = 39; // Premier League

const matchesGrid = document.getElementById("matches-grid");
const statsTableBody = document.getElementById("stats-table-body");
const teamPage = document.getElementById("team-page");
const backToHomeBtn = document.getElementById("back-to-home");

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
    // data.response is an array, standings in response[0].league.standings[0]
    return data.response[0].league.standings[0];
  } catch (error) {
    console.error("Error fetching league standings:", error);
    return [];
  }
}

// Render all teams as cards on the main page
async function renderTeams() {
  const teams = await fetchLeagueStandings();
  matchesGrid.innerHTML = "";

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

// Initialize page
document.addEventListener("DOMContentLoaded", renderTeams);
