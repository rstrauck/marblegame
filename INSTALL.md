# Installation Guide - Marble Trading Game

This guide will help you set up and run the Marble Trading Game on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js** (version 16.0 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
- **npm** (usually comes with Node.js)
  - Verify installation: `npm --version`
- **Git** (for cloning the repository)
  - Download from: https://git-scm.com/
  - Verify installation: `git --version`

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 500MB free space
- **Internet Connection**: Required for initial setup

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
# Clone the project
git clone https://github.com/your-username/marble-trading-game.git

# Navigate to the project directory
cd marble-trading-game
```

### 2. Install Dependencies

```bash
# Install all required packages
npm install
```

**Note**: If you encounter errors during installation, see the [Troubleshooting](#-troubleshooting) section below.

### 3. Start the Development Server

```bash
# Start the local development server
npm start
```

The application should automatically open in your browser at `http://localhost:3000`.

If it doesn't open automatically, manually navigate to:
- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000 (for access from other devices)

## 🎮 Using the Application

Once the server is running, you'll have access to:

### Main Features
- **Original Game**: Interactive marble drawing simulation
- **Ad-Hoc Analysis**: Custom marble configurations with profiles
- **Monte Carlo Simulation**: Statistical analysis with thousands of simulations

### Trading Profiles
- **Save/Load**: Store different trading configurations
- **Import/Export**: Backup and share profiles as JSON files
- **Cross-Tab Sync**: Profiles work across all game modes

### Data Persistence
- **Local Storage**: Profiles are saved in your browser
- **Export Backup**: Download profiles for safekeeping
- **Import Restore**: Upload profiles to restore configurations

## 🔧 Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests (if available)
npm test

# Eject configuration (advanced users only)
npm run eject
```

## 📁 Project Structure

```
marble-trading-game/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   └── ui/          # UI components
│   ├── App.jsx          # Main application
│   ├── AdHocMarbleGame_Fixed.jsx
│   ├── MonteCarloMarbleGame_Complete.jsx
│   └── index.js         # Entry point
├── package.json
├── README.md
└── INSTALL.md          # This file
```

## 🛠️ Troubleshooting

### Common Installation Issues

#### 1. npm install Fails with Dependency Conflicts

**Error**: `npm ERR! peer dep missing` or `ERESOLVE unable to resolve dependency tree`

**Solutions**:
```bash
# Option 1: Force installation (ignores peer dependency warnings)
npm install --force

# Option 2: Use legacy peer deps
npm install --legacy-peer-deps

# Option 3: Clear cache and retry
npm cache clean --force
npm install
```

#### 2. Permission Denied Errors (Linux/macOS)

**Error**: `EACCES: permission denied` or `npm ERR! Error: EACCES`

**Solutions**:
```bash
# Option 1: Use sudo (not recommended for global packages)
sudo npm install

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 3: Use a Node version manager like nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
```

#### 3. Port Already in Use

**Error**: `Something is already running on port 3000`

**Solutions**:
```bash
# Option 1: Kill the process using port 3000
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Option 2: Use a different port
PORT=3001 npm start
```

#### 4. Node.js Version Issues

**Error**: `The engine "node" is incompatible with this module`

**Solutions**:
```bash
# Check your Node.js version
node --version

# Update Node.js to the latest LTS version
# Visit https://nodejs.org/ and download the latest LTS

# Or use nvm to manage versions
nvm install --lts
nvm use --lts
```

#### 5. Module Not Found Errors

**Error**: `Module not found: Can't resolve '@/components/ui/button'`

**Solutions**:
```bash
# Delete node_modules and package-lock.json, then reinstall
rm -rf node_modules package-lock.json
npm install

# Or try clearing npm cache
npm cache clean --force
npm install
```

#### 6. Build Failures

**Error**: `npm run build` fails with memory issues

**Solutions**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Or set it permanently in package.json scripts:
"build": "NODE_OPTIONS='--max-old-space-size=4096' react-scripts build"
```

### Browser Issues

#### 1. Blank Screen or White Page

**Causes & Solutions**:
- **JavaScript disabled**: Enable JavaScript in browser settings
- **Browser cache**: Clear browser cache and hard refresh (Ctrl+F5)
- **Console errors**: Open Developer Tools (F12) and check for errors
- **Compatibility**: Use a modern browser (Chrome 90+, Firefox 88+, Safari 14+)

#### 2. Profiles Not Saving

**Causes & Solutions**:
- **Private/Incognito mode**: Use regular browser window
- **Storage disabled**: Enable local storage in browser settings
- **Storage full**: Clear browser data or use export/import feature
- **Multiple tabs**: Close other tabs of the same site

#### 3. Charts Not Displaying

**Causes & Solutions**:
- **Canvas support**: Ensure browser supports HTML5 Canvas
- **Hardware acceleration**: Enable hardware acceleration in browser
- **Extensions**: Disable ad blockers or privacy extensions temporarily

### Performance Issues

#### 1. Slow Monte Carlo Simulations

**Solutions**:
- **Reduce simulations**: Start with 1,000 simulations instead of 10,000
- **Close other applications**: Free up system memory
- **Use Chrome**: Generally fastest for JavaScript calculations
- **Hardware**: Consider upgrading RAM or CPU for large simulations

#### 2. High Memory Usage

**Solutions**:
- **Refresh page**: Reload to clear memory leaks
- **Reduce simulation size**: Use fewer simulations or draws
- **Close unused tabs**: Free up browser memory
- **Restart browser**: Clear accumulated memory usage

## 🆘 Getting Help

If you continue to experience issues:

1. **Check the Console**: Open Developer Tools (F12) and look for error messages
2. **Search Issues**: Look for similar problems in the project's GitHub issues
3. **Create an Issue**: Report bugs with:
   - Your operating system and version
   - Node.js and npm versions
   - Complete error messages
   - Steps to reproduce the problem
4. **Community Support**: Ask questions in the project discussions

## 📚 Additional Resources

- **React Documentation**: https://reactjs.org/docs/
- **Node.js Documentation**: https://nodejs.org/docs/
- **npm Documentation**: https://docs.npmjs.com/
- **Recharts Documentation**: https://recharts.org/
- **Tailwind CSS**: https://tailwindcss.com/docs

## 🔄 Updating the Project

To get the latest updates:

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Restart the development server
npm start
```

## 🎯 Next Steps

Once you have the application running:

1. **Explore the Interface**: Try all three game modes
2. **Create Profiles**: Save your favorite trading configurations
3. **Run Simulations**: Test different marble probabilities and risk levels
4. **Export Data**: Backup your profiles for future use
5. **Analyze Results**: Use the Monte Carlo methodology guide to interpret results

Happy trading! 🎲📈

