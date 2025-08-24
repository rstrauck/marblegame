import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const MonteCarloMarbleGame = () => {
  // Marble configuration state
  const [marbles, setMarbles] = useState([
    { name: 'Blue', probability: 0.20, rMultiple: 1, color: '#3B82F6' },
    { name: 'Green', probability: 0.15, rMultiple: 3, color: '#10B981' },
    { name: 'Silver', probability: 0.10, rMultiple: 4, color: '#6B7280' },
    { name: 'Pearl', probability: 0.05, rMultiple: 7, color: '#F3F4F6' },
    { name: 'Orange', probability: 0.25, rMultiple: -1, color: '#F97316' },
    { name: 'Red', probability: 0.15, rMultiple: -2, color: '#EF4444' },
    { name: 'Black', probability: 0.10, rMultiple: -4, color: '#1F2937' }
  ])

  // Game settings
  const [startingEquity, setStartingEquity] = useState(10000)
  const [riskPercentage, setRiskPercentage] = useState(2)
  const [numberOfDraws, setNumberOfDraws] = useState(100)
  const [numberOfSimulations, setNumberOfSimulations] = useState(1000)
  const [histogramBuckets, setHistogramBuckets] = useState(20) // New: configurable buckets

  // Simulation state
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)

  // Update marble configuration
  const updateMarble = (index, field, value) => {
    const newMarbles = [...marbles]
    newMarbles[index][field] = field === 'probability' || field === 'rMultiple' ? parseFloat(value) || 0 : value
    setMarbles(newMarbles)
  }

  // Calculate total probability
  const totalProbability = marbles.reduce((sum, marble) => sum + marble.probability, 0)

  // Calculate theoretical expectancy
  const theoreticalExpectancy = marbles.reduce((sum, marble) => sum + (marble.probability * marble.rMultiple), 0)

  // Validate configuration
  const isValidConfig = Math.abs(totalProbability - 1.0) < 0.001

  // Single simulation function
  const runSingleSimulation = () => {
    let equity = startingEquity
    let maxDrawdown = 0
    let peak = startingEquity
    let wins = 0
    let totalRMultiples = 0
    const equityHistory = [equity]

    // Create cumulative probability ranges
    const cumulativeProbs = []
    let cumulative = 0
    marbles.forEach(marble => {
      cumulativeProbs.push({
        ...marble,
        start: cumulative,
        end: cumulative + marble.probability
      })
      cumulative += marble.probability
    })

    for (let draw = 0; draw < numberOfDraws; draw++) {
      const random = Math.random()
      
      // Find which marble was drawn
      const drawnMarble = cumulativeProbs.find(marble => 
        random >= marble.start && random < marble.end
      )

      if (drawnMarble) {
        const riskAmount = equity * (riskPercentage / 100)
        const result = riskAmount * drawnMarble.rMultiple
        equity += result
        totalRMultiples += drawnMarble.rMultiple

        if (drawnMarble.rMultiple > 0) wins++

        // Track peak and drawdown
        if (equity > peak) peak = equity
        const currentDrawdown = ((peak - equity) / peak) * 100
        if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown

        equityHistory.push(equity)
      }
    }

    const finalReturn = ((equity - startingEquity) / startingEquity) * 100
    const winRate = (wins / numberOfDraws) * 100
    const avgRMultiple = totalRMultiples / numberOfDraws

    return {
      finalEquity: equity,
      finalReturn,
      maxDrawdown,
      winRate,
      avgRMultiple,
      equityHistory
    }
  }

  // Run Monte Carlo simulation
  const runMonteCarloSimulation = async () => {
    if (!isValidConfig) return

    setIsRunning(true)
    setProgress(0)
    setResults(null)

    const simulationResults = []
    const batchSize = 100
    const totalBatches = Math.ceil(numberOfSimulations / batchSize)

    for (let batch = 0; batch < totalBatches; batch++) {
      const batchResults = []
      const currentBatchSize = Math.min(batchSize, numberOfSimulations - batch * batchSize)

      for (let i = 0; i < currentBatchSize; i++) {
        batchResults.push(runSingleSimulation())
      }

      simulationResults.push(...batchResults)
      setProgress(((batch + 1) / totalBatches) * 100)

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Calculate statistics
    const returns = simulationResults.map(r => r.finalReturn)
    const drawdowns = simulationResults.map(r => r.maxDrawdown)
    const finalEquities = simulationResults.map(r => r.finalEquity)

    returns.sort((a, b) => a - b)
    drawdowns.sort((a, b) => a - b)
    finalEquities.sort((a, b) => a - b)

    const getPercentile = (arr, percentile) => {
      const index = Math.floor((percentile / 100) * arr.length)
      return arr[Math.min(index, arr.length - 1)]
    }

    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const meanDrawdown = drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length
    const profitableSimulations = returns.filter(r => r > 0).length
    const probabilityOfProfit = (profitableSimulations / numberOfSimulations) * 100

    // Calculate return volatility
    const returnVariance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length
    const returnVolatility = Math.sqrt(returnVariance)

    // Create histogram data with configurable buckets
    const minReturn = Math.min(...returns)
    const maxReturn = Math.max(...returns)
    const binWidth = (maxReturn - minReturn) / histogramBuckets
    
    const histogram = []
    for (let i = 0; i < histogramBuckets; i++) {
      const binStart = minReturn + i * binWidth
      const binEnd = binStart + binWidth
      const binCenter = binStart + binWidth / 2
      const count = returns.filter(r => r >= binStart && r < binEnd).length
      
      histogram.push({
        range: `${Math.round(binCenter)}%`, // Rounded for display
        rangeDisplay: `${binStart.toFixed(1)}% to ${binEnd.toFixed(1)}%`,
        rangeStart: binStart,
        rangeEnd: binEnd,
        frequency: count,
        percentage: (count / numberOfSimulations) * 100
      })
    }

    // Create equity curve data with confidence bands
    const maxDrawsLength = Math.max(...simulationResults.map(r => r.equityHistory.length))
    const equityCurveData = []
    
    for (let draw = 0; draw < maxDrawsLength; draw++) {
      const equitiesAtDraw = simulationResults
        .map(r => r.equityHistory[draw])
        .filter(e => e !== undefined)
        .sort((a, b) => a - b)

      if (equitiesAtDraw.length > 0) {
        equityCurveData.push({
          draw,
          average: equitiesAtDraw.reduce((sum, e) => sum + e, 0) / equitiesAtDraw.length,
          p10: getPercentile(equitiesAtDraw, 10),
          p90: getPercentile(equitiesAtDraw, 90)
        })
      }
    }

    // Create scatterplot data using LineChart approach
    const scatterData = simulationResults.map((result, index) => ({
      id: index,
      simulation: index + 1,
      returnPercent: result.finalReturn,
      maxDrawdown: result.maxDrawdown,
      finalEquity: result.finalEquity,
      winRate: result.winRate
    }))

    setResults({
      summary: {
        meanReturn: meanReturn.toFixed(2),
        probabilityOfProfit: probabilityOfProfit.toFixed(1),
        returnVolatility: returnVolatility.toFixed(2),
        meanMaxDrawdown: meanDrawdown.toFixed(2)
      },
      percentiles: {
        returns: {
          p5: getPercentile(returns, 5).toFixed(2),
          p10: getPercentile(returns, 10).toFixed(2),
          p25: getPercentile(returns, 25).toFixed(2),
          p50: getPercentile(returns, 50).toFixed(2),
          p75: getPercentile(returns, 75).toFixed(2),
          p90: getPercentile(returns, 90).toFixed(2),
          p95: getPercentile(returns, 95).toFixed(2)
        },
        finalEquity: {
          p5: getPercentile(finalEquities, 5).toFixed(0),
          p10: getPercentile(finalEquities, 10).toFixed(0),
          p25: getPercentile(finalEquities, 25).toFixed(0),
          p50: getPercentile(finalEquities, 50).toFixed(0),
          p75: getPercentile(finalEquities, 75).toFixed(0),
          p90: getPercentile(finalEquities, 90).toFixed(0),
          p95: getPercentile(finalEquities, 95).toFixed(0)
        },
        drawdowns: {
          p5: getPercentile(drawdowns, 5).toFixed(2),
          p10: getPercentile(drawdowns, 10).toFixed(2),
          p25: getPercentile(drawdowns, 25).toFixed(2),
          p50: getPercentile(drawdowns, 50).toFixed(2),
          p75: getPercentile(drawdowns, 75).toFixed(2),
          p90: getPercentile(drawdowns, 90).toFixed(2),
          p95: getPercentile(drawdowns, 95).toFixed(2)
        }
      },
      histogram,
      equityCurveData,
      scatterData,
      rawResults: simulationResults
    })

    setIsRunning(false)
    setProgress(100)
  }

  // Custom tooltip for histogram
  const CustomHistogramTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">Return Range: {data.rangeDisplay}</p>
          <p className="text-blue-600">Frequency: {data.frequency} simulations</p>
          <p className="text-gray-600">{data.percentage.toFixed(1)}% of all simulations</p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for scatterplot (using LineChart with dots only)
  const CustomScatterTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">Simulation #{data.simulation}</p>
          <p className="text-blue-600">Return: {data.returnPercent.toFixed(2)}%</p>
          <p className="text-red-600">Max Drawdown: {data.maxDrawdown.toFixed(2)}%</p>
          <p className="text-gray-600">Final Equity: ${data.finalEquity.toFixed(0)}</p>
          <p className="text-green-600">Win Rate: {data.winRate.toFixed(1)}%</p>
        </div>
      )
    }
    return null
  }

  // Custom formatters for scatterplot axes - IMPROVED
  const formatPercentage = (value) => `${Math.round(value)}%`

  // Simple progress bar component
  const ProgressBar = ({ value }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${value}%` }}
      />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marble Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Marble Configuration</CardTitle>
            <CardDescription>Configure probabilities and R multiples for each marble</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marbles.map((marble, index) => (
                <div key={marble.name} className="grid grid-cols-4 gap-2 items-center">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: marble.color }}
                    />
                    <span className="text-sm font-medium">{marble.name}</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={marble.probability}
                    onChange={(e) => updateMarble(index, 'probability', e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={marble.rMultiple}
                    onChange={(e) => updateMarble(index, 'rMultiple', e.target.value)}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">
                    {(marble.probability * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
              
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Probability:</span>
                  <Badge variant={isValidConfig ? "default" : "destructive"}>
                    {(totalProbability * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Theoretical Expectancy:</span>
                  <Badge variant={theoreticalExpectancy > 0 ? "default" : "destructive"}>
                    {theoreticalExpectancy > 0 ? '+' : ''}{theoreticalExpectancy.toFixed(3)}R
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Simulation Settings</CardTitle>
            <CardDescription>Configure the Monte Carlo simulation parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="startingEquity">Starting Equity ($)</Label>
                <Input
                  id="startingEquity"
                  type="number"
                  value={startingEquity}
                  onChange={(e) => setStartingEquity(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="riskPercentage">Risk per Draw (%)</Label>
                <Input
                  id="riskPercentage"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={riskPercentage}
                  onChange={(e) => setRiskPercentage(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="numberOfDraws">Number of Draws per Simulation</Label>
                <Input
                  id="numberOfDraws"
                  type="number"
                  min="10"
                  max="1000"
                  value={numberOfDraws}
                  onChange={(e) => setNumberOfDraws(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="numberOfSimulations">Number of Simulations</Label>
                <Input
                  id="numberOfSimulations"
                  type="number"
                  min="100"
                  max="10000"
                  value={numberOfSimulations}
                  onChange={(e) => setNumberOfSimulations(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="histogramBuckets">Histogram Buckets</Label>
                <Input
                  id="histogramBuckets"
                  type="number"
                  min="5"
                  max="50"
                  value={histogramBuckets}
                  onChange={(e) => setHistogramBuckets(parseInt(e.target.value) || 20)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of buckets for return distribution (5-50)
                </p>
              </div>
              
              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={progress} />
                </div>
              )}
              
              <Button 
                onClick={runMonteCarloSimulation}
                disabled={!isValidConfig || isRunning}
                className="w-full"
              >
                {isRunning ? 'Running Simulation...' : 'Start Monte Carlo Simulation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Monte Carlo Results Summary</CardTitle>
              <CardDescription>
                Based on {numberOfSimulations.toLocaleString()} simulations of {numberOfDraws} draws each
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.summary.meanReturn}%</div>
                  <div className="text-sm text-gray-600">Mean Return</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.summary.probabilityOfProfit}%</div>
                  <div className="text-sm text-gray-600">Probability of Profit</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{results.summary.returnVolatility}%</div>
                  <div className="text-sm text-gray-600">Return Volatility</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{results.summary.meanMaxDrawdown}%</div>
                  <div className="text-sm text-gray-600">Mean Max Drawdown</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return Distribution Histogram */}
          <Card>
            <CardHeader>
              <CardTitle>Return Distribution</CardTitle>
              <CardDescription>
                Frequency distribution of returns across all simulations ({histogramBuckets} buckets)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.histogram}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="range" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip content={<CustomHistogramTooltip />} />
                    <Bar dataKey="frequency" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Return vs Max Drawdown Scatterplot - ENHANCED VERSION */}
          <Card>
            <CardHeader>
              <CardTitle>Return vs Max Drawdown Analysis</CardTitle>
              <CardDescription>
                Risk-return relationship across all simulations. Each dot represents one complete simulation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.scatterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="returnPercent" 
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={formatPercentage}
                      label={{ value: 'Return %', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      dataKey="maxDrawdown"
                      type="number"
                      domain={[0, 'dataMax']}
                      tickFormatter={formatPercentage}
                      label={{ value: 'Max Drawdown %', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomScatterTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="maxDrawdown" 
                      stroke="transparent"
                      strokeWidth={0}
                      dot={{ fill: '#3B82F6', strokeWidth: 0, r: 3, fillOpacity: 0.6 }}
                      line={false}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Interpretation:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Bottom-Right:</strong> High return, low drawdown (ideal outcomes)</li>
                  <li><strong>Top-Right:</strong> High return, high drawdown (risky but profitable)</li>
                  <li><strong>Bottom-Left:</strong> Low/negative return, low drawdown (conservative losses)</li>
                  <li><strong>Top-Left:</strong> Negative return, high drawdown (worst outcomes)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Equity Curve with Confidence Bands */}
          <Card>
            <CardHeader>
              <CardTitle>Equity Progression with Confidence Bands</CardTitle>
              <CardDescription>Average equity curve with 10th and 90th percentile bands</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.equityCurveData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="draw" />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value, name) => [`$${value.toFixed(0)}`, name]}
                      labelFormatter={(label) => `Draw ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="p10" 
                      stroke="#EF4444" 
                      strokeDasharray="5 5"
                      name="10th Percentile (Worst 10%)"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="average" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Average"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="p90" 
                      stroke="#10B981" 
                      strokeDasharray="5 5"
                      name="90th Percentile (Best 10%)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Percentile Tables */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Return Percentiles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(results.percentiles.returns).map(([percentile, value]) => (
                    <div key={percentile} className="flex justify-between">
                      <span>{percentile.toUpperCase()}:</span>
                      <span className={parseFloat(value) >= 0 ? "text-green-600" : "text-red-600"}>
                        {value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Final Equity Percentiles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(results.percentiles.finalEquity).map(([percentile, value]) => (
                    <div key={percentile} className="flex justify-between">
                      <span>{percentile.toUpperCase()}:</span>
                      <span>${parseInt(value).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Max Drawdown Percentiles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(results.percentiles.drawdowns).map(([percentile, value]) => (
                    <div key={percentile} className="flex justify-between">
                      <span>{percentile.toUpperCase()}:</span>
                      <span className="text-red-600">{value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Methodology and Interpretation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Monte Carlo Methodology & Result Interpretation</CardTitle>
          <CardDescription>
            Comprehensive guide to understanding Monte Carlo simulation and interpreting results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* What is Monte Carlo Simulation */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🎯 What is Monte Carlo Simulation?</h3>
              <p className="text-gray-700 mb-3">
                Monte Carlo simulation is a computational technique that uses repeated random sampling to model the probability 
                of different outcomes in a process that cannot easily be predicted due to the intervention of random variables. 
                Named after the Monte Carlo Casino in Monaco, this method was developed during World War II for nuclear weapons projects.
              </p>
              <p className="text-gray-700">
                In trading and finance, Monte Carlo simulation helps us understand the range of possible outcomes for a trading 
                strategy by running thousands of "what-if" scenarios with different random sequences of wins and losses.
              </p>
            </div>

            {/* How Our Simulation Works */}
            <div>
              <h3 className="text-lg font-semibold mb-3">⚙️ How Our Simulation Works</h3>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>Single Simulation Process:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Start with your configured starting equity</li>
                  <li>For each draw, generate a random number between 0 and 1</li>
                  <li>Map this number to a marble based on configured probabilities</li>
                  <li>Calculate risk amount as percentage of current equity</li>
                  <li>Apply the marble's R multiple to determine gain/loss</li>
                  <li>Update equity and track peak values for drawdown calculation</li>
                  <li>Repeat for the specified number of draws</li>
                  <li>Record final statistics (return, max drawdown, win rate, etc.)</li>
                </ol>
                <p className="text-gray-700">
                  <strong>Multiple Simulation Analysis:</strong> This process is repeated thousands of times with different 
                  random sequences, creating a distribution of possible outcomes that reveals the statistical properties 
                  of your trading strategy.
                </p>
              </div>
            </div>

            {/* Understanding the Results */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📊 Understanding the Results</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800">Summary Statistics:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Mean Return:</strong> Average return percentage across all simulations</li>
                    <li><strong>Probability of Profit:</strong> Percentage of simulations that ended with positive returns</li>
                    <li><strong>Return Volatility:</strong> Standard deviation of returns, measuring consistency</li>
                    <li><strong>Mean Max Drawdown:</strong> Average of the worst peak-to-trough declines</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Confidence Intervals (Percentiles):</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>P5 (5th Percentile):</strong> Only 5% of outcomes were worse than this value</li>
                    <li><strong>P50 (Median):</strong> Half of outcomes were above/below this value</li>
                    <li><strong>P95 (95th Percentile):</strong> Only 5% of outcomes were better than this value</li>
                    <li><strong>Interpretation:</strong> 90% of outcomes fall between P5 and P95</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Distribution Analysis:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Normal Distribution:</strong> Bell-shaped curve indicates predictable, balanced outcomes</li>
                    <li><strong>Right Skew:</strong> Long tail to the right suggests potential for large positive outliers</li>
                    <li><strong>Left Skew:</strong> Long tail to the left indicates risk of large negative outliers</li>
                    <li><strong>Multiple Peaks:</strong> May indicate different market regimes or strategy behaviors</li>
                    <li><strong>Bucket Configuration:</strong> Adjust histogram buckets (5-50) to change granularity of distribution view</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Equity Curve Analysis:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Average Line:</strong> Expected equity progression over time</li>
                    <li><strong>Confidence Bands:</strong> Show range of likely outcomes (10th to 90th percentile)</li>
                    <li><strong>Band Width:</strong> Wider bands indicate higher uncertainty and volatility</li>
                    <li><strong>Trend:</strong> Upward trend confirms positive expectancy</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Scatterplot Analysis:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Risk-Return Relationship:</strong> Shows correlation between returns and drawdowns</li>
                    <li><strong>Clustering Patterns:</strong> Tight clusters indicate consistent strategy behavior</li>
                    <li><strong>Outliers:</strong> Extreme points reveal best and worst-case scenarios</li>
                    <li><strong>Quadrant Analysis:</strong> Helps identify optimal risk-reward zones</li>
                    <li><strong>Axis Formatting:</strong> Both axes show percentages without decimals for cleaner reading</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Practical Applications */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🎯 Practical Applications & Decision Making</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800">Risk Assessment:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Worst-Case Planning:</strong> Use P5 values to prepare for bad scenarios</li>
                    <li><strong>Capital Requirements:</strong> Ensure account size can handle P5 drawdown</li>
                    <li><strong>Position Sizing:</strong> Adjust risk percentage based on drawdown tolerance</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Strategy Validation:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Consistency Check:</strong> High probability of profit indicates robust strategy</li>
                    <li><strong>Risk-Reward Balance:</strong> Compare mean return to mean max drawdown</li>
                    <li><strong>Volatility Assessment:</strong> Lower volatility suggests more predictable outcomes</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Strategy Comparison:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Return vs Risk:</strong> Higher return with lower drawdown is preferable</li>
                    <li><strong>Probability of Success:</strong> Strategies with &gt;60% probability of profit are generally considered robust</li>
                    <li><strong>Consistency:</strong> Lower volatility indicates more reliable performance</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Capital Planning:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Account Sizing:</strong> Account should be 3-5x the P95 max drawdown</li>
                    <li><strong>Profit Targets:</strong> Use P75-P90 returns for realistic goal setting</li>
                    <li><strong>Risk Limits:</strong> Set stop-loss rules based on historical drawdown patterns</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Limitations and Considerations */}
            <div>
              <h3 className="text-lg font-semibold mb-3">⚠️ Limitations and Considerations</h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">Important Limitations:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Model Assumptions:</strong> Results assume marble probabilities remain constant</li>
                    <li><strong>Independence:</strong> Each draw is assumed independent (no market regime changes)</li>
                    <li><strong>Fixed Risk:</strong> Risk percentage stays constant regardless of market conditions</li>
                    <li><strong>No Slippage/Costs:</strong> Real trading involves spreads, commissions, and slippage</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Best Practices:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Large Sample Size:</strong> Use at least 1,000 simulations for reliable results</li>
                    <li><strong>Conservative Estimates:</strong> Use slightly worse probabilities than historical data</li>
                    <li><strong>Stress Testing:</strong> Test with different market conditions and parameters</li>
                    <li><strong>Regular Updates:</strong> Recalibrate probabilities based on recent performance</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">When Monte Carlo is Most Valuable:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Strategy Development:</strong> Testing new approaches before live trading</li>
                    <li><strong>Risk Management:</strong> Understanding potential drawdowns and volatility</li>
                    <li><strong>Capital Allocation:</strong> Determining optimal position sizes and account requirements</li>
                    <li><strong>Performance Evaluation:</strong> Comparing different trading strategies objectively</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Example Interpretation */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📋 Example Result Interpretation</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-3">
                  <strong>Sample Results:</strong> Mean Return: +12.5%, Probability of Profit: 68%, 
                  Return Volatility: 15.2%, Mean Max Drawdown: 8.3%
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>Interpretation:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Strategy shows positive expectancy with average 12.5% returns</li>
                  <li>68% probability of profit indicates reasonably robust performance</li>
                  <li>15.2% volatility suggests moderate consistency in returns</li>
                  <li>8.3% average drawdown is manageable for most traders</li>
                  <li>Account should be sized for at least 25-30% drawdown (3x average)</li>
                  <li>Strategy appears viable but requires proper risk management</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MonteCarloMarbleGame

