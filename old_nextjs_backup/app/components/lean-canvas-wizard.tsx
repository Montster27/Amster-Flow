"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Progress } from '@/app/components/ui/progress'
import { Input } from '@/app/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog'
import { Download, Save, FileText, Users, TrendingUp, DollarSign, Target, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react'

interface Assumption {
  id: string
  text: string
  type: 'problem' | 'solution' | 'customer' | 'revenue'
  priority: 'high' | 'medium' | 'low'
  validated: boolean
}

interface Interview {
  id: string
  date: string
  customerSegment: string
  problemsDiscussed: string[]
  keyInsights: string
  validatedAssumptions: string[]
}

interface CanvasData {
  problem: string[]
  solution: string[]
  uniqueValueProposition: string
  unfairAdvantage: string
  customerSegments: string[]
  keyMetrics: string[]
  channels: string[]
  costStructure: string[]
  revenueStreams: string[]
  assumptions: Assumption[]
  interviews: Interview[]
}

const STORAGE_KEY = 'lean-canvas-data'

const LeanCanvasWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [canvasData, setCanvasData] = useState<CanvasData>({
    problem: ['', '', ''],
    solution: ['', '', ''],
    uniqueValueProposition: '',
    unfairAdvantage: '',
    customerSegments: [''],
    keyMetrics: [''],
    channels: [''],
    costStructure: [''],
    revenueStreams: [''],
    assumptions: [],
    interviews: []
  })

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      try {
        setCanvasData(JSON.parse(savedData))
      } catch (error) {
        console.error('Failed to parse saved data:', error)
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canvasData))
  }, [canvasData])

  const steps = [
    {
      title: 'Customer Segments',
      icon: Users,
      description: 'Who are your target customers?',
      fields: ['customerSegments']
    },
    {
      title: 'Problems',
      icon: AlertCircle,
      description: 'What are the top 3 problems your customers face?',
      fields: ['problem']
    },
    {
      title: 'Unique Value Proposition',
      icon: Lightbulb,
      description: 'What makes your solution unique and compelling?',
      fields: ['uniqueValueProposition']
    },
    {
      title: 'Solutions',
      icon: CheckCircle2,
      description: 'How will you solve these problems?',
      fields: ['solution']
    },
    {
      title: 'Channels',
      icon: TrendingUp,
      description: 'How will you reach your customers?',
      fields: ['channels']
    },
    {
      title: 'Revenue Streams',
      icon: DollarSign,
      description: 'How will you make money?',
      fields: ['revenueStreams']
    },
    {
      title: 'Cost Structure',
      icon: FileText,
      description: 'What are your key costs?',
      fields: ['costStructure']
    },
    {
      title: 'Key Metrics',
      icon: Target,
      description: 'What key metrics will you measure?',
      fields: ['keyMetrics']
    },
    {
      title: 'Unfair Advantage',
      icon: TrendingUp,
      description: 'What can\'t be easily copied or bought?',
      fields: ['unfairAdvantage']
    }
  ]

  const updateField = (field: keyof CanvasData, value: any, index?: number) => {
    setCanvasData(prev => {
      if (index !== undefined && Array.isArray(prev[field])) {
        const newArray = [...prev[field] as any[]]
        newArray[index] = value
        return { ...prev, [field]: newArray }
      }
      return { ...prev, [field]: value }
    })
  }

  const addArrayItem = (field: keyof CanvasData) => {
    setCanvasData(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), '']
    }))
  }

  const removeArrayItem = (field: keyof CanvasData, index: number) => {
    setCanvasData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index)
    }))
  }

  const generatePDF = () => {
    // Create a simple text representation for download
    const content = `
LEAN CANVAS - ${new Date().toLocaleDateString()}

CUSTOMER SEGMENTS:
${canvasData.customerSegments.filter(s => s).join('\n')}

PROBLEMS:
${canvasData.problem.filter(p => p).map((p, i) => `${i + 1}. ${p}`).join('\n')}

UNIQUE VALUE PROPOSITION:
${canvasData.uniqueValueProposition}

SOLUTIONS:
${canvasData.solution.filter(s => s).map((s, i) => `${i + 1}. ${s}`).join('\n')}

CHANNELS:
${canvasData.channels.filter(c => c).join('\n')}

REVENUE STREAMS:
${canvasData.revenueStreams.filter(r => r).join('\n')}

COST STRUCTURE:
${canvasData.costStructure.filter(c => c).join('\n')}

KEY METRICS:
${canvasData.keyMetrics.filter(m => m).join('\n')}

UNFAIR ADVANTAGE:
${canvasData.unfairAdvantage}

ASSUMPTIONS (${canvasData.assumptions.length}):
${canvasData.assumptions.map(a => `- [${a.validated ? 'X' : ' '}] ${a.text} (${a.type}, ${a.priority} priority)`).join('\n')}

INTERVIEWS CONDUCTED: ${canvasData.interviews.length}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lean-canvas-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const saveData = () => {
    const dataStr = JSON.stringify(canvasData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lean-canvas-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderStepContent = () => {
    const step = steps[currentStep]
    const StepIcon = step.icon

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-full">
            <StepIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{step.title}</h2>
            <p className="text-gray-600">{step.description}</p>
          </div>
        </div>

        {step.fields.map(field => {
          const fieldKey = field as keyof CanvasData
          const value = canvasData[fieldKey]

          if (Array.isArray(value)) {
            return (
              <div key={field} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                {value.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateField(fieldKey, e.target.value, index)}
                      placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} ${index + 1}`}
                      className="flex-1"
                    />
                    {value.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeArrayItem(fieldKey, index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => addArrayItem(fieldKey)}
                  className="w-full"
                >
                  + Add Another
                </Button>
              </div>
            )
          } else {
            return (
              <div key={field} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <textarea
                  value={value as string}
                  onChange={(e) => updateField(fieldKey, e.target.value)}
                  placeholder={`Enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                  className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )
          }
        })}
      </div>
    )
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-3xl font-bold">Lean Canvas Wizard</CardTitle>
          <p className="text-blue-100 mt-2">Build your business model step by step</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {renderStepContent()}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={saveData}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Progress
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={() => setShowExportDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Your Lean Canvas</DialogTitle>
            <DialogDescription>
              Choose how you would like to export your business model canvas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              onClick={() => {
                generatePDF()
                setShowExportDialog(false)
              }}
              className="w-full"
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download as Text File
            </Button>
            <Button
              onClick={() => {
                saveData()
                setShowExportDialog(false)
              }}
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download as JSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LeanCanvasWizard
