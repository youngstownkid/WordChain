import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Moon,
  Sun,
  Play,
  Check,
  X,
  ArrowRight,
  ArrowDown,
  Shuffle,
  RefreshCw,
  SkipForward,
  Power,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { loadWordList, isValidWord, findWordsFromLetters } from "./wordlist";
import { loadMessages, getMessage } from "./messages";

type Letter =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z";

interface BoardTile {
  letter: Letter;
  score: number;
}

interface PlacedTile {
  row: number;
  col: number;
  letter: Letter;
}

interface PlayerStats {
  highStreak: number;
  totalScore: number;
  runOuts: number;
  bestWordScore: number;
}

interface CareerStats {
  gamesPlayed: number;
  gamesWon: number;
  bestGameScore: number;
  bestWordScore: number;
  bestComboStreak: number;
  careerRunOuts: number;
}

const DEFAULT_CAREER_STATS: CareerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  bestGameScore: 0,
  bestWordScore: 0,
  bestComboStreak: 0,
  careerRunOuts: 0,
};

type SquareType = "normal" | "DL" | "TL" | "DW" | "TW" | "center";

type GameMode = "normal" | "group" | "swap" | "forceSwapPass";

type ComboBonusType =
  | "multiplier"
  | "increment10"
  | "increment25"
  | "increment50"
  | "increment100";

const LETTER_SCORES: Record<Letter, number> = {
  A: 1,
  B: 3,
  C: 3,
  D: 2,
  E: 1,
  F: 4,
  G: 2,
  H: 4,
  I: 1,
  J: 8,
  K: 5,
  L: 1,
  M: 3,
  N: 1,
  O: 1,
  P: 3,
  Q: 10,
  R: 1,
  S: 1,
  T: 1,
  U: 1,
  V: 4,
  W: 4,
  X: 8,
  Y: 4,
  Z: 10,
};

const LETTER_DISTRIBUTION: Record<Letter, number> = {
  A: 9,
  B: 2,
  C: 2,
  D: 4,
  E: 12,
  F: 2,
  G: 3,
  H: 2,
  I: 9,
  J: 1,
  K: 1,
  L: 4,
  M: 2,
  N: 6,
  O: 8,
  P: 2,
  Q: 1,
  R: 6,
  S: 4,
  T: 6,
  U: 4,
  V: 2,
  W: 2,
  X: 1,
  Y: 2,
  Z: 1,
};

const BOARD_SIZE = 15;

const PREMIUM_SQUARES: SquareType[][] = [
  [
    "TW",
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
    "normal",
    "TW",
    "normal",
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
    "TW",
  ],
  [
    "normal",
    "DW",
    "normal",
    "normal",
    "normal",
    "TL",
    "normal",
    "normal",
    "normal",
    "TL",
    "normal",
    "normal",
    "normal",
    "DW",
    "normal",
  ],
  [
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
    "normal",
    "DL",
    "normal",
    "DL",
    "normal",
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
  ],
  [
    "DL",
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
    "DL",
  ],
  [
    "normal",
    "normal",
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
    "normal",
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
    "normal",
    "normal",
  ],
  [
    "normal",
    "TL",
    "normal",
    "normal",
    "normal",
    "TL",
    "normal",
    "normal",
    "normal",
    "TL",
    "normal",
    "normal",
    "normal",
    "TL",
    "normal",
  ],
  [
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
    "normal",
    "DL",
    "normal",
    "DL",
    "normal",
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
  ],
  [
    "TW",
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
    "normal",
    "center",
    "normal",
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
    "TW",
  ],
  [
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
    "normal",
    "DL",
    "normal",
    "DL",
    "normal",
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
  ],
  [
    "normal",
    "TL",
    "normal",
    "normal",
    "normal",
    "TL",
    "normal",
    "normal",
    "normal",
    "TL",
    "normal",
    "normal",
    "normal",
    "TL",
    "normal",
  ],
  [
    "normal",
    "normal",
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
    "normal",
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
    "normal",
    "normal",
  ],
  [
    "DL",
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
    "DL",
  ],
  [
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
    "normal",
    "DL",
    "normal",
    "DL",
    "normal",
    "normal",
    "normal",
    "DW",
    "normal",
    "normal",
  ],
  [
    "normal",
    "DW",
    "normal",
    "normal",
    "normal",
    "TL",
    "normal",
    "normal",
    "normal",
    "TL",
    "normal",
    "normal",
    "normal",
    "DW",
    "normal",
  ],
  [
    "TW",
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
    "normal",
    "TW",
    "normal",
    "normal",
    "normal",
    "DL",
    "normal",
    "normal",
    "TW",
  ],
];

const createWelcomeBoard = (): (BoardTile | null)[][] => {
  const emptyBoard = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  // Spell "WORD" horizontally in the middle
  writeWord(emptyBoard, "WORD", 7, 3);
  writeWord(emptyBoard, "CHAIN", 7, 8);

  return emptyBoard;
};

