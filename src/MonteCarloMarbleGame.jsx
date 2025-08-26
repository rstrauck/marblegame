import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Edit, Trash2, Save, Download, Upload, FileText, AlertCircle } from 'lucide-react'

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
  const [histogramBuckets, setHistogramBuckets] = useState(20)

  // Trading profiles state
  const [profiles, setProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState('')
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const [profileName, setProfileName] = useState('')

  // Loading state to prevent premature localStorage overwrites
  const [isLoaded, setIsLoaded] = useState(false)

  // Import/Export state
  const [importMessage, setImportMessage] = useState('')
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)

  // Simulation state
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)

  // Load profiles from localStorage on component mount
  useEffect(() => {
    console.log('🔄 Loading profiles from localStorage (Monte Carlo)...')
    
    try {
      const savedProfiles = localStorage.getItem('marbleGameProfiles')
      console.log('📦 Found in localStorage:', savedProfiles ? `${JSON.parse(savedProfiles).length} profiles` : 'null')
      
      if (savedProfiles) {
        const parsedProfiles = JSON.parse(savedProfiles)
        if (Array.isArray(parsedProfiles) && parsedProfiles.length > 0) {
          setProfiles(parsedProfiles)
          console.log('✅ Successfully loaded', parsedProfiles.length, 'profiles (Monte Carlo)')
        }
      }
    } catch (error) {
      console.error('❌ Error loading profiles (Monte Carlo):', error)
    } finally {
      setIsLoaded(true)
      console.log('🏁 Profile loading complete (Monte Carlo)')
    }
  }, [])

  // Save profiles to localStorage whenever profiles change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      console.log('💾 Saving profiles to localStorage (Monte Carlo):', profiles.length, 'profiles')
      try {
        localStorage.setItem('marbleGameProfiles', JSON.stringify(profiles))
        console.log('✅ Successfully saved profiles (Monte Carlo)')
      } catch (error) {
        console.error('❌ Error saving profiles (Monte Carlo):', error)
      }
    } else {
      console.log('⏳ Skipping save - still loading initial data (Monte Carlo)')
    }
  }, [profiles, isLoaded])

  // Clear import messages after 5 seconds
  useEffect(() => {
    if (importMessage || importError) {
      const timer = setTimeout(() => {
        setImportMessage('')
        setImportError('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [importMessage, importError])

  // Export profiles to JSON file
  const exportProfiles = () => {
    if (profiles.length === 0) {
      setImportError('No profiles to export')
      return
    }

    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        profileCount: profiles.length,
        profiles: profiles
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `marble-game-profiles-${new Date().toISOString().split('T')[0]}.json`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      setImportMessage(`Successfully exported ${profiles.length} profiles`)
      console.log('📤 Exported', profiles.length, 'profiles (Monte Carlo)')
    } catch (error) {
      setImportError('Failed to export profiles: ' + error.message)
      console.error('❌ Export error (Monte Carlo):', error)
    }
  }

  // Import profiles from JSON file
  const importProfiles = (event) => {
    const file = event.target.files[0]
    if (!file) return

    console.log('📥 Importing profiles from file (Monte Carlo):', file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result)
        
        // Validate import data structure
        if (!importData.profiles || !Array.isArray(importData.profiles)) {
          throw new Error('Invalid file format: missing profiles array')
        }

        // Validate each profile has required fields
        const validProfiles = importData.profiles.filter(profile => {
          return profile.id && profile.name && profile.marbles && 
                 Array.isArray(profile.marbles) && profile.marbles.length === 7 &&
                 typeof profile.startingEquity === 'number' &&
                 typeof profile.riskPercentage === 'number' &&
                 typeof profile.numberOfDraws === 'number'
        })

        if (validProfiles.length === 0) {
          throw new Error('No valid profiles found in file')
        }

        // Check for duplicate profile names and handle conflicts
        const existingNames = new Set(profiles.map(p => p.name))
        const importedProfiles = validProfiles.map(profile => {
          let finalName = profile.name
          let counter = 1
          
          // Add suffix if name already exists
          while (existingNames.has(finalName)) {
            finalName = `${profile.name} (${counter})`
            counter++
          }
          
          return {
            ...profile,
            name: finalName,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Generate new ID
            importedAt: new Date().toISOString()
          }
        })

        // Merge with existing profiles
        const updatedProfiles = [...profiles, ...importedProfiles]
        setProfiles(updatedProfiles)
        
        setImportMessage(`Successfully imported ${importedProfiles.length} profiles`)
        console.log('✅ Imported', importedProfiles.length, 'profiles (Monte Carlo)')
        
        if (validProfiles.length < importData.profiles.length) {
          setImportError(`Warning: ${importData.profiles.length - validProfiles.length} profiles were skipped due to invalid format`)
        }

      } catch (error) {
        setImportError('Failed to import profiles: ' + error.message)
        console.error('❌ Import error (Monte Carlo):', error)
      }
    }

    reader.onerror = () => {
      setImportError('Failed to read file')
      console.error('❌ File read error (Monte Carlo)')
    }

    reader.readAsText(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Trigger file input
  const triggerImport = () => {
    fileInputRef.current?.click()
  }

  // Profile management functions
  const saveProfile = () => {
    if (!profileName.trim()) return

    // Convert marbles from Monte Carlo format to profile format
    const profileMarbles = marbles.map(marble => ({
      name: marble.name,
      color: marble.color,
      probability: marble.probability * 100, // Convert to percentage for profile
      multiplier: marble.rMultiple
    }))

    const newProfile = {
      id: editingProfile?.id || Date.now().toString(),
      name: profileName.trim(),
      marbles: profileMarbles,
      startingEquity,
      riskPercentage,
      numberOfDraws,
      createdAt: editingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (editingProfile) {
      // Update existing profile
      setProfiles(profiles.map(p => p.id === editingProfile.id ? newProfile : p))
      console.log('✏️ Updated profile (Monte Carlo):', newProfile.name)
    } else {
      // Add new profile
      setProfiles([...profiles, newProfile])
      console.log('➕ Added new profile (Monte Carlo):', newProfile.name)
    }

    // Close dialog and reset form
    setIsProfileDialogOpen(false)
    setEditingProfile(null)
    setProfileName('')
  }

  const loadProfile = (profileId) => {
    const profile = profiles.find(p => p.id === profileId)
    if (profile) {
      // Convert marbles from profile format to Monte Carlo format
      const monteCarloMarbles = profile.marbles.map(marble => ({
        name: marble.name,
        color: marble.color,
        probability: marble.probability / 100, // Convert from percentage
        rMultiple: marble.multiplier
      }))

      setMarbles(monteCarloMarbles)
      setStartingEquity(profile.startingEquity)
      setRiskPercentage(profile.riskPercentage)
      setNumberOfDraws(profile.numberOfDraws)
      setSelectedProfile(profileId)
      console.log('📋 Loaded profile (Monte Carlo):', profile.name)
    }
  }

  const editProfile = (profile) => {
    setEditingProfile(profile)
    setProfileName(profile.name)
    setIsProfileDialogOpen(true)
  }

  const deleteProfile = (profileId) => {
    const profileToDelete = profiles.find(p => p.id === profileId)
    setProfiles(profiles.filter(p => p.id !== profileId))
    if (selectedProfile === profileId) {
      setSelectedProfile('')
    }
    console.log('🗑️ Deleted profile (Monte Carlo):', profileToDelete?.name)
  }

  const openNewProfileDialog = () => {
    setEditingProfile(null)
    setProfileName('')
    setIsProfileDialogOpen(true)
  }

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
        {/* Trading Profiles Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Trading Profiles
              <div className="flex gap-2">
                <Button onClick={triggerImport} size="sm" variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                <Button onClick={exportProfiles} size="sm" variant="outline" className="flex items-center gap-2" disabled={profiles.length === 0}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button onClick={openNewProfileDialog} size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Save, load, and backup different trading configurations
              {!isLoaded && <span className="text-orange-600"> (Loading...)</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Import/Export Messages */}
              {(importMessage || importError) && (
                <div className={`p-3 rounded-lg border ${importError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center gap-2">
                    {importError ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-green-600" />
                    )}
                    <span className={`text-sm ${importError ? 'text-red-700' : 'text-green-700'}`}>
                      {importError || importMessage}
                    </span>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importProfiles}
                style={{ display: 'none' }}
              />

              {profiles.length > 0 && (
                <div>
                  <Label htmlFor="profileSelect">Select Profile</Label>
                  <Select value={selectedProfile} onValueChange={loadProfile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a trading profile..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {profiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Manage Profiles ({profiles.length} total)</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {profiles.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{profile.name}</span>
                          {profile.importedAt && (
                            <span className="text-xs text-gray-500">Imported</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => editProfile(profile)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => deleteProfile(profile.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profiles.length === 0 && isLoaded && (
                <div className="text-center py-4">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 mb-2">No profiles saved yet</p>
                  <p className="text-xs text-gray-400">Create your first profile or import existing ones</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* Game Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation Settings</CardTitle>
          <CardDescription>Configure the Monte Carlo simulation parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
          </div>
          
          {isRunning && (
            <div className="space-y-2 mt-4">
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
            className="w-full mt-4"
          >
            {isRunning ? 'Running Simulation...' : 'Start Monte Carlo Simulation'}
          </Button>
        </CardContent>
      </Card>

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

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? 'Edit Profile' : 'Save New Profile'}
            </DialogTitle>
            <DialogDescription>
              {editingProfile 
                ? 'Update the profile name and settings will be saved automatically.'
                : 'Save your current marble configuration and game settings as a reusable profile.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="profileName">Profile Name</Label>
              <Input
                id="profileName"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter profile name..."
              />
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Current Settings:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Starting Equity: ${startingEquity.toLocaleString()}</li>
                <li>Risk per Draw: {riskPercentage}%</li>
                <li>Number of Draws: {numberOfDraws}</li>
                <li>Theoretical Expectancy: {theoreticalExpectancy > 0 ? '+' : ''}{theoreticalExpectancy.toFixed(3)}R</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Note: Number of Simulations and Histogram Buckets are not saved in profiles.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={!profileName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {editingProfile ? 'Update Profile' : 'Save Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MonteCarloMarbleGame

