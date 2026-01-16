import { useRef, useState } from 'react';
import Wordle from './components/Wordle';
import { WORDS_LIST } from './data/words';
import {
  WORDS_LIST_IRISH,
  WORDS_LIST_IRISH_WITH_MEANING,
} from './data/words_irish';
import './App.css';

export type Language = 'EN' | 'IR';

const getWordOfTheDay = (language: Language) => {
  if (language === 'EN') {
    return WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)];
  } else {
    return WORDS_LIST_IRISH[
      Math.floor(Math.random() * WORDS_LIST_IRISH.length)
    ];
  }
};

function App() {
  const [language, setLanguage] = useState<Language>('EN');
  const [gameKey, setGameKey] = useState(0);
  const resetBtnRef = useRef<HTMLButtonElement>(null);
  const switchBtnRef = useRef<HTMLButtonElement>(null);

  const resetGame = () => {
    setGameKey((prevKey) => prevKey + 1);
    resetBtnRef.current?.blur();
  };

  const onSwitchLanguage = () => {
    setLanguage((currentLanguage) => (currentLanguage === 'EN' ? 'IR' : 'EN'));
    resetGame();
    switchBtnRef.current?.blur();
  };

  return (
    <section className='app'>
      <h1>{language === 'EN' ? 'Wordle' : 'Focail'}</h1>
      <div className='buttonsContainer'>
        <button
          ref={resetBtnRef}
          onClick={resetGame}
        >
          Reset Game
        </button>
        <button
          ref={switchBtnRef}
          onClick={onSwitchLanguage}
        >
          Switch to {language === 'EN' ? 'Irish' : 'English'}
        </button>
      </div>
      <Wordle
        key={gameKey}
        wordToGuess={getWordOfTheDay(language)}
        language={language}
        WORD_LIST={language === 'EN' ? WORDS_LIST : WORDS_LIST_IRISH}
        WORD_LIST_WITH_MEANING={
          language === 'EN' ? undefined : WORDS_LIST_IRISH_WITH_MEANING
        }
        resetGame={resetGame}
        maxGuesses={6}
      />
    </section>
  );
}

export default App;
