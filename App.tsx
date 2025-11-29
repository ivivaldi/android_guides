import React, { useState, useMemo, useEffect } from 'react';
import { UserInput, Gender, RiskLevel } from './types';
import { InputForm } from './components/InputForm';
import { ResultView } from './components/ResultView';
import { AdBanner } from './components/AdBanner';
import { calculateProjections } from './services/calculationService';

// Weather code mapping to Tailwind gradients
const getWeatherGradient = (code: number): string => {
  // WMO Weather interpretation codes (Open-Meteo)
  // 0: Clear sky
  if (code === 0) return 'from-blue-400 to-blue-200';
  // 1, 2, 3: Mainly clear, partly cloudy, and overcast
  if (code <= 3) return 'from-blue-300 to-gray-300';
  // 45, 48: Fog
  if (code <= 48) return 'from-gray-400 to-gray-200';
  // 51-67: Drizzle, Rain
  if (code <= 67) return 'from-slate-700 to-slate-500';
  // 71-77: Snow
  if (code <= 77) return 'from-sky-200 to-white';
  // 80-82: Rain showers
  if (code <= 82) return 'from-indigo-400 to-blue-300';
  // 95-99: Thunderstorm
  if (code <= 99) return 'from-indigo-900 to-purple-800';
  
  // Default (Sunny/Nice)
  return 'from-cyan-500 to-blue-500';
};

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [step, setStep] = useState<'INPUT' | 'RESULT'>('INPUT');
  const [bgGradient, setBgGradient] = useState<string>('from-cyan-500 to-blue-500'); // Default
  const [weatherDescription, setWeatherDescription] = useState<string>('날씨 확인 중...');

  // Weather Fetching Logic
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
            );
            const data = await response.json();
            const code = data.current_weather?.weathercode;
            
            if (code !== undefined) {
              setBgGradient(getWeatherGradient(code));
              setWeatherDescription('현재 계신 곳의 날씨를 배경에 담았어요 ⛅');
            }
          } catch (error) {
            console.error("Weather fetch failed", error);
          }
        },
        (error) => {
          console.warn("Geolocation permission denied or error", error);
        }
      );
    }
  }, []);
  
  // Initialize state
  const [userInput, setUserInput] = useState<UserInput>(() => {
    // Default Initial State
    const defaultState: UserInput = {
      nickname: '',
      gender: Gender.MALE,
      birthYear: 1990,
      workStartDate: '2018-01-01',
      currentMonthlyIncome: 450, // 만원
      retirementAge: 60,
      lifeExpectancy: 100, 
      expectedWageGrowthRate: 3.5, // Updated to 3.5% based on Labor Ministry averages
      currentEstimatedSeverance: 0,
      otherAssets: 0,
      managementFee: 0.5, 
      taxRate: 3.3,
      
      inflationRate: 2.5,
      familySize: 3,

      scenarios: [
        { id: 1, label: '즉시 전환', switchYear: currentYear, returnRates: [5, 5, 5], riskLevel: RiskLevel.CONSERVATIVE },
        { id: 2, label: '5년 후 전환', switchYear: currentYear + 5, returnRates: [5, 5, 5], riskLevel: RiskLevel.CONSERVATIVE },
        { id: 3, label: '10년 후 전환', switchYear: currentYear + 10, returnRates: [7, 7, 7], riskLevel: RiskLevel.MODERATE }, 
        { id: 4, label: '15년 후 전환', switchYear: currentYear + 15, returnRates: [7, 7, 7], riskLevel: RiskLevel.MODERATE }, 
      ]
    };

    // Check for share parameter in URL
    if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const shareData = searchParams.get('share');
        if (shareData) {
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(shareData)));
                // Merge to ensure structure is valid
                return { ...defaultState, ...decoded };
            } catch (e) {
                console.error("Failed to parse shared data", e);
            }
        }
    }

    return defaultState;
  });

  // Check if we loaded shared data to auto-calculate
  useEffect(() => {
     const searchParams = new URLSearchParams(window.location.search);
     if (searchParams.get('share')) {
         setStep('RESULT');
     }
  }, []);

  // Calculate automatically whenever userInput changes
  const result = useMemo(() => calculateProjections(userInput), [userInput]);

  const handleCalculate = () => {
    setStep('RESULT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setStep('INPUT');
    // Clear URL query param without refreshing
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('pensionCalcSettings', JSON.stringify(userInput));
      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleLoad = () => {
    try {
      const saved = localStorage.getItem('pensionCalcSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserInput(parsed);
        alert('설정을 불러왔습니다.');
      } else {
        alert('저장된 설정이 없습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('설정을 불러오는 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} flex flex-col items-center py-8 px-3 md:px-6 font-sans transition-all duration-1000`}>
      <header className="mb-6 text-center max-w-md w-full bg-white/20 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/30">
        <h1 className="text-4xl font-extrabold text-white mb-1 tracking-tight drop-shadow-md">DC 언제 해요</h1>
        <p className="text-indigo-50 text-xs font-medium bg-black/10 inline-block px-3 py-1 rounded-full">
            물가인상률과 노년의료비를 반영한 은퇴 자산 계산기
        </p>
        <p className="text-[10px] text-white/70 mt-2">{weatherDescription}</p>
      </header>

      <main className="w-full max-w-4xl">
        {step === 'INPUT' ? (
          <InputForm 
            input={userInput} 
            onChange={setUserInput} 
            onCalculate={handleCalculate} 
            onSave={handleSave}
            onLoad={handleLoad}
          />
        ) : (
          <ResultView 
            result={result} 
            input={userInput} 
            onReset={handleReset}
            onInputChange={setUserInput} 
          />
        )}
      </main>

      <footer className="mt-12 text-center text-white/60 text-xs pb-6 w-full max-w-4xl">
        {/* Main Footer Ad Slot */}
        <div className="mb-6">
           <AdBanner className="h-24 bg-white/10 rounded-xl" />
        </div>
        
        <p>© {new Date().getFullYear()} Pension Strategy Calc. Not Financial Advice.</p>
        <p className="mt-1">Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;