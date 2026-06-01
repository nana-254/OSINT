import React, { useState } from 'react';

const SearchForm = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [numResults, setNumResults] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query, apiKey, numResults);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label 
            htmlFor="query" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search Query
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your OSINT search query"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Search query"
            tabIndex="0"
            required
          />
        </div>

        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            aria-expanded={showAdvanced}
            tabIndex="0"
          >
            <svg 
              className={`h-4 w-4 mr-1 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Advanced Options
          </button>
        </div>

        {showAdvanced && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <div className="mb-3">
              <label 
                htmlFor="apiKey" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Perplexity API Key (Optional)
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="API key"
                tabIndex="0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to use the API key from the .env file
              </p>
            </div>

            <div>
              <label 
                htmlFor="numResults" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Number of Results
              </label>
              <input
                id="numResults"
                type="number"
                value={numResults}
                onChange={(e) => setNumResults(parseInt(e.target.value, 10))}
                min="1"
                max="50"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Number of results"
                tabIndex="0"
              />
            </div>
          </div>
        )}

        <div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={!query}
            tabIndex="0"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm; 