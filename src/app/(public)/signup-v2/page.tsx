"use client"

import { useState } from "react"
import { BusinessDetails, AudioSamples } from "@/types/signup-v2"
import SignupLayout from "@/components/signup-v2/SignupLayout"
import Step1BusinessInfo from "@/components/signup-v2/Step1BusinessInfo"
import Step2Training from "@/components/signup-v2/Step3Training"
import Step3Preview from "@/components/signup-v2/Step4Preview"
import Step4CreateAccount from "@/components/signup-v2/Step5CreateAccount"
import ProgressIndicator from "@/components/signup-v2/ProgressIndicator"

export default function SignupV2Page() {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null)
  const [assistantId, setAssistantId] = useState<string | null>(null)
  const [audioSamples, setAudioSamples] = useState<AudioSamples | null>(null)

  const handleBusinessSubmitted = (business: BusinessDetails) => {
    setBusinessDetails(business)
    setCurrentStep(2)
  }

  const handleTrainingComplete = (assistant_id: string, audio: AudioSamples) => {
    setAssistantId(assistant_id)
    setAudioSamples(audio)
    setCurrentStep(3)
  }

  const handleClaimAgent = () => {
    setCurrentStep(4)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BusinessInfo onBusinessSubmitted={handleBusinessSubmitted} />
      case 2:
        return (
          <Step2Training
            business={businessDetails!}
            onTrainingComplete={handleTrainingComplete}
          />
        )
      case 3:
        return (
          <Step3Preview
            business={businessDetails!}
            audioSamples={audioSamples!}
            onClaimAgent={handleClaimAgent}
          />
        )
      case 4:
        return (
          <Step4CreateAccount
            assistantId={assistantId!}
            businessDetails={businessDetails!}
          />
        )
      default:
        return null
    }
  }

  return (
    <SignupLayout>
      <ProgressIndicator current={currentStep} total={4} />
      <div className="mt-8">{renderStep()}</div>
    </SignupLayout>
  )
}
