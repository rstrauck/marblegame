import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Users, 
  Play, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Dice6, 
  RotateCcw,
  Download,
  Trophy,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Info,
  HelpCircle,
  Calculator,
  Shuffle,
  PieChart,
  Activity,
  User
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AdHocMarbleGame from './AdHocMarbleGame'


// Trading System Profiles
const getTradingSystemProfiles = () => [
  {
    name: "Undisciplined Trader",
    description: "Poor risk management with potential for large losses. Represents emotional trading without proper stops.",
    winRate: 50,
    expectancy: 0.450,
    marbles: [
      { name: 'Blue', color: '#3B82F6', probability: 20, multiplier: 1 },
      { name: 'Green', color: '#10B981', probability: 15, multiplier: 3 },
      { name: 'Silver', color: '#6B7280', probability: 10, multiplier: 4 },
      { name: 'Pearl', color: '#F3F4F6', probability: 5, multiplier: 7 },
      { name: 'Orange', color: '#F97316', probability: 25, multiplier: -1 },
      { name: 'Red', color: '#EF4444', probability: 15, multiplier: -2 },
      { name: 'Black', color: '#1F2937', probability: 10, multiplier: -4 }
    ]
  },
  {
    name: "Professional Momentum",
    description: "Low win rate but high reward system. Cuts losses quickly and lets winners run with trend following.",
    winRate: 35,
    expectancy: 0.830,
    marbles: [
      { name: 'Blue', color: '#3B82F6', probability: 10, multiplier: 2 },
      { name: 'Green', color: '#10B981', probability: 15, multiplier: 4 },
      { name: 'Silver', color: '#6B7280', probability: 8, multiplier: 6 },
      { name: 'Pearl', color: '#F3F4F6', probability: 2, multiplier: 10 },
      { name: 'Orange', color: '#F97316', probability: 40, multiplier: -1 },
      { name: 'Red', color: '#EF4444', probability: 20, multiplier: -1 },
      { name: 'Black', color: '#1F2937', probability: 5, multiplier: -1 }
    ]
  },
  {
    name: "Mean Reversion Master",
    description: "High win rate system targeting oversold/overbought conditions. Small consistent profits with controlled losses.",
    winRate: 75,
    expectancy: 0.580,
    marbles: [
      { name: 'Blue', color: '#3B82F6', probability: 35, multiplier: 1 },
      { name: 'Green', color: '#10B981', probability: 25, multiplier: 1.5 },
      { name: 'Silver', color: '#6B7280', probability: 15, multiplier: 2 },
      { name: 'Pearl', color: '#F3F4F6', probability: 0, multiplier: 0 },
      { name: 'Orange', color: '#F97316', probability: 15, multiplier: -1.5 },
      { name: 'Red', color: '#EF4444', probability: 8, multiplier: -2 },
      { name: 'Black', color: '#1F2937', probability: 2, multiplier: -3 }
    ]
  },
  {
    name: "Breakout Specialist",
    description: "Moderate win rate focusing on volatility expansion and range breakouts. Variable outcomes based on market conditions.",
    winRate: 45,
    expectancy: 0.760,
    marbles: [
      { name: 'Blue', color: '#3B82F6', probability: 15, multiplier: 2 },
      { name: 'Green', color: '#10B981', probability: 20, multiplier: 3 },
      { name: 'Silver', color: '#6B7280', probability: 8, multiplier: 5 },
      { name: 'Pearl', color: '#F3F4F6', probability: 2, multiplier: 8 },
      { name: 'Orange', color: '#F97316', probability: 30, multiplier: -1 },
      { name: 'Red', color: '#EF4444', probability: 20, multiplier: -1.5 },
      { name: 'Black', color: '#1F2937', probability: 5, multiplier: -2 }
    ]
  },
  {
    name: "Conservative Swing",
    description: "Balanced approach with good risk management. Targets multi-day trends with reasonable risk-reward ratios.",
    winRate: 60,
    expectancy: 0.835,
    marbles: [
      { name: 'Blue', color: '#3B82F6', probability: 25, multiplier: 1.5 },
      { name: 'Green', color: '#10B981', probability: 20, multiplier: 2.5 },
      { name: 'Silver', color: '#6B7280', probability: 15, multiplier: 3 },
      { name: 'Pearl', color: '#F3F4F6', probability: 0, multiplier: 0 },
      { name: 'Orange', color: '#F97316', probability: 25, multiplier: -1 },
      { name: 'Red', color: '#EF4444', probability: 12, multiplier: -1.5 },
      { name: 'Black', color: '#1F2937', probability: 3, multiplier: -2 }
    ]
  },
  {
    name: "Aggressive Scalper",
    description: "Very high win rate with small profits. Focuses on quick entries and exits with tight risk control.",
    winRate: 85,
    expectancy: 0.425,
    marbles: [
      { name: 'Blue', color: '#3B82F6', probability: 45, multiplier: 0.5 },
      { name: 'Green', color: '#10B981', probability: 30, multiplier: 0.8 },
      { name: 'Silver', color: '#6B7280', probability: 10, multiplier: 1.2 },
      { name: 'Pearl', color: '#F3F4F6', probability: 0, multiplier: 0 },
      { name: 'Orange', color: '#F97316', probability: 10, multiplier: -0.8 },
      { name: 'Red', color: '#EF4444', probability: 4, multiplier: -1.5 },
      { name: 'Black', color: '#1F2937', probability: 1, multiplier: -2 }
    ]
  },
  {
    name: "Trend Following Pro",
    description: "Low win rate but captures major trends. Patient system that waits for strong directional moves.",
    winRate: 40,
    expectancy: 1.600,
    marbles: [
      { name: 'Blue', color: '#3B82F6', probability: 12, multiplier: 3 },
      { name: 'Green', color: '#10B981', probability: 18, multiplier: 5 },
      { name: 'Silver', color: '#6B7280', probability: 8, multiplier: 8 },
      { name: 'Pearl', color: '#F3F4F6', probability: 2, multiplier: 15 },
      { name: 'Orange', color: '#F97316', probability: 35, multiplier: -1 },
      { name: 'Red', color: '#EF4444', probability: 20, multiplier: -1 },
      { name: 'Black', color: '#1F2937', probability: 5, multiplier: -1 }
    ]
  },
  {
    name: "Statistical Arbitrage",
    description: "High frequency system with very high win rate. Exploits small statistical edges with tight risk control.",
    winRate: 80,
    expectancy: 0.455,
    marbles: [
      { name: 'Blue', color: '#3B82F6', probability: 40, multiplier: 0.6 },
      { name: 'Green', color: '#10B981', probability: 25, multiplier: 1 },
      { name: 'Silver', color: '#6B7280', probability: 15, multiplier: 1.5 },
      { name: 'Pearl', color: '#F3F4F6', probability: 0, multiplier: 0 },
      { name: 'Orange', color: '#F97316', probability: 12, multiplier: -1 },
      { name: 'Red', color: '#EF4444', probability: 6, multiplier: -1.5 },
      { name: 'Black', color: '#1F2937', probability: 2, multiplier: -2.5 }
    ]
  },
  {
    name: "News/Event Trader",
    description: "Moderate win rate with high volatility outcomes. Trades around earnings, news, and market events.",
    winRate: 55,
    expectancy: 1.150,
    marbles: [
      { name: 'Blue', color: '#3B82F6', probability: 20, multiplier: 2 },
      { name: 'Green', color: '#10B981', probability: 15, multiplier: 4 },
      { name: 'Silver', color: '#6B7280', probability: 15, multiplier: 6 },
      { name: 'Pearl', color: '#F3F4F6', probability: 5, multiplier: 10 },
      { name: 'Orange', color: '#F97316', probability: 20, multiplier: -2 },
      { name: 'Red', color: '#EF4444', probability: 15, multiplier: -3 },
      { name: 'Black', color: '#1F2937', probability: 10, multiplier: -4 }
    ]
  },
  {
    name: "Novice Trader",
    description: "Poor performance with inconsistent results. Represents beginner mistakes like no stops, revenge trading, and FOMO.",
    winRate: 35,
    expectancy: -1.060,
    marbles: [
      { name: 'Blue', color: '#3B82F6', probability: 15, multiplier: 1 },
      { name: 'Green', color: '#10B981', probability: 10, multiplier: 2 },
      { name: 'Silver', color: '#6B7280', probability: 8, multiplier: 3 },
      { name: 'Pearl', color: '#F3F4F6', probability: 2, multiplier: 5 },
      { name: 'Orange', color: '#F97316', probability: 25, multiplier: -1.5 },
      { name: 'Red', color: '#EF4444', probability: 25, multiplier: -2.5 },
      { name: 'Black', color: '#1F2937', probability: 15, multiplier: -5 }
    ]
  }
]

