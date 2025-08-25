'use client';

import { useState, useEffect } from 'react';

interface DialogueItem {
  dialogue_text: string;
  dialogue_type: string;
  weight: number;
}

interface CharacterDialogueProps {
  isVisible: boolean;
  triggerQuoteChangeCount: number;
}

export function CharacterDialogue({ isVisible, triggerQuoteChangeCount }: CharacterDialogueProps) {
  const [currentQuote, setCurrentQuote] = useState('');
  const [isDialogueVisible, setIsDialogueVisible] = useState(false);
  const [dialogueItems, setDialogueItems] = useState<DialogueItem[]>([]);

  // Load dialogue from the master table
  const loadDialogue = async () => {
    try {
      const response = await fetch('/api/master/character-dialogue');
      if (response.ok) {
        const data = await response.json();
        setDialogueItems(data.data);
      } else {
        console.error('Failed to load character dialogue');
      }
    } catch (error) {
      console.error('Error loading character dialogue:', error);
    }
  };

  // Get a random quote from the loaded dialogue (weighted selection)
  const getRandomQuote = () => {
    if (dialogueItems.length === 0) return '';
    
    // Create weighted array
    const weightedDialogues: DialogueItem[] = [];
    dialogueItems.forEach(dialogue => {
      for (let i = 0; i < dialogue.weight; i++) {
        weightedDialogues.push(dialogue);
      }
    });
    
    if (weightedDialogues.length === 0) return '';
    
    const randomIndex = Math.floor(Math.random() * weightedDialogues.length);
    return weightedDialogues[randomIndex].dialogue_text;
  };

  // Load dialogue when component mounts
  useEffect(() => {
    loadDialogue();
  }, []);

  // Update quote when component becomes visible
  useEffect(() => {
    if (isVisible && !isDialogueVisible) {
      // Add a small delay before showing the first dialogue
      const timer = setTimeout(() => {
        setCurrentQuote(getRandomQuote());
        setIsDialogueVisible(true);
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    } else if (!isVisible && isDialogueVisible) {
      setIsDialogueVisible(false);
    }
  }, [isVisible, isDialogueVisible]);

  // Change quote every 5 minutes when visible (reduced frequency)
  useEffect(() => {
    if (!isDialogueVisible) return;

    const interval = setInterval(() => {
      setCurrentQuote(getRandomQuote());
    }, 300000); // 5 minutes (increased from 60 seconds)

    return () => clearInterval(interval);
  }, [isDialogueVisible]);

  // Set initial quote when dialogue items are loaded
  useEffect(() => {
    if (isVisible && dialogueItems.length > 0) {
      setCurrentQuote(getRandomQuote());
    }
  }, [dialogueItems, isVisible]);

  // Handle click-triggered quote changes
  useEffect(() => {
    if (isVisible && triggerQuoteChangeCount > 0) {
      setCurrentQuote(getRandomQuote());
    }
  }, [triggerQuoteChangeCount, isVisible]);

  if (!isDialogueVisible || !currentQuote) {
    return null;
  }

  return (
    <div className="character-dialogue">
      {/* Speech bubble */}
      <div className="relative bg-[#f5f5dc] border-2 border-[#8B4513] rounded-lg p-3 sm:p-4 shadow-lg animate-fade-in min-w-[240px] sm:min-w-[280px]">
        {/* Speech bubble tail */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#8B4513]"></div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-[#f5f5dc] mt-0.5"></div>
        
        {/* Quote text */}
        <p className="text-[#8B4513] text-xs sm:text-sm font-medium leading-relaxed text-center whitespace-normal">
          "{currentQuote}"
        </p>
      </div>
    </div>
  );
}
