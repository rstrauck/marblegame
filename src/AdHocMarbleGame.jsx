import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Play, RotateCcw, Dice6, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const AdHocMarbleGame = () => {
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
  const [numberOfDraws, setNumberOfDraws] = useState(10)

  // Results state
  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  // Validation
  const totalProbability = marbles.reduce((sum, marble) => sum + marble.probability, 0)
  const isValidConfig = totalProbability === 100 && numberOfDraws > 0 && riskPercentage > 0

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

  // Custom tooltip for equity chart showing R multiples
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length && results) {
      const drawData = results.drawHistory[label - 1] // label is draw number (1-based)
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">Draw #{label}</p>
          {drawData && (
            <>
              <p className="text-blue-300">
                Marble: <span style={{ color: drawData.marbleColor }}>{drawData.marbleName}</span>
              </p>
              <p className={`font-medium ${drawData.rMultiple > 0 ? 'text-green-400' : 'text-red-400'}`}>
                R Multiple: {drawData.rMultiple > 0 ? '+' : ''}{drawData.rMultiple}R
              </p>
            </>
          )}
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              Equity: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Run simulation
  const runSimulation = () => {
    if (!isValidConfig) return

    setIsRunning(true)
    
    // Simulate with a small delay for visual effect
    setTimeout(() => {
      const drawResults = []
      const equityHistory = [startingEquity]
      const drawHistory = []
      let currentEquity = startingEquity
      let totalRMultiples = 0
      let wins = 0
      let losses = 0
      let maxEquity = startingEquity
      let maxDrawdown = 0

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

        // Store draw result
        drawResults.push({
          draw: i + 1,
          marble: selectedMarble,
          riskAmount: riskAmount,
          resultAmount: resultAmount,
          equity: currentEquity,
          runningAvgR: totalRMultiples / (i + 1)
        })

        // Store equity history
        equityHistory.push(currentEquity)

        // Store draw history for chart tooltip
        drawHistory.push({
          drawNumber: i + 1,
          marbleName: selectedMarble.name,
          marbleColor: selectedMarble.color,
          rMultiple: selectedMarble.multiplier
        })
      }

      // Prepare chart data
      const chartData = []
      for (let i = 0; i <= numberOfDraws; i++) {
        chartData.push({
          draw: i,
          Equity: equityHistory[i]
        })
      }

      // Calculate final statistics
      const totalReturn = currentEquity - startingEquity
      const returnPercentage = (totalReturn / startingEquity) * 100
      const avgRMultiple = totalRMultiples / numberOfDraws
      const winRate = (wins / numberOfDraws) * 100

      setResults({
        drawResults,
        drawHistory,
        chartData,
        equityHistory,
        finalEquity: currentEquity,
        totalReturn,
        returnPercentage,
        avgRMultiple,
        winRate,
        maxDrawdown,
        wins,
        losses
      })
      
      setIsRunning(false)
    }, 500)
  }

  // Reset simulation
  const resetSimulation = () => {
    setResults(null)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dice6 className="h-6 w-6" />
            Ad-Hoc Marble Game
          </CardTitle>
          <CardDescription>
            Quick marble simulation - configure parameters and run simulation on the same page
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

          {/* Game Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Game Settings</CardTitle>
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
              
              <div>
                <Label htmlFor="draws">Number of Draws</Label>
                <Input
                  id="draws"
                  type="number"
                  value={numberOfDraws}
                  onChange={(e) => setNumberOfDraws(parseInt(e.target.value) || 0)}
                  min="1"
                  max="1000"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={runSimulation} 
                  disabled={!isValidConfig || isRunning}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? 'Running...' : 'Run Simulation'}
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
                  {riskPercentage <= 0 && "Risk percentage must be greater than 0."}
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
                  <CardTitle>Simulation Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${results.finalEquity.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Final Equity</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${results.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {results.returnPercentage >= 0 ? '+' : ''}{results.returnPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Total Return</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${results.avgRMultiple >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {results.avgRMultiple >= 0 ? '+' : ''}{results.avgRMultiple.toFixed(3)}R
                      </div>
                      <div className="text-sm text-muted-foreground">Avg R Multiple</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {results.winRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {results.maxDrawdown.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Max Drawdown</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {results.wins}W / {results.losses}L
                      </div>
                      <div className="text-sm text-muted-foreground">Win/Loss Count</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Equity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Equity Curve with R Multiples
                  </CardTitle>
                  <CardDescription>
                    Hover over points to see R multiples for each draw
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.chartData}>
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
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="Equity" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Draw-by-Draw Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {results.drawResults.map((draw) => (
                        <div key={draw.draw} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">#{draw.draw}</span>
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: draw.marble.color }}
                            />
                            <span className="text-sm">{draw.marble.name}</span>
                            <Badge variant={draw.marble.multiplier > 0 ? "default" : "destructive"} className="text-xs">
                              {draw.marble.multiplier > 0 ? '+' : ''}{draw.marble.multiplier}R
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${draw.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {draw.resultAmount >= 0 ? '+' : ''}${draw.resultAmount.toFixed(0)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${draw.equity.toFixed(0)} | Avg: {draw.runningAvgR.toFixed(2)}R
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Dice6 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure your marble game and click "Run Simulation" to see results</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdHocMarbleGame

