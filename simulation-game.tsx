'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Brain, Zap, Eye, Target, RotateCcw, Star } from 'lucide-react';
import type RunwayML from '@runwayml/sdk';
import { generateTransformPrompt, scorePromptGuess } from './lib/gradio';
import { UploadDropzone } from '@/lib/uploadthing';
import { toast } from 'sonner';
import { SoundToggle } from '@/components/sound-toggle';
import { ScoreCelebration } from '@/components/score-celebration';
import {
  soundManager,
  playClickSound,
  playUploadSound,
  playProcessSound,
  playCompleteSound,
  playSuccessSound,
  playRevealSound,
} from '@/lib/sounds';

interface GameState {
  phase: 'upload' | 'processing' | 'guessing' | 'result';
  originalImage: string | null;
  transformedImage: string | null;
  currentTransformation: string | null;
  guess: string;
  score: number;
  round: number;
  totalRounds: number;
  totalScore: number;
}

export default function SimulationGuessingGame() {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'upload',
    originalImage: null,
    transformedImage: null,
    currentTransformation: null,
    guess: '',
    score: 0,
    round: 1,
    totalRounds: 5,
    totalScore: 0,
  });

  const [processingProgress, setProcessingProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Preload sounds when component mounts
  useEffect(() => {
    soundManager.preloadSounds();
  }, []);

  // Simulate progress bar during processing
  useEffect(() => {
    if (gameState.phase === 'processing') {
      setProcessingProgress(0);
      const duration = 20516; // 20516ms as requested
      const intervalTime = 100; // Update every 100ms for smooth animation
      const increment = 100 / (duration / intervalTime);

      // Play processing sound
      playProcessSound();

      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + increment;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, intervalTime);

      return () => clearInterval(interval);
    }
  }, [gameState.phase]);

  // Play sound when processing completes
  useEffect(() => {
    if (processingProgress === 100 && gameState.phase === 'processing') {
      playCompleteSound();
    }
  }, [processingProgress, gameState.phase]);

  // Show celebration for high scores
  useEffect(() => {
    if (gameState.phase === 'result' && gameState.score >= 70) {
      setShowCelebration(true);
    }
  }, [gameState.phase, gameState.score]);

  const handleImageUpload = async (imageUrl: string) => {
    playUploadSound();

    const transformation = await generateTransformPrompt(imageUrl);
    // const transformation = 'transform the image to a 3D model that replaces the parts of the image that are not human';

    setGameState(prev => ({
      ...prev,
      originalImage: imageUrl,
      currentTransformation: transformation,
      phase: 'processing',
    }));

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          promptText: transformation,
          referenceImage: imageUrl,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate image');
      const data = (await response.json()) as RunwayML.TaskRetrieveResponse;
      const transformedImage = data.output?.[0];
      if (!transformedImage) throw new Error('Failed to generate image');
      playCompleteSound();
      setGameState(prev => ({
        ...prev,
        transformedImage,
        phase: 'guessing',
      }));
    } catch (error) {
      console.error('Error generating image:', error);
      setGameState(prev => ({
        ...prev,
        phase: 'upload',
        originalImage: null,
        currentTransformation: null,
      }));
    }
  };

  const submitGuess = async () => {
    if (!gameState.currentTransformation || !gameState.guess.trim()) return;

    playClickSound();

    const result = await scorePromptGuess({
      prompt: gameState.currentTransformation,
      guess: gameState.guess,
    });

    const score = result.score;
    if (score === null) {
      console.error('Failed to score guess');
      return;
    }

    // Play reveal sound
    playRevealSound();

    // If score is high (above 70), play success sound
    if (score > 70) {
      setTimeout(() => {
        playSuccessSound();
      }, 500); // Delay to avoid sound overlap
    }

    setGameState(prev => ({
      ...prev,
      phase: 'result',
      score: score,
      totalScore: prev.totalScore + score,
    }));
  };

  const nextRound = () => {
    playClickSound();
    setShowCelebration(false); // Hide celebration when moving to next round

    if (gameState.round >= gameState.totalRounds) {
      // Game over
      setGameState(prev => ({
        ...prev,
        phase: 'upload',
        round: 1,
        score: 0,
        totalScore: 0,
        originalImage: null,
        transformedImage: null,
        currentTransformation: null,
        guess: '',
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        phase: 'upload',
        round: prev.round + 1,
        originalImage: null,
        transformedImage: null,
        currentTransformation: null,
        guess: '',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 relative overflow-hidden">
      {/* Confetti Celebration */}
      <ScoreCelebration
        score={gameState.score}
        isVisible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-teal-500/20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <Brain className="text-teal-400 h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-white">Simulation Guesser</h1>
            </div>
            <div className="flex items-center gap-4">
              <SoundToggle />
              <div className="flex items-center gap-2">
                <Star className="text-yellow-400 h-5 w-5" />
                <span className="text-white font-semibold">{gameState.totalScore}</span>
              </div>
              <Badge variant="outline" className="text-white border-teal-400 bg-teal-500/10">
                Round {gameState.round}/{gameState.totalRounds}
              </Badge>
            </div>
          </div>
          <Progress
            value={((gameState.round - 1) / gameState.totalRounds) * 100}
            className="w-full mt-3 h-2"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-32 pb-8 px-4 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Upload Phase */}
          {gameState.phase === 'upload' && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/10 backdrop-blur-md border-teal-500/30 shadow-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-white text-xl">Upload Your Image</CardTitle>
                  <CardDescription className="text-teal-200">
                    Choose an image to transform with computational simulation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadDropzone
                    endpoint="imageUploader"
                    config={{ mode: 'auto' }}
                    onClientUploadComplete={res => {
                      console.log('Upload complete:', res);
                      if (res && res[0]) {
                        handleImageUpload(res[0].ufsUrl);
                      }
                    }}
                    onUploadError={(error: Error) => {
                      console.error('Upload error:', error);
                      toast.error('Upload failed', {
                        description: error.message,
                        duration: 5000,
                      });
                    }}
                    appearance={{
                      container: ({ isDragActive }) =>
                        `border-2 border-dashed transition-all duration-300 rounded-xl ${
                          isDragActive
                            ? 'border-teal-300 bg-teal-900/30 border-solid shadow-lg shadow-teal-500/20 scale-105'
                            : 'border-teal-400/50 bg-white/5 hover:bg-white/10 hover:border-teal-400'
                        }`,
                      uploadIcon: ({ isDragActive }) =>
                        `transition-all duration-300 ${isDragActive ? 'text-teal-300 scale-110' : 'text-teal-400'}`,
                      label: ({ isDragActive }) =>
                        `font-medium text-lg transition-all duration-300 ${
                          isDragActive ? 'text-teal-100 scale-105' : 'text-white'
                        }`,
                      allowedContent: ({ isDragActive }) =>
                        `text-sm mt-2 transition-colors duration-300 ${
                          isDragActive ? 'text-teal-200' : 'text-teal-200'
                        }`,
                      button:
                        'bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg ut-ready:bg-teal-600 ut-uploading:cursor-not-allowed ut-uploading:bg-teal-400',
                    }}
                    content={{
                      uploadIcon({ ready, isUploading }) {
                        if (isUploading)
                          return <Upload className="h-12 w-12 text-teal-400 animate-bounce" />;
                        if (ready) return <Upload className="h-12 w-12 text-teal-400" />;
                        return <Upload className="h-12 w-12 text-teal-400 animate-pulse" />;
                      },
                      label({ ready, isUploading }) {
                        if (isUploading) return 'Uploading...';
                        if (ready) return 'Drop your image or click to browse';
                        return 'Getting ready...';
                      },
                      allowedContent({ isUploading }) {
                        if (isUploading) return 'Processing your image...';
                        return 'Images up to 4MB • PNG, JPG, WEBP';
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Processing Phase */}
          {gameState.phase === 'processing' && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/10 backdrop-blur-md border-teal-500/30 shadow-2xl">
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={gameState.originalImage! || '/placeholder.svg'}
                        alt="Original"
                        className="w-64 h-64 object-cover rounded-xl border-2 border-teal-400/50 shadow-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-xl animate-pulse"></div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-6 rounded-xl border border-teal-400/30">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="text-teal-400 h-5 w-5 animate-pulse" />
                      <span className="text-white font-medium">
                        Processing transformation... {Math.round(processingProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-400 to-cyan-400 h-3 rounded-full transition-all duration-100 ease-out shadow-lg"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-teal-200 text-sm mt-3 text-center">
                      Applying: {gameState.currentTransformation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Combined Guessing Phase (viewing + guessing) */}
          {gameState.phase === 'guessing' && gameState.transformedImage && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/10 backdrop-blur-md border-teal-500/30 shadow-2xl">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-white flex items-center justify-center gap-4 text-3xl md:text-4xl font-extrabold">
                    <Eye className="text-teal-400 h-8 w-8 md:h-10 md:w-10" />
                    Spot the Sim!
                  </CardTitle>
                  <CardDescription className="text-cyan-200 text-lg mt-2 font-semibold">
                    Can you guess the transformation?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <Label className="text-white mb-3 block font-medium">Original</Label>
                      <img
                        src={gameState.originalImage!}
                        alt="Original"
                        className="w-full h-48 object-cover rounded-lg border-2 border-teal-400/50 shadow-lg transition-transform hover:scale-105"
                      />
                    </div>
                    <div className="text-center">
                      <Label className="text-white mb-3 block font-medium">Transformed</Label>
                      <img
                        src={gameState.transformedImage}
                        alt="Transformed"
                        className="w-full h-48 object-cover rounded-lg border-2 border-teal-400/50 shadow-lg transition-transform hover:scale-105"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="guess" className="text-white font-medium mb-3 block">
                      Your Guess
                    </Label>
                    <Textarea
                      id="guess"
                      placeholder="Describe what you think happened to the image..."
                      value={gameState.guess}
                      onChange={e => setGameState(prev => ({ ...prev, guess: e.target.value }))}
                      className="bg-white/10 border-teal-400/50 text-white placeholder:text-teal-200/70 focus:border-teal-400 focus:ring-teal-400/20 rounded-lg transition-all duration-300"
                      rows={4}
                      required={true}
                    />
                  </div>
                  <Button
                    onClick={submitGuess}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:scale-100 disabled:shadow-none"
                  >
                    Lock in your guess!
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Result Phase */}
          {gameState.phase === 'result' && gameState.currentTransformation && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/10 backdrop-blur-md border-teal-500/30 shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-white flex items-center justify-center gap-3">
                    <Brain className="text-teal-400 h-6 w-6" />
                    Transformation Revealed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 p-6 rounded-xl border border-teal-400/30">
                    <h3 className="text-white font-bold text-xl mb-2 text-center">
                      {gameState.currentTransformation}
                    </h3>
                  </div>

                  <div className="bg-white/5 p-6 rounded-xl border border-teal-400/30">
                    <h4 className="text-white font-semibold mb-3">Your Guess:</h4>
                    <p className="text-teal-200 italic">"{gameState.guess}"</p>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 p-6 rounded-xl border border-green-400/30 text-center">
                    <h4 className="text-white font-semibold mb-3">Score:</h4>
                    <div className="flex items-center justify-center gap-2">
                      <Star className="text-yellow-400 h-8 w-8" />
                      <span className="text-white text-3xl font-bold">{gameState.score}</span>
                      <span className="text-white/70 text-xl">/100</span>
                    </div>
                  </div>

                  <Button
                    onClick={nextRound}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    {gameState.round >= gameState.totalRounds ? (
                      <>
                        <RotateCcw className="mr-2 h-5 w-5" />
                        Play Again
                      </>
                    ) : (
                      'Next Round'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
