// 저장 상태 관리 유틸
export const createSaveStatusUtils = (
  setSaveStatus: React.Dispatch<React.SetStateAction<{ [caseId: string]: 'idle' | 'saving' | 'saved' | 'error' }>>
) => {
  const markSaving = (caseId: string) => setSaveStatus(prev => ({ ...prev, [caseId]: 'saving' }));
  
  const markSaved = (caseId: string) => {
    setSaveStatus(prev => ({ ...prev, [caseId]: 'saved' }));
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, [caseId]: 'idle' }));
    }, 2000);
  };
  
  const markError = (caseId: string) => setSaveStatus(prev => ({ ...prev, [caseId]: 'error' }));

  return { markSaving, markSaved, markError };
};

// Promise Queue 유틸 (일반 객체 사용)
export const createEnqueueUtil = () => {
  const updateQueue: { current: Record<string, Promise<void>> } = { current: {} };
  
  const enqueue = (caseId: string, task: () => Promise<void>) => {
    updateQueue.current[caseId] = (updateQueue.current[caseId] ?? Promise.resolve())
      .then(task)
      .catch(err => { console.error('enqueue error', err); });
    return updateQueue.current[caseId];
  };

  return { updateQueue, enqueue };
};

// Debounce 유틸
export const createDebounceUtil = (
  inputDebounceTimers: { [key: string]: NodeJS.Timeout },
  setInputDebounceTimers: React.Dispatch<React.SetStateAction<{ [key: string]: NodeJS.Timeout }>>
) => {
  const debouncedUpdate = (key: string, updateFn: () => void, delay: number = 500) => {
    // 기존 타이머 클리어
    if (inputDebounceTimers[key]) {
      clearTimeout(inputDebounceTimers[key]);
    }
    
    // 새 타이머 설정
    const newTimer = setTimeout(() => {
      updateFn();
      // 타이머 정리
      setInputDebounceTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[key];
        return newTimers;
      });
    }, delay);
    
    setInputDebounceTimers(prev => ({ ...prev, [key]: newTimer }));
  };

  return { debouncedUpdate };
}; 