# Deployment Guide

## Production Deployment Checklist

### 1. Environment Configuration

#### Update .env for Production
```env
NODE_ENV=production
PORT=5000

# MongoDB - Use your production connection string
MONGODB_URI="your_mongodb_uri"

# JWT - CHANGE THESE IN PRODUCTION!
JWT_SECRET=<generate-a-long-random-secret-key-here>
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Email - Use production SMTP credentials
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=production-email@yourdomain.com
EMAIL_PASSWORD=<app-specific-password>
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL - Your production frontend
FRONTEND_URL=https://yourdomain.com
```

#### Generate Secure JWT Secret
```bash
# Node.js method
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or online: https://generate-secret.vercel.app/64
```

### 2. Security Hardening

#### A. Update CORS Configuration
In `src/app.js`, restrict CORS to your frontend domain:
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
};
```

#### B. Enable HTTPS
- Use SSL/TLS certificates (Let's Encrypt, Cloudflare, etc.)
- Force HTTPS redirects
- Set secure cookie flags in production

#### C. Rate Limiting (Optional but Recommended)
```bash
npm install express-rate-limit
```

Add to `src/app.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

#### D. Helmet for Security Headers
```bash
npm install helmet
```

Add to `src/app.js`:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 3. MongoDB Atlas Configuration

#### Production Database Setup
1. **Create Production Cluster**
   - Separate from development
   - Choose appropriate tier (M2+ for production)

2. **Network Access**
   - Remove 0.0.0.0/0 (testing only)
   - Add specific IP addresses or use VPC peering
   - Enable VPN if needed

3. **Database Users**
   - Create production-specific user
   - Use strong passwords
   - Restrict permissions (readWrite only)

4. **Backup Configuration**
   - Enable continuous backup
   - Set backup retention policy
   - Test restore procedures

5. **Monitoring**
   - Enable Atlas monitoring
   - Set up alerts for:
     - High connection count
     - Slow queries
     - Disk usage
     - CPU usage

### 4. Performance Optimization

#### A. Enable Compression
```bash
npm install compression
```

Add to `src/app.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

#### B. Database Optimization
- Ensure all indexes are created
- Monitor slow queries
- Use aggregation pipelines for complex queries
- Implement pagination for large result sets

#### C. Caching Strategy
Consider implementing Redis for:
- Session storage
- Frequently accessed data
- Rate limiting

### 5. Logging and Monitoring

#### A. Production Logging
Replace morgan with winston for production:
```bash
npm install winston
```

Create `src/utils/logger.js`:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

#### B. Error Tracking
Consider integrating:
- Sentry (error tracking)
- New Relic (APM)
- LogRocket (session replay)

### 6. Deployment Options

#### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)

**Steps:**
1. Set up Ubuntu server
2. Install Node.js 20+
3. Install PM2 for process management
4. Clone repository
5. Install dependencies
6. Configure environment
7. Start with PM2

**Commands:**
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone and setup
git clone <repo-url>
cd Delegation-Based-Approval-Management-System-Backend
npm install

# Start with PM2
pm2 start src/server.js --name dbams-api
pm2 save
pm2 startup
```

**Nginx Configuration** (as reverse proxy):
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Option 2: Platform as a Service

**Heroku:**
1. Create `Procfile`:
```
web: node src/server.js
```

2. Deploy:
```bash
heroku create dbams-api
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=<connection-string>
heroku config:set JWT_SECRET=<secret>
git push heroku main
```

**Render.com:**
1. Connect GitHub repository
2. Set build command: `npm install`
3. Set start command: `node src/server.js`
4. Add environment variables
5. Deploy

**Railway.app:**
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

#### Option 3: Docker Container

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:5000"
    env_file:
      - .env
    restart: always
```

Deploy:
```bash
docker-compose up -d
```

### 7. CI/CD Pipeline

#### GitHub Actions Example
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/app
            git pull
            npm install
            pm2 restart dbams-api
```

### 8. Health Checks and Monitoring

#### Add Health Check Endpoint
Already implemented at `GET /`

