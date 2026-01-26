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
import { loadWordList, isValidWord } from "./wordlist";
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

type SquareType = "normal" | "DL" | "TL" | "DW" | "TW" | "center";

type GameMode = "normal" | "group" | "swap" | "forceSwapPass";

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

  // Spell "SCRABBULL" horizontally in the middle
  const word = "SCRABBULL";
  const startRow = 7;
  const startCol = 3;

  for (let i = 0; i < word.length; i++) {
    const letter = word[i] as Letter;
    emptyBoard[startRow][startCol + i] = {
      letter: letter,
      score: LETTER_SCORES[letter],
    };
  }

  return emptyBoard;
};

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
  const [consecutivePasses, setConsecutivePasses] = useState<number>(0); // Tracks consecutive passes by both players
  const [showPassWarning, setShowPassWarning] = useState<boolean>(false); // Shows warning before final pass
  const [statsExpanded, setStatsExpanded] = useState<boolean>(false); // Details section collapsed by default
  const [playerComboStreak, setPlayerComboStreak] = useState<number>(0); // Player's combo streak (0 = no combo, 2+ = active)
  const [opponentComboStreak, setOpponentComboStreak] = useState<number>(0); // Opponent's combo streak (0 = no combo, 2+ = active)

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
  const boardRef = useRef<HTMLDivElement>(null);
  const rackRef = useRef<HTMLDivElement>(null);

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

        const scoring = calculateFullScore(boardWithPlacedTiles, placedTiles, lastPlayedTiles, playerComboStreak);
        const wordsText = validation.words.join(", ");

        let previewMessage = `Preview: ${scoring.finalScore} points (${wordsText})`;

        if (scoring.isCombo) {
          previewMessage += ` 🔥 ${scoring.comboMultiplier}x COMBO!`;
        }

        if (scoring.isRunOut) {
          previewMessage += " 🎉 RUN OUT! (+50)";
        }

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
      setTimeout(() => opponentTurn(), 1000);
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
      } else {
        setTouchDragTile({ letter, source, index, row, col });
        setTouchMultiTiles(null);
      }

      setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
    },
    [currentPlayer, isSwapMode, multiSelectMode, selectedTiles, playerRack],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchDragTile && !touchMultiTiles) return;

      e.preventDefault(); // Prevent scrolling while dragging
      const touch = e.touches[0];
      setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
    },
    [touchDragTile, touchMultiTiles],
  );

  const handleTouchEnd = useCallback(
    (_e: React.TouchEvent) => {
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
        return <span className="text-base sm:text-lg md:text-xl">🤘🐂🤘</span>;
      default:
        return "";
    }
  };

  const calculateScore = (tiles: PlacedTile[], scoreBoard?: (BoardTile | null)[][]): number => {
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
    newComboStreak: number;
    allWordPositions: Array<{ row: number; col: number }>;
  }

  // Unified scoring function for player, opponent, and preview
  const calculateFullScore = (
    currentBoard: (BoardTile | null)[][],
    tiles: PlacedTile[],
    currentComboTiles: PlacedTile[],
    currentComboStreak: number,
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
        const wordChainsOff = word.some(pos =>
          currentComboTiles.some(combo => combo.row === pos.row && combo.col === pos.col)
        );
        if (wordChainsOff) {
          comboWordCount++;
        }
      }
    }

    const isCombo = comboWordCount > 0;

    // Calculate combo multiplier - streak increases by number of chaining words
    let newComboStreak = 0;
    let comboMultiplier = 1;
    let finalScore = adjustedBaseScore;

    if (isCombo) {
      // If starting a new streak, start at 2; otherwise add the combo word count
      newComboStreak = currentComboStreak === 0 ? 1 + comboWordCount : currentComboStreak + comboWordCount;
      comboMultiplier = newComboStreak;
      finalScore = adjustedBaseScore * comboMultiplier;
    }

    return {
      baseScore: adjustedBaseScore,
      finalScore,
      isRunOut,
      isCombo,
      comboWordCount,
      comboMultiplier,
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
      while (endCol < BOARD_SIZE - 1 && testBoard[row][endCol + 1] !== null) endCol++;

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
        while (perpendicularStart > 0 && testBoard[perpendicularStart - 1][tile.col] !== null) perpendicularStart--;
        while (perpendicularEnd < BOARD_SIZE - 1 && testBoard[perpendicularEnd + 1][tile.col] !== null) perpendicularEnd++;

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
      while (endRow < BOARD_SIZE - 1 && testBoard[endRow + 1][col] !== null) endRow++;

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
        while (perpendicularStart > 0 && testBoard[tile.row][perpendicularStart - 1] !== null) perpendicularStart--;
        while (perpendicularEnd < BOARD_SIZE - 1 && testBoard[tile.row][perpendicularEnd + 1] !== null) perpendicularEnd++;

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

    words.forEach(word => {
      word.forEach(pos => {
        if (!positions.some(p => p.row === pos.row && p.col === pos.col)) {
          positions.push(pos);
        }
      });
    });

    return positions;
  };

  const opponentTurn = async () => {
    setTimeout(async () => {
      const currentBoard = board;

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

      // Determine word length based on difficulty
      let maxWordLength: number;
      let maxAttempts = 50;
      if (difficulty === "beginner") {
        maxWordLength = Math.min(5, opponentRack.length);
        maxAttempts = 250;
      } else if (difficulty === "intermediate") {
        maxWordLength = Math.min(6, opponentRack.length);
        maxAttempts = 500;
      } else if (difficulty === "advanced") {
        maxWordLength = Math.min(7, opponentRack.length);
        maxAttempts = 1000;
      } else {
        // expert
        maxWordLength = Math.min(7, opponentRack.length);
        maxAttempts = 2500;
      }

      // Try to find a valid word placement
      let attempt = 0;
      let validPlacement: {
        spot: { row: number; col: number };
        word: string[];
        wordLength: number;
      } | null = null;

      // Try different word lengths from maxWordLength down to 2
      for (
        let wordLength = maxWordLength;
        wordLength >= 2 && !validPlacement;
        wordLength--
      ) {
        if (wordLength > opponentRack.length) continue;

        const availableSpots: { row: number; col: number }[] = [];

        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c <= BOARD_SIZE - wordLength; c++) {
            // Check if all spots are empty
            let allEmpty = true;
            for (let i = 0; i < wordLength; i++) {
              if (currentBoard[r][c + i] !== null) {
                allEmpty = false;
                break;
              }
            }

            if (allEmpty) {
              if (isBoardEmpty) {
                // If board is empty, must play through center
                const center = Math.floor(BOARD_SIZE / 2);
                if (
                  r === center &&
                  c <= center &&
                  c + wordLength - 1 >= center
                ) {
                  availableSpots.push({ row: r, col: c });
                }
              } else {
                // Only add if it touches an existing tile
                if (touchesExistingTile(r, c, wordLength)) {
                  availableSpots.push({ row: r, col: c });
                }
              }
            }
          }
        }

        if (availableSpots.length === 0) continue;

        // Shuffle available spots for randomness
        const shuffledSpots = [...availableSpots].sort(
          () => Math.random() - 0.5,
        );

        // Try random combinations of letters
        for (const spot of shuffledSpots) {
          if (attempt >= maxAttempts) break;

          // Generate random permutations of letters from the rack
          const rackCopy = [...opponentRack];
          for (let i = rackCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rackCopy[i], rackCopy[j]] = [rackCopy[j], rackCopy[i]];
          }

          const word = rackCopy.slice(0, wordLength);

          // Create test board
          const testBoard = currentBoard.map((r) => [...r]);
          const testTiles: PlacedTile[] = [];

          word.forEach((letter, i) => {
            testBoard[spot.row][spot.col + i] = {
              letter,
              score: LETTER_SCORES[letter],
            };
            testTiles.push({ row: spot.row, col: spot.col + i, letter });
          });

          // Validate the placement using unified validation
          const validation = await validatePlacement(
            testBoard,
            testTiles,
            isBoardEmpty,
          );
          attempt++;

          if (validation.valid) {
            validPlacement = { spot, word, wordLength };
            break;
          }
        }
      }

      // If no valid placement found, pass
      if (!validPlacement) {
        const newConsecutivePasses = consecutivePasses + 1;

        if (newConsecutivePasses >= 6) {
          // End the game after 6 consecutive passes
          setGameEnded(true);
          setConsecutivePasses(0);
          setMessage(
            "Game Over! Both players passed 3 times consecutively. " +
              (playerScore > opponentScore
                ? "You win! 🎉"
                : opponentScore > playerScore
                  ? "Opponent wins!"
                  : "It's a tie!"),
          );
          localStorage.removeItem("scrabbull-game-state");
          return;
        }

        setConsecutivePasses(newConsecutivePasses);
        setMessage(getMessage("OpponentPassed"));
        setCurrentPlayer("player");
        setGameMode("normal"); // Reset to normal mode after opponent turn
        setTimeRemaining(timerDuration); // Reset timer to full duration
        // Passing doesn't change lastPlayedTiles - player can still chain off them
        return;
      }

      // Apply the valid placement
      const newBoard = currentBoard.map((r) => [...r]);
      const opponentPlacedTiles: PlacedTile[] = [];

      validPlacement.word.forEach((letter, i) => {
        newBoard[validPlacement.spot.row][validPlacement.spot.col + i] = {
          letter: letter as Letter,
          score: LETTER_SCORES[letter as Letter],
        };
        opponentPlacedTiles.push({
          row: validPlacement.spot.row,
          col: validPlacement.spot.col + i,
          letter: letter as Letter,
        });
      });

      // Use shared scoring function - opponent chains off the last played tiles (by either player)
      const scoring = calculateFullScore(newBoard, opponentPlacedTiles, lastPlayedTiles, opponentComboStreak);

      // Update opponent's combo streak (player's streak is unaffected)
      setOpponentComboStreak(scoring.newComboStreak);

      setOpponentScore(opponentScore + scoring.finalScore);
      setOpponentStats({
        highStreak: Math.max(opponentStats.highStreak, scoring.newComboStreak),
        totalScore: opponentStats.totalScore + scoring.finalScore,
        runOuts: opponentStats.runOuts + (scoring.isRunOut ? 1 : 0),
        bestWordScore: Math.max(opponentStats.bestWordScore, scoring.finalScore),
      });

      const usedLetters = validPlacement.word;
      const newOpponentRack = opponentRack.filter((letter) => {
        const usedIndex = usedLetters.indexOf(letter);
        if (usedIndex !== -1) {
          usedLetters.splice(usedIndex, 1);
          return false;
        }
        return true;
      });

      const tilesToDraw = Math.min(validPlacement.wordLength, tileBag.length);
      const newTiles = tileBag.slice(0, tilesToDraw);
      const remainingBag = tileBag.slice(tilesToDraw);

      setBoard(newBoard);
      setOpponentRack([...newOpponentRack, ...newTiles]);
      setTileBag(remainingBag);
      setIsFirstMove(false);
      setConsecutivePasses(0); // Reset consecutive passes counter
      setCurrentPlayer("player");
      // Set all tiles used in the formed words for display and combo chaining
      const allOpponentTilesUsed = scoring.allWordPositions.map(pos => ({
        row: pos.row,
        col: pos.col,
        letter: newBoard[pos.row][pos.col]?.letter as Letter,
      }));
      setLastPlayedTiles(allOpponentTilesUsed);

      let opponentMessage = getMessage("OpponentScoredFormat", { score: scoring.finalScore.toString() });
      if (scoring.isCombo) {
        opponentMessage += ` 🔥 ${scoring.comboMultiplier}x COMBO!`;
      }
      if (scoring.isRunOut) {
        opponentMessage += " 🎉 RUN OUT! (+50)";
      }
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
    const scoring = calculateFullScore(boardWithPlacedTiles, placedTiles, lastPlayedTiles, playerComboStreak);

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
      scoreMessage += ` 🔥 ${scoring.comboMultiplier}x COMBO!`;
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
    const allTilesUsed = scoring.allWordPositions.map(pos => ({
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
      setGameEnded(true);
      setShowCelebration(true);
      setMessage(
        "Game Over! " +
          (playerScore > opponentScore
            ? "You win! 🎉"
            : opponentScore > playerScore
              ? "Opponent wins!"
              : "It's a tie!"),
      );
      // Clear saved game state when game ends
      localStorage.removeItem("scrabbull-game-state");
      return;
    }

    setTimerExpired(false); // Reset timer expired flag for next turn
    setTimeRemaining(timerDuration); // Reset timer to full duration
    setGameMode("normal"); // Reset game mode
    setConsecutivePasses(0); // Reset consecutive passes counter
    setCurrentPlayer("opponent");

    setTimeout(() => opponentTurn(), 500);
  };

  const recall = () => {
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
    if (placedTiles.length > 0) {
      recall();
    }

    // Check if this is the 6th consecutive pass (3 for each player)
    const newConsecutivePasses = consecutivePasses + 1;

    if (newConsecutivePasses >= 6) {
      // End the game after 6 consecutive passes
      setGameEnded(true);
      setConsecutivePasses(0);
      setMessage(
        "Game Over! Both players passed 3 times consecutively. " +
          (playerScore > opponentScore
            ? "You win! 🎉"
            : opponentScore > playerScore
              ? "Opponent wins!"
              : "It's a tie!"),
      );
      localStorage.removeItem("scrabbull-game-state");
      return;
    }

    if (newConsecutivePasses === 5) {
      // This is the player's 3rd consecutive pass - show warning
      setShowPassWarning(true);
      return;
    }

    setConsecutivePasses(newConsecutivePasses);
    setMessage("Turn passed.");
    setTimerExpired(false); // Reset timer expired flag for next turn
    setTimeRemaining(timerDuration); // Reset timer to full duration
    setShowTimeoutDialog(false); // Close timeout dialog
    setGameMode("normal"); // Reset game mode
    // Passing doesn't change lastPlayedTiles - opponent can still chain off them
    setCurrentPlayer("opponent");
    setTimeout(() => opponentTurn(), 1000);
  };

  const confirmPass = () => {
    // User confirmed the final pass - end the game
    setShowPassWarning(false);
    setGameEnded(true);
    setConsecutivePasses(0);
    setMessage(
      "Game Over! Both players passed 3 times consecutively. " +
        (playerScore > opponentScore
          ? "You win! 🎉"
          : opponentScore > playerScore
            ? "Opponent wins!"
            : "It's a tie!"),
    );
    localStorage.removeItem("scrabbull-game-state");
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
    setTimerExpired(false);
    setGameStarted(false);
    setCurrentPlayer("player");
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
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
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🐂</span>
            Word Chain
            <span className="text-[0.5rem] sm:text-xs text-gray-500 font-normal self-end mb-0.5">
              v26.01.25.22.42
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
                onClick={quitGame}
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
                        🔥{playerComboStreak}x
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 text-center text-gray-500 text-sm">
                  vs
                </div>
                <div className="flex-1 text-right">
                  <div className="text-xs sm:text-sm text-gray-400">
                    Opponent
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {/* Opponent Combo Streak */}
                    {opponentComboStreak >= 2 && (
                      <span className="text-orange-500 font-bold text-sm animate-pulse">
                        🔥{opponentComboStreak}x
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
                    {/* Game Options */}
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
                          className={`w-full p-2 rounded text-xs sm:text-sm ${
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
                          Turn Timer
                        </label>
                        <select
                          value={timerDuration}
                          onChange={(e) =>
                            setTimerDuration(Number(e.target.value))
                          }
                          className={`w-full p-2 rounded text-xs sm:text-sm ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          }`}
                          disabled={gameStarted}
                          title="Select turn timer duration"
                        >
                          <option value={0}>None</option>
                          <option value={30}>30 Sec</option>
                          <option value={45}>45 Sec</option>
                          <option value={60}>1 Min</option>
                          <option value={90}>1.5 Min</option>
                          <option value={120}>2 Min</option>
                          <option value={180}>3 Min</option>
                          <option value={240}>4 Min</option>
                          <option value={300}>5 Min</option>
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
                              <span className="text-gray-400">High Streak:</span>
                              <span className="font-semibold">
                                {playerStats.highStreak > 0 ? `${playerStats.highStreak}x` : '-'}
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
                              <span className="text-gray-400">High Streak:</span>
                              <span className="font-semibold">
                                {opponentStats.highStreak > 0 ? `${opponentStats.highStreak}x` : '-'}
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

              {/* Time Remaining */}
              {timerDuration > 0 &&
                gameStarted &&
                currentPlayer === "player" &&
                !gameEnded && (
                  <div
                    className={`mt-3 p-2 rounded flex items-center justify-center ${
                      timeRemaining <= 10
                        ? darkMode
                          ? "bg-red-900"
                          : "bg-red-200"
                        : darkMode
                          ? "bg-gray-700"
                          : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`text-sm sm:text-base font-bold ${
                        timeRemaining <= 10 ? "text-red-500" : ""
                      }`}
                    >
                      Time: {Math.floor(timeRemaining / 60)}:
                      {(timeRemaining % 60).toString().padStart(2, "0")}
                    </div>
                  </div>
                )}
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
                  className={`text-right truncate ${darkMode ? "text-blue-400" : "text-blue-600"}`}
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
                            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-9 lg:h-9 xl:w-11 xl:h-11 flex flex-col items-center justify-center rounded font-bold cursor-pointer ${tileBg} text-white transition-all hover:opacity-80`}
                          >
                            <div className="text-sm sm:text-lg md:text-xl lg:text-lg xl:text-2xl leading-none">
                              {playerRack[tileIndex]}
                            </div>
                            <div className="text-[0.3rem] sm:text-[0.4rem] md:text-[0.45rem] lg:text-[0.4rem] xl:text-[0.45rem]">
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
                      className={`w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center rounded-lg font-bold touch-none ${
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
                      <div className="text-xl sm:text-3xl leading-none">
                        {letter}
                      </div>
                      <div className="text-[0.5rem] sm:text-[0.6rem]">
                        {LETTER_SCORES[letter]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {/* Top row: Conditional buttons based on game mode */}
              <div className="flex gap-2">
                {isSwapMode ? (
                  // Swap mode: Show Swap and Cancel/Pass buttons (Pass if in forceSwapPass mode)
                  <>
                    <button
                      onClick={swapTiles}
                      disabled={
                        currentPlayer !== "player" || selectedTiles.length === 0
                      }
                      className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm ${
                        currentPlayer !== "player" || selectedTiles.length === 0
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
                                if (
                                  !showCelebration &&
                                  placedTiles.some(
                                    (t) =>
                                      t.row === rowIndex && t.col === colIndex,
                                  )
                                ) {
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
                              onTouchEnd={handleTouchEnd}
                              className={`flex flex-col items-center justify-center leading-none touch-none ${
                                !showCelebration ? "cursor-move" : ""
                              }`}
                            >
                              <div className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-lg font-bold leading-none">
                                {cell.letter}
                              </div>
                              <div className="text-[0.2rem] sm:text-[0.25rem] md:text-[0.35rem] lg:text-[0.25rem] xl:text-[0.35rem]">
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
      </div>
    </div>
  );
};

export default WordGame;
