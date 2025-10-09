import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Archive, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SwipeTutorial({ isOpen, onClose }: SwipeTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoSwipeDistance, setDemoSwipeDistance] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = [
    {
      title: "Swipe to Manage Chats",
      description: "You can quickly archive or delete conversations with simple swipe gestures.",
      action: null
    },
    {
      title: "Swipe Right to Archive",
      description: "Swipe right on any chat to archive it. Archived chats can be restored later.",
      action: "archive"
    },
    {
      title: "Swipe Left to Delete",
      description: "Swipe left on any chat to delete it permanently. This action cannot be undone.",
      action: "delete"
    }
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setDemoSwipeDistance(0);
    }
  }, [isOpen]);

  const animateDemo = (direction: 'left' | 'right') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const targetDistance = direction === 'right' ? 120 : -120;
    
    // Animate to target
    setDemoSwipeDistance(targetDistance);
    
    setTimeout(() => {
      // Animate back to center
      setDemoSwipeDistance(0);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 1000);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Trigger demo animation for new step
      setTimeout(() => {
        if (steps[currentStep + 1].action === 'archive') {
          animateDemo('right');
        } else if (steps[currentStep + 1].action === 'delete') {
          animateDemo('left');
        }
      }, 500);
    } else {
      // Mark tutorial as completed
      localStorage.setItem('chatterbox-swipe-tutorial-seen', 'true');
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-2xl border max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Chat Gestures</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
            <p className="text-muted-foreground">{currentStepData.description}</p>
          </div>

          {/* Demo Area */}
          <div className="relative bg-muted/30 rounded-lg p-4 mb-6 overflow-hidden">
            {/* Background Action Indicators */}
            <div className={cn(
              "absolute inset-0 flex items-center justify-between px-6 transition-all duration-300",
              currentStepData.action === 'delete' && demoSwipeDistance < -50 ? 'bg-destructive opacity-70' :
              currentStepData.action === 'archive' && demoSwipeDistance > 50 ? 'bg-blue-500 opacity-70' :
              'opacity-0'
            )}>
              {/* Delete indicator */}
              <div className={cn(
                "flex items-center gap-2 text-white transition-all duration-300",
                demoSwipeDistance < -50 ? 'opacity-100' : 'opacity-0'
              )}>
                <Trash2 className="h-5 w-5" />
                <span className="font-medium">Delete</span>
              </div>

              {/* Archive indicator */}
              <div className={cn(
                "flex items-center gap-2 text-white transition-all duration-300",
                demoSwipeDistance > 50 ? 'opacity-100' : 'opacity-0'
              )}>
                <span className="font-medium">Archive</span>
                <Archive className="h-5 w-5" />
              </div>
            </div>

            {/* Demo Chat Item */}
            <div
              className="relative bg-background rounded-lg shadow-sm border transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(${demoSwipeDistance}px)`,
              }}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">JS</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">John Smith</p>
                  <p className="text-sm text-muted-foreground">Hey, how are you doing?</p>
                </div>
                <div className="text-xs text-muted-foreground">2m</div>
              </div>
            </div>

            {/* Gesture Hint */}
            {currentStepData.action && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border">
                  {currentStepData.action === 'archive' ? (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      <span>Swipe right</span>
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="h-3 w-3" />
                      <span>Swipe left</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}