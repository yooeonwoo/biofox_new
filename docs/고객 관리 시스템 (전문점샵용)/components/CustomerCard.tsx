import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';

interface CustomerData {
  name: string;
  contractDate: string;
  manager: string;
}

interface CustomerCardProps {
  customer: CustomerData;
  cardNumber: number;
}

export function CustomerCard({ customer, cardNumber }: CustomerCardProps) {
  const [activeButtons, setActiveButtons] = useState<Record<string, string>>({});
  const [progressValues, setProgressValues] = useState<Record<string, number>>({
    personal: 5,
  });
  const [customerProgress, setCustomerProgress] = useState<Record<string, number[]>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({});
  
  // 성취도 체크박스 상태 관리
  const [achievements, setAchievements] = useState<Record<string, boolean>>({
    'basic-training': false,     // 본사 실무교육 이수 (1단계)
    'standard-protocol': false, // 본사 표준 프로토콜을 잘 따르는가 (2단계)
    'expert-course': false,     // 본사 전문가 과정을 모두 이수하였는가 (3단계)
  });
  
  // 섹션별 메모 상태 관리
  const [sectionMemos, setSectionMemos] = useState<Record<string, string>>({});
  const [openMemoSections, setOpenMemoSections] = useState<Record<string, boolean>>({});

  // 각 강의별 진행률 상태 (강의명: 현재 진행도)
  const [learningProgress, setLearningProgress] = useState<Record<string, number>>({
    '홍조': 0,
    '기미': 0,
    '브리핑': 0,
    '여드름': 0,
  });

  // 평가 점수 상태
  const [evaluationScores, setEvaluationScores] = useState<Record<string, number>>({
    '모의 테스트': 0,
    '평가 테스트': 0,
    '튜터링': 0,
  });

  // 12개월 매출 데이터 (단위: 만원)
  const [salesData] = useState<number[]>([
    320, 280, 450, 380, 520, 480, 610, 580, 530, 620, 580, 650
  ]);

  // 각 강의별 최대 진행도
  const learningMaxProgress = {
    '홍조': 8,
    '기미': 12,
    '브리핑': 6,
    '여드름': 8,
  };

  // 섹션별 메모 배경색 정의
  const getMemoBackgroundColor = (sectionId: string) => {
    const colorMap: Record<string, string> = {
      'delivery': 'bg-orange-50',
      'education-notes': 'bg-purple-50',
      'growth': 'bg-pink-50',
      'expert': 'bg-cyan-50',
    };
    return colorMap[sectionId] || 'bg-gray-50';
  };

  // 성취도 체크박스 계층적 핸들러
  const handleAchievementChange = (achievementKey: string, checked: boolean) => {
    setAchievements(prev => {
      const newAchievements = { ...prev };
      
      if (checked) {
        // 체크할 때: 해당 단계와 모든 하위 단계를 체크
        switch (achievementKey) {
          case 'expert-course': // 3단계
            newAchievements['expert-course'] = true;
            newAchievements['standard-protocol'] = true;
            newAchievements['basic-training'] = true;
            break;
          case 'standard-protocol': // 2단계
            newAchievements['standard-protocol'] = true;
            newAchievements['basic-training'] = true;
            break;
          case 'basic-training': // 1단계
            newAchievements['basic-training'] = true;
            break;
        }
      } else {
        // 해제할 때: 해당 단계와 모든 상위 단계를 해제
        switch (achievementKey) {
          case 'basic-training': // 1단계
            newAchievements['basic-training'] = false;
            newAchievements['standard-protocol'] = false;
            newAchievements['expert-course'] = false;
            break;
          case 'standard-protocol': // 2단계
            newAchievements['standard-protocol'] = false;
            newAchievements['expert-course'] = false;
            break;
          case 'expert-course': // 3단계
            newAchievements['expert-course'] = false;
            break;
        }
      }
      
      return newAchievements;
    });
  };

  // 현재 달성한 최고 단계 계산
  const getHighestAchievement = () => {
    if (achievements['expert-course']) return 3;
    if (achievements['standard-protocol']) return 2;
    if (achievements['basic-training']) return 1;
    return 0;
  };

  // 메모 관련 핸들러
  const handleMemoToggle = (sectionId: string) => {
    setOpenMemoSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleMemoChange = (sectionId: string, value: string) => {
    setSectionMemos(prev => ({
      ...prev,
      [sectionId]: value
    }));
  };

  // 전체 학습 진도 계산
  const totalLearningProgress = useMemo(() => {
    const currentTotal = Object.values(learningProgress).reduce((sum, current) => sum + current, 0);
    const maxTotal = Object.values(learningMaxProgress).reduce((sum, max) => sum + max, 0);
    const percentage = maxTotal > 0 ? (currentTotal / maxTotal) * 100 : 0;
    return { currentTotal, maxTotal, percentage };
  }, [learningProgress]);

  // 평균 점수 계산
  const averageScore = useMemo(() => {
    const scores = Object.values(evaluationScores);
    const validScores = scores.filter(score => score > 0);
    if (validScores.length === 0) return 0;
    return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
  }, [evaluationScores]);

  // 매출 데이터 계산
  const salesAnalysis = useMemo(() => {
    const average = Math.round(salesData.reduce((sum, value) => sum + value, 0) / salesData.length);
    const lastMonth = salesData[salesData.length - 1];
    const previousMonth = salesData[salesData.length - 2];
    const maxValue = Math.max(...salesData);
    const minValue = Math.min(...salesData);
    
    // 전월 대비 증감률 계산
    const monthlyChangePercent = previousMonth > 0 
      ? Math.round(((lastMonth - previousMonth) / previousMonth) * 100)
      : 0;
    
    // 평균 대비 전월 매출 비교
    const averageChangePercent = average > 0 
      ? Math.round(((lastMonth - average) / average) * 100)
      : 0;
    
    return { 
      average, 
      lastMonth, 
      maxValue, 
      minValue, 
      monthlyChangePercent,
      averageChangePercent,
      isMonthlyPositive: monthlyChangePercent >= 0,
      isAveragePositive: averageChangePercent >= 0
    };
  }, [salesData]);

  // 영역 그래프를 위한 SVG 경로 생성
  const generateAreaPath = (data: number[], width: number, height: number) => {
    const max = salesAnalysis.maxValue;
    const step = width / (data.length - 1);
    
    let path = `M 0 ${height}`;
    
    data.forEach((value, index) => {
      const x = index * step;
      const y = height - (value / max) * height;
      if (index === 0) {
        path += ` L 0 ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    path += ` L ${width} ${height} Z`;
    return path;
  };

  // 토글 기능이 있는 버튼 클릭 핸들러
  const handleButtonClick = (section: string, value: string) => {
    setActiveButtons(prev => {
      // 같은 버튼을 다시 클릭하면 해제
      if (prev[section] === value) {
        const newState = { ...prev };
        delete newState[section];
        return newState;
      }
      // 다른 버튼을 클릭하면 선택
      return { ...prev, [section]: value };
    });
  };

  const handleProgressClick = (type: string, index: number) => {
    setProgressValues({ ...progressValues, [type]: index + 1 });
  };

  const handleCustomerProgressClick = (customerIndex: number, progressIndex: number) => {
    const key = `customer-${customerIndex}`;
    const current = customerProgress[key] || [];
    const newProgress = current.includes(progressIndex) 
      ? current.filter(p => p !== progressIndex)
      : [...current, progressIndex];
    setCustomerProgress({ ...customerProgress, [key]: newProgress });
  };

  const handleLearningProgressClick = (subject: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const clickRatio = clickX / width;
    const maxProgress = learningMaxProgress[subject];
    const newProgress = Math.max(0, Math.min(maxProgress, Math.round(clickRatio * maxProgress)));
    
    setLearningProgress(prev => ({
      ...prev,
      [subject]: newProgress
    }));
  };

  const handleScoreChange = (evalType: string, value: string) => {
    const score = parseInt(value) || 0;
    const clampedScore = Math.max(0, Math.min(100, score)); // 0-100 범위로 제한
    setEvaluationScores(prev => ({
      ...prev,
      [evalType]: clampedScore
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setCheckboxes({ ...checkboxes, [field]: checked });
  };

  // 본사 실무교육 신청하기 버튼 클릭 핸들러
  const handleTrainingApplication = () => {
    // 교육 신청 로직 구현
    console.log('본사 실무교육 신청하기');
    // 여기에 실제 API 호출이나 다른 로직을 추가할 수 있습니다
  };

  return (
    <div className="bg-white border-2 border-black rounded-xl p-4 mb-5 max-w-md mx-auto relative">
      {/* Header Section */}
      <div className="mb-4 p-3 border border-gray-300 rounded-lg bg-gray-50 relative z-10">
        <div className="mb-3">
          {/* 카드 번호와 고객 이름, 담당자/계약일 정보를 같은 행에 배치 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold shadow-lg">
                {cardNumber}
              </div>
              <div className="flex items-center gap-1">
                <h2 className="text-lg">{customer.name}</h2>
                {/* 성취도에 따른 별 표시 - 달성한 최고 단계만큼 별 표시 */}
                {Array.from({ length: getHighestAchievement() }, (_, index) => (
                  <span key={index} className="text-yellow-500">⭐</span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm h-7 flex items-center justify-end p-1">
                <span className="text-gray-600">담당자 : </span>
                <span>{formData['manager'] || customer.manager}</span>
              </div>
              <div className="text-xs text-gray-500 opacity-75 mt-1 text-right">
                <span>계약일 : </span>
                <span>{formData['contractDate'] || customer.contractDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Block 1: Section 1 (설치/교육) */}
      <div className="relative mb-6 p-4 rounded-xl bg-slate-100 border border-slate-300 overflow-hidden">
        {/* 배경 별 이모지 */}
        <div className="absolute top-4 right-4 text-6xl opacity-10 pointer-events-none select-none">
          ⭐
        </div>
        
        {/* Section 1: 설치/교육 */}
        <CustomerSection 
          number="1" 
          title="설치/교육"
          sectionId="delivery"
          memo={sectionMemos['delivery'] || ''}
          isMemoOpen={openMemoSections['delivery'] || false}
          onMemoToggle={() => handleMemoToggle('delivery')}
          onMemoChange={(value) => handleMemoChange('delivery', value)}
          getMemoBackgroundColor={getMemoBackgroundColor}
        >
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm space-y-3">
            {/* 설치 교육 날짜 */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 min-w-[80px]">설치 교육 :</label>
              <Input 
                className="flex-1 text-sm h-9"
                placeholder="날짜를 입력하세요"
                value={formData['install-education-date'] || ''}
                onChange={(e) => handleInputChange('install-education-date', e.target.value)}
              />
            </div>

            {/* 설치 담당자 */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 min-w-[80px]">설치 담당자 :</label>
              <Input 
                className="flex-1 text-sm h-9"
                placeholder="담당자명을 입력하세요"
                value={formData['install-manager'] || ''}
                onChange={(e) => handleInputChange('install-manager', e.target.value)}
              />
            </div>
            
            {/* 연락처 */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 min-w-[80px]">연락처 :</label>
              <Input 
                className="flex-1 text-sm h-9"
                placeholder="연락처를 입력하세요"
                value={formData['install-contact'] || ''}
                onChange={(e) => handleInputChange('install-contact', e.target.value)}
              />
            </div>
          </div>
        </CustomerSection>

        {/* Section 2: 자가 평가 */}
        <CustomerSection 
          number="2" 
          title="자가 평가"
          sectionId="education-notes"
          memo={sectionMemos['education-notes'] || ''}
          isMemoOpen={openMemoSections['education-notes'] || false}
          onMemoToggle={() => handleMemoToggle('education-notes')}
          onMemoChange={(value) => handleMemoChange('education-notes', value)}
          getMemoBackgroundColor={getMemoBackgroundColor}
        >
          <div className="border border-gray-400 rounded-md p-3 text-xs space-y-3">
            {/* 질문 1: 플레이스 세팅 */}
            <div className="flex justify-between items-center">
              <span className="text-left">1. 플레이스는 세팅하였는가?</span>
              <div className="flex gap-1">
                {['상', '중', '하'].map((level) => (
                  <Button
                    key={`place-setting-${level}`}
                    variant={activeButtons['place-setting'] === level ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 w-8"
                    onClick={() => handleButtonClick('place-setting', level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 질문 2: 인스타 세팅 */}
            <div className="flex justify-between items-center">
              <span className="text-left">2. 인스타는 세팅하였는가?</span>
              <div className="flex gap-1">
                {['상', '중', '하'].map((level) => (
                  <Button
                    key={`insta-setting-${level}`}
                    variant={activeButtons['insta-setting'] === level ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 w-8"
                    onClick={() => handleButtonClick('insta-setting', level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 질문 3: 프로토콜 준수 */}
            <div className="flex justify-between items-center">
              <span className="text-left">3. 정품 및 정량 프로토콜대로 시행하고 있는가?</span>
              <div className="flex gap-1">
                {['상', '중', '하'].map((level) => (
                  <Button
                    key={`protocol-compliance-${level}`}
                    variant={activeButtons['protocol-compliance'] === level ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 w-8"
                    onClick={() => handleButtonClick('protocol-compliance', level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* 질문 4: 상품 진열 */}
            <div className="flex justify-between items-center">
              <span className="text-left">4. 상품 진열이 잘 되어있는가?</span>
              <div className="flex gap-1">
                {['상', '중', '하'].map((level) => (
                  <Button
                    key={`product-display-${level}`}
                    variant={activeButtons['product-display'] === level ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 w-8"
                    onClick={() => handleButtonClick('product-display', level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CustomerSection>
        
        {/* 본사 실무교육 신청하기 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox 
                id={`training-application-${cardNumber}`}
                checked={checkboxes['training-application'] || false}
                onCheckedChange={(checked) => handleCheckboxChange('training-application', !!checked)}
                className="w-5 h-5"
              />
              <label 
                htmlFor={`training-application-${cardNumber}`} 
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                본사 실무교육 신청하기
              </label>
            </div>
            
            <Button
              onClick={handleTrainingApplication}
              variant="default"
              size="sm"
              className="text-xs h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              신청
            </Button>
          </div>
        </div>
      </div>

      {/* Block 2: Section 3 (성장 과정) */}
      <div className="relative mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 overflow-hidden">
        {/* 배경 별 이모지 */}
        <div className="absolute top-4 right-4 text-4xl opacity-10 pointer-events-none select-none flex gap-2">
          <span>⭐</span>
          <span>⭐</span>
        </div>
        
        <CustomerSection 
          number="3" 
          title="성장"
          sectionId="growth"
          memo={sectionMemos['growth'] || ''}
          isMemoOpen={openMemoSections['growth'] || false}
          onMemoToggle={() => handleMemoToggle('growth')}
          onMemoChange={(value) => handleMemoChange('growth', value)}
          getMemoBackgroundColor={getMemoBackgroundColor}
        >
          {/* 임상 */}
          <div className="mb-4 p-3 border border-gray-300 rounded-lg bg-blue-50">
            <div className="text-sm mb-3 bg-blue-100 px-3 py-1 rounded-md border-l-4 border-blue-500">임상</div>
            <div className="text-sm mb-2 bg-blue-200 text-blue-800 px-3 py-2 rounded-md border border-blue-300 shadow-sm flex justify-between items-center">
              <span className="font-medium">👤 본인</span>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={() => {
                  // 보러가기 기능 구현
                  console.log('본인 임상 데이터 보러가기');
                }}
              >
                보러가기
              </Button>
            </div>
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  className={`w-8 h-8 border border-black rounded text-xs flex items-center justify-center cursor-pointer ${
                    i < progressValues.personal ? 'bg-black text-white' : 'bg-white'
                  }`}
                  onClick={() => handleProgressClick('personal', i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="text-sm mb-2 bg-blue-200 text-blue-800 px-3 py-2 rounded-md border border-blue-300 shadow-sm flex justify-between items-center">
              <span className="font-medium">👥 고객</span>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={() => {
                  // 고객 데이터 보러가기 기능 구현
                  console.log('고객 임상 데이터 보러가기');
                }}
              >
                보러가기
              </Button>
            </div>
            
            {/* 고객 그룹 - 5명씩 2줄 */}
            <div className="space-y-2 mb-3">
              {/* 첫 번째 줄: 고객 1-5 */}
              <div className="flex gap-1 justify-between">
                {Array.from({ length: 5 }, (_, customerIndex) => (
                  <div key={customerIndex} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{customerIndex + 1}</span>
                    <div className="flex gap-0.5 border border-gray-300 rounded p-1">
                      {Array.from({ length: 3 }, (_, progressIndex) => (
                        <button
                          key={progressIndex}
                          className={`w-4 h-4 border border-black rounded text-xs flex items-center justify-center cursor-pointer ${
                            customerProgress[`customer-${customerIndex}`]?.includes(progressIndex) 
                              ? 'bg-black text-white' : 'bg-white'
                          }`}
                          onClick={() => handleCustomerProgressClick(customerIndex, progressIndex)}
                        >
                          {progressIndex + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 두 번째 줄: 고객 6-10 */}
              <div className="flex gap-1 justify-between">
                {Array.from({ length: 5 }, (_, customerIndex) => {
                  const actualCustomerIndex = customerIndex + 5;
                  return (
                    <div key={actualCustomerIndex} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{actualCustomerIndex + 1}</span>
                      <div className="flex gap-0.5 border border-gray-300 rounded p-1">
                        {Array.from({ length: 3 }, (_, progressIndex) => (
                          <button
                            key={progressIndex}
                            className={`w-4 h-4 border border-black rounded text-xs flex items-center justify-center cursor-pointer ${
                              customerProgress[`customer-${actualCustomerIndex}`]?.includes(progressIndex) 
                                ? 'bg-black text-white' : 'bg-white'
                            }`}
                            onClick={() => handleCustomerProgressClick(actualCustomerIndex, progressIndex)}
                          >
                            {progressIndex + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 학습 진도 */}
          <div className="mb-4 p-3 border border-gray-300 rounded-lg bg-green-50">
            <div className="text-sm mb-3 bg-green-100 px-3 py-1 rounded-md border-l-4 border-green-500 flex justify-between items-center">
              <span>학습 진도</span>
              <div className="flex items-center gap-2">
                <Progress value={totalLearningProgress.percentage} className="h-1 w-16" />
                <span className="text-xs whitespace-nowrap">
                  {totalLearningProgress.currentTotal}/{totalLearningProgress.maxTotal}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {Object.entries(learningMaxProgress).map(([subject, maxProgress]) => (
                <div key={subject} className="flex-1">
                  {/* 강의 제목 라벨 */}
                  <div className="text-xs text-gray-700 mb-1 text-center">
                    {subject}
                  </div>
                  
                  {/* 진행률바 */}
                  <div 
                    className="h-8 border border-gray-300 rounded cursor-pointer relative overflow-hidden bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                    onClick={(e) => handleLearningProgressClick(subject, e)}
                  >
                    {/* 진행률 배경 */}
                    <div 
                      className="absolute inset-0 bg-green-500 transition-all duration-300 ease-out"
                      style={{ 
                        width: `${(learningProgress[subject] / maxProgress) * 100}%`,
                      }}
                    />
                    
                    {/* 진행률 텍스트 */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <span className="text-xs font-medium text-gray-800">
                        {learningProgress[subject]}/{maxProgress}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 평가 */}
          <div className="mb-4 p-3 border border-gray-300 rounded-lg bg-yellow-50">
            <div className="text-sm mb-3 bg-yellow-100 px-3 py-1 rounded-md border-l-4 border-yellow-500 flex justify-between items-center">
              <span>평가</span>
              <div className="flex items-center gap-2">
                <span className="text-xs whitespace-nowrap">
                  평균: {averageScore}점
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {Object.entries(evaluationScores).map(([evalType, score]) => (
                <div key={evalType} className="flex-1">
                  {/* 평가 제목 라벨 */}
                  <div className="text-xs text-gray-700 mb-1 text-center">
                    {evalType}
                  </div>
                  
                  {/* 점수 입력 블록 */}
                  <div className="h-8 border border-gray-300 rounded bg-gray-100 flex items-center justify-center px-2">
                    <Input 
                      type="number"
                      min="0"
                      max="100"
                      className="text-xs h-6 w-full text-center border-0 bg-transparent p-0"
                      value={score > 0 ? score : ''}
                      placeholder="점수"
                      onChange={(e) => handleScoreChange(evalType, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>


        </CustomerSection>
        
        {/* 본사 표준 프로토콜 체크박스 */}
        <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-2">
            <Checkbox 
              id={`standard-protocol-${cardNumber}`}
              checked={achievements['standard-protocol']}
              onCheckedChange={(checked) => handleAchievementChange('standard-protocol', !!checked)}
              className="w-4 h-4"
            />
            <label htmlFor={`standard-protocol-${cardNumber}`} className="text-sm text-gray-700">
              본사 표준 프로토콜을 잘 따르는가?
            </label>
            <div className="flex gap-1 ml-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-yellow-500">⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* Block 3: Section 4 (전문가 과정) */}
      <div className="relative mb-6 p-4 rounded-xl bg-violet-50 border border-violet-200 overflow-hidden">
        {/* 배경 별 이모지 */}
        <div className="absolute top-4 right-4 text-3xl opacity-10 pointer-events-none select-none flex gap-1">
          <span>⭐</span>
          <span>⭐</span>
          <span>⭐</span>
        </div>
        
        <CustomerSection 
          number="4" 
          title="전문가과정"
          sectionId="expert"
          memo={sectionMemos['expert'] || ''}
          isMemoOpen={openMemoSections['expert'] || false}
          onMemoToggle={() => handleMemoToggle('expert')}
          onMemoChange={(value) => handleMemoChange('expert', value)}
          getMemoBackgroundColor={getMemoBackgroundColor}
        >
          <div className="flex gap-2">
            {['매출업', '상담법', '마케팅'].map((item) => (
              <Button 
                key={item}
                variant={activeButtons[`expert-${item}`] === item ? 'default' : 'outline'}
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => handleButtonClick(`expert-${item}`, item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </CustomerSection>
        
        {/* 본사 전문가 과정 체크박스 */}
        <div className="mt-4 p-3 bg-violet-50 rounded-lg border border-violet-200">
          <div className="flex items-center gap-2">
            <Checkbox 
              id={`expert-course-${cardNumber}`}
              checked={achievements['expert-course']}
              onCheckedChange={(checked) => handleAchievementChange('expert-course', !!checked)}
              className="w-4 h-4"
            />
            <label htmlFor={`expert-course-${cardNumber}`} className="text-sm text-gray-700">
              본사 전문가 과정을 모두 이수하였는가?
            </label>
            <div className="flex gap-1 ml-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-yellow-500">⭐</span>
              <span className="text-yellow-500">⭐</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CustomerSectionProps {
  number: string;
  title?: string;
  sectionId: string;
  memo: string;
  isMemoOpen: boolean;
  onMemoToggle: () => void;
  onMemoChange: (value: string) => void;
  getMemoBackgroundColor: (sectionId: string) => string;
  children: React.ReactNode;
}

function CustomerSection({ 
  number, 
  title, 
  sectionId, 
  memo, 
  isMemoOpen, 
  onMemoToggle, 
  onMemoChange, 
  getMemoBackgroundColor,
  children 
}: CustomerSectionProps) {
  return (
    <div className="border border-gray-300 rounded-lg mb-4 overflow-hidden relative z-10">
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-medium">
            {number}
          </div>
          {title && <div className="font-medium">{title}</div>}
        </div>
        
        {/* 메모 버튼 */}
        <button
          onClick={onMemoToggle}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
            memo.trim() ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title={isMemoOpen ? '메모 닫기' : '메모 열기'}
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
            />
          </svg>
        </button>
      </div>
      
      {/* 메모 입력 영역 */}
      {isMemoOpen && (
        <div className={`${getMemoBackgroundColor(sectionId)} border-b border-gray-300 p-3 animate-in slide-in-from-top-2 duration-200`}>
          <textarea
            value={memo}
            onChange={(e) => onMemoChange(e.target.value)}
            placeholder="이 섹션에 대한 메모를 입력하세요..."
            className="w-full h-20 p-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {memo.length}자
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onMemoChange('')}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                지우기
              </button>
              <button
                onClick={onMemoToggle}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}