function writeWord(
  emptyBoard: any[][],
  word: string,
  row: number,
  col: number,
) {
  for (let i = 0; i < word.length; i++) {
    const letter = word[i] as Letter;
    emptyBoard[row][col + i] = {
      letter: letter,
      score: LETTER_SCORES[letter],
    };
  }
}
const WordGame = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [board, setBoard] =
    useState<(BoardTile | null)[][]>(createWelcomeBoard);
  const [playerRack, setPlayerRack] = useState<Letter[]>([]);
  const [opponentRack, setOpponentRack] = useState<Letter[]>([]);
  const [draggedTile, setDraggedTile] = useState<{
    letter: Letter;
    source: "rack" | "board";
    index?: number;
    row?: number;
    col?: number;
  } | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal",
  );
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [tileBag, setTileBag] = useState<Letter[]>([]);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isFirstMove, setIsFirstMove] = useState<boolean>(true);
  const [currentPlayer, setCurrentPlayer] = useState<"player" | "opponent">(
    "player",
  );
  const [difficulty, setDifficulty] = useState<
    "beginner" | "intermediate" | "advanced" | "expert"
  >("intermediate");
  const [wordListLoaded, setWordListLoaded] = useState<boolean>(false);
  const [invalidTiles, setInvalidTiles] = useState<PlacedTile[]>([]);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [lastPlayedTiles, setLastPlayedTiles] = useState<PlacedTile[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    highStreak: 0,
    totalScore: 0,
    runOuts: 0,
    bestWordScore: 0,
  });
  const [opponentStats, setOpponentStats] = useState<PlayerStats>({
    highStreak: 0,
    totalScore: 0,
    runOuts: 0,
    bestWordScore: 0,
  });
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<number>(0); // 0 means no timer
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [showTimeoutDialog, setShowTimeoutDialog] = useState<boolean>(false);
  const [timerExpired, setTimerExpired] = useState<boolean>(false); // Tracks if timer ran out this turn
  const [isSwapMode, setIsSwapMode] = useState<boolean>(false); // Tracks if user is in swap tile selection mode
  const [gameMode, setGameMode] = useState<GameMode>("normal"); // Tracks current game mode
  const [playerConsecutivePasses, setPlayerConsecutivePasses] =
    useState<number>(0); // Tracks consecutive passes for  player
  const [opponentConsecutivePasses, setOpponentConsecutivePasses] =
    useState<number>(0); // Tracks consecutive passes opponent
  const [showPassWarning, setShowPassWarning] = useState<boolean>(false); // Shows warning before final pass
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false); // Shows quit confirmation dialog
  const [showGameOverDialog, setShowGameOverDialog] = useState<boolean>(false); // Shows game over dialog with stats
  const [careerStats, setCareerStats] =
    useState<CareerStats>(DEFAULT_CAREER_STATS); // Career stats
  const [statsExpanded, setStatsExpanded] = useState<boolean>(false); // Details section collapsed by default
  const [playerComboStreak, setPlayerComboStreak] = useState<number>(0); // Player's combo streak (0 = no combo, 2+ = active)
  const [opponentComboStreak, setOpponentComboStreak] = useState<number>(0); // Opponent's combo streak (0 = no combo, 2+ = active)
  const [comboBonusType, setComboBonusType] =
    useState<ComboBonusType>("increment25"); // "multiplier" = 2x, 3x, 4x; "increment10/25/50/100" = +10%/25%/50%/100% per combo

  // Helper to get increment step from bonus type
  const getIncrementStep = (bonusType: ComboBonusType): number => {
    switch (bonusType) {
      case "multiplier":
      case "increment100":
        return 100;
      case "increment50":
        return 50;
      case "increment25":
        return 25;
      case "increment10":
        return 10;
      default:
        return 25;
    }
  };

  // Helper to format combo display for a given streak
  const formatComboDisplay = (
    streak: number,
    bonusType: ComboBonusType = comboBonusType,
  ): string => {
    if (bonusType === "multiplier" || bonusType === "increment100") {
      return `${streak}x`;
    }
    const step = getIncrementStep(bonusType);
    return `+${(streak - 1) * step}%`;
  };

  // Touch drag state
  const [touchDragTile, setTouchDragTile] = useState<{
    letter: Letter;
    source: "rack" | "board";
    index?: number;
    row?: number;
    col?: number;
  } | null>(null);
  const [touchDragPosition, setTouchDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [touchMultiTiles, setTouchMultiTiles] = useState<{
    tiles: Letter[];
    indices: number[];
  } | null>(null);
  const [touchHoldInfo, setTouchHoldInfo] = useState<{
    startX: number;
    startY: number;
    rackIndex: number;
  } | null>(null);
  const touchHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const rackRef = useRef<HTMLDivElement>(null);

  // Double-tap recall state
  const [lastTapInfo, setLastTapInfo] = useState<{
    row: number;
    col: number;
    time: number;
  } | null>(null);
  const [recallingTiles, setRecallingTiles] = useState<
    {
      row: number;
      col: number;
    }[]
  >([]);
  const [flyingTiles, setFlyingTiles] = useState<
    {
      id: string;
      letter: Letter;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      startSize: number;
      endSize: number;
      delay: number;
    }[]
  >([]);

  useEffect(() => {
    // Only load messages on mount, not the word list
    const initMessages = async () => {
      await loadMessages();
    };
    initMessages();

    // Load saved game state from localStorage
    const savedState = localStorage.getItem("scrabbull-game-state");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setBoard(state.board);
        setPlayerRack(state.playerRack);
        setOpponentRack(state.opponentRack);
        setTileBag(state.tileBag);
        setPlayerScore(state.playerScore);
        setOpponentScore(state.opponentScore);
        setPlacedTiles(state.placedTiles || []);
        setIsFirstMove(state.isFirstMove);
        setCurrentPlayer(state.currentPlayer);
        setDifficulty(state.difficulty);
        setGameStarted(state.gameStarted);
        setPlayerStats(state.playerStats);
        setOpponentStats(state.opponentStats);
        setTimerDuration(state.timerDuration || 0);
        setWordListLoaded(state.wordListLoaded || false);
        setMultiSelectMode(state.multiSelectMode || false);
        setIsSwapMode(state.isSwapMode || false);
        setGameMode(state.gameMode || "normal");
        setComboBonusType(state.comboBonusType || "increment25");

        // Restore combo state
        setPlayerComboStreak(state.playerComboStreak || 0);
        setOpponentComboStreak(state.opponentComboStreak || 0);
        setLastPlayedTiles(state.lastPlayedTiles || []);

        // Restore timer state directly from saved data
        const savedTimerExpired = state.timerExpired || false;
        const savedShowTimeoutDialog = state.showTimeoutDialog || false;

        setTimerExpired(savedTimerExpired);

        if (state.timerDuration && state.timerDuration > 0) {
          // If timer was expired, keep it at 0 regardless of saved timeRemaining
          if (savedTimerExpired) {
            setTimeRemaining(0);
            // If timer expired and it's player's turn, show timeout dialog on refresh
            // (unless user is already in swap mode, meaning they chose to swap)
            if (state.currentPlayer === "player" && !state.isSwapMode) {
              setShowTimeoutDialog(true);
            } else {
              setShowTimeoutDialog(savedShowTimeoutDialog);
            }
          } else {
            // Timer not expired - restore saved time (default to full duration if not saved)
            setTimeRemaining(
              state.timeRemaining !== undefined
                ? state.timeRemaining
                : state.timerDuration,
            );
            setShowTimeoutDialog(savedShowTimeoutDialog);
          }
        } else {
          setShowTimeoutDialog(savedShowTimeoutDialog);
        }

        // Show "Resuming from..." message if there's a timestamp
        if (state.gameStarted && state.timestamp) {
          const resumeDate = new Date(state.timestamp);
          const formattedDate = resumeDate.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          setMessage(`Resuming game from ${formattedDate}`);

          // Clear the resume message after 3 seconds and show appropriate message
          setTimeout(() => {
            if (state.currentPlayer === "player") {
              // Check if timer expired or in forceSwapPass mode
              if (savedTimerExpired || state.gameMode === "forceSwapPass") {
                setMessage(getMessage("TimesUpMustSwapOrPass"));
              } else if (state.isFirstMove) {
                setMessage(getMessage("YourTurn"));
              } else {
                setMessage(getMessage("YourTurn"));
              }
            }
          }, 3000);
        } else if (state.gameStarted && state.currentPlayer === "player") {
          // Show appropriate message based on game state
          if (savedTimerExpired || state.gameMode === "forceSwapPass") {
            setMessage(getMessage("TimesUpMustSwapOrPass"));
          } else if (state.isFirstMove) {
            setMessage(getMessage("YourTurn"));
          } else {
            setMessage(getMessage("YourTurn"));
          }
        }
      } catch (error) {
        console.error("Failed to load saved game state:", error);
      }
    }

    // Load career stats from localStorage
    const savedCareerStats = localStorage.getItem("wordchain-career-stats");
    if (savedCareerStats) {
      try {
        const stats = JSON.parse(savedCareerStats);
        setCareerStats({ ...DEFAULT_CAREER_STATS, ...stats });
      } catch (error) {
        console.error("Failed to load career stats:", error);
      }
    }
  }, []);

  // Preview score when tiles are placed
  useEffect(() => {
    const showScorePreview = async () => {
      if (placedTiles.length === 0 || currentPlayer !== "player") {
        return;
      }

      // Validate the placement
      const validation = await validatePlacement(
        board,
        placedTiles,
        isFirstMove,
      );

      if (validation.valid) {
        // Create a merged board with placed tiles for scoring calculation
        const boardWithPlacedTiles = board.map((row) => [...row]);
        placedTiles.forEach((tile) => {
          boardWithPlacedTiles[tile.row][tile.col] = {
            letter: tile.letter,
            score: LETTER_SCORES[tile.letter] || 0,
          };
        });

        const scoring = calculateFullScore(
          boardWithPlacedTiles,
          placedTiles,
          lastPlayedTiles,
          playerComboStreak,
        );
        const wordsText = validation.words.join(", ");

        let bonus = "";
        if (scoring.isCombo) {
          bonus =
            comboBonusType === "multiplier" || comboBonusType === "increment100"
              ? ` x${scoring.comboMultiplier}`
              : ` +${scoring.comboPercentage}%`;
        }

        let runOut = "";
        if (scoring.isRunOut) {
          runOut = "+50";
        }

        let previewMessage = `${wordsText} scores ${scoring.baseScore}${bonus}${runOut} = ${scoring.finalScore}pts`;
        setMessage(previewMessage);
      }
    };

    showScorePreview();
  }, [placedTiles, board, currentPlayer, isFirstMove]);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (gameStarted) {
      const gameState = {
        board,
        playerRack,
        opponentRack,
        tileBag,
        playerScore,
        opponentScore,
        placedTiles,
        isFirstMove,
        currentPlayer,
        difficulty,
        gameStarted,
        playerStats,
        opponentStats,
        timerDuration,
        wordListLoaded,
        timeRemaining,
        timerExpired,
        showTimeoutDialog,
        multiSelectMode,
        isSwapMode,
        gameMode,
        comboBonusType,
        // Combo state
        playerComboStreak,
        opponentComboStreak,
        lastPlayedTiles,
        timestamp: Date.now(), // Timestamp for "Resuming from..." message
      };
      localStorage.setItem("scrabbull-game-state", JSON.stringify(gameState));
    }
  }, [
    board,
    playerRack,
    opponentRack,
    tileBag,
    playerScore,
    opponentScore,
    placedTiles,
    isFirstMove,
    currentPlayer,
    difficulty,
    gameStarted,
    playerStats,
    opponentStats,
    timerDuration,
    wordListLoaded,
    timeRemaining,
    timerExpired,
    showTimeoutDialog,
    multiSelectMode,
    isSwapMode,
    gameMode,
    comboBonusType,
    playerComboStreak,
    opponentComboStreak,
    lastPlayedTiles,
  ]);

  // Auto-save timer state every second while timer is running
  useEffect(() => {
    if (
      gameStarted &&
      timerDuration > 0 &&
      currentPlayer === "player" &&
      !gameEnded &&
      !timerExpired
    ) {
      const saveInterval = setInterval(() => {
        // Update localStorage with current timer state
        const savedState = localStorage.getItem("scrabbull-game-state");
        if (savedState) {
          try {
            const state = JSON.parse(savedState);
            state.timeRemaining = timeRemaining;
            state.timestamp = Date.now();
            localStorage.setItem("scrabbull-game-state", JSON.stringify(state));
          } catch (error) {
            console.error("Failed to auto-save timer state:", error);
          }
        }
      }, 1000); // Save every second

      return () => clearInterval(saveInterval);
    }
  }, [
    gameStarted,
    timerDuration,
    currentPlayer,
    gameEnded,
    timerExpired,
    timeRemaining,
  ]);

  // Timer countdown
  useEffect(() => {
    if (
      currentPlayer === "player" &&
      timerDuration > 0 &&
      gameStarted &&
      !gameEnded &&
      !showTimeoutDialog &&
      !timerExpired
    ) {
      // Clear any existing timer
      if (timerInterval) {
        clearInterval(timerInterval);
      }

      // Start new timer - only reset to full duration if timeRemaining is 0 or greater than duration
      // This preserves the timer when resuming from a saved game
      if (timeRemaining === 0 || timeRemaining > timerDuration) {
        setTimeRemaining(timerDuration);
      }

      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimerInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else if (timerInterval && currentPlayer === "opponent") {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [
    currentPlayer,
    timerDuration,
    gameStarted,
    gameEnded,
    showTimeoutDialog,
    timerExpired,
  ]);

  // Handle timer expiration - auto-submit or recall tiles
  useEffect(() => {
    const handleTimerExpiration = async () => {
      // Only trigger when timer hits 0 for the first time this turn
      // Also check that we have a timer (timerDuration > 0) to avoid triggering on initial 0 value
      if (
        timeRemaining === 0 &&
        timerDuration > 0 &&
        currentPlayer === "player" &&
        !timerExpired &&
        !showTimeoutDialog &&
        gameStarted &&
        !gameEnded
      ) {
        // Mark as expired immediately to prevent re-triggering
        setTimerExpired(true);

        if (placedTiles.length > 0) {
          // Check if the placed tiles form a valid word
          const validation = await validateWordPlacement();
          if (validation.valid) {
            // Auto-submit the valid word - don't show timeout dialog
            await submitWord();
            // submitWord already handles resetting timerExpired
          } else {
            // Recall tiles if invalid and show timeout dialog
            const newBoard = board.map((r) => [...r]);
            const lettersToReturn: Letter[] = [];

            placedTiles.forEach((tile) => {
              newBoard[tile.row][tile.col] = null;
              lettersToReturn.push(tile.letter);
            });

            setBoard(newBoard);
            setPlayerRack([...playerRack, ...lettersToReturn]);
            setPlacedTiles([]);
            setInvalidTiles([]);
            setShowTimeoutDialog(true);
          }
        } else {
          // No tiles placed, show timeout dialog
          setShowTimeoutDialog(true);
        }
      }
    };

    handleTimerExpiration();
  }, [
    timeRemaining,
    currentPlayer,
    timerExpired,
    showTimeoutDialog,
    placedTiles.length,
    gameStarted,
    gameEnded,
  ]);

  const initializeGame = async () => {
    // Load word list if not already loaded
    if (!wordListLoaded) {
      setMessage("Loading dictionary...");
      await loadWordList();
      setWordListLoaded(true);
    }

    setGameStarted(true);
    const newBoard: (BoardTile | null)[][] = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));
    setBoard(newBoard);

    const bag: Letter[] = [];
    Object.entries(LETTER_DISTRIBUTION).forEach(([letter, count]) => {
      for (let i = 0; i < count; i++) {
        bag.push(letter as Letter);
      }
    });

    const shuffled = [...bag];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const playerStartRack = shuffled.slice(0, 7);
    const opponentStartRack = shuffled.slice(7, 14);
    const remainingBag = shuffled.slice(14);

    setPlayerRack(playerStartRack);
    setOpponentRack(opponentStartRack);
    setTileBag(remainingBag);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlacedTiles([]);
    setIsFirstMove(true);
    setLastPlayedTiles([]);
    setPlayerStats({
      highStreak: 0,
      totalScore: 0,
      runOuts: 0,
      bestWordScore: 0,
    });
    setOpponentStats({
      highStreak: 0,
      totalScore: 0,
      runOuts: 0,
      bestWordScore: 0,
    });
    setGameEnded(false);
    setShowCelebration(false);
    setShowTimeoutDialog(false);
    setShowGameOverDialog(false);
    setTimerExpired(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimeRemaining(timerDuration);

    // Randomize who goes first
    const startingPlayer = Math.random() < 0.5 ? "player" : "opponent";
    setCurrentPlayer(startingPlayer);

    if (startingPlayer === "player") {
      setMessage(getMessage("YourTurn"));
    } else {
      setMessage(getMessage("OpponentGoesFirst"));
      // Pass the new board and rack directly since state won't be updated yet
      setTimeout(
        () => opponentTurn(newBoard, opponentStartRack, remainingBag),
        1000,
      );
    }
  };

  const handleMouseDown = (index: number) => {
    if (currentPlayer !== "player") return;

    // In swap mode, allow individual tile selection/deselection
    if (isSwapMode) {
      if (selectedTiles.includes(index)) {
        // Deselect tile
        setSelectedTiles(selectedTiles.filter((i) => i !== index));
      } else {
        // Select tile
        setSelectedTiles([...selectedTiles, index].sort((a, b) => a - b));
      }
      return;
    }

    if (multiSelectMode) {
      if (selectedTiles.includes(index)) {
        const minSelected = Math.min(...selectedTiles);
        const maxSelected = Math.max(...selectedTiles);

        if (index === minSelected) {
          setSelectedTiles(selectedTiles.filter((i) => i !== index));
        } else if (index === maxSelected) {
          setSelectedTiles(selectedTiles.filter((i) => i !== index));
        }
      } else {
        if (selectedTiles.length === 0) {
          setSelectedTiles([index]);
        } else {
          const minSelected = Math.min(...selectedTiles);
          const maxSelected = Math.max(...selectedTiles);

          if (index === minSelected - 1 || index === maxSelected + 1) {
            setSelectedTiles([...selectedTiles, index].sort((a, b) => a - b));
          }
        }
      }
    } else {
      const timer = setTimeout(() => {
        setMultiSelectMode(true);
        setSelectedTiles([index]);
        setMessage(getMessage("GroupModeActivated"));
      }, 500);
      setHoldTimer(timer);
    }
  };

  const handleMouseUp = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
  };

  const handleDragEnd = () => {
    if (!multiSelectMode) {
      setSelectedTiles([]);
    }
  };

  const handleDragStart = (
    e: React.DragEvent,
    letter: Letter,
    source: "rack" | "board",
    index?: number,
    row?: number,
    col?: number,
  ) => {
    if (currentPlayer !== "player") return;

    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }

    if (
      source === "rack" &&
      multiSelectMode &&
      selectedTiles.length > 1 &&
      index !== undefined &&
      selectedTiles.includes(index)
    ) {
      const tilesToDrag = selectedTiles.map((i) => playerRack[i]);
      e.dataTransfer.setData(
        "multiTiles",
        JSON.stringify({ tiles: tilesToDrag, indices: selectedTiles }),
      );
      e.dataTransfer.effectAllowed = "move";
    } else if (source === "rack" && index !== undefined && !multiSelectMode) {
      setDraggedTile({ letter, source, index, row, col });
      e.dataTransfer.effectAllowed = "move";
    } else {
      setDraggedTile({ letter, source, index, row, col });
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback(
    (
      e: React.TouchEvent,
      letter: Letter,
      source: "rack" | "board",
      index?: number,
      row?: number,
      col?: number,
    ) => {
      if (currentPlayer !== "player") return;

      // Don't start drag in swap mode - just handle selection
      if (isSwapMode) {
        if (source === "rack" && index !== undefined) {
          handleMouseDown(index);
        }
        return;
      }

      const touch = e.touches[0];

      // For rack tiles not in multi-select mode, start hold timer for group mode
      if (source === "rack" && index !== undefined && !multiSelectMode) {
        // Clear any existing timer
        if (touchHoldTimerRef.current) {
          clearTimeout(touchHoldTimerRef.current);
        }

        // Store touch start info for detecting movement
        setTouchHoldInfo({
          startX: touch.clientX,
          startY: touch.clientY,
          rackIndex: index,
        });

        // Start a hold timer - if they hold for 500ms without moving, enter group mode
        touchHoldTimerRef.current = setTimeout(() => {
          setMultiSelectMode(true);
          setSelectedTiles([index]);
          setMessage(getMessage("GroupModeActivated"));
          // Clear touch drag state since we're entering group mode, not dragging
          setTouchDragTile(null);
          setTouchDragPosition(null);
          setTouchHoldInfo(null);
          touchHoldTimerRef.current = null;
        }, 500);
      }

      // For multi-select mode, handle group drag
      if (
        source === "rack" &&
        multiSelectMode &&
        selectedTiles.length > 1 &&
        index !== undefined &&
        selectedTiles.includes(index)
      ) {
        const tilesToDrag = selectedTiles.map((i) => playerRack[i]);
        setTouchMultiTiles({ tiles: tilesToDrag, indices: selectedTiles });
        setTouchDragTile(null);
      } else if (!multiSelectMode || source === "board") {
        // Only set drag tile if not waiting for hold timer (for rack) or if from board
        setTouchDragTile({ letter, source, index, row, col });
        setTouchMultiTiles(null);
      }

      setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
    },
    [currentPlayer, isSwapMode, multiSelectMode, selectedTiles, playerRack],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];

      // Check if user moved too much while waiting for hold timer
      if (touchHoldInfo && touchHoldTimerRef.current) {
        const dx = touch.clientX - touchHoldInfo.startX;
        const dy = touch.clientY - touchHoldInfo.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If moved more than 10 pixels, cancel hold timer and start drag
        if (distance > 10) {
          clearTimeout(touchHoldTimerRef.current);
          touchHoldTimerRef.current = null;
          setTouchHoldInfo(null);
        }
      }

      if (!touchDragTile && !touchMultiTiles) return;

      e.preventDefault(); // Prevent scrolling while dragging
      setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
    },
    [touchDragTile, touchMultiTiles, touchHoldInfo],
  );

  const handleTouchEnd = useCallback(
    (_e: React.TouchEvent) => {
      // Clear hold timer if it's still running
      if (touchHoldTimerRef.current) {
        clearTimeout(touchHoldTimerRef.current);
        touchHoldTimerRef.current = null;
      }
      setTouchHoldInfo(null);

      if (!touchDragTile && !touchMultiTiles) return;
      if (!touchDragPosition) {
        setTouchDragTile(null);
        setTouchMultiTiles(null);
        return;
      }

      // Find what element is under the touch point
      const element = document.elementFromPoint(
        touchDragPosition.x,
        touchDragPosition.y,
      );
      if (!element) {
        setTouchDragTile(null);
        setTouchMultiTiles(null);
        setTouchDragPosition(null);
        return;
      }

      // Check if dropped on board cell
      const boardCell = element.closest("[data-board-cell]");
      if (boardCell) {
        const row = parseInt(boardCell.getAttribute("data-row") || "-1");
        const col = parseInt(boardCell.getAttribute("data-col") || "-1");
        if (row >= 0 && col >= 0) {
          // Simulate drop on board
          handleTouchDropOnBoard(row, col);
        }
      }

      // Check if dropped on rack
      const rackCell = element.closest("[data-rack-index]");
      if (rackCell) {
        const dropIndex = parseInt(
          rackCell.getAttribute("data-rack-index") || "0",
        );
        handleTouchDropOnRack(dropIndex);
      }

      // Check if dropped on rack container (return tile to rack)
      const rackContainer = element.closest("[data-rack-container]");
      if (rackContainer && !rackCell) {
        handleTouchDropOnRack(playerRack.length);
      }

      setTouchDragTile(null);
      setTouchMultiTiles(null);
      setTouchDragPosition(null);
    },
    [touchDragTile, touchMultiTiles, touchDragPosition, playerRack.length],
  );

  // Double-tap handler for recalling placed tiles
  const handleTileDoubleTap = useCallback(
    (row: number, col: number) => {
      if (currentPlayer !== "player") return;

      // Check if this tile is a placed tile (not a permanent one)
      const tile = placedTiles.find((t) => t.row === row && t.col === col);
      if (!tile) return;

      const now = Date.now();
      const DOUBLE_TAP_THRESHOLD = 300; // ms

      if (
        lastTapInfo &&
        lastTapInfo.row === row &&
        lastTapInfo.col === col &&
        now - lastTapInfo.time < DOUBLE_TAP_THRESHOLD
      ) {
        // Double tap detected - recall this tile with flying animation
        setLastTapInfo(null);

        // Find the board cell element to get its position
        const boardCell = document.querySelector(
          `[data-board-cell][data-row="${row}"][data-col="${col}"]`,
        );
        const rackContainer = rackRef.current;

        if (boardCell && rackContainer) {
          const cellRect = boardCell.getBoundingClientRect();
          const rackRect = rackContainer.getBoundingClientRect();

          // Calculate the target position (end of rack)
          const rackTileWidth = 48; // sm:w-12 = 48px
          const targetX = rackRect.right - rackTileWidth / 2;
          const targetY = rackRect.top + rackRect.height / 2;

          // Start flying animation
          setFlyingTiles([
            {
              id: `${row}-${col}`,
              letter: tile.letter,
              startX: cellRect.left + cellRect.width / 2,
              startY: cellRect.top + cellRect.height / 2,
              endX: targetX,
              endY: targetY,
              startSize: cellRect.width,
              endSize: rackTileWidth,
              delay: 0,
            },
          ]);

          // Hide the original tile
          setRecallingTiles([{ row, col }]);

          // After animation completes, actually move the tile
          setTimeout(() => {
            // Remove from board
            const newBoard = board.map((r) => [...r]);
            newBoard[row][col] = null;
            setBoard(newBoard);

            // Remove from placed tiles
            setPlacedTiles(
              placedTiles.filter((t) => !(t.row === row && t.col === col)),
            );

            // Add back to rack
            setPlayerRack([...playerRack, tile.letter]);

            // Clear invalid tiles if this was one
            setInvalidTiles(
              invalidTiles.filter((t) => !(t.row === row && t.col === col)),
            );

            setRecallingTiles([]);
            setFlyingTiles([]);
          }, 400); // Match animation duration
        } else {
          // Fallback if we can't find elements - just move instantly
          const newBoard = board.map((r) => [...r]);
          newBoard[row][col] = null;
          setBoard(newBoard);
          setPlacedTiles(
            placedTiles.filter((t) => !(t.row === row && t.col === col)),
          );
          setPlayerRack([...playerRack, tile.letter]);
          setInvalidTiles(
            invalidTiles.filter((t) => !(t.row === row && t.col === col)),
          );
        }
      } else {
        // First tap - record it
        setLastTapInfo({ row, col, time: now });
      }
    },
    [currentPlayer, placedTiles, lastTapInfo, board, playerRack, invalidTiles],
  );

  const handleTouchDropOnBoard = useCallback(
    (row: number, col: number) => {
      if (currentPlayer !== "player" || showTimeoutDialog || timerExpired)
        return;

      if (touchMultiTiles) {
        const { tiles, indices } = touchMultiTiles;
        const newBoard = board.map((r) => [...r]);
        const newPlacedTiles = [...placedTiles];

        let startCol = col;
        let startRow = row;

        if (orientation === "horizontal") {
          const adjustedCol = col - dragOffset;

          // Check for adjacent tiles
          let leftTile = col;
          while (leftTile > 0 && board[row][leftTile - 1] !== null) {
            leftTile--;
          }

          if (board[row][col] !== null) {
            startCol = adjustedCol;
            if (startCol < 0) startCol = 0;
            if (startCol + tiles.length > BOARD_SIZE)
              startCol = BOARD_SIZE - tiles.length;

            let blocked = false;
            for (let i = 0; i < tiles.length; i++) {
              if (
                startCol + i >= BOARD_SIZE ||
                board[row][startCol + i] !== null
              ) {
                blocked = true;
                break;
              }
            }

            if (blocked) {
              let rightTile = col;
              while (
                rightTile < BOARD_SIZE - 1 &&
                board[row][rightTile + 1] !== null
              ) {
                rightTile++;
              }
              startCol = rightTile + 1;
            }
          } else {
            startCol = adjustedCol;
            if (startCol < 0) startCol = 0;
            if (startCol + tiles.length > BOARD_SIZE)
              startCol = BOARD_SIZE - tiles.length;
          }

          let canPlace = true;
          for (let i = 0; i < tiles.length; i++) {
            if (
              startCol + i >= BOARD_SIZE ||
              newBoard[row][startCol + i] !== null
            ) {
              canPlace = false;
              break;
            }
          }

          if (!canPlace) {
            setMessage(getMessage("NotEnoughSpace"));
            return;
          }

          tiles.forEach((letter: Letter, i: number) => {
            newBoard[row][startCol + i] = {
              letter,
              score: LETTER_SCORES[letter],
            };
            newPlacedTiles.push({ row, col: startCol + i, letter });
          });
        } else {
          // Vertical placement
          const adjustedRow = row - dragOffset;

          if (board[row][col] !== null) {
            startRow = adjustedRow;
            if (startRow < 0) startRow = 0;
            if (startRow + tiles.length > BOARD_SIZE)
              startRow = BOARD_SIZE - tiles.length;

            let blocked = false;
            for (let i = 0; i < tiles.length; i++) {
              if (
                startRow + i >= BOARD_SIZE ||
                board[startRow + i][col] !== null
              ) {
                blocked = true;
                break;
              }
            }

            if (blocked) {
              let bottomTile = row;
              while (
                bottomTile < BOARD_SIZE - 1 &&
                board[bottomTile + 1][col] !== null
              ) {
                bottomTile++;
              }
              startRow = bottomTile + 1;
            }
          } else {
            startRow = adjustedRow;
            if (startRow < 0) startRow = 0;
            if (startRow + tiles.length > BOARD_SIZE)
              startRow = BOARD_SIZE - tiles.length;
          }

          let canPlace = true;
          for (let i = 0; i < tiles.length; i++) {
            if (
              startRow + i >= BOARD_SIZE ||
              newBoard[startRow + i][col] !== null
            ) {
              canPlace = false;
              break;
            }
          }

          if (!canPlace) {
            setMessage(getMessage("NotEnoughSpace"));
            return;
          }

          tiles.forEach((letter: Letter, i: number) => {
            newBoard[startRow + i][col] = {
              letter,
              score: LETTER_SCORES[letter],
            };
            newPlacedTiles.push({ row: startRow + i, col, letter });
          });
        }

        const newRack = playerRack.filter((_, idx) => !indices.includes(idx));

        setBoard(newBoard);
        setPlayerRack(newRack);
        setPlacedTiles(newPlacedTiles);
        setSelectedTiles([]);
        setMultiSelectMode(false);
        setOrientation("horizontal");
        setDragOffset(0);
        setMessage("");
        return;
      }

      if (!touchDragTile || board[row][col] !== null) return;

      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = {
        letter: touchDragTile.letter,
        score: LETTER_SCORES[touchDragTile.letter],
      };

      if (
        touchDragTile.source === "rack" &&
        touchDragTile.index !== undefined
      ) {
        const newRack = [...playerRack];
        newRack.splice(touchDragTile.index, 1);
        setPlayerRack(newRack);
        setPlacedTiles([
          ...placedTiles,
          { row, col, letter: touchDragTile.letter },
        ]);
        setBoard(newBoard);
      } else if (
        touchDragTile.source === "board" &&
        touchDragTile.row !== undefined &&
        touchDragTile.col !== undefined
      ) {
        newBoard[touchDragTile.row][touchDragTile.col] = null;
        setBoard(newBoard);
        setPlacedTiles(
          placedTiles.map((t) =>
            t.row === touchDragTile.row && t.col === touchDragTile.col
              ? { ...t, row, col }
              : t,
          ),
        );
      }

      setMessage("");
    },
    [
      currentPlayer,
      showTimeoutDialog,
      timerExpired,
      touchMultiTiles,
      touchDragTile,
      board,
      placedTiles,
      playerRack,
      orientation,
      dragOffset,
    ],
  );

  const handleTouchDropOnRack = useCallback(
    (dropIndex: number) => {
      if (currentPlayer !== "player") return;

      if (touchDragTile) {
        if (
          touchDragTile.source === "board" &&
          touchDragTile.row !== undefined &&
          touchDragTile.col !== undefined
        ) {
          const newBoard = board.map((r) => [...r]);
          newBoard[touchDragTile.row][touchDragTile.col] = null;
          setBoard(newBoard);

          setPlayerRack([...playerRack, touchDragTile.letter]);
          setPlacedTiles(
            placedTiles.filter(
              (t) =>
                !(t.row === touchDragTile.row && t.col === touchDragTile.col),
            ),
          );
        } else if (
          touchDragTile.source === "rack" &&
          touchDragTile.index !== undefined &&
          !multiSelectMode
        ) {
          const newRack = [...playerRack];
          const [movedTile] = newRack.splice(touchDragTile.index, 1);
          newRack.splice(dropIndex, 0, movedTile);
          setPlayerRack(newRack);
        }
      }
    },
    [
      currentPlayer,
      touchDragTile,
      board,
      playerRack,
      placedTiles,
      multiSelectMode,
    ],
  );

  const handleDropOnBoard = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    if (currentPlayer !== "player" || showTimeoutDialog || timerExpired) return;

    const multiTilesData = e.dataTransfer.getData("multiTiles");

    if (multiTilesData) {
      const { tiles, indices } = JSON.parse(multiTilesData);
      const newBoard = board.map((r) => [...r]);
      const newPlacedTiles = [...placedTiles];

      let startCol = col;
      let startRow = row;

      if (orientation === "horizontal") {
        // Adjust drop position based on which tile was clicked (dragOffset)
        // If user clicked the 3rd tile (offset=2) and drops at col 5,
        // we want the 3rd tile at col 5, so start at col 3 (5 - 2)
        const adjustedCol = col - dragOffset;

        // Smart snapping: look left and right for adjacent tiles
        let leftTile = col;
        let rightTile = col;

        // Find leftmost tile in this row
        while (leftTile > 0 && board[row][leftTile - 1] !== null) {
          leftTile--;
        }

        // Find rightmost tile in this row
        while (
          rightTile < BOARD_SIZE - 1 &&
          board[row][rightTile + 1] !== null
        ) {
          rightTile++;
        }

        // If we're dropping on an existing tile or near tiles
        if (board[row][col] !== null) {
          // Try to place word so clicked tile lands at col position
          startCol = adjustedCol;
          if (startCol < 0) startCol = 0;
          if (startCol + tiles.length > BOARD_SIZE)
            startCol = BOARD_SIZE - tiles.length;

          // Check if that position is clear
          let blocked = false;
          for (let i = 0; i < tiles.length; i++) {
            if (
              startCol + i >= BOARD_SIZE ||
              board[row][startCol + i] !== null
            ) {
              blocked = true;
              break;
            }
          }

          // If blocked, try just after the rightmost connected tile
          if (blocked) {
            startCol = rightTile + 1;
          }
        } else {
          // Dropping on empty square
          // Try to position so clicked tile lands at drop position
          startCol = adjustedCol;

          // Check if there's a tile to the left on this row
          let tileToLeft = -1;
          for (let c = col - 1; c >= 0; c--) {
            if (board[row][c] !== null) {
              tileToLeft = c;
              break;
            }
          }

          // Check if there's a tile to the right on this row
          let tileToRight = -1;
          for (let c = col + 1; c < BOARD_SIZE; c++) {
            if (board[row][c] !== null) {
              tileToRight = c;
              break;
            }
          }

          // Snap to connect with nearby tiles if close enough
          if (tileToLeft >= 0 && col - tileToLeft <= 2) {
            // Close to left tile, snap to connect right after it
            startCol = tileToLeft + 1;
          } else if (tileToRight >= 0 && tileToRight - col <= 2) {
            // Close to right tile, snap to connect just before it
            startCol = tileToRight - tiles.length;
            if (startCol < 0) startCol = 0;
          } else if (startCol < 0) {
            startCol = 0;
          } else if (startCol + tiles.length > BOARD_SIZE) {
            startCol = BOARD_SIZE - tiles.length;
          }
          // else keep startCol = adjustedCol (clicked tile at drop position)
        }

        // Check if placement is valid
        let canPlace = true;
        for (let i = 0; i < tiles.length; i++) {
          if (
            startCol + i >= BOARD_SIZE ||
            newBoard[row][startCol + i] !== null
          ) {
            canPlace = false;
            break;
          }
        }

        if (!canPlace) {
          setMessage(getMessage("NotEnoughSpace"));
          return;
        }

        tiles.forEach((letter: Letter, i: number) => {
          newBoard[row][startCol + i] = {
            letter,
            score: LETTER_SCORES[letter],
          };
          newPlacedTiles.push({ row, col: startCol + i, letter });
        });
      } else {
        // Vertical placement with smart snapping
        // Adjust drop position based on which tile was clicked (dragOffset)
        const adjustedRow = row - dragOffset;

        let topTile = row;
        let bottomTile = row;

        // Find topmost tile in this column
        while (topTile > 0 && board[topTile - 1][col] !== null) {
          topTile--;
        }

        // Find bottommost tile in this column
        while (
          bottomTile < BOARD_SIZE - 1 &&
          board[bottomTile + 1][col] !== null
        ) {
          bottomTile++;
        }

        // If we're dropping on an existing tile or near tiles
        if (board[row][col] !== null) {
          // Try to place word so clicked tile lands at row position
          startRow = adjustedRow;
          if (startRow < 0) startRow = 0;
          if (startRow + tiles.length > BOARD_SIZE)
            startRow = BOARD_SIZE - tiles.length;

          // Check if that position is clear
          let blocked = false;
          for (let i = 0; i < tiles.length; i++) {
            if (
              startRow + i >= BOARD_SIZE ||
              board[startRow + i][col] !== null
            ) {
              blocked = true;
              break;
            }
          }

          // If blocked, try just below the bottommost connected tile
          if (blocked) {
            startRow = bottomTile + 1;
          }
        } else {
          // Dropping on empty square
          // Try to position so clicked tile lands at drop position
          startRow = adjustedRow;

          // Check if there's a tile above on this column
          let tileAbove = -1;
          for (let r = row - 1; r >= 0; r--) {
            if (board[r][col] !== null) {
              tileAbove = r;
              break;
            }
          }

          // Check if there's a tile below on this column
          let tileBelow = -1;
          for (let r = row + 1; r < BOARD_SIZE; r++) {
            if (board[r][col] !== null) {
              tileBelow = r;
              break;
            }
          }

          // Snap to connect with nearby tiles if close enough
          if (tileAbove >= 0 && row - tileAbove <= 2) {
            // Close to top tile, snap to connect right below it
            startRow = tileAbove + 1;
          } else if (tileBelow >= 0 && tileBelow - row <= 2) {
            // Close to bottom tile, snap to connect just above it
            startRow = tileBelow - tiles.length;
            if (startRow < 0) startRow = 0;
          } else if (startRow < 0) {
            startRow = 0;
          } else if (startRow + tiles.length > BOARD_SIZE) {
            startRow = BOARD_SIZE - tiles.length;
          }
          // else keep startRow = adjustedRow (clicked tile at drop position)
        }

        // Check if placement is valid
        let canPlace = true;
        for (let i = 0; i < tiles.length; i++) {
          if (
            startRow + i >= BOARD_SIZE ||
            newBoard[startRow + i][col] !== null
          ) {
            canPlace = false;
            break;
          }
        }

        if (!canPlace) {
          setMessage(getMessage("NotEnoughSpace"));
          return;
        }

        tiles.forEach((letter: Letter, i: number) => {
          newBoard[startRow + i][col] = {
            letter,
            score: LETTER_SCORES[letter],
          };
          newPlacedTiles.push({ row: startRow + i, col, letter });
        });
      }

      const newRack = playerRack.filter((_, idx) => !indices.includes(idx));

      setBoard(newBoard);
      setPlayerRack(newRack);
      setPlacedTiles(newPlacedTiles);
      setSelectedTiles([]);
      setMultiSelectMode(false);
      setOrientation("horizontal");
      setDragOffset(0);
      setMessage("");
      return;
    }

    if (!draggedTile || board[row][col] !== null) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = {
      letter: draggedTile.letter,
      score: LETTER_SCORES[draggedTile.letter],
    };

    if (draggedTile.source === "rack" && draggedTile.index !== undefined) {
      const newRack = [...playerRack];
      newRack.splice(draggedTile.index, 1);
      setPlayerRack(newRack);
      setPlacedTiles([
        ...placedTiles,
        { row, col, letter: draggedTile.letter },
      ]);
      setBoard(newBoard);
    } else if (
      draggedTile.source === "board" &&
      draggedTile.row !== undefined &&
      draggedTile.col !== undefined
    ) {
      // Clear the old position
      newBoard[draggedTile.row][draggedTile.col] = null;
      setBoard(newBoard);
      setPlacedTiles(
        placedTiles.map((t) =>
          t.row === draggedTile.row && t.col === draggedTile.col
            ? { ...t, row, col }
            : t,
        ),
      );
    }

    setDraggedTile(null);
    setMessage("");
  };

  const handleDropOnRack = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (currentPlayer !== "player") return;

    if (draggedTile) {
      if (
        draggedTile.source === "board" &&
        draggedTile.row !== undefined &&
        draggedTile.col !== undefined
      ) {
        const newBoard = board.map((r) => [...r]);
        newBoard[draggedTile.row][draggedTile.col] = null;
        setBoard(newBoard);

        setPlayerRack([...playerRack, draggedTile.letter]);
        setPlacedTiles(
          placedTiles.filter(
            (t) => !(t.row === draggedTile.row && t.col === draggedTile.col),
          ),
        );
      } else if (
        draggedTile.source === "rack" &&
        draggedTile.index !== undefined &&
        !multiSelectMode
      ) {
        const newRack = [...playerRack];
        const [movedTile] = newRack.splice(draggedTile.index, 1);
        newRack.splice(dropIndex, 0, movedTile);
        setPlayerRack(newRack);
      }
      setDraggedTile(null);
    }
  };

  const getSquareType = (row: number, col: number): SquareType => {
    return PREMIUM_SQUARES[row][col];
  };

  const getSquareStyle = (
    row: number,
    col: number,
    hasTile: boolean,
    isLastPlayed: boolean = false,
  ) => {
    if (hasTile) {
      if (isLastPlayed) {
        return darkMode ? "bg-green-700" : "bg-green-600";
      }
      return darkMode ? "bg-amber-700" : "bg-amber-600";
    }

    const type = getSquareType(row, col);
    switch (type) {
      case "TW":
        return darkMode
          ? "bg-red-900/25 border-2 border-red-500"
          : "bg-red-600/25";
      case "DW":
        return darkMode
          ? "bg-pink-900/25 border-2 border-pink-500"
          : "bg-pink-500/25";
      case "TL":
        return darkMode
          ? "bg-blue-900/25 border-2 border-blue-500"
          : "bg-blue-600/25";
      case "DL":
        return darkMode
          ? "bg-cyan-900/25 border-2 border-cyan-500"
          : "bg-cyan-500/25";
      case "center":
        return darkMode
          ? "bg-pink-900/25 border-2 border-pink-500"
          : "bg-pink-500/25";
      default:
        return darkMode ? "bg-gray-700" : "bg-gray-200";
    }
  };

  const getSquareLabel = (type: SquareType): string | JSX.Element => {
    switch (type) {
      case "TW":
        return "TW";
      case "DW":
        return "DW";
      case "TL":
        return "TL";
      case "DL":
        return "DL";
      case "center":
        return <span className="text-base sm:text-lg md:text-xl">⭐</span>;
      default:
        return "";
    }
  };

  const calculateScore = (
    tiles: PlacedTile[],
    scoreBoard?: (BoardTile | null)[][],
  ): number => {
    if (tiles.length === 0) return 0;

    // Use provided board or fall back to state board
    const boardToUse = scoreBoard || board;

    // Determine if placement is horizontal or vertical
    const rows = tiles.map((t) => t.row);
    const cols = tiles.map((t) => t.col);
    const isHorizontal = new Set(rows).size === 1;
    const isVertical = new Set(cols).size === 1;

    let totalScore = 0;
    const scoredWords = new Set<string>(); // Track which words we've scored to avoid duplicates

    if (isHorizontal) {
      const row = rows[0];
      const minCol = Math.min(...cols);
      const maxCol = Math.max(...cols);

      // Extend to find the full main word
      let startCol = minCol;
      let endCol = maxCol;
      while (startCol > 0 && boardToUse[row][startCol - 1] !== null) startCol--;
      while (endCol < BOARD_SIZE - 1 && boardToUse[row][endCol + 1] !== null)
        endCol++;

      // Score the main horizontal word
      let mainWordScore = 0;
      let mainWordMultiplier = 1;
      let mainWordKey = `h-${row}-${startCol}-${endCol}`;

      if (!scoredWords.has(mainWordKey) && endCol - startCol + 1 > 1) {
        for (let col = startCol; col <= endCol; col++) {
          const tile = boardToUse[row][col];
          const isNewTile = tiles.some((t) => t.row === row && t.col === col);
          let letterScore = tile ? tile.score : 0;

          if (isNewTile) {
            const squareType = getSquareType(row, col);
            if (squareType === "DL") letterScore *= 2;
            if (squareType === "TL") letterScore *= 3;
            if (squareType === "DW" || squareType === "center")
              mainWordMultiplier *= 2;
            if (squareType === "TW") mainWordMultiplier *= 3;
          }

          mainWordScore += letterScore;
        }
        totalScore += mainWordScore * mainWordMultiplier;
        scoredWords.add(mainWordKey);
      }

      // Score perpendicular words formed by each new tile
      tiles.forEach((tile) => {
        let perpStart = tile.row;
        let perpEnd = tile.row;
        while (perpStart > 0 && boardToUse[perpStart - 1][tile.col] !== null)
          perpStart--;
        while (
          perpEnd < BOARD_SIZE - 1 &&
          boardToUse[perpEnd + 1][tile.col] !== null
        )
          perpEnd++;

        let perpWordKey = `v-${tile.col}-${perpStart}-${perpEnd}`;
        if (!scoredWords.has(perpWordKey) && perpEnd - perpStart > 0) {
          let perpScore = 0;
          let perpMultiplier = 1;

          for (let r = perpStart; r <= perpEnd; r++) {
            const perpTile = boardToUse[r][tile.col];
            const isNewTile = r === tile.row;
            let letterScore = perpTile ? perpTile.score : 0;

            if (isNewTile) {
              const squareType = getSquareType(r, tile.col);
              if (squareType === "DL") letterScore *= 2;
              if (squareType === "TL") letterScore *= 3;
              if (squareType === "DW" || squareType === "center")
                perpMultiplier *= 2;
              if (squareType === "TW") perpMultiplier *= 3;
            }

            perpScore += letterScore;
          }
          totalScore += perpScore * perpMultiplier;
          scoredWords.add(perpWordKey);
        }
      });
    } else if (isVertical) {
      const col = cols[0];
      const minRow = Math.min(...rows);
      const maxRow = Math.max(...rows);

      // Extend to find the full main word
      let startRow = minRow;
      let endRow = maxRow;
      while (startRow > 0 && boardToUse[startRow - 1][col] !== null) startRow--;
      while (endRow < BOARD_SIZE - 1 && boardToUse[endRow + 1][col] !== null)
        endRow++;

      // Score the main vertical word
      let mainWordScore = 0;
      let mainWordMultiplier = 1;
      let mainWordKey = `v-${col}-${startRow}-${endRow}`;

      if (!scoredWords.has(mainWordKey) && endRow - startRow + 1 > 1) {
        for (let row = startRow; row <= endRow; row++) {
          const tile = boardToUse[row][col];
          const isNewTile = tiles.some((t) => t.row === row && t.col === col);
          let letterScore = tile ? tile.score : 0;

          if (isNewTile) {
            const squareType = getSquareType(row, col);
            if (squareType === "DL") letterScore *= 2;
            if (squareType === "TL") letterScore *= 3;
            if (squareType === "DW" || squareType === "center")
              mainWordMultiplier *= 2;
            if (squareType === "TW") mainWordMultiplier *= 3;
          }

          mainWordScore += letterScore;
        }
        totalScore += mainWordScore * mainWordMultiplier;
        scoredWords.add(mainWordKey);
      }

      // Score perpendicular words formed by each new tile
      tiles.forEach((tile) => {
        let perpStart = tile.col;
        let perpEnd = tile.col;
        while (perpStart > 0 && boardToUse[tile.row][perpStart - 1] !== null)
          perpStart--;
        while (
          perpEnd < BOARD_SIZE - 1 &&
          boardToUse[tile.row][perpEnd + 1] !== null
        )
          perpEnd++;

        let perpWordKey = `h-${tile.row}-${perpStart}-${perpEnd}`;
        if (!scoredWords.has(perpWordKey) && perpEnd - perpStart > 0) {
          let perpScore = 0;
          let perpMultiplier = 1;

          for (let c = perpStart; c <= perpEnd; c++) {
            const perpTile = boardToUse[tile.row][c];
            const isNewTile = c === tile.col;
            let letterScore = perpTile ? perpTile.score : 0;

            if (isNewTile) {
              const squareType = getSquareType(tile.row, c);
              if (squareType === "DL") letterScore *= 2;
              if (squareType === "TL") letterScore *= 3;
              if (squareType === "DW" || squareType === "center")
                perpMultiplier *= 2;
              if (squareType === "TW") perpMultiplier *= 3;
            }

            perpScore += letterScore;
          }
          totalScore += perpScore * perpMultiplier;
          scoredWords.add(perpWordKey);
        }
      });
    }

    return totalScore;
  };

  // Shared scoring result type
  interface ScoringResult {
    baseScore: number;
    finalScore: number;
    isRunOut: boolean;
    isCombo: boolean;
    comboWordCount: number;
    comboMultiplier: number;
    comboPercentage: number; // For increment mode: 10, 20, 30, etc.
    newComboStreak: number;
    allWordPositions: Array<{ row: number; col: number }>;
  }

  // Unified scoring function for player, opponent, and preview
  const calculateFullScore = (
    currentBoard: (BoardTile | null)[][],
    tiles: PlacedTile[],
    currentComboTiles: PlacedTile[],
    currentComboStreak: number,
    bonusType: ComboBonusType = comboBonusType,
  ): ScoringResult => {
    const baseScore = calculateScore(tiles, currentBoard);
    const isRunOut = tiles.length === 7;
    let adjustedBaseScore = baseScore;

    if (isRunOut) {
      adjustedBaseScore += 50;
    }

    // Get individual words and all positions
    const individualWords = getIndividualWordPositions(currentBoard, tiles);
    const allWordPositions = getWordTilePositions(currentBoard, tiles);

    // Count how many words chain off the combo tiles (use tiles from last played word)
    let comboWordCount = 0;
    if (currentComboTiles.length > 0) {
      for (const word of individualWords) {
        // Check if this word uses any of the combo tiles
        const wordChainsOff = word.some((pos) =>
          currentComboTiles.some(
            (combo) => combo.row === pos.row && combo.col === pos.col,
          ),
        );
        if (wordChainsOff) {
          comboWordCount++;
        }
      }
    }

    const isCombo = comboWordCount > 0;

    // Calculate combo bonus - streak increases by number of chaining words
    let newComboStreak = 0;
    let comboMultiplier = 1;
    let comboPercentage = 0;
    let finalScore = adjustedBaseScore;

    if (isCombo) {
      // If starting a new streak, start at 2; otherwise add the combo word count
      newComboStreak =
        currentComboStreak === 0
          ? 1 + comboWordCount
          : currentComboStreak + comboWordCount;

      if (bonusType === "multiplier" || bonusType === "increment100") {
        // Multiplier mode: 2x, 3x, 4x, etc. (increment100 is effectively the same)
        comboMultiplier = newComboStreak;
        comboPercentage = (newComboStreak - 1) * 100; // For display: 100%, 200%, etc.
        finalScore = adjustedBaseScore * comboMultiplier;
      } else {
        // Increment mode: +N%, +2N%, +3N%, etc. based on selected increment
        const incrementStep =
          bonusType === "increment10"
            ? 10
            : bonusType === "increment25"
              ? 25
              : 50;
        comboPercentage = (newComboStreak - 1) * incrementStep;
        comboMultiplier = newComboStreak; // Keep for display purposes
        finalScore = Math.round(
          adjustedBaseScore * (1 + comboPercentage / 100),
        );
      }
    }

    return {
      baseScore: adjustedBaseScore,
      finalScore,
      isRunOut,
      isCombo,
      comboWordCount,
      comboMultiplier,
      comboPercentage,
      newComboStreak,
      allWordPositions,
    };
  };

  // Unified validation function for both player and opponent
  const validatePlacement = async (
    testBoard: (BoardTile | null)[][],
    tiles: PlacedTile[],
    checkFirstMove: boolean,
  ): Promise<{ valid: boolean; message: string; words: string[] }> => {
    if (tiles.length === 0) {
      return { valid: false, message: "No tiles placed", words: [] };
    }

    const rows = tiles.map((t) => t.row);
    const cols = tiles.map((t) => t.col);
    const uniqueRows = new Set(rows);
    const uniqueCols = new Set(cols);

    const isHorizontal = uniqueRows.size === 1;
    const isVertical = uniqueCols.size === 1;

    // Rule 1: All tiles must be in a straight line
    if (!isHorizontal && !isVertical) {
      return {
        valid: false,
        message: getMessage("TilesMustBeInLine"),
        words: [],
      };
    }

    // Rule 2: First move must touch center square
    const centerSquare = Math.floor(BOARD_SIZE / 2);
    if (checkFirstMove) {
      const touchesCenter = tiles.some(
        (t) => t.row === centerSquare && t.col === centerSquare,
      );
      if (!touchesCenter) {
        return {
          valid: false,
          message: getMessage("FirstWordMustTouchCenter"),
          words: [],
        };
      }
    }

    const words: string[] = [];

    if (isHorizontal) {
      const row = rows[0];
      const minCol = Math.min(...cols);
      const maxCol = Math.max(...cols);

      // Rule 3: Check for gaps in the main word
      for (let col = minCol; col <= maxCol; col++) {
        if (
          testBoard[row][col] === null &&
          !tiles.some((t) => t.row === row && t.col === col)
        ) {
          return {
            valid: false,
            message: getMessage("WordCannotHaveGaps"),
            words: [],
          };
        }
      }

      // Extend to find the full word including adjacent tiles
      let startCol = minCol;
      let endCol = maxCol;

      // Extend left
      while (startCol > 0 && testBoard[row][startCol - 1] !== null) {
        startCol--;
      }

      // Extend right
      while (endCol < BOARD_SIZE - 1 && testBoard[row][endCol + 1] !== null) {
        endCol++;
      }

      // Build the main word
      let word = "";
      for (let col = startCol; col <= endCol; col++) {
        const placedTile = tiles.find((t) => t.row === row && t.col === col);
        word += placedTile
          ? placedTile.letter
          : (testBoard[row][col]?.letter as Letter);
      }
      if (word.length > 1) words.push(word);

      // Check perpendicular words for each placed tile
      tiles.forEach((tile) => {
        let perpendicularWord: string = tile.letter;
        let perpendicularStart = tile.row;
        let perpendicularEnd = tile.row;

        // Extend up
        while (
          perpendicularStart > 0 &&
          testBoard[perpendicularStart - 1][tile.col] !== null
        ) {
          perpendicularStart--;
        }

        // Extend down
        while (
          perpendicularEnd < BOARD_SIZE - 1 &&
          testBoard[perpendicularEnd + 1][tile.col] !== null
        ) {
          perpendicularEnd++;
        }

        // Build perpendicular word
        if (perpendicularStart !== perpendicularEnd) {
          perpendicularWord = "";
          for (let r = perpendicularStart; r <= perpendicularEnd; r++) {
            perpendicularWord +=
              r === tile.row
                ? tile.letter
                : (testBoard[r][tile.col]?.letter as Letter);
          }
          if (perpendicularWord.length > 1) words.push(perpendicularWord);
        }
      });
    } else {
      // Vertical placement
      const col = cols[0];
      const minRow = Math.min(...rows);
      const maxRow = Math.max(...rows);

      // Rule 3: Check for gaps in the main word
      for (let row = minRow; row <= maxRow; row++) {
        if (
          testBoard[row][col] === null &&
          !tiles.some((t) => t.row === row && t.col === col)
        ) {
          return { valid: false, message: "Word cannot have gaps!", words: [] };
        }
      }

      // Extend to find the full word including adjacent tiles
      let startRow = minRow;
      let endRow = maxRow;

      // Extend up
      while (startRow > 0 && testBoard[startRow - 1][col] !== null) {
        startRow--;
      }

      // Extend down
      while (endRow < BOARD_SIZE - 1 && testBoard[endRow + 1][col] !== null) {
        endRow++;
      }

      // Build the main word
      let word = "";
      for (let row = startRow; row <= endRow; row++) {
        const placedTile = tiles.find((t) => t.row === row && t.col === col);
        word += placedTile
          ? placedTile.letter
          : (testBoard[row][col]?.letter as Letter);
      }
      if (word.length > 1) words.push(word);

      // Check perpendicular words for each placed tile
      tiles.forEach((tile) => {
        let perpendicularWord: string = tile.letter;
        let perpendicularStart = tile.col;
        let perpendicularEnd = tile.col;

        // Extend left
        while (
          perpendicularStart > 0 &&
          testBoard[tile.row][perpendicularStart - 1] !== null
        ) {
          perpendicularStart--;
        }

        // Extend right
        while (
          perpendicularEnd < BOARD_SIZE - 1 &&
          testBoard[tile.row][perpendicularEnd + 1] !== null
        ) {
          perpendicularEnd++;
        }

        // Build perpendicular word
        if (perpendicularStart !== perpendicularEnd) {
          perpendicularWord = "";
          for (let c = perpendicularStart; c <= perpendicularEnd; c++) {
            perpendicularWord +=
              c === tile.col
                ? tile.letter
                : (testBoard[tile.row][c]?.letter as Letter);
          }
          if (perpendicularWord.length > 1) words.push(perpendicularWord);
        }
      });
    }

    // Rule 4: Must form at least one word of 2+ letters
    if (words.length === 0) {
      return {
        valid: false,
        message: getMessage("MustFormWordMinLength"),
        words: [],
      };
    }

    // Rule 5: All words must be valid dictionary words
    for (const word of words) {
      const valid = await isValidWord(word);
      if (!valid) {
        return {
          valid: false,
          message: getMessage("InvalidWordFormat", { word }),
          words: [],
        };
      }
    }

    return { valid: true, message: "", words };
  };

  const validateWordPlacement = async (): Promise<{
    valid: boolean;
    message: string;
    words: string[];
  }> => {
    if (placedTiles.length === 0) {
      return {
        valid: false,
        message: getMessage("PlaceTilesFirst"),
        words: [],
      };
    }

    return validatePlacement(board, placedTiles, isFirstMove);
  };

  // Helper function to get individual words as arrays of positions
  const getIndividualWordPositions = (
    testBoard: (BoardTile | null)[][],
    tiles: PlacedTile[],
  ): Array<Array<{ row: number; col: number }>> => {
    const words: Array<Array<{ row: number; col: number }>> = [];

    if (tiles.length === 0) return words;

    const rows = tiles.map((t) => t.row);
    const cols = tiles.map((t) => t.col);
    const uniqueRows = new Set(rows);
    const isHorizontal = uniqueRows.size === 1;

    if (isHorizontal) {
      const row = rows[0];
      const minCol = Math.min(...cols);
      const maxCol = Math.max(...cols);

      // Extend to find full word boundaries
      let startCol = minCol;
      let endCol = maxCol;
      while (startCol > 0 && testBoard[row][startCol - 1] !== null) startCol--;
      while (endCol < BOARD_SIZE - 1 && testBoard[row][endCol + 1] !== null)
        endCol++;

      // Add main word if it's more than 1 letter
      if (endCol - startCol >= 1) {
        const mainWord: Array<{ row: number; col: number }> = [];
        for (let col = startCol; col <= endCol; col++) {
          mainWord.push({ row, col });
        }
        words.push(mainWord);
      }

      // Check perpendicular words for each placed tile
      tiles.forEach((tile) => {
        let perpendicularStart = tile.row;
        let perpendicularEnd = tile.row;
        while (
          perpendicularStart > 0 &&
          testBoard[perpendicularStart - 1][tile.col] !== null
        )
          perpendicularStart--;
        while (
          perpendicularEnd < BOARD_SIZE - 1 &&
          testBoard[perpendicularEnd + 1][tile.col] !== null
        )
          perpendicularEnd++;

        if (perpendicularStart !== perpendicularEnd) {
          const perpWord: Array<{ row: number; col: number }> = [];
          for (let r = perpendicularStart; r <= perpendicularEnd; r++) {
            perpWord.push({ row: r, col: tile.col });
          }
          words.push(perpWord);
        }
      });
    } else {
      // Vertical placement
      const col = cols[0];
      const minRow = Math.min(...rows);
      const maxRow = Math.max(...rows);

      // Extend to find full word boundaries
      let startRow = minRow;
      let endRow = maxRow;
      while (startRow > 0 && testBoard[startRow - 1][col] !== null) startRow--;
      while (endRow < BOARD_SIZE - 1 && testBoard[endRow + 1][col] !== null)
        endRow++;

      // Add main word if it's more than 1 letter
      if (endRow - startRow >= 1) {
        const mainWord: Array<{ row: number; col: number }> = [];
        for (let row = startRow; row <= endRow; row++) {
          mainWord.push({ row, col });
        }
        words.push(mainWord);
      }

      // Check perpendicular words for each placed tile
      tiles.forEach((tile) => {
        let perpendicularStart = tile.col;
        let perpendicularEnd = tile.col;
        while (
          perpendicularStart > 0 &&
          testBoard[tile.row][perpendicularStart - 1] !== null
        )
          perpendicularStart--;
        while (
          perpendicularEnd < BOARD_SIZE - 1 &&
          testBoard[tile.row][perpendicularEnd + 1] !== null
        )
          perpendicularEnd++;

        if (perpendicularStart !== perpendicularEnd) {
          const perpWord: Array<{ row: number; col: number }> = [];
          for (let c = perpendicularStart; c <= perpendicularEnd; c++) {
            perpWord.push({ row: tile.row, col: c });
          }
          words.push(perpWord);
        }
      });
    }

    return words;
  };

  // Helper function to get all tile positions used in formed words (flattened)
  const getWordTilePositions = (
    testBoard: (BoardTile | null)[][],
    tiles: PlacedTile[],
  ): { row: number; col: number }[] => {
    const words = getIndividualWordPositions(testBoard, tiles);
    const positions: { row: number; col: number }[] = [];

    words.forEach((word) => {
      word.forEach((pos) => {
        if (!positions.some((p) => p.row === pos.row && p.col === pos.col)) {
          positions.push(pos);
        }
      });
    });

    return positions;
  };

  const opponentTurn = (
    initialBoard?: (BoardTile | null)[][],
    initialOpponentRack?: Letter[],
    initialTileBag?: Letter[],
    initialLastPlayedTiles?: PlacedTile[],
  ) => {
    setTimeout(async () => {
      // Use provided initial state or fall back to current state
      // This handles the case where opponentTurn is called immediately after state changes
      const currentBoard = initialBoard
        ? initialBoard.map((r) => [...r])
        : board.map((r) => [...r]);
      const currentOpponentRack = initialOpponentRack
        ? [...initialOpponentRack]
        : [...opponentRack];
      const currentTileBag = initialTileBag
        ? [...initialTileBag]
        : [...tileBag];
      const currentLastPlayedTiles = initialLastPlayedTiles
        ? [...initialLastPlayedTiles]
        : [...lastPlayedTiles];

      // Helper function to check if a position touches an existing tile
      const touchesExistingTile = (
        row: number,
        col: number,
        length: number,
      ): boolean => {
        // Check above, below, left, and right of the word placement
        for (let i = 0; i < length; i++) {
          const checkCol = col + i;
          // Check above
          if (row > 0 && currentBoard[row - 1][checkCol] !== null) return true;
          // Check below
          if (row < BOARD_SIZE - 1 && currentBoard[row + 1][checkCol] !== null)
            return true;
        }
        // Check left of first letter
        if (col > 0 && currentBoard[row][col - 1] !== null) return true;
        // Check right of last letter
        if (
          col + length < BOARD_SIZE &&
          currentBoard[row][col + length] !== null
        )
          return true;

        return false;
      };

      // Check if the center square is occupied to determine if board is empty
      const centerSquare = Math.floor(BOARD_SIZE / 2);
      const isBoardEmpty = currentBoard[centerSquare][centerSquare] === null;

      // Determine search parameters based on difficulty
      // All levels now search more thoroughly for better play
      let maxWordLength: number;
      let searchLimit: number;
      let randomnessFactor: number; // 0 = always best, 1 = very random

      if (difficulty === "beginner") {
        maxWordLength = Math.min(6, currentOpponentRack.length + 3); // Can use board letters
        searchLimit = 30;
        randomnessFactor = 0.3; // 30% chance of suboptimal
      } else if (difficulty === "intermediate") {
        maxWordLength = Math.min(7, currentOpponentRack.length + 4);
        searchLimit = 75;
        randomnessFactor = 0.15; // 15% chance of suboptimal
      } else if (difficulty === "advanced") {
        maxWordLength = Math.min(7, currentOpponentRack.length + 5);
        searchLimit = 150;
        randomnessFactor = 0.05; // 5% chance of suboptimal
      } else {
        // expert
        maxWordLength = Math.min(7, currentOpponentRack.length + 6);
        searchLimit = 300;
        randomnessFactor = 0; // Always optimal
      }

      // Find all valid words that can be formed from the rack
      const possibleWords = await findWordsFromLetters(
        currentOpponentRack,
        2,
        maxWordLength,
      );

      // Sort words by length (longest first) - longer words generally score more
      const shuffledWords = possibleWords.sort((a, b) => {
        if (b.length !== a.length) return b.length - a.length;
        return Math.random() - 0.5;
      });

      // Helper to check if a placement touches lastPlayedTiles (for combo)
      const touchesLastPlayedTiles = (
        row: number,
        col: number,
        length: number,
        isHorizontal: boolean,
      ): boolean => {
        if (currentLastPlayedTiles.length === 0) return false;
        for (let i = 0; i < length; i++) {
          const checkRow = isHorizontal ? row : row + i;
          const checkCol = isHorizontal ? col + i : col;
          for (const tile of currentLastPlayedTiles) {
            if (
              (tile.row === checkRow - 1 && tile.col === checkCol) ||
              (tile.row === checkRow + 1 && tile.col === checkCol) ||
              (tile.row === checkRow && tile.col === checkCol - 1) ||
              (tile.row === checkRow && tile.col === checkCol + 1)
            ) {
              return true;
            }
          }
        }
        return false;
      };

      // Helper to check if horizontal placement touches existing tiles
      const touchesExistingTileVertical = (
        row: number,
        col: number,
        length: number,
      ): boolean => {
        for (let i = 0; i < length; i++) {
          const r = row + i;
          // Check left
          if (col > 0 && currentBoard[r][col - 1] !== null) return true;
          // Check right
          if (col < BOARD_SIZE - 1 && currentBoard[r][col + 1] !== null)
            return true;
          // Check above (only for first tile)
          if (i === 0 && r > 0 && currentBoard[r - 1][col] !== null)
            return true;
          // Check below (only for last tile)
          if (
            i === length - 1 &&
            r < BOARD_SIZE - 1 &&
            currentBoard[r + 1][col] !== null
          )
            return true;
        }
        return false;
      };

      // Try to find a valid word placement
      // COMBO PRIORITY: The main point of the game is combo streaks, so we try hard to maintain them
      let validPlacement: {
        spot: { row: number; col: number };
        word: string[];
        wordLength: number;
        isHorizontal: boolean;
      } | null = null;

      // Helper to count exposed edges (places where player could chain)
      const countExposedEdges = (
        testBoard: (BoardTile | null)[][],
        placedTiles: PlacedTile[],
      ): number => {
        let exposedCount = 0;
        for (const tile of placedTiles) {
          const directions = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 },
          ];
          for (const { dr, dc } of directions) {
            const nr = tile.row + dr;
            const nc = tile.col + dc;
            if (
              nr >= 0 &&
              nr < BOARD_SIZE &&
              nc >= 0 &&
              nc < BOARD_SIZE &&
              testBoard[nr][nc] === null
            ) {
              const nnr = nr + dr;
              const nnc = nc + dc;
              if (
                nnr >= 0 &&
                nnr < BOARD_SIZE &&
                nnc >= 0 &&
                nnc < BOARD_SIZE &&
                testBoard[nnr][nnc] === null
              ) {
                exposedCount++;
              }
            }
          }
        }
        return exposedCount;
      };

      // Collect ALL valid placements across all words, then pick the best one
      type ValidPlacementInfo = {
        spot: { row: number; col: number };
        word: Letter[];
        wordLength: number;
        isHorizontal: boolean;
        isCombo: boolean;
        score: number;
      };
      const allValidPlacements: ValidPlacementInfo[] = [];

      // Helper to check if we can form a word at a position using rack + board letters
      const canFormWordAt = (
        word: Letter[],
        startRow: number,
        startCol: number,
        isHorizontal: boolean,
      ): { canForm: boolean; tilesNeeded: Letter[] } => {
        const tilesNeeded: Letter[] = [];
        const rackCopy = [...currentOpponentRack];

        for (let i = 0; i < word.length; i++) {
          const r = isHorizontal ? startRow : startRow + i;
          const c = isHorizontal ? startCol + i : startCol;

          if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
            return { canForm: false, tilesNeeded: [] };
          }

          const boardTile = currentBoard[r][c];
          if (boardTile !== null) {
            // Board already has a letter here - must match
            if (boardTile.letter !== word[i]) {
              return { canForm: false, tilesNeeded: [] };
            }
            // Using board letter, don't need from rack
          } else {
            // Need to place this letter from rack
            const rackIdx = rackCopy.indexOf(word[i]);
            if (rackIdx === -1) {
              return { canForm: false, tilesNeeded: [] };
            }
            rackCopy.splice(rackIdx, 1);
            tilesNeeded.push(word[i]);
          }
        }

        // Must use at least one tile from rack
        if (tilesNeeded.length === 0) {
          return { canForm: false, tilesNeeded: [] };
        }

        return { canForm: true, tilesNeeded };
      };

      // Try each word from the dictionary
      for (const wordStr of shuffledWords) {
        const wordLength = wordStr.length;
        const word = wordStr.split("") as Letter[];

        // Collect all possible spots for this word (both orientations)
        // Now supports using existing board letters!
        type SpotInfo = {
          row: number;
          col: number;
          isHorizontal: boolean;
          isCombo: boolean;
          tilesNeeded: Letter[];
        };
        const spots: SpotInfo[] = [];

        // Horizontal spots
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c <= BOARD_SIZE - wordLength; c++) {
            const { canForm, tilesNeeded } = canFormWordAt(word, r, c, true);
            if (!canForm) continue;

            if (isBoardEmpty) {
              // First move - must touch center
              const center = Math.floor(BOARD_SIZE / 2);
              if (r === center && c <= center && c + wordLength - 1 >= center) {
                spots.push({
                  row: r,
                  col: c,
                  isHorizontal: true,
                  isCombo: false,
                  tilesNeeded,
                });
              }
            } else {
              // Must connect to existing tiles OR use existing tiles
              const usesExistingTile = tilesNeeded.length < wordLength;
              const touchesExisting = touchesExistingTile(r, c, wordLength);

              if (usesExistingTile || touchesExisting) {
                const isCombo = touchesLastPlayedTiles(r, c, wordLength, true);
                spots.push({
                  row: r,
                  col: c,
                  isHorizontal: true,
                  isCombo,
                  tilesNeeded,
                });
              }
            }
          }
        }

        // Vertical spots
        for (let r = 0; r <= BOARD_SIZE - wordLength; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const { canForm, tilesNeeded } = canFormWordAt(word, r, c, false);
            if (!canForm) continue;

            if (isBoardEmpty) {
              // First move - must touch center
              const center = Math.floor(BOARD_SIZE / 2);
              if (c === center && r <= center && r + wordLength - 1 >= center) {
                spots.push({
                  row: r,
                  col: c,
                  isHorizontal: false,
                  isCombo: false,
                  tilesNeeded,
                });
              }
            } else {
              // Must connect to existing tiles OR use existing tiles
              const usesExistingTile = tilesNeeded.length < wordLength;
              const touchesExisting = touchesExistingTileVertical(
                r,
                c,
                wordLength,
              );

              if (usesExistingTile || touchesExisting) {
                const isCombo = touchesLastPlayedTiles(r, c, wordLength, false);
                spots.push({
                  row: r,
                  col: c,
                  isHorizontal: false,
                  isCombo,
                  tilesNeeded,
                });
              }
            }
          }
        }

        // Try each spot and collect valid placements
        for (const spot of spots) {
          const testBoard = currentBoard.map((r) => [...r]);
          const testTiles: PlacedTile[] = [];

          // Only place tiles that aren't already on the board
          word.forEach((letter, i) => {
            const r = spot.isHorizontal ? spot.row : spot.row + i;
            const c = spot.isHorizontal ? spot.col + i : spot.col;

            // Only add to testTiles if this position is empty (we're placing a new tile)
            if (currentBoard[r][c] === null) {
              testBoard[r][c] = {
                letter,
                score: LETTER_SCORES[letter],
              };
              testTiles.push({ row: r, col: c, letter });
            }
            // If board already has the letter, testBoard already has it from the copy
          });

          // Skip if no new tiles would be placed
          if (testTiles.length === 0) continue;

          const validation = await validatePlacement(
            testBoard,
            testTiles,
            isBoardEmpty,
          );

          if (validation.valid) {
            // Calculate ACTUAL game score for this placement
            const placementScoring = calculateFullScore(
              testBoard,
              testTiles,
              currentLastPlayedTiles,
              opponentComboStreak,
            );

            const exposedEdges = countExposedEdges(testBoard, testTiles);
            const isDefensiveMode =
              difficulty === "advanced" || difficulty === "expert";

            // Score formula prioritizes:
            // 1. Combo plays (massive bonus - this is the main goal!)
            // 2. Actual game score (including premium squares and cross-words)
            // 3. Defensive considerations (fewer exposed edges)
            let score = 0;

            // Combo is CRITICAL - multiply base importance by current streak potential
            if (spot.isCombo) {
              const comboMultiplier =
                opponentComboStreak === 0
                  ? 2 // Starting a new combo
                  : opponentComboStreak + placementScoring.comboWordCount; // Continuing combo
              score += 50000 * comboMultiplier; // Massive combo bonus
            }

            // Add actual game score (this includes premium squares, cross-words, etc.)
            score += placementScoring.finalScore * 10;

            // Defensive bonus - fewer exposed edges is better
            if (isDefensiveMode) {
              score += (20 - exposedEdges) * 5;
            }

            // Bonus for using more tiles (closer to run-out)
            score += wordLength * 50;

            allValidPlacements.push({
              spot: { row: spot.row, col: spot.col },
              word,
              wordLength,
              isHorizontal: spot.isHorizontal,
              isCombo: spot.isCombo,
              score,
            });

            // Stop if we've collected enough placements
            if (allValidPlacements.length >= searchLimit) {
              break;
            }
          }
        }

        // Stop if we've collected enough placements
        if (allValidPlacements.length >= searchLimit) {
          break;
        }
      }

      // Pick the best placement based on score
      if (allValidPlacements.length > 0) {
        // Sort by score (highest first)
        allValidPlacements.sort((a, b) => b.score - a.score);

        // Apply randomness factor based on difficulty
        let selectedIndex = 0;
        if (randomnessFactor > 0 && allValidPlacements.length > 1) {
          if (Math.random() < randomnessFactor) {
            // Pick from top 3-5 instead of the absolute best
            const topN = Math.min(
              difficulty === "beginner" ? 5 : 3,
              allValidPlacements.length,
            );
            selectedIndex = Math.floor(Math.random() * topN);
          }
        }

        const best = allValidPlacements[selectedIndex];
        validPlacement = {
          spot: best.spot,
          word: best.word,
          wordLength: best.wordLength,
          isHorizontal: best.isHorizontal,
        };
      }

      // If no valid placement found, consider swapping tiles or passing
      if (!validPlacement) {
        // Check if opponent should swap tiles instead of passing
        const vowels = ["A", "E", "I", "O", "U"];
        const difficultLetters = ["Q", "X", "Z", "V", "K", "J"];
        const vowelCount = currentOpponentRack.filter((l) =>
          vowels.includes(l),
        ).length;
        const difficultCount = currentOpponentRack.filter((l) =>
          difficultLetters.includes(l),
        ).length;

        // Swap if: tiles available in bag AND (no vowels, or too many difficult letters, or all consonants)
        const shouldSwap =
          currentTileBag.length >= 3 &&
          (vowelCount === 0 || difficultCount >= 3 || vowelCount <= 1);

        if (shouldSwap) {
          // Determine which tiles to swap (prioritize difficult letters and excess consonants)
          const tilesToSwapIndices: number[] = [];

          // First, mark difficult letters for swapping
          currentOpponentRack.forEach((letter, idx) => {
            if (difficultLetters.includes(letter)) {
              tilesToSwapIndices.push(idx);
            }
          });

          // If no vowels, swap some consonants to try to get vowels
          if (vowelCount === 0) {
            currentOpponentRack.forEach((letter, idx) => {
              if (
                !tilesToSwapIndices.includes(idx) &&
                !vowels.includes(letter) &&
                tilesToSwapIndices.length < 4
              ) {
                tilesToSwapIndices.push(idx);
              }
            });
          }

          // Swap at least 2 tiles, at most 4
          const swapCount = Math.max(
            2,
            Math.min(4, tilesToSwapIndices.length, currentTileBag.length),
          );
          const finalSwapIndices = tilesToSwapIndices.slice(0, swapCount);

          if (finalSwapIndices.length > 0) {
            const tilesToSwap = finalSwapIndices.map(
              (i) => currentOpponentRack[i],
            );
            const remainingRack = currentOpponentRack.filter(
              (_, idx) => !finalSwapIndices.includes(idx),
            );

            // Draw new tiles from bag
            const tilesToDraw = Math.min(
              tilesToSwap.length,
              currentTileBag.length,
            );
            const newTiles = currentTileBag.slice(0, tilesToDraw);

            // Return swapped tiles to bag and shuffle
            const newBag = [
              ...currentTileBag.slice(tilesToDraw),
              ...tilesToSwap,
            ];
            for (let i = newBag.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
            }

            setOpponentRack([...remainingRack, ...newTiles]);
            setTileBag(newBag);
            setMessage(
              getMessage("OpponentSwappedFormat", {
                count: tilesToSwap.length.toString(),
              }),
            );
            setCurrentPlayer("player");
            setGameMode("normal");
            setTimeRemaining(timerDuration);
            // Swapping doesn't change lastPlayedTiles - player can still chain off them
            return;
          }
        }

        // Fall through to passing if swap not viable
        const newConsecutivePasses = opponentConsecutivePasses + 1;

        if (newConsecutivePasses >= 3 && playerConsecutivePasses >= 3) {
          // End the game after both players passed 3 times consecutively
          setGameEnded(true);
          setOpponentConsecutivePasses(0);
          setPlayerConsecutivePasses(0);
          const won = playerScore > opponentScore;
          setMessage(
            "Game Over! Both players passed 3 times consecutively. " +
              (won
                ? "You win! 🎉"
                : opponentScore > playerScore
                  ? "Opponent wins!"
                  : "It's a tie!"),
          );
          localStorage.removeItem("scrabbull-game-state");
          endGameWithStats(won);
          return;
        }

        setOpponentConsecutivePasses(newConsecutivePasses);
        setMessage(getMessage("OpponentPassed"));
        setCurrentPlayer("player");
        setGameMode("normal"); // Reset to normal mode after opponent turn
        setTimeRemaining(timerDuration); // Reset timer to full duration
        // Passing doesn't change lastPlayedTiles - player can still chain off them
        return;
      }

      // Apply the valid placement - only place tiles that aren't already on board
      const newBoard = currentBoard.map((r) => [...r]);
      const opponentPlacedTiles: PlacedTile[] = [];

      validPlacement.word.forEach((letter, i) => {
        const row = validPlacement.isHorizontal
          ? validPlacement.spot.row
          : validPlacement.spot.row + i;
        const col = validPlacement.isHorizontal
          ? validPlacement.spot.col + i
          : validPlacement.spot.col;

        // Only place tile if position is empty (not using existing board letter)
        if (currentBoard[row][col] === null) {
          newBoard[row][col] = {
            letter: letter as Letter,
            score: LETTER_SCORES[letter as Letter],
          };
          opponentPlacedTiles.push({
            row,
            col,
            letter: letter as Letter,
          });
        }
      });

      // Use shared scoring function - opponent chains off the last played tiles (by either player)
      const scoring = calculateFullScore(
        newBoard,
        opponentPlacedTiles,
        currentLastPlayedTiles,
        opponentComboStreak,
      );

      // Update opponent's combo streak (player's streak is unaffected)
      setOpponentComboStreak(scoring.newComboStreak);

      setOpponentScore(opponentScore + scoring.finalScore);
      setOpponentStats({
        highStreak: Math.max(opponentStats.highStreak, scoring.newComboStreak),
        totalScore: opponentStats.totalScore + scoring.finalScore,
        runOuts: opponentStats.runOuts + (scoring.isRunOut ? 1 : 0),
        bestWordScore: Math.max(
          opponentStats.bestWordScore,
          scoring.finalScore,
        ),
      });

      const usedLetters = [...validPlacement.word];
      const newOpponentRack = currentOpponentRack.filter((letter) => {
        const usedIndex = usedLetters.indexOf(letter);
        if (usedIndex !== -1) {
          usedLetters.splice(usedIndex, 1);
          return false;
        }
        return true;
      });

      const tilesToDraw = Math.min(
        validPlacement.wordLength,
        currentTileBag.length,
      );
      const newTiles = currentTileBag.slice(0, tilesToDraw);
      const remainingBag = currentTileBag.slice(tilesToDraw);

      setBoard(newBoard);
      setOpponentRack([...newOpponentRack, ...newTiles]);
      setTileBag(remainingBag);
      setIsFirstMove(false);
      setOpponentConsecutivePasses(0); // Reset consecutive passes counter
      setPlayerConsecutivePasses(0); // Reset player's counter too since a word was played
      setCurrentPlayer("player");
      // Set all tiles used in the formed words for display and combo chaining
      const allOpponentTilesUsed = scoring.allWordPositions.map((pos) => ({
        row: pos.row,
        col: pos.col,
        letter: newBoard[pos.row][pos.col]?.letter as Letter,
      }));
      setLastPlayedTiles(allOpponentTilesUsed);

      let bonus = "";
      if (scoring.isCombo) {
        bonus =
          comboBonusType === "multiplier" || comboBonusType === "increment100"
            ? ` x${scoring.comboMultiplier}`
            : ` +${scoring.comboPercentage}%`;
      }

      let runOut = "";
      if (scoring.isRunOut) {
        runOut = "+50";
      }

      let opponentMessage = `Opponent scored ${scoring.baseScore}${bonus}${runOut} = ${scoring.finalScore}pts`;

      setMessage(opponentMessage);
    }, 1500);
  };

  const submitWord = async () => {
    const validation = await validateWordPlacement();

    if (!validation.valid) {
      setMessage(validation.message);
      setInvalidTiles(placedTiles);
      return;
    }

    // Create a merged board with placed tiles for scoring calculation
    const boardWithPlacedTiles = board.map((row) => [...row]);
    placedTiles.forEach((tile) => {
      boardWithPlacedTiles[tile.row][tile.col] = {
        letter: tile.letter,
        score: LETTER_SCORES[tile.letter] || 0,
      };
    });

    // Use shared scoring function - player chains off the last played tiles (by either player)
    const scoring = calculateFullScore(
      boardWithPlacedTiles,
      placedTiles,
      lastPlayedTiles,
      playerComboStreak,
    );

    // Update player's combo streak (opponent's streak is unaffected)
    setPlayerComboStreak(scoring.newComboStreak);

    setPlayerScore(playerScore + scoring.finalScore);
    setPlayerStats({
      highStreak: Math.max(playerStats.highStreak, scoring.newComboStreak),
      totalScore: playerStats.totalScore + scoring.finalScore,
      runOuts: playerStats.runOuts + (scoring.isRunOut ? 1 : 0),
      bestWordScore: Math.max(playerStats.bestWordScore, scoring.finalScore),
    });

    // Build message with combo info
    let scoreMessage = getMessage("ScoreFormat", {
      score: scoring.finalScore.toString(),
      words: validation.words.join(", "),
    });

    if (scoring.isCombo) {
      const comboDisplay =
        comboBonusType === "multiplier" || comboBonusType === "increment100"
          ? `${scoring.comboMultiplier}x`
          : `+${scoring.comboPercentage}%`;
      scoreMessage += ` 🔥 ${comboDisplay} COMBO!`;
    }

    if (scoring.isRunOut) {
      scoreMessage += " 🎉 RUN OUT! (+50)";
    }

    setMessage(scoreMessage);

    const tilesToDraw = Math.min(placedTiles.length, tileBag.length);
    const newTiles = tileBag.slice(0, tilesToDraw);
    const remainingBag = tileBag.slice(tilesToDraw);

    setPlayerRack([...playerRack, ...newTiles]);
    setTileBag(remainingBag);
    // Set all tiles used in the formed words for display and combo chaining
    const allTilesUsed = scoring.allWordPositions.map((pos) => ({
      row: pos.row,
      col: pos.col,
      letter: boardWithPlacedTiles[pos.row][pos.col]?.letter as Letter,
    }));
    setLastPlayedTiles(allTilesUsed);
    setPlacedTiles([]);
    setInvalidTiles([]);
    setIsFirstMove(false);

    // Check if game should end (tile bag empty and player used all tiles)
    if (
      remainingBag.length === 0 &&
      newTiles.length === 0 &&
      [...playerRack, ...newTiles].length === 0
    ) {
      const finalPlayerScore = playerScore + scoring.finalScore;
      const won = finalPlayerScore > opponentScore;
      setGameEnded(true);
      setShowCelebration(true);
      setMessage(
        "Game Over! " +
          (won
            ? "You win! 🎉"
            : opponentScore > finalPlayerScore
              ? "Opponent wins!"
              : "It's a tie!"),
      );
      // Clear saved game state when game ends
      localStorage.removeItem("scrabbull-game-state");
      // Update career stats with the final values (including this turn's scoring)
      const finalPlayerStats = {
        highStreak: Math.max(playerStats.highStreak, scoring.newComboStreak),
        totalScore: playerStats.totalScore + scoring.finalScore,
        runOuts: playerStats.runOuts + (scoring.isRunOut ? 1 : 0),
        bestWordScore: Math.max(playerStats.bestWordScore, scoring.finalScore),
      };
      const newCareerStats: CareerStats = {
        gamesPlayed: careerStats.gamesPlayed + 1,
        gamesWon: careerStats.gamesWon + (won ? 1 : 0),
        bestGameScore: Math.max(careerStats.bestGameScore, finalPlayerScore),
        bestWordScore: Math.max(
          careerStats.bestWordScore,
          finalPlayerStats.bestWordScore,
        ),
        bestComboStreak: Math.max(
          careerStats.bestComboStreak,
          finalPlayerStats.highStreak,
        ),
        careerRunOuts: careerStats.careerRunOuts + finalPlayerStats.runOuts,
      };
      setCareerStats(newCareerStats);
      localStorage.setItem(
        "wordchain-career-stats",
        JSON.stringify(newCareerStats),
      );
      setShowGameOverDialog(true);
      return;
    }

    setTimerExpired(false); // Reset timer expired flag for next turn
    setTimeRemaining(timerDuration); // Reset timer to full duration
    setGameMode("normal"); // Reset game mode
    setPlayerConsecutivePasses(0); // Reset consecutive passes counter
    setOpponentConsecutivePasses(0); // Reset opponent's counter too since a word was played
    setCurrentPlayer("opponent");

    // Pass the updated board and lastPlayedTiles to avoid stale closure issues
    setTimeout(
      () =>
        opponentTurn(
          boardWithPlacedTiles,
          undefined,
          remainingBag,
          allTilesUsed,
        ),
      500,
    );
  };

  const recall = () => {
    if (placedTiles.length === 0) return;

    const rackContainer = rackRef.current;
    if (!rackContainer) {
      // Fallback - instant recall without animation
      const newBoard = board.map((r) => [...r]);
      const lettersToReturn: Letter[] = [];
      placedTiles.forEach(({ row, col, letter }) => {
        newBoard[row][col] = null;
        lettersToReturn.push(letter);
      });
      setBoard(newBoard);
      setPlayerRack([...playerRack, ...lettersToReturn]);
      setPlacedTiles([]);
      setInvalidTiles([]);
      setMessage(getMessage("TilesRecalled"));
      return;
    }

    const rackRect = rackContainer.getBoundingClientRect();
    const rackTileWidth = 48; // sm:w-12 = 48px

    // Build flying tiles array with staggered delays
    const newFlyingTiles: typeof flyingTiles = [];
    const tilesToRecall: { row: number; col: number }[] = [];

    placedTiles.forEach((tile, index) => {
      const boardCell = document.querySelector(
        `[data-board-cell][data-row="${tile.row}"][data-col="${tile.col}"]`,
      );

      if (boardCell) {
        const cellRect = boardCell.getBoundingClientRect();
        // Stagger target positions slightly so tiles fan out
        const targetX = rackRect.right - rackTileWidth / 2 - index * 5;
        const targetY = rackRect.top + rackRect.height / 2;

        newFlyingTiles.push({
          id: `${tile.row}-${tile.col}`,
          letter: tile.letter,
          startX: cellRect.left + cellRect.width / 2,
          startY: cellRect.top + cellRect.height / 2,
          endX: targetX,
          endY: targetY,
          startSize: cellRect.width,
          endSize: rackTileWidth,
          delay: index * 50, // 50ms stagger between each tile
        });

        tilesToRecall.push({ row: tile.row, col: tile.col });
      }
    });

    // Start animations
    setFlyingTiles(newFlyingTiles);
    setRecallingTiles(tilesToRecall);

    // Calculate total animation time (last tile delay + animation duration)
    const totalAnimationTime = (placedTiles.length - 1) * 50 + 400;

    // After all animations complete, actually move the tiles
    setTimeout(() => {
      const newBoard = board.map((r) => [...r]);
      const lettersToReturn: Letter[] = [];

      placedTiles.forEach(({ row, col, letter }) => {
        newBoard[row][col] = null;
        lettersToReturn.push(letter);
      });

      setBoard(newBoard);
      setPlayerRack([...playerRack, ...lettersToReturn]);
      setPlacedTiles([]);
      setInvalidTiles([]);
      setRecallingTiles([]);
      setFlyingTiles([]);
      setMessage(getMessage("TilesRecalled"));
    }, totalAnimationTime);
  };

  const randomizeTiles = () => {
    if (currentPlayer !== "player") return;

    const shuffled = [...playerRack];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setPlayerRack(shuffled);
    setMessage(getMessage("TilesRandomized"));
  };

  const swapTiles = () => {
    if (currentPlayer !== "player") return;
    if (placedTiles.length > 0) {
      setMessage(getMessage("CannotSwapWithTilesOnBoard"));
      return;
    }

    if (tileBag.length === 0) {
      setMessage(getMessage("NoTilesLeftToSwap"));
      return;
    }

    if (!isSwapMode) {
      // Enter swap mode for selecting tiles individually
      setIsSwapMode(true);
      // Only change gameMode to 'swap' if not already in forceSwapPass
      if (gameMode !== "forceSwapPass") {
        setGameMode("swap");
      }
      setSelectedTiles([]);
      setMessage(getMessage("SelectTilesToSwap"));
      return;
    }

    // Confirm swap - must have tiles selected
    if (selectedTiles.length === 0) {
      setMessage("Select tiles to swap first!");
      return;
    }

    // Confirm swap
    const tilesToSwap = selectedTiles.map((i) => playerRack[i]);
    const remainingRack = playerRack.filter(
      (_, idx) => !selectedTiles.includes(idx),
    );

    // Draw new tiles from bag
    const tilesToDraw = Math.min(tilesToSwap.length, tileBag.length);
    const newTiles = tileBag.slice(0, tilesToDraw);

    // Return swapped tiles to bag and shuffle
    const newBag = [...tileBag.slice(tilesToDraw), ...tilesToSwap];
    for (let i = newBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
    }

    setPlayerRack([...remainingRack, ...newTiles]);
    setTileBag(newBag);
    setSelectedTiles([]);
    setIsSwapMode(false);
    setMultiSelectMode(false);
    setGameMode("normal");
    setOrientation("horizontal");
    setMessage(
      getMessage("TilesSwappedFormat", {
        count: tilesToSwap.length.toString(),
      }),
    );
    setTimerExpired(false); // Reset timer expired flag for next turn
    setTimeRemaining(timerDuration); // Reset timer to full duration
    setCurrentPlayer("opponent");

    setTimeout(() => opponentTurn(), 1000);
  };

  const cancelSwap = () => {
    setIsSwapMode(false);
    setSelectedTiles([]);
    // If we're in forced swap/pass mode (timer expired), stay in that mode
    if (gameMode === "forceSwapPass") {
      setMessage(getMessage("TimesUpMustSwapOrPass"));
    } else {
      setGameMode("normal");
      setMessage(getMessage("YourTurn"));
    }
  };

  const pass = () => {
    // If tiles are placed, we need to clear them from the board
    // and pass the cleaned board to opponent to avoid stale closure issues
    let cleanedBoard = board;
    if (placedTiles.length > 0) {
      // Create a clean board without the placed tiles
      cleanedBoard = board.map((r) => [...r]);
      placedTiles.forEach(({ row, col }) => {
        cleanedBoard[row][col] = null;
      });
      // Return tiles to rack
      const lettersToReturn = placedTiles.map((t) => t.letter);
      setBoard(cleanedBoard);
      setPlayerRack([...playerRack, ...lettersToReturn]);
      setPlacedTiles([]);
      setInvalidTiles([]);
    }

    // Increment player's consecutive pass counter
    const newPlayerPasses = playerConsecutivePasses + 1;

    // If this would be player's 3rd pass and opponent has already passed 3 times, show warning
    // (The warning dialog will call confirmPass() to actually end the game)
    if (newPlayerPasses >= 3 && opponentConsecutivePasses >= 3) {
      setShowPassWarning(true);
      return;
    }

    setPlayerConsecutivePasses(newPlayerPasses);
    setMessage("Turn passed.");
    setTimerExpired(false); // Reset timer expired flag for next turn
    setTimeRemaining(timerDuration); // Reset timer to full duration
    setShowTimeoutDialog(false); // Close timeout dialog
    setGameMode("normal"); // Reset game mode
    // Passing doesn't change lastPlayedTiles - opponent can still chain off them
    setCurrentPlayer("opponent");
    // Pass the cleaned board to avoid stale closure issues
    setTimeout(() => opponentTurn(cleanedBoard), 1000);
  };

  // Update career stats and show game over dialog
  const endGameWithStats = (won: boolean) => {
    const newCareerStats: CareerStats = {
      gamesPlayed: careerStats.gamesPlayed + 1,
      gamesWon: careerStats.gamesWon + (won ? 1 : 0),
      bestGameScore: Math.max(careerStats.bestGameScore, playerScore),
      bestWordScore: Math.max(
        careerStats.bestWordScore,
        playerStats.bestWordScore,
      ),
      bestComboStreak: Math.max(
        careerStats.bestComboStreak,
        playerStats.highStreak,
      ),
      careerRunOuts: careerStats.careerRunOuts + playerStats.runOuts,
    };
    setCareerStats(newCareerStats);
    localStorage.setItem(
      "wordchain-career-stats",
      JSON.stringify(newCareerStats),
    );
    setShowGameOverDialog(true);
  };

  const confirmPass = () => {
    // User confirmed the final pass - end the game
    setShowPassWarning(false);
    setGameEnded(true);
    setPlayerConsecutivePasses(0);
    setOpponentConsecutivePasses(0);
    const won = playerScore > opponentScore;
    setMessage(
      "Game Over! Both players passed 3 times consecutively. " +
        (won
          ? "You win! 🎉"
          : opponentScore > playerScore
            ? "Opponent wins!"
            : "It's a tie!"),
    );
    localStorage.removeItem("scrabbull-game-state");
    endGameWithStats(won);
  };

  const cancelPass = () => {
    // User cancelled the pass
    setShowPassWarning(false);
  };

  const handleTimeoutSwap = () => {
    setShowTimeoutDialog(false);
    // Don't reset timer - let it stay at 0 to prevent infinite loop
    // User must complete swap and end turn without timer pressure
    setIsSwapMode(true);
    setGameMode("forceSwapPass");
    setSelectedTiles([]);
    setMessage(getMessage("SelectTilesToSwap"));
  };

  const handleTimeoutPass = () => {
    setShowTimeoutDialog(false);
    setMessage("Turn passed.");
    setTimerExpired(false); // Reset timer expired flag for next turn
    setGameMode("normal"); // Reset game mode
    setCurrentPlayer("opponent");
    setTimeout(() => opponentTurn(), 1000);
  };

  const quitGame = () => {
    // Clear localStorage
    localStorage.removeItem("scrabbull-game-state");

    // Reset all game state
    setBoard(createWelcomeBoard());
    setPlayerRack([]);
    setOpponentRack([]);
    setTileBag([]);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlacedTiles([]);
    setIsFirstMove(true);
    setLastPlayedTiles([]);
    setPlayerStats({
      highStreak: 0,
      totalScore: 0,
      runOuts: 0,
      bestWordScore: 0,
    });
    setOpponentStats({
      highStreak: 0,
      totalScore: 0,
      runOuts: 0,
      bestWordScore: 0,
    });

    setGameEnded(false);
    setShowCelebration(false);
    setShowTimeoutDialog(false);
    setShowGameOverDialog(false);
    setTimerExpired(false);
    setGameStarted(false);
    setCurrentPlayer("player");
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setPlayerConsecutivePasses(0);
    setOpponentConsecutivePasses(0);
    setTimeRemaining(0);
    setMessage("");
    setPlayerComboStreak(0);
    setOpponentComboStreak(0);
    setLastPlayedTiles([]);
  };

  const bgColor = darkMode ? "bg-gray-900" : "bg-gray-100";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const boardBg = darkMode ? "bg-gray-800" : "bg-white";
  const tileBg = darkMode ? "bg-amber-700" : "bg-amber-600";

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} p-2 sm:p-4`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <h1 className="flex items-center gap-1">
            {/* WORD tiles */}
            {["W", "O", "R", "D"].map((letter) => (
              <div
                key={`word-${letter}`}
                className={`w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-7 lg:h-7 xl:w-8 xl:h-8 flex items-center justify-center rounded font-bold ${
                  darkMode ? "bg-emerald-700" : "bg-emerald-600"
                } text-white relative tile-font`}
              >
                <div className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-2xl leading-none">
                  {letter}
                </div>
                <div className="absolute bottom-0 right-0.5 text-[0.25rem] sm:text-[0.3rem] md:text-[0.4rem] lg:text-[0.3rem] xl:text-[0.4rem] opacity-80">
                  {LETTER_SCORES[letter as Letter]}
                </div>
              </div>
            ))}
            {/* Space between words */}
            <div className="w-1 sm:w-2" />
            {/* CHAIN tiles */}
            {["C", "H", "A", "I", "N"].map((letter) => (
              <div
                key={`chain-${letter}`}
                className={`w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-7 lg:h-7 xl:w-8 xl:h-8 flex items-center justify-center rounded font-bold ${
                  darkMode ? "bg-emerald-700" : "bg-emerald-600"
                } text-white relative tile-font`}
              >
                <div className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-2xl leading-none">
                  {letter}
                </div>
                <div className="absolute bottom-0 right-0.5 text-[0.25rem] sm:text-[0.3rem] md:text-[0.4rem] lg:text-[0.3rem] xl:text-[0.4rem] opacity-80">
                  {LETTER_SCORES[letter as Letter]}
                </div>
              </div>
            ))}
            <span className="text-[0.5rem] sm:text-xs text-gray-500 font-normal self-end mb-0.5 ml-1">
              v{__APP_VERSION__}
            </span>
          </h1>
          <div className="flex items-center gap-2">
            {!gameStarted ? (
              <button
                onClick={initializeGame}
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "bg-blue-700 hover:bg-blue-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                title="Start Game"
              >
                <Play size={20} />
              </button>
            ) : (
              <button
                onClick={() => setShowQuitConfirm(true)}
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "bg-red-700 hover:bg-red-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
                title="Quit Game"
              >
                <Power size={20} />
              </button>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-300"
              }`}
              title={darkMode ? "Light Mode" : "Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar Section - Now on Left */}
          <div className="lg:w-[29rem] flex flex-col gap-4">
            {/* Scores */}
            <div className={`${boardBg} p-3 sm:p-4 rounded-lg`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex-1">
                  <div className="text-xs sm:text-sm text-gray-400">You</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-bold">
                      {playerScore}
                    </span>
                    {/* Player Combo Streak */}
                    {playerComboStreak >= 2 && (
                      <span className="text-orange-500 font-bold text-sm animate-pulse">
                        🔥{formatComboDisplay(playerComboStreak)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 text-center">
                  {timerDuration > 0 && gameStarted && !gameEnded ? (
                    <div
                      className={`text-lg sm:text-xl font-bold ${
                        timeRemaining <= 10 ? "text-red-500" : "text-gray-500"
                      }`}
                    >
                      {Math.floor(timeRemaining / 60)}:
                      {(timeRemaining % 60).toString().padStart(2, "0")}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">vs</span>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <div className="text-xs sm:text-sm text-gray-400">
                    Opponent
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {/* Opponent Combo Streak */}
                    {opponentComboStreak >= 2 && (
                      <span className="text-orange-500 font-bold text-sm animate-pulse">
                        🔥{formatComboDisplay(opponentComboStreak)}
                      </span>
                    )}
                    <span className="text-xl sm:text-2xl font-bold">
                      {opponentScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details - Collapsible (Stats + Game Options) */}
              <div
                className={`border-t ${
                  darkMode ? "border-gray-700" : "border-gray-300"
                } pt-2 mt-3`}
              >
                <button
                  onClick={() => setStatsExpanded(!statsExpanded)}
                  className={`w-full flex items-center justify-between text-xs sm:text-sm py-1 ${
                    darkMode
                      ? "text-gray-400 hover:text-gray-300"
                      : "text-gray-500 hover:text-gray-600"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {statsExpanded ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                    Details
                  </span>
                  <span className="text-[0.65rem] sm:text-xs">
                    {gameStarted
                      ? `${tileBag.length} tiles`
                      : difficulty.charAt(0).toUpperCase() +
                        difficulty.slice(1)}
                    {timerDuration > 0
                      ? ` / ${timerDuration >= 60 ? `${timerDuration / 60}m` : `${timerDuration}s`}`
                      : ""}
                  </span>
                </button>

                {statsExpanded && (
                  <div className="pt-2 space-y-3">
                    {/* Game Options - All three on one row */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs sm:text-sm mb-1 text-gray-400">
                          Difficulty
                        </label>
                        <select
                          value={difficulty}
                          onChange={(e) =>
                            setDifficulty(
                              e.target.value as
                                | "beginner"
                                | "intermediate"
                                | "advanced"
                                | "expert",
                            )
                          }
                          className={`w-full p-1.5 sm:p-2 rounded text-[0.65rem] sm:text-xs ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          }`}
                          disabled={gameStarted}
                          title="Select difficulty level"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs sm:text-sm mb-1 text-gray-400">
                          Timer
                        </label>
                        <select
                          value={timerDuration}
                          onChange={(e) =>
                            setTimerDuration(Number(e.target.value))
                          }
                          className={`w-full p-1.5 sm:p-2 rounded text-[0.65rem] sm:text-xs ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          }`}
                          disabled={gameStarted}
                          title="Select turn timer duration"
                        >
                          <option value={0}>None</option>
                          <option value={30}>30s</option>
                          <option value={45}>45s</option>
                          <option value={60}>1m</option>
                          <option value={90}>1.5m</option>
                          <option value={120}>2m</option>
                          <option value={180}>3m</option>
                          <option value={240}>4m</option>
                          <option value={300}>5m</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs sm:text-sm mb-1 text-gray-400">
                          Combo Bonus
                        </label>
                        <select
                          value={comboBonusType}
                          onChange={(e) =>
                            setComboBonusType(e.target.value as ComboBonusType)
                          }
                          className={`w-full p-1.5 sm:p-2 rounded text-[0.65rem] sm:text-xs ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          }`}
                          disabled={gameStarted}
                          title="Select combo bonus type"
                        >
                          <option value="increment10">+10%</option>
                          <option value="increment25">+25%</option>
                          <option value="increment50">+50%</option>
                          <option value="increment100">+100%</option>
                        </select>
                      </div>
                    </div>

                    {/* Stats - only show when game started */}
                    {gameStarted && (
                      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                        {/* Player Stats */}
                        <div>
                          <div className="text-gray-400 mb-1 font-semibold">
                            You
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                High Streak:
                              </span>
                              <span className="font-semibold">
                                {playerStats.highStreak > 0
                                  ? formatComboDisplay(playerStats.highStreak)
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Best:</span>
                              <span className="font-semibold">
                                {playerStats.bestWordScore}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Run Outs:</span>
                              <span className="font-semibold">
                                {playerStats.runOuts}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Opponent Stats */}
                        <div>
                          <div className="text-gray-400 mb-1 font-semibold">
                            Opponent
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                High Streak:
                              </span>
                              <span className="font-semibold">
                                {opponentStats.highStreak > 0
                                  ? formatComboDisplay(opponentStats.highStreak)
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Best:</span>
                              <span className="font-semibold">
                                {opponentStats.bestWordScore}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Run Outs:</span>
                              <span className="font-semibold">
                                {opponentStats.runOuts}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tile Rack */}
            <div
              ref={rackRef}
              data-rack-container
              className={`${boardBg} p-2 sm:p-4 rounded-lg`}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                if (currentPlayer !== "player") return;

                // Handle dropping tiles from board back to rack
                if (
                  draggedTile &&
                  draggedTile.source === "board" &&
                  draggedTile.row !== undefined &&
                  draggedTile.col !== undefined
                ) {
                  const newBoard = board.map((r) => [...r]);
                  newBoard[draggedTile.row][draggedTile.col] = null;
                  setBoard(newBoard);

                  setPlayerRack([...playerRack, draggedTile.letter]);
                  setPlacedTiles(
                    placedTiles.filter(
                      (t) =>
                        !(
                          t.row === draggedTile.row && t.col === draggedTile.col
                        ),
                    ),
                  );
                  setDraggedTile(null);
                }
              }}
            >
              <div className="text-xs sm:text-sm mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold">Your Tiles</span>
                <span
                  className={`text-right truncate ${darkMode ? "text-yellow-400" : "text-gray-600"}`}
                >
                  {message || (!gameStarted ? "Tap ▶ to start" : "")}
                </span>
              </div>
              <div
                className="flex gap-1 sm:gap-2 justify-start flex-wrap"
                onMouseUp={handleMouseUp}
              >
                {playerRack.map((letter, index) => {
                  const isSelected = selectedTiles.includes(index);
                  const minSelected =
                    selectedTiles.length > 0 ? Math.min(...selectedTiles) : -1;
                  const isFirstSelected = index === minSelected;
                  const isInSelectedRange =
                    isSelected && multiSelectMode && !isSwapMode; // Don't group in swap mode

                  if (isInSelectedRange && isFirstSelected) {
                    return (
                      <div
                        key={`selected-group-${index}`}
                        className="flex items-center gap-[1px] sm:gap-0.5 ring-2 sm:ring-4 ring-blue-400 rounded-lg p-[1px] sm:p-0.5 cursor-move relative touch-none"
                        draggable
                        onDragStart={(e) => {
                          const tilesToDrag = selectedTiles.map(
                            (i) => playerRack[i],
                          );
                          e.dataTransfer.setData(
                            "multiTiles",
                            JSON.stringify({
                              tiles: tilesToDrag,
                              indices: selectedTiles,
                            }),
                          );
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onTouchStart={(e) => {
                          const tilesToDrag = selectedTiles.map(
                            (i) => playerRack[i],
                          );
                          setTouchMultiTiles({
                            tiles: tilesToDrag,
                            indices: selectedTiles,
                          });
                          setTouchDragTile(null);
                          const touch = e.touches[0];
                          setTouchDragPosition({
                            x: touch.clientX,
                            y: touch.clientY,
                          });
                        }}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={(e) => {
                          // Toggle orientation when clicking on the group (not on individual tiles)
                          if (e.target === e.currentTarget && !timerExpired) {
                            setOrientation(
                              orientation === "horizontal"
                                ? "vertical"
                                : "horizontal",
                            );
                          }
                        }}
                      >
                        {/* Orientation indicator overlay - hide when timer expired */}
                        {!timerExpired && (
                          <div className="absolute -top-2 -right-2 bg-purple-600 rounded-full p-0.5 sm:p-1 shadow-lg pointer-events-none z-10">
                            {orientation === "horizontal" ? (
                              <ArrowRight size={12} className="sm:w-4 sm:h-4" />
                            ) : (
                              <ArrowDown size={12} className="sm:w-4 sm:h-4" />
                            )}
                          </div>
                        )}
                        {selectedTiles.map((tileIndex, positionInGroup) => (
                          <div
                            key={`tile-${tileIndex}`}
                            onClick={() => handleMouseDown(tileIndex)}
                            onMouseDown={(e) => {
                              // Capture which tile in the group was clicked for offset calculation
                              if (e.button === 0) {
                                // Left mouse button
                                setDragOffset(positionInGroup);
                              }
                            }}
                            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-9 lg:h-9 xl:w-11 xl:h-11 flex items-center justify-center rounded font-bold cursor-pointer ${tileBg} text-white transition-all hover:opacity-80 tile-font relative`}
                          >
                            <div className="text-base sm:text-xl md:text-2xl lg:text-xl xl:text-3xl leading-none">
                              {playerRack[tileIndex]}
                            </div>
                            <div className="absolute bottom-0.5 right-0.5 text-[0.4rem] sm:text-[0.5rem] md:text-[0.55rem] lg:text-[0.5rem] xl:text-[0.55rem] opacity-80">
                              {LETTER_SCORES[playerRack[tileIndex]]}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else if (isInSelectedRange) {
                    return null;
                  }

                  return (
                    <div
                      key={index}
                      data-rack-index={index}
                      draggable={!multiSelectMode && !isSwapMode}
                      onMouseDown={() => handleMouseDown(index)}
                      onClick={() => {
                        if (
                          (multiSelectMode || isSwapMode) &&
                          !selectedTiles.includes(index)
                        ) {
                          handleMouseDown(index);
                        }
                      }}
                      onDragStart={(e) => {
                        if (!multiSelectMode && !isSwapMode) {
                          handleDragStart(e, letter, "rack", index);
                        }
                      }}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnRack(e, index)}
                      onTouchStart={(e) => {
                        if (!multiSelectMode && !isSwapMode) {
                          handleTouchStart(e, letter, "rack", index);
                        } else if (isSwapMode) {
                          handleMouseDown(index);
                        }
                      }}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg font-bold touch-none tile-font relative ${
                        multiSelectMode || isSwapMode
                          ? "cursor-pointer"
                          : "cursor-move"
                      } ${tileBg} text-white transition-all ${
                        isSwapMode && isSelected ? "ring-2 ring-orange-400" : ""
                      } ${
                        multiSelectMode && !selectedTiles.includes(index)
                          ? "hover:ring-2 hover:ring-blue-300"
                          : ""
                      } ${
                        isSwapMode && !isSelected
                          ? "hover:ring-2 hover:ring-orange-300"
                          : ""
                      }`}
                    >
                      <div className="text-2xl sm:text-4xl leading-none">
                        {letter}
                      </div>
                      <div className="absolute bottom-0.5 right-1 text-[0.55rem] sm:text-[0.7rem] opacity-80">
                        {LETTER_SCORES[letter]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons - Only show when game is active */}
            {gameStarted && !gameEnded && (
              <div className="flex flex-col gap-2">
                {/* Top row: Conditional buttons based on game mode */}
                <div className="flex gap-2">
                  {isSwapMode ? (
                    // Swap mode: Show Swap and Cancel/Pass buttons (Pass if in forceSwapPass mode)
                    <>
                      <button
                        onClick={swapTiles}
                        disabled={
                          currentPlayer !== "player" ||
                          selectedTiles.length === 0
                        }
                        className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm ${
                          currentPlayer !== "player" ||
                          selectedTiles.length === 0
                            ? darkMode
                              ? "bg-gray-700 text-gray-500"
                              : "bg-gray-300 text-gray-400"
                            : darkMode
                              ? "bg-orange-700 hover:bg-orange-600"
                              : "bg-orange-500 hover:bg-orange-600 text-white"
                        }`}
                      >
                        <RefreshCw size={16} className="sm:w-4 sm:h-4" />
                        Swap{" "}
                        {selectedTiles.length > 0
                          ? `(${selectedTiles.length})`
                          : ""}
                      </button>
                      {gameMode === "forceSwapPass" ? (
                        // In forced mode, show Pass button instead of Cancel
                        <button
                          onClick={pass}
                          disabled={currentPlayer !== "player"}
                          className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm ${
                            currentPlayer !== "player"
                              ? darkMode
                                ? "bg-gray-700 text-gray-500"
                                : "bg-gray-300 text-gray-400"
                              : darkMode
                                ? "bg-yellow-700 hover:bg-yellow-600"
                                : "bg-yellow-500 hover:bg-yellow-600 text-white"
                          }`}
                        >
                          <SkipForward size={16} className="sm:w-4 sm:h-4" />
                          Pass
                        </button>
                      ) : (
                        // In normal swap mode, show Cancel button
                        <button
                          onClick={cancelSwap}
                          disabled={currentPlayer !== "player"}
                          className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm ${
                            currentPlayer !== "player"
                              ? darkMode
                                ? "bg-gray-700 text-gray-500"
                                : "bg-gray-300 text-gray-400"
                              : darkMode
                                ? "bg-gray-700 hover:bg-gray-600"
                                : "bg-gray-500 hover:bg-gray-600 text-white"
                          }`}
                        >
                          <X size={16} className="sm:w-4 sm:h-4" />
                          Cancel
                        </button>
                      )}
                    </>
                  ) : gameMode === "forceSwapPass" ? (
                    // Force Swap/Pass mode: Only show Swap and Pass buttons (when timer expired)
                    <>
                      <button
                        onClick={swapTiles}
                        disabled={currentPlayer !== "player"}
                        className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm ${
                          currentPlayer !== "player"
                            ? darkMode
                              ? "bg-gray-700 text-gray-500"
                              : "bg-gray-300 text-gray-400"
                            : darkMode
                              ? "bg-orange-700 hover:bg-orange-600"
                              : "bg-orange-500 hover:bg-orange-600 text-white"
                        }`}
                      >
                        <RefreshCw size={16} className="sm:w-4 sm:h-4" />
                        Swap
                      </button>
                      <button
                        onClick={pass}
                        disabled={currentPlayer !== "player"}
                        className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm ${
                          currentPlayer !== "player"
                            ? darkMode
                              ? "bg-gray-700 text-gray-500"
                              : "bg-gray-300 text-gray-400"
                            : darkMode
                              ? "bg-yellow-700 hover:bg-yellow-600"
                              : "bg-yellow-500 hover:bg-yellow-600 text-white"
                        }`}
                      >
                        <SkipForward size={16} className="sm:w-4 sm:h-4" />
                        Pass
                      </button>
                    </>
                  ) : (
                    // Normal mode: Show all regular buttons
                    <>
                      <button
                        onClick={() => {
                          if (!multiSelectMode) {
                            setMultiSelectMode(true);
                            setGameMode("group");
                            setMessage(getMessage("GroupModeActivated"));
                          } else {
                            setMultiSelectMode(false);
                            setGameMode("normal");
                            setSelectedTiles([]);
                            setOrientation("horizontal");
                            setMessage("");
                          }
                        }}
                        disabled={
                          currentPlayer !== "player" || placedTiles.length > 0
                        }
                        className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm ${
                          currentPlayer !== "player" || placedTiles.length > 0
                            ? darkMode
                              ? "bg-gray-700 text-gray-500"
                              : "bg-gray-300 text-gray-400"
                            : multiSelectMode
                              ? darkMode
                                ? "bg-blue-600 hover:bg-blue-500 ring-2 ring-blue-400"
                                : "bg-blue-500 hover:bg-blue-400 text-white ring-2 ring-blue-300"
                              : darkMode
                                ? "bg-purple-700 hover:bg-purple-600"
                                : "bg-purple-500 hover:bg-purple-600 text-white"
                        }`}
                      >
                        {multiSelectMode ? "Ungroup" : "Group"}
                      </button>

                      {/* Show Orientation button when in group mode, Shuffle when not */}
                      {multiSelectMode ? (
                        <button
                          onClick={() =>
                            setOrientation(
                              orientation === "horizontal"
                                ? "vertical"
                                : "horizontal",
                            )
                          }
                          disabled={currentPlayer !== "player"}
                          className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm ${
                            currentPlayer !== "player"
                              ? darkMode
                                ? "bg-gray-700 text-gray-500"
                                : "bg-gray-300 text-gray-400"
                              : darkMode
                                ? "bg-purple-700 hover:bg-purple-600"
                                : "bg-purple-500 hover:bg-purple-600 text-white"
                          }`}
                          title={`Current: ${
                            orientation === "horizontal"
                              ? "Horizontal →"
                              : "Vertical ↓"
                          }`}
                        >
                          {orientation === "horizontal" ? (
                            <ArrowRight size={16} className="sm:w-4 sm:h-4" />
                          ) : (
                            <ArrowDown size={16} className="sm:w-4 sm:h-4" />
                          )}
                          {orientation === "horizontal"
                            ? "Horizontal"
                            : "Vertical"}
                        </button>
                      ) : (
                        <button
                          onClick={randomizeTiles}
                          disabled={
                            currentPlayer !== "player" || placedTiles.length > 0
                          }
                          className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm ${
                            currentPlayer !== "player" || placedTiles.length > 0
                              ? darkMode
                                ? "bg-gray-700 text-gray-500"
                                : "bg-gray-300 text-gray-400"
                              : darkMode
                                ? "bg-indigo-700 hover:bg-indigo-600"
                                : "bg-indigo-500 hover:bg-indigo-600 text-white"
                          }`}
                        >
                          <Shuffle size={16} className="sm:w-4 sm:h-4" />
                          Shuffle
                        </button>
                      )}

                      <button
                        onClick={swapTiles}
                        disabled={
                          currentPlayer !== "player" || placedTiles.length > 0
                        }
                        className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm ${
                          currentPlayer !== "player" || placedTiles.length > 0
                            ? darkMode
                              ? "bg-gray-700 text-gray-500"
                              : "bg-gray-300 text-gray-400"
                            : darkMode
                              ? "bg-orange-700 hover:bg-orange-600"
                              : "bg-orange-500 hover:bg-orange-600 text-white"
                        }`}
                      >
                        <RefreshCw size={16} className="sm:w-4 sm:h-4" />
                        Swap
                      </button>

                      <button
                        onClick={pass}
                        disabled={currentPlayer !== "player"}
                        className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm ${
                          currentPlayer !== "player"
                            ? darkMode
                              ? "bg-gray-700 text-gray-500"
                              : "bg-gray-300 text-gray-400"
                            : darkMode
                              ? "bg-yellow-700 hover:bg-yellow-600"
                              : "bg-yellow-500 hover:bg-yellow-600 text-white"
                        }`}
                      >
                        <SkipForward size={16} className="sm:w-4 sm:h-4" />
                        Pass
                      </button>
                    </>
                  )}
                </div>

                {/* Bottom row: Recall and Submit (only shown when tiles are placed) */}
                {placedTiles.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={recall}
                      disabled={currentPlayer !== "player"}
                      className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base ${
                        currentPlayer !== "player"
                          ? darkMode
                            ? "bg-gray-700 text-gray-500"
                            : "bg-gray-300 text-gray-400"
                          : darkMode
                            ? "bg-red-700 hover:bg-red-600"
                            : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                    >
                      <X size={18} className="sm:w-5 sm:h-5" />
                      Recall
                    </button>
                    <button
                      onClick={submitWord}
                      disabled={currentPlayer !== "player"}
                      className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base ${
                        currentPlayer !== "player"
                          ? darkMode
                            ? "bg-gray-700 text-gray-500"
                            : "bg-gray-300 text-gray-400"
                          : darkMode
                            ? "bg-green-700 hover:bg-green-600"
                            : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      <Check size={18} className="sm:w-5 sm:h-5" />
                      Submit
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Board Section - Now on Right */}
          <div className="flex-1 flex items-start justify-center lg:justify-start">
            <div
              ref={boardRef}
              className={`${boardBg} p-1 sm:p-2 rounded-lg overflow-auto max-w-full`}
            >
              <div className="inline-block">
                {board.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex whitespace-nowrap">
                    {row.map((cell, colIndex) => {
                      const squareType = getSquareType(rowIndex, colIndex);
                      const isInvalid = invalidTiles.some(
                        (t) => t.row === rowIndex && t.col === colIndex,
                      );
                      const isLastPlayed = lastPlayedTiles.some(
                        (t) => t.row === rowIndex && t.col === colIndex,
                      );
                      // Show combo tiles - always show the tiles from the most recent word played
                      const isComboTile = lastPlayedTiles.some(
                        (t) => t.row === rowIndex && t.col === colIndex,
                      );
                      // Check if this is a placed tile (can be recalled)
                      const isPlacedTile = placedTiles.some(
                        (t) => t.row === rowIndex && t.col === colIndex,
                      );
                      // Check if this tile is being recalled (flying animation)
                      const isRecalling = recallingTiles.some(
                        (t) => t.row === rowIndex && t.col === colIndex,
                      );

                      // Generate random animation parameters for each tile
                      const animationDelay =
                        showCelebration && cell
                          ? `${(rowIndex * BOARD_SIZE + colIndex) * 0.05}s`
                          : "0s";
                      const floatX1 = showCelebration
                        ? Math.random() * 40 - 20
                        : 0;
                      const floatY1 = showCelebration
                        ? Math.random() * 40 - 20
                        : 0;
                      const floatX2 = showCelebration
                        ? Math.random() * 60 - 30
                        : 0;
                      const floatY2 = showCelebration
                        ? Math.random() * 60 - 30
                        : 0;
                      const floatX3 = showCelebration
                        ? Math.random() * 40 - 20
                        : 0;
                      const floatY3 = showCelebration
                        ? Math.random() * 40 - 20
                        : 0;

                      return (
                        <div
                          key={colIndex}
                          data-board-cell
                          data-row={rowIndex}
                          data-col={colIndex}
                          onDragOver={handleDragOver}
                          onDrop={(e) =>
                            handleDropOnBoard(e, rowIndex, colIndex)
                          }
                          className={`w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-7 lg:h-7 xl:w-8 xl:h-8 m-[0.5px] sm:m-[1px] flex items-center justify-center text-[0.45rem] sm:text-[0.55rem] md:text-xs lg:text-[0.55rem] xl:text-xs font-bold rounded cursor-pointer ${
                            isInvalid
                              ? "bg-red-600"
                              : getSquareStyle(
                                  rowIndex,
                                  colIndex,
                                  cell !== null,
                                  isLastPlayed,
                                )
                          } ${cell ? "text-white" : "text-white/70"} ${
                            showCelebration && cell ? "tile-celebrate" : ""
                          } ${
                            isComboTile && cell && !showCelebration
                              ? "ring-2 ring-orange-400 ring-offset-1 ring-offset-transparent"
                              : ""
                          }`}
                          {...(showCelebration && cell
                            ? {
                                style: {
                                  animationDelay,
                                  "--float-x-1": `${floatX1}px`,
                                  "--float-y-1": `${floatY1}px`,
                                  "--float-x-2": `${floatX2}px`,
                                  "--float-y-2": `${floatY2}px`,
                                  "--float-x-3": `${floatX3}px`,
                                  "--float-y-3": `${floatY3}px`,
                                } as React.CSSProperties,
                              }
                            : {})}
                        >
                          {cell ? (
                            <div
                              draggable={
                                !showCelebration &&
                                placedTiles.some(
                                  (t) =>
                                    t.row === rowIndex && t.col === colIndex,
                                )
                              }
                              onDragStart={(e) =>
                                handleDragStart(
                                  e,
                                  cell.letter,
                                  "board",
                                  undefined,
                                  rowIndex,
                                  colIndex,
                                )
                              }
                              onTouchStart={(e) => {
                                if (!showCelebration && isPlacedTile) {
                                  handleTouchStart(
                                    e,
                                    cell.letter,
                                    "board",
                                    undefined,
                                    rowIndex,
                                    colIndex,
                                  );
                                }
                              }}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={(e) => {
                                handleTouchEnd(e);
                                // Check for double-tap on placed tiles
                                if (isPlacedTile && !showCelebration) {
                                  handleTileDoubleTap(rowIndex, colIndex);
                                }
                              }}
                              onClick={() => {
                                // Desktop double-click support
                                if (isPlacedTile && !showCelebration) {
                                  handleTileDoubleTap(rowIndex, colIndex);
                                }
                              }}
                              className={`flex items-center justify-center leading-none touch-none relative w-full h-full ${
                                !showCelebration && !isRecalling
                                  ? "cursor-move"
                                  : ""
                              } ${isRecalling ? "tile-recall" : ""}`}
                            >
                              <div className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-2xl font-bold leading-none">
                                {cell.letter}
                              </div>
                              <div className="absolute bottom-0 right-0.5 text-[0.35rem] sm:text-[0.4rem] md:text-[0.5rem] lg:text-[0.4rem] xl:text-[0.5rem] opacity-80">
                                {cell.score}
                              </div>
                            </div>
                          ) : (
                            getSquareLabel(squareType)
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeout Dialog */}
        {showTimeoutDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${boardBg} p-6 rounded-lg max-w-md w-full`}>
              <h2 className="text-xl font-bold mb-4 text-center">Time's Up!</h2>
              <p className="mb-6 text-center">
                {getMessage("TimesUpMustSwapOrPass")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleTimeoutSwap}
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                    darkMode
                      ? "bg-blue-700 hover:bg-blue-600"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Swap Tiles
                </button>
                <button
                  onClick={handleTimeoutPass}
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                    darkMode
                      ? "bg-yellow-700 hover:bg-yellow-600"
                      : "bg-yellow-500 hover:bg-yellow-600 text-white"
                  }`}
                >
                  Pass
                </button>
              </div>
            </div>
          </div>
        )}

        {showPassWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${boardBg} p-6 rounded-lg max-w-md w-full`}>
              <h2 className="text-xl font-bold mb-4 text-center text-red-500">
                ⚠️ Warning
              </h2>
              <p className="mb-6 text-center">
                This is the 3rd consecutive pass. If you pass now, the game will
                end. Are you sure you want to pass?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelPass}
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-500 hover:bg-gray-600 text-white"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPass}
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                    darkMode
                      ? "bg-red-700 hover:bg-red-600"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  End Game
                </button>
              </div>
            </div>
          </div>
        )}

        {showQuitConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${boardBg} p-6 rounded-lg max-w-md w-full`}>
              <h2 className="text-xl font-bold mb-4 text-center">Quit Game?</h2>
              <p className="mb-6 text-center">
                Are you sure you want to quit the current game? Your progress
                will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-500 hover:bg-gray-600 text-white"
                  }`}
                >
                  Continue Playing
                </button>
                <button
                  onClick={() => {
                    setShowQuitConfirm(false);
                    quitGame();
                  }}
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                    darkMode
                      ? "bg-red-700 hover:bg-red-600"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  Quit Game
                </button>
              </div>
            </div>
          </div>
        )}

        {showGameOverDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${boardBg} p-6 rounded-lg max-w-md w-full`}>
              <h2 className="text-2xl font-bold mb-2 text-center">
                {playerScore > opponentScore
                  ? "🎉 You Win!"
                  : opponentScore > playerScore
                    ? "Game Over"
                    : "It's a Tie!"}
              </h2>
              <p className="text-center mb-4 text-lg">
                Final Score: {playerScore} - {opponentScore}
              </p>

              {/* This Game Stats */}
              <div
                className={`${darkMode ? "bg-gray-700" : "bg-gray-100"} p-3 rounded-lg mb-4`}
              >
                <h3 className="font-semibold mb-2 text-center">This Game</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Best Word:</span>
                    <span className="font-semibold">
                      {playerStats.bestWordScore}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Streak:</span>
                    <span className="font-semibold">
                      {formatComboDisplay(playerStats.highStreak)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Run Outs:</span>
                    <span className="font-semibold">{playerStats.runOuts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Score:</span>
                    <span className="font-semibold">{playerScore}</span>
                  </div>
                </div>
              </div>

              {/* Career Stats */}
              <div
                className={`${darkMode ? "bg-blue-900" : "bg-blue-100"} p-3 rounded-lg mb-4`}
              >
                <h3 className="font-semibold mb-2 text-center">Career Stats</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Games Played:</span>
                    <span className="font-semibold">
                      {careerStats.gamesPlayed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Games Won:</span>
                    <span className="font-semibold">
                      {careerStats.gamesWon}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Game:</span>
                    <span className="font-semibold">
                      {careerStats.bestGameScore}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Word:</span>
                    <span className="font-semibold">
                      {careerStats.bestWordScore}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Streak:</span>
                    <span className="font-semibold">
                      {formatComboDisplay(careerStats.bestComboStreak)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Run Outs:</span>
                    <span className="font-semibold">
                      {careerStats.careerRunOuts}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowGameOverDialog(false);
                  quitGame();
                }}
                className={`w-full py-3 rounded-lg font-semibold ${
                  darkMode
                    ? "bg-blue-700 hover:bg-blue-600"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Floating touch drag tile - style needed for dynamic positioning */}
        {touchDragPosition && (touchDragTile || touchMultiTiles) && (
          // eslint-disable-next-line react/forbid-dom-props
          <div
            className="floating-drag-tile"
            style={
              {
                "--drag-x": `${touchDragPosition.x - 24}px`,
                "--drag-y": `${touchDragPosition.y - 24}px`,
              } as React.CSSProperties
            }
          >
            {touchMultiTiles ? (
              <div
                className={`flex ${orientation === "vertical" ? "flex-col" : "flex-row"} gap-1 opacity-90`}
              >
                {touchMultiTiles.tiles.map((letter, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg font-bold ${tileBg} text-white shadow-lg`}
                  >
                    <div className="text-xl leading-none">{letter}</div>
                    <div className="text-[0.5rem]">{LETTER_SCORES[letter]}</div>
                  </div>
                ))}
              </div>
            ) : touchDragTile ? (
              <div
                className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg font-bold ${tileBg} text-white shadow-lg opacity-90`}
              >
                <div className="text-xl leading-none">
                  {touchDragTile.letter}
                </div>
                <div className="text-[0.5rem]">
                  {LETTER_SCORES[touchDragTile.letter]}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Flying tile animations for recall */}
        {flyingTiles.map((tile) => (
          // eslint-disable-next-line react/forbid-dom-props
          <div
            key={tile.id}
            className={`flying-tile ${tileBg} shadow-lg`}
            style={
              {
                left: `${tile.startX}px`,
                top: `${tile.startY}px`,
                marginLeft: `-${tile.startSize / 2}px`,
                marginTop: `-${tile.startSize / 2}px`,
                "--start-size": `${tile.startSize}px`,
                "--end-size": `${tile.endSize}px`,
                "--travel-x": `${tile.endX - tile.startX}px`,
                "--travel-y": `${tile.endY - tile.startY}px`,
                animationDelay: `${tile.delay}ms`,
              } as React.CSSProperties
            }
          >
            <div className="text-lg sm:text-xl leading-none">{tile.letter}</div>
            <div className="text-[0.4rem] sm:text-[0.5rem]">
              {LETTER_SCORES[tile.letter]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WordGame;
