# OSINT Assistant Web Application

This repository contains both the OSINT Assistant core functionality and a web application interface built with Flask and React.

## Project Structure

- `osint_assistant.py` - Core OSINT functionality
- `osint_web_app.py` - Flask backend server
- `client/` - React frontend application
- `requirements.txt` - Python dependencies

## Features

- 🔍 **Web Search:** Collect information from multiple sources based on specific queries
- 🧠 **AI-Powered Analysis:** Use Perplexity AI for enhanced content analysis
- 📊 **Entity Recognition:** Identify key people, organizations, and concepts
- 🔗 **Connection Analysis:** Map relationships between identified entities
- 📊 **Modern UI:** React and TailwindCSS frontend for easy interaction
- 🌐 **API Access:** RESTful API endpoints for programmatic access

## Installation

### Prerequisites

- Python 3.8+
- Node.js 14+ and npm
- pip package manager

### Backend Setup

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
   
3. Edit the `.env` file and add your Perplexity API key:
   ```
   PERPLEXITY_API_KEY=your_api_key_here
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Build the frontend:
   ```bash
   npm run build
   ```

## Running the Application

### Development Mode

Run the backend server:
```bash
python osint_web_app.py
```

In a separate terminal, run the React development server:
```bash
cd client
npm start
```

Access the application at http://localhost:3000

### Production Mode

1. Build the React frontend:
   ```bash
   cd client
   npm run build
   ```

2. Run the Flask server, which will serve both the API and the built React frontend:
   ```bash
   python osint_web_app.py
   ```

3. Access the application at http://localhost:5000

## API Documentation

The web application exposes the following API endpoint:

### POST /api/search

Performs an OSINT search and analysis based on a query.

**Request Body:**
```json
{
  "query": "your search query",
  "num_results": 10,
  "api_key": "optional_api_key"
}
```

**Response:**
```json
{
  "collected_data": [...],
  "analysis_results": {...},
  "query_info": {
    "query": "your search query",
    "results_requested": 10,
    "results_found": 3
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational and research purposes only. Always ensure you comply with relevant laws and regulations when conducting OSINT research. 