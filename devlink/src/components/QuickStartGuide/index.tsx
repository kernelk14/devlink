import { useState } from 'react';
import { useUIStore } from '@/lib/store';
import { X, ArrowRight, Hash, MessageSquare, Users, Terminal, Send, Search, Settings, Star } from 'lucide-react';

interface QuickStartGuideProps {
  onClose: () => void;
}

interface Step {
  title: string;
  content: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    title: 'Welcome to DevLink',
    content: 'Your team\'s command center. A terminal-style chat for developers.',
    icon: <Terminal size={24} />,
  },
  {
    title: 'Join Channels',
    content: 'Click on any channel in the sidebar to join the conversation. Channels are organized by topic.',
    icon: <Hash size={24} />,
  },
  {
    title: 'Start Direct Messages',
    content: 'Click on any user in the "Direct Messages" section to start a private conversation.',
    icon: <MessageSquare size={24} />,
  },
  {
    title: 'Tabs & Multitasking',
    content: 'Open multiple channels/DMs in tabs. Click tabs to switch between them. Close tabs with X when done.',
    icon: <Star size={24} />,
  },
  {
    title: 'Quick Search',
    content: 'Press Ctrl+K anywhere to search messages, files, and teammates instantly.',
    icon: <Search size={24} />,
  },
  {
    title: 'Send Messages',
    content: 'Type your message and press Enter to send. Use Shift+Enter for new lines.',
    icon: <Send size={24} />,
  },
];

export function QuickStartGuide({ onClose }: QuickStartGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { addToast } = useUIStore();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      addToast({ type: 'success', message: 'Welcome to DevLink! You\'re all set.' });
      onClose();
    }
  };

  const handleSkip = () => {
    addToast({ type: 'info', message: 'Type /help anytime for assistance.' });
    onClose();
  };

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="quick-start-overlay">
      <div className="quick-start-guide">
        <div className="qs-header">
          <div className="qs-progress">
            {steps.map((_, i) => (
              <div key={i} className={`qs-dot ${i <= currentStep ? 'active' : ''}`} />
            ))}
          </div>
          <button className="qs-close" onClick={handleSkip}>
            <X size={16} />
          </button>
        </div>

        <div className="qs-icon">{step.icon}</div>
        <h2 className="qs-title">{step.title}</h2>
        <p className="qs-content">{step.content}</p>

        <div className="qs-actions">
          {currentStep > 0 && (
            <button className="qs-btn qs-btn-secondary" onClick={() => setCurrentStep(currentStep - 1)}>
              Back
            </button>
          )}
          <button className="qs-btn qs-btn-primary" onClick={handleNext}>
            {isLast ? 'Get Started' : 'Next'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}