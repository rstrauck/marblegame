import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Play, RotateCcw, Dice6, Plus, Edit, Trash2, Save, X, Download, Upload, FileText, AlertCircle } from 'lucide-react'

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

  // Results state
  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  // Load profiles from localStorage on component mount
  useEffect(() => {
    console.log('🔄 Loading profiles from localStorage...')
    
    try {
      const savedProfiles = localStorage.getItem('marbleGameProfiles')
      console.log('📦 Found in localStorage:', savedProfiles ? `${JSON.parse(savedProfiles).length} profiles` : 'null')
      
      if (savedProfiles) {
        const parsedProfiles = JSON.parse(savedProfiles)
        if (Array.isArray(parsedProfiles) && parsedProfiles.length > 0) {
          setProfiles(parsedProfiles)
          console.log('✅ Successfully loaded', parsedProfiles.length, 'profiles')
        }
      }
    } catch (error) {
      console.error('❌ Error loading profiles:', error)
    } finally {
      // Always mark as loaded, even if there were no profiles or an error
      setIsLoaded(true)
      console.log('🏁 Profile loading complete, ready to save changes')
    }
  }, [])

  // Save profiles to localStorage whenever profiles change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      console.log('💾 Saving profiles to localStorage:', profiles.length, 'profiles')
      try {
        localStorage.setItem('marbleGameProfiles', JSON.stringify(profiles))
        console.log('✅ Successfully saved profiles')
      } catch (error) {
        console.error('❌ Error saving profiles:', error)
      }
    } else {
      console.log('⏳ Skipping save - still loading initial data')
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
      console.log('📤 Exported', profiles.length, 'profiles')
    } catch (error) {
      setImportError('Failed to export profiles: ' + error.message)
      console.error('❌ Export error:', error)
    }
  }

  // Import profiles from JSON file
  const importProfiles = (event) => {
    const file = event.target.files[0]
    if (!file) return

    console.log('📥 Importing profiles from file:', file.name)

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
        console.log('✅ Imported', importedProfiles.length, 'profiles')
        
        if (validProfiles.length < importData.profiles.length) {
          setImportError(`Warning: ${importData.profiles.length - validProfiles.length} profiles were skipped due to invalid format`)
        }

      } catch (error) {
        setImportError('Failed to import profiles: ' + error.message)
        console.error('❌ Import error:', error)
      }
    }

    reader.onerror = () => {
      setImportError('Failed to read file')
      console.error('❌ File read error')
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

    const newProfile = {
      id: editingProfile?.id || Date.now().toString(),
      name: profileName.trim(),
      marbles: [...marbles],
      startingEquity,
      riskPercentage,
      numberOfDraws,
      createdAt: editingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (editingProfile) {
      // Update existing profile
      setProfiles(profiles.map(p => p.id === editingProfile.id ? newProfile : p))
      console.log('✏️ Updated profile:', newProfile.name)
    } else {
      // Add new profile
      setProfiles([...profiles, newProfile])
      console.log('➕ Added new profile:', newProfile.name)
    }

    // Close dialog and reset form
    setIsProfileDialogOpen(false)
    setEditingProfile(null)
    setProfileName('')
  }

  const loadProfile = (profileId) => {
    const profile = profiles.find(p => p.id === profileId)
    if (profile) {
      setMarbles([...profile.marbles])
      setStartingEquity(profile.startingEquity)
      setRiskPercentage(profile.riskPercentage)
      setNumberOfDraws(profile.numberOfDraws)
      setSelectedProfile(profileId)
      console.log('📋 Loaded profile:', profile.name)
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
    console.log('🗑️ Deleted profile:', profileToDelete?.name)
  }

  const openNewProfileDialog = () => {
    setEditingProfile(null)
    setProfileName('')
    setIsProfileDialogOpen(true)
  }

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

  // Run simulation
  const runSimulation = () => {
    if (!isValidConfig) return

    setIsRunning(true)

    // Simulate with a small delay for UI feedback
    setTimeout(() => {
      let currentEquity = startingEquity
      let totalRMultiples = 0
      let wins = 0
      let losses = 0
      let maxEquity = startingEquity
      let maxDrawdown = 0
      const drawResults = []
      const equityHistory = [{ draw: 0, equity: startingEquity }]

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
      for (let i = 1; i <= numberOfDraws; i++) {
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

        const runningAvgR = totalRMultiples / i

        // Add to equity history for chart
        equityHistory.push({ draw: i, equity: currentEquity })

        drawResults.push({
          draw: i,
          marble: selectedMarble,
          riskAmount,
          resultAmount,
          equity: currentEquity,
          runningAvgR
        })
      }

      const totalReturn = currentEquity - startingEquity
      const returnPercentage = (totalReturn / startingEquity) * 100
      const avgRMultiple = totalRMultiples / numberOfDraws
      const winRate = (wins / numberOfDraws) * 100

      setResults({
        finalEquity: currentEquity,
        totalReturn,
        returnPercentage,
        avgRMultiple,
        winRate,
        maxDrawdown,
        wins,
        losses,
        drawResults,
        equityHistory
      })

      setIsRunning(false)
    }, 500)
  }

  // Reset simulation
  const resetSimulation = () => {
    setResults(null)
  }

  // Custom tooltip for equity curve
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const drawDetail = results?.drawResults.find(d => d.draw === label)
      
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">Draw #{label}</p>
          <p className="text-blue-600">Equity: ${data.equity.toFixed(0)}</p>
          {drawDetail && (
            <>
              <p className="text-gray-600">Marble: {drawDetail.marble.name}</p>
              <p className={drawDetail.marble.multiplier > 0 ? "text-green-600" : "text-red-600"}>
                R Multiple: {drawDetail.marble.multiplier > 0 ? '+' : ''}{drawDetail.marble.multiplier}R
              </p>
              <p className={drawDetail.resultAmount >= 0 ? "text-green-600" : "text-red-600"}>
                Result: {drawDetail.resultAmount >= 0 ? '+' : ''}${drawDetail.resultAmount.toFixed(0)}
              </p>
            </>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
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
              <CardDescription>Configure marble probabilities and multipliers (must sum to 100%)</CardDescription>
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

              {/* Equity Curve */}
              <Card>
                <CardHeader>
                  <CardTitle>Equity Curve</CardTitle>
                  <CardDescription>Hover over points to see draw details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.equityHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="draw" />
                        <YAxis 
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="equity" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
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

export default AdHocMarbleGame

