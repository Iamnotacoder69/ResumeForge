# Qwalify - CV Builder

A professional CV creation web application that empowers users to build modern, tailored resumes with intelligent AI-driven features and precise layout control.

## Features

- Create professional CVs with beautiful templates
- AI-powered content enhancement
- PDF generation directly in the browser
- Section reordering and customization
- Upload existing CVs for data extraction (PDF/DOCX)
- Persistent data storage with PostgreSQL

## Technology Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS
- **Backend**: Express.js
- **Database**: PostgreSQL
- **AI Integration**: OpenAI for intelligent parsing and content enhancement
- **Document Processing**: PDF and DOCX parsing
- **Form Management**: React Hook Form
- **Data Handling**: Tanstack Query

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# OpenAI API Key (required for AI features)
OPENAI_API_KEY=your_openai_api_key

# Database Connection
DATABASE_URL=your_postgresql_connection_string
PGDATABASE=your_database_name
PGHOST=your_database_host
PGPASSWORD=your_database_password
PGPORT=your_database_port
PGUSER=your_database_user
```

See `.env.example` for a template.

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/qwalify.git
   cd qwalify
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up the database
   ```bash
   npm run db:push
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## Deployment

This application can be deployed on platforms like Railway or Render:

1. Push your code to GitHub
2. Connect your repository to your deployment platform
3. Set the environment variables in your deployment platform
4. Deploy!

## License

MIT