import './App.css'

// Apply trading profile function
const applyTradingProfile = (profile, setMarbles) => {
  setMarbles([...profile.marbles])
}

// Default marble configuration
const DEFAULT_MARBLES = [
  { id: 'blue', name: 'Blue', color: '#1E3A8A', bgColor: 'bg-blue-800', probability: 20, multiplier: 1, type: 'win' },
  { id: 'green', name: 'Green', color: '#166534', bgColor: 'bg-green-800', probability: 15, multiplier: 3, type: 'win' },
  { id: 'silver', name: 'Silver', color: '#64748B', bgColor: 'bg-slate-600', probability: 10, multiplier: 4, type: 'win' },
  { id: 'pearl', name: 'Pearl', color: '#F8FAFC', bgColor: 'bg-slate-100', probability: 5, multiplier: 7, type: 'win' },
  { id: 'orange', name: 'Orange', color: '#EA580C', bgColor: 'bg-orange-600', probability: 25, multiplier: -1, type: 'loss' },
  { id: 'red', name: 'Red', color: '#DC2626', bgColor: 'bg-red-600', probability: 15, multiplier: -2, type: 'loss' },
  { id: 'black', name: 'Black', color: '#1F2937', bgColor: 'bg-gray-800', probability: 10, multiplier: -4, type: 'loss' }
]

// Default players
const DEFAULT_PLAYERS = [
  { id: 1, name: 'Vic', objective: 'Shoot for the moon!', riskPercentage: 20 },
  { id: 2, name: 'Cassie', objective: 'No losses strategy', riskPercentage: 5 },
  { id: 3, name: 'William', objective: 'Balanced 30% target', riskPercentage: 10 },
  { id: 4, name: 'Alex', objective: 'Conservative growth', riskPercentage: 8 }
]

// Statistics glossary
  const STATISTICS_GLOSSARY = {
    'Total Return': {
      description: 'The absolute dollar amount gained or lost from the starting equity.',
      formula: 'Final Equity - Starting Equity',
      interpretation: 'Positive values indicate profit, negative values indicate loss.'
    },
    'Return %': {
      description: 'The percentage change from the starting equity to the final equity.',
      formula: '(Final Equity - Starting Equity) / Starting Equity × 100',
      interpretation: 'Shows the relative performance. 10% means the account grew by 10%.'
    },
    'Expectancy': {
      description: 'The average dollar amount expected to be won or lost per draw.',
      formula: '(Win Rate × Average Win) - (Loss Rate × Average Loss)',
      interpretation: 'Positive expectancy means the strategy is profitable long-term.'
    },
    'R Multiple Expectancy': {
      description: 'The average R multiple of all draws actually taken in the simulation.',
      formula: 'Sum of all R Multiples ÷ Total Number of Draws',
      interpretation: 'Shows the actual average R multiple drawn. Different from theoretical expectancy as it reflects what actually happened.'
    },
    'Sharpe Ratio': {
      description: 'A measure of risk-adjusted return, showing return per unit of volatility.',
      formula: '(Average Return - Risk-free Rate) / Standard Deviation of Returns',
      interpretation: 'Higher values indicate better risk-adjusted performance. Above 1.0 is good, above 2.0 is excellent.'
    },
    'Max Drawdown': {
      description: 'The largest peak-to-trough decline in equity during the simulation.',
      formula: 'Maximum of: (Peak Equity - Current Equity) / Peak Equity × 100',
      interpretation: 'Shows the worst losing streak. Lower values indicate better capital preservation.'
    },
    'Win Rate': {
      description: 'The percentage of draws that resulted in positive returns.',
      formula: 'Number of Winning Draws / Total Draws × 100',
      interpretation: 'Higher win rates indicate more consistent positive outcomes.'
    },
    'Profit Factor': {
      description: 'The ratio of gross profit to gross loss.',
      formula: 'Total Gross Profit / Total Gross Loss',
      interpretation: 'Values above 1.0 indicate profitability. Higher values show better profit efficiency.'
    },
    'Volatility': {
      description: 'The standard deviation of returns, measuring the variability of results.',
      formula: 'Standard Deviation of all return percentages',
      interpretation: 'Lower values indicate more consistent returns. Higher values show more variability.'
    },
    'Average Win': {
      description: 'The average dollar amount gained on winning draws.',
      formula: 'Sum of all positive returns / Number of winning draws',
      interpretation: 'Shows the typical profit when the strategy works.'
    },
    'Average Loss': {
      description: 'The average dollar amount lost on losing draws.',
      formula: 'Sum of all negative returns / Number of losing draws',
      interpretation: 'Shows the typical loss when the strategy fails.'
    },
    'Recovery Factor': {
      description: 'The ratio of total return to maximum drawdown.',
      formula: 'Total Return % / Maximum Drawdown %',
      interpretation: 'Higher values indicate better ability to recover from losses.'
    },
    'Calmar Ratio': {
      description: 'The ratio of annualized return to maximum drawdown.',
      formula: 'Annualized Return % / Maximum Drawdown %',
      interpretation: 'Similar to Recovery Factor but annualized. Higher values are better.'
    }
  }