#### Uptime Monitoring
Use services like:
- UptimeRobot
- Pingdom
- StatusCake
- Better Uptime

Configure checks:
- URL: https://api.yourdomain.com/
- Interval: 5 minutes
- Alert contacts: Your email

### 9. Backup Strategy

#### Automated Database Backups
MongoDB Atlas provides automatic backups, but also:

1. **Manual Backup Script:**
```bash
#!/bin/bash
mongodump --uri="<MONGODB_URI>" --out="/backups/$(date +%Y%m%d)"
```

2. **Schedule with Cron:**
```bash
0 2 * * * /path/to/backup-script.sh
```

#### Application Backup
- Version control (Git)
- Environment variables (secure storage)
- Configuration files
- Uploaded files (if any)

### 10. Scaling Considerations

#### Horizontal Scaling
- Use load balancer (Nginx, AWS ELB)
- Stateless application (JWT tokens)
- Session storage in Redis/MongoDB

#### Vertical Scaling
- Monitor resource usage
- Upgrade server specs as needed

#### Database Scaling
- MongoDB Atlas auto-scaling
- Read replicas for read-heavy workloads
- Sharding for very large datasets

### 11. Maintenance

#### Regular Tasks
- **Daily:** Check error logs
- **Weekly:** Review performance metrics
- **Monthly:** 
  - Update dependencies
  - Review and archive old data
  - Check backup integrity
- **Quarterly:** 
  - Security audit
  - Performance optimization
  - Capacity planning

#### Update Dependencies
```bash
# Check for updates
npm outdated

# Update safely
npm update

# Or use npm-check-updates
npx npm-check-updates -u
npm install
```

### 12. Troubleshooting

#### Common Issues

**1. MongoDB Connection Timeout**
- Check network access in Atlas
- Verify connection string
- Check DNS resolution
- Test with `node test.js`

**2. High Memory Usage**
- Check for memory leaks
- Monitor with `pm2 monit`
- Restart: `pm2 restart dbams-api`

**3. Slow Response Times**
- Enable query profiling in MongoDB
- Check database indexes
- Review slow query logs
- Implement caching

**4. Email Not Sending**
- Verify SMTP credentials
- Check spam folder
- Review error logs
- Test with separate email script

### 13. Security Monitoring

#### Regular Security Checks
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check outdated packages
npm outdated
```

#### Security Headers
Verify at: https://securityheaders.com/

#### SSL Certificate
Monitor expiry and auto-renew

### 14. Post-Deployment Testing

#### Smoke Tests
1. Health check endpoint
2. User login
3. Create approval request
4. Create delegation
5. Approve/reject request
6. Email notifications

#### Load Testing
Use tools like:
- Apache Bench
- Artillery
- k6

Example:
```bash
ab -n 1000 -c 10 http://api.yourdomain.com/
```

### 15. Documentation

Keep updated:
- API documentation
- Deployment procedures
- Troubleshooting guides
- Architecture diagrams
- Runbooks for common tasks

---

## Quick Production Deployment (Digital Ocean)

```bash
# 1. Create droplet (Ubuntu 22.04, 2GB RAM)

# 2. SSH into server
ssh root@your-server-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# 4. Install PM2
npm install -g pm2

# 5. Create app user
adduser dbams
usermod -aG sudo dbams
su - dbams

# 6. Clone repository
git clone <repo-url> ~/dbams-api
cd ~/dbams-api

# 7. Install dependencies
npm install

# 8. Create .env file
nano .env
# (paste production environment variables)

# 9. Start with PM2
pm2 start src/server.js --name dbams-api
pm2 save
pm2 startup

# 10. Install Nginx
sudo apt install nginx

# 11. Configure Nginx
sudo nano /etc/nginx/sites-available/dbams
# (paste nginx configuration)

sudo ln -s /etc/nginx/sites-available/dbams /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 12. Install SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com

# Done! Test at https://api.yourdomain.com
```

---

## Support and Maintenance Contacts

- **Developer:** Dheepak Shakthi
- **Database:** MongoDB Atlas Support
- **Hosting:** [Your hosting provider]
- **Email Service:** [Your email provider]
