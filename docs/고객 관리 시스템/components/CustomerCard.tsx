import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';

interface CustomerData {
  name: string;
  number: string;
  region: string;
  assignee: string;
  manager: string;
}

interface CustomerCardProps {
  customer: CustomerData;
  cardNumber: number;
}

interface ButtonPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function CustomerCard({ customer, cardNumber }: CustomerCardProps) {
  const [activeButtons, setActiveButtons] = useState<Record<string, string>>({});
  const [progressValues, setProgressValues] = useState<Record<string, number>>({
    personal: 5,
  });
  const [customerProgress, setCustomerProgress] = useState<Record<string, number[]>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [buttonPositions, setButtonPositions] = useState<Record<string, ButtonPosition>>({});
  const [positionsNeedUpdate, setPositionsNeedUpdate] = useState(false);
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

  // 버튼 ref 저장소
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const cardRef = useRef<HTMLDivElement>(null);

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
      'inflow': 'bg-blue-50',
      'contract': 'bg-emerald-50',
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

  // 연결 가능한 버튼들의 순서 정의
  const connectionFlow = [
    ['inflow-cafe', 'inflow-insta', 'inflow-intro', 'inflow-seminar', 'inflow-visit'],
    ['contract-buy', 'contract-deposit', 'contract-reject'],
    ['delivery-ship', 'delivery-install', 'delivery-retarget']
  ];

  // 연결선 경로 계산
  const connectionPaths = useMemo(() => {
    const paths: Array<{ from: ButtonPosition; to: ButtonPosition }> = [];
    
    // 유입 -> 계약/결제 -> 설치/교육 순서로 연결
    for (let i = 0; i < connectionFlow.length - 1; i++) {
      const currentGroup = connectionFlow[i];
      const nextGroup = connectionFlow[i + 1];
      
      // 현재 그룹에서 선택된 버튼 찾기
      const activeCurrentButton = currentGroup.find(buttonKey => activeButtons[buttonKey]);
      // 다음 그룹에서 선택된 버튼 찾기
      const activeNextButton = nextGroup.find(buttonKey => activeButtons[buttonKey]);
      
      if (activeCurrentButton && activeNextButton) {
        const fromPos = buttonPositions[activeCurrentButton];
        const toPos = buttonPositions[activeNextButton];
        
        if (fromPos && toPos) {
          paths.push({ from: fromPos, to: toPos });
        }
      }
    }
    
    return paths;
  }, [activeButtons, buttonPositions]);

  // 버튼 위치 업데이트 함수
  const updateAllButtonPositions = useCallback(() => {
    if (!cardRef.current) return;
    
    const cardRect = cardRef.current.getBoundingClientRect();
    const newPositions: Record<string, ButtonPosition> = {};
    
    Object.entries(buttonRefs.current).forEach(([key, element]) => {
      if (element) {
        const buttonRect = element.getBoundingClientRect();
        newPositions[key] = {
          x: buttonRect.left - cardRect.left + buttonRect.width / 2,
          y: buttonRect.top - cardRect.top + buttonRect.height / 2,
          width: buttonRect.width,
          height: buttonRect.height
        };
      }
    });
    
    setButtonPositions(newPositions);
  }, []);

