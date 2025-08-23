import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Play, RotateCcw, BarChart3, TrendingUp, Target, BookOpen, ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

const MonteCarloMarbleGame = () => {
  // Game configuration state
  const [marbles, setMarbles] = useState([
    { name: 'Blue', color: '#3B82F6', probability: 20, multiplier: 1 },
    { name: 'Green', color: '#10B981', probability: 15, multiplier: 3 },
    { name: 'Silver', color: '#6B7280', probability: 10, multiplier: 4 },
    { name: 'Pearl', color: '#F3F4F6', probability: 5, multiplier: 7 },
    { name: 'Orange', color: '#F97316', probability: 25, multiplier: -1 },
    { name: 'Red', color: '#EF4444', probability: 15, multiplier: -2 },
    { name: 'Black', color: '#1F2937', probability: 10, multiplier: -4 }
  ])

  // Game settings
  const [startingEquity, setStartingEquity] = useState(10000)
  const [riskPercentage, setRiskPercentage] = useState(10)
  const [numberOfDraws, setNumberOfDraws] = useState(20)
  const [numberOfSimulations, setNumberOfSimulations] = useState(1000)

  // Results state
  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  // Explanation state
  const [explanationOpen, setExplanationOpen] = useState(false)

  // Validation
  const totalProbability = marbles.reduce((sum, marble) => sum + marble.probability, 0)
  const isValidConfig = totalProbability === 100 && numberOfDraws > 0 && riskPercentage > 0 && numberOfSimulations > 0

  // Calculate theoretical expectancy
  const theoreticalExpectancy = marbles.reduce((sum, marble) => 
    sum + (marble.probability / 100) * marble.multiplier, 0
  )

  // Update marble property
  const updateMarble = (index, field, value) => {
    const newMarbles = [...marbles]
    newMarbles[index][field] = field === 'probability' || field === 'multiplier' ? 
      parseFloat(value) || 0 : value
    setMarbles(newMarbles)
  }

  // Run single simulation
  const runSingleSimulation = () => {
    let currentEquity = startingEquity
    let totalRMultiples = 0
    let wins = 0
    let losses = 0
    let maxEquity = startingEquity
    let maxDrawdown = 0
    const equityHistory = [startingEquity]

    // Create cumulative probability ranges
    const ranges = []
    let cumulative = 0
    marbles.forEach(marble => {
      ranges.push({
        ...marble,
        start: cumulative / 100,
        end: (cumulative + marble.probability) / 100
      })
      cumulative += marble.probability
    })

    // Run draws
    for (let i = 0; i < numberOfDraws; i++) {
      const random = Math.random()
      const selectedMarble = ranges.find(range => random >= range.start && random < range.end)
      
      const riskAmount = currentEquity * (riskPercentage / 100)
      const resultAmount = riskAmount * selectedMarble.multiplier
      currentEquity += resultAmount
      
      totalRMultiples += selectedMarble.multiplier
      if (selectedMarble.multiplier > 0) wins++
      else losses++

      // Track max drawdown
      if (currentEquity > maxEquity) {
        maxEquity = currentEquity
      }
      const currentDrawdown = ((maxEquity - currentEquity) / maxEquity) * 100
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown
      }

      equityHistory.push(currentEquity)
    }

    const totalReturn = currentEquity - startingEquity
    const returnPercentage = (totalReturn / startingEquity) * 100
    const avgRMultiple = totalRMultiples / numberOfDraws
    const winRate = (wins / numberOfDraws) * 100

    return {
      finalEquity: currentEquity,
      totalReturn,
      returnPercentage,
      avgRMultiple,
      winRate,
      maxDrawdown,
      wins,
      losses,
      equityHistory
    }
  }

  // Run Monte Carlo simulation
  const runMonteCarloSimulation = async () => {
    if (!isValidConfig) return

    setIsRunning(true)
    setProgress(0)

    // Run simulations in batches to allow UI updates
    const batchSize = 50
    const allResults = []
    
    for (let batch = 0; batch < Math.ceil(numberOfSimulations / batchSize); batch++) {
      const batchResults = []
      const batchStart = batch * batchSize
      const batchEnd = Math.min(batchStart + batchSize, numberOfSimulations)
      
      for (let i = batchStart; i < batchEnd; i++) {
        batchResults.push(runSingleSimulation())
      }
      
      allResults.push(...batchResults)
      setProgress((batchEnd / numberOfSimulations) * 100)
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Calculate statistics
    const finalEquities = allResults.map(r => r.finalEquity)
    const returnPercentages = allResults.map(r => r.returnPercentage)
    const avgRMultiples = allResults.map(r => r.avgRMultiple)
    const maxDrawdowns = allResults.map(r => r.maxDrawdown)
    const winRates = allResults.map(r => r.winRate)

    // Sort for percentiles
    const sortedReturns = [...returnPercentages].sort((a, b) => a - b)
    const sortedEquities = [...finalEquities].sort((a, b) => a - b)
    const sortedDrawdowns = [...maxDrawdowns].sort((a, b) => a - b)

    // Calculate percentiles
    const getPercentile = (arr, percentile) => {
      const index = Math.floor((percentile / 100) * arr.length)
      return arr[Math.min(index, arr.length - 1)]
    }

    // Calculate statistics
    const mean = (arr) => arr.reduce((sum, val) => sum + val, 0) / arr.length
    const stdDev = (arr) => {
      const avg = mean(arr)
      const squareDiffs = arr.map(val => Math.pow(val - avg, 2))
      return Math.sqrt(mean(squareDiffs))
    }

    // Probability of profit
    const profitableRuns = allResults.filter(r => r.totalReturn > 0).length
    const probabilityOfProfit = (profitableRuns / numberOfSimulations) * 100

    // Create distribution data for histogram with improved range display
    const createHistogramData = (data, bins = 20) => {
      const min = Math.min(...data)
      const max = Math.max(...data)
      const binSize = (max - min) / bins
      const histogram = Array(bins).fill(0).map((_, i) => {
        const rangeStart = min + i * binSize
        const rangeEnd = min + (i + 1) * binSize
        return {
          range: `${rangeStart.toFixed(1)}%`, // Keep this for X-axis display
          rangeDisplay: `${rangeStart.toFixed(1)}% to ${rangeEnd.toFixed(1)}%`, // New field for tooltip
          count: 0,
          rangeStart: rangeStart,
          rangeEnd: rangeEnd
        }
      })

      data.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1)
        histogram[binIndex].count++
      })

      return histogram
    }

    // Create equity curve data (average of all simulations)
    const equityCurveData = []
    for (let draw = 0; draw <= numberOfDraws; draw++) {
      const equitiesAtDraw = allResults.map(r => r.equityHistory[draw])
      const avgEquity = mean(equitiesAtDraw)
      const p10 = getPercentile([...equitiesAtDraw].sort((a, b) => a - b), 10)
      const p90 = getPercentile([...equitiesAtDraw].sort((a, b) => a - b), 90)
      
      equityCurveData.push({
        draw,
        avgEquity,
        p10,
        p90
      })
    }

    setResults({
      simulations: allResults,
      statistics: {
        meanReturn: mean(returnPercentages),
        stdDevReturn: stdDev(returnPercentages),
        meanEquity: mean(finalEquities),
        meanRMultiple: mean(avgRMultiples),
        meanWinRate: mean(winRates),
        meanMaxDrawdown: mean(maxDrawdowns),
        probabilityOfProfit,
        percentiles: {
          return: {
            p5: getPercentile(sortedReturns, 5),
            p10: getPercentile(sortedReturns, 10),
            p25: getPercentile(sortedReturns, 25),
            p50: getPercentile(sortedReturns, 50),
            p75: getPercentile(sortedReturns, 75),
            p90: getPercentile(sortedReturns, 90),
            p95: getPercentile(sortedReturns, 95)
          },
          equity: {
            p5: getPercentile(sortedEquities, 5),
            p10: getPercentile(sortedEquities, 10),
            p25: getPercentile(sortedEquities, 25),
            p50: getPercentile(sortedEquities, 50),
            p75: getPercentile(sortedEquities, 75),
            p90: getPercentile(sortedEquities, 90),
            p95: getPercentile(sortedEquities, 95)
          },
          drawdown: {
            p5: getPercentile(sortedDrawdowns, 5),
            p10: getPercentile(sortedDrawdowns, 10),
            p25: getPercentile(sortedDrawdowns, 25),
            p50: getPercentile(sortedDrawdowns, 50),
            p75: getPercentile(sortedDrawdowns, 75),
            p90: getPercentile(sortedDrawdowns, 90),
            p95: getPercentile(sortedDrawdowns, 95)
          }
        }
      },
      histogramData: createHistogramData(returnPercentages),
      equityCurveData,
      numberOfSimulations,
      numberOfDraws
    })

    setIsRunning(false)
    setProgress(0)
  }

  // Reset simulation
  const resetSimulation = () => {
    setResults(null)
    setProgress(0)
  }

  // Simple progress bar component (in case Progress from shadcn/ui is not available)
  const SimpleProgress = ({ value }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${value}%` }}
      />
    </div>
  )

  // Custom tooltip for histogram
  const CustomHistogramTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium">{`Return Range: ${data.rangeDisplay}`}</p>
          <p className="text-blue-600">{`Frequency: ${payload[0].value} simulations`}</p>
          <p className="text-gray-600 text-sm">{`${((payload[0].value / results.numberOfSimulations) * 100).toFixed(1)}% of all simulations`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Monte Carlo Marble Simulation
          </CardTitle>
          <CardDescription>
            Run thousands of simulations to analyze probability distributions and confidence intervals
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Marble Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Marble Configuration</CardTitle>
              <CardDescription>
                Configure marble probabilities and R multiples (must sum to 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {marbles.map((marble, index) => (
                <div key={marble.name} className="grid grid-cols-4 gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: marble.color }}
                    />
                    <span className="text-sm font-medium">{marble.name}</span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={marble.probability}
                      onChange={(e) => updateMarble(index, 'probability', e.target.value)}
                      placeholder="Prob %"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={marble.multiplier}
                      onChange={(e) => updateMarble(index, 'multiplier', e.target.value)}
                      placeholder="R Multiple"
                      className="h-8"
                      step="0.1"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {marble.multiplier > 0 ? '+' : ''}{marble.multiplier}R
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Probability:</span>
                <Badge variant={totalProbability === 100 ? "default" : "destructive"}>
                  {totalProbability}%
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Theoretical Expectancy:</span>
                <Badge variant={theoreticalExpectancy > 0 ? "default" : "destructive"}>
                  {theoreticalExpectancy > 0 ? '+' : ''}{theoreticalExpectancy.toFixed(3)}R
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Monte Carlo Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Monte Carlo Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equity">Starting Equity ($)</Label>
                  <Input
                    id="equity"
                    type="number"
                    value={startingEquity}
                    onChange={(e) => setStartingEquity(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="risk">Risk Percentage (%)</Label>
                  <Input
                    id="risk"
                    type="number"
                    value={riskPercentage}
                    onChange={(e) => setRiskPercentage(parseFloat(e.target.value) || 0)}
                    step="0.1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="draws">Draws per Simulation</Label>
                  <Input
                    id="draws"
                    type="number"
                    value={numberOfDraws}
                    onChange={(e) => setNumberOfDraws(parseInt(e.target.value) || 0)}
                    min="1"
                    max="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="simulations">Number of Simulations</Label>
                  <Input
                    id="simulations"
                    type="number"
                    value={numberOfSimulations}
                    onChange={(e) => setNumberOfSimulations(parseInt(e.target.value) || 0)}
                    min="100"
                    max="10000"
                  />
                </div>
              </div>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <SimpleProgress value={progress} />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={runMonteCarloSimulation} 
                  disabled={!isValidConfig || isRunning}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? 'Running...' : 'Run Monte Carlo'}
                </Button>
                
                {results && (
                  <Button onClick={resetSimulation} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>

              {!isValidConfig && (
                <div className="text-sm text-destructive">
                  {totalProbability !== 100 && "Probabilities must sum to 100%. "}
                  {numberOfDraws <= 0 && "Number of draws must be greater than 0. "}
                  {riskPercentage <= 0 && "Risk percentage must be greater than 0. "}
                  {numberOfSimulations <= 0 && "Number of simulations must be greater than 0."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {results ? (
            <>
              {/* Summary Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Monte Carlo Results</CardTitle>
                  <CardDescription>
                    {results.numberOfSimulations.toLocaleString()} simulations of {results.numberOfDraws} draws each
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${results.statistics.meanReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {results.statistics.meanReturn >= 0 ? '+' : ''}{results.statistics.meanReturn.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Mean Return</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {results.statistics.probabilityOfProfit.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Probability of Profit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {results.statistics.stdDevReturn.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Return Volatility</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {results.statistics.meanMaxDrawdown.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Mean Max Drawdown</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Confidence Intervals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Confidence Intervals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Return Percentiles</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>5%: {results.statistics.percentiles.return.p5.toFixed(1)}%</div>
                      <div>25%: {results.statistics.percentiles.return.p25.toFixed(1)}%</div>
                      <div>50%: {results.statistics.percentiles.return.p50.toFixed(1)}%</div>
                      <div>75%: {results.statistics.percentiles.return.p75.toFixed(1)}%</div>
                      <div>90%: {results.statistics.percentiles.return.p90.toFixed(1)}%</div>
                      <div>95%: {results.statistics.percentiles.return.p95.toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Final Equity Percentiles</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>5%: ${results.statistics.percentiles.equity.p5.toLocaleString()}</div>
                      <div>25%: ${results.statistics.percentiles.equity.p25.toLocaleString()}</div>
                      <div>50%: ${results.statistics.percentiles.equity.p50.toLocaleString()}</div>
                      <div>75%: ${results.statistics.percentiles.equity.p75.toLocaleString()}</div>
                      <div>90%: ${results.statistics.percentiles.equity.p90.toLocaleString()}</div>
                      <div>95%: ${results.statistics.percentiles.equity.p95.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Return Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Return Distribution</CardTitle>
                  <CardDescription>
                    Histogram of return percentages across all simulations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={results.histogramData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="range" 
                          stroke="#9CA3AF"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip content={<CustomHistogramTooltip />} />
                        <Bar dataKey="count" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Equity Curve with Confidence Bands */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Average Equity Curve with Confidence Bands
                  </CardTitle>
                  <CardDescription>
                    Average equity progression with 10th-90th percentile bands
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.equityCurveData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="draw" 
                          stroke="#9CA3AF"
                          label={{ value: 'Draw Number', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                          label={{ value: 'Equity ($)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                          labelFormatter={(label) => `Draw: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="p10" 
                          stroke="#EF4444" 
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={false}
                          name="10th Percentile"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avgEquity" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={false}
                          name="Average"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="p90" 
                          stroke="#10B981" 
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={false}
                          name="90th Percentile"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure your Monte Carlo simulation and click "Run Monte Carlo" to see results</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Methodology and Interpretation Guide */}
      <Card>
        <CardHeader>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-0 h-auto"
            onClick={() => setExplanationOpen(!explanationOpen)}
          >
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Monte Carlo Methodology & Result Interpretation Guide
            </CardTitle>
            {explanationOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <CardDescription>
            Comprehensive guide to understanding Monte Carlo simulation methodology and interpreting results
          </CardDescription>
        </CardHeader>
        {explanationOpen && (
          <CardContent className="space-y-6">
            
            {/* What is Monte Carlo Simulation */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                What is Monte Carlo Simulation?
              </h3>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>Monte Carlo simulation</strong> is a computational technique that uses repeated random sampling to model the probability of different outcomes in a process that cannot easily be predicted due to the intervention of random variables.
                </p>
                <p>
                  Named after the Monte Carlo Casino in Monaco, this method was developed by mathematicians working on nuclear weapons projects in the 1940s. Today, it's widely used in finance, engineering, science, and risk analysis.
                </p>
                <p>
                  <strong>In our marble game context:</strong> Instead of running just one simulation, we run thousands of simulations with the same parameters to understand the full range of possible outcomes and their probabilities.
                </p>
              </div>
            </div>

            <Separator />

            {/* How Our Monte Carlo Works */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                How Our Monte Carlo Simulation Works
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium">Step 1: Single Simulation Process</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Start with your configured starting equity and risk percentage</li>
                    <li>For each draw, generate a random number (0-1) using JavaScript's Math.random()</li>
                    <li>Map the random number to a marble based on cumulative probabilities</li>
                    <li>Apply the marble's R multiple to calculate the result</li>
                    <li>Update equity and track statistics (wins, losses, drawdown)</li>
                    <li>Repeat for the specified number of draws</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium">Step 2: Multiple Simulations</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Repeat the single simulation process thousands of times</li>
                    <li>Each simulation uses the same parameters but different random numbers</li>
                    <li>Collect final results from each simulation (final equity, return %, max drawdown, etc.)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Step 3: Statistical Analysis</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Calculate mean, standard deviation, and percentiles of all results</li>
                    <li>Create probability distributions and confidence intervals</li>
                    <li>Generate visualizations to show the range of outcomes</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Understanding the Results */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Understanding the Results</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-blue-600">Summary Statistics</h4>
                  <div className="ml-4 space-y-2 text-sm">
                    <p><strong>Mean Return:</strong> The average return percentage across all simulations. This should converge toward your theoretical expectancy as the number of simulations increases.</p>
                    <p><strong>Probability of Profit:</strong> The percentage of simulations that ended with a positive return. A 60% probability means 6 out of 10 times you'd expect to be profitable.</p>
                    <p><strong>Return Volatility:</strong> The standard deviation of returns, measuring how much results vary. Higher volatility means more unpredictable outcomes.</p>
                    <p><strong>Mean Max Drawdown:</strong> The average of the worst losing streaks across all simulations. Critical for understanding risk.</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-green-600">Confidence Intervals (Percentiles)</h4>
                  <div className="ml-4 space-y-2 text-sm">
                    <p><strong>5th Percentile:</strong> Only 5% of simulations performed worse than this. Represents near worst-case scenarios.</p>
                    <p><strong>25th Percentile:</strong> 25% of simulations performed worse. Shows below-average outcomes.</p>
                    <p><strong>50th Percentile (Median):</strong> Half of simulations performed better, half worse. Often more meaningful than the mean.</p>
                    <p><strong>75th Percentile:</strong> 75% of simulations performed worse. Shows above-average outcomes.</p>
                    <p><strong>90th & 95th Percentiles:</strong> Represent very good to excellent outcomes that happen 10% and 5% of the time respectively.</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-purple-600">Return Distribution Histogram</h4>
                  <div className="ml-4 space-y-2 text-sm">
                    <p><strong>Shape Analysis:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      <li><strong>Normal Distribution:</strong> Bell-shaped curve indicates predictable, symmetric outcomes</li>
                      <li><strong>Right Skewed:</strong> Long tail to the right means occasional very large gains</li>
                      <li><strong>Left Skewed:</strong> Long tail to the left means occasional very large losses</li>
                      <li><strong>Bimodal:</strong> Two peaks suggest the strategy has two distinct outcome modes</li>
                    </ul>
                    <p><strong>Frequency:</strong> Taller bars show more common outcomes. Look for where most results cluster.</p>
                    <p><strong>Improved Tooltips:</strong> Hover over any bar to see the exact percentage range (e.g., "5.0% to 7.5%") and how many simulations fell within that range.</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-orange-600">Equity Curve with Confidence Bands</h4>
                  <div className="ml-4 space-y-2 text-sm">
                    <p><strong>Average Line (Blue):</strong> Shows the expected equity progression over time. Should trend toward theoretical expectancy.</p>
                    <p><strong>10th Percentile (Red Dashed):</strong> Shows how bad things could get 10% of the time. Critical for risk management.</p>
                    <p><strong>90th Percentile (Green Dashed):</strong> Shows how good things could get 10% of the time. Represents optimistic scenarios.</p>
                    <p><strong>Band Width:</strong> Wider bands indicate more uncertainty and volatility in outcomes.</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Practical Applications */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Practical Applications & Decision Making</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-blue-600">Risk Assessment</h4>
                  <div className="ml-4 space-y-2 text-sm">
                    <p><strong>Worst-Case Planning:</strong> Use the 5th percentile to understand what could go wrong and plan accordingly.</p>
                    <p><strong>Capital Requirements:</strong> Ensure you have enough capital to survive the worst drawdowns shown in the simulation.</p>
                    <p><strong>Position Sizing:</strong> If the 5th percentile shows unacceptable losses, reduce your risk percentage.</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-green-600">Strategy Validation</h4>
                  <div className="ml-4 space-y-2 text-sm">
                    <p><strong>Consistency Check:</strong> Mean return should be close to theoretical expectancy. Large differences suggest issues.</p>
                    <p><strong>Probability of Success:</strong> Strategies with &gt;60% probability of profit are generally considered robust.</p>
                    <p><strong>Risk-Reward Balance:</strong> Compare potential gains (90th percentile) vs potential losses (10th percentile).</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-purple-600">Comparing Strategies</h4>
                  <div className="ml-4 space-y-2 text-sm">
                    <p><strong>Higher Mean Return:</strong> Better average performance, but check volatility too.</p>
                    <p><strong>Lower Volatility:</strong> More predictable outcomes, important for consistent results.</p>
                    <p><strong>Better Worst-Case:</strong> Higher 5th percentile means less catastrophic risk.</p>
                    <p><strong>Sharpe-like Ratio:</strong> Mean Return ÷ Volatility gives risk-adjusted performance measure.</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Limitations and Considerations */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Limitations and Considerations</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-red-600">Important Limitations</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Model Assumptions:</strong> Results are only as good as your marble configuration. Real markets may behave differently.</li>
                    <li><strong>Independence Assumption:</strong> Each draw is independent. Real trading may have streaks or correlations.</li>
                    <li><strong>Static Parameters:</strong> Risk percentage and probabilities remain constant, which may not reflect real trading.</li>
                    <li><strong>No Market Conditions:</strong> Doesn't account for changing market volatility, trends, or external factors.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-yellow-600">Best Practices</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Run Enough Simulations:</strong> Use at least 1,000 simulations for reliable statistics, 10,000+ for high precision.</li>
                    <li><strong>Conservative Estimates:</strong> Use slightly worse probabilities than you expect to build in a safety margin.</li>
                    <li><strong>Stress Testing:</strong> Test with different market conditions and parameter variations.</li>
                    <li><strong>Regular Updates:</strong> Re-run simulations as you gather more real trading data.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-green-600">When Monte Carlo is Most Valuable</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Strategy Development:</strong> Testing new trading approaches before risking real money.</li>
                    <li><strong>Risk Management:</strong> Understanding the full range of possible outcomes.</li>
                    <li><strong>Capital Planning:</strong> Determining appropriate account sizes and position sizing.</li>
                    <li><strong>Expectation Setting:</strong> Understanding realistic timelines for achieving goals.</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Example Interpretation */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Example Result Interpretation</h3>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Sample Results:</h4>
                <div className="text-sm space-y-1">
                  <p>• Mean Return: +12.5%</p>
                  <p>• Probability of Profit: 68%</p>
                  <p>• 5th Percentile: -15.2%</p>
                  <p>• 95th Percentile: +45.8%</p>
                  <p>• Return Volatility: 18.3%</p>
                </div>
                
                <h4 className="font-medium mt-3 mb-2">Interpretation:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Good Strategy:</strong> 68% chance of profit with +12.5% average return is solid.</p>
                  <p><strong>Manageable Risk:</strong> Worst case (-15.2%) is acceptable if you can handle that loss.</p>
                  <p><strong>Upside Potential:</strong> Best cases (+45.8%) show significant upside potential.</p>
                  <p><strong>Moderate Volatility:</strong> 18.3% volatility means results will vary but not extremely.</p>
                  <p><strong>Decision:</strong> This could be a viable strategy if the worst-case loss is acceptable.</p>
                </div>
              </div>
            </div>

          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default MonteCarloMarbleGame

