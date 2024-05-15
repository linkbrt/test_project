const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;
const GITHUB_URL = 'https://api.github.com/search/repositories?q=stars:>1&sort=stars&order=desc'
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:1234@localhost:5432/nodejs';
const SYNC_INTERVAL = 600000; // 10 minutes

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function syncWithGitHub() {
  try {
    const response = await fetch(GITHUB_URL);
    const data = await response.json();
    
    const repositories = data.items.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      url: repo.html_url
    }));
    
    await pool.query('DELETE FROM repositories');
    
    await Promise.all(repositories.map(repo => {
      const queryText = 'INSERT INTO repositories(id, name, full_name, description, stars, url) VALUES($1, $2, $3, $4, $5, $6)';
      const values = [repo.id, repo.name, repo.full_name, repo.description, repo.stars, repo.url];
      return pool.query(queryText, values);
    }));

    console.log('Sync with GitHub completed successfully.');
  } catch (error) {
    console.error('Error syncing with GitHub:', error);
  }
}


syncWithGitHub();

intervalID = setInterval(syncWithGitHub, SYNC_INTERVAL);

// API endpoints
app.get('/repositories/:idOrName', async (req, res) => {
  try {
    const { idOrName } = req.params;
    const queryText = 'SELECT * FROM repositories WHERE id = $1 OR name = $1';
    const result = await pool.query(queryText, [idOrName]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching repository:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/repositories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM repositories');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/sync', async (req, res) => {
  try {
    clearInterval(intervalID);
    await syncWithGitHub();
    res.json({ message: 'Sync started successfully' });
    intervalID = setInterval(syncWithGitHub, SYNC_INTERVAL);
  } catch (error) {
    console.error('Error starting sync:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});