  // 위치 업데이트가 필요할 때 실행
  useEffect(() => {
    if (positionsNeedUpdate) {
      const timer = setTimeout(() => {
        updateAllButtonPositions();
        setPositionsNeedUpdate(false);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [positionsNeedUpdate, updateAllButtonPositions]);

  // 초기 로드 및 리사이즈 이벤트 처리
  useEffect(() => {
    const handleResize = () => {
      setPositionsNeedUpdate(true);
    };

    // 초기 위치 계산
    const timer = setTimeout(() => {
      updateAllButtonPositions();
    }, 100);

    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateAllButtonPositions]);

  // activeButtons 변경 시 위치 업데이트
  useEffect(() => {
    setPositionsNeedUpdate(true);
  }, [activeButtons]);

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

  // 버튼 ref 설정 헬퍼 함수 (무한 루프 방지)
  const setButtonRef = useCallback((buttonKey: string) => (element: HTMLButtonElement | null) => {
    if (buttonRefs.current[buttonKey] !== element) {
      buttonRefs.current[buttonKey] = element;
      // 위치 업데이트 플래그만 설정
      setPositionsNeedUpdate(true);
    }
  }, []);

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

  return (
    <div ref={cardRef} className="bg-white border-2 border-black rounded-xl p-4 mb-5 max-w-md mx-auto relative">
      {/* Connection Lines SVG */}
      {connectionPaths.length > 0 && (
        <svg 
          className="absolute inset-0 pointer-events-none z-40" 
          width="100%" 
          height="100%"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <marker
              id={`arrowhead-${cardNumber}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon 
                points="0 0, 10 3.5, 0 7" 
                fill="#3b82f6" 
              />
            </marker>
          </defs>
          {connectionPaths.map((path, index) => (
            <line
              key={index}
              x1={path.from.x}
              y1={path.from.y}
              x2={path.to.x}
              y2={path.to.y}
              stroke="#3b82f6"
              strokeWidth="2"
              markerEnd={`url(#arrowhead-${cardNumber})`}
              className="drop-shadow-sm"
            />
          ))}
        </svg>
      )}
      
      {/* Header Section */}
      <div className="mb-4 p-3 border border-gray-300 rounded-lg bg-gray-50 relative z-10">
        <div className="mb-3">
          {/* 카드 번호와 고객 이름, 담당자/배정자 정보를 같은 행에 배치 */}
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
                <span>배정자 : </span>
                <span>{formData['assignee'] || customer.assignee}</span>
              </div>
            </div>
          </div>
          {/* 배정자 밑 구분선 */}
          <div className="border-t border-gray-300 mt-3 mb-3"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs min-w-[40px]">샵명:</label>
            <Input 
              className="text-xs h-7 flex-1"
              value={formData['name'] || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs min-w-[30px]">번호:</label>
            <Input 
              className="text-xs h-7 flex-1"
              value={formData['number'] || customer.number}
              onChange={(e) => handleInputChange('number', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs min-w-[30px]">지역:</label>
            <Input 
              className="text-xs h-7 flex-1"
              value={formData['region'] || customer.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs min-w-[70px]">플레이스 주소:</label>
            <Input 
              className="text-xs h-7 flex-1"
              value={formData['place-address'] || ''}
              onChange={(e) => handleInputChange('place-address', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Block 1: Sections 1-4 (기본 과정) */}
      <div className="relative mb-6 p-4 rounded-xl bg-slate-100 border border-slate-300 overflow-hidden">
        {/* 배경 별 이모지 */}
        <div className="absolute top-4 right-4 text-6xl opacity-10 pointer-events-none select-none">
          ⭐
        </div>
        
        {/* Section 1: 유입 */}
        <CustomerSection 
          number="1" 
          title="유입"
          sectionId="inflow"
          memo={sectionMemos['inflow'] || ''}
          isMemoOpen={openMemoSections['inflow'] || false}
          onMemoToggle={() => handleMemoToggle('inflow')}
          onMemoChange={(value) => handleMemoChange('inflow', value)}
          getMemoBackgroundColor={getMemoBackgroundColor}
        >
          <div className="flex gap-2 mb-2">
            <Button 
              ref={setButtonRef('inflow-cafe')}
              variant={activeButtons['inflow-cafe'] === 'cafe' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs h-8 relative z-10"
              onClick={() => handleButtonClick('inflow-cafe', 'cafe')}
            >
              카페
            </Button>
            <Button 
              ref={setButtonRef('inflow-insta')}
              variant={activeButtons['inflow-insta'] === 'insta' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs h-8 relative z-10"
              onClick={() => handleButtonClick('inflow-insta', 'insta')}
            >
              인스타
            </Button>
            <Button 
              ref={setButtonRef('inflow-intro')}
              variant={activeButtons['inflow-intro'] === 'intro' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs h-8 relative z-10"
              onClick={() => handleButtonClick('inflow-intro', 'intro')}
            >
              소개
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-2">
              <Button 
                ref={setButtonRef('inflow-seminar')}
                variant={activeButtons['inflow-seminar'] === 'seminar' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-16 w-16 relative z-10"
                onClick={() => handleButtonClick('inflow-seminar', 'seminar')}
              >
                세미나
              </Button>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs">날짜:</span>
                  <Input 
                    className="text-xs h-7 w-20"
                    value={formData['seminar-date'] || ''}
                    onChange={(e) => handleInputChange('seminar-date', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs">횟수:</span>
                  <Input 
                    className="text-xs h-7 w-16"
                    value={formData['seminar-count'] || ''}
                    onChange={(e) => handleInputChange('seminar-count', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                ref={setButtonRef('inflow-visit')}
                variant={activeButtons['inflow-visit'] === 'visit' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-16 w-16 relative z-10"
                onClick={() => handleButtonClick('inflow-visit', 'visit')}
              >
                방문
              </Button>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs">날짜:</span>
                  <Input 
                    className="text-xs h-7 w-20"
                    value={formData['visit-date'] || ''}
                    onChange={(e) => handleInputChange('visit-date', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs">횟수:</span>
                  <Input 
                    className="text-xs h-7 w-16"
                    value={formData['visit-count'] || ''}
                    onChange={(e) => handleInputChange('visit-count', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CustomerSection>

        {/* Section 2: 계약/결제 */}
        <CustomerSection 
          number="2" 
          title="계약/결제"
          sectionId="contract"
          memo={sectionMemos['contract'] || ''}
          isMemoOpen={openMemoSections['contract'] || false}
          onMemoToggle={() => handleMemoToggle('contract')}
          onMemoChange={(value) => handleMemoChange('contract', value)}
          getMemoBackgroundColor={getMemoBackgroundColor}
        >
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <Button 
                ref={setButtonRef('contract-buy')}
                variant={activeButtons['contract-buy'] === 'buy' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8 relative z-10"
                onClick={() => handleButtonClick('contract-buy', 'buy')}
              >
                구매
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-xs">날짜:</span>
                <Input 
                  className="text-xs h-7 w-16"
                  value={formData['buy-date'] || ''}
                  onChange={(e) => handleInputChange('buy-date', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">금액:</span>
                <Input 
                  className="text-xs h-7 w-16"
                  value={formData['buy-amount'] || ''}
                  onChange={(e) => handleInputChange('buy-amount', e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Button 
                ref={setButtonRef('contract-deposit')}
                variant={activeButtons['contract-deposit'] === 'deposit' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8 relative z-10"
                onClick={() => handleButtonClick('contract-deposit', 'deposit')}
              >
                계약금
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-xs">날짜:</span>
                <Input 
                  className="text-xs h-7 w-16"
                  value={formData['deposit-date'] || ''}
                  onChange={(e) => handleInputChange('deposit-date', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">금액:</span>
                <Input 
                  className="text-xs h-7 w-16"
                  value={formData['deposit-amount'] || ''}
                  onChange={(e) => handleInputChange('deposit-amount', e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Button 
                ref={setButtonRef('contract-reject')}
                variant={activeButtons['contract-reject'] === 'reject' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8 relative z-10"
                onClick={() => handleButtonClick('contract-reject', 'reject')}
              >
                거절
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-xs">날짜:</span>
                <Input 
                  className="text-xs h-7 w-16"
                  value={formData['reject-date'] || ''}
                  onChange={(e) => handleInputChange('reject-date', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">사유:</span>
                <Input 
                  className="text-xs h-7 w-16"
                  value={formData['reject-reason'] || ''}
                  onChange={(e) => handleInputChange('reject-reason', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1 justify-end">
                <Checkbox 
                  id="reject-ad"
                  checked={checkboxes['reject-ad'] || false}
                  onCheckedChange={(checked) => handleCheckboxChange('reject-ad', !!checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="reject-ad" className="text-xs">광고추가</label>
              </div>
            </div>
          </div>
        </CustomerSection>

        {/* Section 3: 설치/교육 */}
        <CustomerSection 
          number="3" 
          title="설치/교육"
          sectionId="delivery"
          memo={sectionMemos['delivery'] || ''}
          isMemoOpen={openMemoSections['delivery'] || false}
          onMemoToggle={() => handleMemoToggle('delivery')}
          onMemoChange={(value) => handleMemoChange('delivery', value)}
          getMemoBackgroundColor={getMemoBackgroundColor}
        >
          <div className="grid grid-cols-3 gap-2">
            {/* 출고 컬럼 */}
            <div className="flex flex-col h-28">
              <Button 
                ref={setButtonRef('delivery-ship')}
                variant={activeButtons['delivery-ship'] === 'ship' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8 mb-2 relative z-10"
                onClick={() => handleButtonClick('delivery-ship', 'ship')}
              >
                출고
              </Button>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs min-w-[42px]">날짜:</span>
                <Input 
                  className="text-xs h-7 flex-1"
                  value={formData['ship-date'] || ''}
                  onChange={(e) => handleInputChange('ship-date', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs min-w-[42px]">패키지:</span>
                <Input 
                  className="text-xs h-7 flex-1"
                  value={formData['package'] || ''}
                  onChange={(e) => handleInputChange('package', e.target.value)}
                />
              </div>
            </div>
            
            {/* 설치/교육 컬럼 */}
            <div className="flex flex-col h-28">
              <Button 
                ref={setButtonRef('delivery-install')}
                variant={activeButtons['delivery-install'] === 'install' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-16 mb-2 relative z-10"
                onClick={() => handleButtonClick('delivery-install', 'install')}
              >
                설치/교육
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-xs min-w-[42px]">날짜:</span>
                <Input 
                  className="text-xs h-7 flex-1"
                  value={formData['install-date'] || ''}
                  onChange={(e) => handleInputChange('install-date', e.target.value)}
                />
              </div>
            </div>
            
            {/* 리타겟 컬럼 */}
            <div className="flex flex-col h-28">
              <Button 
                ref={setButtonRef('delivery-retarget')}
                variant={activeButtons['delivery-retarget'] === 'retarget' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-28 relative z-10"
                onClick={() => handleButtonClick('delivery-retarget', 'retarget')}
              >
                리타겟
              </Button>
            </div>
          </div>
        </CustomerSection>

        {/* Section 4: 교육 완료 후 특이사항 */}
        <CustomerSection 
          number="4" 
          title="교육 완료한 뒤 특이사항"
          sectionId="education-notes"
          memo={sectionMemos['education-notes'] || ''}
          isMemoOpen={openMemoSections['education-notes'] || false}
          onMemoToggle={() => handleMemoToggle('education-notes')}
          onMemoChange={(value) => handleMemoChange('education-notes', value)}
          getMemoBackgroundColor={getMemoBackgroundColor}
        >
          <div className="border border-gray-400 rounded-md p-3 mb-3 text-xs">
            {/* 질문 1: 설명 이해도 */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-left">1. 설명을 잘 이해하는가?</span>
              <div className="flex gap-1">
                {['상', '중', '하'].map((level) => (
                  <Button
                    key={`understanding-${level}`}
                    variant={activeButtons['understanding'] === level ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 w-8"
                    onClick={() => handleButtonClick('understanding', level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 질문 2: 샵 깔끔함 */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-left">2. 샵은 깔끔한가?</span>
              <div className="flex gap-1">
                {['상', '중', '하'].map((level) => (
                  <Button
                    key={`cleanliness-${level}`}
                    variant={activeButtons['cleanliness'] === level ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 w-8"
                    onClick={() => handleButtonClick('cleanliness', level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 질문 3: 플레이스 세팅 */}
            <div className="flex justify-between items-center">
              <span className="text-left">3. 플레이스 세팅은 되어있는가?</span>
              <div className="flex gap-1">
                {['상', '중', '하'].map((level) => (
                  <Button
                    key={`setting-${level}`}
                    variant={activeButtons['setting'] === level ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 w-8"
                    onClick={() => handleButtonClick('setting', level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {['ENFP', 'ENTP', 'ISTJ', 'INFP'].map((type) => (
              <Button 
                key={type}
                variant={activeButtons['personality'] === type ? 'default' : 'outline'}
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => handleButtonClick('personality', type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </CustomerSection>
        
        {/* 본사 실무교육 이수 체크박스 */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <Checkbox 
              id={`basic-training-${cardNumber}`}
              checked={achievements['basic-training']}
              onCheckedChange={(checked) => handleAchievementChange('basic-training', !!checked)}
              className="w-4 h-4"
            />
            <label htmlFor={`basic-training-${cardNumber}`} className="text-sm text-gray-700">
              본사 실무교육 이수
            </label>
            <span className="text-yellow-500 ml-1">⭐</span>
          </div>
        </div>
      </div>

      {/* Block 2: Section 5 (성장 과정) */}
      <div className="relative mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 overflow-hidden">
        {/* 배경 별 이모지 */}
        <div className="absolute top-4 right-4 text-4xl opacity-10 pointer-events-none select-none flex gap-2">
          <span>⭐</span>
          <span>⭐</span>
        </div>
        
        <CustomerSection 
          number="5" 
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

          {/* 매출 */}
          <div className="mb-4 p-3 border border-gray-300 rounded-lg bg-purple-50">
            <div className="text-sm mb-3 bg-purple-100 px-3 py-1 rounded-md border-l-4 border-purple-500">매출</div>
            
            {/* 영역 그래프 */}
            <div className="border border-gray-400 rounded-md p-3 h-24 mb-3 bg-white relative">
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <linearGradient id={`areaGradient-${cardNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                
                {/* 영역 그래프 */}
                <path
                  d={generateAreaPath(salesData, 280, 60)} // 약간의 패딩을 고려한 크기
                  fill={`url(#areaGradient-${cardNumber})`}
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
                
                {/* 데이터 포인트 */}
                {salesData.map((value, index) => {
                  const x = (index * 280) / (salesData.length - 1);
                  const y = 60 - (value / salesAnalysis.maxValue) * 60;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="2"
                      fill="#8b5cf6"
                      className="hover:r-3 transition-all duration-200"
                    />
                  );
                })}
              </svg>
            </div>
            
            {/* 월별 레이블 */}
            <div className="flex justify-between text-xs text-gray-500 mb-3 px-1">
              {['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'].map((month, index) => (
                <span key={month} className={index % 2 === 0 ? '' : 'opacity-50'}>
                  {index % 2 === 0 ? month : ''}
                </span>
              ))}
            </div>
            
            {/* 매출 통계 카드들 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 평균 매출 카드 */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">📊</span>
                  <span className="text-xs opacity-90">평균 매출</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{salesAnalysis.average}만원</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">💰</span>
                  </div>
                </div>
              </div>

              {/* 전월 매출 카드 */}
              <div className={`rounded-lg p-3 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                salesAnalysis.isMonthlyPositive 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-red-500 to-red-600'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">{salesAnalysis.isMonthlyPositive ? '📈' : '📉'}</span>
                  <span className="text-xs opacity-90">전월 매출</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{salesAnalysis.lastMonth}만원</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">
                      {salesAnalysis.monthlyChangePercent > 0 ? '+' : ''}{salesAnalysis.monthlyChangePercent}%
                    </span>
                  </div>
                </div>
              </div>
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

      {/* Block 3: Section 6 (전문가 과정) */}
      <div className="relative mb-6 p-4 rounded-xl bg-violet-50 border border-violet-200 overflow-hidden">
        {/* 배경 별 이모지 */}
        <div className="absolute top-4 right-4 text-3xl opacity-10 pointer-events-none select-none flex gap-1">
          <span>⭐</span>
          <span>⭐</span>
          <span>⭐</span>
        </div>
        
        <CustomerSection 
          number="6" 
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