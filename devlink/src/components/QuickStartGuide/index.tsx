import { useState } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { X, ArrowRight, Hash, MessageSquare, Users, Terminal, Send, Search, Star, Sparkles, Keyboard, Settings } from 'lucide-react';

interface QuickStartGuideProps {
  onClose: () => void;
}

interface Step {
  title: string;
  content: string;
  icon: React.ReactNode;
  bullets?: string[];
  note?: string;
}

const steps: Step[] = [
  {
    title: 'Welcome to DevLink',
    content: 'A terminal-style team workspace designed to keep your conversations fast, focused, and searchable.',
    icon: <Terminal size={28} />,
    bullets: [
      'Command-line inspired chat and collaboration',
      'Channels, DMs, and tabs for modern workflows',
    ],
  },
  {
    title: 'Quick Setup Guide',
    content: 'Set up your profile to make DevLink yours. Add your display name and connect your accounts.',
    icon: <Settings size={28} />,
    bullets: [
      'Click your avatar in the bottom-left to edit your profile',
      'Set your display name and status',
      'Connect with teammates by adding them as contacts',
      'Configure notifications from the bell icon',
    ],
  },
  {
    title: 'Join Channels',
    content: 'Channels are your project rooms. Each one keeps topic-specific discussions together and easy to follow.',
    icon: <Hash size={28} />,
    bullets: [
      'Click a channel in the sidebar to open it',
      'Keep conversations organized by topic',
    ],
  },
  {
    title: 'Direct Messages',
    content: 'Quickly message teammates privately without leaving the terminal-style interface.',
    icon: <MessageSquare size={28} />,
    bullets: [
      'Open a DM to chat one-on-one',
      'DMs appear as tabs for fast switching',
    ],
  },
  {
    title: 'Tabs & Multitasking',
    content: 'Keep multiple conversations open at once and switch instantly between channels and DMs.',
    icon: <Users size={28} />,
    bullets: [
      'Open several tabs for your active work',
      'Close tabs when you’re done to stay focused',
    ],
  },
  {
    title: 'Search Faster',
    content: 'Ctrl+K opens search from anywhere, so you can find messages, channels, and teammates instantly.',
    icon: <Search size={28} />,
    bullets: [
      'Search across all conversations',
      'Jump to channels and DMs in seconds',
    ],
  },
  {
    title: 'Threads & Replies',
    content: 'Keep discussions focused by replying to specific messages in threads.',
    icon: <MessageSquare size={28} />,
    bullets: [
      'Hover over a message and click Reply',
      'Threads open in the right panel',
      'Keep main channel clean while diving deep',
    ],
  },
  {
    title: 'Add Reactions',
    content: 'Express yourself quickly with emoji reactions on messages.',
    icon: <Sparkles size={28} />,
    bullets: [
      'Hover over a message to see reaction options',
      'Click an emoji to add your reaction',
      'See who reacted by hovering the emoji',
    ],
  },
  {
    title: 'Keyboard Shortcuts',
    content: 'Navigate like a pro with keyboard shortcuts designed for speed.',
    icon: <Keyboard size={28} />,
    bullets: [
      'Ctrl+K: Open search',
      'Ctrl+,: Open settings',
      '?: Show all shortcuts',
    ],
  },
  {
    title: 'Customize Your Experience',
    content: 'Tailor DevLink to your workflow with settings and preferences.',
    icon: <Settings size={28} />,
    bullets: [
      'Click your avatar for user settings',
      'Configure notifications and themes',
      'Access help and shortcuts anytime',
    ],
  },
  {
    title: 'Send Your First Message',
    content: 'Type your message and press Enter to send. Use Shift+Enter to insert a new line.',
    icon: <Send size={28} />,
    bullets: [
      'Compose with markdown-style formatting',
      'Use reactions to keep conversations moving',
    ],
    note: 'Tip: The guide is available again from Settings > Help.',
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