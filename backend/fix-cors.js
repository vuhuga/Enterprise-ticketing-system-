const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Find and replace the CORS configuration
const oldCors = `app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));`;

const newCors = `app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow any localhost origin for development
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Check against configured frontend URL
    const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:4200'];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log(\`❌ CORS blocked origin: \${origin}\`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));`;

content = content.replace(oldCors, newCors);

fs.writeFileSync(serverPath, content, 'utf8');
console.log('✅ CORS configuration updated successfully!');
console.log('The backend now allows any localhost port for development.');
