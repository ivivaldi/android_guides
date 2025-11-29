

export enum Gender {
  MALE = '남성',
  FEMALE = '여성'
}

export enum RiskLevel {
  CONSERVATIVE = '안정형',
  MODERATE = '중립형',
  AGGRESSIVE = '공격형',
  CUSTOM = '직접설정'
}

export interface Scenario {
  id: number;
  label: string;
  switchYear: number;
  returnRates: number[]; // Array of rates: [0-5y, 6-10y, 11y+]
  riskLevel: RiskLevel; // New field
}

export interface UserInput {
  nickname: string; // New: User Nickname
  gender: Gender;
  birthYear: number;
  workStartDate: string;
  currentMonthlyIncome: number; // In Man-won (10,000 KRW)
  retirementAge: number;
  lifeExpectancy: number; // New: Expected Life Expectancy
  expectedWageGrowthRate: number; // %
  currentEstimatedSeverance: number; // In Man-won
  otherAssets: number; // Financial assets
  managementFee: number; // %
  taxRate: number; // %
  
  // New Fields
  inflationRate: number; // %
  familySize: 2 | 3 | 4; // People
  
  scenarios: Scenario[];
}

export interface YearlyProjection {
  year: number;
  age: number;
  salary: number; 
  monthlyLivingCost: number; // New field for chart clarity
  livingCost: number; 
  investableSurplus: number; 
  dbValue: number; 
  scenario1Value: number;
  scenario2Value: number;
  scenario3Value: number;
  scenario4Value: number; 
}

export interface CalculationResult {
  projections: YearlyProjection[];
  summary: {
    finalYear: number;
    totalYearsWorked: number;
    finalSalary: number;
    finalDB: number;
    finalDBAfterTax: number;
    totalInvestedSurplus: number;
    postRetirementYears: number; // New
    scenarios: {
      id: number;
      label: string;
      finalAmount: number;
      finalAmountAfterTax: number;
      avgReturnRate: number;
      switchYear: number;
      riskLevel: RiskLevel;
      depletionAge: number | string; // New
    }[];
    bestOption: string;
  };
}