function App() {
  const [gameState, setGameState] = useState('setup') // 'setup', 'simulating', 'results'
  const [activeTab, setActiveTab] = useState('overview')
  
  // Configuration state
  const [marbles, setMarbles] = useState(DEFAULT_MARBLES)
  const [players, setPlayers] = useState(DEFAULT_PLAYERS)
  const [startingEquity, setStartingEquity] = useState(10000)
  const [numberOfDraws, setNumberOfDraws] = useState(50)
  
  // Simulation state
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [simulationResults, setSimulationResults] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [drawSummary, setDrawSummary] = useState([])
  const [glossaryOpen, setGlossaryOpen] = useState(false)

  // Enhanced marble game logic (JavaScript version)
  class EnhancedMarbleGame {
    constructor(startingEquity) {
      this.startingEquity = startingEquity
      this.marbles = []
      this.players = []
      this.drawHistory = [] // Track all draws with R multiples
    }

    setMarbles(marbles) {
      // Convert percentages to decimals and validate
      const marblesWithDecimalProb = marbles.map(m => ({
        ...m,
        probability: m.probability / 100
      }))
      
      const totalProb = marblesWithDecimalProb.reduce((sum, m) => sum + m.probability, 0)
      if (Math.abs(totalProb - 1.0) > 0.001) {
        throw new Error(`Probabilities must sum to 100%, got ${(totalProb * 100).toFixed(1)}%`)
      }
      
      this.marbles = marblesWithDecimalProb
    }

    addPlayer(player) {
      this.players.push({
        ...player,
        riskPercentage: player.riskPercentage / 100,
        equityHistory: [this.startingEquity],
        drawResults: [],
        statistics: {}
      })
    }

    drawMarble() {
      const rand = Math.random()
      let cumulativeProb = 0
      
      for (const marble of this.marbles) {
        cumulativeProb += marble.probability
        if (rand <= cumulativeProb) {
          return marble
        }
      }
      
      return this.marbles[this.marbles.length - 1]
    }

    async simulateDraws(numDraws, onProgress) {
      // Reset players and draw history
      this.players.forEach(player => {
        player.equityHistory = [this.startingEquity]
        player.drawResults = []
        player.statistics = {}
      })
      this.drawHistory = []

      // Simulate draws with progress updates
      for (let drawNum = 0; drawNum < numDraws; drawNum++) {
        const drawnMarble = this.drawMarble()
        
        // Record the draw in history
        this.drawHistory.push({
          drawNumber: drawNum + 1,
          marbleName: drawnMarble.name,
          rMultiple: drawnMarble.multiplier,
          marbleColor: drawnMarble.color
        })
        
        this.players.forEach(player => {
          const currentEquity = player.equityHistory[player.equityHistory.length - 1]
          const riskAmount = currentEquity * player.riskPercentage
          const resultAmount = riskAmount * drawnMarble.multiplier
          const newEquity = currentEquity + resultAmount
          
          const drawResult = {
            drawNumber: drawNum + 1,
            marble: { ...drawnMarble },
            riskAmount,
            resultAmount,
            equityBefore: currentEquity,
            equityAfter: newEquity,
            rMultiple: drawnMarble.multiplier
          }
          
          player.drawResults.push(drawResult)
          player.equityHistory.push(newEquity)
        })

        // Update progress
        if (onProgress) {
          onProgress(((drawNum + 1) / numDraws) * 100)
        }

        // Add small delay for visual effect
        if (drawNum % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      // Calculate statistics
      this.players.forEach(player => {
        player.statistics = this.calculatePlayerStatistics(player)
      })

      return {
        players: this.players.map(player => ({
          name: player.name,
          objective: player.objective,
          riskPercentage: player.riskPercentage * 100,
          finalEquity: player.equityHistory[player.equityHistory.length - 1],
          statistics: player.statistics,
          equityHistory: player.equityHistory,
          drawResults: player.drawResults,
          detailedResults: player.statistics.detailedResults || [] // Include detailed results
        })),
        simulationSummary: {
          numDraws,
          startingEquity: this.startingEquity,
          marblesUsed: [...this.marbles]
        },
        drawHistory: this.drawHistory
      }
    }

    calculatePlayerStatistics(player) {
      if (!player.drawResults.length) return {}

      const { drawResults, equityHistory } = player
      const finalEquity = equityHistory[equityHistory.length - 1]
      const totalReturn = finalEquity - this.startingEquity
      const totalReturnPct = (totalReturn / this.startingEquity) * 100

      // Win/Loss analysis
      const wins = drawResults.filter(r => r.resultAmount > 0)
      const losses = drawResults.filter(r => r.resultAmount < 0)
      
      const winRate = (wins.length / drawResults.length) * 100
      const avgWin = wins.length ? wins.reduce((sum, w) => sum + w.resultAmount, 0) / wins.length : 0
      const avgLoss = losses.length ? losses.reduce((sum, l) => sum + l.resultAmount, 0) / losses.length : 0

      // R Multiple Expectancy - average of all R multiples drawn
      const rMultipleExpectancy = drawResults.reduce((sum, r) => sum + r.rMultiple, 0) / drawResults.length

      // Create detailed results for each draw
      const detailedResults = drawResults.map((result, index) => {
        const runningRMultiples = drawResults.slice(0, index + 1).map(r => r.rMultiple)
        const runningAvgRMultiple = runningRMultiples.reduce((sum, r) => sum + r, 0) / runningRMultiples.length
        
        return {
          drawNumber: result.drawNumber,
          marbleDrawn: result.marble.name,
          rMultiple: result.rMultiple,
          amountRisked: result.riskAmount,
          amountGainedLost: result.resultAmount,
          runningAvgRMultiple: runningAvgRMultiple,
          equityAfterDraw: result.equityAfter
        }
      })

      // Returns calculation
      const returns = []
      for (let i = 1; i < equityHistory.length; i++) {
        if (equityHistory[i - 1] !== 0) {
          const ret = (equityHistory[i] - equityHistory[i - 1]) / equityHistory[i - 1]
          returns.push(ret)
        }
      }

      // Expectancy
      const expectancy = drawResults.reduce((sum, r) => sum + r.resultAmount, 0) / drawResults.length

      // Standard deviation
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      const stdDev = Math.sqrt(variance)

      // Sharpe Ratio
      const sharpeRatio = stdDev !== 0 ? avgReturn / stdDev : 0

      // Maximum Drawdown
      const maxDrawdown = this.calculateMaxDrawdown(equityHistory)
      const maxDrawdownPct = (maxDrawdown / this.startingEquity) * 100

      // Profit Factor
      const grossProfit = wins.reduce((sum, w) => sum + w.resultAmount, 0)
      const grossLoss = Math.abs(losses.reduce((sum, l) => sum + l.resultAmount, 0))
      const profitFactor = grossLoss !== 0 ? grossProfit / grossLoss : Infinity

      // Recovery Factor
      const recoveryFactor = maxDrawdown !== 0 ? totalReturn / Math.abs(maxDrawdown) : Infinity

      // Calmar Ratio
      const calmarRatio = maxDrawdownPct !== 0 ? totalReturnPct / Math.abs(maxDrawdownPct) : Infinity

      return {
        totalReturn,
        totalReturnPct,
        expectancy,
        rMultipleExpectancy, // New statistic
        sharpeRatio,
        maxDrawdown,
        maxDrawdownPct,
        winRate,
        avgWin,
        avgLoss,
        stdDeviation: stdDev,
        volatility: stdDev * Math.sqrt(returns.length) * 100,
        profitFactor,
        recoveryFactor,
        calmarRatio,
        numWins: wins.length,
        numLosses: losses.length,
        totalDraws: drawResults.length,
        grossProfit,
        grossLoss,
        detailedResults // New detailed results array
      }
    }

    calculateMaxDrawdown(equityHistory) {
      if (equityHistory.length < 2) return 0

      let peak = equityHistory[0]
      let maxDrawdown = 0

      for (let i = 1; i < equityHistory.length; i++) {
        if (equityHistory[i] > peak) {
          peak = equityHistory[i]
        }
        
        const drawdown = peak - equityHistory[i]
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown
        }
      }

      return maxDrawdown
    }
  }

  // Validation functions
  const validateMarbles = () => {
    const totalProb = marbles.reduce((sum, marble) => sum + marble.probability, 0)
    return Math.abs(totalProb - 100) < 0.1
  }

  const validatePlayers = () => {
    return players.every(player => 
      player.name.trim() !== '' && 
      player.objective.trim() !== '' && 
      player.riskPercentage > 0 && 
      player.riskPercentage <= 100
    )
  }

  // Handlers
  const updateMarble = (index, field, value) => {
    const newMarbles = [...marbles]
    newMarbles[index] = { ...newMarbles[index], [field]: parseFloat(value) || 0 }
    setMarbles(newMarbles)
  }

  const updatePlayer = (index, field, value) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setPlayers(newPlayers)
  }

  const runSimulation = async () => {
    if (!validateMarbles()) {
      alert('Marble probabilities must sum to 100%')
      return
    }

    if (!validatePlayers()) {
      alert('Please fill in all player information with valid risk percentages')
      return
    }

    setIsSimulating(true)
    setGameState('simulating')
    setSimulationProgress(0)

    try {
      const game = new EnhancedMarbleGame(startingEquity)
      game.setMarbles(marbles)
      
      players.forEach(player => {
        game.addPlayer(player)
      })

      const results = await game.simulateDraws(numberOfDraws, setSimulationProgress)
      setSimulationResults(results)
      
      // Calculate draw summary
      const summary = results.drawHistory.reduce((acc, draw) => {
        const existing = acc.find(item => item.rMultiple === draw.rMultiple)
        if (existing) {
          existing.count++
        } else {
          acc.push({
            rMultiple: draw.rMultiple,
            marbleName: draw.marbleName,
            marbleColor: draw.marbleColor,
            count: 1
          })
        }
        return acc
      }, [])
      
      // Sort by R multiple
      summary.sort((a, b) => b.rMultiple - a.rMultiple)
      
      // Calculate average R multiple
      const totalRMultiples = results.drawHistory.reduce((sum, draw) => sum + draw.rMultiple, 0)
      const averageRMultiple = totalRMultiples / results.drawHistory.length
      
      setDrawSummary({
        summary,
        averageRMultiple,
        totalDraws: results.drawHistory.length
      })
      
      setGameState('results')
    } catch (error) {
      alert(`Simulation error: ${error.message}`)
      setGameState('setup')
    } finally {
      setIsSimulating(false)
    }
  }

  const resetSimulation = () => {
    setGameState('setup')
    setSimulationResults(null)
    setSimulationProgress(0)
    setActiveTab('overview')
    setDrawSummary([])
  }

  const exportResults = () => {
    if (!simulationResults) return
    
    const exportData = {
      ...simulationResults,
      drawSummary
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'marble-game-results.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  // Custom tooltip for equity chart showing R multiples
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length && simulationResults) {
      const drawData = simulationResults.drawHistory[label - 1] // label is draw number (1-based)
      
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">Draw #{label}</p>
          {drawData && (
            <div className="mt-2 mb-2">
              <p className="text-slate-300 text-sm">
                Marble: <span style={{ color: drawData.marbleColor }}>{drawData.marbleName}</span>
              </p>
              <p className="text-slate-300 text-sm">
                R Multiple: <span className={drawData.rMultiple > 0 ? 'text-green-400' : 'text-red-400'}>
                  {drawData.rMultiple > 0 ? '+' : ''}{drawData.rMultiple}R
                </span>
              </p>
            </div>
          )}
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Render functions
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Position Sizing Introduction */}
      <Card className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-500/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            The Critical Importance of Position Sizing in Trading
          </CardTitle>
          <CardDescription className="text-orange-200">
            Why position sizing is the most important factor in trading success or failure
          </CardDescription>
        </CardHeader>
        <CardContent className="text-slate-200 space-y-4">
          <p className="text-lg leading-relaxed">
            <strong>Position sizing is the single most critical factor that determines your trading success.</strong> 
            It's not about being right or wrong on individual trades—it's about how much you risk on each trade 
            that ultimately determines whether you build wealth or blow up your account.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded bg-red-900/40 border border-red-500/50">
              <h4 className="text-red-300 font-semibold mb-2 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Risk Too Little
              </h4>
              <p className="text-sm text-red-100">
                <strong>Problem:</strong> Your account grows painfully slowly, even with good trades. 
                You make tiny profits that barely beat inflation. Years pass with minimal progress.
              </p>
              <p className="text-xs text-red-200 mt-2 italic">
                "I'm always right, but I never make any real money."
              </p>
            </div>
            
            <div className="p-4 rounded bg-yellow-900/40 border border-yellow-500/50">
              <h4 className="text-yellow-300 font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Risk Optimally
              </h4>
              <p className="text-sm text-yellow-100">
                <strong>Sweet Spot:</strong> You balance growth with survival. Meaningful profits 
                when you're right, manageable losses when you're wrong. Steady compound growth.
              </p>
              <p className="text-xs text-yellow-200 mt-2 italic">
                "I'm building wealth consistently over time."
              </p>
            </div>
            
            <div className="p-4 rounded bg-red-900/60 border border-red-400/70">
              <h4 className="text-red-200 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risk Too Much
              </h4>
              <p className="text-sm text-red-100">
                <strong>Disaster:</strong> You make huge gains initially, feel invincible, then hit 
                a losing streak. Massive drawdowns wipe out months of profits. Account eventually blows up.
              </p>
              <p className="text-xs text-red-200 mt-2 italic">
                "I was up 300%, now I'm down 80%. What happened?"
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded bg-slate-700/50 border border-slate-500">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              The Position Sizing Reality
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="mb-2"><strong className="text-green-400">The Math is Unforgiving:</strong></p>
                <ul className="space-y-1 text-slate-300">
                  <li>• Lose 50% → Need 100% gain to break even</li>
                  <li>• Lose 75% → Need 300% gain to break even</li>
                  <li>• Lose 90% → Need 900% gain to break even</li>
                </ul>
              </div>
              <div>
                <p className="mb-2"><strong className="text-orange-400">Professional Traders Know:</strong></p>
                <ul className="space-y-1 text-slate-300">
                  <li>• Risk 1-2% per trade for steady growth</li>
                  <li>• Risk 5%+ per trade for high volatility</li>
                  <li>• Risk 10%+ per trade for eventual ruin</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded bg-blue-900/30 border border-blue-500/50">
            <p className="text-blue-100 text-center">
              <strong>This simulation lets you experience different position sizing strategies risk-free.</strong> 
              See how different risk percentages affect your equity curve, drawdowns, and long-term survival. 
              Learn the lessons without losing real money.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Game Introduction */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Game Overview
          </CardTitle>
          <CardDescription className="text-slate-300">
            Understanding the Enhanced Marble Game simulation system
          </CardDescription>
        </CardHeader>
        <CardContent className="text-slate-300 space-y-4">
          <p>
            The Enhanced Marble Game is a sophisticated risk simulation tool that models investment strategies 
            through a marble-drawing mechanism. Each marble represents a different outcome with specific 
            probabilities and return multipliers (R values).
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded bg-slate-700/30">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Purpose
              </h4>
              <p className="text-sm">
                Test different risk management strategies and analyze their performance through 
                statistical simulation with configurable parameters.
              </p>
            </div>
            <div className="p-4 rounded bg-slate-700/30">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Multi-Player
              </h4>
              <p className="text-sm">
                Compare up to 4 different strategies simultaneously, each with unique risk 
                percentages and objectives.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How Marble Drawing Works */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shuffle className="w-5 h-5" />
            Marble Drawing Mechanism
          </CardTitle>
          <CardDescription className="text-slate-300">
            How each draw is determined and why results match configured probabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="text-slate-300 space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-3">Random Number Generation</h4>
              <div className="space-y-3">
                <div className="p-3 rounded bg-slate-700/30">
                  <p className="text-sm">
                    <strong>Step 1:</strong> Generate a random number between 0 and 1 using JavaScript's 
                    <code className="bg-slate-800 px-1 mx-1 rounded">Math.random()</code>
                  </p>
                </div>
                <div className="p-3 rounded bg-slate-700/30">
                  <p className="text-sm">
                    <strong>Step 2:</strong> Compare this number against cumulative probability ranges 
                    to determine which marble is drawn
                  </p>
                </div>
                <div className="p-3 rounded bg-slate-700/30">
                  <p className="text-sm">
                    <strong>Step 3:</strong> Apply the marble's R multiple to calculate the result 
                    for each player based on their risk percentage
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-3">Probability Mapping</h4>
              <div className="space-y-2">
                {DEFAULT_MARBLES.map((marble, index) => {
                  const cumulativeStart = DEFAULT_MARBLES.slice(0, index).reduce((sum, m) => sum + m.probability, 0)
                  const cumulativeEnd = cumulativeStart + marble.probability
                  return (
                    <div key={marble.id} className="flex items-center justify-between p-2 rounded bg-slate-700/30">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${marble.bgColor} ${marble.name === 'Pearl' ? 'border border-gray-400' : ''}`}></div>
                        <span className="text-sm">{marble.name}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {(cumulativeStart / 100).toFixed(3)} - {(cumulativeEnd / 100).toFixed(3)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Probability System */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Probability System & Accuracy
          </CardTitle>
          <CardDescription className="text-slate-300">
            How the system ensures simulation results match configured probabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="text-slate-300 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded bg-green-900/20 border border-green-500/30">
              <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Mathematical Foundation
              </h4>
              <p className="text-sm">
                Uses cumulative probability distribution where each marble occupies a specific 
                range proportional to its configured probability percentage.
              </p>
            </div>
            
            <div className="p-4 rounded bg-blue-900/20 border border-blue-500/30">
              <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Law of Large Numbers
              </h4>
              <p className="text-sm">
                As the number of draws increases, the actual frequency of each marble 
                converges toward its configured probability.
              </p>
            </div>
            
            <div className="p-4 rounded bg-purple-900/20 border border-purple-500/30">
              <h4 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Validation System
              </h4>
              <p className="text-sm">
                The system validates that all marble probabilities sum to exactly 100% 
                before running any simulation.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-white font-semibold mb-3">Example: How a Draw is Determined</h4>
            <div className="p-4 rounded bg-slate-700/30">
              <div className="space-y-2 text-sm">
                <p><strong>Random Number Generated:</strong> 0.347</p>
                <p><strong>Probability Ranges:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Blue (20%): 0.000 - 0.200 ❌</li>
                  <li>• Green (15%): 0.200 - 0.350 ❌</li>
                  <li>• Silver (10%): 0.350 - 0.450 ✅ <strong>SELECTED</strong></li>
                  <li>• Pearl (5%): 0.450 - 0.500</li>
                  <li>• Orange (25%): 0.500 - 0.750</li>
                  <li>• Red (15%): 0.750 - 0.900</li>
                  <li>• Black (10%): 0.900 - 1.000</li>
                </ul>
                <p><strong>Result:</strong> Silver marble drawn with +4R multiplier</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Risk Calculation */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Risk Calculation & Player Impact
          </CardTitle>
          <CardDescription className="text-slate-300">
            How each player's risk percentage affects their results
          </CardDescription>
        </CardHeader>
        <CardContent className="text-slate-300 space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-3">Calculation Formula</h4>
              <div className="p-4 rounded bg-slate-700/30">
                <div className="space-y-2 text-sm font-mono">
                  <p><strong>Risk Amount = Current Equity × Risk Percentage</strong></p>
                  <p><strong>Result Amount = Risk Amount × R Multiple</strong></p>
                  <p><strong>New Equity = Current Equity + Result Amount</strong></p>
                </div>
              </div>
              
              <h4 className="text-white font-semibold mb-3 mt-4">Example Calculation</h4>
              <div className="p-4 rounded bg-slate-700/30">
                <div className="space-y-1 text-sm">
                  <p>Player: William (10% risk)</p>
                  <p>Current Equity: $15,000</p>
                  <p>Marble Drawn: Green (+3R)</p>
                  <Separator className="my-2 bg-slate-600" />
                  <p>Risk Amount: $15,000 × 10% = $1,500</p>
                  <p>Result Amount: $1,500 × 3 = $4,500</p>
                  <p>New Equity: $15,000 + $4,500 = $19,500</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-3">Risk Percentage Impact</h4>
              <div className="space-y-3">
                <div className="p-3 rounded bg-red-900/20 border border-red-500/30">
                  <h5 className="text-red-400 font-medium">High Risk (15-25%)</h5>
                  <p className="text-sm">Larger position sizes lead to higher potential gains and losses. 
                  More volatile equity curves with greater drawdowns.</p>
                </div>
                
                <div className="p-3 rounded bg-yellow-900/20 border border-yellow-500/30">
                  <h5 className="text-yellow-400 font-medium">Medium Risk (8-15%)</h5>
                  <p className="text-sm">Balanced approach with moderate position sizes. 
                  Reasonable growth potential with manageable risk.</p>
                </div>
                
                <div className="p-3 rounded bg-green-900/20 border border-green-500/30">
                  <h5 className="text-green-400 font-medium">Low Risk (1-8%)</h5>
                  <p className="text-sm">Conservative position sizes with lower volatility. 
                  Slower growth but better capital preservation.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistical Accuracy */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Statistical Accuracy & Convergence
          </CardTitle>
          <CardDescription className="text-slate-300">
            Why simulation results closely match theoretical expectations
          </CardDescription>
        </CardHeader>
        <CardContent className="text-slate-300 space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-3">Theoretical vs Actual Results</h4>
              <div className="space-y-3">
                <div className="p-3 rounded bg-slate-700/30">
                  <h5 className="text-white font-medium mb-1">Expected Value Calculation</h5>
                  <p className="text-sm">
                    The theoretical expected value per draw is calculated as the sum of 
                    (Probability × R Multiple) for all marbles.
                  </p>
                </div>
                
                <div className="p-3 rounded bg-slate-700/30">
                  <h5 className="text-white font-medium mb-1">Default Configuration</h5>
                  <div className="text-xs space-y-1">
                    <p>Blue: 20% × 1R = 0.20</p>
                    <p>Green: 15% × 3R = 0.45</p>
                    <p>Silver: 10% × 4R = 0.40</p>
                    <p>Pearl: 5% × 7R = 0.35</p>
                    <p>Orange: 25% × (-1R) = -0.25</p>
                    <p>Red: 15% × (-2R) = -0.30</p>
                    <p>Black: 10% × (-4R) = -0.40</p>
                    <Separator className="my-1 bg-slate-600" />
                    <p className="text-green-400"><strong>Expected Value: +0.45R per draw</strong></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-3">Convergence Factors</h4>
              <div className="space-y-3">
                <div className="p-3 rounded bg-blue-900/20 border border-blue-500/30">
                  <h5 className="text-blue-400 font-medium">Sample Size</h5>
                  <p className="text-sm">
                    Larger numbers of draws (100+) produce results closer to theoretical expectations. 
                    Smaller samples may show more variance.
                  </p>
                </div>
                
                <div className="p-3 rounded bg-purple-900/20 border border-purple-500/30">
                  <h5 className="text-purple-400 font-medium">Random Seed Quality</h5>
                  <p className="text-sm">
                    JavaScript's Math.random() provides high-quality pseudorandom numbers 
                    suitable for statistical simulation.
                  </p>
                </div>
                
                <div className="p-3 rounded bg-green-900/20 border border-green-500/30">
                  <h5 className="text-green-400 font-medium">Validation Checks</h5>
                  <p className="text-sm">
                    The system includes multiple validation layers to ensure probability 
                    integrity and calculation accuracy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Play className="w-5 h-5" />
            Getting Started
          </CardTitle>
          <CardDescription className="text-slate-300">
            Step-by-step guide to running your first simulation
          </CardDescription>
        </CardHeader>
        <CardContent className="text-slate-300">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-white font-semibold">Configuration Steps</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>
                    <p className="font-medium">Configure Marbles</p>
                    <p className="text-sm text-slate-400">Set probabilities and R multiples (must sum to 100%)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <div>
                    <p className="font-medium">Set Up Players</p>
                    <p className="text-sm text-slate-400">Define names, objectives, and risk percentages</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <div>
                    <p className="font-medium">Simulation Settings</p>
                    <p className="text-sm text-slate-400">Choose starting equity and number of draws</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">4</Badge>
                  <div>
                    <p className="font-medium">Run & Analyze</p>
                    <p className="text-sm text-slate-400">Execute simulation and review comprehensive results</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-white font-semibold">Key Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Configurable marble probabilities and multipliers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Multi-player strategy comparison</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Comprehensive statistical analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Interactive equity curves with R multiple tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Draw summary and frequency analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Built-in statistics glossary</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Export results for further analysis</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderMarbleSetup = () => {
    // Calculate theoretical expectancy
    const calculateTheoreticalExpectancy = () => {
      return marbles.reduce((expectancy, marble) => {
        return expectancy + (marble.probability / 100) * marble.multiplier
      }, 0)
    }

    const theoreticalExpectancy = calculateTheoreticalExpectancy()
    const totalProbability = marbles.reduce((sum, marble) => sum + marble.probability, 0)
    const isProbabilityValid = validateMarbles()

    return (
      <div className="space-y-4">
        {/* Trading System Profiles */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Trading System Profiles
            </CardTitle>
            <CardDescription className="text-slate-300">
              Choose from realistic trading system presets or configure manually below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {getTradingSystemProfiles().map((profile, index) => (
                <button
                  key={profile.name}
                  onClick={() => applyTradingProfile(profile, setMarbles)}
                  className="p-3 rounded-lg border border-slate-600 hover:border-blue-500 hover:bg-blue-900/20 transition-all text-left"
                >
                  <div className="text-sm font-medium text-white mb-1">{profile.name}</div>
                  <div className="text-xs text-slate-400 mb-2 line-clamp-2">{profile.description}</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Win: {profile.winRate}%</span>
                    <span className="text-blue-400">Exp: {profile.expectancy > 0 ? '+' : ''}{profile.expectancy.toFixed(2)}R</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400 text-center">
              Click any profile to automatically configure the marble probabilities and R multiples
            </div>
          </CardContent>
        </Card>

        {/* Marble Configuration */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Marble Configuration
            </CardTitle>
            <CardDescription className="text-slate-300">
              Configure marble probabilities and multipliers. Probabilities must sum to 100%.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marbles.map((marble, index) => (
                <div key={marble.id} className="grid grid-cols-4 gap-4 items-center p-3 rounded bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full ${marble.bgColor} ${marble.name === 'Pearl' ? 'border border-gray-400' : ''}`}></div>
                    <span className="text-white font-medium">{marble.name}</span>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Probability (%)</Label>
                    <Input
                      type="number"
                      value={marble.probability}
                      onChange={(e) => updateMarble(index, 'probability', e.target.value)}
                      className="bg-slate-600 border-slate-500 text-white"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Multiplier (R)</Label>
                    <Input
                      type="number"
                      value={marble.multiplier}
                      onChange={(e) => updateMarble(index, 'multiplier', e.target.value)}
                      className="bg-slate-600 border-slate-500 text-white"
                      step="0.1"
                    />
                  </div>
                  <div className="text-right">
                    <Badge variant={marble.multiplier > 0 ? "default" : "destructive"}>
                      {marble.multiplier > 0 ? '+' : ''}{marble.multiplier}R
                    </Badge>
                  </div>
                </div>
              ))}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                  <span className="text-white font-medium">Total Probability:</span>
                  <Badge variant={isProbabilityValid ? "default" : "destructive"}>
                    {totalProbability.toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                  <span className="text-white font-medium">Theoretical Expectancy:</span>
                  <Badge 
                    variant={theoreticalExpectancy > 0 ? "default" : theoreticalExpectancy < 0 ? "destructive" : "secondary"}
                    className={theoreticalExpectancy > 0 ? "bg-green-600" : theoreticalExpectancy < 0 ? "bg-red-600" : "bg-gray-600"}
                  >
                    {theoreticalExpectancy > 0 ? '+' : ''}{theoreticalExpectancy.toFixed(3)}R
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expectancy Explanation */}
        <Card className="bg-blue-900/20 border-blue-500/50">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2 text-sm">
              <Calculator className="w-4 h-4" />
              Theoretical Expectancy Explanation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-100 space-y-3">
            <div className="text-sm">
              <p className="mb-2">
                <strong>Expectancy = Σ(Probability × R Multiple)</strong>
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-blue-300 font-medium mb-1">Current Calculation:</p>
                  {marbles.map((marble, index) => (
                    <div key={marble.id} className="flex justify-between">
                      <span>{marble.name}:</span>
                      <span>{(marble.probability / 100).toFixed(3)} × {marble.multiplier} = {((marble.probability / 100) * marble.multiplier).toFixed(3)}</span>
                    </div>
                  ))}
                  <div className="border-t border-blue-400 mt-1 pt-1 flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{theoreticalExpectancy > 0 ? '+' : ''}{theoreticalExpectancy.toFixed(3)}R</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-blue-300 font-medium mb-1">Interpretation:</p>
                  {theoreticalExpectancy > 0 ? (
                    <div className="text-green-300">
                      <p className="mb-1">✅ <strong>Positive Edge</strong></p>
                      <p>This configuration has a mathematical advantage. On average, you expect to gain {theoreticalExpectancy.toFixed(3)}R per draw.</p>
                    </div>
                  ) : theoreticalExpectancy < 0 ? (
                    <div className="text-red-300">
                      <p className="mb-1">❌ <strong>Negative Edge</strong></p>
                      <p>This configuration has a mathematical disadvantage. On average, you expect to lose {Math.abs(theoreticalExpectancy).toFixed(3)}R per draw.</p>
                    </div>
                  ) : (
                    <div className="text-gray-300">
                      <p className="mb-1">⚖️ <strong>Break-Even</strong></p>
                      <p>This configuration is mathematically neutral. On average, you expect neither gains nor losses per draw.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPlayerSetup = () => (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Player Configuration
        </CardTitle>
        <CardDescription className="text-slate-300">
          Set up players with their objectives and risk percentages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {players.map((player, index) => (
            <div key={player.id} className="p-4 rounded bg-slate-700/50 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 text-sm">Player Name</Label>
                  <Input
                    value={player.name}
                    onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                    className="bg-slate-600 border-slate-500 text-white"
                    placeholder="Enter player name"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm">Risk Percentage (%)</Label>
                  <Input
                    type="number"
                    value={player.riskPercentage}
                    onChange={(e) => updatePlayer(index, 'riskPercentage', parseFloat(e.target.value) || 0)}
                    className="bg-slate-600 border-slate-500 text-white"
                    min="0.1"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Objective</Label>
                <Textarea
                  value={player.objective}
                  onChange={(e) => updatePlayer(index, 'objective', e.target.value)}
                  className="bg-slate-600 border-slate-500 text-white"
                  placeholder="Enter player's strategy/objective"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderSimulationSetup = () => (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Simulation Settings
        </CardTitle>
        <CardDescription className="text-slate-300">
          Configure the simulation parameters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="text-slate-300">Starting Equity ($)</Label>
            <Input
              type="number"
              value={startingEquity}
              onChange={(e) => setStartingEquity(parseFloat(e.target.value) || 10000)}
              className="bg-slate-600 border-slate-500 text-white"
              min="1000"
              step="1000"
            />
          </div>
          <div>
            <Label className="text-slate-300">Number of Draws</Label>
            <Input
              type="number"
              value={numberOfDraws}
              onChange={(e) => setNumberOfDraws(parseInt(e.target.value) || 50)}
              className="bg-slate-600 border-slate-500 text-white"
              min="10"
              max="1000"
            />
          </div>
        </div>
        
        <div className="mt-6 flex gap-4">
          <Button 
            onClick={runSimulation}
            disabled={isSimulating || !validateMarbles() || !validatePlayers()}
            className="bg-blue-600 hover:bg-blue-700 flex-1"
          >
            <Play className="w-4 h-4 mr-2" />
            {isSimulating ? 'Running Simulation...' : 'Start Simulation'}
          </Button>
          
          <Button 
            onClick={resetSimulation}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (gameState === 'simulating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700 w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Dice6 className="w-6 h-6" />
              </motion.div>
              Running Simulation
            </CardTitle>
            <CardDescription className="text-slate-300">
              Simulating {numberOfDraws} draws for {players.length} players...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={simulationProgress} className="w-full" />
              <p className="text-center text-slate-300">
                {simulationProgress.toFixed(1)}% Complete
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameState === 'results' && simulationResults) {
    const bestReturn = simulationResults.players.reduce((best, player) => 
      player.statistics.totalReturnPct > best.statistics.totalReturnPct ? player : best
    )
    
    const bestSharpe = simulationResults.players.reduce((best, player) => 
      player.statistics.sharpeRatio > best.statistics.sharpeRatio ? player : best
    )

    const lowestDrawdown = simulationResults.players.reduce((best, player) => 
      Math.abs(player.statistics.maxDrawdownPct) < Math.abs(best.statistics.maxDrawdownPct) ? player : best
    )

    // Prepare chart data with R multiples
    const chartData = []
    const maxLength = Math.max(...simulationResults.players.map(p => p.equityHistory.length))
    
    for (let i = 0; i < maxLength; i++) {
      const dataPoint = { draw: i }
      simulationResults.players.forEach(player => {
        if (i < player.equityHistory.length) {
          dataPoint[player.name] = player.equityHistory[i]
        }
      })
      chartData.push(dataPoint)
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Simulation Results</h1>
            <p className="text-slate-300">
              {numberOfDraws} draws completed for {players.length} players
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Button onClick={exportResults} variant="outline" className="border-slate-600 text-slate-300">
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
              <Button onClick={resetSimulation} className="bg-blue-600 hover:bg-blue-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Simulation
              </Button>
            </div>
          </motion.div>

          {/* Best Performers */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-green-900/20 border-green-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-400 text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Best Return
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white font-bold">{bestReturn.name}</p>
                <p className="text-green-400 text-2xl font-bold">
                  +{bestReturn.statistics.totalReturnPct.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-900/20 border-blue-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-400 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Best Sharpe Ratio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white font-bold">{bestSharpe.name}</p>
                <p className="text-blue-400 text-2xl font-bold">
                  {bestSharpe.statistics.sharpeRatio.toFixed(3)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-purple-900/20 border-purple-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Lowest Drawdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white font-bold">{lowestDrawdown.name}</p>
                <p className="text-purple-400 text-2xl font-bold">
                  {Math.abs(lowestDrawdown.statistics.maxDrawdownPct).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Equity Chart with R Multiples */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Equity Curves with R Multiples</CardTitle>
              <CardDescription className="text-slate-300">
                Performance comparison over time. Hover over points to see R multiples for each draw.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="draw" 
                      stroke="#9CA3AF"
                      label={{ value: 'Draw Number', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      label={{ value: 'Equity ($)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {simulationResults.players.map((player, index) => (
                      <Line
                        key={player.name}
                        type="monotone"
                        dataKey={player.name}
                        stroke={['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Player Statistics */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {simulationResults.players.map((player, index) => (
              <Card key={player.name} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{player.name}</span>
                    <Badge variant={player.statistics.totalReturnPct >= 0 ? "default" : "destructive"}>
                      {player.statistics.totalReturnPct >= 0 ? '+' : ''}{player.statistics.totalReturnPct.toFixed(1)}%
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    {player.objective} • {player.riskPercentage.toFixed(1)}% risk per draw
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Final Equity:</span>
                        <span className="text-white font-medium">${player.finalEquity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expectancy:</span>
                        <span className={`font-medium ${player.statistics.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${player.statistics.expectancy.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">R Multiple Expectancy:</span>
                        <span className={`font-medium ${player.statistics.rMultipleExpectancy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {player.statistics.rMultipleExpectancy >= 0 ? '+' : ''}{player.statistics.rMultipleExpectancy.toFixed(3)}R
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sharpe Ratio:</span>
                        <span className="text-white font-medium">{player.statistics.sharpeRatio.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Drawdown:</span>
                        <span className="text-red-400 font-medium">{Math.abs(player.statistics.maxDrawdownPct).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Win Rate:</span>
                        <span className="text-white font-medium">{player.statistics.winRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Profit Factor:</span>
                        <span className="text-white font-medium">
                          {isFinite(player.statistics.profitFactor) ? player.statistics.profitFactor.toFixed(2) : '∞'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Volatility:</span>
                        <span className="text-white font-medium">{player.statistics.volatility.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Win:</span>
                        <span className="text-green-400 font-medium">${player.statistics.avgWin.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Loss:</span>
                        <span className="text-red-400 font-medium">${player.statistics.avgLoss.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Draws:</span>
                        <span className="text-white font-medium">{player.statistics.totalDraws}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Note: Detailed draw-by-draw results are available in the equity curve tooltips */}
          {/* Hover over the equity curve points to see individual draw details */}

          {/* Draw Summary */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Draw Summary & R Multiple Analysis
              </CardTitle>
              <CardDescription className="text-slate-300">
                Summary of all draws with R multiples and frequency analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-medium mb-3">R Multiple Distribution</h4>
                  <div className="space-y-2">
                    {drawSummary.summary?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: item.marbleColor }}
                          ></div>
                          <span className="text-white">{item.marbleName}</span>
                          <Badge variant={item.rMultiple > 0 ? "default" : "destructive"}>
                            {item.rMultiple > 0 ? '+' : ''}{item.rMultiple}R
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-300">{item.count} times</span>
                          <span className="text-slate-400 text-sm ml-2">
                            ({((item.count / drawSummary.totalDraws) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-3">Summary Statistics</h4>
                  <div className="space-y-3">
                    <div className="p-4 rounded bg-slate-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Total Draws:</span>
                        <span className="text-white font-bold text-lg">{drawSummary.totalDraws}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded bg-slate-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Average R Multiple:</span>
                        <span className={`font-bold text-lg ${drawSummary.averageRMultiple >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {drawSummary.averageRMultiple >= 0 ? '+' : ''}{drawSummary.averageRMultiple?.toFixed(3)}R
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded bg-slate-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Positive R Draws:</span>
                        <span className="text-green-400 font-bold">
                          {drawSummary.summary?.filter(item => item.rMultiple > 0).reduce((sum, item) => sum + item.count, 0) || 0}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded bg-slate-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Negative R Draws:</span>
                        <span className="text-red-400 font-bold">
                          {drawSummary.summary?.filter(item => item.rMultiple < 0).reduce((sum, item) => sum + item.count, 0) || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Glossary */}
          <Card className="bg-slate-800/50 border-slate-700">
            <Collapsible open={glossaryOpen} onOpenChange={setGlossaryOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-slate-700/30 transition-colors">
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Statistics Glossary
                    </div>
                    {glossaryOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Detailed explanations of all statistical measures and their calculations
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(STATISTICS_GLOSSARY).map(([stat, info]) => (
                      <div key={stat} className="p-4 rounded bg-slate-700/30">
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-400" />
                          {stat}
                        </h4>
                        <p className="text-slate-300 text-sm mb-2">{info.description}</p>
                        <div className="mb-2">
                          <span className="text-slate-400 text-xs font-medium">Formula:</span>
                          <code className="text-blue-300 text-xs ml-2 bg-slate-800 px-2 py-1 rounded">
                            {info.formula}
                          </code>
                        </div>
                        <div>
                          <span className="text-slate-400 text-xs font-medium">Interpretation:</span>
                          <p className="text-slate-300 text-xs mt-1">{info.interpretation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-white mb-4">Enhanced Marble Game</h1>
          <p className="text-xl text-slate-300">
            Advanced simulation with configurable parameters and comprehensive statistics
          </p>
        </motion.div>

        {/* Configuration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="marbles" className="data-[state=active]:bg-blue-600">
              Marbles
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-blue-600">
              Players
            </TabsTrigger>
            <TabsTrigger value="simulation" className="data-[state=active]:bg-blue-600">
              Simulation
            </TabsTrigger>
            <TabsTrigger value="ad-hoc" className="data-[state=active]:bg-blue-600">
              Ad-Hoc
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview">
              {renderOverview()}
            </TabsContent>

            <TabsContent value="marbles">
              {renderMarbleSetup()}
            </TabsContent>

            <TabsContent value="players">
              {renderPlayerSetup()}
            </TabsContent>

            <TabsContent value="simulation">
              {renderSimulationSetup()}
            </TabsContent>

            <TabsContent value="ad-hoc">
              <AdHocMarbleGame />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default App

