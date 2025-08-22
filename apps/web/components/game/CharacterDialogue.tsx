'use client';

import { useState, useEffect } from 'react';

const DIALOGUE_QUOTES = [
  "Sharpening my courage… and this butter knife.",
  "Discipline is a spell I cast every morning.",
  "Quiet steps, loud wins.",
  "Hey, partner—guard the calm, I'll guard the quest.",
  "Every minute I focus, the dragon sneezes a little.",
  "Treasure maps are just to-do lists with flair.",
  "One breath in, one task down.",
  "XP is just patience wearing a cape.",
  "Sparks like these? Earned, not found.",
  "I packed snacks and resolve—mostly resolve.",
  "A tidy mind swings straighter than any sword.",
  "Today's boss: distractions. Weak to silence.",
  "I'm not tiny—I'm concentrated.",
  "Footwork quiet, heartbeat steady.",
  "The dungeon of procrastination has endless corridors. I brought a lantern.",
  "Discipline is my favorite rare drop.",
  "We train small to win big.",
  "Another pebble on the path to the peak.",
  "Focus first, fireworks later.",
  "The dragon fears checkmarks.",
  "Steel your will; I'll steel the dagger.",
  "Routine is just fast travel for progress.",
  "Shh—listening for the next right step.",
  "Mobs respawn. Momentum shouldn't.",
  "A calm mind is my strongest stat.",
  "I can hear the treasure chest clicking 'almost.'",
  "Hero tip: bravery looks a lot like finishing.",
  "We don't chase motivation; we schedule it.",
  "One quiet session. One louder life.",
  "Even dragons blink. That's our window.",
  "Sparks love discipline more than luck.",
  "If focus had footsteps, you'd hear marching.",
  "Quest log says: do the next small thing.",
  "I polished my shield and my priorities.",
  "Adventure begins when excuses end.",
  "The map is messy; our steps don't have to be.",
  "Sword in hand, phone asleep—perfect.",
  "Tiny heroes take giant minutes.",
  "I put bravery on repeat.",
  "Progress tastes like warm bread and effort.",
  "The dragon whispers 'later'; we answer 'now.'",
  "I'm stacking quiet like coins.",
  "Discipline isn't heavy when you lift it daily.",
  "We'll out-focus the flame.",
  "I'll handle the mobs; you handle the stillness.",
  "Patience: the crit hit of real life.",
  "I aim my arrows where attention points.",
  "The questline of today: start, stick, finish.",
  "Small stride, sure stride, victory stride.",
  "Our best loot? Habits we actually use.",
  "Eyes on the path, heart on the prize.",
  "We're not just defeating a dragon—we're becoming the hero who can.",
  "Maps can fib; minutes never do.",
  "I keep the torch; you keep the hush.",
  "Quiet turns to coins faster than crits.",
  "The timer is our drum. March with me.",
  "A steady breath beats a shiny sword.",
  "Focus is just bravery sitting still.",
  "I packed patience, on purpose.",
  "Every checkmark is a tiny roar back.",
  "Let the phone sleep—let the hero wake.",
  "We loot time and forge progress.",
  "The path clears when the mind does.",
  "Small wins stack like bricks—castle soon.",
  "I'm saving my crit for distractions.",
  "Lantern bright, excuses light.",
  "Grinding XP? More like polishing today.",
  "One minute more. That's the secret door.",
  "Focus casts shield on everything else.",
  "The calm is our companion.",
  "Aim true, even at tiny tasks.",
  "Sparks follow footsteps, not wishes.",
  "I brought resolve; it fits every dungeon.",
  "Silence is my favorite buff.",
  "We don't rush— we repeat.",
  "Dragons hate tidy lists.",
  "Let the world scroll; we'll stroll.",
  "Mind steady, hands steady, story steady.",
  "I'll guard the quest if you guard the quiet.",
  "Routine is the rope bridge—cross it daily.",
  "The treasure is attention, not the chest.",
  "Hold the stillness; I'll hold the line.",
  "Every 'now' is a secret shortcut.",
  "Focus first, flair later.",
  "We train the minute, the minute trains us.",
  "Turn effort into echo: done, done, done.",
  "When I'm ready, the path is ready.",
  "Defeat the dragon? Easy—one calm session at a time."
];

interface CharacterDialogueProps {
  isVisible: boolean;
  triggerQuoteChangeCount: number;
}

export function CharacterDialogue({ isVisible, triggerQuoteChangeCount }: CharacterDialogueProps) {
  const [currentQuote, setCurrentQuote] = useState('');
  const [isDialogueVisible, setIsDialogueVisible] = useState(false);

  // Get a random quote from the list
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * DIALOGUE_QUOTES.length);
    return DIALOGUE_QUOTES[randomIndex];
  };

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

  // Change quote every minute when visible
  useEffect(() => {
    if (!isDialogueVisible) return;

    const interval = setInterval(() => {
      setCurrentQuote(getRandomQuote());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isDialogueVisible]);

  // Set initial quote when component mounts
  useEffect(() => {
    if (isVisible) {
      setCurrentQuote(getRandomQuote());
    }
  }, []);

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
    <div className="absolute bottom-32 sm:bottom-36 left-1/2 transform -translate-x-1/2 z-20 max-w-sm sm:max-w-md lg:max-w-lg">
      {/* Speech bubble */}
      <div className="relative bg-[#f5f5dc] border-2 border-[#8B4513] rounded-lg p-3 sm:p-4 shadow-lg animate-fade-in min-w-[280px] sm:min-w-[320px]">
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
