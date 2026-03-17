"use client"

import { useState } from "react"
import { BusinessDetails, AudioSamples } from "@/types/signup-v2"
import SignupLayout from "@/components/signup-v2/SignupLayout"
import Step1GoogleLookup from "@/components/signup-v2/Step1GoogleLookup"
import Step2ConfirmBusiness from "@/components/signup-v2/Step2ConfirmBusiness"
import Step3Training from "@/components/signup-v2/Step3Training"
import Step4Preview from "@/components/signup-v2/Step4Preview"
import Step5CreateAccount from "@/components/signup-v2/Step5CreateAccount"
import ProgressIndicator from "@/components/signup-v2/ProgressIndicator"

export default function SignupV2Page() {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null)
  const [assistantId, setAssistantId] = useState<string | null>(null)
  const [audioSamples, setAudioSamples] = useState<AudioSamples | null>(null)

  const handleBusinessSelected = (business: BusinessDetails) => {
    setBusinessDetails(business)
    setCurrentStep(2)
  }

  const handleBusinessConfirmed = () => {
    setCurrentStep(3)
  }

  const handleTrainingComplete = (assistant_id: string, audio: AudioSamples) => {
    setAssistantId(assistant_id)
    setAudioSamples(audio)
    setCurrentStep(4)
  }

  const handleClaimAgent = () => {
    setCurrentStep(5)
  }

  const handleGoBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1GoogleLookup onBusinessSelected={handleBusinessSelected} />
      case 2:
        return (
          <Step2ConfirmBusiness
            business={businessDetails!}
            onConfirm={handleBusinessConfirmed}
            onGoBack={handleGoBack}
          />
        )
      case 3:
        return (
          <Step3Training
            business={businessDetails!}
            onTrainingComplete={handleTrainingComplete}
          />
        )
      case 4:
        return (
          <Step4Preview
            business={businessDetails!}
            audioSamples={audioSamples!}
            onClaimAgent={handleClaimAgent}
          />
        )
      case 5:
        return (
          <Step5CreateAccount
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
      <ProgressIndicator current={currentStep} total={5} />
      <div className="mt-8">{renderStep()}</div>
    </SignupLayout>
  )
}
