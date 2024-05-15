// App.js
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [repositories, setRepositories] = useState([]);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const response = await fetch('/repositories');
      const data = await response.json();
      setRepositories(data);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  const syncWithGitHub = async () => {
    try {
      const response = await fetch('/sync', { method: 'GET' });
      if (response.ok) {
        console.log('Sync started successfully');
        fetchRepositories();
      } else {
        console.error('Failed to start sync:', response.statusText);
      }
    } catch (error) {
      console.error('Error starting sync:', error);
    }
  };

  return (
    <div className="App">
      <h1>Github Trending Repositories</h1>
      <button onClick={syncWithGitHub}>Sync with GitHub</button>
      <div className="repositories">
        {repositories.map(repo => (
          <div key={repo.id} className="repository">
            <h2>{repo.name}</h2>
            <p>{repo.description}</p>
            <p>Stars: {repo.stars}</p>
            <a href={repo.url} target="_blank" rel="noopener noreferrer">View on GitHub</a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;