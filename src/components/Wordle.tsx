import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import type { Language } from '../App';
import './wordle.scss';

type gridKeyState = 'default' | 'correct' | 'present' | 'absent';

type gridKey = {
  letter: string;
  state: gridKeyState;
};

type gameState = 'playing' | 'won' | 'lost';

type cursorPosition = {
  row: number;
  col: number;
};

const INITIAL_GAME_STATE: gameState = 'playing';
const INITIAL_CURSOR_POSITION: cursorPosition = { row: 0, col: 0 };
const WORD_LENGTH = 5;

const KEYBOARD_LAYOUT = Object.freeze([
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
]);

const KEYBOARD_LAYOUT_IRISH = Object.freeze([
  ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú'],
  ['B', 'C', 'D', 'F', 'G', 'H', 'K', 'L', 'M', 'N'],
  ['ENTER', 'P', 'R', 'S', 'T', 'V', 'Backspace'],
]);

export type WordleProps = {
  wordToGuess: string;
  WORD_LIST: readonly string[];
  language: Language;
  maxGuesses?: number;
  resetGame: () => void;
  WORD_LIST_WITH_MEANING?: readonly { word: string; meaning: string }[];
};

export default function Wordle({
  wordToGuess,
  WORD_LIST,
  language,
  WORD_LIST_WITH_MEANING,
  maxGuesses = 6,
  resetGame,
}: WordleProps) {
  const [gridState, setGridState] = useState<gridKey[][]>(
    Array.from({ length: maxGuesses }, () =>
      Array(WORD_LENGTH).fill({ letter: '', state: 'default' })
    )
  );

  const [gameState, setGameState] = useState<gameState>(INITIAL_GAME_STATE);

  const keyboardLayout =
    language === 'EN' ? KEYBOARD_LAYOUT : KEYBOARD_LAYOUT_IRISH;

  const getInitialKeyboardState = useCallback(() => {
    const initialState: Record<string, gridKeyState> = {};
    keyboardLayout.flat().forEach((key) => {
      if (key !== 'ENTER' && key !== 'Backspace') {
        initialState[key] = 'default';
      }
    });
    return initialState;
  }, [keyboardLayout]);

  const [keyboardLettersState, setKeyboardLettersState] = useState<
    Record<string, gridKeyState>
  >(getInitialKeyboardState());

  const [cursorPosition, setCursorPosition] = useState<cursorPosition>(
    INITIAL_CURSOR_POSITION
  );

  const addLetterToGrid = useCallback(
    (letter: string) => {
      if (cursorPosition.col >= WORD_LENGTH) return;
      const key = letter.toUpperCase();
      const newGridState = [...gridState];
      newGridState[cursorPosition.row][cursorPosition.col] = {
        letter: key,
        state: 'default',
      };
      setGridState(newGridState);
      setCursorPosition({
        row: cursorPosition.row,
        col: cursorPosition.col + 1,
      });
    },
    [cursorPosition, gridState]
  );

  const deleteLetterFromGrid = useCallback(() => {
    if (cursorPosition.col <= 0) return;
    const newGridState = [...gridState];
    newGridState[cursorPosition.row][cursorPosition.col - 1] = {
      letter: '',
      state: 'default',
    };
    setGridState(newGridState);
    setCursorPosition({
      row: cursorPosition.row,
      col: cursorPosition.col - 1,
    });
  }, [cursorPosition, gridState]);

  const checkGuess = useCallback(
    (guess: string) => {
      if (cursorPosition.col !== WORD_LENGTH) return;

      const newGridState = [...gridState];
      const newKeyboardLettersState = { ...keyboardLettersState };
      const wordLetters = wordToGuess.split('');
      const guessLetters = guess.split('');

      // First pass: check for correct letters
      guessLetters.forEach((letter, index) => {
        if (letter === wordLetters[index]) {
          newGridState[cursorPosition.row][index].state = 'correct';
          newKeyboardLettersState[letter] = 'correct';
          wordLetters[index] = ''; // Remove matched letter
        }
      });

      // Check for win condition
      if (
        newGridState[cursorPosition.row].every((key) => key.state === 'correct')
      ) {
        setGameState('won');
        setGridState(newGridState);
        return;
      }

      // Second pass: check for present letters
      guessLetters.forEach((letter, index) => {
        if (newGridState[cursorPosition.row][index].state === 'default') {
          const foundIndex = wordLetters.indexOf(letter);
          if (foundIndex !== -1) {
            newGridState[cursorPosition.row][index].state = 'present';
            if (newKeyboardLettersState[letter] !== 'correct') {
              newKeyboardLettersState[letter] = 'present';
            }
            wordLetters[foundIndex] = ''; // Remove matched letter
          } else {
            newGridState[cursorPosition.row][index].state = 'absent';
            if (
              newKeyboardLettersState[letter] !== 'correct' &&
              newKeyboardLettersState[letter] !== 'present'
            ) {
              newKeyboardLettersState[letter] = 'absent';
            }
          }
        }
      });

      // Check for loss condition
      if (cursorPosition.row === maxGuesses - 1) {
        setGameState('lost');
      }

      setGridState(newGridState);
      setKeyboardLettersState(newKeyboardLettersState);
    },
    [wordToGuess, maxGuesses, cursorPosition, gridState, keyboardLettersState]
  );

  const handleKeyPress = useCallback(
    (key: string) => {
      console.log('Pressed key:', key);
      if (gameState !== 'playing') return;
      if (key.toUpperCase() === 'BACKSPACE') {
        deleteLetterFromGrid();
        return;
      }
      if (key.toUpperCase() === 'ENTER') {
        if (cursorPosition.col !== WORD_LENGTH) return;
        const guess = gridState[cursorPosition.row]
          .map((key) => key.letter)
          .join('');

        // Check guess against word list
        if (WORD_LIST && !WORD_LIST.includes(guess.toLocaleLowerCase())) {
          alert(`❎ ${guess} is not in the word list! 😜`);
          return;
        }

        checkGuess(guess.toLocaleLowerCase());
        setCursorPosition({ row: cursorPosition.row + 1, col: 0 });
        return;
      }
      if (keyboardLayout.flat().includes(key.toUpperCase())) {
        addLetterToGrid(key);
        return;
      }
    },
    [
      WORD_LIST,
      cursorPosition,
      gameState,
      gridState,
      keyboardLayout,
      addLetterToGrid,
      deleteLetterFromGrid,
      checkGuess,
    ]
  );

  useEffect(() => {
    const handlePhysicalKeyPress = (e: KeyboardEvent) => {
      // Ignore enter & backspace events not triggered on the page level
      // as there could be lower level elements handling them
      if (
        e.target !== document.body &&
        (e.key === 'Enter' || e.key === 'Backspace')
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      handleKeyPress(key);
    };
    window.addEventListener('keydown', handlePhysicalKeyPress);
    return () => {
      window.removeEventListener('keydown', handlePhysicalKeyPress);
    };
  }, [handleKeyPress]);

  const wordMeaning = WORD_LIST_WITH_MEANING?.find(
    (entry) => entry.word === wordToGuess
  )?.meaning;

  return (
    <article className='wordle'>
      <div className='wordle__status'>
        {/* <p className='wordle__status__message'>Word: {wordToGuess}</p> */}
        {gameState === 'won' && (
          <>
            <p className='wordle__status__message'>
              Congratulations 🎉! You won!
            </p>
            {wordMeaning && (
              <p className='wordle__status__message'>
                The word {wordToGuess} means: {wordMeaning} 😎
              </p>
            )}
          </>
        )}
        {gameState === 'lost' && (
          <p className='wordle__status__message'>
            Game Over 😜! The word was: {wordToGuess.toLocaleUpperCase()}
            {wordMeaning && (
              <>
                <br />
                which means: {wordMeaning} 😎
              </>
            )}
          </p>
        )}
        {gameState !== 'playing' && (
          <button
            className='wordle__status__resetBtn'
            onClick={resetGame}
          >
            Play Again
          </button>
        )}
      </div>
      <div
        className='wordle__grid'
        data-rows={maxGuesses}
        data-cols={WORD_LENGTH}
        style={
          {
            '--number-of-rows': maxGuesses,
            '--number-of-columns': WORD_LENGTH,
          } as React.CSSProperties
        }
      >
        {gridState.map((row, rowIndex) =>
          row.map((col, colIndex) => (
            <div
              className={`wordle__grid__key wordle__grid__key--${col.state}`}
              key={`${rowIndex}-${colIndex}`}
              data-cell-index={`${rowIndex}-${colIndex}`}
              style={{
                transitionDelay: `${colIndex * 0.05}s`,
              }}
            >
              <span>{col.letter}</span>
            </div>
          ))
        )}
      </div>
      <div className='wordle__keyboard'>
        {keyboardLayout.map((row, rowIndex) => (
          <div
            className='wordle__keyboard__row'
            key={`keyboard-row-${rowIndex}`}
          >
            {row.map((key) => (
              <button
                key={`keyboard-key-${key}`}
                className={clsx(
                  'wordle__keyboard__key',
                  `wordle__keyboard__key--${
                    keyboardLettersState[key] || 'default'
                  }`,
                  { 'wordle__keyboard__key--backspace': key === 'Backspace' },
                  { 'wordle__keyboard__key--enter': key === 'ENTER' }
                )}
                onClick={() => handleKeyPress(key)}
              >
                {key === 'Backspace' ? '⌫' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </article>
  );
}
