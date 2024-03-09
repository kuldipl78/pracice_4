const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbpath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())

let db = null

const initilizationDBServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Run At http://localhost/3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initilizationDBServer()

//API1 GET Returns a list of all the players in the player table

app.get('/players/', async (req, res) => {
  const playersQuery = `
      SELECT
      player_id AS playerId,
      player_name AS playerName
      FROM 
      player_details;`
  const players = await db.all(playersQuery)
  res.send(players)
})

//API2 GET Returns a specific player based on the player ID

app.get('/players/:playerId/', async (req, res) => {
  const {playerId} = req.params
  const playerQuery = `
      SELECT
      player_id AS playerId,
      player_name AS playerName
      FROM 
      player_details
      WHERE player_id = ${playerId};`
  const player = await db.get(playerQuery)
  res.send(player)
})

//PUT Updates the details of a specific player based on the player ID

app.put('/players/:playerId/', async (req, res) => {
  const {playerId} = req.params
  const {playerName} = req.body
  const updateQuery = `
      UPDATE 
      player_details
      SET 
      player_name = ?
      WHERE
      player_id = ? ;`
  const updateDetails = await db.run(updateQuery, playerName, playerId)
  res.send('Player Details Updated')
})

//API4 GET Returns the match details of a specific match
app.get('/matches/:matchId/', async (req, res) => {
  const {matchId} = req.params
  const matchetailsQuery = `
      SELECT
      match_id AS matchId, 
      match, year
      FROM match_details
      WHERE match_id = ?;`
  const dbResponse = await db.get(matchetailsQuery, matchId)
  res.send(dbResponse)
})

//API5 GET Returns a list of all the matches of a player
app.get('/players/:playerId/matches', async (req, res) => {
  const {playerId} = req.params
  const playerDetailsQuery = `
      SELECT 
      match.match_Id AS matchId,
      match.match,
      match.year
      FROM match_details AS match 
      INNER JOIN player_match_score AS player_score ON match.match_id = player_score.match_id 
      WHERE player_id = ?;`
  const dbResponse = await db.all(playerDetailsQuery, playerId)
  res.send(dbResponse)
})

//API6 Returns a list of players of a specific match

app.get('/matches/:matchId/players', async (req, res) => {
  const {matchId} = req.params
  const playerMatchQuerey = `
      SELECT
      player_details.player_id AS playerId,
      player_details.player_name AS playerName
      FROM player_details 
      INNER JOIN player_match_score AS player_match ON  player_details.player_id = player_match.player_id
      WHERE player_match.match_id = ?;`
  const dbResponse = await db.all(playerMatchQuerey, matchId)
  res.send(dbResponse)
})

//API7
app.get('/players/:playerId/playerScores', async (req, res) => {
  const {playerId} = req.params
  const playerDataQurey = `
      SELECT 
      player_match_score.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(player_match_score.fours) AS totalFours,
      SUM(player_match_score.sixes) AS totalSixes
      FROM 
      player_match_score 
      INNER JOIN player_details ON player_match_score.player_id = player_details.player_id
      WHERE player_match_score.player_id= ?
      GROUP BY player_match_score.player_id`
  const dbResponse = await db.get(playerDataQurey, playerId)
  res.send(dbResponse)
})
module.exports = app
