import React, { useState, useEffect, useCallback } from 'react';
import { AppRoot, List, Button, ModalRoot, ModalPage, ModalPageHeader, PanelHeaderButton, FormLayout, FormItem, Input } from '@telegram-apps/telegram-ui';
import { Icon24Cancel } from '@vkontakte/icons';

interface Bubble {
  id: number;
  x: number;
  y: number;
  type: 'blue' | 'red';
  speed: number;
}

interface GameState {
  score: number;
  lives: number;
  level: number;
  isPlaying: boolean;
  bubbles: Bubble[];
}

const INITIAL_STATE: GameState = {
  score: 0,
  lives: 3,
  level: 1,
  isPlaying: false,
  bubbles: [],
};

export const GameSection: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [showGameOver, setShowGameOver] = useState(false);

  const spawnBubble = useCallback(() => {
    const isRed = Math.random() < 0.2 + (gameState.level * 0.05);
    const newBubble: Bubble = {
      id: Date.now(),
      x: Math.random() * 80 + 10, // Random x position (10-90%)
      y: -10, // Start above screen
      type: isRed ? 'red' : 'blue',
      speed: 1 + (gameState.level * 0.5), // Speed increases with level
    };

    setGameState(prev => ({
      ...prev,
      bubbles: [...prev.bubbles, newBubble],
    }));
  }, [gameState.level]);

  const handleBubbleClick = (bubble: Bubble) => {
    if (bubble.type === 'red') {
      setShowGameOver(true);
      setGameState(prev => ({ ...prev, isPlaying: false }));
      return;
    }

    // Blue bubble popped
    setGameState(prev => ({
      ...prev,
      score: prev.score + 1,
      bubbles: prev.bubbles.filter(b => b.id !== bubble.id),
    }));
  };

  const updateBubbles = useCallback(() => {
    setGameState(prev => {
      const updatedBubbles = prev.bubbles
        .map(bubble => ({
          ...bubble,
          y: bubble.y + bubble.speed,
        }))
        .filter(bubble => bubble.y < 100); // Remove bubbles that fall off screen

      // Check for missed blue bubbles
      const missedBlueBubbles = prev.bubbles.filter(
        bubble => bubble.type === 'blue' && bubble.y >= 100
      );

      const newLives = prev.lives - missedBlueBubbles.length;

      if (newLives <= 0) {
        setShowGameOver(true);
        return { ...prev, isPlaying: false, lives: 0 };
      }

      return {
        ...prev,
        bubbles: updatedBubbles,
        lives: newLives,
      };
    });
  }, []);

  useEffect(() => {
    if (!gameState.isPlaying) return;

    const gameLoop = setInterval(() => {
      updateBubbles();
      if (Math.random() < 0.1 + (gameState.level * 0.02)) {
        spawnBubble();
      }
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameState.isPlaying, updateBubbles, spawnBubble]);

  const startGame = () => {
    setGameState(INITIAL_STATE);
    setShowGameOver(false);
    setGameState(prev => ({ ...prev, isPlaying: true }));
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-100 to-blue-200 overflow-hidden">
      {/* Game Stats */}
      <div className="absolute top-4 left-4 z-10 bg-white/80 p-2 rounded-lg shadow-lg">
        <div>Score: {gameState.score}</div>
        <div>Lives: {gameState.lives}</div>
        <div>Level: {gameState.level}</div>
      </div>

      {/* Game Area */}
      <div className="w-full h-full relative">
        {gameState.bubbles.map(bubble => (
          <div
            key={bubble.id}
            className={`absolute w-12 h-12 rounded-full cursor-pointer transition-transform
              ${bubble.type === 'blue' ? 'bg-blue-500' : 'bg-red-500'}
              hover:scale-110`}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
            }}
            onClick={() => handleBubbleClick(bubble)}
          />
        ))}
      </div>

      {/* Game Over Modal */}
      <ModalRoot activeModal={showGameOver ? 'gameOver' : null}>
        <ModalPage
          id="gameOver"
          header={
            <ModalPageHeader
              right={
                <PanelHeaderButton onClick={() => setShowGameOver(false)}>
                  <Icon24Cancel />
                </PanelHeaderButton>
              }
            >
              Game Over
            </ModalPageHeader>
          }
        >
          <FormLayout>
            <FormItem>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
                <p className="text-xl mb-4">Final Score: {gameState.score}</p>
                <Button size="l" onClick={startGame}>
                  Play Again
                </Button>
              </div>
            </FormItem>
          </FormLayout>
        </ModalPage>
      </ModalRoot>

      {/* Start Game Button */}
      {!gameState.isPlaying && !showGameOver && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button size="l" onClick={startGame}>
            Start Game
          </Button>
        </div>
      )}
    </div>
  );
}; 